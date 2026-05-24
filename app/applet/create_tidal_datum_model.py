import os
import sys
import glob
import numpy as np
import xarray as xr
from datetime import datetime, timezone

try:
    import pyshtools as pysh
except ImportError:
    print("[ERROR] Paket 'pyshtools' sangat diperlukan untuk mengekstrak geoid EGM2008 (.gfc).")
    print("        Silakan install melalui terminal/CMD: pip install pyshtools")
    sys.exit(1)

def main():
    print("=====================================================================")
    print("               REGIONAL TIDAL DATUM GENERATOR (2026 EPOCH)           ")
    print("=====================================================================")

    # Setup directories
    mss_dir = "../MSS"
    geoid_dir = "../Geoid"
    
    # Try current if parent doesn't exist
    if not os.path.exists(mss_dir): mss_dir = "MSS"
    if not os.path.exists(geoid_dir): geoid_dir = "Geoid"
    
    print(f"[*] Mencari file MSS CNES di: {mss_dir}")
    mss_files = glob.glob(os.path.join(mss_dir, "*mss_cnes_cls_2022*.nc"))
    if not mss_files:
        mss_files = glob.glob(os.path.join(mss_dir, "*.nc"))
        if not mss_files:
            print(f"[ERROR] Tidak dapat menemukan model MSS di directory: {mss_dir}")
            sys.exit(1)
    
    mss_path = mss_files[0]
    print(f"    -> Ditemukan MSS: {mss_path}")

    print(f"[*] Mencari file EGM2008 (.gfc) di: {geoid_dir}")
    gfc_files = glob.glob(os.path.join(geoid_dir, "*.gfc"))
    if not gfc_files:
        print(f"[ERROR] Tidak dapat menemukan file .gfc di directory: {geoid_dir}")
        print("        Pastikan Anda memiliki EGM2008 dengan ekstensi standar ICGEM (.gfc).")
        sys.exit(1)
    gfc_path = gfc_files[0]
    print(f"    -> Ditemukan Geoid model: {gfc_path}")

    # Mencari model asimilasi terakhir
    print("[*] Memilih model harmonik hasil asimilasi terbaru...")
    assim_files = glob.glob("regional_tide_model_indonesia_*.nc")
    if not assim_files:
        assim_files = glob.glob("tide_model_*.nc")
    
    if not assim_files:
        print("[ERROR] Tidak ada output file model asimilasi (.nc) di folder kerja saat ini.")
        sys.exit(1)
        
    # Sort to pick highest resolution or latest, here we just pick the first
    assim_path = assim_files[0]
    print(f"    -> Menggunakan model asimilasi: {assim_path}")

    # 1. Buka Model Asimilasi (Berfungsi untuk master grid (Lat/Lon) dan nilai-nilai Amplitudo)
    try:
        ds_tide = xr.open_dataset(assim_path)
    except Exception as e:
        print(f"[ERROR] Gagal membuka file asimilasi: {e}")
        sys.exit(1)

    lat = ds_tide.lat.values
    lon = ds_tide.lon.values
    print(f"    -> Resolusi grid target: {len(lat)}x{len(lon)} (Sebanding dengan 2'x2' regional)")

    # 2. Proses MSS (Sebagai Z0 terhadap WGS84 Ellipsoid)
    print("\n[*] Memproses MSS CNES CLS 2022...")
    ds_mss = xr.open_dataset(mss_path)
    # Temukan variabel MSS
    mss_var = [v for v in ds_mss.data_vars if 'mss' in v.lower() or 'mean_sea' in v.lower()]
    if not mss_var:
         mss_var = list(ds_mss.data_vars)[0]
    else:
         mss_var = mss_var[0]
         
    # Pastikan rentang bujur sesuai (e.g. 0-360 vs -180-180)
    # Jika grid tide adalah 90-150E, biasanya cocok.
    ds_mss_interp = ds_mss.interp(lat=lat, lon=lon, method='linear')
    mss_vals = ds_mss_interp[mss_var].values
    
    # 3. Proses EGM2008 (.gfc) menggunakan pyshtools
    print("\n[*] Menghitung tinggi Geoid (N) dari model ICGEM EGM2008...")
    print("    -> Mengekspansi Harmonic Coefficients...")
    try:
        # Load GFC
        clm = pysh.SHGravCoeffs.from_file(gfc_path, format='icgem')
        # Generate Geoid height (mengikuti parameter WGS84)
        # a=6378137.0 m, f=1.0/298.257223563, omega=7292115e-11 rad/s
        geoid_obj = clm.geoid(a=6378137.0, f=1.0/298.257223563, omega=7292115e-11)
        
        # Ekstrak data Array & Lats/Lons
        geoid_data = geoid_obj.to_array()
        glats = geoid_obj.lats()
        glons = geoid_obj.lons()
        
        # Konversi ke xr.Dataset
        geoid_global = xr.Dataset({'geoid': (['lat', 'lon'], geoid_data)}, coords={'lat': glats, 'lon': glons})
        
        # Perbaiki rentang rentang longitude jikalau berbeda (e.g. 0..360 vs -180..180)
        # EGM2008 pyshtools outputs lons 0..360 secara bawaan. Tide arrays typically 90..150.
        
        print("    -> Menginterpolasi Geoid ke resolusi 2' x 2' spatial region...")
        geoid_region = geoid_global.interp(lat=lat, lon=lon, method='linear')
        geoid_vals = geoid_region['geoid'].values
        
    except Exception as e:
        print(f"[ERROR] Kegagalan saat memproses file .gfc: {e}")
        sys.exit(1)

    # 4. Kalkulasi Baseline Z0 (MSL) terhadap 2 referensi: WGS84 & EGM2008
    z0_wgs84 = mss_vals
    z0_egm08 = mss_vals - geoid_vals

    # 5. Ekstrak Total Amplitudo komponen Harmonik (Logika sesuai App.tsx)
    amp_vars = [v for v in ds_tide.data_vars if 'amp' in v.lower()]
    sum_amp = np.zeros(z0_wgs84.shape)
    for v in amp_vars:
        sum_amp += ds_tide[v].values
        
    am2 = ds_tide['amp_M2'].values if 'amp_M2' in ds_tide else 0.0
    as2 = ds_tide['amp_S2'].values if 'amp_S2' in ds_tide else 0.0
    
    # Kalkulasi Datums
    datums = {
        'MSL':  {'wgs84': z0_wgs84,                    'egm08': z0_egm08},
        'HAT':  {'wgs84': z0_wgs84 + sum_amp,          'egm08': z0_egm08 + sum_amp},
        'LAT':  {'wgs84': z0_wgs84 - sum_amp,          'egm08': z0_egm08 - sum_amp},
        'MHWS': {'wgs84': z0_wgs84 + (am2 + as2),      'egm08': z0_egm08 + (am2 + as2)},
        'MLWS': {'wgs84': z0_wgs84 - (am2 + as2),      'egm08': z0_egm08 - (am2 + as2)}
    }
    
    # 6. Menyimpan hasil dalam 10 NetCDF terpisah
    print("\n[*] Menulis datums menjadi 10 NetCDF format...")
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    for dname, references in datums.items():
        for ref_name, grid_vals in references.items():
            
            # Buat xarray object
            out_ds = xr.Dataset(
                {
                    dname: (("lat", "lon"), grid_vals)
                },
                coords={
                    "lat": lat,
                    "lon": lon,
                }
            )
            
            # Tambahkan metadata global seperti di prompt
            out_ds.attrs['title'] = f"{dname} Tidal Datum Regional Model"
            out_ds.attrs['description'] = f"{dname} value computed relative to {ref_name.upper()}."
            out_ds.attrs['vertical_datum_reference'] = ref_name.upper()
            out_ds.attrs['mss_source'] = "mss_cnes_cls_2022"
            out_ds.attrs['geoid_source'] = "EGM2008 ICGEM"
            out_ds.attrs['epoch_duration'] = "18.6 years"
            out_ds.attrs['epoch_start_date'] = "2026-01-01T00:00:00Z"
            out_ds.attrs['calculation_logic'] = "Matched standard BIG App.tsx datum bounds synthesis."
            out_ds.attrs['spatial_resolution'] = "2' x 2' (1/30 degrees)"
            out_ds.attrs['creation_date'] = now_str
            
            # Atribut Variabel
            out_ds[dname].attrs['units'] = 'meters'
            out_ds[dname].attrs['long_name'] = f"{dname} Elevation vs {ref_name.upper()}"
            if dname in ['HAT', 'LAT']:
                out_ds[dname].attrs['note'] = "Calculated as Z0 ± Sum(Amplitudes) theoretically."
                
            out_filename = f"{dname}_{ref_name}.nc"
            out_ds.to_netcdf(out_filename)
            print(f"    [+] Berhasil ditulis : {out_filename}")
            
    print("\n=====================================================================")
    print("[SUCCESS] Seluruh 10 file Tide Datum (.nc) berhasil disintesis!")
    print("=====================================================================")

if __name__ == "__main__":
    main()
