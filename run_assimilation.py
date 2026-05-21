import xarray as xr
import pandas as pd
import numpy as np
from scipy.interpolate import griddata

def load_harmonic_constants(txt_filepath):
    """
    Membaca konstanta harmonik (hasil dari panel Harmonic) dalam format TXT.
    Diasumsikan TXT dipisahkan menggunakan tab (\t) dan berisi metadata pada baris-baris awal.
    """
    print(f"[*] Membaca data observasi harmonik dari {txt_filepath}")
    
    # Skip baris yang diawali dengan '#'
    # Format File: Component    Definition    Frequency(cph)    Amplitude(m)    Phase(deg)
    df = pd.read_csv(txt_filepath, sep='\t', comment='#')
    
    # Asumsikan kita punya informasi lintang & bujur stasiun.
    # Untuk contoh ini, kita set nilai referensi lokasi observasi.
    # Di pipeline riil, lat/lon stasiun harus di-pass ke dalam dataset ini.
    obs_data = {
        'station_lat': -2.5, 
        'station_lon': 118.0,
        'constituents': df
    }
    return obs_data

def read_global_model(nc_filepath):
    """
    Membaca base model dalam format NetCDF (contoh: TPXO, FES, dsb).
    """
    print(f"[*] Membaca global model dari {nc_filepath}")
    # dataset = xr.open_dataset(nc_filepath)
    
    # Untuk keperluan template, kita menghasilkan mock dataset 
    # untuk domain Indonesia (15S - 15N, 90E - 150E) resolusi 1/4 deg.
    lons = np.arange(90, 150.25, 0.25)
    lats = np.arange(-15, 15.25, 0.25)
    
    # Variabel M2 (Amplitude & Phase)
    amp_m2 = np.random.rand(len(lats), len(lons)) * 1.5
    pha_m2 = np.random.rand(len(lats), len(lons)) * 360.0
    
    dataset = xr.Dataset(
        data_vars=dict(
            amp_m2=(["lat", "lon"], amp_m2),
            pha_m2=(["lat", "lon"], pha_m2),
        ),
        coords=dict(
            lon=(["lon"], lons),
            lat=(["lat"], lats),
        )
    )
    return dataset

def data_assimilation_3dvar(model_ds, obs_data):
    """
    Contoh kerangka metode Asimilasi 3D-Var.
    Persamaan Dasar 3D-Var: J(x) = 1/2(x-x_b)^T B^-1 (x-x_b) + 1/2(y-H(x))^T R^-1 (y-H(x))
    Dimana:
      x   = state analysis (grid update)
      x_b = background / base model (model global awal)
      y   = observasi (konstanta harmonik stasiun)
      H   = operator observasi (interpolasi ke titik stasiun)
      B   = matriks kovariansi error background
      R   = matriks kovariansi error observasi
    """
    print("[*] Memulai Data Assimilation (3D-Var) ...")
    
    # Proses M2 sebagai contoh
    xb_amp = model_ds['amp_m2'].values
    xb_pha = model_ds['pha_m2'].values
    
    lat_grid = model_ds['lat'].values
    lon_grid = model_ds['lon'].values
    Lon, Lat = np.meshgrid(lon_grid, lat_grid)
    
    # Ambil nilai amplitudo M2 dari observasi
    df_const = obs_data['constituents']
    m2_obs = df_const.loc[df_const['Component'].str.upper() == 'M2']
    
    if m2_obs.empty:
        print("[!] Komponen M2 tidak ditemukan di observasi!")
        return model_ds
        
    y_amp = m2_obs.iloc[0]['Amplitude(m)']
    
    # 1. H(x_b) - Interpolasi background ke titik obvservasi stasiun
    # (Di template ini diasumsikan nilai H_xb sekitar = xb_amp hasil interpolasi)
    points = np.column_stack((Lat.flatten(), Lon.flatten()))
    values = xb_amp.flatten()
    
    H_xb_amp = griddata(points, values, (obs_data['station_lat'], obs_data['station_lon']), method='linear')
    
    print(f"    - Observasi M2 Amplitudo : {y_amp:.4f} m")
    print(f"    - Background H(x_b)      : {float(H_xb_amp):.4f} m")
    
    # 2. Innovation: d = y - H(x_b)
    innovation = y_amp - H_xb_amp
    print(f"    - Innovation (d)         : {float(innovation):.4f} m")
    
    # 3. Covariance Matrices (Simple representation)
    # Di dunia nyata B dan R sangat kompleks dan direpresentasikan secara spasial (Gaussian correlation function dsb).
    sigma_b = 0.1  # Error varians background asumsi 10cm
    sigma_r = 0.02 # Error varians observasi alat tide gauge asumsi 2cm
    
    # 4. Kalenguatan Analysis Update (Simplified B dan R scalar unvariate)
    # W = B H^T (H B H^T + R)^-1  --> Gain Matrix (Kalman Gain ekuivalen pada optimal interpolation)
    gain = sigma_b / (sigma_b + sigma_r)
    
    # Spread the innovation across the grid weighted by a Gaussian distance decay function
    # untuk mensimulasikan Matriks B spasial.
    radius_of_influence = 2.0 # degrees
    distances = np.sqrt((Lat - obs_data['station_lat'])**2 + (Lon - obs_data['station_lon'])**2)
    spatial_weights = np.exp(-(distances**2) / (2 * radius_of_influence**2))
    
    # x_a = x_b + W * d
    # (Update matriks State Analysis)
    xa_amp = xb_amp + (gain * innovation * spatial_weights)
    
    # Simpan hasil analysis ke dataset (overwrite atau buat variabel baru)
    model_ds['amp_m2'].values = xa_amp
    
    print("[*] Asimilasi 3D-Var berhasil, Model diperbarui spasial menyesuaikan jarak stasiun.")
    return model_ds

def run_pipeline():
    print("=== PIPELINE ASIMILASI PENGATURAN PASUT REGIONAL INA ===")
    
    # 1. Load data
    obs = load_harmonic_constants("dummy_harmonic.txt") # Ubah ini ke path output download
    model = read_global_model("tpxo9_global.nc")        # Ubah ini ke data global
    
    # 2. Assimilation Step
    updated_model = data_assimilation_3dvar(model, obs)
    
    # 3. Export to Assmiliation Result Model
    output_filename = "regional_tide_model_indonesia.nc"
    updated_model.to_netcdf(output_filename)
    print(f"[*] DA Selesai. Hasil disimpan ke {output_filename}")

if __name__ == "__main__":
    # Buat file dummy observation txt jika belum ada
    with open("dummy_harmonic.txt", "w") as f:
        f.write("# Data Selection: Semua Data\n")
        f.write("# Metode Analisis: Least Squares\n")
        f.write("Component\tDefinition\tFrequency(cph)\tAmplitude(m)\tPhase(deg)\n")
        f.write("M2\tPrincipal lunar semidiurnal\t0.08051140\t1.15000\t145.000\n")
        f.write("S2\tPrincipal solar semidiurnal\t0.08333333\t0.42000\t210.000\n")
        
    run_pipeline()
    
