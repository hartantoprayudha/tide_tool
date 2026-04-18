# TideScript - Marine Tide Analytics

TideScript adalah aplikasi analisis deret waktu pasang surut air laut yang dirancang untuk memproses data dari berbagai sensor tekanan dan memberikan hasil analisis harmonik serta prediksi masa depan.

---

## 1. Petunjuk Penggunaan (Local Script)
Bagi Anda yang ingin menjalankan analisis langsung di komputer tanpa antarmuka web.

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
results, z0 = harmonic_analysis(df, num_components=9)

# Prediksi 7 hari kedepan
times, values = predict_tide(df['Timestamp'].max(), df['Timestamp'].max() + pd.Timedelta(days=7), 60, results, z0)
print(values)
```

---

## 2. Petunjuk Penggunaan (API)
Aplikasi ini berjalan sebagai Single Page Application (SPA). Jika Anda ingin mengintegrasikannya ke sistem lain via web:

1. **Upload**: Kirim file CSV Anda melalui antarmuka web untuk diproses di sisi klien.
2. **Export**: Klik tombol **Export CSV** atau **Generate Text Report** untuk mendapatkan hasil analisis dalam format terstruktur yang siap digunakan oleh API/Sistem lain.

---

## Fitur Unggulan:
- **Auto-Sensor Detection**: Mendeteksi kolom `(m)` dan `Timestamp` secara otomatis.
- **Smart Filtering**: Pilihan algoritma Moving Average, Median, dan Butterworth.
- **Performance Optimized**: 
  - Tampilan dashboard menggunakan cuplikan data per jam.
  - Untuk prediksi > 1 tahun, grafik hanya menampilkan nilai harian (pasang tertinggi & surut terendah) agar tetap ringan.
- **Customization**: Nama grafik dapat diubah sesuai kebutuhan pengguna.
