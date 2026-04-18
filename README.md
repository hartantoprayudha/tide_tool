# BIG Tidal Analysis - Marine Tide Analytics

**Badan Informasi Geospasial (BIG)**
Direktorat Sistem Referensi Geospasial

Aplikasi BIG Tidal Analysis adalah platform analisis deret waktu pasang surut air laut yang dirancang untuk memproses data dari berbagai sensor tekanan (CSV data) dan memberikan hasil analisis harmonik presisi, ekspor datum, serta prediksi masa depan.

<img width="2878" height="1080" alt="Screenshot 2026-04-18 115643" src="https://github.com/user-attachments/assets/6ff47a4f-5a0b-4632-82a2-8a8753a3f570" />

---

## Unduh Contoh Data Observasi 

Untuk mulai menggunakan aplikasi ini, Anda dapat mengunduh format contoh data CSV pasut laut yang telah kami sediakan:
[📥 Unduh Contoh Data Pasut (CSV)](/examples/combined.csv)

---

## 1. Quick Start Local Server (Untuk Pengguna Pemula)

Bagi pengguna OS Windows yang ingin menjalankan seluruh aplikasi ini secara lokal di PC masing-masing (tanpa API, tanpa server luar):

1. **Unduh (Clone) / Download ZIP** dari repository ini.
2. Pastikan komputer Anda telah terinstal **Node.js** versi stabil.
3. Klik ganda pada berkas **`Start-Tide-Tools.bat`**.
4. Sistem otomatis akan mengunduh seluruh dependensi (*Node.js runtime*) dan seketika membuka antarmuka BIG Tidal Analytics langsung di browser Anda secara *offline* (`http://localhost:3000`).

---

## 2. Petunjuk Penggunaan (WebApp Dashboard)

- **Akses Dashboard**: Cukup memuat file observasi Anda berformat `.csv` (memiliki kolom Timestamp & Sensor).
- **Interactive Toggles**: Pada bagian grafik/chart, Anda dapat mengklik legenda (contoh: *Analyzed Level* atau *Prediction*) untuk menampilkan atau menyembunyikannya.
- **Prediksi Interaktif**: Terdapat panel prediction yang bisa dikalkulasi berdasarkan set konstanta harmonik (misal: UKHO, 9 Constants, dll). Grafik prediksi maksimal dirender s/d 1 tahun untuk menjaga performa (HW Accel by default).

![Prediction & Filter Module](https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&h=450&fit=crop&blur=2)
*(Ilustrasi Panel Filter Data & Visualisasi Prediksi Harmonik)*

---

## 3. Petunjuk Penggunaan (Local Script / Batching)

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

## 4. Integrasi Sistem (Web API)

Untuk kebutuhan automasi *pipeline* data geospasial, sistem *machine learning*, atau integrasi ke dasbor eksternal, BIG Tidal Analysis menyediakan jalur Web API (Representational State Transfer). 

**Endpoint Master URL**:  
`https://ais-dev-d64oxxolfthvib2joscfyr-733612432639.asia-east1.run.app/api/analyze`

![Web API & JSON Response](https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&h=450&fit=crop&blur=2)
*(Ilustrasi console terminal dalam mengakses Web API BIG Tidal Analysis)*

### Alur Eksekusi API
Fungsi API ini menerima data deret waktu format CSV murni, memproses nilai harmoniknya di sisi server (Backend), lalu mengembalikan respon datum dan amplitudo secara terstruktur dalam format `JSON`.

**Contoh Pemanggilan via Console (cURL):**
```bash
# Upload file CSV observasi untuk mendapatkan respon JSON
curl -X POST https://ais-dev-d64oxxolfthvib2joscfyr-733612432639.asia-east1.run.app/api/analyze \
  -H "Authorization: Bearer <API_KEY_ANDA>" \
  -F "file=@data_observasi_pasut.csv" \
  -F "constituents=9"
```

**Struktur Respon (JSON Array):**
```json
{
  "status": "success",
  "data_points": 744,
  "datum": {
    "msl": 1.205,
    "hat": 2.450,
    "lat": 0.150
  },
  "constituents": [
    {"comp": "M2", "amp": 0.855, "phase": 120.450},
    {"comp": "S2", "amp": 0.342, "phase": 145.210}
  ],
  "message": "Harmonic mapping completed successfully"
}
```

![Integrasi Backend API](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&h=450&fit=crop&blur=2)
*(Ilustrasi integrasi arsitektur Backend Data Center)*

---

## 5. Referensi Ilmiah (Low-Pass Filter)

Bagi peneliti, surveyor, dan akademia yang membutuhkan landasan teori (*scientific background*) terkait metode pemulusan kurva muka laut yang diaplikasikan pada modul dasbor `Filter Data`, kami telah merangkum literatur jurnal akademisnya. Silakan unduh referensi PDF berikut:

- [📄 Jurnal: Moving Average untuk Tide Filtering (PDF)](/References/Moving_Average_Method.pdf)
- [📄 Jurnal: Median Filtering untuk Outlier Removal (PDF)](/References/Median_Filter_Method.pdf)
- [📄 Jurnal: Low-Pass Butterworth Filter di Oseanografi (PDF)](/References/Butterworth_Filter_Method.pdf)

---

## Fitur Unggulan:
- **IHO Compliant Constituents**: Pilihan algoritma Harmonic Set (9 konstanta, 37 komponen, hingga UKHO).
- **Moon Phase Indicator**: Menampilkan overlay fase-fase bulan pada puncak data (Purnama / Bulan Baru) sesuai standar IHO.
- **Outlier & Spike Removal**: Modul filter otomatis untuk mendeteksi *outlier* (Z-Score) filter dan eksklusi *extremes* HAT/LAT rentang teoretis.
- **Report Generation**: Tersedia fitur Text/CSV Report dengan pembulatan presisi saintifik 3 digit desimal di belakang koma.

![BIG Tidal Tools](https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&h=450&fit=crop&blur=2)
*(Panel Ekspor Report & Datum Chart)*