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
    'OO1': {'f': 0.04483084, 'd': 'Lunar diurnal'},
    '2N2': {'f': 0.077487098, 'd': 'Lunar semidiurnal'},
    'MU2': {'f': 0.07768947, 'd': 'Variational'},
    'NU2': {'f': 0.079201621, 'd': 'Lunar semidiurnal'},
    'L2': {'f': 0.082023552, 'd': 'Smaller lunar elliptic semidiurnal'},
    'T2': {'f': 0.083219261, 'd': 'Principal solar'},
    'S4': {'f': 0.166666667, 'd': 'Solar semidiurnal overtide'},
    'M6': {'f': 0.241534202, 'd': 'Lunar semidiurnal overtide'},
    'S6': {'f': 0.25, 'd': 'Solar semidiurnal overtide'},
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
    'MSM': {'f': 0.001309781, 'd': 'Lunar monthly'},
    'ALP1': {'f': 0.03439657, 'd': 'Diurnal'},
    'SIG1': {'f': 0.035908722, 'd': 'Diurnal'},
    'TAU1': {'f': 0.038933027, 'd': 'Diurnal'},
    'BET1': {'f': 0.040040445, 'd': 'Diurnal'},
    'NO1': {'f': 0.040268594, 'd': 'Diurnal'},
    'CHI1': {'f': 0.040470968, 'd': 'Diurnal'},
    'S1': {'f': 0.041666672, 'd': 'Solar diurnal'},
    'PSI1': {'f': 0.04189482, 'd': 'Diurnal'},
    'PHI1': {'f': 0.0420089, 'd': 'Diurnal'},
    'THE1': {'f': 0.043082, 'd': 'Diurnal'},
    'SO1': {'f': 0.0446027, 'd': 'Diurnal'},
    'OQ2': {'f': 0.0759749, 'd': 'Semidiurnal'},
    'EPS2': {'f': 0.0761773, 'd': 'Semidiurnal'},
    'MKS2': {'f': 0.0807395, 'd': 'Semidiurnal'},
    'LDA2': {'f': 0.0818212, 'd': 'Semidiurnal'},
    'R2': {'f': 0.0834474, 'd': 'Semidiurnal'},
    'MSN2': {'f': 0.0848455, 'd': 'Semidiurnal'},
    'ETA2': {'f': 0.0850736, 'd': 'Semidiurnal'},
    'MO3': {'f': 0.1192421, 'd': 'Terdiurnal'},
    'SO3': {'f': 0.122064, 'd': 'Terdiurnal'},
    'SK3': {'f': 0.1251141, 'd': 'Terdiurnal'},
    'SN4': {'f': 0.1623326, 'd': 'Quarter diurnal'},
    'MK4': {'f': 0.1640729, 'd': 'Quarter diurnal'},
    'SK4': {'f': 0.1668948, 'd': 'Quarter diurnal'},
    '2MK5': {'f': 0.2028035, 'd': 'Fifth diurnal'},
    '2SK5': {'f': 0.2084474, 'd': 'Fifth diurnal'},
    '2MN6': {'f': 0.2400221, 'd': 'Sixth diurnal'},
    '2MS6': {'f': 0.2443561, 'd': 'Sixth diurnal'},
    '2MK6': {'f': 0.2445843, 'd': 'Sixth diurnal'},
    '2SM6': {'f': 0.2471781, 'd': 'Sixth diurnal'},
    'MSK6': {'f': 0.2474062, 'd': 'Sixth diurnal'},
    '3MK7': {'f': 0.2833149, 'd': 'Seventh diurnal'},
    'E2': {'f': 0.0761773, 'd': 'EPS2'},
    'La2': {'f': 0.0818212, 'd': 'LDA2'},
    'Mu2': {'f': 0.07768947, 'd': 'MU2'},
    'Nu2': {'f': 0.079201621, 'd': 'NU2'},
    'MSqm': {'f': 0.0043339, 'd': 'Lunar solar quarter monthly'},
    'Mtm': {'f': 0.0045621, 'd': 'Lunar third monthly'},
    'N4': {'f': 0.157998498, 'd': 'Over-tide'},
    'Mnum': {'f': 0.001309781, 'd': 'Mnum'},
    'Msf': {'f': 0.002821933, 'd': 'Msf'},
    'sig1': {'f': 0.035908722, 'd': 'sig1'},
    'rho1': {'f': 0.037420874, 'd': 'rho1'},
    'MS1': {'f': 0.038844734, 'd': 'MS1'},
    'MP1': {'f': 0.038958813, 'd': 'MP1'},
    'chi1': {'f': 0.040470965, 'd': 'chi1'},
    'pi1': {'f': 0.041438513, 'd': 'pi1'},
    'psi1': {'f': 0.04189482, 'd': 'psi1'},
    'phi1': {'f': 0.042008905, 'd': 'phi1'},
    'th1': {'f': 0.043090527, 'd': 'th1'},
    '2PO1': {'f': 0.04437452, 'd': '2PO1'},
    'KQ1': {'f': 0.04634299, 'd': 'KQ1'},
    '2MN2S2': {'f': 0.073355383, 'd': '2MN2S2'},
    '3M(SK)2': {'f': 0.074639376, 'd': '3M(SK)2'},
    '2NS2': {'f': 0.074665164, 'd': '2NS2'},
    '3M2S2': {'f': 0.074867535, 'd': '3M2S2'},
    'MNK2': {'f': 0.075949157, 'd': 'MNK2'},
    'MNS2': {'f': 0.076177316, 'd': 'MNS2'},
    'MnuS2': {'f': 0.076379687, 'd': 'MnuS2'},
    'MNK2S2': {'f': 0.076405475, 'd': 'MNK2S2'},
    '2MS2K2': {'f': 0.07723315, 'd': '2MS2K2'},
    '2MK2': {'f': 0.077461309, 'd': '2MK2'},
    'mu2': {'f': 0.077689468, 'd': 'mu2'},
    'SNK2': {'f': 0.07877109, 'd': 'SNK2'},
    'NA2': {'f': 0.078885169, 'd': 'NA2'},
    'NB2': {'f': 0.079113323, 'd': 'NB2'},
    'nu2': {'f': 0.07920162, 'd': 'nu2'},
    '2KN2S2': {'f': 0.079455566, 'd': '2KN2S2'},
    'MSK2': {'f': 0.080283242, 'd': 'MSK2'},
    'MPS2': {'f': 0.080397321, 'd': 'MPS2'},
    'MSP2': {'f': 0.08062548, 'd': 'MSP2'},
    'M2(KS)2': {'f': 0.080967718, 'd': 'M2(KS)2'},
    'lambda2': {'f': 0.081821181, 'd': 'lambda2'},
    '2SK2': {'f': 0.083105174, 'd': '2SK2'},
    'MSnu2': {'f': 0.084643114, 'd': 'MSnu2'},
    'KJ2': {'f': 0.085073644, 'd': 'KJ2'},
    '2KM(SN)2': {'f': 0.085301803, 'd': '2KM(SN)2'},
    '2MS2N2': {'f': 0.086357637, 'd': '2MS2N2'},
    'SKM2': {'f': 0.086383425, 'd': 'SKM2'},
    '3(SM)N2': {'f': 0.087465047, 'd': '3(SM)N2'},
    'SKN2': {'f': 0.087895577, 'd': 'SKN2'},
    'MQ3': {'f': 0.117729903, 'd': 'MQ3'},
    '2NKM3': {'f': 0.119267843, 'd': '2NKM3'},
    '2MS3': {'f': 0.119356134, 'd': '2MS3'},
    '2MP3': {'f': 0.119470214, 'd': '2MP3'},
    'NK3': {'f': 0.120779995, 'd': 'NK3'},
    'MP3': {'f': 0.122063988, 'd': 'MP3'},
    'MS3': {'f': 0.122178067, 'd': 'MS3'},
    'MK3': {'f': 0.122292147, 'd': 'MK3'},
    '2MQ3': {'f': 0.123804299, 'd': '2MQ3'},
    'SP3': {'f': 0.124885921, 'd': 'SP3'},
    'S3': {'f': 0.125, 'd': 'S3'},
    'K3': {'f': 0.125342238, 'd': 'K3'},
    '4MS4': {'f': 0.155378936, 'd': '4MS4'},
    '2MNS4': {'f': 0.156688716, 'd': '2MNS4'},
    '3MK4': {'f': 0.157972709, 'd': '3MK4'},
    '2N4': {'f': 0.157998497, 'd': '2N4'},
    '2NKS4': {'f': 0.158226656, 'd': '2NKS4'},
    'MSNK4': {'f': 0.15928249, 'd': 'MSNK4'},
    'Mnu4': {'f': 0.15971302, 'd': 'Mnu4'},
    'MNKS4': {'f': 0.159738808, 'd': 'MNKS4'},
    '2MSK4': {'f': 0.160794642, 'd': '2MSK4'},
    'MA4': {'f': 0.160908722, 'd': 'MA4'},
    '2MRS4': {'f': 0.161136875, 'd': '2MRS4'},
    '2MKS4': {'f': 0.16125096, 'd': '2MKS4'},
    '3MN4': {'f': 0.162534953, 'd': '3MN4'},
    'NK4': {'f': 0.162560741, 'd': 'NK4'},
    'M2SK4': {'f': 0.163616575, 'd': 'M2SK4'},
    'MT4': {'f': 0.16373066, 'd': 'MT4'},
    'MR4': {'f': 0.163958808, 'd': 'MR4'},
    '2SNM4': {'f': 0.165154515, 'd': '2SNM4'},
    '2MSN4': {'f': 0.165356886, 'd': '2MSN4'},
    '3SM4': {'f': 0.169488599, 'd': '3SM4'},
    '2SKM4': {'f': 0.169716758, 'd': '2SKM4'},
    'MNO5': {'f': 0.198241304, 'd': 'MNO5'},
    '2NKMS5': {'f': 0.198482356, 'd': '2NKMS5'},
    '3MK5': {'f': 0.199753456, 'd': '3MK5'},
    '2NK5': {'f': 0.199779243, 'd': '2NK5'},
    '3MS5': {'f': 0.199867535, 'd': '3MS5'},
    '3MP5': {'f': 0.199981614, 'd': '3MP5'},
    'M5': {'f': 0.201278501, 'd': 'M5'},
    'MNK5': {'f': 0.201291395, 'd': 'MNK5'},
    'MB5': {'f': 0.201392581, 'd': 'MB5'},
    'MSO5': {'f': 0.202575388, 'd': 'MSO5'},
    '2MS5': {'f': 0.202689468, 'd': '2MS5'},
    '3MO5': {'f': 0.202803547, 'd': '3MO5'},
    '3MQ5': {'f': 0.204315699, 'd': '3MQ5'},
    '2(MN)S6': {'f': 0.235687965, 'd': '2(MN)S6'},
    '3MNS6': {'f': 0.237200117, 'd': '3MNS6'},
    '4MK6': {'f': 0.23848411, 'd': '4MK6'},
    'M2N6': {'f': 0.238509898, 'd': 'M2N6'},
    '4MS6': {'f': 0.238712269, 'd': '4MS6'},
    '2NMKS6': {'f': 0.238738057, 'd': '2NMKS6'},
    '2MSNK6': {'f': 0.239793891, 'd': '2MSNK6'},
    '2Mnu6': {'f': 0.240224421, 'd': '2Mnu6'},
    '2MNKS6': {'f': 0.240250209, 'd': '2MNKS6'},
    '3MSK6': {'f': 0.241306043, 'd': '3MSK6'},
    'MA6': {'f': 0.241420122, 'd': 'MA6'},
    'MSN6': {'f': 0.242843982, 'd': 'MSN6'},
    '4MN6': {'f': 0.243046354, 'd': '4MN6'},
    'MNK6': {'f': 0.243072141, 'd': 'MNK6'},
    '2(MS)K6': {'f': 0.244127976, 'd': '2(MS)K6'},
    '2MT6': {'f': 0.244242061, 'd': '2MT6'},
    '2SN6': {'f': 0.245665915, 'd': '2SN6'},
    '3MSN6': {'f': 0.245868286, 'd': '3MSN6'},
    'MKL6': {'f': 0.246096445, 'd': 'MKL6'},
    '2MNO7': {'f': 0.278752704, 'd': '2MNO7'},
    '4MK7': {'f': 0.280264856, 'd': '4MK7'},
    '2NMK7': {'f': 0.280290644, 'd': '2NMK7'},
    'M7': {'f': 0.281789902, 'd': 'M7'},
    '2MNK7': {'f': 0.281802796, 'd': '2MNK7'},
    '2MSO7': {'f': 0.283086789, 'd': '2MSO7'},
    'MSKO7': {'f': 0.286136881, 'd': 'MSKO7'},
    '5MK8': {'f': 0.318995511, 'd': '5MK8'},
    '2(MN)8': {'f': 0.319009052, 'd': '2(MN)8'},
    '5MS8': {'f': 0.319223669, 'd': '5MS8'},
    '2(MN)KS8': {'f': 0.319249457, 'd': '2(MN)KS8'},
    '3MN8': {'f': 0.32053345, 'd': '3MN8'},
    '3Mnu8': {'f': 0.320735821, 'd': '3Mnu8'},
    '3MNKS8': {'f': 0.320761609, 'd': '3MNKS8'},
    '4MSK8': {'f': 0.321817443, 'd': '4MSK8'},
    'MA8': {'f': 0.321931523, 'd': 'MA8'},
    '2MSN8': {'f': 0.323355383, 'd': '2MSN8'},
    '2MNK8': {'f': 0.323583542, 'd': '2MNK8'},
    '3MS8': {'f': 0.324867535, 'd': '3MS8'},
    '3MK8': {'f': 0.325095694, 'd': '3MK8'},
    '2SNM8': {'f': 0.326177316, 'd': '2SNM8'},
    'MSNK8': {'f': 0.326405475, 'd': 'MSNK8'},
    '2(MS)8': {'f': 0.327689468, 'd': '2(MS)8'},
    '2MSK8': {'f': 0.327917627, 'd': '2MSK8'},
    '3SM8': {'f': 0.330511401, 'd': '3SM8'},
    '2SMK8': {'f': 0.330739559, 'd': '2SMK8'},
    'S8': {'f': 0.333333333, 'd': 'S8'},
    '3MN09': {'f': 0.359264105, 'd': '3MN09'},
    '2(MN)K9': {'f': 0.360802044, 'd': '2(MN)K9'},
    'MA9': {'f': 0.362187223, 'd': 'MA9'},
    '3MNK9': {'f': 0.362314196, 'd': '3MNK9'},
    '4MK9': {'f': 0.363826348, 'd': '4MK9'},
    '3MSK9': {'f': 0.366648281, 'd': '3MSK9'},
    '3M2N10': {'f': 0.399532699, 'd': '3M2N10'},
    '6MS10': {'f': 0.39973507, 'd': '6MS10'},
    '3M2NKS10': {'f': 0.399760858, 'd': '3M2NKS10'},
    '4MSNK10': {'f': 0.400816692, 'd': '4MSNK10'},
    '4MN10': {'f': 0.401044851, 'd': '4MN10'},
    '4Mnu10': {'f': 0.401247222, 'd': '4Mnu10'},
    '5MSK10': {'f': 0.402328844, 'd': '5MSK10'},
    'M10': {'f': 0.402557003, 'd': 'M10'},
    '3MSN10': {'f': 0.403866784, 'd': '3MSN10'},
    '6MN10': {'f': 0.404069155, 'd': '6MN10'},
    '3MNK10': {'f': 0.404094942, 'd': '3MNK10'},
    '4MK10': {'f': 0.405607094, 'd': '4MK10'},
    '2MNSK10': {'f': 0.406916875, 'd': '2MNSK10'},
    '3M2S10': {'f': 0.408200868, 'd': '3M2S10'},
    '4MSK11': {'f': 0.447159682, 'd': '4MSK11'},
    '4M2N12': {'f': 0.480044099, 'd': '4M2N12'},
    '4M2NKS12': {'f': 0.480272258, 'd': '4M2NKS12'},
    '5MSNK12': {'f': 0.481328093, 'd': '5MSNK12'},
    '5MN12': {'f': 0.481556251, 'd': '5MN12'},
    '5Mnu12': {'f': 0.481758623, 'd': '5Mnu12'},
    '6MSK12': {'f': 0.482840244, 'd': '6MSK12'},
    'MA12': {'f': 0.482954324, 'd': 'MA12'},
    'M12': {'f': 0.483068403, 'd': 'M12'},
    '4MSN12': {'f': 0.484378184, 'd': '4MSN12'},
    '5MS12': {'f': 0.485890336, 'd': '5MS12'},
    '5MK12': {'f': 0.486118495, 'd': '5MK12'},
    '3MNKS12': {'f': 0.487428276, 'd': '3MNKS12'},
    '4M2S12': {'f': 0.488712269, 'd': '4M2S12'},
    '5MSN14': {'f': 0.564889585, 'd': '5MSN14'},
    '5MNK14': {'f': 0.565117744, 'd': '5MNK14'},
    '6MS14': {'f': 0.566401737, 'd': '6MS14'},
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

def run_pipeline(df, sensor_name, config=None):
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
    y = df[sensor_name].astype(str).str.replace(',', '.')
    y = pd.to_numeric(y, errors='coerce')
    
    # Filter physical bounds before any stats
    y = y.where(~y.isin([999, -999, 9999, -9999]) & (y >= -200) & (y <= 900))
    
    if is_cm or y.abs().median() > 20: # Auto-detect cm if typical value > 20m
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
    
    priorityListRough = ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4', 'Q1', 'J1', '2N2', 'MU2', 'NU2', 'L2', 'T2', 'S4', 'M6', 'S6', 'MN4', 'MSf', 'Mf', 'Mm', 'Ssa', 'Sa', 'E2', 'La2', 'M3', 'M8', 'MKS2', 'MSqm', 'Mtm', 'N4', 'R2', 'S1']
    priority = priorityListRough + [k for k in HARMONIC_FREQS.keys() if k not in priorityListRough]
    
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
        'slope': final_sol[1] if final_sol is not None and len(final_sol) > 1 else 0,
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
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"* STATION: {station_name}\n")
        f.write(f"* SENSOR: {sensor_name}\n")
        f.write("* FORMAT: Timestamp, Value\n")
        for _, row in df.iterrows():
            val = row['Filtered']
            val_str = f"{val:.3f}" if not np.isnan(val) else "NaN"
            f.write(f"{row['Timestamp'].strftime('%d/%m/%Y %H:%M:%S')}  {val_str}\n")
