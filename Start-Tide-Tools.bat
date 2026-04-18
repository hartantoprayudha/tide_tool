@echo off
title BIG Tidal Analysis - Quick Start
echo ===================================================
echo BIG Tidal Analysis - Setup dan Jalankan Aplikasi
echo ===================================================
echo.

:: Memeriksa apakah Node.js sudah diinstall
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] ERROR: Node.js tidak ditemukan di sistem Anda!
    echo Silakan unduh dan install Node.js terlebih dahulu dari: https://nodejs.org/
    echo Disarankan menginstal versi LTS ^(Long Term Support^).
    echo Setelah instalasi selesai, jalankan kembali file ini.
    echo.
    pause
    exit /b
)

echo [V] Node.js terdeteksi.
echo.
echo Sedang menginstal dependensi... ^(Harap tunggu beberapa saat^)
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [X] ERROR: Gagal menginstal dependensi aplikasi! 
    echo Pastikan komputer terhubung ke internet.
    echo.
    pause
    exit /b
)

echo.
echo [V] Instalasi selesai!
echo ===================================================
echo Memulai Local Server BIG Tidal Analysis...
echo Bersiap membuka browser secara otomatis...
echo.
echo JANGAN TUTUP JENDELA INI SELAMA APLIKASI SEDANG DIGUNAKAN.
echo Jika browser tidak terbuka, silakan akses manual di: http://localhost:3000
echo ===================================================
echo.

:: Buka browser secara otomatis dengan jeda 3 detik agar server sempat berjalan (background process)
start /b cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

call npm run dev

pause
