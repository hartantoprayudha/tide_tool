import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ReferenceLine, ReferenceArea, Brush } from 'recharts';
import { Activity, AlertTriangle, Clock, Waves, PanelRightClose, PanelRightOpen, Settings } from 'lucide-react';
import { cn } from './lib/utils';

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

export default function TsunamiAnalysisView({ records, selectedSensor, availableSensors }: any) {
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [vZoom, setVZoom] = useState(1);
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [zoomDomain, setZoomDomain] = useState<{start: number, end: number} | null>(null);
  const [bmkgData, setBmkgData] = useState<any>(null);

  useEffect(() => {
    let dataStart = records?.[0]?.timestamp?.getTime() || 0;
    let dataEnd = records?.[records.length - 1]?.timestamp?.getTime() || 0;

    const fetchGempaData = async () => {
        try {
            // First, try extracting from the BMKG history page (Berpotensi Tsunami)
            const histRes = await fetch('/api/bmkg/history');
            if (histRes.ok) {
                const htmlStr = await histRes.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlStr, "text/html");
                const rows = doc.querySelectorAll('table tbody tr');
                
                let histCandidates = [];
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
                                histCandidates.push({
                                   tanggal: tglPart,
                                   jam: jamPart + ' WIB',
                                   potensi: cols[2].textContent?.trim() || "Berpotensi Tsunami",
                                   magnitude: cols[3].textContent?.trim() || "0",
                                   wilayah: cols[6].textContent?.trim() || "",
                                   timeMs: timeMs,
                                   magFloat: parseFloat(cols[3].textContent?.trim().replace(',', '.') || "0")
                                });
                            }
                        }
                    }
                }
                
                if (histCandidates.length > 0) {
                    histCandidates.sort((a,b) => b.magFloat - a.magFloat);
                    setBmkgData(histCandidates[0]);
                    return; // Successfully got from history HTML!
                }
            }

            // Fallback 1: Try inatews XML
            const inatewsRes = await fetch('/api/bmkg/inatews');
            if (inatewsRes.ok) {
                const xmlStr = await inatewsRes.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(xmlStr, "application/xml");
                const infoList = xml.querySelectorAll("info");
                
                let inatewsCandidates = [];
                for (let i = 0; i < infoList.length; i++) {
                    const info = infoList[i];
                    const dateStr = info.querySelector("date")?.textContent; // format: 08-06-26
                    const timeStr = info.querySelector("time")?.textContent; // format: 06:37:42 WIB
                    const potential = info.querySelector("potential")?.textContent || "Potensi TSUNAMI";
                    const magnitudeStr = info.querySelector("magnitude")?.textContent || "0";
                    const area = info.querySelector("area")?.textContent || "";
                    
                    if (dateStr && timeStr) {
                         // Parse "DD-MM-YY"
                         const parts = dateStr.split('-');
                         if (parts.length === 3) {
                             const year = 2000 + parseInt(parts[2]);
                             const month = parseInt(parts[1]) - 1;
                             const day = parseInt(parts[0]);
                             
                             const timeMatch = timeStr.match(/(\d+):(\d+):(\d+)/);
                             if (timeMatch) {
                                 const hours = parseInt(timeMatch[1]);
                                 const mins = parseInt(timeMatch[2]);
                                 const secs = parseInt(timeMatch[3]);
                                 // Assume WIB is UT+7
                                 const dateObj = new Date(Date.UTC(year, month, day, hours - 7, mins, secs));
                                 const timeMs = dateObj.getTime();
                                 
                                 if (!isNaN(timeMs) && timeMs >= dataStart - (48 * 3600 * 1000) && timeMs <= dataEnd) {
                                     inatewsCandidates.push({
                                        tanggal: `${day}-${month+1}-${year}`,
                                        jam: timeStr,
                                        potensi: potential,
                                        magnitude: magnitudeStr,
                                        wilayah: area,
                                        timeMs: timeMs,
                                        magFloat: parseFloat(magnitudeStr.replace(',', '.'))
                                     });
                                 }
                             }
                         }
                    }
                }
                
                if (inatewsCandidates.length > 0) {
                    inatewsCandidates.sort((a,b) => b.magFloat - a.magFloat);
                    setBmkgData(inatewsCandidates[0]);
                    return; // Successfully got from inatews XML!
                }
            }
            
            // Fallback 2: Fetch gempaterkini XML
            const xmlRes = await fetch('/api/bmkg/gempa?type=tsunami');
            if (xmlRes.ok) {
                const xmlStr = await xmlRes.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(xmlStr, "application/xml");
                const gempaList = xml.querySelectorAll("gempa");
                
                let matchedGempa = null;
                let candidates = [];
                
                for (let i = 0; i < gempaList.length; i++) {
                    const gempa = gempaList[i];
                    let dtStr = gempa.querySelector("DateTime")?.textContent;
                    let timeMs = 0;
                    if (dtStr) {
                        timeMs = new Date(dtStr).getTime();
                    } else {
                        const tgl = gempa.querySelector("Tanggal")?.textContent;
                        const jam = gempa.querySelector("Jam")?.textContent;
                        if (tgl && jam) {
                            timeMs = new Date(`${tgl} ${jam.replace('WIB', '+0700')}`).getTime();
                        }
                    }
                    
                    if (timeMs >= dataStart - (48 * 3600 * 1000) && timeMs <= dataEnd) {
                        const potensi = gempa.querySelector("Potensi")?.textContent || "";
                        const magnitudeStr = gempa.querySelector("Magnitude")?.textContent || "0";
                        const magnitude = parseFloat(magnitudeStr);
                        candidates.push({ gempa, timeMs, potensi, magnitude });
                    }
                }
                
                if (candidates.length > 0) {
                    candidates.sort((a, b) => {
                        const aTsunami = a.potensi.toLowerCase().includes('tsunami') ? 1 : 0;
                        const bTsunami = b.potensi.toLowerCase().includes('tsunami') ? 1 : 0;
                        if (aTsunami !== bTsunami) return bTsunami - aTsunami;
                        return b.magnitude - a.magnitude;
                    });
                    matchedGempa = candidates[0];
                } else if (gempaList.length > 0) {
                     const gempa = gempaList[0];
                     let dtStr = gempa.querySelector("DateTime")?.textContent;
                     let timeMs = 0;
                     if (dtStr) {
                         timeMs = new Date(dtStr).getTime();
                     } else {
                         const tgl = gempa.querySelector("Tanggal")?.textContent;
                         const jam = gempa.querySelector("Jam")?.textContent;
                         if (tgl && jam) {
                             timeMs = new Date(`${tgl} ${jam.replace('WIB', '+0700')}`).getTime();
                         }
                     }
                     matchedGempa = { gempa, timeMs };
                }

                if (matchedGempa) {
                    const { gempa, timeMs } = matchedGempa;
                    setBmkgData({
                        tanggal: gempa.querySelector("Tanggal")?.textContent,
                        jam: gempa.querySelector("Jam")?.textContent,
                        magnitude: gempa.querySelector("Magnitude")?.textContent,
                        wilayah: gempa.querySelector("Wilayah")?.textContent,
                        potensi: gempa.querySelector("Potensi")?.textContent,
                        timeMs: isNaN(timeMs) ? null : timeMs
                    });
                }
            }
        } catch (error) {
            console.error("BMKG Fetching Error:", error);
        }
    };
    
    fetchGempaData();
  }, [records]);
  
  // Tsunami Detection Algorithm (FFT High-Pass / Band-Pass)
  const detection = useMemo(() => {
    if (!records || records.length === 0) return { detected: false, maxWave: 0, start: null, end: null, data: [] };
    
    const tsData = records.map((r: any) => {
      const v = (r.allSamples && r.allSamples[selectedSensor] !== undefined) ? r.allSamples[selectedSensor] : (!isNaN(r.filtered) ? r.filtered : r.raw);
      return { timestamp: r.timestamp.getTime(), val: v };
    });
    
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
    // Find first valid to start
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
            // Find next valid
            let nextValid = lastValid;
            let nextIdx = i;
            for(let j = i + 1; j < tsData.length; j++){
               if (!isNaN(tsData[j].val) && tsData[j].val !== null) {
                   nextValid = tsData[j].val;
                   nextIdx = j;
                   break;
               }
            }
            if (nextIdx === i) y[i] = lastValid; // no more valid data
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

    // Filter frequencies: 0.08 mHz to 3.33 mHz (0.00008 Hz to 0.00333 Hz)
    const f_min = 0.00008; 
    const f_max = 0.00333; 
    
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
    let maxWave = 0;
    let maxIdx = -1;
    let results = [];

    // First pass: find maximum amplitude and populate results
    for (let i = 0; i < tsData.length; i++) {
        const current = tsData[i];
        let signal = real[i];
        
        if (isNaN(current.val) || current.val === null) {
            results.push({ ...current, tsunamiSignal: null, smoothed: null });
            continue;
        }

        const absSignal = Math.abs(signal);
        
        let inWindow = true;
        if (bmkgData && bmkgData.timeMs) {
            // Check if current time is after earthquake, and within e.g. 24 hours
            if (current.timestamp < bmkgData.timeMs || current.timestamp > bmkgData.timeMs + 24 * 3600 * 1000) {
                inWindow = false;
            }
        }
        
        if (inWindow && absSignal > maxWave) {
            maxWave = absSignal;
            maxIdx = i;
        }
        
        results.push({
            timeMs: current.timestamp,
            raw: current.val,
            smoothed: current.val - signal, // Original data minus the high-frequency part
            tsunamiSignal: signal
        });
    }

    let detected = maxWave > THRESHOLD;
    let startTime: number | null = null;
    let endTime: number | null = null;
    
    if (detected && maxIdx !== -1) {
        // Find start time
        const GAP_THRESHOLD_MS = 3 * 3600 * 1000; // 3 hours
        let lastAboveThreshIdx = maxIdx;
        
        for (let i = maxIdx; i >= 0; i--) {
            if (results[i].tsunamiSignal === null) continue;
            let absSig = Math.abs(results[i].tsunamiSignal!);
            if (absSig > THRESHOLD) {
                lastAboveThreshIdx = i;
            } else {
                if (results[lastAboveThreshIdx].timeMs - results[i].timeMs > GAP_THRESHOLD_MS) {
                    break;
                }
            }
        }
        startTime = results[lastAboveThreshIdx].timeMs;
        
        // Find end time
        lastAboveThreshIdx = maxIdx;
        for (let i = maxIdx; i < results.length; i++) {
            if (results[i].tsunamiSignal === null) continue;
            let absSig = Math.abs(results[i].tsunamiSignal!);
            if (absSig > THRESHOLD) {
                lastAboveThreshIdx = i;
            } else {
                if (results[i].timeMs - results[lastAboveThreshIdx].timeMs > GAP_THRESHOLD_MS) {
                    break;
                }
            }
        }
        endTime = results[lastAboveThreshIdx].timeMs;
    }

    return {
        detected,
        maxWave: detected ? maxWave : 0, 
        start: startTime,
        end: endTime,
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

  const yDomain = useMemo(() => {
    if (!displayData.length) return ['auto', 'auto'];
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;
    displayData.forEach((d: any) => {
        if (d.tsunamiSignal !== null) {
            if (d.raw < min) min = d.raw;
            if (d.raw > max) max = d.raw;
        }
    });

    if (min === Number.MAX_VALUE) return ['auto', 'auto'];

    const pad = (max - min) * 0.1;
    const boundedMin = min - pad;
    const boundedMax = max + pad;

    const center = (boundedMax + boundedMin) / 2;
    const span = (boundedMax - boundedMin) / 2;

    return [
        center - (span / vZoom),
        center + (span / vZoom)
    ];
  }, [displayData, vZoom]);

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
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Maksimal (Nol ke Puncak/Lembah)</p>
        </div>
      </div>

      {/* BMKG Event Info & Courtesy */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-1">Referensi Kejadian Gempa Berpotensi Tsunami</h4>
                {bmkgData ? (
                    <div className="text-sm text-slate-600">
                        <span className="font-bold">{bmkgData.tanggal} {bmkgData.jam}</span> • Mag: <span className="font-bold text-red-600">{bmkgData.magnitude}</span> • {bmkgData.wilayah} • <span className={bmkgData.potensi?.toLowerCase().includes('tsunami') ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>{bmkgData.potensi}</span>
                    </div>
                ) : (
                    <div className="text-sm text-slate-500 italic">Mengambil data gempa BMKG...</div>
                )}
            </div>
            <div className="text-right flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Data Gempa & Potensi Tsunami © Badan Meteorologi Klimatologi dan Geofisika
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Data Variasi Muka Laut © Badan Informasi Geospasial
                </span>
            </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex flex-col xl:flex-row gap-6">
         <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Analisis Anomali Sea Level</h3>
                   <p className="text-xs text-slate-500 mt-1">Grafik interaktif untuk isolasi sinyal tsunami dari pasang surut astronomis</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => zoomInOut(0.25)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors">Zoom In</button>
                   <button onClick={() => zoomInOut(-0.25)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors">Zoom Out</button>
                   <button onClick={() => { setZoomDomain(null); setVZoom(1); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors">Reset</button>
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
                          formatter={(value: number, name: string) => [value.toFixed(3) + ' m', name === 'tsunamiSignal' ? 'High-Freq Signal (Tsunami)' : (name === 'smoothed' ? 'Astro Tide Base' : 'Raw Sea Level')]}
                          labelFormatter={(label: number) => formatUTC(new Date(label), 'dd/MM/yyyy HH:mm:ss') + ' UTC'}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                          labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }} />

                        {refAreaLeft && refAreaRight && (
                           <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#ef4444" fillOpacity={0.15} />
                        )}

                        <Line 
                            type="monotone" 
                            dataKey="raw" 
                            stroke="#0f172a" 
                            strokeWidth={1.5} 
                            dot={false} 
                            name="Raw Sea Level" 
                            isAnimationActive={false} 
                        />
                        <Line 
                            type="monotone" 
                            dataKey="smoothed" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                            strokeDasharray="5 5"
                            dot={false} 
                            name="Astro Tide Base" 
                            isAnimationActive={false} 
                        />
                        <Line 
                            type="monotone" 
                            dataKey="tsunamiSignal" 
                            stroke="#ef4444" 
                            strokeWidth={2} 
                            dot={false} 
                            name="High-Freq Signal (Tsunami)" 
                            isAnimationActive={false} 
                        />

                        <Brush 
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
