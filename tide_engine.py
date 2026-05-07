import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import scipy.signal as signal
from scipy.optimize import curve_fit
import os
import json

# --- CONSTANTS (Mirrored from App.tsx) ---
HARMONIC_FREQS = {
    'M2': {'f': 0.080511401, 'd': 'Principal lunar semidiurnal'},
    'S2': {'f': 0.083333333, 'd': 'Principal solar semidiurnal'},
    'K1': {'f': 0.041780746, 'd': 'Luni-solar diurnal'},
    'O1': {'f': 0.038730654, 'd': 'Lunar diurnal'},
    'N2': {'f': 0.078999249, 'd': 'Larger lunar elliptic semidiurnal'},
    'K2': {'f': 0.083561492, 'd': 'Luni-solar semidiurnal'},
    'P1': {'f': 0.041552587, 'd': 'Solar diurnal'},
    'M4': {'f': 0.161022801, 'd': 'Shallow water overtides of principal lunar'},
    'MS4': {'f': 0.163844734, 'd': 'Shallow water constituent'},
    'Q1': {'f': 0.037218503, 'd': 'Larger lunar elliptic diurnal'},
    'J1': {'f': 0.043292898, 'd': 'Smaller lunar elliptic diurnal'},
    'OO1': {'f': 0.044830840, 'd': 'Lunar diurnal'},
    '2N2': {'f': 0.077487098, 'd': 'Lunar semidiurnal'},
    'MU2': {'f': 0.077689470, 'd': 'Variational'},
    'NU2': {'f': 0.079201621, 'd': 'Lunar semidiurnal'},
    'L2': {'f': 0.082023552, 'd': 'Smaller lunar elliptic semidiurnal'},
    'T2': {'f': 0.083219261, 'd': 'Principal solar'},
    'S4': {'f': 0.166666667, 'd': 'Solar semidiurnal overtide'},
    'M6': {'f': 0.241534202, 'd': 'Lunar semidiurnal overtide'},
    'S6': {'f': 0.250000000, 'd': 'Solar semidiurnal overtide'},
    'MN4': {'f': 0.159510646, 'd': 'Shallow water quarter diurnal'},
    'MSf': {'f': 0.002821933, 'd': 'Lunisolar synodic fortnightly'},
    'Mf': {'f': 0.003050013, 'd': 'Lunar fortnightly'},
    'Mm': {'f': 0.001512151, 'd': 'Lunar monthly'},
    'Ssa': {'f': 0.000228159, 'd': 'Solar semi-annual'},
    'Sa': {'f': 0.000114079, 'd': 'Solar annual'},
    'RHO1': {'f': 0.034661706, 'd': 'Larger lunar elliptic diurnal'},
    'M1': {'f': 0.040268595, 'd': 'Smaller lunar elliptic diurnal'},
    'PI1': {'f': 0.041438515, 'd': 'Solar diurnal'},
    '2Q1': {'f': 0.035706434, 'd': 'Elliptic diurnal'},
    '2SM2': {'f': 0.086155266, 'd': 'Shallow water semidiurnal'},
    'M3': {'f': 0.120767102, 'd': 'Lunar terdiurnal'},
    'M8': {'f': 0.322045602, 'd': 'Shallow water eighth diurnal'},
    '2MK3': {'f': 0.122292147, 'd': 'Shallow water terdiurnal'},
    'S1': {'f': 0.041666672, 'd': 'Solar diurnal'}
    # (Simplified for the tool, but covers most common ones)
}

def parse_dates(ts_col):
    """Replicates flexible date parsing from App.tsx"""
    fmts = [
        '%d/%m/%Y %H:%M:%S', '%d/%m/%Y %H:%M', 
        '%d-%m-%Y %H:%M:%S', '%d-%m-%Y %H:%M',
        '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M',
        '%d%m%Y %H:%M', '%d%m%Y %H%M', '%d/%m/%Y %H.%M'
    ]
    
    parsed = pd.to_datetime(ts_col, errors='coerce')
    mask = parsed.isna()
    if mask.any():
        for fmt in fmts:
            if not mask.any(): break
            batch = pd.to_datetime(ts_col[mask], format=fmt, errors='coerce')
            parsed[mask] = batch
            mask = parsed.isna()
    return parsed

def solve_least_squares(t_hours, y_vals, comps):
    """Matrix solver for harmonic analysis (OLS)"""
    n = len(t_hours)
    # A = [1, t, cos(w1t), sin(w1t), ...]
    cols = [np.ones(n), t_hours]
    for c in comps:
        w = 2 * np.pi * HARMONIC_FREQS[c]['f']
        cols.append(np.cos(w * t_hours))
        cols.append(np.sin(w * t_hours))
    
    A = np.column_stack(cols)
    res = np.linalg.lstsq(A, y_vals, rcond=None)[0]
    return res

def run_pipline(df, sensor_name, config=None):
    """
    Consolidated pipeline exactly matching App.tsx logic.
    config keys: zThreshold, filterType, filterWindow, constituentSet, etc.
    """
    if config is None:
        config = {
            'zThreshold': 3.0,
            'filterType': 'ma',
            'filterWindow': 15,
            'constituentSet': 'AUTO',
            'vOffset': 0.0,
            'tOffset': 0.0,
            'isDeTiding': True
        }

    # 1. Parsing & Offset
    df['Timestamp'] = parse_dates(df.iloc[:, 0])
    df = df.dropna(subset=['Timestamp']).sort_values('Timestamp').reset_index(drop=True)
    
    # Handle cm to m
    is_cm = 'cm' in sensor_name.lower()
    y = pd.to_numeric(df[sensor_name], errors='coerce')
    if is_cm:
        y = y / 100.0
    
    y = y + config.get('vOffset', 0.0)
    df['raw'] = y.round(3)
    
    # Time offset
    if config.get('tOffset', 0) != 0:
        df['Timestamp'] = df['Timestamp'] + pd.to_timedelta(config['tOffset'], unit='h')

    # 2. Regularization
    # Calculate median dt
    dts = df['Timestamp'].diff().dropna().dt.total_seconds() * 1000
    dt_ms = dts.median() if not dts.empty else 60000
    if np.isnan(dt_ms) or dt_ms <= 0: dt_ms = 60000
    
    start_t = df['Timestamp'].iloc[0]
    end_t = df['Timestamp'].iloc[-1]
    ref_range = pd.date_range(start=start_t, end=end_t, freq=pd.Timedelta(milliseconds=dt_ms))
    
    df_reg = pd.DataFrame({'Timestamp': ref_range})
    df_reg = pd.merge_asof(df_reg, df[['Timestamp', 'raw']], on='Timestamp', tolerance=pd.Timedelta(milliseconds=dt_ms/2), direction='nearest')
    
    # 3. Gross Error (1hr flatline)
    # Replicating logic: if flat for > 1hr, mark as NaN
    consecutive_limit = int(3600000 / dt_ms)
    val = df_reg['raw'].values
    mask_flat = np.zeros(len(val), dtype=bool)
    
    i = 0
    while i < len(val):
        j = i + 1
        while j < len(val) and not np.isnan(val[i]) and val[j] == val[i]:
            j += 1
        if (j - i) > consecutive_limit:
            mask_flat[i:j] = True
        i = j
    df_reg.loc[mask_flat, 'raw'] = np.nan
    
    # 4. Outlier Detection (2-Pass)
    valid_idx = ~df_reg['raw'].isna()
    if valid_idx.sum() < 2:
        return df_reg, None, "Insufficient data"
        
    t_hours = (df_reg['Timestamp'] - df_reg['Timestamp'].iloc[0]).dt.total_seconds() / 3600.0
    y_raw = df_reg['raw'].values
    
    # Rayleigh selection for AUTO
    duration_hours = t_hours.max()
    rayleigh_freq = 1.0 / duration_hours if duration_hours > 0 else 1.0
    
    priority = ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4', 'Q1', 'J1', '2N2', 'MU2', 'NU2', 'L2', 'T2', 'S4', 'M6', 'S6']
    auto_comps = []
    for c in priority:
        if c not in HARMONIC_FREQS: continue
        can_add = True
        for existing in auto_comps:
            if abs(HARMONIC_FREQS[c]['f'] - HARMONIC_FREQS[existing]['f']) < rayleigh_freq:
                can_add = False
                break
        if can_add: auto_comps.append(c)
    
    # Pass 1: Rough fit
    t_v = t_hours[valid_idx]
    y_v = y_raw[valid_idx]
    solution = solve_least_squares(t_v, y_v, auto_comps)
    
    # Compute predicted and residuals
    def get_pred(t, sol, comps):
        p = sol[0] + sol[1] * t
        for idx, c in enumerate(comps):
            w = 2 * np.pi * HARMONIC_FREQS[c]['f']
            a = sol[2 + 2*idx]
            b = sol[2 + 2*idx + 1]
            p += a * np.cos(w * t) + b * np.sin(w * t)
        return p

    y_pred = get_pred(t_hours, solution, auto_comps)
    residuals = y_raw[valid_idx] - y_pred[valid_idx]
    std_res = np.std(residuals)
    
    # Determine rough HAT/LAT (mean + sum of amplitudes)
    rough_z0 = solution[0]
    amp_sum = 0
    for idx in range(len(auto_comps)):
        a = solution[2 + 2*idx]
        b = solution[2 + 2*idx + 1]
        amp_sum += np.sqrt(a*a + b*b)
    
    rough_hat = rough_z0 + amp_sum
    rough_lat = rough_z0 - amp_sum
    
    # Pass 2: Outlier masking
    z_thresh = config.get('zThreshold', 3.0)
    is_outlier = np.zeros(len(y_raw), dtype=bool)
    for idx in range(len(y_raw)):
        if np.isnan(y_raw[idx]):
            is_outlier[idx] = True
            continue
        res_abs = abs(y_raw[idx] - y_pred[idx])
        if res_abs > (z_thresh * std_res):
            is_outlier[idx] = True
        elif y_raw[idx] > (rough_hat + z_thresh * std_res * 0.5) or y_raw[idx] < (rough_lat - z_thresh * std_res * 0.5):
            is_outlier[idx] = True
            
    df_reg['isOutlier'] = is_outlier
    df_reg['Valid'] = np.where(is_outlier, np.nan, y_raw)
    
    # 5. Filtering (needs interpolation of gaps for stability)
    cleaned = df_reg['Valid'].interpolate(method='linear', limit_direction='both').fillna(rough_z0).values
    
    f_type = config.get('filterType', 'ma')
    f_win = config.get('filterWindow', 15)
    f_samples = max(1, int((f_win * 60000) / dt_ms))
    
    if f_type == 'ma':
        filtered = pd.Series(cleaned).rolling(window=f_samples, center=True, min_periods=1).mean().values
    elif f_type == 'median':
        filtered = signal.medfilt(cleaned, kernel_size=f_samples if f_samples % 2 != 0 else f_samples + 1)
    elif f_type == 'butterworth':
        cutoff = config.get('butterCutoff', 0.5)
        # Replicating App.tsx simple 2nd order IIR
        wc = np.tan(np.pi * cutoff)
        k1 = np.sqrt(2) * wc
        k2 = wc * wc
        a0 = 1 + k1 + k2
        b0 = k2 / a0
        b1 = 2 * b0
        b2 = b0
        a1 = 2 * (k2 - 1) / a0
        a2 = (1 - k1 + k2) / a0
        
        filtered = np.zeros(len(cleaned))
        for i in range(len(cleaned)):
            if i < 2:
                filtered[i] = cleaned[i]
            else:
                filtered[i] = b0 * cleaned[i] + b1 * cleaned[i-1] + b2 * cleaned[i-2] - a1 * filtered[i-1] - a2 * filtered[i-2]
    
    df_reg['Filtered'] = np.where(df_reg['Valid'].isna(), np.nan, filtered).round(3)
    
    # Final Harmonic Analysis
    final_valid = ~df_reg['Filtered'].isna()
    if final_valid.sum() < 2:
        return df_reg, None, "Insufficient data after filtering"
        
    t_f = t_hours[final_valid]
    y_f = df_reg['Filtered'].values[final_valid]
    
    # Selection based on config
    c_set = config.get('constituentSet', 'AUTO')
    if c_set == '9':
        final_comps = ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4']
    elif c_set == '4':
        final_comps = ['M2', 'S2', 'K1', 'O1']
    else:
        final_comps = auto_comps # Default to AUTO
        
    final_sol = solve_least_squares(t_f, y_f, final_comps)
    
     harmonic_results = []
    z0 = final_sol[0]
    for idx, c in enumerate(final_comps):
        a = final_sol[2 + 2*idx]
        b = final_sol[2 + 2*idx + 1]
        amp = np.sqrt(a*a + b*b)
        phase = np.degrees(np.arctan2(b, a))
        if phase < 0: phase += 360
        harmonic_results.append({
            'name': c,
            'amplitude': round(amp, 4),
            'phase': round(phase, 2),
            'frequency': HARMONIC_FREQS[c]['f']
        })
        
    # Chart Datum Calculations
    am2 = next((r['amplitude'] for r in harmonic_results if r['name'] == 'M2'), 0)
    as2 = next((r['amplitude'] for r in harmonic_results if r['name'] == 'S2'), 0)
    sum_amp = sum(r['amplitude'] for r in harmonic_results)
    
    stats = {
        'Z0': round(z0, 4),
        'MSL': round(df_reg['Filtered'].mean(), 4),
        'HAT': round(z0 + sum_amp, 4),
        'LAT': round(z0 - sum_amp, 4),
        'MHWS': round(z0 + (am2 + as2), 4),
        'MLWS': round(z0 - (am2 + as2), 4),
        'RMSE': round(np.sqrt(np.mean((y_f - get_pred(t_f, final_sol, final_comps))**2)), 4),
        'constituents': harmonic_results
    }
    
    return df_reg, stats, None

def export_hydras(df, station_name, sensor_name, output_path):
    """Generates HYDRAS formatted output"""
    with open(output_path, 'w') as f:
        f.write(f"* STATION: {station_name}\n")
        f.write(f"* SENSOR: {sensor_name}\n")
        f.write("* FORMAT: Timestamp, Value\n")
        for _, row in df.iterrows():
            val = row['Filtered']
            val_str = f"{val:.3f}" if not np.isnan(val) else "NaN"
            f.write(f"{row['Timestamp'].strftime('%d/%m/%Y %H:%M:%S')}  {val_str}\n")
