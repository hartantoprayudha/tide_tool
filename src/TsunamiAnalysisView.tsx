import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ReferenceLine, ReferenceArea, Brush } from 'recharts';
import { Activity, AlertTriangle, Clock, Waves, PanelRightClose, PanelRightOpen, Settings, Download, ZoomIn, CheckCircle2, ChevronDown, Flame, ShieldAlert } from 'lucide-react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { cn } from './lib/utils';
import { findBMKGEventsForRange, BMKGEvent, BMKG_HISTORICAL_EVENTS } from './bmkgCatalog';

const formatUTC = (date: Date, fmt: string) => {
  if (isNaN(date.getTime())) return "Invalid Date";
  const y = date.getUTCFullYear();
  const yyyy = String(y);
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');

  return fmt
    .replace('yyyy', yyyy)
    .replace('MM', m)
    .replace('dd', d)
    .replace('HH', hh)
    .replace('mm', mm)
    .replace('ss', ss);
};

export default function TsunamiAnalysisView({ records, selectedSensor, availableSensors, stationName, stationLat, stationLon }: any) {
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [vZoom, setVZoom] = useState(1);
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [zoomDomain, setZoomDomain] = useState<{start: number, end: number} | null>(null);
  const [bmkgData, setBmkgData] = useState<BMKGEvent | any>(null);
  const [candidateEvents, setCandidateEvents] = useState<BMKGEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const [brushKey, setBrushKey] = useState(0);

  // Line visibility state for toggling
  const [visibleLines, setVisibleLines] = useState({
    raw: true,
    smoothed: true,
    tsunamiSignal: true,
  });

  const toggleLine = (key: 'raw' | 'smoothed' | 'tsunamiSignal') => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!records || records.length === 0) {
      setBmkgData(null);
      setCandidateEvents([]);
      setSelectedEventId('');
      return;
    }

    const toMs = (ts: any) => {
      if (ts instanceof Date) return ts.getTime();
      if (typeof ts === 'number') return ts;
      const parsed = new Date(ts).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };

    const dataStart = toMs(records[0]?.timestamp);
    const dataEnd = toMs(records[records.length - 1]?.timestamp);

    if (!dataStart || !dataEnd || isNaN(dataStart) || isNaN(dataEnd)) {
      setBmkgData(null);
      setCandidateEvents([]);
      setSelectedEventId('');
      return;
    }

    // 1. First priority: Check historical BMKG catalog (includes 2018 Anak Krakatau, Palu, Lombok, etc.)
    const catalogMatches = findBMKGEventsForRange(dataStart, dataEnd);

    const fetchGempaData = async () => {
      let allCandidates: BMKGEvent[] = [...catalogMatches];

      try {
        // Try live BMKG history
        const histRes = await fetch('/api/bmkg/history');
        if (histRes.ok) {
          const htmlStr = await histRes.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlStr, "text/html");
          const rows = doc.querySelectorAll('table tbody tr');

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cols = row.querySelectorAll('td');
            if (cols.length >= 7) {
              const waktuHtml = cols[1].innerHTML;
              const waktuLines = waktuHtml.split('<br>');
              const tglPart = waktuLines[0]?.trim();
              const jamPart = waktuLines[1]?.trim()?.replace(' WIB', '');

              if (tglPart && jamPart) {
                const monthMap: Record<string, string> = { 'Jan':'Jan', 'Feb':'Feb', 'Mar':'Mar', 'Apr':'Apr', 'Mei':'May', 'Jun':'Jun', 'Jul':'Jul', 'Agt':'Aug', 'Sep':'Sep', 'Okt':'Oct', 'Nov':'Nov', 'Des':'Dec' };
                let engDateStr = tglPart;
                Object.keys(monthMap).forEach(id => {
                  engDateStr = engDateStr.replace(id, monthMap[id]);
                });

                const timeStr = `${engDateStr} ${jamPart.replace(/\./g, ':')} +0700`;
                const timeMs = new Date(timeStr).getTime();

                if (!isNaN(timeMs) && timeMs >= dataStart - (48 * 3600 * 1000) && timeMs <= dataEnd) {
                  if (!allCandidates.some(c => Math.abs(c.timeMs - timeMs) < 1800000)) {
                    allCandidates.push({
                      id: `live-hist-${timeMs}`,
                      tanggal: tglPart,
                      jam: jamPart + ' WIB',
                      timeMs: timeMs,
                      type: 'tektonik',
                      title: `Gempabumi Tektonik ${cols[6].textContent?.trim() || ''}`,
                      magnitude: cols[3].textContent?.trim() || "0",
                      magFloat: parseFloat(cols[3].textContent?.trim().replace(',', '.') || "0"),
                      depth: cols[5]?.textContent?.trim() || '-',
                      coordinates: cols[4]?.textContent?.trim() || '-',
                      lat: 0,
                      lon: 0,
                      wilayah: cols[6].textContent?.trim() || "",
                      potensi: cols[2].textContent?.trim() || "Berpotensi Tsunami",
                      keterangan: "Data arsip gempa BMKG."
                    });
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        // Fallback gracefully
      }

      // Sort candidate events: events with tsunami potential first, then by magnitude
      allCandidates.sort((a, b) => {
        const aTsu = a.potensi.toLowerCase().includes('tsunami') ? 1 : 0;
        const bTsu = b.potensi.toLowerCase().includes('tsunami') ? 1 : 0;
        if (aTsu !== bTsu) return bTsu - aTsu;
        return b.magFloat - a.magFloat;
      });

      setCandidateEvents(allCandidates);
      if (allCandidates.length > 0) {
        setBmkgData(allCandidates[0]);
        setSelectedEventId(allCandidates[0].id);
      } else {
        setBmkgData(null);
        setSelectedEventId('');
      }
    };

    fetchGempaData();
  }, [records]);

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    const found = candidateEvents.find(e => e.id === id);
    if (found) {
      setBmkgData(found);
    }
  };

  const handleFocusTsunami = () => {
    if (detection.start && detection.end) {
      const buffer = 2 * 3600 * 1000;
      setZoomDomain({
        start: detection.start - buffer,
        end: detection.end + buffer
      });
      setVZoom(1.8);
    } else if (bmkgData?.timeMs) {
      setZoomDomain({
        start: bmkgData.timeMs - (2 * 3600 * 1000),
        end: bmkgData.timeMs + (12 * 3600 * 1000)
      });
      setVZoom(1.8);
    }
  };

  // Tsunami Detection Algorithm (FFT High-Pass / Band-Pass)
  const detection = useMemo(() => {
    if (!records || records.length === 0) return { detected: false, maxWave: 0, start: null, end: null, data: [] };

    const toMs = (ts: any) => {
      if (ts instanceof Date) return ts.getTime();
      if (typeof ts === 'number') return ts;
      const parsed = new Date(ts).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };

    const tsData = records.map((r: any) => {
      const timeMs = toMs(r.timestamp);
      const v = (r.allSamples && r.allSamples[selectedSensor] !== undefined) ? r.allSamples[selectedSensor] : (!isNaN(r.filtered) ? r.filtered : r.raw);
      return { timestamp: timeMs, val: v };
    }).filter((d: any) => d.timestamp > 0);

    if (tsData.length === 0) return { detected: false, maxWave: 0, start: null, end: null, data: [] };

    // 1. Calculate median dt (time step in seconds)
    let dts = [];
    for(let i = 1; i < tsData.length; i++) {
        dts.push((tsData[i].timestamp - tsData[i-1].timestamp) / 1000);
    }
    dts.sort((a,b) => a - b);
    let dt = dts[Math.floor(dts.length / 2)] || 60; 

    // Handle missing data (NaN) by linear interpolation for FFT
    let y = new Float64Array(tsData.length);
    let lastValid = 0;
    for (let i = 0; i < tsData.length; i++) {
        if (!isNaN(tsData[i].val) && tsData[i].val !== null) {
            lastValid = tsData[i].val;
            break;
        }
    }

    for (let i = 0; i < tsData.length; i++) {
        if (!isNaN(tsData[i].val) && tsData[i].val !== null) {
            y[i] = tsData[i].val;
            lastValid = y[i];
        } else {
            let nextValid = lastValid;
            let nextIdx = i;
            for(let j = i + 1; j < tsData.length; j++){
               if (!isNaN(tsData[j].val) && tsData[j].val !== null) {
                   nextValid = tsData[j].val;
                   nextIdx = j;
                   break;
               }
            }
            if (nextIdx === i) y[i] = lastValid;
            else {
               let frac = 1 / (nextIdx - i + 1);
               y[i] = lastValid + (nextValid - lastValid) * frac;
               lastValid = y[i];
            }
        }
    }

    // Nearest power of 2 for FFT
    let n = 1;
    while(n < y.length) n <<= 1;

    let real = new Float64Array(n);
    let imag = new Float64Array(n);

    // Detrend/demean before FFT
    let sumY = 0;
    for(let i = 0; i < y.length; i++) sumY += y[i];
    let meanY = sumY / y.length;

    for(let i = 0; i < y.length; i++){
        real[i] = y[i] - meanY;
    }

    // Radix-2 FFT implementation
    const fft = (real: Float64Array, imag: Float64Array) => {
        const n = real.length;
        if (n <= 1) return;
        let j = 0;
        for (let i = 0; i < n - 1; i++) {
            if (i < j) {
                let temp = real[i]; real[i] = real[j]; real[j] = temp;
                temp = imag[i]; imag[i] = imag[j]; imag[j] = temp;
            }
            let m = n >> 1;
            while (m <= j) { j -= m; m >>= 1; }
            j += m;
        }
        for (let size = 2; size <= n; size <<= 1) {
            let halfSize = size >> 1;
            let angle = -2 * Math.PI / size;
            let wReal = Math.cos(angle);
            let wImag = Math.sin(angle);
            for (let i = 0; i < n; i += size) {
                let uReal = 1;
                let uImag = 0;
                for (let j = 0; j < halfSize; j++) {
                    let k = i + j;
                    let l = k + halfSize;
                    let tx = uReal * real[l] - uImag * imag[l];
                    let ty = uReal * imag[l] + uImag * real[l];
                    real[l] = real[k] - tx;
                    imag[l] = imag[k] - ty;
                    real[k] += tx;
                    imag[k] += ty;
                    let tempReal = uReal * wReal - uImag * wImag;
                    uImag = uReal * wImag + uImag * wReal;
                    uReal = tempReal;
                }
            }
        }
    };

    fft(real, imag);

    // Band-pass filter frequencies:
    // f_min = 0.00008 Hz (Period ~3.5 hours, filters astronomical tides)
    // f_max = min(0.00833 Hz, Nyquist) (Period down to 2 minutes, filters short wind waves)
    const f_min = 0.00008; 
    const nyquist = 1 / (2 * Math.max(dt, 1));
    const f_max = Math.min(0.00833, nyquist); 

    for(let k = 0; k <= n / 2; k++) {
        let freq = k / (n * dt);
        if (freq < f_min || freq > f_max) {
             real[k] = 0; imag[k] = 0;
             if (k > 0) {
                 real[n - k] = 0; imag[n - k] = 0;
             }
        }
    }

    // Inverse FFT implementation
    const ifft = (real: Float64Array, imag: Float64Array) => {
        const n = real.length;
        for (let i = 0; i < n; i++) imag[i] = -imag[i];
        fft(real, imag);
        for (let i = 0; i < n; i++) {
            real[i] /= n;
            imag[i] = -imag[i] / n;
        }
    };

    ifft(real, imag);

    const THRESHOLD = 0.05; // 5 cm anomalous amplitude threshold
    let results = [];

    // Populate results with raw, smoothed (predicted), and tsunami anomaly signal
    for (let i = 0; i < tsData.length; i++) {
        const current = tsData[i];
        let signal = real[i];
        
        if (isNaN(current.val) || current.val === null) {
            results.push({ timeMs: current.timestamp, raw: null, smoothed: null, tsunamiSignal: null });
            continue;
        }

        results.push({
            timeMs: current.timestamp,
            raw: current.val,
            smoothed: current.val - signal, // Astronomical tidal signal
            tsunamiSignal: signal
        });
    }

    // Determine candidate search window for tsunami anomaly:
    const dataStartMs = tsData[0].timestamp;
    const dataEndMs = tsData[tsData.length - 1].timestamp;
    const isEventInDataset = bmkgData && bmkgData.timeMs && (bmkgData.timeMs >= dataStartMs - (48 * 3600 * 1000)) && (bmkgData.timeMs <= dataEndMs);

    let initialSignificantIdx = -1;
    let initialMaxAbs = 0;

    if (isEventInDataset && bmkgData) {
        // Search window starting from event time (minus 15 min buffer) up to 48 hours post-event
        const eventWindowStart = Math.max(dataStartMs, bmkgData.timeMs - (15 * 60 * 1000));
        const eventWindowEnd = Math.min(dataEndMs, bmkgData.timeMs + (48 * 3600 * 1000));

        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            if (r.tsunamiSignal === null || isNaN(r.tsunamiSignal)) continue;
            if (r.timeMs >= eventWindowStart && r.timeMs <= eventWindowEnd) {
                const absSig = Math.abs(r.tsunamiSignal);
                if (absSig > initialMaxAbs) {
                    initialMaxAbs = absSig;
                    initialSignificantIdx = i;
                }
            }
        }
    }

    // If no event matched or if maximum anomaly in event window is below threshold,
    // scan the ENTIRE dataset for any significant tsunami wave packet!
    if (initialMaxAbs < THRESHOLD) {
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            if (r.tsunamiSignal === null || isNaN(r.tsunamiSignal)) continue;
            const absSig = Math.abs(r.tsunamiSignal);
            if (absSig > initialMaxAbs) {
                initialMaxAbs = absSig;
                initialSignificantIdx = i;
            }
        }
    }

    let detected = initialMaxAbs >= THRESHOLD && initialSignificantIdx !== -1;
    let startTime: number | null = null;
    let endTime: number | null = null;
    let maxWave = 0;

    if (detected && initialSignificantIdx !== -1) {
        const peakIdx = initialSignificantIdx;
        const searchBoundStart = (isEventInDataset && bmkgData) 
            ? Math.max(results[0].timeMs, bmkgData.timeMs - (20 * 60 * 1000))
            : results[0].timeMs;
        const GAP_THRESHOLD_MS = 2.5 * 3600 * 1000; // 2.5 hours quiet gap

        // 1. Trace backwards from peak to find the first arrival (onset) of tsunami wave packet
        let startIdx = peakIdx;
        for (let i = peakIdx; i >= 0; i--) {
            if (results[i].tsunamiSignal === null) continue;
            if (results[i].timeMs < searchBoundStart) break;

            const absSig = Math.abs(results[i].tsunamiSignal!);
            if (absSig >= THRESHOLD) {
                startIdx = i;
            } else {
                if (results[startIdx].timeMs - results[i].timeMs > GAP_THRESHOLD_MS) {
                    break;
                }
            }
        }

        // 2. Refine start time to zero-crossing leading into the wave arrival
        let refinedStartIdx = startIdx;
        for (let i = startIdx; i >= Math.max(0, startIdx - 20); i--) {
            if (results[i].tsunamiSignal === null) continue;
            if (results[i].timeMs < searchBoundStart) break;
            if (Math.abs(results[i].tsunamiSignal!) < 0.015 || (i < startIdx && Math.sign(results[i].tsunamiSignal!) !== Math.sign(results[i+1].tsunamiSignal!))) {
                refinedStartIdx = i;
                break;
            }
        }
        startTime = results[refinedStartIdx].timeMs;

        // 3. Trace forwards from peak to find end of anomalous wave packet
        let endIdx = peakIdx;
        for (let i = peakIdx; i < results.length; i++) {
            if (results[i].tsunamiSignal === null) continue;
            const absSig = Math.abs(results[i].tsunamiSignal!);
            if (absSig >= THRESHOLD) {
                endIdx = i;
            } else {
                if (results[i].timeMs - results[endIdx].timeMs > GAP_THRESHOLD_MS) {
                    break;
                }
            }
        }

        // Allow tsunami coda up to 12 hours after start time
        const MAX_CODA_DURATION_MS = 12 * 3600 * 1000;
        let calculatedEndTime = results[endIdx].timeMs;
        if (calculatedEndTime - startTime > MAX_CODA_DURATION_MS) {
            calculatedEndTime = startTime + MAX_CODA_DURATION_MS;
        }
        endTime = calculatedEndTime;

        // 4. Maximum zero-to-peak amplitude within [startTime, endTime]
        let maxZeroToPeak = 0;
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            if (r.tsunamiSignal !== null && r.timeMs >= startTime && r.timeMs <= endTime!) {
                if (r.tsunamiSignal > maxZeroToPeak) {
                    maxZeroToPeak = r.tsunamiSignal;
                }
            }
        }

        if (maxZeroToPeak <= 0) {
            maxZeroToPeak = initialMaxAbs;
        }

        maxWave = maxZeroToPeak;
    }

    return {
        detected: detected && maxWave >= THRESHOLD,
        maxWave: (detected && maxWave >= THRESHOLD) ? maxWave : 0, 
        start: (detected && maxWave >= THRESHOLD) ? startTime : null,
        end: (detected && maxWave >= THRESHOLD) ? endTime : null,
        data: results
    };
  }, [records, selectedSensor, bmkgData]);

  const displayData = useMemo(() => {
    let data = detection.data;
    if (zoomDomain) {
      data = data.filter((d: any) => d.timeMs >= zoomDomain.start && d.timeMs <= zoomDomain.end);
    }
    // sub-sample to prevent freezing
    if (data.length > 2000) {
      const step = Math.ceil(data.length / 2000);
      data = data.filter((_: any, i: number) => i % step === 0);
    }
    return data;
  }, [detection.data, zoomDomain]);

  const brushData = useMemo(() => {
    if (!detection.data.length) return [];
    const step = Math.max(1, Math.ceil(detection.data.length / 1000));
    return detection.data.filter((_: any, i: number) => i % step === 0);
  }, [detection.data]);

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    try {
      download(blob, filename, mimeType);
    } catch {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadPNG = () => {
      const el = document.getElementById('tsunami-chart-container');
      if (el) {
          toPng(el, { backgroundColor: '#ffffff' }).then(dataUrl => {
              const safeName = (stationName || 'chart').replace(/[^a-zA-Z0-9_-]/g, '_');
              download(dataUrl, `tsunami_analysis_${safeName}.png`);
          }).catch(err => console.error("Error creating PNG:", err));
      }
  };

  const handleDownloadCSV = () => {
      if (!detection.data || detection.data.length === 0) return;
      
      let csvContent = "Tanggal,Waktu (UTC),Tsunami Anomaly (m)\n";
      
      detection.data.forEach((d: any) => {
          const dateObj = new Date(d.timeMs);
          const dateStr = formatUTC(dateObj, 'dd/MM/yyyy');
          const timeStr = formatUTC(dateObj, 'HH:mm:ss');
          const valStr = (d.tsunamiSignal !== null && d.tsunamiSignal !== undefined && !isNaN(d.tsunamiSignal))
              ? d.tsunamiSignal.toFixed(4)
              : '';
          csvContent += `${dateStr},${timeStr},${valStr}\n`;
      });
      
      const safeName = (stationName || 'station').replace(/[^a-zA-Z0-9_-]/g, '_');
      triggerDownload(csvContent, `tsunami_anomaly_${safeName}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleDownloadTXT = () => {
      const safeName = (stationName || 'station').replace(/[^a-zA-Z0-9_-]/g, '_');
      const dataStart = records?.[0]?.timestamp ? formatUTC(new Date(records[0].timestamp), 'yyyy-MM-dd HH:mm:ss') + ' UTC' : '-';
      const dataEnd = records?.[records.length - 1]?.timestamp ? formatUTC(new Date(records[records.length - 1].timestamp), 'yyyy-MM-dd HH:mm:ss') + ' UTC' : '-';
      const totalPoints = records?.length || 0;
      
      let durationHours = 0;
      if (detection.start && detection.end) {
          durationHours = (detection.end - detection.start) / (1000 * 3600);
      }

      const lines = [
          "==================================================================",
          "             LAPORAN RINGKASAN ANALISIS TSUNAMI                  ",
          "               TSUNAMI ANALYSIS SUMMARY REPORT                    ",
          "==================================================================",
          "",
          "[1] INFORMASI STASIUN & DATA",
          `    - Nama Stasiun        : ${stationName || 'Unknown / Tidak diketahui'}`,
          `    - Koordinat (Lat, Lon): ${stationLat ? Number(stationLat).toFixed(6) : '-'}, ${stationLon ? Number(stationLon).toFixed(6) : '-'}`,
          `    - Sensor Terpilih     : ${selectedSensor || 'Default'}`,
          `    - Periode Data Awal   : ${dataStart}`,
          `    - Periode Data Akhir  : ${dataEnd}`,
          `    - Total Sampel Data   : ${totalPoints.toLocaleString()} data points`,
          "",
          "[2] HASIL DETEKSI TSUNAMI",
          `    - Status Deteksi      : ${detection.detected ? 'TERDETEKSI (TSUNAMI DETECTED)' : 'TIDAK TERDETEKSI (NO TSUNAMI DETECTED)'}`,
          `    - Amplitudo Maksimum  : ${detection.detected ? detection.maxWave.toFixed(4) + ' meter (Nol ke Puncak / Zero-to-Peak)' : '0.0000 meter'}`,
          `    - Waktu Mulai (UTC)   : ${detection.start ? formatUTC(new Date(detection.start), 'yyyy-MM-dd HH:mm:ss') + ' UTC' : 'N/A'}`,
          `    - Waktu Berakhir (UTC): ${detection.end ? formatUTC(new Date(detection.end), 'yyyy-MM-dd HH:mm:ss') + ' UTC' : 'N/A'}`,
          `    - Estimasi Durasi     : ${detection.detected && durationHours > 0 ? durationHours.toFixed(2) + ' jam (' + (durationHours * 60).toFixed(0) + ' menit)' : 'N/A'}`,
          "",
          "[3] REFERENSI KEJADIAN GEMPA BUMI / AKTIVITAS VULKANIK (BMKG)",
          bmkgData ? [
              `    - Judul Kejadian      : ${bmkgData.title || 'Kejadian Gempa BMKG'}`,
              `    - Tipe Kejadian       : ${bmkgData.type === 'vulkanik' ? 'Vulkanik (Longsoran Lereng Gunung Api)' : 'Tektonik'}`,
              `    - Tanggal & Waktu     : ${bmkgData.tanggal || '-'} ${bmkgData.jam || '-'}`,
              `    - Waktu Kejadian (UTC): ${bmkgData.timeMs ? formatUTC(new Date(bmkgData.timeMs), 'yyyy-MM-dd HH:mm:ss') + ' UTC' : '-'}`,
              `    - Magnitudo           : ${bmkgData.magnitude || '-'}`,
              `    - Kedalaman           : ${bmkgData.depth || '-'}`,
              `    - Koordinat           : ${bmkgData.coordinates || '-'}`,
              `    - Wilayah/Pusat Gempa : ${bmkgData.wilayah || '-'}`,
              `    - Potensi Tsunami     : ${bmkgData.potensi || '-'}`,
              bmkgData.keterangan ? `    - Catatan/Keterangan  : ${bmkgData.keterangan}` : ''
          ].filter(Boolean).join('\n') : "    - Catatan Gempa       : Tidak ditemukan kejadian gempa bumi tektonik/vulkanik BMKG dalam rentang pengamatan pasut.",
          "",
          "[4] PARAMETER METODE ANALISIS",
          "    - Algoritma           : Fast Fourier Transform (FFT) Band-Pass Filter",
          "    - Rentang Frekuensi   : 0.08 mHz s/d 3.33 mHz (Periode ~5 menit s/d ~200 menit)",
          "    - Ambang Batas (Thresh): 0.05 m (5 cm) amplitudo anomali",
          "",
          `Laporan dibuat secara otomatis pada: ${formatUTC(new Date(), 'yyyy-MM-dd HH:mm:ss')} UTC`,
          "=================================================================="
      ];

      const txtContent = lines.join('\n');
      triggerDownload(txtContent, `tsunami_report_${safeName}.txt`, 'text/plain;charset=utf-8;');
  };

  const yDomain = useMemo(() => {
    if (!displayData.length) return ['auto', 'auto'];
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;

    displayData.forEach((d: any) => {
      if (visibleLines.raw && d.raw !== null && !isNaN(d.raw)) {
        if (d.raw < min) min = d.raw;
        if (d.raw > max) max = d.raw;
      }
      if (visibleLines.smoothed && d.smoothed !== null && !isNaN(d.smoothed)) {
        if (d.smoothed < min) min = d.smoothed;
        if (d.smoothed > max) max = d.smoothed;
      }
      if (visibleLines.tsunamiSignal && d.tsunamiSignal !== null && !isNaN(d.tsunamiSignal)) {
        if (d.tsunamiSignal < min) min = d.tsunamiSignal;
        if (d.tsunamiSignal > max) max = d.tsunamiSignal;
      }
    });

    if (min === Number.MAX_VALUE) return ['auto', 'auto'];

    const pad = (max - min) * 0.1 || 0.1;
    const boundedMin = min - pad;
    const boundedMax = max + pad;

    const center = (boundedMax + boundedMin) / 2;
    const span = (boundedMax - boundedMin) / 2;

    return [
        center - (span / vZoom),
        center + (span / vZoom)
    ];
  }, [displayData, vZoom, visibleLines]);

  const zoomInOut = (delta: number) => {
    setVZoom(prev => Math.max(0.1, prev + delta));
  };
  
  if (!records || records.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400">
             <Waves size={48} className="mb-4 opacity-50" />
             <h3 className="text-xl font-bold">Tidak ada data untuk dianalisis</h3>
             <p className="text-sm">Silakan masukkan data di panel Dashboard atau Connect terlebih dahulu.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      {/* Tsunami Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className={cn("p-5 rounded-2xl border flex flex-col justify-between shadow-sm relative overflow-hidden", detection.detected ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200")}>
           <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className={cn("text-sm font-black uppercase tracking-widest", detection.detected ? "text-red-700" : "text-emerald-700")}>Status Tsunami</h3>
              {detection.detected ? <AlertTriangle className="text-red-500" size={20} /> : <Activity className="text-emerald-500" size={20} />}
           </div>
           <div className="mb-1 relative z-10">
               <span className={cn("text-3xl font-black", detection.detected ? "text-red-600" : "text-emerald-600")}>
                   {detection.detected ? 'TERDETEKSI' : 'AMAN'}
               </span>
           </div>
           <p className={cn("text-xs font-bold", detection.detected ? "text-red-500/80" : "text-emerald-500/80")}>
               Berdasarkan anomali frekuensi tinggi
           </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Waktu Mulai</h3>
                <Clock className="text-slate-400" size={20} />
            </div>
            <div className="mb-1">
                <span className="text-2xl font-black text-slate-800">
                    {detection.start ? formatUTC(new Date(detection.start), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}
                </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">UTC Time</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Waktu Berakhir</h3>
                <Clock className="text-slate-400" size={20} />
            </div>
            <div className="mb-1">
                <span className="text-2xl font-black text-slate-800">
                    {detection.end ? formatUTC(new Date(detection.end), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}
                </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">UTC Time</p>
        </div>

        <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Amplitudo Tsunami</h3>
                <Waves className="text-blue-400" size={20} />
            </div>
            <div className="mb-1">
                <span className="text-3xl font-black text-white font-mono">
                    {detection.detected ? detection.maxWave.toFixed(3) : '0.000'} <span className="text-lg text-slate-500">m</span>
                </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Maksimal (Nol ke Puncak)</p>
        </div>
      </div>

      {/* BMKG Event Reference Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Referensi Kejadian BMKG</span>
              {bmkgData && (
                <>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                    bmkgData.type === 'vulkanik' 
                      ? "bg-amber-100 text-amber-800 border border-amber-300" 
                      : "bg-indigo-100 text-indigo-800 border border-indigo-300"
                  )}>
                    {bmkgData.type === 'vulkanik' ? 'Vulkanik' : 'Tektonik'}
                  </span>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                    bmkgData.potensi?.toLowerCase().includes('tsunami')
                      ? "bg-red-100 text-red-700 border border-red-300"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  )}>
                    {bmkgData.potensi}
                  </span>
                </>
              )}
            </div>

            {bmkgData ? (
              <div className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h4 className="text-base font-bold text-slate-800">
                    {bmkgData.title || bmkgData.wilayah}
                  </h4>
                  <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    Mag: {bmkgData.magnitude}
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                  <span><strong>Waktu:</strong> {bmkgData.tanggal} {bmkgData.jam}</span>
                  {bmkgData.depth && <span><strong>Kedalaman:</strong> {bmkgData.depth}</span>}
                  {bmkgData.coordinates && <span><strong>Koordinat:</strong> {bmkgData.coordinates}</span>}
                  {bmkgData.wilayah && <span><strong>Wilayah:</strong> {bmkgData.wilayah}</span>}
                </div>
                {bmkgData.keterangan && (
                  <p className="text-xs text-slate-500 italic mt-1">
                    {bmkgData.keterangan}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-1">
                Tidak ada catatan gempa tektonik/vulkanik BMKG dalam rentang periode data pasut ini. Algoritma FFT tetap berjalan independen mendeteksi anomali tinggi muka air laut.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-stretch lg:self-center">
            {candidateEvents.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Pilih Event:</span>
                <select
                  value={selectedEventId}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {candidateEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.tanggal} - {ev.type === 'vulkanik' ? '[Vulkanik]' : '[Tektonik]'} {ev.magnitude ? `M${ev.magnitude}` : ''} {ev.wilayah.slice(0, 30)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {bmkgData && (
              <button
                onClick={handleFocusTsunami}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                title="Fokuskan grafik ke waktu kejadian ini"
              >
                <ZoomIn size={14} /> Fokuskan ke Kejadian
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex flex-col xl:flex-row gap-6">
         <div id="tsunami-chart-container" className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{stationName ? `Analisis Tsunami - ${stationName}` : "Analisis Anomali Sea Level"}</h3>
                   <p className="text-xs text-slate-500 mt-1">Grafik interaktif untuk isolasi sinyal tsunami dari pasang surut astronomis</p>
                </div>
                <div data-html2canvas-ignore className="flex flex-wrap items-center gap-2">
                   {detection.detected && (
                     <button
                       onClick={handleFocusTsunami}
                       className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                       title="Fokuskan tampilan grafik ke jendela gelombang tsunami yang terdeteksi"
                     >
                       <ZoomIn size={14} /> Fokus Tsunami
                     </button>
                   )}
                   <button onClick={handleDownloadPNG} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"><Download size={14} /> PNG</button>
                   <button onClick={handleDownloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"><Download size={14} /> CSV</button>
                   <button onClick={handleDownloadTXT} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"><Download size={14} /> TXT</button>
                   <div className="w-px h-6 bg-slate-200 mx-1 self-center hidden sm:block"></div>
                   <button onClick={() => zoomInOut(0.25)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors">Zoom In</button>
                   <button onClick={() => zoomInOut(-0.25)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors">Zoom Out</button>
                   <button onClick={() => { setZoomDomain(null); setVZoom(1); setBrushKey(prev => prev + 1); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors">Reset</button>
                </div>
             </div>

             {/* Line Visibility Toggle Controls */}
             <div data-html2canvas-ignore className="flex flex-wrap items-center justify-between gap-3 mb-5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex flex-wrap items-center gap-2">
                   <span className="text-xs font-black text-slate-600 uppercase tracking-wider mr-1">Plot Garis:</span>
                   
                   <button 
                     type="button"
                     onClick={() => toggleLine('raw')}
                     className={cn(
                       "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-xs cursor-pointer",
                       visibleLines.raw 
                         ? "bg-blue-600 text-white border-blue-600" 
                         : "bg-white text-slate-400 border-slate-200 hover:bg-slate-100 opacity-60 line-through"
                     )}
                     title="Klik untuk tampilkan/sembunyikan Raw Sea Level"
                   >
                     <span className={cn("w-2.5 h-2.5 rounded-full inline-block border", visibleLines.raw ? "bg-white border-blue-200" : "bg-slate-300 border-slate-400")}></span>
                     Raw Sea Level
                   </button>

                   <button 
                     type="button"
                     onClick={() => toggleLine('smoothed')}
                     className={cn(
                       "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-xs cursor-pointer",
                       visibleLines.smoothed 
                         ? "bg-slate-900 text-white border-slate-900" 
                         : "bg-white text-slate-400 border-slate-200 hover:bg-slate-100 opacity-60 line-through"
                     )}
                     title="Klik untuk tampilkan/sembunyikan Predicted Sea Level"
                   >
                     <span className="w-3 h-0.5 border-b-2 border-dashed border-current inline-block"></span>
                     Predicted Sea Level
                   </button>

                   <button 
                     type="button"
                     onClick={() => toggleLine('tsunamiSignal')}
                     className={cn(
                       "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-xs cursor-pointer",
                       visibleLines.tsunamiSignal 
                         ? "bg-red-600 text-white border-red-600" 
                         : "bg-white text-slate-400 border-slate-200 hover:bg-slate-100 opacity-60 line-through"
                     )}
                     title="Klik untuk tampilkan/sembunyikan Anomali Tsunami"
                   >
                     <span className={cn("w-2.5 h-2.5 rounded-full inline-block border", visibleLines.tsunamiSignal ? "bg-white border-red-200" : "bg-slate-300 border-slate-400")}></span>
                     Anomali Tsunami
                   </button>
                </div>
                <div className="text-[11px] font-medium text-slate-400 italic">
                   *Klik tombol atau legenda untuk toggle on/off garis
                </div>
             </div>

             <div className="h-[60vh] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={displayData} 
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                      onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                      onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                      onMouseUp={() => {
                        if (refAreaLeft && refAreaRight) {
                            let left = Number(refAreaLeft);
                            let right = Number(refAreaRight);
                            if (left === right || !left || !right) {
                                setRefAreaLeft('');
                                setRefAreaRight('');
                                return;
                            }
                            if (left > right) [left, right] = [right, left];
                            setZoomDomain({ start: left, end: right });
                        }
                        setRefAreaLeft('');
                        setRefAreaRight('');
                      }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                          dataKey="timeMs" 
                          type="number"
                          domain={['dataMin', 'dataMax']}
                          tickFormatter={(val: number) => formatUTC(new Date(val), 'dd/MM/yyyy HH:mm')}
                          stroke="#94a3b8" 
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                          minTickGap={50}
                        />
                        <YAxis 
                          domain={yDomain as any} 
                          tickFormatter={(val: number) => val.toFixed(3)}
                          stroke="#94a3b8" 
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                          width={60}
                        />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [value.toFixed(3) + ' m', name]}
                          labelFormatter={(label: number) => formatUTC(new Date(label), 'dd/MM/yyyy HH:mm:ss') + ' UTC'}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                          labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }} 
                          onClick={(e: any) => {
                            if (e && e.dataKey) {
                              toggleLine(e.dataKey as 'raw' | 'smoothed' | 'tsunamiSignal');
                            }
                          }}
                          formatter={(value: string, entry: any) => {
                            const isHidden = !visibleLines[entry.dataKey as keyof typeof visibleLines];
                            return (
                              <span className={cn("transition-all select-none", isHidden ? "line-through text-slate-400 opacity-50" : "text-slate-700")}>
                                {value}
                              </span>
                            );
                          }}
                        />

                        {refAreaLeft && refAreaRight && (
                           <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#ef4444" fillOpacity={0.15} />
                        )}

                        {detection.detected && detection.start && detection.end && (
                           <ReferenceArea 
                             x1={detection.start} 
                             x2={detection.end} 
                             stroke="#ef4444" 
                             strokeOpacity={0.4} 
                             strokeDasharray="3 3" 
                             fill="#ef4444" 
                             fillOpacity={0.12} 
                           />
                        )}

                        {bmkgData && bmkgData.timeMs && (
                           <ReferenceLine 
                             x={bmkgData.timeMs} 
                             stroke="#b91c1c" 
                             strokeWidth={2} 
                             strokeDasharray="4 4" 
                             label={{ 
                               value: `BMKG: ${bmkgData.jam || ''}`, 
                               position: 'insideTopLeft', 
                               fill: '#b91c1c', 
                               fontSize: 11, 
                               fontWeight: 'bold' 
                             }} 
                           />
                        )}

                        <Line 
                            type="monotone" 
                            dataKey="raw" 
                            stroke="#2563eb" 
                            strokeWidth={1.5} 
                            dot={false} 
                            name="Raw Sea Level" 
                            isAnimationActive={false} 
                            hide={!visibleLines.raw}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="smoothed" 
                            stroke="#0f172a" 
                            strokeWidth={2} 
                            strokeDasharray="5 5"
                            dot={false} 
                            name="Predicted Sea Level" 
                            isAnimationActive={false} 
                            hide={!visibleLines.smoothed}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="tsunamiSignal" 
                            stroke="#ef4444" 
                            strokeWidth={2} 
                            dot={false} 
                            name="Anomali Tsunami" 
                            isAnimationActive={false} 
                            hide={!visibleLines.tsunamiSignal}
                        />

                        <Brush 
                            key={brushKey}
                            dataKey="timeMs" 
                            height={30} 
                            stroke="#cbd5e1" 
                            travellerWidth={10} 
                            fill="#f8fafc"
                            tickFormatter={(val: number) => formatUTC(new Date(val), 'MMM yyyy')}
                            onChange={(e: any) => {
                                if (e && e.startIndex !== undefined && e.endIndex !== undefined) {
                                    const startMs = brushData[e.startIndex]?.timeMs;
                                    const endMs = brushData[e.endIndex]?.timeMs;
                                    if (startMs !== undefined && endMs !== undefined) {
                                        setZoomDomain({ start: startMs, end: endMs });
                                    }
                                }
                            }}
                        />
                    </LineChart>
                 </ResponsiveContainer>
             </div>
         </div>
      </div>
    </div>
  );
}
