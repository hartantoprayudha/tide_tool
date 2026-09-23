// Katalog Resmi Stasiun Pasut BIG (Badan Informasi Geospasial) & InaTEWS / IOC
// Diambil dan disinkronkan persis sesuai stainfo.csv (Id_Sta, Nama_Sta, Latitude, Longitude)

export interface TideStation {
  id: string; // Sesuai Id_Sta dari stainfo.csv (misal: "0001CCAP01")
  name: string; // Sesuai Nama_Sta dari stainfo.csv (misal: "Cilacap")
  lat: number; // Sesuai Latitude dari stainfo.csv
  lon: number; // Sesuai Longitude dari stainfo.csv
  StationID?: string; // Id_Sta
  StationName?: string; // Nama_Sta
  Latitude?: number; // Latitude
  Longitude?: number; // Longitude
  region?: string;
  isFromStationList?: boolean;
}

export const BASELINE_TIDE_STATIONS: TideStation[] = [
  { id: "0001CCAP01", name: "Cilacap", lat: -7.7414, lon: 108.9965, StationID: "0001CCAP01", StationName: "Cilacap", Latitude: -7.7414, Longitude: 108.9965, region: "Jawa" },
  { id: "0002SRBY01", name: "Surabaya", lat: -7.20006, lon: 112.7406, StationID: "0002SRBY01", StationName: "Surabaya", Latitude: -7.20006, Longitude: 112.7406, region: "Jawa" },
  { id: "0003BITG02", name: "Bitung UHSLC", lat: 1.43892, lon: 125.1904, StationID: "0003BITG02", StationName: "Bitung UHSLC", Latitude: 1.43892, Longitude: 125.1904, region: "Sulawesi" },
  { id: "0004PDNG01", name: "Padang UHSLC", lat: -0.99608, lon: 100.3755, StationID: "0004PDNG01", StationName: "Padang UHSLC", Latitude: -0.99608, Longitude: 100.3755, region: "Sumatera" },
  { id: "0005BNOA02", name: "Benoa UHSLC", lat: -8.7464, lon: 115.21, StationID: "0005BNOA02", StationName: "Benoa UHSLC", Latitude: -8.7464, Longitude: 115.21, region: "Bali" },
  { id: "0006PANJ01", name: "Pel. Panjang", lat: -5.46999, lon: 105.32, StationID: "0006PANJ01", StationName: "Pel. Panjang", Latitude: -5.46999, Longitude: 105.32, region: "Sumatera" },
  { id: "0007MHTI01", name: "Malahayati", lat: 5.5968, lon: 95.52468, StationID: "0007MHTI01", StationName: "Malahayati", Latitude: 5.5968, Longitude: 95.52468, region: "Sumatera" },
  { id: "0008UJPD02", name: "Makassar", lat: -5.1117, lon: 119.4179, StationID: "0008UJPD02", StationName: "Makassar", Latitude: -5.1117, Longitude: 119.4179, region: "Sulawesi" },
  { id: "0009MMJU02", name: "Mamuju", lat: -2.66707, lon: 118.8934, StationID: "0009MMJU02", StationName: "Mamuju", Latitude: -2.66707, Longitude: 118.8934, region: "Kalimantan" },
  { id: "0010SBLG01", name: "Sibolga UHLSC", lat: 1.72848, lon: 98.78577, StationID: "0010SBLG01", StationName: "Sibolga UHLSC", Latitude: 1.72848, Longitude: 98.78577, region: "Sumatera" },
  { id: "0011PLPO02", name: "Palopo", lat: -2.98349, lon: 120.2098, StationID: "0011PLPO02", StationName: "Palopo", Latitude: -2.98349, Longitude: 120.2098, region: "Sulawesi" },
  { id: "0012KPNG02", name: "Kupang", lat: -10.19113, lon: 123.52734, StationID: "0012KPNG02", StationName: "Kupang", Latitude: -10.19113, Longitude: 123.52734, region: "Nusa Tenggara" },
  { id: "0013TNBL01", name: "Tanahbala", lat: -0.53247, lon: 98.497, StationID: "0013TNBL01", StationName: "Tanahbala", Latitude: -0.53247, Longitude: 98.497, region: "Sumatera" },
  { id: "0014TPRK01", name: "Pondok Dayung", lat: -6.0967, lon: 106.8782, StationID: "0014TPRK01", StationName: "Pondok Dayung", Latitude: -6.0967, Longitude: 106.8782, region: "Jawa" },
  { id: "0015BIAK03", name: "Biak", lat: -1.17765, lon: 136.056, StationID: "0015BIAK03", StationName: "Biak", Latitude: -1.17765, Longitude: 136.056, region: "Papua" },
  { id: "0016LMBR02", name: "Lembar", lat: -8.73087, lon: 116.0723, StationID: "0016LMBR02", StationName: "Lembar", Latitude: -8.73087, Longitude: 116.0723, region: "Nusa Tenggara" },
  { id: "0017TUAL03", name: "Tual", lat: -5.62628, lon: 132.7425, StationID: "0017TUAL03", StationName: "Tual", Latitude: -5.62628, Longitude: 132.7425, region: "Maluku" },
  { id: "0018JPRA01", name: "Jepara", lat: -6.59154, lon: 110.6487, StationID: "0018JPRA01", StationName: "Jepara", Latitude: -6.59154, Longitude: 110.6487, region: "Jawa" },
  { id: "0019AMBN03", name: "Ambon", lat: -3.63906, lon: 128.2004, StationID: "0019AMBN03", StationName: "Ambon", Latitude: -3.63906, Longitude: 128.2004, region: "Maluku" },
  { id: "0020BLPP02", name: "Balikpapan", lat: -1.27217, lon: 116.806, StationID: "0020BLPP02", StationName: "Balikpapan", Latitude: -1.27217, Longitude: 116.806, region: "Kalimantan" },
  { id: "0021JAIL03", name: "Jailolo", lat: 1.0572, lon: 127.4698, StationID: "0021JAIL03", StationName: "Jailolo", Latitude: 1.0572, Longitude: 127.4698, region: "Maluku" },
  { id: "0022PRGI01", name: "Prigi", lat: -8.28685, lon: 111.7275, StationID: "0022PRGI01", StationName: "Prigi", Latitude: -8.28685, Longitude: 111.7275, region: "Jawa" },
  { id: "0023ENDE02", name: "Ende", lat: -8.84617, lon: 121.642, StationID: "0023ENDE02", StationName: "Ende", Latitude: -8.84617, Longitude: 121.642, region: "Nusa Tenggara" },
  { id: "0024PMKT01", name: "Pemangkat", lat: 1.17983, lon: 108.9682, StationID: "0024PMKT01", StationName: "Pemangkat", Latitude: 1.17983, Longitude: 108.9682, region: "Kalimantan" },
  { id: "0025JYPR03", name: "Jayapura", lat: -2.54451, lon: 140.71082, StationID: "0025JYPR03", StationName: "Jayapura", Latitude: -2.54451, Longitude: 140.71082, region: "Papua" },
  { id: "0026SRNG03", name: "Sorong", lat: -0.87715, lon: 131.24365, StationID: "0026SRNG03", StationName: "Sorong", Latitude: -0.87715, Longitude: 131.24365, region: "Maluku" },
  { id: "0027TRKN02", name: "Tarakan", lat: 3.28155, lon: 117.5938, StationID: "0027TRKN02", StationName: "Tarakan", Latitude: 3.28155, Longitude: 117.5938, region: "Kalimantan" },
  { id: "0028BNGK01", name: "Bangka", lat: -2.08487, lon: 105.1336, StationID: "0028BNGK01", StationName: "Bangka", Latitude: -2.08487, Longitude: 105.1336, region: "Sumatera" },
  { id: "0029BATM01", name: "Kabil", lat: 1.07314, lon: 104.1376, StationID: "0029BATM01", StationName: "Kabil", Latitude: 1.07314, Longitude: 104.1376, region: "Sumatera" },
  { id: "0030SADG01", name: "Sadeng", lat: -8.19048, lon: 110.7993, StationID: "0030SADG01", StationName: "Sadeng", Latitude: -8.19048, Longitude: 110.7993, region: "Jawa" },
  { id: "0031PRTU01", name: "Pelabuhan Ratu", lat: -6.98791, lon: 106.5428, StationID: "0031PRTU01", StationName: "Pelabuhan Ratu", Latitude: -6.98791, Longitude: 106.5428, region: "Jawa" },
  { id: "0032PBAI01", name: "Pulau Baai", lat: -3.91944, lon: 102.2818, StationID: "0032PBAI01", StationName: "Pulau Baai", Latitude: -3.91944, Longitude: 102.2818, region: "Sumatera" },
  { id: "0033KLGT01", name: "Kalianget", lat: -7.05756, lon: 113.943, StationID: "0033KLGT01", StationName: "Kalianget", Latitude: -7.05756, Longitude: 113.943, region: "Jawa" },
  { id: "0034SKPG01", name: "Sekupang", lat: 1.124, lon: 103.9275, StationID: "0034SKPG01", StationName: "Sekupang", Latitude: 1.124, Longitude: 103.9275, region: "Sumatera" },
  { id: "0035LHMW01", name: "Lhokseumawe", lat: 5.24323, lon: 97.03986, StationID: "0035LHMW01", StationName: "Lhokseumawe", Latitude: 5.24323, Longitude: 97.03986, region: "Sumatera" },
  { id: "0036PTLN02", name: "Pel. Pantoloan", lat: -0.71167, lon: 119.8572, StationID: "0036PTLN02", StationName: "Pel. Pantoloan", Latitude: -0.71167, Longitude: 119.8572, region: "Sulawesi" },
  { id: "0037BNTN01", name: "Pel. Ciwandan", lat: -6.01769, lon: 105.9526, StationID: "0037BNTN01", StationName: "Pel. Ciwandan", Latitude: -6.01769, Longitude: 105.9526, region: "Jawa" },
  { id: "0038TPTN01", name: "Tapaktuan", lat: 3.25333, lon: 97.18076, StationID: "0038TPTN01", StationName: "Tapaktuan", Latitude: 3.25333, Longitude: 97.18076, region: "Sumatera" },
  { id: "0039LWUK02", name: "Luwuk", lat: -0.95341, lon: 122.7964, StationID: "0039LWUK02", StationName: "Luwuk", Latitude: -0.95341, Longitude: 122.7964, region: "Sulawesi" },
  { id: "0040PRPR02", name: "Pare-pare", lat: -4.0139, lon: 119.6201, StationID: "0040PRPR02", StationName: "Pare-pare", Latitude: -4.0139, Longitude: 119.6201, region: "Sulawesi" },
  { id: "0041CLBW02", name: "Celukan Bawang", lat: -8.18916, lon: 114.8328, StationID: "0041CLBW02", StationName: "Celukan Bawang", Latitude: -8.18916, Longitude: 114.8328, region: "Bali" },
  { id: "0042SMRG01", name: "Semarang", lat: -6.94773, lon: 110.42004, StationID: "0042SMRG01", StationName: "Semarang", Latitude: -6.94773, Longitude: 110.42004, region: "Jawa" },
  { id: "0043BDAS02", name: "Badas", lat: -8.4628, lon: 117.373, StationID: "0043BDAS02", StationName: "Badas", Latitude: -8.4628, Longitude: 117.373, region: "Nusa Tenggara" },
  { id: "0044KDRI02", name: "Kendari", lat: -3.97361, lon: 122.5833, StationID: "0044KDRI02", StationName: "Kendari", Latitude: -3.97361, Longitude: 122.5833, region: "Sulawesi" },
  { id: "0045WGPO02", name: "Waingapu", lat: -9.63776, lon: 120.24588, StationID: "0045WGPO02", StationName: "Waingapu", Latitude: -9.63776, Longitude: 120.24588, region: "Nusa Tenggara" },
  { id: "0046MEKE03", name: "Merauke", lat: -8.47816, lon: 140.39, StationID: "0046MEKE03", StationName: "Merauke", Latitude: -8.47816, Longitude: 140.39, region: "Papua" },
  { id: "0047MWRI03", name: "Manokwari", lat: -0.86841, lon: 134.0755, StationID: "0047MWRI03", StationName: "Manokwari", Latitude: -0.86841, Longitude: 134.0755, region: "Maluku" },
  { id: "0048KTBR02", name: "Kotabaru", lat: -3.29141, lon: 116.1456, StationID: "0048KTBR02", StationName: "Kotabaru", Latitude: -3.29141, Longitude: 116.1456, region: "Kalimantan" },
  { id: "0049TBLO03", name: "Tobelo", lat: 1.72428, lon: 128.01467, StationID: "0049TBLO03", StationName: "Tobelo", Latitude: 1.72428, Longitude: 128.01467, region: "Maluku" },
  { id: "0050BLWN01", name: "Belawan", lat: 3.78789, lon: 98.69426, StationID: "0050BLWN01", StationName: "Belawan", Latitude: 3.78789, Longitude: 98.69426, region: "Sumatera" },
  { id: "0051TLTL02", name: "Toli-toli", lat: 1.05062, lon: 120.8, StationID: "0051TLTL02", StationName: "Toli-toli", Latitude: 1.05062, Longitude: 120.8, region: "Sulawesi" },
  { id: "0052SMLK03", name: "Saumlaki", lat: -7.98267, lon: 131.2906, StationID: "0052SMLK03", StationName: "Saumlaki", Latitude: -7.98267, Longitude: 131.2906, region: "Maluku" },
  { id: "0053THAN02", name: "Tahuna", lat: 3.60226, lon: 125.5016, StationID: "0053THAN02", StationName: "Tahuna", Latitude: 3.60226, Longitude: 125.5016, region: "Indonesia" },
  { id: "0054MMRE02", name: "Maumere", lat: -8.61505, lon: 122.2194, StationID: "0054MMRE02", StationName: "Maumere", Latitude: -8.61505, Longitude: 122.2194, region: "Nusa Tenggara" },
  { id: "0055BBAU02", name: "Baubau", lat: -5.45398, lon: 122.6118, StationID: "0055BBAU02", StationName: "Baubau", Latitude: -5.45398, Longitude: 122.6118, region: "Sulawesi" },
  { id: "0061TRMP01", name: "Tarempa", lat: 3.21711, lon: 106.2178, StationID: "0061TRMP01", StationName: "Tarempa", Latitude: 3.21711, Longitude: 106.2178, region: "Indonesia" },
  { id: "0066JBRN02", name: "Jembrana", lat: -8.38509, lon: 114.5733, StationID: "0066JBRN02", StationName: "Jembrana", Latitude: -8.38509, Longitude: 114.5733, region: "Bali" },
  { id: "0071SKLP01", name: "Sunda kelapa", lat: -6.12521, lon: 106.8095, StationID: "0071SKLP01", StationName: "Sunda kelapa", Latitude: -6.12521, Longitude: 106.8095, region: "Jawa" },
  { id: "0074ROTE02", name: "Rote", lat: -10.7231, lon: 123.0439, StationID: "0074ROTE02", StationName: "Rote", Latitude: -10.7231, Longitude: 123.0439, region: "Nusa Tenggara" },
  { id: "0075SBNG01", name: "Sabang UHSLC", lat: 5.88865, lon: 95.31733, StationID: "0075SBNG01", StationName: "Sabang UHSLC", Latitude: 5.88865, Longitude: 95.31733, region: "Sumatera" },
  { id: "0076TDLM01", name: "Teluk Dalam", lat: 0.55412, lon: 97.82231, StationID: "0076TDLM01", StationName: "Teluk Dalam", Latitude: 0.55412, Longitude: 97.82231, region: "Sumatera" },
  { id: "0077SBLT01", name: "Seblat", lat: -3.22468, lon: 101.5992, StationID: "0077SBLT01", StationName: "Seblat", Latitude: -3.22468, Longitude: 101.5992, region: "Sumatera" },
  { id: "0078ALOR02", name: "Alor", lat: -8.2196, lon: 124.5168, StationID: "0078ALOR02", StationName: "Alor", Latitude: -8.2196, Longitude: 124.5168, region: "Nusa Tenggara" },
  { id: "0079SITO01", name: "Gunung Sitoli", lat: 1.30566, lon: 97.61011, StationID: "0079SITO01", StationName: "Gunung Sitoli", Latitude: 1.30566, Longitude: 97.61011, region: "Sumatera" },
  { id: "0080KTAG01", name: "Kota Agung", lat: -5.50046, lon: 104.6193, StationID: "0080KTAG01", StationName: "Kota Agung", Latitude: -5.50046, Longitude: 104.6193, region: "Sumatera" },
  { id: "0081LAHE01", name: "Lahewa", lat: 1.39727, lon: 97.17171, StationID: "0081LAHE01", StationName: "Lahewa", Latitude: 1.39727, Longitude: 97.17171, region: "Sumatera" },
  { id: "0082NUSA02", name: "Nusa Penida", lat: -8.67655, lon: 115.4867, StationID: "0082NUSA02", StationName: "Nusa Penida", Latitude: -8.67655, Longitude: 115.4867, region: "Bali" },
  { id: "0083PMPK01", name: "Pameungpeuk", lat: -7.66153, lon: 107.6826, StationID: "0083PMPK01", StationName: "Pameungpeuk", Latitude: -7.66153, Longitude: 107.6826, region: "Jawa" },
  { id: "0084PGDR01", name: "Pangandaran", lat: -7.74831, lon: 108.5014, StationID: "0084PGDR01", StationName: "Pangandaran", Latitude: -7.74831, Longitude: 108.5014, region: "Jawa" },
  { id: "0085ABGS01", name: "Air Bangis", lat: 0.19942, lon: 99.38156, StationID: "0085ABGS01", StationName: "Air Bangis", Latitude: 0.19942, Longitude: 99.38156, region: "Sumatera" },
  { id: "0086BNYK01", name: "Pulau Banyak", lat: 2.29498, lon: 97.40787, StationID: "0086BNYK01", StationName: "Pulau Banyak", Latitude: 2.29498, Longitude: 97.40787, region: "Sumatera" },
  { id: "0087TELO01", name: "Pulau Tello", lat: -0.0501, lon: 98.28494, StationID: "0087TELO01", StationName: "Pulau Tello", Latitude: -0.0501, Longitude: 98.28494, region: "Sumatera" },
  { id: "0088SANA03", name: "Sanana", lat: -2.05675, lon: 125.9812, StationID: "0088SANA03", StationName: "Sanana", Latitude: -2.05675, Longitude: 125.9812, region: "Sulawesi" },
  { id: "0089SING01", name: "Singkil", lat: 2.26814, lon: 97.81276, StationID: "0089SING01", StationName: "Singkil", Latitude: 2.26814, Longitude: 97.81276, region: "Sumatera" },
  { id: "0091TALI03", name: "Taliabu", lat: -1.95111, lon: 124.3823, StationID: "0091TALI03", StationName: "Taliabu", Latitude: -1.95111, Longitude: 124.3823, region: "Sulawesi" },
  { id: "0092ENGG01", name: "Enggano", lat: -5.34605, lon: 102.2778, StationID: "0092ENGG01", StationName: "Enggano", Latitude: -5.34605, Longitude: 102.2778, region: "Sumatera" },
  { id: "0094WAIK02", name: "Waikelo", lat: -9.38991, lon: 119.2189, StationID: "0094WAIK02", StationName: "Waikelo", Latitude: -9.38991, Longitude: 119.2189, region: "Nusa Tenggara" },
  { id: "0095MLBH01", name: "Meulaboh", lat: 4.12752, lon: 96.13187, StationID: "0095MLBH01", StationName: "Meulaboh", Latitude: 4.12752, Longitude: 96.13187, region: "Sumatera" },
  { id: "0096BINT01", name: "Bintuhan", lat: -4.84203, lon: 103.413, StationID: "0096BINT01", StationName: "Bintuhan", Latitude: -4.84203, Longitude: 103.413, region: "Sumatera" },
  { id: "0097BINU01", name: "Binuangeun", lat: -6.83548, lon: 105.8963, StationID: "0097BINU01", StationName: "Binuangeun", Latitude: -6.83548, Longitude: 105.8963, region: "Jawa" },
  { id: "0099BKNT01", name: "Bengkunat", lat: -5.63355, lon: 104.3068, StationID: "0099BKNT01", StationName: "Bengkunat", Latitude: -5.63355, Longitude: 104.3068, region: "Sumatera" },
  { id: "0100KRUI01", name: "Krui", lat: -5.1835, lon: 103.9331, StationID: "0100KRUI01", StationName: "Krui", Latitude: -5.1835, Longitude: 103.9331, region: "Sumatera" },
  { id: "0101SKBL01", name: "Sikabaluan", lat: -1.08044, lon: 98.957, StationID: "0101SKBL01", StationName: "Sikabaluan", Latitude: -1.08044, Longitude: 98.957, region: "Sumatera" },
  { id: "0102SIKA01", name: "Sikakap", lat: -2.77742, lon: 100.2151, StationID: "0102SIKA01", StationName: "Sikakap", Latitude: -2.77742, Longitude: 100.2151, region: "Sumatera" },
  { id: "0103TPJT01", name: "Tuapejat", lat: -2.02997, lon: 99.59342, StationID: "0103TPJT01", StationName: "Tuapejat", Latitude: -2.02997, Longitude: 99.59342, region: "Sumatera" },
  { id: "0107NAML03", name: "Namlea", lat: -3.26922, lon: 127.0837, StationID: "0107NAML03", StationName: "Namlea", Latitude: -3.26922, Longitude: 127.0837, region: "Maluku" },
  { id: "0108BULA03", name: "Bula", lat: -3.10028, lon: 130.5046, StationID: "0108BULA03", StationName: "Bula", Latitude: -3.10028, Longitude: 130.5046, region: "Maluku" },
  { id: "0109KOLI01", name: "Kolinlamil GFZ", lat: -6.10674, lon: 106.8909, StationID: "0109KOLI01", StationName: "Kolinlamil GFZ", Latitude: -6.10674, Longitude: 106.8909, region: "Jawa" },
  { id: "0110SARI01", name: "Pamayang Sari", lat: -7.77207, lon: 108.0878, StationID: "0110SARI01", StationName: "Pamayang Sari", Latitude: -7.77207, Longitude: 108.0878, region: "Jawa" },
  { id: "0112TBAN01", name: "Tuban", lat: -6.76372, lon: 111.9466, StationID: "0112TBAN01", StationName: "Tuban", Latitude: -6.76372, Longitude: 111.9466, region: "Jawa" },
  { id: "0113JMBI01", name: "Jambi", lat: -0.81137, lon: 103.4633, StationID: "0113JMBI01", StationName: "Jambi", Latitude: -0.81137, Longitude: 103.4633, region: "Sumatera" },
  { id: "0114DMAI01", name: "Dumai", lat: 1.68916, lon: 101.4441, StationID: "0114DMAI01", StationName: "Dumai", Latitude: 1.68916, Longitude: 101.4441, region: "Sumatera" },
  { id: "0116CLNG01", name: "Calang", lat: 4.6321, lon: 95.57159, StationID: "0116CLNG01", StationName: "Calang", Latitude: 4.6321, Longitude: 95.57159, region: "Sumatera" },
  { id: "0117SNBG01", name: "Sinabang", lat: 2.47239, lon: 96.38557, StationID: "0117SNBG01", StationName: "Sinabang", Latitude: 2.47239, Longitude: 96.38557, region: "Sumatera" },
  { id: "0118PKSR03", name: "Pulau Kisar", lat: -8.08008, lon: 127.1465, StationID: "0118PKSR03", StationName: "Pulau Kisar", Latitude: -8.08008, Longitude: 127.1465, region: "Maluku" },
  { id: "0119PAAM03", name: "Raja Ampat", lat: -0.43258, lon: 130.803, StationID: "0119PAAM03", StationName: "Raja Ampat", Latitude: -0.43258, Longitude: 130.803, region: "Maluku" },
  { id: "0120AGRK02", name: "Anggrek", lat: 0.8588, lon: 122.7951, StationID: "0120AGRK02", StationName: "Anggrek", Latitude: 0.8588, Longitude: 122.7951, region: "Sulawesi" },
  { id: "0121KTPG01", name: "Ketapang", lat: -8.13057, lon: 114.40065, StationID: "0121KTPG01", StationName: "Ketapang", Latitude: -8.13057, Longitude: 114.40065, region: "Jawa" },
  { id: "0122PREO02", name: "Reo", lat: -8.28497, lon: 120.4536, StationID: "0122PREO02", StationName: "Reo", Latitude: -8.28497, Longitude: 120.4536, region: "Nusa Tenggara" },
  { id: "0123GEBE03", name: "Gebe", lat: -0.07738, lon: 129.4272, StationID: "0123GEBE03", StationName: "Gebe", Latitude: -0.07738, Longitude: 129.4272, region: "Maluku" },
  { id: "0124PCTN01", name: "Pacitan", lat: -8.22724, lon: 111.07421, StationID: "0124PCTN01", StationName: "Pacitan", Latitude: -8.22724, Longitude: 111.07421, region: "Jawa" },
  { id: "0125SAPE02", name: "Sape", lat: -8.5687, lon: 119.02, StationID: "0125SAPE02", StationName: "Sape", Latitude: -8.5687, Longitude: 119.02, region: "Nusa Tenggara" },
  { id: "0126BNDA03", name: "Banda", lat: -4.525, lon: 129.8969, StationID: "0126BNDA03", StationName: "Banda", Latitude: -4.525, Longitude: 129.8969, region: "Maluku" },
  { id: "0127BREU01", name: "Breueh", lat: 5.7361, lon: 95.04484, StationID: "0127BREU01", StationName: "Breueh", Latitude: 5.7361, Longitude: 95.04484, region: "Sumatera" },
  { id: "0128PAIN01", name: "Painan", lat: -1.35017, lon: 100.5698, StationID: "0128PAIN01", StationName: "Painan", Latitude: -1.35017, Longitude: 100.5698, region: "Sumatera" },
  { id: "0129MNDO02", name: "Manado", lat: 1.49872, lon: 124.8383, StationID: "0129MNDO02", StationName: "Manado", Latitude: 1.49872, Longitude: 124.8383, region: "Sulawesi" },
  { id: "0130SRMI03", name: "Sarmi", lat: -1.858, lon: 138.7526, StationID: "0130SRMI03", StationName: "Sarmi", Latitude: -1.858, Longitude: 138.7526, region: "Papua" },
  { id: "0131MLPT01", name: "Maileppet", lat: -1.56383, lon: 99.19696, StationID: "0131MLPT01", StationName: "Maileppet", Latitude: -1.56383, Longitude: 99.19696, region: "Sumatera" },
  { id: "0132TJLR02", name: "Tanjung Luar", lat: -8.77044, lon: 116.5255, StationID: "0132TJLR02", StationName: "Tanjung Luar", Latitude: -8.77044, Longitude: 116.5255, region: "Nusa Tenggara" },
  { id: "0133TJBT02", name: "Tanjung Batu", lat: 2.27503, lon: 118.0974, StationID: "0133TJBT02", StationName: "Tanjung Batu", Latitude: 2.27503, Longitude: 118.0974, region: "Kalimantan" },
  { id: "0134NNKN02", name: "Nunukan", lat: 4.14641, lon: 117.6666, StationID: "0134NNKN02", StationName: "Nunukan", Latitude: 4.14641, Longitude: 117.6666, region: "Kalimantan" },
  { id: "0135CRBN01", name: "Cirebon", lat: -6.73386, lon: 108.5846, StationID: "0135CRBN01", StationName: "Cirebon", Latitude: -6.73386, Longitude: 108.5846, region: "Jawa" },
  { id: "0136SBRU01", name: "Sendang Biru", lat: -8.43421, lon: 112.6836, StationID: "0136SBRU01", StationName: "Sendang Biru", Latitude: -8.43421, Longitude: 112.6836, region: "Jawa" },
  { id: "0137KRJW01", name: "Karimun Jawa", lat: -5.78786, lon: 110.4771, StationID: "0137KRJW01", StationName: "Karimun Jawa", Latitude: -5.78786, Longitude: 110.4771, region: "Jawa" },
  { id: "0138BLTG01", name: "Belitung", lat: -2.74404, lon: 107.6287, StationID: "0138BLTG01", StationName: "Belitung", Latitude: -2.74404, Longitude: 107.6287, region: "Indonesia" },
  { id: "0139NTNA01", name: "Natuna", lat: 3.89221, lon: 108.39232, StationID: "0139NTNA01", StationName: "Natuna", Latitude: 3.89221, Longitude: 108.39232, region: "Indonesia" },
  { id: "0140ULEE01", name: "Ulee Lhue", lat: 5.56652, lon: 95.29478, StationID: "0140ULEE01", StationName: "Ulee Lhue", Latitude: 5.56652, Longitude: 95.29478, region: "Sumatera" },
  { id: "0141BKLS01", name: "Bengkalis", lat: 1.46597, lon: 102.1074, StationID: "0141BKLS01", StationName: "Bengkalis", Latitude: 1.46597, Longitude: 102.1074, region: "Sumatera" },
  { id: "0142SMRG01", name: "Semarang GFZ", lat: -6.94775, lon: 110.42, StationID: "0142SMRG01", StationName: "Semarang GFZ", Latitude: -6.94775, Longitude: 110.42, region: "Jawa" },
  { id: "0143SRBY01", name: "Surabaya GFZ", lat: -7.20006, lon: 112.7406, StationID: "0143SRBY01", StationName: "Surabaya GFZ", Latitude: -7.20006, Longitude: 112.7406, region: "Jawa" },
  { id: "0144KLTJ01", name: "Kuala Tanjung", lat: 3.37149, lon: 99.46599, StationID: "0144KLTJ01", StationName: "Kuala Tanjung", Latitude: 3.37149, Longitude: 99.46599, region: "Sumatera" },
  { id: "0145CRIK02", name: "Carik", lat: -8.22152, lon: 116.4265, StationID: "0145CRIK02", StationName: "Carik", Latitude: -8.22152, Longitude: 116.4265, region: "Nusa Tenggara" },
  { id: "0146AMPN02", name: "Ampana", lat: -0.92984, lon: 121.6972, StationID: "0146AMPN02", StationName: "Ampana", Latitude: -0.92984, Longitude: 121.6972, region: "Sulawesi" },
  { id: "0147MELO02", name: "Melonguane", lat: 3.99817, lon: 126.6757, StationID: "0147MELO02", StationName: "Melonguane", Latitude: 3.99817, Longitude: 126.6757, region: "Indonesia" },
  { id: "0148TRTE03", name: "Ternate", lat: 0.78173, lon: 127.3883, StationID: "0148TRTE03", StationName: "Ternate", Latitude: 0.78173, Longitude: 127.3883, region: "Maluku" },
  { id: "0149KOLA02", name: "Kolaka", lat: -4.05275, lon: 121.5785, StationID: "0149KOLA02", StationName: "Kolaka", Latitude: -4.05275, Longitude: 121.5785, region: "Sulawesi" },
  { id: "0150SERA01", name: "Serang", lat: -6.18923, lon: 105.8411, StationID: "0150SERA01", StationName: "Serang", Latitude: -6.18923, Longitude: 105.8411, region: "Jawa" },
  { id: "0151KAYO01", name: "Kayong", lat: -1.26029, lon: 109.9464, StationID: "0151KAYO01", StationName: "Kayong", Latitude: -1.26029, Longitude: 109.9464, region: "Kalimantan" },
  { id: "0152LIAT01", name: "Sungai Liat", lat: -1.85874, lon: 106.133, StationID: "0152LIAT01", StationName: "Sungai Liat", Latitude: -1.85874, Longitude: 106.133, region: "Indonesia" },
  { id: "0153PARI02", name: "Parigi", lat: -0.81229, lon: 120.1797, StationID: "0153PARI02", StationName: "Parigi", Latitude: -0.81229, Longitude: 120.1797, region: "Sulawesi" },
  { id: "0154TINO02", name: "Tinombo", lat: 0.38654, lon: 120.2892, StationID: "0154TINO02", StationName: "Tinombo", Latitude: 0.38654, Longitude: 120.2892, region: "Sulawesi" },
  { id: "0155WKAI02", name: "Wakai", lat: -0.41055, lon: 121.8691, StationID: "0155WKAI02", StationName: "Wakai", Latitude: -0.41055, Longitude: 121.8691, region: "Sulawesi" },
  { id: "0156GLGH01", name: "Glagah", lat: -7.9165, lon: 110.08179, StationID: "0156GLGH01", StationName: "Glagah", Latitude: -7.9165, Longitude: 110.08179, region: "Jawa" },
  { id: "0157PKLG01", name: "Pekalongan", lat: -6.85848, lon: 109.69275, StationID: "0157PKLG01", StationName: "Pekalongan", Latitude: -6.85848, Longitude: 109.69275, region: "Jawa" },
  { id: "0158MORO03", name: "Morotai", lat: 2.01655, lon: 128.28038, StationID: "0158MORO03", StationName: "Morotai", Latitude: 2.01655, Longitude: 128.28038, region: "Maluku" },
  { id: "0159SDAI01", name: "Sadai", lat: -3.00443, lon: 106.73726, StationID: "0159SDAI01", StationName: "Sadai", Latitude: -3.00443, Longitude: 106.73726, region: "Indonesia" },
  { id: "0160TDRE03", name: "Tidore", lat: 0.68005, lon: 127.4559, StationID: "0160TDRE03", StationName: "Tidore", Latitude: 0.68005, Longitude: 127.4559, region: "Maluku" },
  { id: "0161LRTK02", name: "Larantuka", lat: -8.34209, lon: 122.9901, StationID: "0161LRTK02", StationName: "Larantuka", Latitude: -8.34209, Longitude: 122.9901, region: "Nusa Tenggara" },
  { id: "0162BNOA02", name: "Benoa", lat: -8.7464, lon: 115.21, StationID: "0162BNOA02", StationName: "Benoa", Latitude: -8.7464, Longitude: 115.21, region: "Bali" },
  { id: "0163CILI01", name: "Cilacap UHSLC", lat: -7.72652, lon: 109.0236, StationID: "0163CILI01", StationName: "Cilacap UHSLC", Latitude: -7.72652, Longitude: 109.0236, region: "Jawa" },
  { id: "0164SBSI01", name: "P. Sebesi", lat: -5.93575, lon: 105.51276, StationID: "0164SBSI01", StationName: "P. Sebesi", Latitude: -5.93575, Longitude: 105.51276, region: "Sumatera" },
  { id: "0165LBAR02", name: "Lembar UHSLC", lat: -8.73087, lon: 116.0723, StationID: "0165LBAR02", StationName: "Lembar UHSLC", Latitude: -8.73087, Longitude: 116.0723, region: "Nusa Tenggara" },
  { id: "0166AMBO03", name: "Ambon UHSLC", lat: -3.63906, lon: 128.2004, StationID: "0166AMBO03", StationName: "Ambon UHSLC", Latitude: -3.63906, Longitude: 128.2004, region: "Maluku" },
  { id: "0167PRIG01", name: "Prigi UHSLC", lat: -8.28685, lon: 111.7275, StationID: "0167PRIG01", StationName: "Prigi UHSLC", Latitude: -8.28685, Longitude: 111.7275, region: "Jawa" },
  { id: "0168SUSO01", name: "Susoh", lat: 3.72032, lon: 96.80988, StationID: "0168SUSO01", StationName: "Susoh", Latitude: 3.72032, Longitude: 96.80988, region: "Sumatera" },
  { id: "0169BRUS01", name: "Barus", lat: 2.00501, lon: 98.39789, StationID: "0169BRUS01", StationName: "Barus", Latitude: 2.00501, Longitude: 98.39789, region: "Sumatera" },
  { id: "0170SIRO01", name: "Sirombu", lat: 0.94222, lon: 97.41194, StationID: "0170SIRO01", StationName: "Sirombu", Latitude: 0.94222, Longitude: 97.41194, region: "Sumatera" },
  { id: "0171PBKT01", name: "Batahan", lat: 0.36472, lon: 99.11861, StationID: "0171PBKT01", StationName: "Batahan", Latitude: 0.36472, Longitude: 99.11861, region: "Sumatera" },
  { id: "0172SBAN01", name: "Siuban", lat: -2.18632, lon: 99.73133, StationID: "0172SBAN01", StationName: "Siuban", Latitude: -2.18632, Longitude: 99.73133, region: "Sumatera" },
  { id: "0173DGLA02", name: "Donggala", lat: -0.66575, lon: 119.74623, StationID: "0173DGLA02", StationName: "Donggala", Latitude: -0.66575, Longitude: 119.74623, region: "Sulawesi" },
  { id: "0174PSKY02", name: "Pasangkayu", lat: -1.13605, lon: 119.39406, StationID: "0174PSKY02", StationName: "Pasangkayu", Latitude: -1.13605, Longitude: 119.39406, region: "Kalimantan" },
  { id: "0175PLLH02", name: "Paleleh", lat: 1.045, lon: 121.95483, StationID: "0175PLLH02", StationName: "Paleleh", Latitude: 1.045, Longitude: 121.95483, region: "Sulawesi" },
  { id: "0176OGMS02", name: "Ogoamas", lat: 0.74111, lon: 120.10472, StationID: "0176OGMS02", StationName: "Ogoamas", Latitude: 0.74111, Longitude: 120.10472, region: "Sulawesi" },
  { id: "0177TSDP02", name: "Tanjung Sidupa", lat: 0.90747, lon: 123.18586, StationID: "0177TSDP02", StationName: "Tanjung Sidupa", Latitude: 0.90747, Longitude: 123.18586, region: "Sulawesi" },
  { id: "0178LBKI02", name: "Labuan Uki", lat: 0.85455, lon: 123.93529, StationID: "0178LBKI02", StationName: "Labuan Uki", Latitude: 0.85455, Longitude: 123.93529, region: "Sulawesi" },
  { id: "0179LKPG02", name: "Likupang", lat: 1.69322, lon: 125.01383, StationID: "0179LKPG02", StationName: "Likupang", Latitude: 1.69322, Longitude: 125.01383, region: "Sulawesi" },
  { id: "0180NMRL03", name: "Namrole", lat: -3.85115, lon: 126.73227, StationID: "0180NMRL03", StationName: "Namrole", Latitude: -3.85115, Longitude: 126.73227, region: "Maluku" },
  { id: "0181LWUI03", name: "Laiwui", lat: -1.34187, lon: 127.65523, StationID: "0181LWUI03", StationName: "Laiwui", Latitude: -1.34187, Longitude: 127.65523, region: "Maluku" },
  { id: "0182PIRU03", name: "Piru", lat: -3.06704, lon: 128.17956, StationID: "0182PIRU03", StationName: "Piru", Latitude: -3.06704, Longitude: 128.17956, region: "Maluku" },
  { id: "0183AMHI03", name: "Amahai", lat: -3.33845, lon: 128.92085, StationID: "0183AMHI03", StationName: "Amahai", Latitude: -3.33845, Longitude: 128.92085, region: "Maluku" },
  { id: "0184THRU03", name: "Tehoru", lat: -3.37653, lon: 129.54163, StationID: "0184THRU03", StationName: "Tehoru", Latitude: -3.37653, Longitude: 129.54163, region: "Maluku" },
  { id: "0185KWTU03", name: "Kaiwatu", lat: -8.10675, lon: 127.81638, StationID: "0185KWTU03", StationName: "Kaiwatu", Latitude: -8.10675, Longitude: 127.81638, region: "Maluku" },
  { id: "0186LRAT03", name: "Larat", lat: -7.15319, lon: 131.71372, StationID: "0186LRAT03", StationName: "Larat", Latitude: -7.15319, Longitude: 131.71372, region: "Maluku" },
  { id: "0187TTKB03", name: "Tutukembong", lat: -7.50392, lon: 131.65861, StationID: "0187TTKB03", StationName: "Tutukembong", Latitude: -7.50392, Longitude: 131.65861, region: "Maluku" },
  { id: "0188PERI03", name: "Pel. Eri", lat: -3.76148, lon: 128.12416, StationID: "0188PERI03", StationName: "Pel. Eri", Latitude: -3.76148, Longitude: 128.12416, region: "Maluku" },
  { id: "0189WEDA03", name: "Weda", lat: 0.334, lon: 127.88169, StationID: "0189WEDA03", StationName: "Weda", Latitude: 0.334, Longitude: 127.88169, region: "Maluku" },
  { id: "0190NBRE03", name: "Nabire", lat: -3.23002, lon: 135.58403, StationID: "0190NBRE03", StationName: "Nabire", Latitude: -3.23002, Longitude: 135.58403, region: "Papua" },
  { id: "0191TRSK02", name: "Torosik", lat: 0.42847, lon: 124.27806, StationID: "0191TRSK02", StationName: "Torosik", Latitude: 0.42847, Longitude: 124.27806, region: "Sulawesi" },
  { id: "0192DOBO03", name: "Dobo", lat: -5.75684, lon: 134.23835, StationID: "0192DOBO03", StationName: "Dobo", Latitude: -5.75684, Longitude: 134.23835, region: "Maluku" },
  { id: "0193WHAI03", name: "Wahai", lat: -2.79294, lon: 129.51505, StationID: "0193WHAI03", StationName: "Wahai", Latitude: -2.79294, Longitude: 129.51505, region: "Maluku" },
  { id: "0194BGAI02", name: "Banggai", lat: -1.59, lon: 123.49836, StationID: "0194BGAI02", StationName: "Banggai", Latitude: -1.59, Longitude: 123.49836, region: "Sulawesi" },
  { id: "0195SWRU03", name: "Serwaru", lat: -8.16845, lon: 127.66252, StationID: "0195SWRU03", StationName: "Serwaru", Latitude: -8.16845, Longitude: 127.66252, region: "Maluku" },
  { id: "0196BNTG02", name: "Bontang", lat: 0.17925, lon: 117.504, StationID: "0196BNTG02", StationName: "Bontang", Latitude: 0.17925, Longitude: 117.504, region: "Kalimantan" },
  { id: "0197LBJO02", name: "Labuan Bajo", lat: -8.49283, lon: 119.876, StationID: "0197LBJO02", StationName: "Labuan Bajo", Latitude: -8.49283, Longitude: 119.876, region: "Nusa Tenggara" },
  { id: "0198KLTL01", name: "Kualatungkal", lat: -0.80316, lon: 103.483, StationID: "0198KLTL01", StationName: "Kualatungkal", Latitude: -0.80316, Longitude: 103.483, region: "Sumatera" },
  { id: "0199KSAR03", name: "Kisar", lat: -8.08008, lon: 127.1465, StationID: "0199KSAR03", StationName: "Kisar", Latitude: -8.08008, Longitude: 127.1465, region: "Maluku" },
  { id: "0200PBLG01", name: "Probolinggo", lat: -7.71494, lon: 113.21569, StationID: "0200PBLG01", StationName: "Probolinggo", Latitude: -7.71494, Longitude: 113.21569, region: "Jawa" },
  { id: "0201LMGN01", name: "Lamongan", lat: -6.86445, lon: 112.36848, StationID: "0201LMGN01", StationName: "Lamongan", Latitude: -6.86445, Longitude: 112.36848, region: "Jawa" },
  { id: "0202BNTE02", name: "Benete", lat: -8.8948, lon: 116.7495, StationID: "0202BNTE02", StationName: "Benete", Latitude: -8.8948, Longitude: 116.7495, region: "Nusa Tenggara" },
  { id: "0203PMNG02", name: "Pemenang", lat: -8.39239, lon: 116.09906, StationID: "0203PMNG02", StationName: "Pemenang", Latitude: -8.39239, Longitude: 116.09906, region: "Nusa Tenggara" },
  { id: "0204TLAW02", name: "Teluk Awang", lat: -8.88361, lon: 116.39944, StationID: "0204TLAW02", StationName: "Teluk Awang", Latitude: -8.88361, Longitude: 116.39944, region: "Nusa Tenggara" },
  { id: "0205CLBI02", name: "Calabai", lat: -8.21415, lon: 117.70928, StationID: "0205CLBI02", StationName: "Calabai", Latitude: -8.21415, Longitude: 117.70928, region: "Nusa Tenggara" },
  { id: "0206BIMA02", name: "Bima", lat: -8.44409, lon: 118.71435, StationID: "0206BIMA02", StationName: "Bima", Latitude: -8.44409, Longitude: 118.71435, region: "Nusa Tenggara" },
  { id: "0207WWRD02", name: "Waworada", lat: -8.71299, lon: 118.81766, StationID: "0207WWRD02", StationName: "Waworada", Latitude: -8.71299, Longitude: 118.81766, region: "Nusa Tenggara" },
  { id: "0208WLDN02", name: "Wulandoni", lat: -8.53622, lon: 123.44873, StationID: "0208WLDN02", StationName: "Wulandoni", Latitude: -8.53622, Longitude: 123.44873, region: "Nusa Tenggara" },
  { id: "0209BORG02", name: "Borong", lat: -8.82666, lon: 120.6106, StationID: "0209BORG02", StationName: "Borong", Latitude: -8.82666, Longitude: 120.6106, region: "Nusa Tenggara" },
  { id: "0210MPKT02", name: "Marapokot", lat: -8.5146, lon: 121.32848, StationID: "0210MPKT02", StationName: "Marapokot", Latitude: -8.5146, Longitude: 121.32848, region: "Nusa Tenggara" },
  { id: "0211MMBW02", name: "Maumbawa", lat: -8.89856, lon: 121.13989, StationID: "0211MMBW02", StationName: "Maumbawa", Latitude: -8.89856, Longitude: 121.13989, region: "Nusa Tenggara" },
  { id: "0212MRTG02", name: "Maritaing", lat: -8.28553, lon: 125.12842, StationID: "0212MRTG02", StationName: "Maritaing", Latitude: -8.28553, Longitude: 125.12842, region: "Nusa Tenggara" },
  { id: "0213ATPP02", name: "Atapupu", lat: -8.99739, lon: 124.86147, StationID: "0213ATPP02", StationName: "Atapupu", Latitude: -8.99739, Longitude: 124.86147, region: "Nusa Tenggara" },
  { id: "0214SEBA02", name: "Seba", lat: -10.489, lon: 121.83689, StationID: "0214SEBA02", StationName: "Seba", Latitude: -10.489, Longitude: 121.83689, region: "Nusa Tenggara" },
  { id: "0215NKLU02", name: "Naikliu", lat: -9.49761, lon: 123.81406, StationID: "0215NKLU02", StationName: "Naikliu", Latitude: -9.49761, Longitude: 123.81406, region: "Nusa Tenggara" },
  { id: "0216BAIN02", name: "Baing", lat: -10.24131, lon: 120.56969, StationID: "0216BAIN02", StationName: "Baing", Latitude: -10.24131, Longitude: 120.56969, region: "Nusa Tenggara" },
  { id: "0217ULSU02", name: "Ulu Siau", lat: 2.73236, lon: 125.41592, StationID: "0217ULSU02", StationName: "Ulu Siau", Latitude: 2.73236, Longitude: 125.41592, region: "Indonesia" },
  { id: "0218BGKU02", name: "Bungku", lat: -2.54071, lon: 121.97377, StationID: "0218BGKU02", StationName: "Bungku", Latitude: -2.54071, Longitude: 121.97377, region: "Sulawesi" },
  { id: "0219POSO02", name: "Poso", lat: -1.37997, lon: 120.75506, StationID: "0219POSO02", StationName: "Poso", Latitude: -1.37997, Longitude: 120.75506, region: "Sulawesi" },
  { id: "0220TGKG02", name: "Tangkiang", lat: -1.21006, lon: 122.62973, StationID: "0220TGKG02", StationName: "Tangkiang", Latitude: -1.21006, Longitude: 122.62973, region: "Sulawesi" },
  { id: "0221KLDL02", name: "Kolonedale", lat: -1.9885, lon: 121.34162, StationID: "0221KLDL02", StationName: "Kolonedale", Latitude: -1.9885, Longitude: 121.34162, region: "Sulawesi" },
  { id: "0222SIWA02", name: "Siwa", lat: -3.67725, lon: 120.42753, StationID: "0222SIWA02", StationName: "Siwa", Latitude: -3.67725, Longitude: 120.42753, region: "Sulawesi" },
  { id: "0223JMPE02", name: "Jampea", lat: -7.06044, lon: 120.61272, StationID: "0223JMPE02", StationName: "Jampea", Latitude: -7.06044, Longitude: 120.61272, region: "Indonesia" },
  { id: "0224SBTG02", name: "P. Sabutung", lat: -4.74947, lon: 119.43556, StationID: "0224SBTG02", StationName: "P. Sabutung", Latitude: -4.74947, Longitude: 119.43556, region: "Sulawesi" },
  { id: "0225SLYR02", name: "Selayar", lat: -6.12025, lon: 120.45361, StationID: "0225SLYR02", StationName: "Selayar", Latitude: -6.12025, Longitude: 120.45361, region: "Indonesia" },
  { id: "0226MJNE02", name: "Majene", lat: -3.55889, lon: 118.94758, StationID: "0226MJNE02", StationName: "Majene", Latitude: -3.55889, Longitude: 118.94758, region: "Kalimantan" },
  { id: "0227BLNG02", name: "Belang-Belang", lat: -2.47481, lon: 119.12781, StationID: "0227BLNG02", StationName: "Belang-Belang", Latitude: -2.47481, Longitude: 119.12781, region: "Kalimantan" },
  { id: "0228KSPT02", name: "Kasipute", lat: -4.77109, lon: 122.06583, StationID: "0228KSPT02", StationName: "Kasipute", Latitude: -4.77109, Longitude: 122.06583, region: "Sulawesi" },
  { id: "0229LMPA02", name: "Lampia", lat: -2.77538, lon: 121.04089, StationID: "0229LMPA02", StationName: "Lampia", Latitude: -2.77538, Longitude: 121.04089, region: "Sulawesi" },
  { id: "0230KLDP02", name: "Kaledupa", lat: -5.51362, lon: 123.77601, StationID: "0230KLDP02", StationName: "Kaledupa", Latitude: -5.51362, Longitude: 123.77601, region: "Sulawesi" },
  { id: "0231SGTA02", name: "Sangatta", lat: 0.47236, lon: 117.61294, StationID: "0231SGTA02", StationName: "Sangatta", Latitude: 0.47236, Longitude: 117.61294, region: "Kalimantan" },
  { id: "0232BBNG03", name: "Babang", lat: -0.62658, lon: 127.60431, StationID: "0232BBNG03", StationName: "Babang", Latitude: -0.62658, Longitude: 127.60431, region: "Maluku" },
  { id: "0233GITA03", name: "Gita", lat: 0.39094, lon: 127.62239, StationID: "0233GITA03", StationName: "Gita", Latitude: 0.39094, Longitude: 127.62239, region: "Maluku" },
  { id: "0234KEDI03", name: "Kedi", lat: 1.67461, lon: 127.58069, StationID: "0234KEDI03", StationName: "Kedi", Latitude: 1.67461, Longitude: 127.58069, region: "Maluku" },
  { id: "0235MRSL03", name: "Marsela", lat: -8.11925, lon: 129.87706, StationID: "0235MRSL03", StationName: "Marsela", Latitude: -8.11925, Longitude: 129.87706, region: "Maluku" },
  { id: "0236TLHU03", name: "Tulehu", lat: -3.58589, lon: 128.32942, StationID: "0236TLHU03", StationName: "Tulehu", Latitude: -3.58589, Longitude: 128.32942, region: "Maluku" },
  { id: "0237TNWL03", name: "Taniwel", lat: -2.83525, lon: 128.51461, StationID: "0237TNWL03", StationName: "Taniwel", Latitude: -2.83525, Longitude: 128.51461, region: "Maluku" },
  { id: "0238KMNA03", name: "Kaimana", lat: -3.66295, lon: 133.75905, StationID: "0238KMNA03", StationName: "Kaimana", Latitude: -3.66295, Longitude: 133.75905, region: "Maluku" },
  { id: "0239SSPR03", name: "Sausapor", lat: -0.5085, lon: 132.08049, StationID: "0239SSPR03", StationName: "Sausapor", Latitude: -0.5085, Longitude: 132.08049, region: "Maluku" },
  { id: "0240SBGA01", name: "Sibolga", lat: 1.72848, lon: 98.78577, StationID: "0240SBGA01", StationName: "Sibolga", Latitude: 1.72848, Longitude: 98.78577, region: "Sumatera" },
  { id: "0241TTPG01", name: "Teluk Tapang", lat: 0.21076, lon: 99.26606, StationID: "0241TTPG01", StationName: "Teluk Tapang", Latitude: 0.21076, Longitude: 99.26606, region: "Sumatera" },
  { id: "0242RMBG01", name: "Rembang", lat: -6.63276, lon: 111.548, StationID: "0242RMBG01", StationName: "Rembang", Latitude: -6.63276, Longitude: 111.548, region: "Jawa" },
  { id: "0243TDDN01", name: "Taddan", lat: -7.22088, lon: 113.2978, StationID: "0243TDDN01", StationName: "Taddan", Latitude: -7.22088, Longitude: 113.2978, region: "Jawa" },
  { id: "0244WINI02", name: "Wini", lat: -9.17808, lon: 124.4921, StationID: "0244WINI02", StationName: "Wini", Latitude: -9.17808, Longitude: 124.4921, region: "Nusa Tenggara" },
  { id: "0245KLBN02", name: "Kolbano", lat: -10.025, lon: 124.5352, StationID: "0245KLBN02", StationName: "Kolbano", Latitude: -10.025, Longitude: 124.5352, region: "Nusa Tenggara" },
  { id: "0246BRNS02", name: "Baranusa", lat: -8.3624, lon: 124.0962, StationID: "0246BRNS02", StationName: "Baranusa", Latitude: -8.3624, Longitude: 124.0962, region: "Nusa Tenggara" },
  { id: "0247POTA02", name: "Pota", lat: -8.33807, lon: 120.718, StationID: "0247POTA02", StationName: "Pota", Latitude: -8.33807, Longitude: 120.718, region: "Nusa Tenggara" },
  { id: "0248PPLA02", name: "Papela", lat: -10.599, lon: 123.3799, StationID: "0248PPLA02", StationName: "Papela", Latitude: -10.599, Longitude: 123.3799, region: "Nusa Tenggara" },
  { id: "0249BTTA02", name: "Batutua", lat: -10.8634, lon: 122.9839, StationID: "0249BTTA02", StationName: "Batutua", Latitude: -10.8634, Longitude: 122.9839, region: "Nusa Tenggara" },
  { id: "0250PLHR02", name: "Pelaihari", lat: -4.01197, lon: 115.0093, StationID: "0250PLHR02", StationName: "Pelaihari", Latitude: -4.01197, Longitude: 115.0093, region: "Kalimantan" },
  { id: "0251MBTN02", name: "Marabatuan", lat: -4.36261, lon: 115.8108, StationID: "0251MBTN02", StationName: "Marabatuan", Latitude: -4.36261, Longitude: 115.8108, region: "Kalimantan" },
  { id: "0252SKLG02", name: "Sangkulirang", lat: 0.80288, lon: 117.92131, StationID: "0252SKLG02", StationName: "Sangkulirang", Latitude: 0.80288, Longitude: 117.92131, region: "Kalimantan" },
  { id: "0253NGPG02", name: "Ngalipaeng", lat: 3.3893, lon: 125.6205, StationID: "0253NGPG02", StationName: "Ngalipaeng", Latitude: 3.3893, Longitude: 125.6205, region: "Indonesia" },
  { id: "0254MRRE02", name: "Marore", lat: 4.7299, lon: 125.4776, StationID: "0254MRRE02", StationName: "Marore", Latitude: 4.7299, Longitude: 125.4776, region: "Indonesia" },
  { id: "0255KWLS02", name: "Kawaluso", lat: 4.22871, lon: 125.3202, StationID: "0255KWLS02", StationName: "Kawaluso", Latitude: 4.22871, Longitude: 125.3202, region: "Indonesia" },
  { id: "0256PETA02", name: "Petta", lat: 3.64815, lon: 125.5613, StationID: "0256PETA02", StationName: "Petta", Latitude: 3.64815, Longitude: 125.5613, region: "Indonesia" },
  { id: "0257AMRG02", name: "Amurang", lat: 1.19911, lon: 124.5504, StationID: "0257AMRG02", StationName: "Amurang", Latitude: 1.19911, Longitude: 124.5504, region: "Sulawesi" },
  { id: "0258SLKN02", name: "Salakan", lat: -1.30843, lon: 123.2901, StationID: "0258SLKN02", StationName: "Salakan", Latitude: -1.30843, Longitude: 123.2901, region: "Sulawesi" },
  { id: "0259PGMN02", name: "Pagimana", lat: -0.79694, lon: 122.6619, StationID: "0259PGMN02", StationName: "Pagimana", Latitude: -0.79694, Longitude: 122.6619, region: "Sulawesi" },
  { id: "0260LEOK02", name: "Leok", lat: 1.19176, lon: 121.42388, StationID: "0260LEOK02", StationName: "Leok", Latitude: 1.19176, Longitude: 121.42388, region: "Sulawesi" },
  { id: "0261NMBO02", name: "Lawele Nambo", lat: -5.20425, lon: 122.9598, StationID: "0261NMBO02", StationName: "Lawele Nambo", Latitude: -5.20425, Longitude: 122.9598, region: "Sulawesi" },
  { id: "0262PSWJ02", name: "Pasarwajo", lat: -5.51379, lon: 122.8439, StationID: "0262PSWJ02", StationName: "Pasarwajo", Latitude: -5.51379, Longitude: 122.8439, region: "Sulawesi" },
  { id: "0263TGRY02", name: "Talaga Raya", lat: -5.47222, lon: 122.0748, StationID: "0263TGRY02", StationName: "Talaga Raya", Latitude: -5.47222, Longitude: 122.0748, region: "Sulawesi" },
  { id: "0264BANT02", name: "Bantaeng", lat: -5.56778, lon: 119.9221, StationID: "0264BANT02", StationName: "Bantaeng", Latitude: -5.56778, Longitude: 119.9221, region: "Sulawesi" },
  { id: "0265PMTT02", name: "Pamatata", lat: -5.83469, lon: 120.52, StationID: "0265PMTT02", StationName: "Pamatata", Latitude: -5.83469, Longitude: 120.52, region: "Sulawesi" },
  { id: "0266ABLU03", name: "Ambalau", lat: -3.82453, lon: 127.179, StationID: "0266ABLU03", StationName: "Ambalau", Latitude: -3.82453, Longitude: 127.179, region: "Maluku" },
  { id: "0267THHA03", name: "Tuhaha", lat: -3.53449, lon: 128.689, StationID: "0267THHA03", StationName: "Tuhaha", Latitude: -3.53449, Longitude: 128.689, region: "Maluku" },
  { id: "0268HRIA03", name: "Haria", lat: -3.58491, lon: 128.619, StationID: "0268HRIA03", StationName: "Haria", Latitude: -3.58491, Longitude: 128.619, region: "Maluku" },
  { id: "0269GSER03", name: "Geser", lat: -3.87902, lon: 130.9021, StationID: "0269GSER03", StationName: "Geser", Latitude: -3.87902, Longitude: 130.9021, region: "Maluku" },
  { id: "0270ADUT03", name: "Adaut", lat: -8.1281, lon: 131.112, StationID: "0270ADUT03", StationName: "Adaut", Latitude: -8.1281, Longitude: 131.112, region: "Maluku" },
  { id: "0271SEIR03", name: "Seira", lat: -7.6584, lon: 131.03719, StationID: "0271SEIR03", StationName: "Seira", Latitude: -7.6584, Longitude: 131.03719, region: "Maluku" },
  { id: "0272KROI03", name: "Kroing", lat: -7.89471, lon: 129.8581, StationID: "0272KROI03", StationName: "Kroing", Latitude: -7.89471, Longitude: 129.8581, region: "Maluku" },
  { id: "0273LIRA03", name: "Lirang", lat: -8.00489, lon: 125.7644, StationID: "0273LIRA03", StationName: "Lirang", Latitude: -8.00489, Longitude: 125.7644, region: "Nusa Tenggara" },
  { id: "0274MRLS03", name: "Marlasi", lat: -5.47483, lon: 134.654, StationID: "0274MRLS03", StationName: "Marlasi", Latitude: -5.47483, Longitude: 134.654, region: "Maluku" },
  { id: "0275DMAR03", name: "Damar", lat: -7.1462, lon: 128.6668, StationID: "0275DMAR03", StationName: "Damar", Latitude: -7.1462, Longitude: 128.6668, region: "Maluku" },
  { id: "0276WYBL03", name: "Wayabula", lat: 2.27738, lon: 128.205, StationID: "0276WYBL03", StationName: "Wayabula", Latitude: 2.27738, Longitude: 128.205, region: "Maluku" },
  { id: "0277GLLA03", name: "Galela", lat: 1.81962, lon: 127.8481, StationID: "0277GLLA03", StationName: "Galela", Latitude: 1.81962, Longitude: 127.8481, region: "Maluku" },
  { id: "0278SKTA03", name: "Saketa", lat: -0.35866, lon: 127.8457, StationID: "0278SKTA03", StationName: "Saketa", Latitude: -0.35866, Longitude: 127.8457, region: "Maluku" },
  { id: "0279WSOR03", name: "Wasior", lat: -2.7275, lon: 134.5035, StationID: "0279WSOR03", StationName: "Wasior", Latitude: -2.7275, Longitude: 134.5035, region: "Maluku" },
  { id: "0280FFAK03", name: "Fak-Fak", lat: -2.93123, lon: 132.31, StationID: "0280FFAK03", StationName: "Fak-Fak", Latitude: -2.93123, Longitude: 132.31, region: "Maluku" },
  { id: "0281KLBT01", name: "Kalbut", lat: -7.62418, lon: 114.01308, StationID: "0281KLBT01", StationName: "Kalbut", Latitude: -7.62418, Longitude: 114.01308, region: "Jawa" },
  { id: "0282SPDI01", name: "Sapodi", lat: -7.16549, lon: 114.327, StationID: "0282SPDI01", StationName: "Sapodi", Latitude: -7.16549, Longitude: 114.327, region: "Jawa" },
  { id: "0283PSEN01", name: "Pasean", lat: -6.88721, lon: 113.62385, StationID: "0283PSEN01", StationName: "Pasean", Latitude: -6.88721, Longitude: 113.62385, region: "Jawa" },
  { id: "0284SPKN01", name: "Sapeken", lat: -7.0084, lon: 115.70379, StationID: "0284SPKN01", StationName: "Sapeken", Latitude: -7.0084, Longitude: 115.70379, region: "Indonesia" },
  { id: "0285BKLG02", name: "Bakalang", lat: -8.26731, lon: 124.29916, StationID: "0285BKLG02", StationName: "Bakalang", Latitude: -8.26731, Longitude: 124.29916, region: "Nusa Tenggara" },
  { id: "0286WWRG02", name: "Waiwerang", lat: -8.39108, lon: 123.16271, StationID: "0286WWRG02", StationName: "Waiwerang", Latitude: -8.39108, Longitude: 123.16271, region: "Nusa Tenggara" },
  { id: "0287MMBR02", name: "Mamboro", lat: -9.36243, lon: 119.65143, StationID: "0287MMBR02", StationName: "Mamboro", Latitude: -9.36243, Longitude: 119.65143, region: "Nusa Tenggara" },
  { id: "0288MRLE02", name: "Maurole", lat: -8.50567, lon: 121.81101, StationID: "0288MRLE02", StationName: "Maurole", Latitude: -8.50567, Longitude: 121.81101, region: "Nusa Tenggara" },
  { id: "0289PLUE02", name: "Palue", lat: -8.30657, lon: 121.73604, StationID: "0289PLUE02", StationName: "Palue", Latitude: -8.30657, Longitude: 121.73604, region: "Nusa Tenggara" },
  { id: "0290MNTE02", name: "Munte", lat: -2.6868, lon: 120.60308, StationID: "0290MNTE02", StationName: "Munte", Latitude: -2.6868, Longitude: 120.60308, region: "Sulawesi" },
  { id: "0291BJOE02", name: "Bajoe", lat: -4.54542, lon: 120.41587, StationID: "0291BJOE02", StationName: "Bajoe", Latitude: -4.54542, Longitude: 120.41587, region: "Sulawesi" },
  { id: "0292BKMB02", name: "Bulukumba", lat: -5.54659, lon: 120.21532, StationID: "0292BKMB02", StationName: "Bulukumba", Latitude: -5.54659, Longitude: 120.21532, region: "Sulawesi" },
  { id: "0293GRKG02", name: "Garongkong", lat: -4.36579, lon: 119.6117, StationID: "0293GRKG02", StationName: "Garongkong", Latitude: -4.36579, Longitude: 119.6117, region: "Sulawesi" },
  { id: "0294GLSG02", name: "Galesong", lat: -5.32297, lon: 119.35493, StationID: "0294GLSG02", StationName: "Galesong", Latitude: -5.32297, Longitude: 119.35493, region: "Sulawesi" },
  { id: "0295RAHA02", name: "Raha", lat: -4.83991, lon: 122.73396, StationID: "0295RAHA02", StationName: "Raha", Latitude: -4.83991, Longitude: 122.73396, region: "Sulawesi" },
  { id: "0296ERKE02", name: "Ereke", lat: -4.78334, lon: 123.16748, StationID: "0296ERKE02", StationName: "Ereke", Latitude: -4.78334, Longitude: 123.16748, region: "Sulawesi" },
  { id: "0297WNCI02", name: "Wanci", lat: -5.339, lon: 123.53361, StationID: "0297WNCI02", StationName: "Wanci", Latitude: -5.339, Longitude: 123.53361, region: "Sulawesi" },
  { id: "0298MLWE02", name: "Molawe", lat: -3.61086, lon: 122.20177, StationID: "0298MLWE02", StationName: "Molawe", Latitude: -3.61086, Longitude: 122.20177, region: "Sulawesi" },
  { id: "0299LMRU02", name: "Lameruru", lat: -3.2963, lon: 122.29833, StationID: "0299LMRU02", StationName: "Lameruru", Latitude: -3.2963, Longitude: 122.29833, region: "Sulawesi" },
  { id: "0300LKRA02", name: "Lakara", lat: -4.47413, lon: 122.329, StationID: "0300LKRA02", StationName: "Lakara", Latitude: -4.47413, Longitude: 122.329, region: "Sulawesi" },
  { id: "0301BNTA02", name: "Bunta", lat: -0.83714, lon: 122.162, StationID: "0301BNTA02", StationName: "Bunta", Latitude: -0.83714, Longitude: 122.162, region: "Sulawesi" },
  { id: "0302PSKN02", name: "Pasokan", lat: -0.30236, lon: 122.344, StationID: "0302PSKN02", StationName: "Pasokan", Latitude: -0.30236, Longitude: 122.344, region: "Sulawesi" },
  { id: "0303PPLI02", name: "Popoli", lat: -0.23489, lon: 122.19831, StationID: "0303PPLI02", StationName: "Popoli", Latitude: -0.23489, Longitude: 122.19831, region: "Sulawesi" },
  { id: "0304BTRB02", name: "Baturube", lat: -1.7673, lon: 121.79984, StationID: "0304BTRB02", StationName: "Baturube", Latitude: -1.7673, Longitude: 121.79984, region: "Sulawesi" },
  { id: "0305MLLA02", name: "Malala", lat: 0.76541, lon: 120.552, StationID: "0305MLLA02", StationName: "Malala", Latitude: 0.76541, Longitude: 120.552, region: "Sulawesi" },
  { id: "0306BELA02", name: "Belang", lat: 0.94029, lon: 124.7876, StationID: "0306BELA02", StationName: "Belang", Latitude: 0.94029, Longitude: 124.7876, region: "Sulawesi" },
  { id: "0307BBLN02", name: "Bumbulan", lat: 0.48581, lon: 122.11332, StationID: "0307BBLN02", StationName: "Bumbulan", Latitude: 0.48581, Longitude: 122.11332, region: "Sulawesi" },
  { id: "0308BITU02", name: "Bitung", lat: 1.43892, lon: 125.1904, StationID: "0308BITU02", StationName: "Bitung", Latitude: 1.43892, Longitude: 125.1904, region: "Sulawesi" },
  { id: "0309LKPN02", name: "Likupang", lat: 1.69322, lon: 125.01383, StationID: "0309LKPN02", StationName: "Likupang", Latitude: 1.69322, Longitude: 125.01383, region: "Sulawesi" },
  { id: "0310PBGK01", name: "P. Baguk", lat: 2.295, lon: 97.40778, StationID: "0310PBGK01", StationName: "P. Baguk", Latitude: 2.295, Longitude: 97.40778, region: "Sumatera" },
  { id: "0311KAGN01", name: "Kota Agung", lat: -5.50072, lon: 104.61997, StationID: "0311KAGN01", StationName: "Kota Agung", Latitude: -5.50072, Longitude: 104.61997, region: "Sumatera" },
  { id: "0312MNTG02", name: "Mentigi", lat: -8.67236, lon: 115.55281, StationID: "0312MNTG02", StationName: "Mentigi", Latitude: -8.67236, Longitude: 115.55281, region: "Bali" },
  { id: "0313PANG01", name: "Pangandaran 2", lat: -7.7151, lon: 108.50308, StationID: "0313PANG01", StationName: "Pangandaran 2", Latitude: -7.7151, Longitude: 108.50308, region: "Jawa" },
  { id: "0314KGEN01", name: "Kangean", lat: -6.84264, lon: 115.22883, StationID: "0314KGEN01", StationName: "Kangean", Latitude: -6.84264, Longitude: 115.22883, region: "Indonesia" },
  { id: "0315BWAN01", name: "Bawean", lat: -5.85247, lon: 112.64272, StationID: "0315BWAN01", StationName: "Bawean", Latitude: -5.85247, Longitude: 112.64272, region: "Jawa" },
  { id: "0316TSTI01", name: "Tanjung Satai", lat: -1.21447, lon: 109.68924, StationID: "0316TSTI01", StationName: "Tanjung Satai", Latitude: -1.21447, Longitude: 109.68924, region: "Kalimantan" },
  { id: "0317PTKR01", name: "Padang Tikar", lat: -0.66471, lon: 109.27291, StationID: "0317PTKR01", StationName: "Padang Tikar", Latitude: -0.66471, Longitude: 109.27291, region: "Kalimantan" },
  { id: "0318TSGT02", name: "Teluk Segintung", lat: -3.34564, lon: 112.37434, StationID: "0318TSGT02", StationName: "Teluk Segintung", Latitude: -3.34564, Longitude: 112.37434, region: "Kalimantan" },
  { id: "0319PNDG02", name: "Pondong", lat: -1.80352, lon: 116.2514, StationID: "0319PNDG02", StationName: "Pondong", Latitude: -1.80352, Longitude: 116.2514, region: "Kalimantan" },
  { id: "0320MNPA03", name: "Manipa", lat: -3.34899, lon: 127.58977, StationID: "0320MNPA03", StationName: "Manipa", Latitude: -3.34899, Longitude: 127.58977, region: "Maluku" },
  { id: "0321TBRA03", name: "Teluk Bara", lat: -3.17317, lon: 126.2259, StationID: "0321TBRA03", StationName: "Teluk Bara", Latitude: -3.17317, Longitude: 126.2259, region: "Maluku" },
  { id: "0322PMOA03", name: "Moa", lat: -8.10676, lon: 127.81644, StationID: "0322PMOA03", StationName: "Moa", Latitude: -8.10676, Longitude: 127.81644, region: "Maluku" },
  { id: "0323TNBR03", name: "Tanimbar", lat: -7.98213, lon: 131.29058, StationID: "0323TNBR03", StationName: "Tanimbar", Latitude: -7.98213, Longitude: 131.29058, region: "Maluku" },
  { id: "0324TYDO03", name: "Tayando", lat: -5.59907, lon: 132.32749, StationID: "0324TYDO03", StationName: "Tayando", Latitude: -5.59907, Longitude: 132.32749, region: "Maluku" },
  { id: "0325ELAT03", name: "Elat", lat: -5.64872, lon: 132.99419, StationID: "0325ELAT03", StationName: "Elat", Latitude: -5.64872, Longitude: 132.99419, region: "Maluku" },
  { id: "0326FLBS03", name: "Falabisahaya", lat: -1.78974, lon: 125.48383, StationID: "0326FLBS03", StationName: "Falabisahaya", Latitude: -1.78974, Longitude: 125.48383, region: "Sulawesi" },
  { id: "0327BNMO03", name: "Banemo", lat: 0.32252, lon: 128.55556, StationID: "0327BNMO03", StationName: "Banemo", Latitude: 0.32252, Longitude: 128.55556, region: "Maluku" },
  { id: "0328GFSA03", name: "Gufasa", lat: 1.05681, lon: 127.46975, StationID: "0328GFSA03", StationName: "Gufasa", Latitude: 1.05681, Longitude: 127.46975, region: "Maluku" },
  { id: "0329LABN02", name: "Labuhan Lombok", lat: -8.49931, lon: 116.6731, StationID: "0329LABN02", StationName: "Labuhan Lombok", Latitude: -8.49931, Longitude: 116.6731, region: "Nusa Tenggara" },
  { id: "0330DPRE03", name: "Depapre", lat: -2.45501, lon: 140.3604, StationID: "0330DPRE03", StationName: "Depapre", Latitude: -2.45501, Longitude: 140.3604, region: "Papua" },
  { id: "0331SRUI03", name: "Serui", lat: -1.88746, lon: 136.24535, StationID: "0331SRUI03", StationName: "Serui", Latitude: -1.88746, Longitude: 136.24535, region: "Papua" },
  { id: "0332SGET03", name: "Seget", lat: -1.39654, lon: 130.97067, StationID: "0332SGET03", StationName: "Seget", Latitude: -1.39654, Longitude: 130.97067, region: "Maluku" },
  { id: "0333TMDG01", name: "Tj. Medang", lat: 2.11345, lon: 101.63771, StationID: "0333TMDG01", StationName: "Tj. Medang", Latitude: 2.11345, Longitude: 101.63771, region: "Sumatera" },
  { id: "0334DABO01", name: "Dabo Singkep", lat: -0.50447, lon: 104.5703, StationID: "0334DABO01", StationName: "Dabo Singkep", Latitude: -0.50447, Longitude: 104.5703, region: "Sumatera" },
  { id: "0335UBAN01", name: "Tanjung Uban", lat: 1.0587, lon: 104.22054, StationID: "0335UBAN01", StationName: "Tanjung Uban", Latitude: 1.0587, Longitude: 104.22054, region: "Sumatera" },
  { id: "0336ESSG02", name: "Essang", lat: 4.46094, lon: 126.72952, StationID: "0336ESSG02", StationName: "Essang", Latitude: 4.46094, Longitude: 126.72952, region: "Indonesia" },
  { id: "0337GNLO02", name: "Ganalo", lat: 4.42034, lon: 126.86152, StationID: "0337GNLO02", StationName: "Ganalo", Latitude: 4.42034, Longitude: 126.86152, region: "Indonesia" },
  { id: "0338PLPI02", name: "Palipi", lat: -3.3125, lon: 118.84944, StationID: "0338PLPI02", StationName: "Palipi", Latitude: -3.3125, Longitude: 118.84944, region: "Kalimantan" },
  { id: "0339BBNA02", name: "Babana", lat: -2.09898, lon: 119.19334, StationID: "0339BBNA02", StationName: "Babana", Latitude: -2.09898, Longitude: 119.19334, region: "Kalimantan" },
  { id: "0340KYDI02", name: "Kayuadi", lat: -6.80697, lon: 120.80903, StationID: "0340KYDI02", StationName: "Kayuadi", Latitude: -6.80697, Longitude: 120.80903, region: "Indonesia" },
  { id: "0341BLPA02", name: "Belopa", lat: -3.409, lon: 120.408, StationID: "0341BLPA02", StationName: "Belopa", Latitude: -3.409, Longitude: 120.408, region: "Sulawesi" },
  { id: "0342PADA01", name: "Padang", lat: -0.99608, lon: 100.3755, StationID: "0342PADA01", StationName: "Padang", Latitude: -0.99608, Longitude: 100.3755, region: "Sumatera" },
  { id: "0343KLJL01", name: "Kuala Jelai", lat: -2.53093, lon: 110.21326, StationID: "0343KLJL01", StationName: "Kuala Jelai", Latitude: -2.53093, Longitude: 110.21326, region: "Kalimantan" },
  { id: "0344KDWG01", name: "Kendawangan", lat: -2.97753, lon: 110.7412, StationID: "0344KDWG01", StationName: "Kendawangan", Latitude: -2.97753, Longitude: 110.7412, region: "Kalimantan" },
];

export const STATIONLIST_STORAGE_KEY = "tide_db_stationlist";

/**
 * Membaca stasiun yang tersimpan khusus dari tabel MySQL stationlist.
 */
export function getStoredStationList(): TideStation[] {
  try {
    const raw = localStorage.getItem(STATIONLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((st: any) => {
        const id = String(st.id || st.StationID || st.StationId || st.Id_Sta || st.name || "");
        const name = String(st.name || st.StationName || st.Station_Name || st.Nama_Sta || st.id || "");
        const lat = typeof st.lat === "number" ? st.lat : (parseFloat(String(st.lat ?? st.Latitude ?? 0)) || 0);
        const lon = typeof st.lon === "number" ? st.lon : (parseFloat(String(st.lon ?? st.Longitude ?? 0)) || 0);
        return {
          id,
          name,
          lat,
          lon,
          StationID: id,
          StationName: name,
          Latitude: lat,
          Longitude: lon,
          region: String(st.region || "Tabel stationlist"),
          isFromStationList: true
        };
      }).filter(s => s.name.trim().length > 0);
    }
  } catch (e) {
    console.warn("Gagal membaca stationlist dari localStorage", e);
  }
  return [];
}

/**
 * Mendapatkan seluruh daftar stasiun.
 * Berisi seluruh 321 stasiun resmi dari stainfo.csv dan diperbarui dari database bila ada.
 */
export function getAllStations(): TideStation[] {
  const map = new Map<string, TideStation>();

  // 1. Masukkan seluruh stasiun dari stainfo.csv
  for (const st of BASELINE_TIDE_STATIONS) {
    map.set(st.id.toUpperCase(), { ...st, isFromStationList: false });
  }

  // 2. Gabungkan jika ada stasiun baru dari sinkronisasi tabel database
  const stationList = getStoredStationList();
  for (const st of stationList) {
    if (st && (st.id || st.name)) {
      const key = (st.id || st.name).toUpperCase();
      const existing = map.get(key);
      map.set(key, {
        id: st.id || existing?.id || st.name,
        name: st.name || existing?.name || st.id,
        lat: typeof st.lat === "number" && !isNaN(st.lat) ? st.lat : (existing?.lat ?? 0),
        lon: typeof st.lon === "number" && !isNaN(st.lon) ? st.lon : (existing?.lon ?? 0),
        StationID: st.StationID || st.id || existing?.StationID || "",
        StationName: st.StationName || st.name || existing?.StationName || "",
        Latitude: typeof st.Latitude === "number" ? st.Latitude : (existing?.Latitude ?? st.lat ?? 0),
        Longitude: typeof st.Longitude === "number" ? st.Longitude : (existing?.Longitude ?? st.lon ?? 0),
        region: st.region || existing?.region || "Tabel stationlist",
        isFromStationList: true
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "id"));
}

/**
 * Menyimpan stasiun yang didapat dari tabel MySQL (stationlist / data_vsat5).
 */
export function registerDbStations(dbStations: Array<any>) {
  if (!Array.isArray(dbStations) || dbStations.length === 0) return;

  const currentStored = getStoredStationList();
  const stationMap = new Map<string, TideStation>();

  for (const s of currentStored) {
    if (s.id || s.name) stationMap.set((s.id || s.name).toUpperCase(), s);
  }

  for (const item of dbStations) {
    if (!item) continue;

    const stationId = (
      item.Id_Sta ||
      item.id_sta ||
      item.StationID ||
      item.StationId ||
      item.stationid ||
      item.station_id ||
      item.id ||
      ""
    ).toString().trim();

    const stationName = (
      item.Nama_Sta ||
      item.nama_sta ||
      item.StationName ||
      item.stationname ||
      item.Station_Name ||
      item.station_name ||
      item.NamaStasiun ||
      item.nama_stasiun ||
      item.name ||
      stationId ||
      ""
    ).toString().trim();

    if (!stationName && !stationId) continue;

    const rawLat = item.Latitude !== undefined && item.Latitude !== null 
      ? item.Latitude 
      : (item.latitude ?? item.Lat ?? item.lat ?? 0);
    const rawLon = item.Longitude !== undefined && item.Longitude !== null 
      ? item.Longitude 
      : (item.longitude ?? item.Lon ?? item.lon ?? item.Lng ?? item.lng ?? 0);

    const lat = typeof rawLat === "number" ? rawLat : (parseFloat(String(rawLat)) || 0);
    const lon = typeof rawLon === "number" ? rawLon : (parseFloat(String(rawLon)) || 0);

    const region = (
      item.Region ||
      item.region ||
      item.Provinsi ||
      item.Province ||
      item.Lokasi ||
      "Tabel stationlist"
    ).toString().trim();

    const key = (stationId || stationName).toUpperCase();
    const stationObj: TideStation = {
      id: stationId || stationName,
      name: stationName || stationId,
      lat,
      lon,
      StationID: stationId || stationName,
      StationName: stationName || stationId,
      Latitude: lat,
      Longitude: lon,
      region,
      isFromStationList: true
    };

    stationMap.set(key, stationObj);
  }

  const updatedList = Array.from(stationMap.values());

  try {
    localStorage.setItem(STATIONLIST_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent("tide_stations_updated"));
  } catch (e) {
    console.warn("Gagal menyimpan stationlist ke localStorage", e);
  }
}

/**
 * Sinkronisasi otomatis stasiun dari tabel stationlist database MySQL secara background.
 */
export async function syncStationListFromDb(): Promise<TideStation[]> {
  try {
    const credsStr = localStorage.getItem("tide_db_credentials");
    if (!credsStr) return getAllStations();
    const creds = JSON.parse(credsStr);
    if (!creds || !creds.host || !creds.database) return getAllStations();

    const trimmedHost = String(creds.host).trim().toLowerCase();
    const isPrivate = (
      trimmedHost === "localhost" ||
      trimmedHost === "127.0.0.1" ||
      trimmedHost === "::1" ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmedHost) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(trimmedHost) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(trimmedHost)
    );

    if (isPrivate) {
      return getAllStations();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch("/api/db/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: creds.host,
        port: creds.port || 3306,
        user: creds.user || "root",
        password: creds.password || "",
        database: creds.database,
        table: "stationlist",
        limit: 1000
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      registerDbStations(data.data);
    }
  } catch (err) {
    // Silent catch on background auto-sync
  }
  return getAllStations();
}

/**
 * Mencari stasiun pasut berdasarkan query teks.
 * Memeriksa Nama Stasiun, ID Stasiun, atau Region.
 */
export function searchStations(query: string, maxResults = 15): TideStation[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const all = getAllStations();
  
  return all
    .filter(st => {
      const n = st.name.toLowerCase();
      const id = st.id.toLowerCase();
      const r = (st.region || "").toLowerCase();
      return n.includes(trimmed) || id.includes(trimmed) || r.includes(trimmed);
    })
    .sort((a, b) => {
      // 1. Cocok persis pada nama atau ID
      const aExact = a.name.toLowerCase() === trimmed || a.id.toLowerCase() === trimmed;
      const bExact = b.name.toLowerCase() === trimmed || b.id.toLowerCase() === trimmed;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // 2. Cocok awal kata pada StationName
      const aStartsName = a.name.toLowerCase().startsWith(trimmed);
      const bStartsName = b.name.toLowerCase().startsWith(trimmed);
      if (aStartsName && !bStartsName) return -1;
      if (!aStartsName && bStartsName) return 1;

      // 3. Cocok awal kata pada ID
      const aStartsId = a.id.toLowerCase().startsWith(trimmed);
      const bStartsId = b.id.toLowerCase().startsWith(trimmed);
      if (aStartsId && !bStartsId) return -1;
      if (!aStartsId && bStartsId) return 1;

      return a.name.localeCompare(b.name, "id");
    })
    .slice(0, maxResults);
}

/**
 * Mencocokkan nama stasiun atau ID dengan stasiun terdekat / persis.
 */
export function findStationByNameOrId(text: string): TideStation | null {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return null;

  const all = getAllStations();

  // 1. Exact match by StationID
  const exactId = all.find(s => s.id.toLowerCase() === trimmed || (s.StationID && s.StationID.toLowerCase() === trimmed));
  if (exactId) return exactId;

  // 2. Exact match by StationName
  const exactName = all.find(s => s.name.toLowerCase() === trimmed || (s.StationName && s.StationName.toLowerCase() === trimmed));
  if (exactName) return exactName;

  // 3. Substring match for StationID (misal: "CCAP01" cocok dengan "0001CCAP01")
  const idSubMatch = all.find(s => s.id.toLowerCase().includes(trimmed) || (s.StationID && s.StationID.toLowerCase().includes(trimmed)) || trimmed.includes(s.id.toLowerCase()));
  if (idSubMatch) return idSubMatch;

  // 4. StartsWith match by StationName
  const startsWithName = all.find(s => s.name.toLowerCase().startsWith(trimmed));
  if (startsWithName) return startsWithName;

  // 5. StartsWith match by StationID
  const startsWithId = all.find(s => s.id.toLowerCase().startsWith(trimmed));
  if (startsWithId) return startsWithId;

  // 6. Includes match by StationName
  const incName = all.find(s => s.name.toLowerCase().includes(trimmed));
  if (incName) return incName;

  return null;
}
