// Katalog Kejadian Gempabumi Tektonik & Vulkanik Berpotensi Tsunami BMKG / InaTEWS
// Khususnya tahun 2018 (Tsunami Selat Sunda / Anak Krakatau, Tsunami Palu, Gempa Lombok)
// serta peristiwa tsunami historis terkemuka di Indonesia.

export interface BMKGEvent {
  id: string;
  tanggal: string;          // e.g. "22-Des-2018"
  jam: string;              // e.g. "21:03:00 WIB"
  timeMs: number;           // UTC epoch ms
  type: 'vulkanik' | 'tektonik';
  title: string;
  magnitude: string;
  magFloat: number;
  depth: string;
  coordinates: string;
  lat: number;
  lon: number;
  wilayah: string;
  potensi: string;
  keterangan: string;
}

export const BMKG_HISTORICAL_EVENTS: BMKGEvent[] = [
  // ==================== TAHUN 2018 ====================
  {
    id: "bmkg-2018-12-22-krakatau",
    tanggal: "22-Des-2018",
    jam: "21:03:00 WIB",
    // 22 Dec 2018 21:03:00 WIB = 14:03:00 UTC
    timeMs: Date.UTC(2018, 11, 22, 14, 3, 0),
    type: "vulkanik",
    title: "Erupsi & Runtuhan Lereng Gn. Anak Krakatau (Tsunami Selat Sunda)",
    magnitude: "M 3.4 (Tremor Seismik) / Flank Collapse 64 Ha",
    magFloat: 3.4,
    depth: "1 km",
    coordinates: "6.102 LS, 105.423 BT",
    lat: -6.102,
    lon: 105.423,
    wilayah: "Selat Sunda (Banten & Lampung), Gunung Anak Krakatau",
    potensi: "Berpotensi TSUNAMI (Tsunami Selat Sunda - Anyer, Carita, Kalianda, Kota Agung)",
    keterangan: "Tsunami non-tektonik akibat erupsi hebat dan runtuhnya 64 hektar lereng barat daya Gunung Anak Krakatau ke laut, memicu gelombang tsunami di pesisir Banten dan Lampung."
  },
  {
    id: "bmkg-2018-09-28-palu",
    tanggal: "28-Sep-2018",
    jam: "17:02:44 WIB",
    // 28 Sep 2018 17:02:44 WIB (10:02:44 UTC)
    timeMs: Date.UTC(2018, 8, 28, 10, 2, 44),
    type: "tektonik",
    title: "Gempabumi Tektonik Palu - Donggala & Longsoran Bawah Laut",
    magnitude: "M 7.4 (Mw 7.5)",
    magFloat: 7.4,
    depth: "10 km",
    coordinates: "0.18 LS, 119.85 BT",
    lat: -0.18,
    lon: 119.85,
    wilayah: "26 km Utara Donggala, Sulawesi Tengah",
    potensi: "Berpotensi TSUNAMI (Tsunami Teluk Palu & Donggala)",
    keterangan: "Gempa sesar geser Palu-Koro yang memicu likuifaksi dan longsoran sedimen bawah laut di Teluk Palu, menghasilkan gelombang tsunami dahsyat hingga 4-7 meter."
  },
  {
    id: "bmkg-2018-08-05-lombok",
    tanggal: "05-Ags-2018",
    jam: "18:46:35 WIB",
    // 05 Aug 2018 18:46:35 WIB (11:46:35 UTC)
    timeMs: Date.UTC(2018, 7, 5, 11, 46, 35),
    type: "tektonik",
    title: "Gempabumi Tektonik Sesar Naik Lombok Utara",
    magnitude: "M 7.0",
    magFloat: 7.0,
    depth: "15 km",
    coordinates: "8.37 LS, 116.48 BT",
    lat: -8.37,
    lon: 116.48,
    wilayah: "18 km Barat Laut Lombok Timur, NTB",
    potensi: "Berpotensi TSUNAMI (Peringatan Dini BMKG - tercatat tsunami di Carik 0.135 m & Badas 0.09 m)",
    keterangan: "Gempa bumi Flores Back-Arc Thrust yang memicu anomali tsunami di stasiun pasut Carik dan Teluk Badas Sumbawa."
  },
  {
    id: "bmkg-2018-08-19-lombok2",
    tanggal: "19-Ags-2018",
    jam: "21:56:27 WIB",
    // 19 Aug 2018 21:56:27 WIB (14:56:27 UTC)
    timeMs: Date.UTC(2018, 7, 19, 14, 56, 27),
    type: "tektonik",
    title: "Gempabumi Tektonik Susulan Lombok Timur",
    magnitude: "M 6.9",
    magFloat: 6.9,
    depth: "10 km",
    coordinates: "8.28 LS, 116.64 BT",
    lat: -8.28,
    lon: 116.64,
    wilayah: "30 km Timur Laut Lombok Timur, NTB",
    potensi: "Tidak Berpotensi Tsunami Luas",
    keterangan: "Aktivitas gempa susulan tektonik di zona sesar naik busur belakang Flores."
  },
  {
    id: "bmkg-2018-12-29-talaud",
    tanggal: "29-Des-2018",
    jam: "10:39:09 WIB",
    // 29 Dec 2018 10:39:09 WIB (03:39:09 UTC)
    timeMs: Date.UTC(2018, 11, 29, 3, 39, 9),
    type: "tektonik",
    title: "Gempabumi Tektonik Laut Filipina / Kepulauan Talaud",
    magnitude: "M 7.1",
    magFloat: 7.1,
    depth: "49 km",
    coordinates: "5.85 LU, 126.89 BT",
    lat: 5.85,
    lon: 126.89,
    wilayah: "193 km Barat Laut Melonguane, Kepulauan Talaud, Sulut",
    potensi: "Berpotensi TSUNAMI Lokal (PTWC / BMKG mengeluarkan evaluasi tsunami lokal)",
    keterangan: "Gempa bumi subduksi lempeng Filipina di dekat perbatasan laut Kepulauan Talaud."
  },
  {
    id: "bmkg-2018-12-01-halmahera",
    tanggal: "01-Des-2018",
    jam: "20:27:21 WIB",
    // 01 Dec 2018 20:27:21 WIB (13:27:21 UTC)
    timeMs: Date.UTC(2018, 11, 1, 13, 27, 21),
    type: "tektonik",
    title: "Gempabumi Tektonik Laut Maluku / Halmahera Barat",
    magnitude: "M 6.5",
    magFloat: 6.5,
    depth: "10 km",
    coordinates: "1.83 LU, 126.78 BT",
    lat: 1.83,
    lon: 126.78,
    wilayah: "125 km Barat Laut Halmahera Barat, Maluku Utara",
    potensi: "Tidak Berpotensi Tsunami",
    keterangan: "Gempa tektonik intraplate lempeng Laut Maluku."
  },
  {
    id: "bmkg-2018-12-28-manokwari",
    tanggal: "28-Des-2018",
    jam: "00:03:00 WIB",
    // 27 Dec 2018 17:03:00 UTC
    timeMs: Date.UTC(2018, 11, 27, 17, 3, 0),
    type: "tektonik",
    title: "Gempabumi Tektonik Manokwari Selatan",
    magnitude: "M 6.1",
    magFloat: 6.1,
    depth: "26 km",
    coordinates: "1.40 LS, 134.10 BT",
    lat: -1.40,
    lon: 134.10,
    wilayah: "55 km Tenggara Manokwari Selatan, Papua Barat",
    potensi: "Tidak Berpotensi Tsunami",
    keterangan: "Gempa tektonik sesar Ransiki di Papua Barat."
  },
  {
    id: "bmkg-2018-01-23-lebak",
    tanggal: "23-Jan-2018",
    jam: "13:34:53 WIB",
    // 23 Jan 2018 06:34:53 UTC
    timeMs: Date.UTC(2018, 0, 23, 6, 34, 53),
    type: "tektonik",
    title: "Gempabumi Tektonik Intraslab Lebak, Banten",
    magnitude: "M 6.1",
    magFloat: 6.1,
    depth: "61 km",
    coordinates: "7.21 LS, 105.91 BT",
    lat: -7.21,
    lon: 105.91,
    wilayah: "81 km Barat Daya Lebak, Banten (Selat Sunda)",
    potensi: "Tidak Berpotensi Tsunami",
    keterangan: "Gempa kedalaman menengah di zona subduksi Selat Sunda / Banten."
  },
  {
    id: "bmkg-2018-10-10-situbondo",
    tanggal: "10-Okt-2018",
    jam: "23:44:57 WIB",
    // 10 Oct 2018 16:44:57 UTC
    timeMs: Date.UTC(2018, 9, 10, 16, 44, 57),
    type: "tektonik",
    title: "Gempabumi Tektonik Situbondo / Selat Madura",
    magnitude: "M 6.4",
    magFloat: 6.4,
    depth: "10 km",
    coordinates: "7.42 LS, 114.47 BT",
    lat: -7.42,
    lon: 114.47,
    wilayah: "61 km Timur Laut Situbondo, Jawa Timur",
    potensi: "Tidak Berpotensi Tsunami",
    keterangan: "Aktivitas sesar naik busur belakang (back-arc thrust) di utara Jawa Timur."
  },
  {
    id: "bmkg-2018-07-29-lombok1",
    tanggal: "29-Jul-2018",
    jam: "05:47:39 WIB",
    // 28 Jul 2018 22:47:39 UTC
    timeMs: Date.UTC(2018, 6, 28, 22, 47, 39),
    type: "tektonik",
    title: "Gempabumi Tektonik Pendahulu Lombok Timur",
    magnitude: "M 6.4",
    magFloat: 6.4,
    depth: "10 km",
    coordinates: "8.26 LS, 116.55 BT",
    lat: -8.26,
    lon: 116.55,
    wilayah: "28 km Barat Laut Lombok Timur, NTB",
    potensi: "Tidak Berpotensi Tsunami",
    keterangan: "Gempa pendahulu (foreshock) rangkaian gempabumi Lombok 2018."
  },

  // ==================== PERISTIWA HISTORIS INDONESIA ====================
  {
    id: "bmkg-2004-12-26-aceh",
    tanggal: "26-Des-2004",
    jam: "07:58:53 WIB",
    timeMs: Date.UTC(2004, 11, 26, 0, 58, 53),
    type: "tektonik",
    title: "Gempabumi Megathrust & Tsunami Samudera Hindia (Aceh)",
    magnitude: "M 9.1 (Mw 9.3)",
    magFloat: 9.1,
    depth: "30 km",
    coordinates: "3.316 LU, 95.854 BT",
    lat: 3.316,
    lon: 95.854,
    wilayah: "Pantai Barat Sumatera / Aceh",
    potensi: "Berpotensi TSUNAMI (Tsunami Samudera Hindia)",
    keterangan: "Salah satu gempa dan tsunami terbesar dalam sejarah modern di zona Megathrust Sumatera-Andaman."
  },
  {
    id: "bmkg-2005-03-28-nias",
    tanggal: "28-Mar-2005",
    jam: "23:09:36 WIB",
    timeMs: Date.UTC(2005, 2, 28, 16, 9, 36),
    type: "tektonik",
    title: "Gempabumi Tektonik Nias - Simeulue",
    magnitude: "M 8.6",
    magFloat: 8.6,
    depth: "30 km",
    coordinates: "2.074 LU, 97.013 BT",
    lat: 2.074,
    lon: 97.013,
    wilayah: "Kepulauan Nias dan Simeulue, Sumatera Utara",
    potensi: "Berpotensi TSUNAMI (Tsunami Lokal 3-4 meter)",
    keterangan: "Gempa tektonik megathrust di sebelah tenggara gempa 2004."
  },
  {
    id: "bmkg-2006-07-17-pangandaran",
    tanggal: "17-Jul-2006",
    jam: "15:19:28 WIB",
    timeMs: Date.UTC(2006, 6, 17, 8, 19, 28),
    type: "tektonik",
    title: "Gempabumi & Tsunami Tsunami Earthquake Pangandaran",
    magnitude: "M 7.7",
    magFloat: 7.7,
    depth: "10 km",
    coordinates: "9.295 LS, 107.347 BT",
    lat: -9.295,
    lon: 107.347,
    wilayah: "Samudera Hindia, Selatan Pangandaran / Jawa Barat",
    potensi: "Berpotensi TSUNAMI (Tsunami Pangandaran)",
    keterangan: "Tsunami earthquake dengan goncangan lemah namun membangkitkan tsunami tinggi di pesisir selatan Jawa."
  },
  {
    id: "bmkg-2007-09-12-bengkulu",
    tanggal: "12-Sep-2007",
    jam: "18:10:23 WIB",
    timeMs: Date.UTC(2007, 8, 12, 11, 10, 23),
    type: "tektonik",
    title: "Gempabumi Tektonik Bengkulu",
    magnitude: "M 8.4",
    magFloat: 8.4,
    depth: "34 km",
    coordinates: "4.520 LS, 101.374 BT",
    lat: -4.520,
    lon: 101.374,
    wilayah: "Lepas Pantai Barat Bengkulu",
    potensi: "Berpotensi TSUNAMI",
    keterangan: "Gempa megathrust segmen Mentawai-Bengkulu membangkitkan tsunami hingga 2-3 meter."
  },
  {
    id: "bmkg-2010-10-25-mentawai",
    tanggal: "25-Okt-2010",
    jam: "21:42:22 WIB",
    timeMs: Date.UTC(2010, 9, 25, 14, 42, 22),
    type: "tektonik",
    title: "Gempabumi & Tsunami Mentawai (Tsunami Earthquake)",
    magnitude: "M 7.7",
    magFloat: 7.7,
    depth: "20 km",
    coordinates: "3.484 LS, 100.114 BT",
    lat: -3.484,
    lon: 100.114,
    wilayah: "Kepulauan Mentawai, Sumatera Barat",
    potensi: "Berpotensi TSUNAMI (Tsunami Mentawai)",
    keterangan: "Gempa lambat (tsunami earthquake) dangkal memicu run-up tsunami hingga 9 meter di Pagai Selatan."
  },
  {
    id: "bmkg-2021-12-14-flores",
    tanggal: "14-Des-2021",
    jam: "10:20:23 WIB",
    timeMs: Date.UTC(2021, 11, 14, 3, 20, 23),
    type: "tektonik",
    title: "Gempabumi Tektonik Laut Flores",
    magnitude: "M 7.4",
    magFloat: 7.4,
    depth: "10 km",
    coordinates: "7.59 LS, 122.24 BT",
    lat: -7.59,
    lon: 122.24,
    wilayah: "112 km Barat Laut Larantuka, NTT",
    potensi: "Berpotensi TSUNAMI (Peringatan Dini BMKG - anomali terdeteksi 0.07 m di Reo & Marapokot)",
    keterangan: "Sesar geser mendatar di Laut Flores."
  },
  {
    id: "bmkg-2023-01-10-malukubarat",
    tanggal: "10-Jan-2023",
    jam: "00:47:34 WIB",
    timeMs: Date.UTC(2023, 0, 9, 17, 47, 34),
    type: "tektonik",
    title: "Gempabumi Tektonik Maluku Barat Daya",
    magnitude: "M 7.5",
    magFloat: 7.5,
    depth: "130 km",
    coordinates: "7.25 LS, 130.18 BT",
    lat: -7.25,
    lon: 130.18,
    wilayah: "148 km Barat Laut Maluku Tenggara Barat",
    potensi: "Berpotensi TSUNAMI (Peringatan Dini BMKG)",
    keterangan: "Gempa intraslab subduksi Banda memicu peringatan dini tsunami BMKG."
  },
  {
    id: "bmkg-2023-04-25-mentawai",
    tanggal: "25-Apr-2023",
    jam: "03:00:57 WIB",
    timeMs: Date.UTC(2023, 3, 24, 20, 0, 57),
    type: "tektonik",
    title: "Gempabumi Tektonik Mentawai - Siberut",
    magnitude: "M 7.3",
    magFloat: 7.3,
    depth: "84 km",
    coordinates: "0.93 LS, 98.39 BT",
    lat: -0.93,
    lon: 98.39,
    wilayah: "177 km Barat Laut Kepulauan Mentawai, Sumbar",
    potensi: "Berpotensi TSUNAMI (Tercatat 0.11 m di Tanah Bala)",
    keterangan: "Gempa subduksi megathrust Siberut."
  }
];

/**
 * Mencari kejadian gempa / vulkanik dari katalog historis BMKG yang sesuai
 * dengan rentang waktu pengamatan data pasut [dataStart - 48 jam, dataEnd].
 */
export function findBMKGEventsForRange(dataStartMs: number, dataEndMs: number): BMKGEvent[] {
  if (!dataStartMs || !dataEndMs || isNaN(dataStartMs) || isNaN(dataEndMs)) return [];
  
  // Berikan margin 48 jam sebelum dataStart untuk mengantisipasi gelombang tsunami tiba pasca gempa
  const windowStart = dataStartMs - (48 * 3600 * 1000);
  const windowEnd = dataEndMs + (2 * 3600 * 1000); // 2 jam toleransi setelah dataEnd

  const matches = BMKG_HISTORICAL_EVENTS.filter(e => {
    return e.timeMs >= windowStart && e.timeMs <= windowEnd;
  });

  // Urutkan:
  // 1. Yang Berpotensi Tsunami lebih diprioritaskan
  // 2. Magnitudo tertinggi
  matches.sort((a, b) => {
    const aTsunami = a.potensi.toLowerCase().includes('tsunami') ? 1 : 0;
    const bTsunami = b.potensi.toLowerCase().includes('tsunami') ? 1 : 0;
    if (aTsunami !== bTsunami) return bTsunami - aTsunami;
    return b.magFloat - a.magFloat;
  });

  return matches;
}
