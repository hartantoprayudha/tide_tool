import tide_analysis as ta
import pandas as pd

# === DATA INPUT & PARAMETERS ===
FILE_PATH = "tide_data.csv"
VALUE_COLUMN = "PRS1 (m)"  # Kolom yang dianalisis
TIME_OFFSET_HOURS = 0      # Offset waktu (misal +7 untuk WIB)
HARMONIC_OPTION = 9        # Pilih 4, 9, atau 'UKHO'
DETECTION_WINDOW = 30      # Jendela waktu deteksi outlier (jumlah baris)
FILTER_WINDOW = 10         # Jendela waktu smoothing (jumlah baris)

def main():
    print(f"--- Memulai Analisis Data: {FILE_PATH} ---")
    
    # 1. Load Data
    df = ta.load_data(FILE_PATH, value_col=VALUE_COLUMN)
    print(f"Total data dibaca: {len(df)} baris")
    
    # 2. Offset Waktu
    if TIME_OFFSET_HOURS != 0:
        df = ta.apply_time_offset(df, TIME_OFFSET_HOURS)
        print(f"Offset waktu diterapkan: {TIME_OFFSET_HOURS} jam")
    
    # 3. Deteksi Outlier & Cleaning
    is_outlier = ta.detect_outliers(df[VALUE_COLUMN], window=DETECTION_WINDOW)
    df.loc[is_outlier, VALUE_COLUMN] = None
    # Isi data kosong hasil cleaning dengan interpolasi linier
    df[VALUE_COLUMN] = df[VALUE_COLUMN].interpolate(method='linear')
    print(f"Outlier terdeteksi dan dibersihkan: {is_outlier.sum()} titik")
    
    # 4. Low Pass Filter (Smoothing)
    df['Filtered'] = ta.apply_low_pass_filter(df[VALUE_COLUMN], window=FILTER_WINDOW)
    # Isi NaN hasil rolling window di ujung awal/akhir
    df['Filtered'] = df['Filtered'].fillna(method='bfill').fillna(method='ffill')
    
    # 5. Tren Linier Kenaikan Muka Air Laut
    trend_line, rate = ta.calculate_linear_trend(df, value_col='Filtered')
    print(f"Tren Kenaikan Muka Air Laut: {rate:.4f} mm/tahun")
    
    # 6. Analisis Harmonik
    harmonic_results, z0 = ta.harmonic_analysis(df, num_components=HARMONIC_OPTION, value_col='Filtered')
    print(f"\nHasil Analisis Harmonik ({HARMONIC_OPTION} Komponen):")
    print(f"Mean Sea Level (Z0): {z0:.4f} m")
    print(f"{'Komponen':<10} | {'Amplitudo (m)':<15} | {'Fase (deg)':<10}")
    print("-" * 45)
    for res in harmonic_results:
        print(f"{res['komponen']:<10} | {res['amplitudo']:<15.4f} | {res['fase']:<10.2f}")
        
    # 7. Prediksi Muka Air Laut (Contoh: untuk 24 jam ke depan dari data terakhir)
    last_date = df['Timestamp'].max()
    next_day = last_date + pd.Timedelta(days=1)
    p_times, p_vals = ta.predict_tide(last_date, next_day, 10, harmonic_results, z0)
    print(f"\nPrediksi untuk periode selanjutnya telah dihitung ({len(p_times)} titik).")
    
    # 8. Visualisasi
    ta.visualize(df, 'Timestamp', VALUE_COLUMN, 'Filtered', trend_line=trend_line)
    
    print("\n--- Analisis Selesai ---")

if __name__ == "__main__":
    main()
