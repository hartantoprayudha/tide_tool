import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Radio, 
  Piano, 
  TrendingUp, 
  Settings, 
  Download, 
  FileText,
  Upload,
  Calendar,
  AlertCircle,
  Clock,
  Waves,
  CheckCircle2,
  Trash2,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import Papa from 'papaparse';
import { cn } from '@/src/lib/utils';
import { format, addDays, parse, isValid } from 'date-fns';

// --- TYPES ---
interface TideRecord {
  timestamp: Date;
  raw: number;
  filtered: number;
  isOutlier: boolean;
  timeStr: string;
}

interface ConstituentResult {
  comp: string;
  amp: number;
  phase: number;
  desc: string;
  freq: number;
}

// --- CONSTANTS ---
// Frequencies in cycles per hour
const HARMONIC_FREQS: Record<string, { f: number, d: string }> = {
  'M2': { f: 0.080511401, d: 'Principal lunar semidiurnal' },
  'S2': { f: 0.083333333, d: 'Principal solar semidiurnal' },
  'K1': { f: 0.041780746, d: 'Luni-solar diurnal' },
  'O1': { f: 0.038730654, d: 'Lunar diurnal' },
  'N2': { f: 0.078999249, d: 'Larger lunar elliptic semidiurnal' },
  'K2': { f: 0.083561492, d: 'Luni-solar semidiurnal' },
  'P1': { f: 0.041552587, d: 'Solar diurnal' },
  'M4': { f: 0.161022801, d: 'Shallow water overtides of principal lunar' },
  'MS4': { f: 0.163844734, d: 'Shallow water constituent' },
  // UKHO / Extended Set
  'Q1': { f: 0.037218503, d: 'Larger lunar elliptic diurnal' },
  'J1': { f: 0.043292898, d: 'Smaller lunar elliptic diurnal' },
  'OO1': { f: 0.044830840, d: 'Lunar diurnal' },
  '2N2': { f: 0.077487098, d: 'Lunar semidiurnal' },
  'MU2': { f: 0.077689470, d: 'Variational' },
  'NU2': { f: 0.079201621, d: 'Lunar semidiurnal' },
  'L2': { f: 0.082023552, d: 'Smaller lunar elliptic semidiurnal' },
  'T2': { f: 0.083219261, d: 'Principal solar' },
  'S4': { f: 0.166666667, d: 'Solar semidiurnal overtide' },
  'M6': { f: 0.241534202, d: 'Lunar semidiurnal overtide' },
  'S6': { f: 0.250000000, d: 'Solar semidiurnal overtide' },
  'MSf': { f: 0.002821933, d: 'Lunisolar synodic fortnightly' },
  'Mf': { f: 0.003050013, d: 'Lunar fortnightly' },
  'Mm': { f: 0.001512151, d: 'Lunar monthly' },
  'Ssa': { f: 0.000228159, d: 'Solar semi-annual' },
  'Sa': { f: 0.000114079, d: 'Solar annual' }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<TideRecord[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration State
  const [availableSensors, setAvailableSensors] = useState<string[]>([]);
  const [selectedSensor, setSelectedSensor] = useState('');
  const [constituentSet, setConstituentSet] = useState<'4' | '9' | 'UKHO'>('9');
  const [isLoading, setIsLoading] = useState(false);

  // Analysis State
  const [zThreshold, setZThreshold] = useState(3.0);
  const [filterWindow, setFilterWindow] = useState(10);
  const [harmonicResults, setHarmonicResults] = useState<ConstituentResult[]>([]);
  const [z0, setZ0] = useState(0);
  
  // Prediction State
  const [predStartDate, setPredStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [predEndDate, setPredEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [predictions, setPredictions] = useState<any[]>([]);

  // --- CORE ANALYTICS ENGINE (Client-side) ---

  const solveLeastSquares = (t: number[], y: number[], comps: string[]) => {
    // Solve y = Z0 + sum(Ai cos(wi t) + Bi sin(wi t))
    const numRows = t.length;
    const numComps = comps.length;
    const numParams = 1 + 2 * numComps;

    // Construct Matrix A and vector b
    const A: number[][] = Array.from({ length: numParams }, () => new Array(numParams).fill(0));
    const b: number[] = new Array(numParams).fill(0);

    const f_list = comps.map(c => 2 * Math.PI * HARMONIC_FREQS[c].f);

    for (let i = 0; i < numRows; i++) {
        const rowVals = new Array(numParams);
        rowVals[0] = 1; // Constant term Z0
        for (let j = 0; j < numComps; j++) {
            rowVals[1 + 2 * j] = Math.cos(f_list[j] * t[i]);
            rowVals[1 + 2 * j + 1] = Math.sin(f_list[j] * t[i]);
        }

        // Normal Equations: (A^T * A) x = A^T * y
        for (let r = 0; r < numParams; r++) {
            for (let c = 0; c < numParams; c++) {
                A[r][c] += rowVals[r] * rowVals[c];
            }
            b[r] += rowVals[r] * y[i];
        }
    }

    // Solve Ax = b using Gaussian Elimination with partial pivoting
    const x = gaussianSolve(A, b);
    return x;
  };

  const gaussianSolve = (A: number[][], b: number[]) => {
    const n = b.length;
    for (let i = 0; i < n; i++) {
        let max = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(A[k][i]) > Math.abs(A[max][i])) max = k;
        }
        [A[i], A[max]] = [A[max], A[i]];
        [b[i], b[max]] = [b[max], b[i]];

        for (let k = i + 1; k < n; k++) {
            const factor = A[k][i] / A[i][i];
            b[k] -= factor * b[i];
            for (let j = i; j < n; j++) {
                A[k][j] -= factor * A[i][j];
            }
        }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        if (Math.abs(A[i][i]) < 1e-12) {
            x[i] = 0;
            continue;
        }
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += A[i][j] * x[j];
        }
        x[i] = (b[i] - sum) / A[i][i];
    }
    return x;
  };

  const runAnalysis = (rawRows: any[], sensorToUse?: string) => {
    if (!rawRows.length) return;
    const currentSensor = sensorToUse || selectedSensor;
    if (!currentSensor) return;

    setIsLoading(true);

    // Simulate async for loading state
    setTimeout(() => {
      try {
        // 1. Data Parsing with flexible Date format
        let processed: TideRecord[] = rawRows.map(row => {
          let tsStr = (row['Timestamp'] || row[0] || "").trim();
          // Use selected sensor
          let valStr = (row[currentSensor] || "").trim();
          
          tsStr = tsStr.replace(/\s+/g, ' ');

          const formats = ['dd/MM/yyyy HH:mm', 'ddMMyyyy HH:mm', 'dd-MM-yyyy HH:mm', 'yyyy-MM-dd HH:mm:ss', 'ddMMyyyy HHmm', 'dd/MM/yyyy HH.mm'];
          let dateObj: Date = new Date(NaN);
          
          for (const fmt of formats) {
            const p = parse(tsStr, fmt, new Date());
            if (isValid(p)) {
              dateObj = p;
              break;
            }
          }

          if (!isValid(dateObj)) dateObj = new Date(tsStr);
          
          const valRaw = parseFloat(valStr.replace(',', '.'));
          const val = isNaN(valRaw) ? 0 : parseFloat(valRaw.toFixed(3)); // Round to 3 decimals

          return {
            timestamp: dateObj,
            raw: val,
            filtered: 0,
            isOutlier: false,
            timeStr: isValid(dateObj) ? format(dateObj, 'dd/MM HH:mm') : "Invalid"
          };
        }).filter(r => isValid(r.timestamp));

        if (processed.length === 0) {
          alert("Gagal memproses data. Kolom sensor atau format waktu mungkin salah.");
          setIsLoading(false);
          return;
        }

        // 2. Outlier Removal
        const validRaw = processed.map(p => p.raw);
        const mean = validRaw.reduce((a, b) => a + b, 0) / validRaw.length;
        const std = Math.sqrt(validRaw.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (validRaw.length || 1));
        
        processed = processed.map(r => ({
          ...r,
          isOutlier: Math.abs(r.raw - mean) > (zThreshold * std)
        }));

        // 3. Filter (Moving Average)
        processed = processed.map((r, i) => {
          const start = Math.max(0, i - Math.floor(filterWindow / 2));
          const end = Math.min(processed.length, i + Math.ceil(filterWindow / 2));
          const window = processed.slice(start, end).filter(p => !p.isOutlier);
          const avg = window.length > 0 ? window.reduce((s, x) => s + x.raw, 0) / window.length : r.raw;
          return { ...r, filtered: parseFloat(avg.toFixed(3)) }; // Round
        });

        // 4. Harmonic Analysis
        let compsToFit: string[] = [];
        if (constituentSet === '4') compsToFit = ['M2', 'S2', 'K1', 'O1'];
        else if (constituentSet === '9') compsToFit = ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4'];
        else compsToFit = Object.keys(HARMONIC_FREQS); // UKHO

        const t_hours = processed.map(r => (r.timestamp.getTime() - processed[0].timestamp.getTime()) / 3600000);
        const y_vals = processed.map(r => r.filtered);
        
        const solution = solveLeastSquares(t_hours, y_vals, compsToFit);
        const fittedZ0 = solution[0];
        const results: ConstituentResult[] = compsToFit.map((c, i) => {
            const a = solution[1 + 2 * i];
            const b = solution[1 + 2 * i + 1];
            const amp = Math.sqrt(a * a + b * b);
            let phase = Math.atan2(b, a) * (180 / Math.PI);
            if (phase < 0) phase += 360;
            return {
              comp: c,
              amp,
              phase,
              desc: HARMONIC_FREQS[c].d,
              freq: HARMONIC_FREQS[c].f
            };
        });

        setZ0(parseFloat(fittedZ0.toFixed(3)));
        setHarmonicResults(results);
        setRecords(processed);
      } catch (err) {
        console.error("Analysis error", err);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const fields = results.meta.fields || [];
          const detectedSensors = fields.filter(f => f.toLowerCase().includes('(m)'));
          
          setAvailableSensors(detectedSensors);
          const initialSensor = detectedSensors.length > 0 ? detectedSensors[0] : '';
          setSelectedSensor(initialSensor);
          
          setRawData(results.data);
          runAnalysis(results.data, initialSensor);
          setActiveTab('dashboard');
        }
      });
    }
  };

  const generatePredictions = () => {
    if (!records.length || !harmonicResults.length) return;
    setIsLoading(true);

    setTimeout(() => {
        try {
            const start = new Date(predStartDate);
            const end = new Date(predEndDate);
            if (!isValid(start) || !isValid(end)) {
                alert("Tanggal prediksi tidak valid");
                return;
            }

            const diffHours = Math.ceil((end.getTime() - start.getTime()) / 3600000);
            if (diffHours <= 0) {
                alert("Tanggal akhir harus setelah tanggal awal");
                return;
            }

            const predData = [];
            for (let h = 0; h <= diffHours; h++) {
                const d = new Date(start.getTime() + h * 3600000);
                // Time relative to the input data's start time for the harmonic components
                const t = (d.getTime() - records[0].timestamp.getTime()) / 3600000;
                
                let val = z0;
                harmonicResults.forEach(res => {
                    const w = 2 * Math.PI * res.freq;
                    const ph = res.phase * (Math.PI / 180);
                    val += res.amp * Math.cos(w * t - ph);
                });

                predData.push({
                    time: format(d, 'dd/MM HH:mm'),
                    value: parseFloat(val.toFixed(3)),
                    timestamp: d
                });
            }
            setPredictions(predData);
        } finally {
            setIsLoading(false);
        }
    }, 500);
  };

  const exportPredictions = (formatType: 'csv' | 'txt') => {
    if (!predictions.length) return;
    let content = "";
    if (formatType === 'csv') {
      content = "Timestamp,Predicted Height (m)\n";
      predictions.forEach(p => {
        content += `${format(p.timestamp, 'yyyy-MM-dd HH:mm:ss')},${p.value}\n`;
      });
    } else {
      content = `Tide Prediction Report\nRange: ${predStartDate} to ${predEndDate}\n`;
      content += `------------------------------------------\n`;
      predictions.forEach(p => {
          content += `${format(p.timestamp, 'dd/MM HH:mm')}: ${p.value} m\n`;
      });
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tide_prediction_${predStartDate}_${predEndDate}.${formatType}`;
    link.click();
  };

  const exportReport = (formatType: 'csv' | 'txt') => {
    if (!records.length) return;

    let content = "";
    if (formatType === 'csv') {
      content = "Timestamp,Raw (m),Filtered (m),Is Outlier\n";
      records.forEach(r => {
        content += `${format(r.timestamp, 'yyyy-MM-dd HH:mm:ss')},${r.raw},${r.filtered},${r.isOutlier}\n`;
      });
    } else {
      content = `Tide Analysis Report - ${fileName}\n`;
      content += `Generated: ${new Date().toLocaleString()}\n`;
      content += `------------------------------------------\n`;
      content += `Mean Sea Level (Z0): ${z0.toFixed(4)} m\n\n`;
      content += `Harmonic Constituents:\n`;
      content += `Comp | Amp (m) | Phase (deg) | Desc\n`;
      harmonicResults.forEach(r => {
        content += `${r.comp.padEnd(4)} | ${r.amp.toFixed(4).padEnd(7)} | ${r.phase.toFixed(2).padEnd(11)} | ${r.desc}\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tide_report_${fileName.split('.')[0]}.${formatType}`;
    link.click();
  };

  return (
    <div className="flex h-screen w-full bg-[#f1f5f9] font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col p-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 font-extrabold text-xl text-[#0284c7] mb-10">
          <span className="text-2xl">🌊</span>
          <span>TideScript</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          {['dashboard', 'outlier', 'filter', 'harmonic', 'predictions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab 
                  ? "bg-[#eff6ff] text-[#0284c7]" 
                  : "text-[#64748b] hover:bg-slate-50"
              )}
            >
              {tab === 'dashboard' && <LayoutDashboard size={18} />}
              {tab === 'outlier' && <Search size={18} />}
              {tab === 'filter' && <Radio size={18} />}
              {tab === 'harmonic' && <Piano size={18} />}
              {tab === 'predictions' && <TrendingUp size={18} />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          {availableSensors.length > 0 && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic font-serif">Sensor Terdeteksi</label>
              <select 
                value={selectedSensor}
                onChange={(e) => {
                  setSelectedSensor(e.target.value);
                  runAnalysis(rawData, e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-100 cursor-pointer hover:border-sky-300 transition-colors"
              >
                {availableSensors.map(sensor => (
                  <option key={sensor} value={sensor}>{sensor}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic font-serif">Constituent Set</label>
            <select 
              value={constituentSet}
              onChange={(e) => {
                const val = e.target.value as any;
                setConstituentSet(val);
                // Trigger re-analysis when set changes
                runAnalysis(rawData);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-100 cursor-pointer"
            >
              <option value="4">4 Constants (Fast)</option>
              <option value="9">9 Constants (Standard)</option>
              <option value="UKHO">UKHO Total Tide Plus</option>
            </select>
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#0284c7] text-white rounded-xl text-xs font-bold hover:bg-[#0ea5e9] transition-all shadow-lg shadow-sky-100"
          >
            <Upload size={14} />
            Import CSV Data
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
          
          <div className="flex items-center gap-3 px-3 py-2 text-[#64748b] text-[10px] font-bold uppercase tracking-wider">
            <div className={cn("w-2 h-2 rounded-full", records.length ? "bg-[#10b981]" : "bg-slate-300")}></div>
            {records.length ? `${records.length} records active` : "No Data Loaded"}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b]">Marine Tide Analytics</h1>
            <p className="text-sm text-[#64748b] mt-1">
              {fileName ? `Processing: ${fileName}` : "Silakan import file CSV dengan kolom Timestamp & PRS1 (m)"}
            </p>
          </div>
          {records.length > 0 && (
            <div className="flex gap-2">
              <button 
                onClick={() => exportReport('csv')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#1e293b] hover:bg-slate-50 shadow-sm"
              >
                <FileSpreadsheet size={16} />
                Export CSV
              </button>
              <button 
                onClick={() => exportReport('txt')}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 shadow-md"
              >
                <FileText size={16} />
                Generate Text Report
              </button>
            </div>
          )}
        </header>

        {!records.length ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center gap-6 shadow-sm">
            <div className="w-20 h-20 bg-sky-50 rounded-3xl flex items-center justify-center text-[#0284c7] rotate-3 hover:rotate-0 transition-transform duration-300">
              <Waves size={40} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Siap Menganalisis Pasang Surut?</h2>
              <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm leading-relaxed">
                Import file CSV Anda (format deteksi otomatis: <b>dd/mm/yyyy hh:mm</b>). Kami akan menangani outlier, filter, dan prediksi secara otomatis.
              </p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3 bg-[#0284c7] text-white rounded-xl font-bold hover:scale-105 transition-all shadow-xl shadow-sky-100"
            >
              Mulai Project Baru
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === 'dashboard' && <DashboardView records={records} z0={z0} />}
            {activeTab === 'outlier' && (
                <OutlierView 
                  records={records} 
                  threshold={zThreshold} 
                  setThreshold={setZThreshold} 
                  onUpdate={() => runAnalysis(rawData)} 
                />
            )}
            {activeTab === 'filter' && (
                <FilterView 
                   records={records} 
                   window={filterWindow} 
                   setWindow={setFilterWindow} 
                   onUpdate={() => runAnalysis(rawData)} 
                />
            )}
            {activeTab === 'harmonic' && <HarmonicView results={harmonicResults} />}
            {activeTab === 'predictions' && (
                <PredictionView 
                    predictions={predictions} 
                    startDate={predStartDate}
                    endDate={predEndDate}
                    setStartDate={setPredStartDate}
                    setEndDate={setPredEndDate}
                    onGenerate={generatePredictions}
                    onExport={exportPredictions}
                    isLoading={isLoading}
                />
            )}
            
            {/* Loading Overlay */}
            {isLoading && (
              <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-[#0284c7] border-t-transparent rounded-full absolute top-0 animate-spin"></div>
                </div>
                <div className="text-sm font-black text-[#0284c7] animate-pulse">MEMPROSES DATA...</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// --- SUB-VIEWS ---

function DashboardView({ records, z0 }: { records: TideRecord[], z0: number }) {
  const outliers = useMemo(() => records.filter(r => r.isOutlier).length, [records]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Z0 (MSL)" value={`${isNaN(z0) ? "---" : z0.toFixed(3)} m`} trend="Least Squares Fit" />
        <StatCard label="Outliers Cleaned" value={`${outliers}`} trend="Z-Score Processed" trendColor="text-amber-500" />
        <StatCard label="Data Range" value={`${records.length}`} trend="Samples Analyzed" />
        <StatCard label="Sampling Interval" value="Variable" trend="Auto-detected" />
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800">Tide Level Comparison</h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-400">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#0284c7] opacity-30"></div> Raw Input</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> Analyzed (Filtered)</span>
          </div>
        </div>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={records}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="timeStr" tick={{fontSize: 9, fill:'#64748b'}} interval={Math.floor(records.length/10)} axisLine={false} />
              <YAxis tick={{fontSize: 9, fill:'#64748b'}} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{fontSize: '11px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                labelStyle={{fontWeight: 'bold', marginBottom: '4px'}}
              />
              <Line type="monotone" dataKey="raw" stroke="#0284c7" strokeWidth={1} dot={false} opacity={0.2} name="Raw" />
              <Line type="monotone" dataKey="filtered" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Analyzed" animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function OutlierView({ records, threshold, setThreshold, onUpdate }: any) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 space-y-8 shadow-sm">
       <div className="flex items-center gap-5">
        <div className="p-4 bg-amber-50 rounded-2xl text-amber-500 shadow-inner">
          <Search size={28} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">Spike & Outlier Control</h2>
          <p className="text-sm text-slate-500">Gunakan Z-Score untuk mengidentifikasi data error yang ekstrem.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <label className="text-sm font-bold text-slate-700 italic font-serif">Threshold Sensitivitas</label>
            <span className="text-2xl font-black text-[#0284c7] font-mono">{isNaN(threshold) ? 0 : threshold}σ</span>
          </div>
          <input 
            type="range" min="0.5" max="5" step="0.1" 
            value={isNaN(threshold) ? 3.0 : threshold} 
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setThreshold(isNaN(val) ? 3.0 : val);
            }}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
          />
          <p className="text-[10px] text-slate-400 font-medium italic">Catatan: Nilai lebih kecil (misal 1.0) akan menghapus lebih banyak data "spike".</p>
          <button 
            onClick={onUpdate}
            className="w-full py-4 bg-[#1e293b] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg"
          >
            <RefreshCw size={20} /> Jalankan Algoritma Pembersihan
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                <div className="text-4xl font-black text-slate-800">{records.filter((r:any) => r.isOutlier).length}</div>
                <div className="text-[10px] font-bold text-amber-600 uppercase mt-2">Dibuang (Outliers)</div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center">
                <div className="text-4xl font-black text-emerald-700">{records.filter((r:any) => !r.isOutlier).length}</div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase mt-2">Diterima (Verified)</div>
            </div>
        </div>
      </div>
    </div>
  );
}

function FilterView({ window, setWindow, onUpdate }: any) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 space-y-8 shadow-sm">
      <div className="flex items-center gap-5">
        <div className="p-4 bg-sky-50 rounded-2xl text-[#0284c7] shadow-inner">
          <Radio size={28} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">Sinyal Smoothing (Low Pass)</h2>
          <p className="text-sm text-slate-500">Menghilangkan gelombang pendek dan noise untuk mendapatkan profil pasut yang mulus.</p>
        </div>
      </div>

      <div className="max-w-md space-y-8">
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <label className="text-sm font-bold text-slate-700 italic font-serif">Moving Average Window</label>
            <span className="text-2xl font-black text-[#0284c7] font-mono">{isNaN(window) ? 0 : window} pts</span>
          </div>
          <input 
            type="range" min="1" max="100" step="1" 
            value={isNaN(window) ? 10 : window} 
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setWindow(isNaN(val) ? 10 : val);
            }}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
          />
          <button 
            onClick={onUpdate}
            className="w-full py-4 bg-[#0284c7] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#0ea5e9] transition-all shadow-lg"
          >
            <RefreshCw size={20} /> Terapkan Filter Low Pass
          </button>
        </div>
      </div>
    </div>
  );
}

function HarmonicView({ results }: { results: ConstituentResult[] }) {
  if (!results.length) return null;
  
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm overflow-hidden">
      <h3 className="text-lg font-black text-slate-800 mb-6 px-2">Konstanta Harmonik (Least Squares Fit)</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm text-left">
          <thead className="text-slate-500 bg-slate-50 uppercase text-[10px] font-black tracking-widest font-serif italic">
            <tr>
              <th className="py-4 px-6">Component</th>
              <th className="py-4 px-6">Definition</th>
              <th className="py-4 px-6">Frequency (cph)</th>
              <th className="py-4 px-6">Amplitude (m)</th>
              <th className="py-4 px-6">Phase (deg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((r) => (
               <tr key={r.comp} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-black text-[#0284c7]">{r.comp}</td>
                <td className="py-4 px-6 text-slate-500 text-xs">{r.desc}</td>
                <td className="py-4 px-6 font-mono text-[11px] text-slate-400">{r.freq.toFixed(8)}</td>
                <td className="py-4 px-6 font-bold text-slate-800 font-mono">{r.amp.toFixed(4)}</td>
                <td className="py-4 px-6 font-bold text-slate-800 font-mono">{r.phase.toFixed(2)}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PredictionView({ predictions, startDate, endDate, setStartDate, setEndDate, onGenerate, onExport, isLoading }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-500 shadow-inner">
            <TrendingUp size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Forecast Pasang Surut</h2>
            <p className="text-sm text-slate-500">Estimasi ketinggian air laut berdasarkan parameter harmonik yang ditemukan.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 italic font-serif">Tanggal Mulai</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0284c7] transition-colors" size={20} />
              <input 
                type="date"
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-sky-100 transition-all font-mono"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 italic font-serif">Tanggal Selesai</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0284c7] transition-colors" size={20} />
              <input 
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={cn(
                  "w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-sky-100 transition-all font-mono",
                  endDate < startDate && "border-red-300 focus:ring-red-100"
                )}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {endDate < startDate && (
              <span className="text-[10px] text-red-500 font-bold uppercase animate-pulse px-2">
                <AlertCircle size={10} className="inline mr-1" /> Tanggal Tidak Valid
              </span>
            )}
            <button 
              onClick={onGenerate}
              disabled={isLoading || !startDate || !endDate || endDate < startDate}
              className="w-full py-3.5 bg-[#0284c7] text-white rounded-2xl font-black hover:bg-[#0ea5e9] transition-all flex items-center justify-center gap-3 shadow-xl shadow-sky-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} />} 
              Hitung Prediksi
            </button>
          </div>
        </div>
      </div>

      {predictions.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="font-bold text-slate-800">Kurva Prediksi Masa Depan</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => onExport('csv')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Download size={14} /> CSV
              </button>
              <button 
                onClick={() => onExport('txt')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Download size={14} /> TXT
              </button>
              <span className="px-3 py-2 bg-sky-50 text-[#0284c7] text-[10px] font-black rounded-lg uppercase tracking-wider">Interval: 1 Hour</span>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictions}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{fontSize: 9, fill: '#64748b'}} interval={Math.floor(predictions.length/10)} axisLine={false} />
                <YAxis tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{fontSize: '11px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                />
                <Area type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-6">
             <div className="flex items-center gap-2 text-amber-500 mb-4 px-2">
                <AlertCircle size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Catatan Penting</span>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed px-2">
                Prediksi dihitung menggunakan konstanta harmonik yang ditemukan dari data input. Akurasi sangat bergantung pada panjang data input (ideal minimal 15-30 hari) dan kualitas pembersihan data awal.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, trend, trendColor }: { label: string, value: string, trend: string, trendColor?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow flex flex-col gap-1">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic font-serif">{label}</div>
      <div className="text-2xl font-black text-slate-800 font-mono">{value}</div>
      <div className={cn("text-[10px] mt-1 font-bold", trendColor || "text-slate-400")}>{trend}</div>
    </div>
  );
}
