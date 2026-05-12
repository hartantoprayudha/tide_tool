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
    import warnings
    fmts = [
        '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M',
        '%d/%m/%Y %H:%M:%S', '%d/%m/%Y %H:%M', 
        '%d-%m-%Y %H:%M:%S', '%d-%m-%Y %H:%M',
        '%d%m%Y %H:%M', '%d%m%Y %H%M', '%d/%m/%Y %H.%M'
    ]
    
    parsed = pd.Series(pd.NaT, index=ts_col.index)
    mask = parsed.isna()
    
    for fmt in fmts:
        if not mask.any(): break
        try:
            batch = pd.to_datetime(ts_col[mask], format=fmt, errors='coerce')
            parsed.update(batch)
            mask = parsed.isna()
        except Exception:
            pass
            
    if mask.any():
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            try:
                parsed.update(pd.to_datetime(ts_col[mask], errors='coerce'))
            except Exception:
                pass
                
    return parsed

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

def calculate_trend(data_x, data_y, is_linear=False):
    valid = ~np.isnan(data_y) & ~np.isnan(data_x)
    data_x = data_x[valid]
    data_y = data_y[valid]

    if len(data_x) < 2: return 0, 0, 0, 0
    n = len(data_x)
    sum_x = np.sum(data_x)
    sum_y = np.sum(data_y)
    sum_xy = np.sum(data_x * data_y)
    sum_x2 = np.sum(data_x * data_x)
    
    denominator = (n * sum_x2 - sum_x * sum_x)
    if denominator == 0: return 0, 0, 0, 0
    
    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n
    rate_year = slope * 24 * 365.25
    
    # Valid MoE Calculation using Monthly Aggregation
    BIN_SIZE = 24 * 30.4375
    min_x, max_x = data_x.min(), data_x.max()
    num_bins = max(3, int(np.ceil((max_x - min_x) / BIN_SIZE)) + 1)
    
    bin_x = np.zeros(num_bins)
    bin_y = np.zeros(num_bins)
    bin_count = np.zeros(num_bins)
    
    bin_indices = np.floor((data_x - min_x) / BIN_SIZE).astype(int)
    bin_indices = np.clip(bin_indices, 0, num_bins - 1)
    
    np.add.at(bin_x, bin_indices, data_x)
    np.add.at(bin_y, bin_indices, data_y)
    np.add.at(bin_count, bin_indices, 1)
    
    valid_bins = bin_count > 0
    agg_x = bin_x[valid_bins] / bin_count[valid_bins]
    agg_y = bin_y[valid_bins] / bin_count[valid_bins]
    
    n_agg = len(agg_x)
    margin_of_error = 0
    
    if n_agg > 2:
        x_mean_agg = np.mean(agg_x)
        y_pred = slope * agg_x + intercept
        e_agg = agg_y - y_pred
        x_centered = agg_x - x_mean_agg
        ss_x_agg = np.sum(x_centered**2)
        sum_e2 = np.sum(e_agg**2)
        
        if is_linear and sum_e2 > 0 and ss_x_agg > 0:
            # EDOF NOAA Approach
            sum_e_lag = np.sum(e_agg[1:] * e_agg[:-1])
            r1 = sum_e_lag / sum_e2
            r1 = max(0, min(r1, 0.99))
            
            vif = (1 + r1) / (1 - r1)
            Neff = max(3, n_agg * ((1 - r1) / (1 + r1)))
            
            se_slope_sq = (sum_e2 / (n_agg - 2)) / ss_x_agg * vif
            if se_slope_sq > 0:
                se_slope = np.sqrt(se_slope_sq)
                se_rate_year = se_slope * 24 * 365.25
                
                df = Neff - 2
                if df < 5: t_val = 2.776
                elif df < 10: t_val = 2.228
                else: t_val = 1.96
                
                # More precise t_val approximation
                df_int = int(np.floor(df))
                t_table = [12.71, 4.30, 3.18, 2.78, 2.57, 2.45, 2.36, 2.31, 2.26, 2.23]
                if 1 <= df_int <= 10:
                    t_val = t_table[df_int - 1]
                else:
                    t_val = 1.96 + 2.4 / df

                margin_of_error = se_rate_year * t_val
        elif not is_linear:
            # Newey-West HAC estimator
            z_agg = x_centered * e_agg
            max_lag = min(12, n_agg // 2)
            Q_agg = np.sum(z_agg**2)
            
            for l in range(1, max_lag + 1):
                w = 1 - l / (max_lag + 1)
                sum_lag = np.sum(z_agg[l:] * z_agg[:-l])
                Q_agg += 2 * w * sum_lag
                
            if Q_agg > 0 and ss_x_agg > 0:
                Q_adj = Q_agg * n_agg / (n_agg - 2)
                var_slope = Q_adj / (ss_x_agg**2)
                if var_slope > 0:
                    se_slope = np.sqrt(var_slope)
                    se_rate_year = se_slope * 24 * 365.25
                    t_val = 2.26 if n_agg < 10 else 1.96
                    margin_of_error = se_rate_year * t_val
                
    return slope, intercept, rate_year, margin_of_error

def iterative_ssa(daily_x, daily_y):
    L = 2 * 365
    N = len(daily_y)
    K = N - L + 1
    if K <= 0: return None
    
    C = np.zeros((L, L))
    for i in range(L):
        for j in range(i, L):
            sum_val = np.sum(daily_y[i:i+K] * daily_y[j:j+K])
            C[i, j] = sum_val / K
            C[j, i] = C[i, j]
            
    v = np.full(L, 1.0 / np.sqrt(L))
    for _ in range(20):
        v_next = np.dot(C, v)
        norm = np.linalg.norm(v_next)
        if norm > 0: v = v_next / norm
        
    PC1 = np.zeros(K)
    for k in range(K):
        PC1[k] = np.sum(daily_y[k:k+L] * v)
        
    ssa_y = np.zeros(N)
    count_arr = np.zeros(N)
    for i in range(L):
        for j in range(K):
            ssa_y[i+j] += v[i] * PC1[j]
            count_arr[i+j] += 1
            
    for i in range(N):
        if count_arr[i] > 0:
            ssa_y[i] /= count_arr[i]
            
    return calculate_trend(daily_x, ssa_y), ssa_y

def robust_stl(daily_x, daily_y):
    robust_trend_y = []
    window = 2 * 365
    half_window = window // 2
    n = len(daily_y)
    for i in range(n):
        start = max(0, i - half_window)
        end = min(n - 1, i + half_window)
        arr = [y for y in daily_y[start:end+1] if not np.isnan(y)]
        if arr:
            robust_trend_y.append(np.median(arr))
        else:
            robust_trend_y.append(np.nan)
    return calculate_trend(daily_x, robust_trend_y)

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
        
    # Set time reference to January 1st 00:00:00 of the starting year
    start_time = df_reg['Timestamp'].iloc[0]
    ref_time = pd.Timestamp(year=start_time.year, month=1, day=1, hour=0, minute=0, second=0)
    
    # Calculate tau, s, h, p, N at reference time (Greenwich)
    tau, s, h, p, n_astro = get_astronomical_args(start_time.year)

    t_hours = (df_reg['Timestamp'] - ref_time).dt.total_seconds() / 3600.0
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
    
    # ------------------ TREND CALCULATIONS ------------------
    # Calculate Linear Regression
    lr_slope, lr_intercept, lr_rate, lr_moe = calculate_trend(t_f, y_f, is_linear=True)
    
    # Daily Resampling for STL and SSA
    t0_dt = df_reg['Timestamp'].iloc[0]
    df_daily = df_reg.set_index('Timestamp')['Filtered'].resample('D').mean()
    daily_x_hours = (df_daily.index - t0_dt).total_seconds() / 3600.0 + 12.0
    daily_y = df_daily.interpolate(limit_direction='both').fillna(0).values
    daily_x = daily_x_hours.values
    
    # Calculate STL Trend Data (using a basic moving average as a proxy for STL decomp's trend)
    window_days_stl = 2 * 365
    if len(daily_y) > window_days_stl:
        stl_y = pd.Series(daily_y).rolling(window=window_days_stl, min_periods=1, center=True).mean().values
        stl_slope, stl_intercept, stl_rate, stl_moe = calculate_trend(daily_x, stl_y)
    else:
        stl_slope, stl_intercept, stl_rate, stl_moe = 0, 0, 0, 0

    # Calculate Robust STL
    if len(daily_y) > window_days_stl:
        rstl_res = robust_stl(daily_x, daily_y)
        if rstl_res:
             rstl_slope, rstl_intercept, rstl_rate, rstl_moe = rstl_res
        else:
             rstl_slope, rstl_intercept, rstl_rate, rstl_moe = 0, 0, 0, 0
    else:
        rstl_slope, rstl_intercept, rstl_rate, rstl_moe = 0, 0, 0, 0

    # Calculate Iterative SSA
    if len(daily_y) >= 2 * 365:
        ssa_res = iterative_ssa(daily_x, daily_y)
        if ssa_res:
             (ssa_slope, ssa_intercept, ssa_rate, ssa_moe), ssa_y = ssa_res
        else:
             ssa_slope, ssa_intercept, ssa_rate, ssa_moe = 0, 0, 0, 0
    else:
        ssa_slope, ssa_intercept, ssa_rate, ssa_moe = 0, 0, 0, 0
    # --------------------------------------------------------
    
    # Selection based on config
    c_set = config.get('constituentSet', 'AUTO')
    if c_set == '9':
        final_comps = ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4']
    elif c_set == '4':
        final_comps = ['M2', 'S2', 'K1', 'O1']
    elif c_set == 'IHO10':
        final_comps = ['M2', 'K1', 'S2', 'O1', 'P1', 'N2', 'K2', 'Q1', 'M4', 'MS4']
    elif c_set == 'IHO23':
        final_comps = ['M2', 'K1', 'S2', 'O1', 'P1', 'N2', 'K2', 'Mm', 'Q1', 'NU2', 'J1', 'MU2', 'L2', 'T2', '2N2', 'OO1', 'MSf', 'M3', 'PI1', 'PHI1', 'M1', '2SM2', 'PSI1']
    elif c_set == 'NOAA':
        final_comps = ['Sa', 'Mm', 'Mf', '2Q1', 'Q1', 'O1', 'M1', 'K1', 'J1', 'OO1', '2N2', 'MU2', 'N2', 'NU2', 'M2', 'LAM2', 'L2', 'T2', 'S2', 'R2', 'K2', '2SM2', '2MK3', 'M3', 'MK3', 'MN4', 'M4', 'MS4', 'S4', 'M6', 'S6', 'M8']
    elif c_set == 'FES2014':
        final_comps = ['2N2', 'E2', 'J1', 'K1', 'K2', 'L2', 'La2', 'M2', 'M3', 'M4', 'M6', 'M8', 'Mf', 'MKS2', 'Mm', 'MN4', 'MS4', 'MSf', 'MSqm', 'Mtm', 'Mu2', 'N2', 'N4', 'Nu2', 'O1', 'P1', 'Q1', 'R2', 'S1', 'S2', 'S4', 'Sa', 'Ssa', 'T2']
    elif c_set == 'ETCPOT':
        final_comps = ['Sa', 'Ssa', 'Mnum', 'Mm', 'Msf', 'Mf', 'Mfm', '2Q1', 'Q1', 'rho1', 'O1', 'MP1', 'TAU1', 'NO1', 'chi1', 'pi1', 'P1', 'S1', 'K1', 'psi1', 'phi1', 'th1', 'J1', 'SO1', 'OO1', 'mu2', 'N2', 'nu2', 'M2', 'lambda2', 'L2', 'T2', 'S2', 'K2', 'KJ2', 'M3']
    elif c_set == 'UKHO':
        final_comps = ['Sa', 'Ssa', 'Mnum', 'Mm', 'Msf', 'Mf', '2Q1', 'sig1', 'Q1', 'rho1', 'O1', 'MS1', 'MP1', 'NO1', 'chi1', 'pi1', 'P1', 'S1', 'K1', 'psi1', 'phi1', 'th1', 'J1', '2PO1', 'SO1', 'OO1', 'KQ1', '2MN2S2', '3M(SK)2', '2NS2', '3M2S2', 'MNK2', 'MNS2', 'MnuS2', 'MNK2S2', '2MS2K2', '2MK2', '2N2', 'mu2', 'SNK2', 'NA2', 'N2', 'NB2', 'nu2', '2KN2S2', 'MSK2', 'MPS2', 'M2', 'MSP2', 'MKS2', 'M2(KS)2', 'lambda2', 'L2', '2SK2', 'T2', 'S2', 'R2', 'K2', 'MSnu2', 'MSN2', 'KJ2', '2KM(SN)2', '2SM2', '2MS2N2', 'SKM2', '3(SM)N2', 'SKN2', 'MQ3', 'MO3', '2NKM3', '2MS3', '2MP3', 'M3', 'NK3', 'MP3', 'MS3', 'MK3', '2MQ3', 'SP3', 'S3', 'SK3', 'K3', '4MS4', '2MNS4', '3MK4', '2N4', '2NKS4', 'MSNK4', 'MN4', 'Mnu4', 'MNKS4', '2MSK4', 'MA4', 'M4', '2MRS4', '2MKS4', 'SN4', '3MN4', 'NK4', 'M2SK4', 'MT4', 'MS4', 'MR4', 'MK4', '2SNM4', '2MSN4', 'S4', 'SK4', '3SM4', '2SKM4', 'MNO5', '2NKMS5', '3MK5', '2NK5', '3MS5', '3MP5', 'M5', 'MNK5', 'MB5', 'MSO5', '2MS5', '3MO5', '3MQ5', '2(MN)S6', '3MNS6', '4MK6', 'M2N6', '4MS6', '2NMKS6', '2MSNK6', '2MN6', '2Mnu6', '2MNKS6', '3MSK6', 'MA6', 'M6', 'MSN6', '4MN6', 'MNK6', '2(MS)K6', '2MT6', '2MS6', '2MK6', '2SN6', '3MSN6', 'MKL6', '2SM6', 'MSK6', 'S6', '2MNO7', '4MK7', '2NMK7', 'M7', '2MNK7', '2MSO7', 'MSKO7', '5MK8', '2(MN)8', '5MS8', '2(MN)KS8', '3MN8', '3Mnu8', '3MNKS8', '4MSK8', 'MA8', 'M8', '2MSN8', '2MNK8', '3MS8', '3MK8', '2SNM8', 'MSNK8', '2(MS)8', '2MSK8', '3SM8', '2SMK8', 'S8', '3MN09', '2(MN)K9', 'MA9', '3MNK9', '4MK9', '3MSK9', '3M2N10', '6MS10', '3M2NKS10', '4MSNK10', '4MN10', '4Mnu10', '5MSK10', 'M10', '3MSN10', '6MN10', '3MNK10', '4MK10', '2MNSK10', '3M2S10', '4MSK11', '4M2N12', '4M2NKS12', '5MSNK12', '5MN12', '5Mnu12', '6MSK12', 'MA12', 'M12', '4MSN12', '5MS12', '5MK12', '3MNKS12', '4M2S12', '5MSN14', '5MNK14', '6MS14']
    else:
        final_comps = auto_comps # Default to AUTO
        
    final_sol = solve_least_squares(t_f, y_f, final_comps)
    
    harmonic_results = []
    z0 = final_sol[0]
    for idx, c in enumerate(final_comps):
        a = final_sol[2 + 2*idx]
        b = final_sol[2 + 2*idx + 1]
        amp_ls = np.sqrt(a*a + b*b)
        
        # Calculate Phase from LS
        phase_ls = np.degrees(np.arctan2(b, a))
        
        # Calculate astronomical phase V0
        v0 = get_v0(HARMONIC_FREQS[c]['f'], tau, s, h, p, n_astro, c)
        f_nodal, u_nodal = get_nodal_corrections(n_astro, c)
        
        amp = amp_ls / f_nodal
        
        # Greenwich Phase g = V0 + u - (-Phase_ls) = V0 + u + phase_ls
        g = (v0 + u_nodal + phase_ls) % 360.0
        if g < 0: g += 360.0
        
        harmonic_results.append({
            'name': c,
            'amplitude': round(amp, 5),
            'phase': round(g, 3),
            'frequency': HARMONIC_FREQS[c]['f']
        })
        
    # Chart Datum Calculations
    am2 = next((r['amplitude'] for r in harmonic_results if r['name'] == 'M2'), 0)
    as2 = next((r['amplitude'] for r in harmonic_results if r['name'] == 'S2'), 0)
    sum_amp = sum(r['amplitude'] for r in harmonic_results)
    
    stats = {
        'Z0': round(z0, 4),
        'MSL': round(df_reg['Filtered'].mean(), 4),
        'slope': lr_slope,  # using lr_slope for backwards compatibility where slope is used
        'linear_rate': lr_rate,
        'linear_intercept': lr_intercept,
        'linear_moe': lr_moe,
        'stl_rate': stl_rate,
        'stl_slope': stl_slope,
        'stl_intercept': stl_intercept,
        'stl_moe': stl_moe,
        'robust_stl_rate': rstl_rate,
        'robust_stl_slope': rstl_slope,
        'robust_stl_intercept': rstl_intercept,
        'robust_stl_moe': rstl_moe,
        'ssa_rate': ssa_rate,
        'ssa_slope': ssa_slope,
        'ssa_intercept': ssa_intercept,
        'ssa_moe': ssa_moe,
        'ssa_y': list(ssa_y) if 'ssa_y' in locals() else None,
        'duration_days': float(t_hours.max()) / 24.0,
        'HAT': round(z0 + sum_amp, 4),
        'LAT': round(z0 - sum_amp, 4),
        'MHWS': round(z0 + (am2 + as2), 4),
        'MLWS': round(z0 - (am2 + as2), 4),
        'RMSE': round(np.sqrt(np.mean((y_f - get_pred(t_f, final_sol, final_comps))**2)), 4),
        'MAE': round(np.mean(np.abs(y_f - get_pred(t_f, final_sol, final_comps))), 4),
        'ME': round(np.mean(y_f - get_pred(t_f, final_sol, final_comps)), 4),
        'constituents': harmonic_results
    }
    
    return df_reg, stats, None

def export_hydras(df, station_name, sensor_name, output_path):
    """Generates HYDRAS formatted output"""
    with open(output_path, 'w', encoding='utf-8') as f:
        for _, row in df.iterrows():
            val = row['Filtered']
            val_str = f"{val:.3f}" if not np.isnan(val) else "NaN"
            f.write(f"{row['Timestamp'].strftime('%d/%m/%Y %H:%M:%S')}  {val_str}\n")
