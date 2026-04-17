import pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
from datetime import timedelta

# Daftar frekuensi komponen harmonik (cycles per hour)
HARMONIC_FREQUENCIES = {
    'M2': 0.080511401, 'S2': 0.083333333, 'K1': 0.041780746, 'O1': 0.038730654,
    'N2': 0.078999249, 'K2': 0.083561492, 'P1': 0.041552587, 'M4': 0.161022801, 'MS4': 0.163844734,
    'Q1': 0.037218503, 'Mf': 0.003050092, 'Mm': 0.001512152, 'M3': 0.120767101, 'M6': 0.241545602,
    '2N2': 0.077486997, 'mu2': 0.077689301, 'nu2': 0.079201553, 'L2': 0.082023552, 'T2': 0.083219266,
    'R2': 0.083447341, '2Q1': 0.035706251, 'sigma1': 0.035908605, 'rho1': 0.037420857, 'tau1': 0.038958807,
    'chi1': 0.040471059, 'pi1': 0.041438512, 'phi1': 0.04200421, 'theta1': 0.043021057, 'J1': 0.043292151,
    'OO1': 0.044830349, 'MK3': 0.122292147, 'S4': 0.166666667, 'M8': 0.322045603, 'MK4': 0.161022801
}

def load_data(filepath, date_col='Timestamp', value_col='PRS1 (m)'):
    """Membaca data CSV dan membersihkan nilai non-numerik."""
    df = pd.read_csv(filepath)
    # Ubah 'n' atau string kosong menjadi NaN
    df[value_col] = pd.to_numeric(df[value_col].replace('n', np.nan), errors='coerce')
    # Parse tanggal (Asumsi format DD/MM/YYYY HH:MM)
    df[date_col] = pd.to_datetime(df[date_col], dayfirst=True)
    # Hapus row yang tidak punya data utama
    df = df.dropna(subset=[date_col, value_col]).reset_index(drop=True)
    return df

def apply_time_offset(df, hours, date_col='Timestamp'):
    """Memberikan offset waktu pada kolom tanggal."""
    df[date_col] = df[date_col] + timedelta(hours=hours)
    return df

def detect_outliers(series, window=60, threshold=3):
    """Mendeteksi outlier menggunakan metode Z-score pada rolling window."""
    rolling_mean = series.rolling(window=window, center=True).mean()
    rolling_std = series.rolling(window=window, center=True).std()
    z_score = (series - rolling_mean) / rolling_std
    # Ganti outlier dengan NaN agar bisa di-interpolate nanti
    is_outlier = np.abs(z_score) > threshold
    return is_outlier

def apply_low_pass_filter(series, window=10):
    """Smoothing data menggunakan Moving Average."""
    return series.rolling(window=window, center=True).mean()

def calculate_linear_trend(df, date_col='Timestamp', value_col='PRS1 (m)'):
    """Menghitung tren kenaikan muka air laut secara linier."""
    # Ubah waktu jadi angka (seconds dari start) untuk regresi
    x = (df[date_col] - df[date_col].min()).dt.total_seconds()
    y = df[value_col]
    
    # Linear regression
    mask = ~np.isnan(y)
    slope, intercept, r_value, p_value, std_err = stats.linregress(x[mask], y[mask])
    
    # Trend line values
    trend_line = intercept + slope * x
    
    # Convert slope to mm/year (asumsi input m)
    slope_mm_year = slope * (3600 * 24 * 365.25) * 1000
    return trend_line, slope_mm_year

def harmonic_analysis(df, num_components=4, date_col='Timestamp', value_col='PRS1 (m)'):
    """Analisis harmonik untuk mendapatkan Amplitudo dan Fase."""
    if num_components == 4:
        comp_list = ['M2', 'S2', 'K1', 'O1']
    elif num_components == 9:
        comp_list = ['M2', 'S2', 'N2', 'K2', 'K1', 'O1', 'P1', 'M4', 'MS4']
    else: # UKHO / All available
        comp_list = list(HARMONIC_FREQUENCIES.keys())
        
    # Persiapan data
    t = (df[date_col] - df[date_col].min()).dt.total_seconds() / 3600.0 # dalam jam
    y = df[value_col].values
    mask = ~np.isnan(y)
    t_masked = t[mask]
    y_masked = y[mask]
    
    mean_level = np.mean(y_masked)
    y_centered = y_masked - mean_level
    
    # Matriks untuk Least Squares: y = sum(A*cos(wt) + B*sin(wt))
    A_matrix = []
    for comp in comp_list:
        w = 2 * np.pi * HARMONIC_FREQUENCIES[comp]
        A_matrix.append(np.cos(w * t_masked))
        A_matrix.append(np.sin(w * t_masked))
    
    A_matrix = np.array(A_matrix).T
    # Selesaikan persamaan linear
    params, _, _, _ = np.linalg.lstsq(A_matrix, y_centered, rcond=None)
    
    results = []
    for i, comp in enumerate(comp_list):
        a_coeff = params[2*i]
        b_coeff = params[2*i + 1]
        amplitude = np.sqrt(a_coeff**2 + b_coeff**2)
        phase = np.degrees(np.arctan2(b_coeff, a_coeff))
        if phase < 0: phase += 360
        results.append({'komponen': comp, 'amplitudo': amplitude, 'fase': phase})
        
    return results, mean_level

def predict_tide(start_date, end_date, interval_minutes, components, z0):
    """Menghitung prediksi muka air laut berdasarkan hasil analisis harmonik."""
    times = pd.date_range(start=start_date, end=end_date, freq=f'{interval_minutes}min')
    t_hours = (times - start_date).total_seconds() / 3600.0
    
    prediction = np.full(len(t_hours), z0)
    for res in components:
        w = 2 * np.pi * HARMONIC_FREQUENCIES[res['komponen']]
        amp = res['amplitudo']
        phase_rad = np.radians(res['fase'])
        # Reconstruct: A * cos(wt - phase)
        prediction += amp * np.cos(w * t_hours - phase_rad)
        
    return times, prediction

def visualize(df, date_col, value_orig, value_smooth, trend_line=None, title="Analisis Pasang Surut"):
    """Membuat plot perbandingan data asli dan hasil filter."""
    plt.figure(figsize=(12, 6))
    plt.plot(df[date_col], df[value_orig], label='Data Asli', alpha=0.4, color='gray')
    plt.plot(df[date_col], df[value_smooth], label='Hasil Filter (Low Pass)', color='blue', linewidth=2)
    
    if trend_line is not None:
        plt.plot(df[date_col], trend_line, label='Tren Linier', color='red', linestyle='--')
        
    plt.title(title)
    plt.xlabel('Waktu')
    plt.ylabel('Ketinggian (m)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.show()
