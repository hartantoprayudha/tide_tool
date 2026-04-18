# TideScript - Marine Tide Analytics

TideScript adalah aplikasi analisis deret waktu pasang surut air laut yang kuat, dirancang untuk memproses data dari berbagai sensor tekanan (PRS1, PRS2, PRS3) dan memberikan hasil analisis harmonik, tren linier, serta prediksi masa depan.

## Fitur Utama
- **Import CSV & Deteksi Otomatis**: Mendeteksi kolom sensor ketinggian (m) dan waktu secara otomatis.
- **Pembersihan Data (Outlier)**: Menggunakan algoritma Z-Score untuk membuang data sasar.
- **Digital Filtering**: Opsi Moving Average, Median Filter, dan Butterworth Low-pass Filter.
- **Analisis Harmonik**: Mendukung 4, 9, hingga konstanta UKHO Total Tide Plus menggunakan metode Least Squares.
- **Analisis Tren**: Menghitung laju kenaikan muka air laut (Sea Level Rise) dalam mm/tahun.
- **Prediksi Pasut**: Simulasi ketinggian air laut di masa depan berdasarkan konstanta harmonik.
- **Optimasi Grafik**: Visualisasi ringan dengan cuplikan data per jam untuk performa tinggi.

---

## Menjalankan Analisis via Python (Tanpa Dashboard)

Bagi pengguna yang ingin menjalankan analisis secara lokal tanpa antarmuka web, kami menyediakan script Python pendukung.

### Persiapan
Pastikan Anda memiliki Python 3.x dan pustaka yang diperlukan:
```bash
pip install pandas numpy scipy matplotlib
```

### Script Utama (`tide_analysis.py`)
Gunakan script ini untuk memproses file CSV Anda. Script ini mengimplementasikan logika yang sama dengan aplikasi web (Least Squares Harmonic Analysis).

#### Contoh Penggunaan:
```python
import pandas as pd
from tide_analysis import load_data, detect_outliers, harmonic_analysis, predict_tide, visualize

# 1. Load Data
df = load_data('tide_data.csv', date_col='Timestamp', value_col='PRS1 (m)')

# 2. Pre-processing (Remove Outliers)
df['is_outlier'] = detect_outliers(df['PRS1 (m)'])
df_clean = df[~df['is_outlier']].copy()

# 3. Harmonic Analysis (Least Squares)
results, z0 = harmonic_analysis(df_clean, num_components=9)
print(f"Mean Sea Level (Z0): {z0:.3f} m")

# 4. Tidal Prediction (Next 7 Days)
start_pred = df[df.columns[0]].max()
end_pred = start_pred + pd.Timedelta(days=7)
times, values = predict_tide(start_pred, end_pred, 60, results, z0)

# 5. Visualisasi
visualize(df_clean, 'Timestamp', 'PRS1 (m)', 'PRS1 (m)', title="Analisis Pasut Lokal")
```

### Catatan Teknis
Perhitungan pada aplikasi ini didasarkan pada persamaan:
$$h(t) = Z_0 + \sum_{i=1}^{n} A_i \cos(\omega_i t - \phi_i)$$
dengan:
- $Z_0$: Mean Sea Level.
- $A_i$: Amplitudo komponen ke-$i$.
- $\omega_i$: Frekuensi sudut komponen ke-$i$.
- $\phi_i$: Fase komponen ke-$i$.
