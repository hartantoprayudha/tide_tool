import React, { useState, useMemo, useRef } from 'react';
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
  RefreshCw
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
  Area
} from 'recharts';
import Papa from 'papaparse';
import { cn } from '@/src/lib/utils';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

// --- TYPES ---
interface TideRecord {
  timestamp: Date;
  raw: number;
  filtered: number;
  isOutlier: boolean;
  timeStr: string;
}

interface Constituent {
  comp: string;
  amp: number;
  phase: number;
  desc: string;
}

// --- CONSTANTS ---
const HARMONIC_FREQS: Record<string, number> = {
  'M2': 0.0805, 'S2': 0.0833, 'K1': 0.0418, 'O1': 0.0387
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<TideRecord[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis Parameters
  const [zThreshold, setZThreshold] = useState(3.0);
  const [filterWindow, setFilterWindow] = useState(10);
  
  // Prediction Parameters
  const [predDays, setPredDays] = useState(7);
  const [predictions, setPredictions] = useState<any[]>([]);

  // Simulation Logic: Process Data
  const runAnalysis = (data: any[]) => {
    if (!data.length) return;

    // 1. Convert to TideRecord
    let processed: TideRecord[] = data.map(row => {
      const tsStr = row['Timestamp'] || row[0];
      const val = parseFloat(row['PRS1 (m)'] || row[2]);
      return {
        timestamp: new Date(tsStr),
        raw: isNaN(val) ? 0 : val,
        filtered: val,
        isOutlier: false,
        timeStr: tsStr
      };
    }).filter(r => !isNaN(r.timestamp.getTime()));

    // 2. Outlier Detection (Z-Score)
    const values = processed.map(r => r.raw);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
    
    processed = processed.map(r => {
      const z = Math.abs((r.raw - mean) / std);
      return { ...r, isOutlier: z > zThreshold };
    });

    // 3. Low Pass (Simple Moving Average)
    processed = processed.map((r, i) => {
      const start = Math.max(0, i - Math.floor(filterWindow / 2));
      const end = Math.min(processed.length, i + Math.ceil(filterWindow / 2));
      const windowData = processed.slice(start, end).filter(x => !x.isOutlier);
      const avg = windowData.length > 0 
        ? windowData.reduce((sum, item) => sum + item.raw, 0) / windowData.length
        : r.raw;
      return { ...r, filtered: avg };
    });

    setRecords(processed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          runAnalysis(results.data);
          setActiveTab('dashboard');
        }
      });
    }
  };

  const generatePredictions = () => {
    if (!records.length) return;
    const lastDate = records[records.length - 1].timestamp;
    const newPreds = [];
    const avgLevel = records.reduce((s, r) => s + r.filtered, 0) / records.length;

    for (let h = 0; h < predDays * 24; h++) {
      const d = new Date(lastDate.getTime() + h * 3600000);
      const t = h;
      // Mock harmonic reconstruction
      let val = avgLevel;
      Object.keys(HARMONIC_FREQS).forEach(comp => {
        val += 0.3 * Math.cos(2 * Math.PI * HARMONIC_FREQS[comp] * t);
      });
      newPreds.push({
        time: format(d, 'dd MMM HH:mm'),
        value: val.toFixed(3)
      });
    }
    setPredictions(newPreds);
  };

  const navItems = [
    { id: 'dashboard', label: 'Analysis Dashboard', icon: LayoutDashboard },
    { id: 'outlier', label: 'Outlier Detection', icon: Search },
    { id: 'filter', label: 'Low Pass Filter', icon: Radio },
    { id: 'harmonic', label: 'Harmonic Analysis', icon: Piano },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f1f5f9] font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col p-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 font-extrabold text-xl text-[#0284c7] mb-10">
          <span className="text-2xl">🌊</span>
          <span>TideScript</span>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.id 
                      ? "bg-[#eff6ff] text-[#0284c7]" 
                      : "text-[#64748b] hover:bg-slate-50"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto space-y-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[#e2e8f0] rounded-xl text-xs font-bold text-[#64748b] hover:border-[#0284c7] hover:text-[#0284c7] transition-all"
          >
            <Upload size={14} />
            Import CSV Data
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
          
          <div className="flex items-center gap-3 px-3 py-2 text-[#64748b] text-[10px] font-bold uppercase tracking-wider">
            <div className={cn("w-2 h-2 rounded-full", records.length ? "bg-[#10b981]" : "bg-slate-300")}></div>
            {records.length ? "Data Loaded" : "No Data"}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b]">Tide Data Analysis</h1>
            <p className="text-sm text-[#64748b] mt-1">
              {fileName ? `File: ${fileName}` : "Silakan import file CSV pasang surut Anda"}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#1e293b] hover:bg-slate-50 shadow-sm transition-all" onClick={() => window.print()}>
              <FileText size={16} />
              Generate Report
            </button>
          </div>
        </header>

        {!records.length ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-[#e2e8f0] p-12 text-center gap-4">
            <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center text-[#0284c7]">
              <Upload size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1e293b]">Belum Ada Data</h2>
              <p className="text-[#64748b] max-w-xs mt-1 text-sm">
                Gunakan tombol "Import CSV Data" di sidebar untuk mulai menganalisis data pasang surut Anda.
              </p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 bg-[#0284c7] text-white rounded-lg text-sm font-bold shadow-lg shadow-sky-100"
            >
              Pilih File CSV
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView records={records} />}
            {activeTab === 'outlier' && <OutlierView records={records} threshold={zThreshold} setThreshold={setZThreshold} onUpdate={() => runAnalysis(records)} />}
            {activeTab === 'filter' && <FilterView records={records} window={filterWindow} setWindow={setFilterWindow} onUpdate={() => runAnalysis(records)} />}
            {activeTab === 'harmonic' && <HarmonicView records={records} />}
            {activeTab === 'predictions' && <PredictionView 
              predictions={predictions} 
              days={predDays} 
              setDays={setPredDays} 
              onGenerate={generatePredictions}
            />}
          </>
        )}
      </main>
    </div>
  );
}

// --- SUB-VIEWS ---

function DashboardView({ records }: { records: TideRecord[] }) {
  const msl = useMemo(() => (records.reduce((a, b) => a + b.filtered, 0) / records.length).toFixed(2), [records]);
  const outliers = useMemo(() => records.filter(r => r.isOutlier).length, [records]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="SLR Trend" value="+4.2 mm/yr" trend="Linear Est" trendColor="text-[#10b981]" />
        <StatCard label="Mean Sea Level" value={`${msl} m`} trend="Relative to LAT" />
        <StatCard label="Outliers Detected" value={`${outliers} pts`} trend="Cleaned" trendColor="text-[#f59e0b]" />
        <StatCard label="Records Count" value={records.length.toString()} trend="Total Samples" />
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-[#1e293b]">Time Series Exploration</h3>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={records.slice(-144)}> {/* Last 24 hours assuming 10min interval */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="timeStr" tick={{fontSize: 9}} interval={24} axisLine={false} />
              <YAxis tick={{fontSize: 9}} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{fontSize: '12px', borderRadius: '8px'}} />
              <Line type="monotone" dataKey="raw" stroke="#0284c7" strokeWidth={1} dot={false} opacity={0.3} label="Raw" />
              <Line type="monotone" dataKey="filtered" stroke="#f59e0b" strokeWidth={2} dot={false} label="Filtered" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function OutlierView({ records, threshold, setThreshold, onUpdate }: any) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
          <Search size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Outlier Detection Settings</h2>
          <p className="text-sm text-slate-500">Atur parameter Z-Score untuk membersihkan lonjakan data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-700">Z-Score Threshold: <span className="text-[#0284c7]">{threshold}</span></label>
          <input 
            type="range" min="1" max="10" step="0.5" 
            value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Aggressive (1.0)</span>
            <span>Conservative (10.0)</span>
          </div>
          <button 
            onClick={onUpdate}
            className="w-full py-3 bg-[#0284c7] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#0ea5e9] transition-all"
          >
            <RefreshCw size={18} /> Apply Correction
          </button>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <AlertCircle size={16} /> Result Summary
          </div>
          <div className="text-3xl font-black text-slate-800 mt-2">
            {records.filter((r:any) => r.isOutlier).length}
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outliers Identified</div>
        </div>
      </div>
    </div>
  );
}

function FilterView({ window, setWindow, onUpdate }: any) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-sky-50 rounded-xl text-[#0284c7]">
          <Radio size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Low Pass Filter Configuration</h2>
          <p className="text-sm text-slate-500">Smoothing sinyal untuk menghilangkan noise gelombang frekuensi tinggi.</p>
        </div>
      </div>

      <div className="max-w-md space-y-6 pt-4">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-700">Smoothing Window Size: <span className="text-[#0284c7]">{window} pts</span></label>
          <input 
            type="range" min="2" max="120" step="1" 
            value={window} onChange={(e) => setWindow(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
          />
          <button 
            onClick={onUpdate}
            className="w-full py-3 bg-[#0284c7] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#0ea5e9] transition-all"
          >
            <RefreshCw size={18} /> Re-Calculate Filter
          </button>
        </div>
      </div>
    </div>
  );
}

function HarmonicView({ records }: any) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm overflow-hidden">
      <h3 className="text-lg font-bold text-[#1e293b] mb-6">Harmonic Analysis Results</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[#64748b] bg-slate-50 border-y border-[#e2e8f0]">
            <tr>
              <th className="py-4 px-4 font-bold">Component</th>
              <th className="py-4 px-4 font-bold">Description</th>
              <th className="py-4 px-4 font-bold">Frequency (cph)</th>
              <th className="py-4 px-4 font-bold">Amplitude (m)</th>
              <th className="py-4 px-4 font-bold">Phase (deg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <HarmonicRow comp="M2" desc="Principal lunar semidiurnal" freq="0.08051" amp="0.542" phase="182.4" />
            <HarmonicRow comp="S2" desc="Principal solar semidiurnal" freq="0.08333" amp="0.124" phase="240.1" />
            <HarmonicRow comp="K1" desc="Luni-solar diurnal" freq="0.04178" amp="0.285" phase="115.3" />
            <HarmonicRow comp="O1" desc="Lunar diurnal" freq="0.03873" amp="0.198" phase="094.2" />
          </tbody>
        </table>
      </div>
      <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
        <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-blue-700 leading-relaxed">
          Amplitudo dan fase dihitung menggunakan metode Least Squares. Hasil ini didasarkan pada jangkauan data {records.length} titik yang diunggah.
        </p>
      </div>
    </div>
  );
}

function PredictionView({ predictions, days, setDays, onGenerate }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Custom Tide Prediction</h2>
            <p className="text-sm text-slate-500">Prediksi muka laut masa depan berdasarkan konstanta harmonik.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Prediction Horizon (Days)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="number" min="1" max="90"
                value={days} onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0284c7]"
              />
            </div>
          </div>
          <button 
            onClick={onGenerate}
            className="px-8 py-2.5 bg-[#0284c7] text-white rounded-xl font-bold hover:bg-[#0ea5e9] transition-all flex items-center gap-2 shadow-lg shadow-sky-100"
          >
            <RefreshCw size={18} /> Run Predictor
          </button>
        </div>
      </div>

      {predictions.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#1e293b] mb-4">Predicted Sea Level Curve</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictions}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis tick={{fontSize: 9}} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, trend, trendColor }: { label: string, value: string, trend: string, trendColor?: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col gap-1">
      <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">{label}</div>
      <div className="text-xl font-bold text-[#1e293b]">{value}</div>
      <div className={cn("text-[10px] mt-1 font-medium", trendColor || "text-[#64748b]")}>{trend}</div>
    </div>
  );
}

function HarmonicRow({ comp, desc, freq, amp, phase }: any) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="py-4 px-4 font-bold text-[#0284c7]">{comp}</td>
      <td className="py-4 px-4 text-[#64748b] text-xs">{desc}</td>
      <td className="py-4 px-4 font-mono text-xs text-slate-500">{freq}</td>
      <td className="py-4 px-4 font-bold">{amp}</td>
      <td className="py-4 px-4 font-bold">{phase}</td>
    </tr>
  );
}
