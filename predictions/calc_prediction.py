import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import argparse
import sys
import os

def get_astronomical_args(year):
    # centuries from J2000 (2000-01-01 12:00:00 UTC)
    target = datetime(year, 1, 1, 0, 0, 0)
    epoch = datetime(2000, 1, 1, 12, 0, 0)
    d = (target - epoch).total_seconds() / 86400.0
    T = d / 36525.0
    
    s = (218.3164 + 481267.8813 * T) % 360.0
    h = (280.4661 + 36000.7698 * T) % 360.0
    p = (83.3535 + 4069.0137 * T) % 360.0
    N = (125.0445 - 1934.1363 * T) % 360.0
    
    tau = (180.0 + h - s) % 360.0
    return tau, s, h, p, N

def get_v0(freq, tau, s, h, p, N, name):
    rates = [
        14.4920521 / 360.0,
        0.5490165 / 360.0,
        0.0410686 / 360.0,
        0.0046418 / 360.0,
        -0.0022064 / 360.0
    ]
    rem = freq
    v0 = 0.0
    args = [tau, s, h, p, N]
    for i in range(5):
        d = round(rem / rates[i])
        rem -= d * rates[i]
        v0 += d * args[i]
        
    shifts = {
        'K1': -90.0, 'O1': 90.0, 'P1': 90.0, 'Q1': 90.0, 'J1': -90.0, 'OO1': -90.0,
        'M1': -90.0, 'PI1': 90.0, 'RHO1': 90.0, '2Q1': 90.0, 'SIG1': 90.0, 
        'TAU1': -90.0, 'CHI1': -90.0, 'THE1': -90.0, 'SO1': 90.0, 'L2': 180.0
    }
    v0 += shifts.get(name, 0.0)
    return v0 % 360.0

def get_nodal_corrections(N, name):
    N_rad = N * np.pi / 180.0
    u = 0.0
    f = 1.0
    sinN = np.sin(N_rad)
    cosN = np.cos(N_rad)
    sin2N = np.sin(2 * N_rad)
    cos2N = np.cos(2 * N_rad)
    
    if name in ['O1', 'Q1', '2Q1', 'RHO1', 'SIG1']:
        u = 10.8 * sinN - 1.3 * sin2N
        f = 1.0089 + 0.1871 * cosN - 0.0147 * cos2N
    elif name in ['K1', 'J1', 'SO1', 'CHI1']:
        u = -8.8 * sinN + 1.1 * sin2N
        f = 1.0060 + 0.1150 * cosN - 0.0088 * cos2N
    elif name == 'OO1':
        u = -10.8 * sinN + 1.3 * sin2N
        f = 1.043 + 0.414 * cosN
    elif name in ['M2', 'N2', '2N2', 'MU2', 'NU2', 'LAM2', 'L2']:
        u = -2.1 * sinN
        f = 1.0004 - 0.0373 * cosN + 0.0002 * cos2N
    elif name == 'K2':
        u = -17.7 * sinN + 0.6 * sin2N
        f = 1.0241 + 0.2863 * cosN + 0.0083 * cos2N
    elif name == 'Mm':
        u = 0.0
        f = 1.0000 - 0.1300 * cosN
    elif name == 'Mf':
        u = -23.7 * sinN + 2.7 * sin2N
        f = 1.043 + 0.414 * cosN
    elif name == 'M3':
        u = -3.1 * sinN
        f = 1.0000 - 0.056 * cosN
    elif name in ['M4', 'MN4']:
        u = -4.2 * sinN
        f_m2 = 1.0004 - 0.0373 * cosN + 0.0002 * cos2N
        f = f_m2 * f_m2
    elif name == 'M6':
        u = -6.3 * sinN
        f_m2 = 1.0004 - 0.0373 * cosN + 0.0002 * cos2N
        f = f_m2 ** 3
    elif name == 'M8':
        u = -8.4 * sinN
        f_m2 = 1.0004 - 0.0373 * cosN + 0.0002 * cos2N
        f = f_m2 ** 4
    elif name == 'MS4':
        u = -2.1 * sinN
        f = 1.0004 - 0.0373 * cosN + 0.0002 * cos2N
    elif name == 'MK3':
        u = -2.1 * sinN - 8.8 * sinN + 1.1 * sin2N
        f_m2 = 1.0004 - 0.0373 * cosN + 0.0002 * cos2N
        f_k1 = 1.0060 + 0.1150 * cosN - 0.0088 * cos2N
        f = f_m2 * f_k1
    elif name == '2MK3':
        u = -4.2 * sinN - 8.8 * sinN + 1.1 * sin2N
        f_m2 = 1.0004 - 0.0373 * cosN + 0.0002 * cos2N
        f_k1 = 1.0060 + 0.1150 * cosN - 0.0088 * cos2N
        f = f_m2 * f_m2 * f_k1
        
    return f, u

def predict_tide(start_date, end_date, z0, constituents):
    '''
    start_date: datetime object
    end_date: datetime object
    z0: float, mean sea level / datum offset
    constituents: list of dicts with 'name', 'amplitude', 'phase' (Greenwich phase g), 'frequency'
    '''
    # Generate timestamp series (freq='1h' works in pandas, 'h' is also fine)
    try:
        timestamps = pd.date_range(start=start_date, end=end_date, freq='1h', inclusive='left')
    except TypeError:
        # Fallback for older pandas versions
        timestamps = pd.date_range(start=start_date, end=end_date, freq='1h', closed='left')
    
    all_predictions = []
    
    start_year = start_date.year
    end_year = end_date.year
    
    for year in range(start_year, end_year + 1):
        year_mask = timestamps.year == year
        if not year_mask.any():
            continue
            
        t_year = timestamps[year_mask]
        
        # Calculate astronomical arguments for this year
        tau, s, h, p, n_astro = get_astronomical_args(year)
        ref_time = datetime(year, 1, 1, 0, 0, 0)
        
        # Hours since start of the year
        t_hours = (t_year - ref_time).total_seconds() / 3600.0
        
        y_pred = np.full(len(t_year), z0)
        
        for const in constituents:
            name = const['name']
            amp = const['amplitude']
            g = const['phase']
            freq = const['frequency']
            
            w = 2 * np.pi * freq
            
            v0 = get_v0(freq, tau, s, h, p, n_astro, name)
            f_nodal, u_nodal = get_nodal_corrections(n_astro, name)
            
            # Equation: p(t) = f * A * cos(w*t + V0 + u - g)
            phase_rad = np.radians(v0 + u_nodal - g)
            
            y_pred += f_nodal * amp * np.cos(w * t_hours + phase_rad)
            
        all_predictions.extend(y_pred)
        
    df = pd.DataFrame({
        'Timestamp (UTC)': timestamps,
        'SeaLevel': all_predictions[:len(timestamps)]
    })
    
    return df

def main():
    parser = argparse.ArgumentParser(description='Calculate tide prediction from harmonic constants CSV')
    parser.add_argument('input_csv', help='Input CSV file containing harmonic constants (e.g., harmonic_constants_xxxx.csv)')
    parser.add_argument('--z0', type=float, default=0.0, help='Mean sea level (Z0) offset. Default is 0.0.')
    parser.add_argument('--start', type=str, default='2026-01-01 00:00:00', help='Start date (YYYY-MM-DD HH:MM:SS). Default is 2026-01-01 00:00:00.')
    parser.add_argument('--end', type=str, help='End date (YYYY-MM-DD HH:MM:SS). If provided, overrides --years and --months.')
    parser.add_argument('--years', type=int, default=0, help='Duration of prediction in years.')
    parser.add_argument('--months', type=int, default=0, help='Duration of prediction in months.')
    parser.add_argument('--output', '-o', default='out_pred_BIG.csv', help='Output CSV file name')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_csv):
        print(f"Error: Input file {args.input_csv} does not exist.")
        sys.exit(1)
        
    try:
        df_const = pd.read_csv(args.input_csv)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)
        
    # Check if necessary columns are present
    required_cols = ['name', 'amplitude', 'phase', 'frequency']
    if not all(col in df_const.columns for col in required_cols):
        print(f"Error: CSV file must contain the following columns: {required_cols}")
        sys.exit(1)
        
    constituents = df_const.to_dict('records')
        
    # Filter for BIG9 constituents as requested
    big9_names = ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4']
    filtered_constituents = [c for c in constituents if c['name'] in big9_names]
    
    if len(filtered_constituents) == 0:
        print("Error: No BIG9 constituents found in the input CSV.")
        sys.exit(1)
        
    print(f"Using {len(filtered_constituents)} constituents for prediction: {[c['name'] for c in filtered_constituents]}")
    
    start_date = pd.to_datetime(args.start)
    
    if args.end:
        end_date = pd.to_datetime(args.end)
    else:
        if args.years == 0 and args.months == 0:
            # Default to 19 years if neither end_date, years, nor months are specified
            args.years = 19
        end_date = start_date + pd.DateOffset(years=args.years, months=args.months)
        
    print(f"Starting prediction from {start_date} to {end_date}...")
    df_pred = predict_tide(start_date, end_date, args.z0, filtered_constituents)
    
    df_pred.to_csv(args.output, index=False)
    print(f"Prediction successfully saved to {args.output}")

if __name__ == "__main__":
    main()
