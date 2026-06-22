@echo off
title Tide Analysis Bulk Processor
echo ======================================================
echo       Tide Analysis Bulk Processor (App.tsx Pipeline)
echo ======================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak ditemukan. Harap instal Python terlebih dahulu.
    pause
    exit /b
)

:: Install check dependencies
echo Checking dependencies...
python -m pip install pandas numpy scipy matplotlib >nul 2>&1

:: Run the script
echo Starting bulk processing...
python run_bulk_analysis.py

echo.
echo ======================================================
echo Proses selesai. Silakan periksa folder 'Output_*'
echo ======================================================
pause
