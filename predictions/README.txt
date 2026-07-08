Durasi prediksi dapat ditentukan dengan 4 command line argument berikut:

--start : Menentukan waktu mulai secara kustom (Format: YYYY-MM-DD HH:MM:SS). Default: 2026-01-01 00:00:00.
--years : Menentukan durasi rentang prediksi dalam tahun.
--months : Menentukan durasi rentang prediksi dalam bulan.
--end : Menentukan waktu selesai secara kustom/spesifik (Format: YYYY-MM-DD HH:MM:SS). 
Catatan: Jika --end digunakan, opsi durasi (--years dan --months) akan diabaikan.

Jika Anda sama sekali tidak memasukkan batas waktu apapun, durasi default-nya akan secara otomatis kembali ke 19 tahun seperti sebelumnya. 
Anda juga bisa menggabungkan opsi durasi tahun dan bulan sekaligus (misalnya, --years 1 --months 6 untuk 1,5 tahun).

Contoh-contoh Penggunaan Fleksibel via CMD/Terminal:

1. Mengatur Durasi Menggunakan Tahun & Bulan

	# 12 Bulan (1 tahun) ke depan dari 2026-01-01
		python calc_prediction.py "harmonic_constants_ccap.csv" --months 12
	# 2 Tahun 6 Bulan ke depan dari 2026-01-01
		python calc_prediction.py "harmonic_constants_ccap.csv" --years 2 --months 6
		
2. Mengatur Tanggal Mulai dan Selesai Secara Kustom (Tanggal Tepat)

	# Menentukan waktu mulai hingga waktu selesai yang sangat persis / presisi
		python calc_prediction.py "harmonic_constants_ccap.csv" --start "2026-05-15 00:00:00" --end "2026-10-31 23:00:00"
		
3. Mengatur Tanggal Mulai dan Durasi

	# Mulai dari Februari 2027 selama 5 tahun
		python calc_prediction.py "harmonic_constants_ccap.csv" --start "2027-02-01 00:00:00" --years 5

Menggunakan windows batch file (run_prediction.bat)

Cara 1: Seret dan Lepas (Drag-and-Drop) — Paling Mudah Cukup drag (seret) file harmonic_constants_xxxx.csv Anda dari Windows Explorer, lalu drop (lepas) tepat di atas file run_prediction.bat. Script otomatis akan dijalankan dan file hasilnya akan langsung dibuat di folder yang sama dengan file CSV Anda (dengan akhiran _19years_prediction.csv).

Cara 2: Melalui Command Prompt / Terminal Jika Anda juga ingin memasukkan nilai Z0 khusus (karena cara drag-and-drop otomatis menggunakan Z0 = 0.0), Anda bisa menjalankannya lewat CMD:

	run_prediction.bat "path\ke\harmonic_constants_ccap.csv" 1.25
	
Contoh input file csv konstanta harmonik : input_harm_const_ccap.csv