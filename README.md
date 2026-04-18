# BIG Tidal Analysis - Marine Tide Analytics

**Badan Informasi Geospasial (BIG)**
Direktorat Sistem Referensi Geospasial

Aplikasi BIG Tidal Analysis adalah platform analisis deret waktu pasang surut air laut yang dirancang untuk memproses data dari berbagai sensor tekanan (CSV data) dan memberikan hasil analisis harmonik presisi, ekspor datum, serta prediksi masa depan.

![Dashboard Preview](https://images.unsplash.com/photo-1541888040510-91494abb163d?q=80&w=1200&h=450&fit=crop&blur=2)
*(Screenshot representasi dashboard analitik dengan gelombang laut)*

---

## 1. Petunjuk Penggunaan (WebApp Dashboard)

- **Akses Dashboard**: Cukup memuat file observasi Anda berformat `.csv` (memiliki kolom Timestamp & Sensor).
- **Interactive Toggles**: Pada bagian grafik/chart, Anda dapat mengklik legenda (contoh: *Analyzed Level* atau *Prediction*) untuk menampilkan atau menyembunyikannya.
- **Prediksi Interaktif**: Terdapat panel prediction yang bisa dikalkulasi berdasarkan set konstanta harmonik (misal: UKHO, 9 Constants, dll). Grafik prediksi maksimal dirender s/d 1 tahun untuk menjaga performa (HW Accel by default).

![Prediction & Filter Module](https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&h=450&fit=crop&blur=2)
*(Ilustrasi Panel Filter Data & Visualisasi Prediksi Harmonik)*

---

## 2. Petunjuk Penggunaan (Local Script / Batching)

Bagi Anda yang ingin menjalankan analisis masif (batching) secara sistematis tanpa antarmuka web, Anda dapat menggunakan modul Python yang disediakan.

### Persiapan:
```bash
pip install pandas numpy scipy matplotlib
```

### Cara Jalan:
Gunakan file `tide_analysis.py` sebagai modul utama.
```python
import pandas as pd
from tide_analysis import load_data, harmonic_analysis, predict_tide

# Load & Analisis
df = load_data('data.csv', value_col='PRS1 (m)')
results, z0 = harmonic_analysis(df, set_konstanta='UKHO')

# Prediksi 7 hari kedepan
times, values = predict_tide(df['Timestamp'].max(), df['Timestamp'].max() + pd.Timedelta(days=7), 60, results, z0)
print(values)
```

---

## Fitur Unggulan:
- **IHO Compliant Constituents**: Pilihan algoritma Harmonic Set (9 konstanta, 37 komponen, hingga UKHO).
- **Moon Phase Indicator**: Menampilkan overlay fase-fase bulan pada puncak data (Purnama / Bulan Baru) sesuai standar IHO.
- **Outlier & Spike Removal**: Modul filter otomatis untuk mendeteksi *outlier* (Z-Score) filter dan eksklusi *extremes* HAT/LAT rentang teoretis.
- **Report Generation**: Tersedia fitur Text/CSV Report dengan pembulatan presisi saintifik 3 digit desimal di belakang koma.

![BIG Tidal Tools](https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&h=450&fit=crop&blur=2)
*(Panel Ekspor Report & Datum Chart)*