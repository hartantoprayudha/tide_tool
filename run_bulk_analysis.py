import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from tide_engine import run_pipeline, export_hydras
import json
from datetime import datetime, timezone
import io

STAINFO_CSV_CONTENT = """Id_Sta,Nama_Sta,Latitude,Longitude
0001CCAP01,Cilacap,-7.74140,108.99650
0002SRBY01,Surabaya,-7.20006,112.74060
0003BITG02,Bitung UHSLC,1.43892,125.19040
0004PDNG01,Padang UHSLC,-0.99608,100.37550
0005BNOA02,Benoa UHSLC,-8.74640,115.21000
0006PANJ01,Pel. Panjang,-5.46999,105.32000
0007MHTI01,Malahayati,5.59680,95.52468
0008UJPD02,Makassar,-5.11170,119.41790
0009MMJU02,Mamuju,-2.66707,118.89340
0010SBLG01,Sibolga UHLSC,1.72848,98.78577
0011PLPO02,Palopo,-2.98349,120.20980
0012KPNG02,Kupang,-10.19113,123.52734
0013TNBL01,Tanahbala,-0.53247,98.49700
0014TPRK01,Pondok Dayung,-6.09670,106.87820
0015BIAK03,Biak,-1.17765,136.05600
0016LMBR02,Lembar,-8.73087,116.07230
0017TUAL03,Tual,-5.62628,132.74250
0018JPRA01,Jepara,-6.59154,110.64870
0019AMBN03,Ambon,-3.63906,128.20040
0020BLPP02,Balikpapan,-1.27217,116.80600
0021JAIL03,Jailolo,1.05720,127.46980
0022PRGI01,Prigi,-8.28685,111.72750
0023ENDE02,Ende,-8.84617,121.64200
0024PMKT01,Pemangkat,1.17983,108.96820
0025JYPR03,Jayapura,-2.54451,140.71082
0026SRNG03,Sorong,-0.87715,131.24365
0027TRKN02,Tarakan,3.28155,117.59380
0028BNGK01,Bangka,-2.08487,105.13360
0029BATM01,Kabil,1.07314,104.13760
0030SADG01,Sadeng,-8.19048,110.79930
0031PRTU01,Pelabuhan Ratu,-6.98791,106.54280
0032PBAI01,Pulau Baai,-3.91944,102.28180
0033KLGT01,Kalianget,-7.05756,113.94300
0034SKPG01,Sekupang,1.12400,103.92750
0035LHMW01,Lhokseumawe,5.24323,97.03986
0036PTLN02,Pel. Pantoloan,-0.71167,119.85720
0037BNTN01,Pel. Ciwandan,-6.01769,105.95260
0038TPTN01,Tapaktuan,3.25333,97.18076
0039LWUK02,Luwuk,-0.95341,122.79640
0040PRPR02,Pare-pare,-4.01390,119.62010
0041CLBW02,Celukan Bawang,-8.18916,114.83280
0042SMRG01,Semarang,-6.94773,110.42004
0043BDAS02,Badas,-8.46280,117.37300
0044KDRI02,Kendari,-3.97361,122.58330
0045WGPO02,Waingapu,-9.63776,120.24588
0046MEKE03,Merauke,-8.47816,140.39000
0047MWRI03,Manokwari,-0.86841,134.07550
0048KTBR02,Kotabaru,-3.29141,116.14560
0049TBLO03,Tobelo,1.72428,128.01467
0050BLWN01,Belawan,3.78789,98.69426
0051TLTL02,Toli-toli,1.05062,120.80000
0052SMLK03,Saumlaki,-7.98267,131.29060
0053THAN02,Tahuna,3.60226,125.50160
0054MMRE02,Maumere,-8.61505,122.21940
0055BBAU02,Baubau,-5.45398,122.61180
0061TRMP01,Tarempa,3.21711,106.21780
0066JBRN02,Jembrana,-8.38509,114.57330
0071SKLP01,Sunda kelapa,-6.12521,106.80950
0074ROTE02,Rote,-10.72310,123.04390
0075SBNG01,Sabang UHSLC,5.88865,95.31733
0076TDLM01,Teluk Dalam,0.55412,97.82231
0077SBLT01,Seblat,-3.22468,101.59920
0078ALOR02,Alor,-8.21960,124.51680
0079SITO01,Gunung Sitoli,1.30566,97.61011
0080KTAG01,Kota Agung,-5.50046,104.61930
0081LAHE01,Lahewa,1.39727,97.17171
0082NUSA02,Nusa Penida,-8.67655,115.48670
0083PMPK01,Pameungpeuk,-7.66153,107.68260
0084PGDR01,Pangandaran,-7.74831,108.50140
0085ABGS01,Air Bangis,0.19942,99.38156
0086BNYK01,Pulau Banyak,2.29498,97.40787
0087TELO01,Pulau Tello,-0.05010,98.28494
0088SANA03,Sanana,-2.05675,125.98120
0089SING01,Singkil,2.26814,97.81276
0091TALI03,Taliabu,-1.95111,124.38230
0092ENGG01,Enggano,-5.34605,102.27780
0094WAIK02,Waikelo,-9.38991,119.21890
0095MLBH01,Meulaboh,4.12752,96.13187
0096BINT01,Bintuhan,-4.84203,103.41300
0097BINU01,Binuangeun,-6.83548,105.89630
0099BKNT01,Bengkunat,-5.63355,104.30680
0100KRUI01,Krui,-5.18350,103.93310
0101SKBL01,Sikabaluan,-1.08044,98.95700
0102SIKA01,Sikakap,-2.77742,100.21510
0103TPJT01,Tuapejat,-2.02997,99.59342
0107NAML03,Namlea,-3.26922,127.08370
0108BULA03,Bula,-3.10028,130.50460
0109KOLI01,Kolinlamil GFZ,-6.10674,106.89090
0110SARI01,Pamayang Sari,-7.77207,108.08780
0112TBAN01,Tuban,-6.76372,111.94660
0113JMBI01,Jambi,-0.81137,103.46330
0114DMAI01,Dumai,1.68916,101.44410
0116CLNG01,Calang,4.63210,95.57159
0117SNBG01,Sinabang,2.47239,96.38557
0118PKSR03,Pulau Kisar,-8.08008,127.14650
0119PAAM03,Raja Ampat,-0.43258,130.80300
0120AGRK02,Anggrek,0.85880,122.79510
0121KTPG01,Ketapang,-8.13057,114.40065
0122PREO02,Reo,-8.28497,120.45360
0123GEBE03,Gebe,-0.07738,129.42720
0124PCTN01,Pacitan,-8.22724,111.07421
0125SAPE02,Sape,-8.56870,119.02000
0126BNDA03,Banda,-4.52500,129.89690
0127BREU01,Breueh,5.73610,95.04484
0128PAIN01,Painan,-1.35017,100.56980
0129MNDO02,Manado,1.49872,124.83830
0130SRMI03,Sarmi,-1.85800,138.75260
0131MLPT01,Maileppet,-1.56383,99.19696
0132TJLR02,Tanjung Luar,-8.77044,116.52550
0133TJBT02,Tanjung Batu,2.27503,118.09740
0134NNKN02,Nunukan,4.14641,117.66660
0135CRBN01,Cirebon,-6.73386,108.58460
0136SBRU01,Sendang Biru,-8.43421,112.68360
0137KRJW01,Karimun Jawa,-5.78786,110.47710
0138BLTG01,Belitung,-2.74404,107.62870
0139NTNA01,Natuna,3.89221,108.39232
0140ULEE01,Ulee Lhue,5.56652,95.29478
0141BKLS01,Bengkalis,1.46597,102.10740
0142SMRG01,Semarang GFZ,-6.94775,110.42000
0143SRBY01,Surabaya GFZ,-7.20006,112.74060
0144KLTJ01,Kuala Tanjung,3.37149,99.46599
0145CRIK02,Carik,-8.22152,116.42650
0146AMPN02,Ampana,-0.92984,121.69720
0147MELO02,Melonguane,3.99817,126.67570
0148TRTE03,Ternate,0.78173,127.38830
0149KOLA02,Kolaka,-4.05275,121.57850
0150SERA01,Serang,-6.18923,105.84110
0151KAYO01,Kayong,-1.26029,109.94640
0152LIAT01,Sungai Liat,-1.85874,106.13300
0153PARI02,Parigi,-0.81229,120.17970
0154TINO02,Tinombo,0.38654,120.28920
0155WKAI02,Wakai,-0.41055,121.86910
0156GLGH01,Glagah,-7.91650,110.08179
0157PKLG01,Pekalongan,-6.85848,109.69275
0158MORO03,Morotai,2.01655,128.28038
0159SDAI01,Sadai,-3.00443,106.73726
0160TDRE03,Tidore,0.68005,127.45590
0161LRTK02,Larantuka,-8.34209,122.99010
0162BNOA02,Benoa,-8.74640,115.21000
0163CILI01,Cilacap UHSLC,-7.72652,109.02360
0164SBSI01,P. Sebesi,-5.93575,105.51276
0165LBAR02,Lembar UHSLC,-8.73087,116.07230
0166AMBO03,Ambon UHSLC,-3.63906,128.20040
0167PRIG01,Prigi UHSLC,-8.28685,111.72750
0168SUSO01,Susoh,3.72032,96.80988
0169BRUS01,Barus,2.00501,98.39789
0170SIRO01,Sirombu,0.94222,97.41194
0171PBKT01,Batahan,0.36472,99.11861
0172SBAN01,Siuban,-2.18632,99.73133
0173DGLA02,Donggala,-0.66575,119.74623
0174PSKY02,Pasangkayu,-1.13605,119.39406
0175PLLH02,Paleleh,1.04500,121.95483
0176OGMS02,Ogoamas,0.74111,120.10472
0177TSDP02,Tanjung Sidupa,0.90747,123.18586
0178LBKI02,Labuan Uki,0.85455,123.93529
0179LKPG02,Likupang,1.69322,125.01383
0180NMRL03,Namrole,-3.85115,126.73227
0181LWUI03,Laiwui,-1.34187,127.65523
0182PIRU03,Piru,-3.06704,128.17956
0183AMHI03,Amahai,-3.33845,128.92085
0184THRU03,Tehoru,-3.37653,129.54163
0185KWTU03,Kaiwatu,-8.10675,127.81638
0186LRAT03,Larat,-7.15319,131.71372
0187TTKB03,Tutukembong,-7.50392,131.65861
0188PERI03,Pel. Eri,-3.76148,128.12416
0189WEDA03,Weda,0.33400,127.88169
0190NBRE03,Nabire,-3.23002,135.58403
0191TRSK02,Torosik,0.42847,124.27806
0192DOBO03,Dobo,-5.75684,134.23835
0193WHAI03,Wahai,-2.79294,129.51505
0194BGAI02,Banggai,-1.59000,123.49836
0195SWRU03,Serwaru,-8.16845,127.66252
0196BNTG02,Bontang,0.17925,117.50400
0197LBJO02,Labuan Bajo,-8.49283,119.87600
0198KLTL01,Kualatungkal,-0.80316,103.48300
0199KSAR03,Kisar,-8.08008,127.14650
0200PBLG01,Probolinggo,-7.71494,113.21569
0201LMGN01,Lamongan,-6.86445,112.36848
0202BNTE02,Benete,-8.89480,116.74950
0203PMNG02,Pemenang,-8.39239,116.09906
0204TLAW02,Teluk Awang,-8.88361,116.39944
0205CLBI02,Calabai,-8.21415,117.70928
0206BIMA02,Bima,-8.44409,118.71435
0207WWRD02,Waworada,-8.71299,118.81766
0208WLDN02,Wulandoni,-8.53622,123.44873
0209BORG02,Borong,-8.82666,120.61060
0210MPKT02,Marapokot,-8.51460,121.32848
0211MMBW02,Maumbawa,-8.89856,121.13989
0212MRTG02,Maritaing,-8.28553,125.12842
0213ATPP02,Atapupu,-8.99739,124.86147
0214SEBA02,Seba,-10.48900,121.83689
0215NKLU02,Naikliu,-9.49761,123.81406
0216BAIN02,Baing,-10.24131,120.56969
0217ULSU02,Ulu Siau,2.73236,125.41592
0218BGKU02,Bungku,-2.54071,121.97377
0219POSO02,Poso,-1.37997,120.75506
0220TGKG02,Tangkiang,-1.21006,122.62973
0221KLDL02,Kolonedale,-1.98850,121.34162
0222SIWA02,Siwa,-3.67725,120.42753
0223JMPE02,Jampea,-7.06044,120.61272
0224SBTG02,P. Sabutung,-4.74947,119.43556
0225SLYR02,Selayar,-6.12025,120.45361
0226MJNE02,Majene,-3.55889,118.94758
0227BLNG02,Belang-Belang,-2.47481,119.12781
0228KSPT02,Kasipute,-4.77109,122.06583
0229LMPA02,Lampia,-2.77538,121.04089
0230KLDP02,Kaledupa,-5.51362,123.77601
0231SGTA02,Sangatta,0.47236,117.61294
0232BBNG03,Babang,-0.62658,127.60431
0233GITA03,Gita,0.39094,127.62239
0234KEDI03,Kedi,1.67461,127.58069
0235MRSL03,Marsela,-8.11925,129.87706
0236TLHU03,Tulehu,-3.58589,128.32942
0237TNWL03,Taniwel,-2.83525,128.51461
0238KMNA03,Kaimana,-3.66295,133.75905
0239SSPR03,Sausapor,-0.50850,132.08049
0240SBGA01,Sibolga,1.72848,98.78577
0241TTPG01,Teluk Tapang,0.21076,99.26606
0242RMBG01,Rembang,-6.63276,111.54800
0243TDDN01,Taddan,-7.22088,113.29780
0244WINI02,Wini,-9.17808,124.49210
0245KLBN02,Kolbano,-10.02500,124.53520
0246BRNS02,Baranusa,-8.36240,124.09620
0247POTA02,Pota,-8.33807,120.71800
0248PPLA02,Papela,-10.59900,123.37990
0249BTTA02,Batutua,-10.86340,122.98390
0250PLHR02,Pelaihari,-4.01197,115.00930
0251MBTN02,Marabatuan,-4.36261,115.81080
0252SKLG02,Sangkulirang,0.80288,117.92131
0253NGPG02,Ngalipaeng,3.38930,125.62050
0254MRRE02,Marore,4.72990,125.47760
0255KWLS02,Kawaluso,4.22871,125.32020
0256PETA02,Petta,3.64815,125.56130
0257AMRG02,Amurang,1.19911,124.55040
0258SLKN02,Salakan,-1.30843,123.29010
0259PGMN02,Pagimana,-0.79694,122.66190
0260LEOK02,Leok,1.19176,121.42388
0261NMBO02,Lawele Nambo,-5.20425,122.95980
0262PSWJ02,Pasarwajo,-5.51379,122.84390
0263TGRY02,Talaga Raya,-5.47222,122.07480
0264BANT02,Bantaeng,-5.56778,119.92210
0265PMTT02,Pamatata,-5.83469,120.52000
0266ABLU03,Ambalau,-3.82453,127.17900
0267THHA03,Tuhaha,-3.53449,128.68900
0268HRIA03,Haria,-3.58491,128.61900
0269GSER03,Geser,-3.87902,130.90210
0270ADUT03,Adaut,-8.12810,131.11200
0271SEIR03,Seira,-7.65840,131.03719
0272KROI03,Kroing,-7.89471,129.85810
0273LIRA03,Lirang,-8.00489,125.76440
0274MRLS03,Marlasi,-5.47483,134.65400
0275DMAR03,Damar,-7.14620,128.66680
0276WYBL03,Wayabula,2.27738,128.20500
0277GLLA03,Galela,1.81962,127.84810
0278SKTA03,Saketa,-0.35866,127.84570
0279WSOR03,Wasior,-2.72750,134.50350
0280FFAK03,Fak-Fak,-2.93123,132.31000
0281KLBT01,Kalbut,-7.62418,114.01308
0282SPDI01,Sapodi,-7.16549,114.32700
0283PSEN01,Pasean,-6.88721,113.62385
0284SPKN01,Sapeken,-7.00840,115.70379
0285BKLG02,Bakalang,-8.26731,124.29916
0286WWRG02,Waiwerang,-8.39108,123.16271
0287MMBR02,Mamboro,-9.36243,119.65143
0288MRLE02,Maurole,-8.50567,121.81101
0289PLUE02,Palue,-8.30657,121.73604
0290MNTE02,Munte,-2.68680,120.60308
0291BJOE02,Bajoe,-4.54542,120.41587
0292BKMB02,Bulukumba,-5.54659,120.21532
0293GRKG02,Garongkong,-4.36579,119.61170
0294GLSG02,Galesong,-5.32297,119.35493
0295RAHA02,Raha,-4.83991,122.73396
0296ERKE02,Ereke,-4.78334,123.16748
0297WNCI02,Wanci,-5.33900,123.53361
0298MLWE02,Molawe,-3.61086,122.20177
0299LMRU02,Lameruru,-3.29630,122.29833
0300LKRA02,Lakara,-4.47413,122.32900
0301BNTA02,Bunta,-0.83714,122.16200
0302PSKN02,Pasokan,-0.30236,122.34400
0303PPLI02,Popoli,-0.23489,122.19831
0304BTRB02,Baturube,-1.76730,121.79984
0305MLLA02,Malala,0.76541,120.55200
0306BELA02,Belang,0.94029,124.78760
0307BBLN02,Bumbulan,0.48581,122.11332
0308BITU02,Bitung,1.43892,125.19040
0309LKPN02,Likupang,1.69322,125.01383
0310PBGK01,P. Baguk,2.29500,97.40778
0311KAGN01,Kota Agung,-5.50072,104.61997
0312MNTG02,Mentigi,-8.67236,115.55281
0313PANG01,Pangandaran 2,-7.71510,108.50308
0314KGEN01,Kangean,-6.84264,115.22883
0315BWAN01,Bawean,-5.85247,112.64272
0316TSTI01,Tanjung Satai,-1.21447,109.68924
0317PTKR01,Padang Tikar,-0.66471,109.27291
0318TSGT02,Teluk Segintung,-3.34564,112.37434
0319PNDG02,Pondong,-1.80352,116.25140
0320MNPA03,Manipa,-3.34899,127.58977
0321TBRA03,Teluk Bara,-3.17317,126.22590
0322PMOA03,Moa,-8.10676,127.81644
0323TNBR03,Tanimbar,-7.98213,131.29058
0324TYDO03,Tayando,-5.59907,132.32749
0325ELAT03,Elat,-5.64872,132.99419
0326FLBS03,Falabisahaya,-1.78974,125.48383
0327BNMO03,Banemo,0.32252,128.55556
0328GFSA03,Gufasa,1.05681,127.46975
0329LABN02,Labuhan Lombok,-8.49931,116.67310
0330DPRE03,Depapre,-2.45501,140.36040
0331SRUI03,Serui,-1.88746,136.24535
0332SGET03,Seget,-1.39654,130.97067
0333TMDG01,Tj. Medang,2.11345,101.63771
0334DABO01,Dabo Singkep,-0.50447,104.57030
0335UBAN01,Tanjung Uban,1.05870,104.22054
0336ESSG02,Essang,4.46094,126.72952
0337GNLO02,Ganalo,4.42034,126.86152
0338PLPI02,Palipi,-3.31250,118.84944
0339BBNA02,Babana,-2.09898,119.19334
0340KYDI02,Kayuadi,-6.80697,120.80903
0341BLPA02,Belopa,-3.40900,120.40800
0342PADA01,Padang,-0.99608,100.37550
0343KLJL01,Kuala Jelai,-2.53093,110.21326
0344KDWG01,Kendawangan,-2.97753,110.74120
"""

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

def generate_report_text(processed_df, stats, station_id, num_files=1, latitude="-", longitude="-"):
    """Generates the Report format like App.tsx"""
    content = f"Tide Analysis Report\t{num_files} Files Selected\n"
    content += f"Station Name\t{station_id}\n"
    content += f"Latitude\t{latitude}\n"
    content += f"Longitude\t{longitude}\n"
    
    tStart = processed_df['Timestamp'].iloc[0]
    tEnd = processed_df['Timestamp'].iloc[-1]
    durationDays = (tEnd - tStart).total_seconds() / (3600 * 24)
    
    def to_js_locale_string(dt):
        return f"{dt.month}/{dt.day}/{dt.year}, {dt.strftime('%I:%M:%S %p').lstrip('0')}"
        
    content += f"Data Start\t{to_js_locale_string(tStart)}\n"
    content += f"Data End\t{to_js_locale_string(tEnd)}\n"
    content += f"Data Duration\t{durationDays:.2f} days\n"
    content += f"Generated\t{to_js_locale_string(datetime.now())}\n\n"
    
    content += "--- CHART DATUMS & TIDAL RANGES ---\n"
    content += "Parameter\tValue\tUnit\n"
    content += f"MSL (Mean Sea Level)\t{stats['MSL']:.3f}\tm\n"
    content += f"HAT (Highest Astronomical Tide)\t{stats['HAT']:.3f}\tm\n"
    content += f"MHWS (Mean High Water Springs)\t{stats['MHWS']:.3f}\tm\n"
    content += f"MLWS (Mean Low Water Springs)\t{stats['MLWS']:.3f}\tm\n"
    content += f"LAT (Lowest Astronomical Tide)\t{stats['LAT']:.3f}\tm\n"
    
    am2 = next((r['amplitude'] for r in stats['constituents'] if r['name'] == 'M2'), 0)
    as2 = next((r['amplitude'] for r in stats['constituents'] if r['name'] == 'S2'), 0)
    ak1 = next((r['amplitude'] for r in stats['constituents'] if r['name'] == 'K1'), 0)
    ao1 = next((r['amplitude'] for r in stats['constituents'] if r['name'] == 'O1'), 0)
    
    meanSpringTide = 2 * (am2 + as2)
    meanNeapTide = 2 * abs(am2 - as2)
    maxAstroRange = stats['HAT'] - stats['LAT']
    
    content += f"Mean Spring Tide\t{meanSpringTide:.3f}\tm\n"
    content += f"Mean Neap Tide\t{meanNeapTide:.3f}\tm\n"
    content += f"Maximum Astronomical Tidal Range\t{maxAstroRange:.3f}\tm\n"
    
    tidalType = "Unknown"
    d = am2 + as2
    if d != 0:
        f = (ak1 + ao1) / d
        if f <= 0.25: tidalType = "Semi-diurnal (Pasang Surut Ganda)"
        elif f <= 1.5: tidalType = "Mixed, mainly semi-diurnal (Campuran Condong Ganda)"
        elif f <= 3.0: tidalType = "Mixed, mainly diurnal (Campuran Condong Tunggal)"
        else: tidalType = "Diurnal (Pasang Surut Tunggal)"
        
    content += f"Tidal Type (Formzahl)\t{tidalType}\t-\n\n"
    
    content += "--- SEA LEVEL TREND ---\n"
    content += "Method\tRate\tMoE (95% CI)\tUnit\n"
    if stats.get('duration_days', 0) > 365:
        content += f"STL Decomposition\t{stats.get('stl_rate', 0):.5f}\t{stats.get('stl_moe', 0):.5f}\tm/year\n"
        content += f"Robust STL\t{stats.get('robust_stl_rate', 0):.5f}\t{stats.get('robust_stl_moe', 0):.5f}\tm/year\n"
        content += f"Iterative SSA\t{stats.get('ssa_rate', 0):.5f}\t{stats.get('ssa_moe', 0):.5f}\tm/year\n"
    content += f"Linear Regression\t{stats.get('linear_rate', 0):.5f}\t{stats.get('linear_moe', 0):.5f}\tm/year\n\n"
    
    content += "--- MODEL ACCURACIES (Harmonic vs Analyzed) ---\n"
    content += "Parameter\tValue\tUnit\n"
    content += f"RMSE (Root Mean Square Error)\t{stats.get('RMSE', 0):.4f}\tm\n"
    content += f"MAE (Mean Absolute Error)\t{stats.get('MAE', 0):.4f}\tm\n"
    content += f"ME (Mean Error)\t{stats.get('ME', 0):.4f}\tm\n\n"
    
    content += "--- HARMONIC CONSTITUENTS ---\n"
    content += "Comp\tAmp (m)\tPhase (deg)\tDesc\n"
    
    sorted_consts = sorted(stats['constituents'], key=lambda x: x['amplitude'], reverse=True)
    from tide_engine import HARMONIC_FREQS
    for c in sorted_consts:
        desc = HARMONIC_FREQS.get(c['name'], {}).get('d', '')
        content += f"{c['name']}\t{c['amplitude']:.3f}\t{c['phase']:.3f}\t{desc}\n"
    
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
    file_prefix = first_filename[:10].lower()
    
    latitude = "-"
    longitude = "-"
    stasion_name = station_id
    try:
        if os.path.exists('stainfo.csv'):
            stainfo = pd.read_csv('stainfo.csv', dtype=str)
        else:
            stainfo = pd.read_csv(io.StringIO(STAINFO_CSV_CONTENT), dtype=str)
            
        match = stainfo[stainfo['Id_Sta'].str.lower() == file_prefix]
        if not match.empty:
            stasion_name = match.iloc[0]['Nama_Sta']
            lat_val = float(match.iloc[0]['Latitude'])
            lon_val = float(match.iloc[0]['Longitude'])
            latitude = f"{lat_val:.5f}"
            longitude = f"{lon_val:.5f}"
    except Exception as e:
        print(f"[!] Gagal membaca data stasiun: {e}")
    
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
            
        report_path = os.path.join(base_out, "report", f"tide_analysis_report_{station_id.lower()}.txt")
        with open(report_path, 'w', encoding='utf-8') as rep_f:
            rep_f.write(generate_report_text(processed_df, stats, station_id, len(input_files), latitude, longitude))
            
        hydras_path = os.path.join(base_out, "hydras", f"{station_id}_hydras.txt")
        export_hydras(processed_df, station_id, sensor, hydras_path)
        
        export_csv_path = os.path.join(base_out, "csv_export", f"{station_id}_export.csv")
        processed_df.to_csv(export_csv_path, index=False)
        
        const_df = pd.DataFrame(stats['constituents'])
        const_df['amplitude'] = const_df['amplitude'].map(lambda x: f"{x:.5f}")
        const_csv_path = os.path.join(base_out, "constants", f"harmonic_constants_{station_id}.csv")
        const_df.to_csv(const_csv_path, index=False)
        
        # Calculate trendline
        duration_years = stats.get('duration_days', 0) / 365.25
        t0 = processed_df['Timestamp'].iloc[0]
        t_hours = (processed_df['Timestamp'] - t0).dt.total_seconds() / 3600.0
        
        if duration_years > 2 and stats.get('ssa_y') is not None:
            trend_val_mm = stats.get('ssa_rate', 0) * 1000
            trend_label = f"Sea Level Trend (Iterative SSA: {trend_val_mm:.2f} mm/year)"
            
            ssa_y = stats['ssa_y']
            N = len(ssa_y)
            trendline = []
            for t in t_hours:
                day_idx_float = (t - 12.0) / 24.0
                idx = int(np.floor(day_idx_float))
                idx = max(0, min(idx, N - 2))
                if N > 1:
                    d_clamped = max(0.0, min(1.0, day_idx_float - idx))
                    val = ssa_y[idx] + (ssa_y[idx+1] - ssa_y[idx]) * d_clamped
                else:
                    val = ssa_y[0] if N == 1 else np.nan
                trendline.append(val)
        else:
            trend_val_mm = stats.get('linear_rate', 0) * 1000
            trendline = stats.get('linear_intercept', stats['Z0']) + stats.get('slope', 0) * t_hours
            trend_label = f"Sea Level Trend (Linear Regr: {trend_val_mm:.2f} mm/year)"
        
        plt.figure(figsize=(12, 6))
        plt.plot(processed_df['Timestamp'], processed_df['Filtered'], label='Valid', color='#ec7017', linewidth=2)
        plt.plot(processed_df['Timestamp'], trendline, label=f"Sea Level Trend", color='#ef4444', linestyle='--', linewidth=2)
        plt.title(f"{stasion_name} - {trend_label}", fontweight='bold')
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

