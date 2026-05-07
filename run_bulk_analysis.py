import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from tide_engine import run_pipline, export_hydras
import json
from datetime import datetime

def bulk_process(input_folder="."):
    csv_files = [f for f in os.listdir(input_folder) if f.lower().endswith('.csv')]
    
    if not csv_files:
        print("Tidak ada file CSV ditemukan di direktori saat ini.")
        return

    for csv_file in csv_files:
        filename_no_ext = os.path.splitext(csv_file)[0]
        print(f"\n[STEP] Memproses file: {csv_file}")
        
        try:
            # Load raw data to identify sensors
            df_raw = pd.read_csv(csv_file)
            # Sensors are usually columns other than Timestamp (col 0)
            potential_sensors = [col for col in df_raw.columns[1:] if 'sensor' in col.lower() or 'prs' in col.lower() or 'radar' in col.lower()]
            if not potential_sensors:
                # Fallback: take first numerical column after index 0
                potential_sensors = [df_raw.columns[1]]
            
            for sensor in potential_sensors:
                print(f"      -> Menganalisis sensor: {sensor}")
                
                # Setup output directories
                base_out = f"Output_{filename_no_ext}_{sensor.replace(' ', '_')}"
                folders = ["Hydras", "CSV_Export", "Report", "Log", "Constants", "Charts"]
                for f in folders:
                    os.makedirs(os.path.join(base_out, f), exist_ok=True)
                
                # Logs
                log_path = os.path.join(base_out, "Log", "processing.log")
                with open(log_path, 'w') as log_f:
                    log_f.write(f"Processing started at {datetime.now()}\n")
                    log_f.write(f"File: {csv_file}\n")
                    log_f.write(f"Sensor: {sensor}\n")

                # Run Pipeline
                config = {
                    'zThreshold': 3.0,
                    'filterType': 'ma',
                    'filterWindow': 15,
                    'constituentSet': 'AUTO',
                    'vOffset': 0.0,
                    'tOffset': 0.0,
                    'isDeTiding': True
                }
                
                processed_df, stats, err = run_pipline(df_raw.copy(), sensor, config)
                
                if err:
                    with open(log_path, 'a') as log_f:
                        log_f.write(f"ERROR: {err}\n")
                    print(f"      [!] Skip: {err}")
                    continue
                
                # 1. Export Hydras
                hydras_path = os.path.join(base_out, "Hydras", f"{filename_no_ext}_hydras.txt")
                export_hydras(processed_df, filename_no_ext, sensor, hydras_path)
                
                # 2. Export CSV
                export_csv_path = os.path.join(base_out, "CSV_Export", f"{filename_no_ext}_export.csv")
                processed_df.to_csv(export_csv_path, index=False)
                
                # 3. Report & Harmonic Constants
                report_path = os.path.join(base_out, "Report", "analysis_report.json")
                with open(report_path, 'w') as rep_f:
                    json.dump(stats, rep_f, indent=4)
                
                const_df = pd.DataFrame(stats['constituents'])
                const_csv_path = os.path.join(base_out, "Constants", "harmonic_constants.csv")
                const_df.to_csv(const_csv_path, index=False)
                
                # 4. Plot (Image)
                plt.figure(figsize=(12, 6))
                plt.plot(processed_df['Timestamp'], processed_df['raw'], label='Raw (Incl. Outliers)', color='gray', alpha=0.3)
                plt.plot(processed_df['Timestamp'], processed_df['Filtered'], label='Valid & Filtered', color='blue', linewidth=1.5)
                plt.title(f"Tide Analysis: {filename_no_ext} ({sensor})")
                plt.xlabel("Time")
                plt.ylabel("Water Level (m)")
                plt.legend()
                plt.grid(True, alpha=0.3)
                plot_img_path = os.path.join(base_out, "Charts", f"{filename_no_ext}_plot.png")
                plt.savefig(plot_img_path)
                plt.close()
                
                # 5. Plot Data (CSV format as requested)
                plot_data_path = os.path.join(base_out, "Charts", f"{filename_no_ext}_plot_data.csv")
                processed_df[['Timestamp', 'raw', 'Filtered']].to_csv(plot_data_path, index=False)

                with open(log_path, 'a') as log_f:
                    log_f.write(f"Success at {datetime.now()}\n")
                print(f"      [OK] Selesai. Hasil disimpan di: {base_out}")

        except Exception as ex:
            print(f"      [X] Gagal memproses {csv_file}: {str(ex)}")

if __name__ == "__main__":
    bulk_process()
