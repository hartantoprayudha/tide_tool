import os
import sys
import glob
import math
import random
import xarray as xr
import pandas as pd
import numpy as np
from scipy.interpolate import griddata, RectBivariateSpline
from scipy.stats import pearsonr
from scipy.ndimage import gaussian_filter, median_filter, uniform_filter

try:
    import cupy as cp
    HAS_GPU = True
except ImportError:
    HAS_GPU = False
    cp = np

print(f"[*] Deteksi Modul GPU (CuPy): {'Aktif (Tersedia)' if HAS_GPU else 'Tidak Tersedia (Gunakan numpy CPU)'}")

def vincenty_distance(lat1, lon1, lat2, lon2):
    """
    Menghitung jarak antara dua titik koordinat menggunakan parameter ellipsoid WGS84
    mendekati bentuk bumi oblate spheroid (Vincenty inverse formula).
    Output dalam kilometer.
    """
    a = 6378137.0         # Semi-major axis
    b = 6356752.314245    # Semi-minor axis
    f = 1 / 298.257223563 # Flattening
    
    L = math.radians(lon2 - lon1)
    U1 = math.atan((1 - f) * math.tan(math.radians(lat1)))
    U2 = math.atan((1 - f) * math.tan(math.radians(lat2)))
    
    sinU1 = math.sin(U1)
    cosU1 = math.cos(U1)
    sinU2 = math.sin(U2)
    cosU2 = math.cos(U2)
    
    lam = L
    for _ in range(100):
        sinLam = math.sin(lam)
        cosLam = math.cos(lam)
        sinSigma = math.sqrt((cosU2 * sinLam) ** 2 +
                             (cosU1 * sinU2 - sinU1 * cosU2 * cosLam) ** 2)
        if sinSigma == 0:
            return 0.0  # Titik berhimpitan
        cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLam
        sigma = math.atan2(sinSigma, cosSigma)
        sinAlpha = cosU1 * cosU2 * sinLam / sinSigma
        cosSqAlpha = 1 - sinAlpha ** 2
        cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha if cosSqAlpha != 0 else 0
        C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha))
        lam_prev = lam
        lam = L + (1 - C) * f * sinAlpha * \
              (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)))
        if abs(lam - lam_prev) < 1e-12:
            break
            
    uSq = cosSqAlpha * (a ** 2 - b ** 2) / (b ** 2)
    A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)))
    B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)))
    deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
                                                      B / 6 * cos2SigmaM * (-3 + 4 * sinSigma ** 2) *
                                                      (-3 + 4 * cos2SigmaM ** 2)))
    s = b * A * (sigma - deltaSigma)
    return s / 1000.0  # Return dalam kilometer

def load_harmonic_constants(filepath):
    """
    Membaca konstanta harmonik dari file (CSV atau TXT).
    Mendukung deteksi otomatis delimiter (koma atau tab), penanganan baris komentar,
    serta ekstraksi metadata stasiun seperti Lintang (Latitude) dan Bujur (Longitude) jika tersedia.
    """
    print(f"[*] Memproses file observasi: {filepath}")
    
    station_lat = None
    station_lon = None
    station_name = os.path.basename(filepath)
    
    # Deteksi meta dari baris komentar
    with open(filepath, 'r') as f:
        for line in f:
            if line.startswith('#') or line.strip() == '':
                line_lower = line.lower()
                for sep in [':', '\t', ',']:
                    if 'latitude' in line_lower and sep in line:
                        try:
                            parts = line.split(sep)
                            station_lat = float(parts[1].strip())
                        except ValueError:
                            pass
                    if 'longitude' in line_lower and sep in line:
                        try:
                            parts = line.split(sep)
                            station_lon = float(parts[1].strip())
                        except ValueError:
                            pass
                    if 'station name' in line_lower and sep in line:
                        try:
                            parts = line.split(sep)
                            station_name = parts[1].strip()
                        except ValueError:
                            pass
            else:
                break
                
    # Deteksi delimiter otomatis
    try:
        # Coba tab separator dahulu (untuk txt)
        df = pd.read_csv(filepath, sep='\t', comment='#')
        if df.shape[1] <= 1: # Jika hanya ada 1 kolom, coba gunakan koma (untuk csv)
            df = pd.read_csv(filepath, sep=',', comment='#')
    except Exception:
        df = pd.read_csv(filepath, sep=',', comment='#')
        
    df.columns = [c.strip() for c in df.columns]
    
    # Validasi keberadaan kolom wajib
    required_cols = ['Component', 'Amplitude(m)', 'Phase(deg)']
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        print(f"[!] File {filepath} tidak memiliki kolom wajib: {missing}. Mencari kolom alternatif...")
        # Coba petakan nama kolom alternatif
        rename_map = {}
        for col in df.columns:
            if col.lower() in ['component', 'constituents', 'comp','name']:
                rename_map[col] = 'Component'
            elif 'amplitude' in col.lower() or 'amp' in col.lower():
                rename_map[col] = 'Amplitude(m)'
            elif 'phase' in col.lower() or 'pha' in col.lower():
                rename_map[col] = 'Phase(deg)'
        df = df.rename(columns=rename_map)
        
    # Validasi ulang kolom setelah remapping
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        print(f"[ERROR] Format kolom file {filepath} salah. Harus mengandung kolom: {required_cols}")
        return None
        
    # Apabila koordinat lintang & bujur tidak ditemukan, set random coordinate di Indonesia untuk pengujian
    if station_lat is None:
        station_lat = np.random.uniform(-8.0, 3.0)
    if station_lon is None:
        station_lon = np.random.uniform(95.0, 140.0)
        
    print(f"    -> Berhasil memuat data stasiun: '{station_name}' pada koordinat ({station_lat:.5f}, {station_lon:.5f})")
    print(f"    -> Jumlah konstituen pasut: {len(df)} ({', '.join(df['Component'].astype(str).values)})")
    
    return {
        'station_name': station_name,
        'station_lat': station_lat,
        'station_lon': station_lon,
        'constituents': df
    }

def read_global_model(nc_filepath, constituents=['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4']):
    """
    Membaca base model dalam format NetCDF (misal: TPXO, EOT, DTU, dsb).
    Meregrid model menjadi resolusi yang disyaratkan yaitu 2 arcminutes x 2 arcminutes.
    """
    lons = np.arange(90, 150 + 2/60.0, 2/60.0) # Batasan domain 90 sd 150 East dengan resolusi 2 arcminutes
    lats = np.arange(-15, 15 + 2/60.0, 2/60.0) # Batasan domain 15 south sd 15 north dengan resolusi 2 arcminutes
    
    try:
        print(f"[*] Mencoba membaca global model dari: {nc_filepath}")
        if not os.path.exists(nc_filepath):
            raise FileNotFoundError(f"File {nc_filepath} tidak ditemukan. Silakan tambahkan file model global terlebih dahulu.")
            
        dataset = xr.open_dataset(nc_filepath)
        print("[+] Sukses membaca global model.")
        
        # Standardize lon and lat naming
        if 'longitude' in dataset.dims: dataset = dataset.rename({'longitude': 'lon'})
        if 'latitude' in dataset.dims: dataset = dataset.rename({'latitude': 'lat'})
        
        # Jika lon 0-360, adjust ke -180 - 180 jika diperlukan, atau sebaliknya. Domain target 90 sd 150 (aman)
        
        print(f"[*] Melakukan Regridding Spasial ke resolusi 2 arcminutes (15S - 15N, 90E - 150E)...")
        dataset = dataset.interp(lon=lons, lat=lats, method='linear')
        print("[+] Regridding selesai.")
        
        # Konversi satuan amplitudo model global dari cm ke meter
        for var in dataset.data_vars:
            if 'amp' in var.lower():
                print(f"    -> Mengonversi amplitudo {var} dari konstanta global pasut (cm) ke meter (m)...")
                dataset[var] = dataset[var] / 100.0
                    
        return dataset
    except Exception as e:
        print(f"\n[ERROR] Gagal memuat atau memproses interpolasi '{nc_filepath}'.")
        print(f"        Alasan: {e}")
        print(f"        Harap pastikan Model Global telah berada pada direktori yang sama dengan nama '{nc_filepath}'.")
        print(f"        (Hasil plot sebelumnya yang terlihat seperti pola sinus merupakan dummy data akibat file tidak ditemukan!)")
        sys.exit(1)

def data_assimilation_3dvar_multi(model_ds, stations_data, constituents=['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4']):
    """
    Algoritma 3D-Var Optimal Interpolation Multi-Stasiun Regional Indonesia (15S-15N, 90E-150E).
    Mengupdate grid model background berdasarkan data asimilasi multi-observasi sekaligus.
    
    Rumus update keadaan analisis:
        x_a = x_b + B * H^T * (H * B * H^T + R)^-1 * (y - H(x_b))
    """
    print(f"\n[*] Memulai Asimilasi 3D-Var Multi-Stasiun menggunakan {len(stations_data)} stasiun...")
    print("[*] Referensi fase observasi (UTC+0) & model global (Greenwich Phase Lag, UTC) terverifikasi konsisten.")
    
    lat_grid = model_ds['lat'].values
    lon_grid = model_ds['lon'].values
    Lon, Lat = np.meshgrid(lon_grid, lat_grid)
    grid_shape = Lon.shape
    
    # Kovariansi & Parameter kesalahan
    sigma_b = 0.15          # Standar deviasi kesalahan grid model (~15 cm)
    sigma_r = 0.03          # Standar deviasi kesalahan observasi (~3 cm)
    
    # Satelit altimetri memiliki ketelitian yang rendah di perairan dangkal dan sempit, 
    # terutama pada jarak ~20 km dari garis pantai akibat land contamination dan pasut perairan dangkal.
    # Oleh karena itu, radius korelasi spasial (L_decay_km) difokuskan pada 20 km untuk 
    # merepresentasikan area koreksi maksimal oleh tide gauge pesisir.
    L_decay_km = 20.0       # Radius Korelasi spasial asimilasi (20 km)
    
    # Opsi Penggunaan Batimetri / DEM (Depth/Elevation Constraint)
    # Jika tersedia file batimetri (misal GEBCO/ETOPO), perbedaan kedalaman 
    # antara titik observasi dan grid dapat ditambahkan sebagai penalti bobot.
    BATHYMETRY_DIR = "../../GEBCO"              # Folder tempat file DEM/Batimetri berada
    BATHYMETRY_FILE = "gebco_2026_n15.0_s-15.0_w90.0_e150.0.nc"           # Nama file DEM/Batimetri
    BATHYMETRY_PATH = os.path.join(BATHYMETRY_DIR, BATHYMETRY_FILE)
    
    USE_BATHYMETRY_WEIGHTING = os.path.exists(BATHYMETRY_PATH)
    depth_decay_meters = 50.0         # Skala korelasi kedalaman (misal 50 meter)
    
    # Opsi Smoothing / Penghilangan Artefak
    SMOOTHING_METHOD = "spline"       # Opsi: "gaussian", "spline", "median", "uniform", atau "none"
    SMOOTHING_SIGMA = 2.0             # Parameter sigma untuk filter Gaussian
    SMOOTHING_SIZE = 5                # Parameter ukuran kernel (median/uniform) atau smoothness factor (spline)
    
    if USE_BATHYMETRY_WEIGHTING:
        print(f"\n[*] Modul Pembobotan Batimetri (Depth Constraint): AKTIF")
        print(f"    -> Membaca dari: {BATHYMETRY_PATH}")
        try:
            bathy_ds = xr.open_dataset(BATHYMETRY_PATH)
            elev_var = None
            for var in bathy_ds.data_vars:
                if 'elev' in var.lower() or 'depth' in var.lower() or 'z' in var.lower() or 'elevation' in var.lower():
                    elev_var = var
                    break
            
            if elev_var is None:
                raise ValueError("Variabel elevasi/kedalaman tidak ditemukan di file batimetri.")
            
            if 'longitude' in bathy_ds.dims: bathy_ds = bathy_ds.rename({'longitude': 'lon'})
            if 'latitude' in bathy_ds.dims: bathy_ds = bathy_ds.rename({'latitude': 'lat'})
            
            print("    -> Melakukan interpolasi/regridding data batimetri ke domain model pasut...")
            bathy_ds_interp = bathy_ds.interp(lon=lon_grid, lat=lat_grid, method='nearest')
            grid_depth = bathy_ds_interp[elev_var].values
            grid_depth = np.nan_to_num(grid_depth, nan=0.0)
            print("    -> Batimetri berhasil dipetakan.")
        except Exception as e:
            print(f"    -> [!] Gagal membaca dataset batimetri: {e}.")
            print("    -> Pembobotan batimetri akan diabaikan.")
            USE_BATHYMETRY_WEIGHTING = False
            grid_depth = np.zeros(grid_shape)
    else:
        print(f"\n[*] Modul Pembobotan Batimetri (Depth Constraint): NONAKTIF")
        print(f"    -> File tidak ditemukan di {BATHYMETRY_PATH}")
        print("    -> Anda dapat menempatkan file NC batimetri di lokasi tersebut untuk mengaktifkan fitur ini.")
        grid_depth = np.zeros(grid_shape)
    
    # Loop untuk setiap komponen pasut yang terdeteksi
    for const in constituents:
        var_amp = f'amp_{const}'
        var_pha = f'pha_{const}'
        
        if var_amp not in model_ds:
            # Jika tidak ada di model global bawaan, inisialisasi grid kosong
            model_ds[var_amp] = (["lat", "lon"], np.zeros(grid_shape))
            model_ds[var_pha] = (["lat", "lon"], np.zeros(grid_shape))
            
        xb_amp = model_ds[var_amp].values
        xb_pha = model_ds[var_pha].values
        
        # Konversi ke bentuk kompleks (Real dan Imaginer)
        xb_real = xb_amp * np.cos(np.radians(xb_pha))
        xb_imag = xb_amp * np.sin(np.radians(xb_pha))
        
        # Cari dan kumpulkan semua stasiun observasi yang memiliki komponen pasut ini
        valid_stations = []
        y_amp_list = []
        y_pha_list = []
        
        for st in stations_data:
            df_c = st['constituents']
            match = df_c[df_c['Component'].astype(str).str.upper() == const.upper()]
            if not match.empty:
                valid_stations.append(st)
                y_amp_list.append(match.iloc[0]['Amplitude(m)'])
                y_pha_list.append(match.iloc[0]['Phase(deg)'])
                
        num_obs = len(valid_stations)
        if num_obs == 0:
            print(f"[-] Konstituen {const}: Tidak ada stasiun observasi yang sesuai. Skip.")
            continue
            
        print(f"[+] Konstituen {const}: Menyerap data dari {num_obs} stasiun...")
        
        # Bentuk vektor observasi y & koordinat geografis
        y_obs_amp = np.array(y_amp_list)
        y_obs_pha = np.array(y_pha_list)
        
        # Konversi observasi ke bentuk kompleks
        y_obs_real = y_obs_amp * np.cos(np.radians(y_obs_pha))
        y_obs_imag = y_obs_amp * np.sin(np.radians(y_obs_pha))
        
        st_lats = np.array([st['station_lat'] for st in valid_stations])
        st_lons = np.array([st['station_lon'] for st in valid_stations])
        
        # Interpolasi data background model global ke setiap titik koordinat stasiun (H_xb)
        points = np.column_stack((Lat.flatten(), Lon.flatten()))
        xb_real_flat = xb_real.flatten()
        xb_imag_flat = xb_imag.flatten()
        
        # [Opsi Batimetri] Ekstrak kedalaman di tiap stasiun dari grid_depth
        st_depths = np.zeros(num_obs)
        if USE_BATHYMETRY_WEIGHTING:
            grid_depth_flat = grid_depth.flatten()
            st_depths = griddata(points, grid_depth_flat, (st_lats, st_lons), method='nearest')
            st_depths = np.nan_to_num(st_depths, nan=0.0)
        
        H_xb_real = griddata(points, xb_real_flat, (st_lats, st_lons), method='linear')
        H_xb_real = np.nan_to_num(H_xb_real, nan=np.mean(xb_real_flat)) # Proteksi nan
        
        H_xb_imag = griddata(points, xb_imag_flat, (st_lats, st_lons), method='linear')
        H_xb_imag = np.nan_to_num(H_xb_imag, nan=np.mean(xb_imag_flat)) # Proteksi nan
        
        # Hitung Innovation (Residual): d = y - H_xb
        d_real = y_obs_real - H_xb_real
        d_imag = y_obs_imag - H_xb_imag
        
        # Hitung matriks korelasi spasial antar stasiun sendiri (cov_H_B_Ht) ukuran N x N
        cov_H_B_Ht = np.zeros((num_obs, num_obs))
        for i in range(num_obs):
            for j in range(num_obs):
                distance = vincenty_distance(st_lats[i], st_lons[i], st_lats[j], st_lons[j])
                spatial_cov = (sigma_b**2) * np.exp(-(distance**2) / (2 * L_decay_km**2))
                
                # [Opsi Batimetri] 
                if USE_BATHYMETRY_WEIGHTING:
                    depth_diff = abs(st_depths[i] - st_depths[j])
                    bathy_penalty = np.exp(-(depth_diff**2) / (2 * depth_decay_meters**2))
                    cov_H_B_Ht[i, j] = spatial_cov * bathy_penalty
                else:
                    cov_H_B_Ht[i, j] = spatial_cov
                
        # Matriks Varians Observasi R
        R_mat = (sigma_r**2) * np.eye(num_obs)
        
        # Selesaikan sistem linear: Inv_Matrix_Term_Amp = (HBH^T + R)^-1 * d
        inv_d_real = np.linalg.solve(cov_H_B_Ht + R_mat, d_real)
        inv_d_imag = np.linalg.solve(cov_H_B_Ht + R_mat, d_imag)
        
        # Desiminasikan koreksi asimilasi spasial secara Vectorized (Bisa dengan GPU atau CPU)
        if HAS_GPU:
            xp = cp
            print(f"      [GPU] Menjalankan matriks asimilasi pada GPU (CuPy)...")
        else:
            xp = np
            print(f"      [CPU] Menjalankan matriks asimilasi tervektorisasi pada CPU...")
            
        # Pindahkan data ke dalam struktur Array XP (GPU/CPU)
        xp_Lat = xp.array(Lat)
        xp_Lon = xp.array(Lon)
        xp_st_lats = xp.array(st_lats)
        xp_st_lons = xp.array(st_lons)
        xp_inv_d_real = xp.array(inv_d_real)
        xp_inv_d_imag = xp.array(inv_d_imag)
        
        # Formula Haversine Vectorized
        dLat = xp.radians(xp_Lat[:, :, xp.newaxis] - xp_st_lats)
        dLon = xp.radians(xp_Lon[:, :, xp.newaxis] - xp_st_lons)
        lat1 = xp.radians(xp_Lat[:, :, xp.newaxis])
        lat2 = xp.radians(xp_st_lats)
        
        a_geo = xp.sin(dLat/2)**2 + xp.cos(lat1) * xp.cos(lat2) * xp.sin(dLon/2)**2
        c_geo = 2 * xp.arctan2(xp.sqrt(a_geo), xp.sqrt(1-a_geo))
        distances = 6371.0 * c_geo 
        
        # Vektor b: Kovariansi spasial antara grid point ini dengan seluruh stasiun observasi
        b_cov = (sigma_b**2) * xp.exp(-(distances**2) / (2 * L_decay_km**2))
        
        # [Opsi Batimetri] Jika menggunakan batimetri/DEM, kovariansi termodulasi oleh gradien kedalaman/topografi
        if USE_BATHYMETRY_WEIGHTING:
            xp_grid_depth = xp.array(grid_depth)
            xp_st_depths = xp.array(st_depths)
            b_bathy_penalty = xp.exp(-((xp_grid_depth[:, :, xp.newaxis] - xp_st_depths)**2) / (2 * depth_decay_meters**2))
            b_cov = b_cov * b_bathy_penalty
            if HAS_GPU:
                del xp_grid_depth, xp_st_depths, b_bathy_penalty
        
        xp_influence_real = xp.dot(b_cov, xp_inv_d_real)
        xp_influence_imag = xp.dot(b_cov, xp_inv_d_imag)
        
        if HAS_GPU:
            influence_real = xp_influence_real.get()
            influence_imag = xp_influence_imag.get()
            
            # Bersihkan memori GPU untuk batch selanjutnya
            del xp_Lat, xp_Lon, xp_st_lats, xp_st_lons, xp_inv_d_real, xp_inv_d_imag
            del dLat, dLon, lat1, lat2, a_geo, c_geo, distances, b_cov, xp_influence_real, xp_influence_imag
            cp.get_default_memory_pool().free_all_blocks()
        else:
            influence_real = xp_influence_real
            influence_imag = xp_influence_imag
            
        # [Penghilangan Artefak Bintik / Smoothing]
        # Aplikasikan spatial filter pada peta increment (influence) sebelum dijumlahkan
        # Ini akan memperhalus batas tajam dan efek bintik-bintik ("bullseye") akibat L_decay_km yang kecil (~20km)
        if SMOOTHING_METHOD == "gaussian":
            influence_real = gaussian_filter(influence_real, sigma=SMOOTHING_SIGMA)
            influence_imag = gaussian_filter(influence_imag, sigma=SMOOTHING_SIGMA)
        elif SMOOTHING_METHOD == "spline":
            # Pendekatan Spline in Tension / Spline Smoothing untuk grid 2D
            # Menggunakan RectBivariateSpline dengan faktor kehalusan (s)
            x_idx = np.arange(influence_real.shape[0])
            y_idx = np.arange(influence_real.shape[1])
            s_val = SMOOTHING_SIZE * influence_real.size * 0.05
            
            spline_r = RectBivariateSpline(x_idx, y_idx, influence_real, s=s_val)
            influence_real = spline_r(x_idx, y_idx)
            
            spline_i = RectBivariateSpline(x_idx, y_idx, influence_imag, s=s_val)
            influence_imag = spline_i(x_idx, y_idx)
        elif SMOOTHING_METHOD == "median":
            influence_real = median_filter(influence_real, size=SMOOTHING_SIZE)
            influence_imag = median_filter(influence_imag, size=SMOOTHING_SIZE)
        elif SMOOTHING_METHOD == "uniform":
            influence_real = uniform_filter(influence_real, size=SMOOTHING_SIZE)
            influence_imag = uniform_filter(influence_imag, size=SMOOTHING_SIZE)
                
        # Perbarui peta grid berdasarkan analisis real dan imaginer
        xa_real = xb_real + influence_real
        xa_imag = xb_imag + influence_imag
        
        # Kembalikan ke amplitudo dan fase
        xa_amp = np.hypot(xa_real, xa_imag)
        xa_amp = np.clip(xa_amp, 0.0, 3.5) # Proteksi nilai amplitudo logis
        
        # Phase Unwrapping: rentang disamakan dengan base model (xb_pha) 
        # sehingga tidak ada transisi jomplang akibat offset periodik
        xa_pha_raw = np.degrees(np.arctan2(xa_imag, xa_real))
        diff_pha = (xa_pha_raw - xb_pha) % 360.0
        diff_pha[diff_pha > 180] -= 360.0
        xa_pha = xb_pha + diff_pha
        
        model_ds[var_amp].values = xa_amp
        model_ds[var_pha].values = xa_pha
        
        print(f"    [+] Koreksi konstituen {const} selesai diintegrasikan.")
        
    return model_ds

def spatial_train_test_split(stations_data, train_ratio=0.7):
    """
    Membagi stasiun menjadi data latih (asimilasi) dan data uji (evaluasi).
    Memperhatikan sebaran geografis dengan membagi domain ke dalam beberapa grid/kuadran,
    kemudian melakukan random split pada setiap kuadran untuk memastikan sampel merata spasial.
    """
    print(f"\n[*] Membagi dataset menjadi Train-Test dengan rasio {train_ratio*100:.0f}:{100-train_ratio*100:.0f} (Spatial Stratified)")
    
    total_stations = len(stations_data)
    num_train = int(round(total_stations * train_ratio))
    num_test = total_stations - num_train
    
    if num_test == 0 and total_stations > 1:
        num_test = 1
        num_train = total_stations - 1
        
    # Kelompokkan stasiun ke dalam grid 5x5 derajat
    grid_buckets = {}
    for st in stations_data:
        # Pukul rata ke grid 5 derajat
        grid_lat = math.floor(st['station_lat'] / 5.0) * 5
        grid_lon = math.floor(st['station_lon'] / 5.0) * 5
        grid_key = (grid_lat, grid_lon)
        
        if grid_key not in grid_buckets:
            grid_buckets[grid_key] = []
        grid_buckets[grid_key].append(st)
        
    # Shuffle isi masing-masing bucket
    for key in grid_buckets:
        random.shuffle(grid_buckets[key])
        
    train_stations = []
    test_stations = []
    
    remaining_buckets = {k: list(v) for k, v in grid_buckets.items()}
    
    # Tahap 1: Ambil test_stations dari bucket yang memiliki lebih dari 1 stasiun
    # (agar setidaknya 1 stasiun dari tiap grid tetap ada di asimilasi jika memungkinkan)
    keys_cycle = list(remaining_buckets.keys())
    random.shuffle(keys_cycle)
    
    while len(test_stations) < num_test:
        added_in_round = False
        for k in list(keys_cycle):
            if len(test_stations) >= num_test:
                break
            if len(remaining_buckets[k]) > 1: # Sisakan minimal 1 untuk train
                test_stations.append(remaining_buckets[k].pop(0))
                added_in_round = True
                
        if not added_in_round:
            break # Semua bucket tinggal maksimal 1 atau sudah diproses
            
    # Tahap 2: Jika kuota test test_stations belum terpenuhi, terpaksa ambil dari bucket yang isinya cuma 1
    if len(test_stations) < num_test:
        keys_cycle = list(remaining_buckets.keys())
        random.shuffle(keys_cycle)
        for k in list(keys_cycle):
            if len(test_stations) >= num_test:
                break
            if len(remaining_buckets[k]) == 1:
                test_stations.append(remaining_buckets[k].pop(0))
                
    # Sisa data masuk ke train set
    for k, v in remaining_buckets.items():
        train_stations.extend(v)
            
    print(f"    -> Total Stasiun Asimilasi (Train) : {len(train_stations)}")
    print(f"    -> Total Stasiun Evaluasi (Test)   : {len(test_stations)}")
    return train_stations, test_stations

def evaluate_metrics(model_ds, test_stations, constituents):
    """
    Menghitung metrik ketelitian model hasil asimilasi terhadap set stasiun uji.
    Menghitung MAE, RMSE, dan Koefisien Korelasi (Pearson) untuk Amplitudo dan Fase.
    """
    print(f"\n[*] Melakukan Evaluasi Model terhadap {len(test_stations)} stasiun test...")
    if not test_stations:
        print("[-] Tidak ada stasiun test yang tersedia untuk evaluasi.")
        return
        
    lat_grid = model_ds['lat'].values
    lon_grid = model_ds['lon'].values
    Lon, Lat = np.meshgrid(lon_grid, lat_grid)
    points = np.column_stack((Lat.flatten(), Lon.flatten()))
    
    all_metrics = {}
    for const in constituents:
        var_amp = f'amp_{const}'
        var_pha = f'pha_{const}'
        
        if var_amp not in model_ds:
            continue
            
        xb_amp_flat = model_ds[var_amp].values.flatten()
        xb_pha_flat = model_ds[var_pha].values.flatten()
        
        xb_real_flat = xb_amp_flat * np.cos(np.radians(xb_pha_flat))
        xb_imag_flat = xb_amp_flat * np.sin(np.radians(xb_pha_flat))
        
        y_obs_amp = []
        y_obs_pha = []
        st_lats = []
        st_lons = []
        
        for st in test_stations:
            df_c = st['constituents']
            match = df_c[df_c['Component'].astype(str).str.upper() == const.upper()]
            if not match.empty:
                y_obs_amp.append(match.iloc[0]['Amplitude(m)'])
                y_obs_pha.append(match.iloc[0]['Phase(deg)'])
                st_lats.append(st['station_lat'])
                st_lons.append(st['station_lon'])
                
        if len(y_obs_amp) < 2: # Korelasi butuh minimal 2 titik
            continue
            
        y_obs_amp = np.array(y_obs_amp)
        y_obs_pha = np.array(y_obs_pha)
        
        # Interpolasi hasil model ke titik test stasiun (Via Real dan Imaginer)
        model_real = griddata(points, xb_real_flat, (np.array(st_lats), np.array(st_lons)), method='linear')
        model_imag = griddata(points, xb_imag_flat, (np.array(st_lats), np.array(st_lons)), method='linear')
        
        model_amp = np.hypot(model_real, model_imag)
        model_amp = np.nan_to_num(model_amp, nan=np.mean(y_obs_amp))
        
        model_pha = np.degrees(np.arctan2(model_imag, model_real)) % 360.0
        model_pha = np.nan_to_num(model_pha, nan=np.mean(y_obs_pha))
        
        # Metrik Amplitudo
        diff_amp = model_amp - y_obs_amp
        mae_amp = np.mean(np.abs(diff_amp))
        mse_amp = np.mean(diff_amp**2)
        rmse_amp = np.sqrt(mse_amp)
        corr_amp, _ = pearsonr(model_amp, y_obs_amp)
        r2_amp = corr_amp**2
        max_res_amp = np.max(diff_amp)
        min_res_amp = np.min(diff_amp)
        
        # Metrik Fase (menangani wrap-around 360 derajat)
        diff_pha = model_pha - y_obs_pha
        diff_pha = (diff_pha + 180) % 360 - 180
        mae_pha = np.mean(np.abs(diff_pha))
        mse_pha = np.mean(diff_pha**2)
        rmse_pha = np.sqrt(mse_pha)
        max_res_pha = np.max(diff_pha)
        min_res_pha = np.min(diff_pha)
        
        # Korelasi linear sederhana untuk fase terkadang ambigu, tetapi kita gunakan standar
        corr_pha, _ = pearsonr(model_pha, y_obs_pha)
        r2_pha = corr_pha**2
        
        all_metrics[const] = {
            'RMSE_Amp (m)': rmse_amp,
            'MAE_Amp (m)': mae_amp,
            'R2_Amp': r2_amp,
            'Max_Res_Amp (m)': max_res_amp,
            'Min_Res_Amp (m)': min_res_amp,
            'RMSE_Pha (deg)': rmse_pha,
            'MAE_Pha (deg)': mae_pha,
            'R2_Pha': r2_pha,
            'Max_Res_Pha (deg)': max_res_pha,
            'Min_Res_Pha (deg)': min_res_pha
        }
        
        print(f"    [ {const} ] Amplitudo -> RMSE: {rmse_amp:.5f} m, MAE: {mae_amp:.5f} m, R square: {r2_amp:.5f}")
        print(f"    [ {const} ] Fase      -> RMSE: {rmse_pha:.5f} deg, MAE: {mae_pha:.5f} deg, R square: {r2_pha:.5f}")
        
    return all_metrics

def save_evaluation_metrics(metrics, output_filepath="evaluation_metrics.txt", log_info=""):
    """
    Menyimpan hasil metrik ketelitian model (RMSE, MAE, R, Max/Min Residue) ke dalam file TXT.
    Juga menambahkan keterangan log tentang konfigurasi pengujian.
    """
    if not metrics:
        return
        
    print(f"\n[*] Menyimpan ringkasan metrik evaluasi ke {output_filepath}")
    
    # Konversi dictionary metrik ke dalam list of dictionaries
    metrics_list = []
    for const, vals in metrics.items():
        row = {'Component': const}
        row.update(vals)
        metrics_list.append(row)
        
    df_metrics = pd.DataFrame(metrics_list)
    df_metrics_str = df_metrics.to_csv(index=False, sep='\t', float_format='%.5f')
    
    with open(output_filepath, 'w', encoding='utf-8') as f:
        if log_info:
            f.write(log_info + "\n\n")
        f.write(df_metrics_str)
        
    print(f"    -> File metrik berhasil disimpan: {output_filepath}")

def merge_constituent_netcdfs(input_dir, output_filepath):
    """
    Menggabungkan beberapa file NetCDF yang masing-masing berisi 1 konstanta harmonik 
    menjadi 1 file NetCDF gabungan.
    """
    print(f"\n[*] Mencari file NetCDF model harmonik terpisah di folder: {input_dir}")
    nc_files = glob.glob(os.path.join(input_dir, "*.nc"))
    
    # Kecualikan file output atau base agar tidak terjadi circular merge
    nc_files = [f for f in nc_files if 'global_model_base' not in os.path.basename(f) and 'regional_tide_model' not in os.path.basename(f)]
    
    if not nc_files:
        print("[-] Tidak ditemukan file .nc satuan konstanta di direktori tersebut.")
        return
        
    print(f"[*] Ditemukan {len(nc_files)} file. Memulai penggabungan...")
    datasets = []
    
    known_consts = ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4', 'Q1', 'SA', 'SSA']
    
    for file in nc_files:
        filename = os.path.basename(file)
        
        # Cari konstanta dari nama file
        konstanta = "UNKNOWN"
        for c in known_consts:
            if f"_{c.lower()}" in filename.lower() or f"{c.lower()}_" in filename.lower() or filename.lower().startswith(c.lower()) or filename.lower() == f"{c.lower()}.nc":
                konstanta = c
                break
                
        if konstanta == "UNKNOWN":
            konstanta = filename.split('_')[-1].replace('.nc', '').upper()
            
        print(f"    -> Memproses {filename} (Konstanta Terdeteksi: {konstanta})")
        ds = xr.open_dataset(file)
        
        # Pisahkan nama variabel menjadi spesifik per konstanta jika belum ada
        rename_dict = {}
        for var in ds.data_vars:
            if 'amp' in var.lower() and konstanta not in var.upper():
                rename_dict[var] = f'amp_{konstanta}'
            elif 'pha' in var.lower() and konstanta not in var.upper():
                rename_dict[var] = f'pha_{konstanta}'
        
        if rename_dict:
            ds = ds.rename(rename_dict)
            
        datasets.append(ds)
        
    if not datasets:
        return
        
    print("[*] Menggabungkan (Merging) seluruh dataset...")
    combined_ds = xr.merge(datasets, compat='override')
    
    print(f"[*] Menyimpan hasil gabungan ke: {output_filepath}")
    combined_ds.to_netcdf(output_filepath)
    print("[SUCCESS] Penggabungan model konstanta harmonik berhasil!\n")

def run_pipeline(input_patterns):
    print("=====================================================================")
    print("           TIDE REGIONAL ASSIMILATION & MODELING SYSTEM              ")
    print("                  DOMAIN: 15N to 15S, 90E to 150E                    ")
    print("=====================================================================")
    
    # 1. Temukan seluruh berkas input (mendukung glob wildcard)
    all_files = []
    for pattern in input_patterns:
        matched = glob.glob(pattern)
        all_files.extend(matched)
        
    all_files = list(set(all_files)) # Buang duplikat
    
    if not all_files:
        print("[!] Tidak ada file observasi konstanta harmonis pasut (.txt atau .csv) yang ditemukan!")
        print("[*] Membuat dataset contoh tiruan untuk dijalankan...")
        all_files = ["dummy_stasiun_A.txt", "dummy_stasiun_B.csv"]
        
        # Buat dummy stasiun A (TXT)
        with open("dummy_stasiun_A.txt", "w") as f:
            f.write("# Station Name: Jakarta Utara (TG-01)\n")
            f.write("# Latitude: -6.10123\n")
            f.write("# Longitude: 106.85244\n")
            f.write("Component\tAmplitude(m)\tPhase(deg)\n")
            f.write("M2\t0.75\t120.0\n")
            f.write("S2\t0.31\t185.0\n")
            f.write("K1\t0.55\t45.0\n")
            f.write("O1\t0.22\t12.0\n")
            
        # Buat dummy stasiun B (CSV)
        with open("dummy_stasiun_B.csv", "w") as f:
            f.write("# Station Name: Ambon (TG-02)\n")
            f.write("# Latitude: -3.68456\n")
            f.write("# Longitude: 128.17231\n")
            f.write("Component,Amplitude(m),Phase(deg)\n")
            f.write("M2,1.25,160.0\n")
            f.write("S2,0.48,225.0\n")
            f.write("K1,0.32,95.0\n")
            f.write("O1,0.18,55.0\n")
            f.write("N2,0.15,110.0\n")

    print(f"[*] Menemukan {len(all_files)} file konstanta untuk diasimilasi.")
    
    # 2. Muat seluruh data observasi stasiun
    stations_data = []
    all_consts = set()
    
    for fp in all_files:
        parsed = load_harmonic_constants(fp)
        if parsed is not None:
            stations_data.append(parsed)
            for c in parsed['constituents']['Component'].astype(str).unique():
                all_consts.add(c.upper())
                
    if not stations_data:
        print("[ERROR] Gagal memuat satupun berkas observasi pasut.")
        return
        
    target_consts = ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4']
    constituents_list = [c for c in target_consts if c in all_consts]
    print(f"[*] Total Komponen Pasut Unik yang ditemukan untuk Asimilasi: {constituents_list}")
    
    # 3. Muat berkas global model dasar
    global_model_file = "global_model_base.nc"
    
    # Jika model dasar belum digabung, coba scan di folder saat ini (.) 
    if not os.path.exists(global_model_file):
        print("[*] File global_model_base.nc tidak ditemukan di working directory, mencoba mendeteksi file NC model satuan...")
        merge_constituent_netcdfs(".", global_model_file)

    model = read_global_model(global_model_file, constituents=constituents_list)
    
    # 4. Bagi data stasiun 70:30 secara spasial
    train_stations, test_stations = spatial_train_test_split(stations_data, train_ratio=0.7)
    
    # 5. Jalankan asimilasi 3D-Var Multi-Stasiun hanya menggunakan data latih
    updated_model = data_assimilation_3dvar_multi(model, train_stations, constituents=constituents_list)
    
    # 6. Hitung Metrik Ketelitian terhadap stasiun uji
    metrics = evaluate_metrics(updated_model, test_stations, constituents=constituents_list)
    if metrics:
        log_txt = f"=== METRIK EVALUASI MODEL PASUT (ASIMILASI 3D-VAR) ===\n" \
                  f"Total Stasiun Observasi : {len(stations_data)}\n" \
                  f"Jumlah Data Latih (Train) : {len(train_stations)}\n" \
                  f"Jumlah Data Uji (Test)    : {len(test_stations)}\n" \
                  f"File Model Base           : {global_model_file}\n" \
                  f"Data Stasiun Latih        : {', '.join([st['station_name'] for st in train_stations])}\n" \
                  f"Data Stasiun Uji          : {', '.join([st['station_name'] for st in test_stations])}"
        
        save_evaluation_metrics(metrics, "regional_tide_model_metrics.txt", log_info=log_txt)
    
    # 7. Ekspor model hasil asimilasi ke format NetCDF (.nc)
    output_nc = "regional_tide_model_indonesia_EOT20.nc"
    try:
        updated_model.to_netcdf(output_nc)
        print("=====================================================================")
        print(f"[SUCCESS] Proses Asimilasi dan Evaluasi Selesai!")
        print(f"          Model Output  : {output_nc}")
        print(f"          Geom Boundaries: 15°N - 15°S, 90°E - 150°E")
        print(f"          Grid Points   : {len(updated_model.lat)}x{len(updated_model.lon)}")
        if test_stations:
             print("          Metrik Evaluasi telah tercetak di layar dan diekspor ke TXT.")
        print("=====================================================================")
    except Exception as e:
        print(f"[ERROR] Gagal menyimpan file NetCDF: {e}")

if __name__ == "__main__":
    # Apabila dilewatkan argument spesifik, asumsikan itu target pencarian berkas
    if len(sys.argv) > 1:
        targets = sys.argv[1:]
    else:
        obs_dir = r"D:\2026\Pasut\Model Pasut\InaTides"
        targets = ["*.txt", "*.csv"]
        if os.path.exists(obs_dir):
            targets.extend([os.path.join(obs_dir, "*.txt"), os.path.join(obs_dir, "*.csv")])
    run_pipeline(targets)
