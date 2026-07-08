@echo off
setlocal

:: Cek apakah ada file input yang diberikan
if "%~1"=="" (
    echo =======================================================
    echo CARA PENGGUNAAN:
    echo =======================================================
    echo run_prediction.bat "path\ke\harmonic_constants_xxxx.csv" [Z0]
    echo.
    echo Contoh: run_prediction.bat "harmonic_constants_ccap.csv" 1.25
    echo.
    echo TIPS: Anda juga bisa men-drag-and-drop (seret dan lepas) 
    echo file CSV ke atas file batch ini!
    echo =======================================================
    pause
    exit /b
)

set "INPUT_CSV=%~1"
set "OUTPUT_CSV=%~dpn1_19years_prediction.csv"
set "Z0=0.0"

:: Jika argumen kedua (Z0) diberikan, gunakan nilai tersebut
if not "%~2"=="" (
    set "Z0=%~2"
)

echo =======================================================
echo MEMULAI PREDIKSI PASANG SURUT (19 TAHUN)
echo =======================================================
echo File Input  : %INPUT_CSV%
echo Z0 (MSL)    : %Z0%
echo File Output : %OUTPUT_CSV%
echo -------------------------------------------------------

:: Memanggil script python yang berada di folder yang sama dengan batch file ini (%~dp0)
python "%~dp0calc_prediction.py" "%INPUT_CSV%" --z0 %Z0% --output "%OUTPUT_CSV%"

if %ERRORLEVEL% EQU 0 (
    echo -------------------------------------------------------
    echo SUKSES: Prediksi berhasil disimpan!
) else (
    echo -------------------------------------------------------
    echo GAGAL: Terjadi kesalahan saat melakukan prediksi.
)
echo =======================================================

pause
