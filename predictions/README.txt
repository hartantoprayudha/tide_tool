# Menjalankan script menggunakan file CSV
	python calc_prediction.py "DATA_PANJANG\0001ccap01\output_ccap\constants\harmonic_constants_ccap.csv" --output "hasil_prediksi_ccap.csv"

# Jika Anda ingin memasukkan nilai Z0 (misalnya 1.25 meter)
	python calc_prediction.py "DATA_PANJANG\0001ccap01\output_ccap\constants\harmonic_constants_ccap.csv" --z0 1.25 --output "hasil_prediksi_ccap.csv"

Menggunakan windows batch file (run_prediction.bat)

Cara 1: Seret dan Lepas (Drag-and-Drop) — Paling Mudah Cukup drag (seret) file harmonic_constants_xxxx.csv Anda dari Windows Explorer, lalu drop (lepas) tepat di atas file run_prediction.bat. Script otomatis akan dijalankan dan file hasilnya akan langsung dibuat di folder yang sama dengan file CSV Anda (dengan akhiran _19years_prediction.csv).

Cara 2: Melalui Command Prompt / Terminal Jika Anda juga ingin memasukkan nilai Z0 khusus (karena cara drag-and-drop otomatis menggunakan Z0 = 0.0), Anda bisa menjalankannya lewat CMD:

	run_prediction.bat "path\ke\harmonic_constants_ccap.csv" 1.25
	
Contoh input file csv konstanta harmonik : input_harm_const_ccap.csv