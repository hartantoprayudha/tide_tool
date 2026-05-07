import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from tide_engine import run_pipeline, export_hydras
import json
from datetime import datetime, timezone

def generate_log_text(df_raw, processed_df, config, sensor, dt_start, dt_end, gross_errors, station_id):
    """Generates the Log format like App.tsx"""
    is_cm = '(cm)' in sensor.lower()
    
    outliers_count = processed_df['isOutlier'].sum()
    valid_count = len(processed_df) - outliers_count
    
    logContent = "=========================================================\n"
    logContent += "       BIG TIDAL ANALYSIS - DATA MANIPULATION LOG        \n"
    logContent += "=========================================================\n\n"
    logContent += f"Waktu Ekspor      : {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC\n"
    logContent += f"Nama File         : Merged Data ({station_id})\n"
    logContent += f"Sensor Dipilih    : {sensor} {'(dikonversi dari cm ke m)' if is_cm else '(m)'}\n\n"
    logContent += "---------------------------------------------------------\n"
    logContent += "LANGKAH MANIPULASI (PARAMETER YANG DIGUNAKAN):\n"
    logContent += "---------------------------------------------------------\n"
    logContent += f"1. Value Offset     : {config.get('vOffset', 0)} m\n"
    logContent += f"2. Local Offset     : 0 koreksi\n"
    logContent += f"3. Scaling Factor   : 0 koreksi\n"
    logContent += f"4. Time Offset      : {config.get('tOffset', 0)} jam\n"
    logContent += f"5. Time Resampling  : otomatis berdasarkan interval data data\n"
    logContent += f"6. Deteksi Outlier  : Z-Score ({config.get('zThreshold', 3.0)}σ) | Manual Range (Off)\n"
    logContent += f"7. Set Konstanta    : {config.get('constituentSet', 'AUTO')}\n"
    logContent += f"8. De-Tiding Trend  : {config.get('isDeTiding', True)}\n"
    logContent += f"9. Smoothing Filter : {config.get('filterType', 'ma')} (Window: {config.get('filterWindow', 15)})\n"
    logContent += f"10. Combine Sensors : Tidak Aktif\n"
    logContent += f"11. Interpolasi Gaps: Aktif (Maks Gap: 15 menit)\n\n"
    
    logContent += "---------------------------------------------------------\n"
    logContent += "STATISTIK DATA:\n"
    logContent += "---------------------------------------------------------\n"
    logContent += f"Total Records Awal (Baris)       : {len(df_raw)}\n"
    logContent += f"Total Records Akhir (Resampled)  : {len(processed_df)}\n"
    logContent += f"Data Gross Error (Invalid/NaN)   : {gross_errors}\n"
    logContent += f"Data Terdeteksi Outlier          : {outliers_count}\n"
    logContent += f"Total Data Valid (Analyzed Data) : {valid_count}\n"
    logContent += f"Periode Data                     : {dt_start} sd {dt_end}\n"
    logContent += f"Status Peringatan                : Aman (Durasi mencukupi)\n"
    logContent += "=========================================================\n"
    
    return logContent

def generate_report_text(processed_df, stats, station_id):
    """Generates the Report format like App.tsx"""
    content = f"Tide Analysis Report\tMerged Data\n"
    content += f"Station Name\t{station_id}\n"
    content += "Latitude\t-\n"
    content += "Longitude\t-\n"
    
    tStart = processed_df['Timestamp'].iloc[0]
    tEnd = processed_df['Timestamp'].iloc[-1]
    durationDays = (tEnd - tStart).total_seconds() / (3600 * 24)
    
    content += f"Data Start\t{tStart.strftime('%Y-%m-%d %H:%M:%S')}\n"
    content += f"Data End\t{tEnd.strftime('%Y-%m-%d %H:%M:%S')}\n"
    content += f"Data Duration\t{durationDays:.2f} days\n"
    content += f"Generated\t{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    content += "--- CHART DATUMS & TIDAL RANGES ---\n"
    content += "Parameter\tValue\tUnit\n"
    content += f"MSL (Mean Sea Level)\t{stats['MSL']:.3f}\tm\n"
    
    am2 = next((r['amplitude'] for r in stats['constituents'] if r['name'] == 'M2'), 0)
    as2 = next((r['amplitude'] for r in stats['constituents'] if r['name'] == 'S2'), 0)
    ak1 = next((r['amplitude'] for r in stats['constituents'] if r['name'] == 'K1'), 0)
    ao1 = next((r['amplitude'] for r in stats['constituents'] if r['name'] == 'O1'), 0)
    
    tidalType = "Unknown"
    d = am2 + as2
    if d != 0:
        f = (ak1 + ao1) / d
        if f <= 0.25: tidalType = "Semi-diurnal (Pasang Surut Ganda)"
        elif f <= 1.5: tidalType = "Mixed, mainly semi-diurnal (Campuran Condong Ganda)"
        elif f <= 3.0: tidalType = "Mixed, mainly diurnal (Campuran Condong Tunggal)"
        else: tidalType = "Diurnal (Pasang Surut Tunggal)"
        
    meanSpringTide = 2 * (am2 + as2)
    meanNeapTide = 2 * abs(am2 - as2)
    maxAstroRange = stats['HAT'] - stats['LAT']
    
    content += f"HAT (Highest Astronomical Tide)\t{stats['HAT']:.3f}\tm\n"
    content += f"MHWS (Mean High Water Springs)\t{stats['MHWS']:.3f}\tm\n"
    content += f"MLWS (Mean Low Water Springs)\t{stats['MLWS']:.3f}\tm\n"
    content += f"LAT (Lowest Astronomical Tide)\t{stats['LAT']:.3f}\tm\n"
    content += f"Mean Spring Tide\t{meanSpringTide:.3f}\tm\n"
    content += f"Mean Neap Tide\t{meanNeapTide:.3f}\tm\n"
    content += f"Maximum Astronomical Tidal Range\t{maxAstroRange:.3f}\tm\n"
    content += f"Tidal Type (Formzahl)\t{tidalType}\t-\n"
    
    return content

def bulk_process(input_folder="."):
    # Mendukung file CSV dan TXT
    input_files = [f for f in os.listdir(input_folder) if f.lower().endswith(('.csv', '.txt'))]
    
    if not input_files:
        print("Tidak ada file CSV atau TXT ditemukan di direktori saat ini.")
        return

    print("Menggabungkan file data...")
    all_rows = []
    potential_sensors = []
    
    for input_file in input_files:
        ext = os.path.splitext(input_file)[1].lower()
        if ext == '.csv':
            df_curr = pd.read_csv(input_file)
            if not potential_sensors:
                potential_sensors = [col for col in df_curr.columns[1:] if 'sensor' in col.lower() or 'prs' in col.lower() or 'radar' in col.lower()]
                if not potential_sensors: potential_sensors = [df_curr.columns[1]]
            df_curr = df_curr[['Timestamp', potential_sensors[0]]] # Keep only timestamp and the sensor value
            all_rows.append(df_curr)
        else:
            with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            rows = []
            for line in lines:
                parts = line.strip().split()
                if len(parts) >= 2:
                    val = parts[-1]
                    ts = " ".join(parts[:-1])
                    rows.append({'Timestamp': ts, 'Value': val})
            if not potential_sensors: potential_sensors = ['Value']
            all_rows.append(pd.DataFrame(rows))
            
    df_raw = pd.concat(all_rows, ignore_index=True)
    sensor = potential_sensors[0] if potential_sensors else 'Value'
    
    print(f"Data tergabung: {len(df_raw)} baris. Memulai analisis...")
    
    first_filename = os.path.basename(input_files[0])
    station_id = first_filename[4:8] if len(first_filename) >= 14 else "merged"
    
    base_out = f"output_{station_id.lower()}"
    folders = ["hydras", "csv_export", "report", "log", "constants", "charts"]
    for f in folders:
        os.makedirs(os.path.join(base_out, f), exist_ok=True)
        
    config = {
        'zThreshold': 3.0,
        'filterType': 'ma',
        'filterWindow': 15,
        'constituentSet': 'AUTO',
        'vOffset': 0.0,
        'tOffset': 0.0,
        'isDeTiding': True
    }
    
    try:
        from tide_engine import parse_dates
        parsed_dates = parse_dates(df_raw['Timestamp'])
        gross_errors = parsed_dates.isna().sum()
        
        processed_df, stats, err = run_pipeline(df_raw.copy(), sensor, config)
        
        if err:
            print(f"[!] Error processing data: {err}")
            return
            
        dt_start = processed_df['Timestamp'].iloc[0].strftime('%Y-%m-%d %H:%M:%S')
        dt_end = processed_df['Timestamp'].iloc[-1].strftime('%Y-%m-%d %H:%M:%S')
        
        log_path = os.path.join(base_out, "log", f"tidal_analysis_log_{station_id}_{datetime.now().strftime('%Y%m%d_%H%M')}.txt")
        with open(log_path, 'w', encoding='utf-8') as log_f:
            log_f.write(generate_log_text(df_raw, processed_df, config, sensor, dt_start, dt_end, gross_errors, station_id))
            
        report_path = os.path.join(base_out, "report", f"tide_analysis_report_{station_id}.txt")
        with open(report_path, 'w', encoding='utf-8') as rep_f:
            rep_f.write(generate_report_text(processed_df, stats, station_id))
            
        hydras_path = os.path.join(base_out, "hydras", f"{station_id}_hydras.txt")
        export_hydras(processed_df, station_id, sensor, hydras_path)
        
        export_csv_path = os.path.join(base_out, "csv_export", f"{station_id}_export.csv")
        processed_df.to_csv(export_csv_path, index=False)
        
        const_df = pd.DataFrame(stats['constituents'])
        const_csv_path = os.path.join(base_out, "constants", f"harmonic_constants_{station_id}.csv")
        const_df.to_csv(const_csv_path, index=False)
        
        # Calculate trendline
        t0 = processed_df['Timestamp'].iloc[0]
        t_hours = (processed_df['Timestamp'] - t0).dt.total_seconds() / 3600.0
        trendline = stats['Z0'] + stats['slope'] * t_hours
        
        plt.figure(figsize=(12, 6))
        plt.plot(processed_df['Timestamp'], processed_df['Filtered'], label='Valid', color='#ec7017', linewidth=2)
        plt.plot(processed_df['Timestamp'], trendline, label='Sea Level Trend', color='#ef4444', linestyle='--', linewidth=2)
        plt.title(f"{station_id}")
        plt.xlabel("Time")
        plt.ylabel("Water Level (m)")
        plt.legend()
        plt.grid(True, alpha=0.3)
        plot_img_path = os.path.join(base_out, "charts", f"{station_id}_plot.png")
        plt.savefig(plot_img_path)
        plt.close()
        
        plot_data_path = os.path.join(base_out, "charts", f"{station_id}_plot_data.csv")
        processed_df[['Timestamp', 'raw', 'Filtered']].to_csv(plot_data_path, index=False)

        print(f"[OK] Selesai. Seluruh dataset telah digabung. Hasil disimpan di: {base_out}")

    except Exception as ex:
        print(f"[X] Gagal memproses data: {str(ex)}")

if __name__ == "__main__":
    bulk_process()

