import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Radio, 
  Piano, 
  TrendingUp, 
  Settings, 
  Download, 
  FileText,
  Waves,
  CheckCircle2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { cn } from '@/src/lib/utils';

// Mock data generator for sleek visualization
const generateMockTideData = () => {
  const data = [];
  const start = new Date(2026, 3, 11, 15, 50);
  for (let i = 0; i < 100; i++) {
    const time = new Date(start.getTime() + i * 600000); // every 10 mins
    const t = i / 10;
    // Base tide: M2 (12.42h) + S2 (12h) roughly
    const val = 1.4 + 0.5 * Math.cos(t * 0.5) + 0.2 * Math.cos(t * 0.52);
    const noise = (Math.random() - 0.5) * 0.05;
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: time.toLocaleDateString([], { day: '2-digit', month: 'short' }),
      raw: val + noise,
      filtered: val
    });
  }
  return data;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const mockData = useMemo(() => generateMockTideData(), []);

  const navItems = [
    { id: 'dashboard', label: 'Analysis Dashboard', icon: LayoutDashboard },
    { id: 'outlier', label: 'Outlier Detection', icon: Search },
    { id: 'filter', label: 'Low Pass Filter', icon: Radio },
    { id: 'harmonic', label: 'Harmonic Analysis', icon: Piano },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'config', label: 'Script Config', icon: Settings },
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

        <div className="mt-auto border-t border-[#e2e8f0] pt-4">
          <div className="flex items-center gap-3 px-3 py-2 text-[#64748b] text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
            v1.2.0 Stable Build
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b]">Tide Data Analysis</h1>
            <p className="text-sm text-[#64748b] mt-1">Processing: tide_data_jakarta_2026.csv</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#1e293b] hover:bg-slate-50 shadow-sm transition-all">
              <Download size={16} />
              Export CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0284c7] text-white rounded-lg text-sm font-semibold hover:bg-[#0ea5e9] shadow-md shadow-sky-100 transition-all">
              <FileText size={16} />
              Generate Report
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard 
            label="SLR Trend" 
            value="+4.2 mm/yr" 
            trend="Linear Confidence: 98%" 
            trendColor="text-[#10b981]" 
          />
          <StatCard 
            label="Mean Sea Level" 
            value="1.42 m" 
            trend="Relative to LAT" 
          />
          <StatCard 
            label="Outliers Cleared" 
            value="127 pts" 
            trend="Method: Z-Score" 
            trendColor="text-[#f59e0b]"
          />
          <StatCard 
            label="Time Offset" 
            value="+07:00" 
            trend="UTC Adjusted" 
          />
        </div>

        {/* Visualization Area */}
        <div className="flex-1 min-h-[400px] bg-white rounded-xl border border-[#e2e8f0] p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-[#1e293b]">Time Series Visualization</h3>
            <div className="flex gap-4 text-xs font-medium text-[#64748b]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-[#0284c7] rounded-full"></div>
                Raw Data
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 border-t-2 border-dashed border-[#f59e0b]"></div>
                Low Pass Filter
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 10, fill: '#64748b'}} 
                  axisLine={false}
                  tickLine={false}
                  interval={20}
                />
                <YAxis 
                  tick={{fontSize: 10, fill: '#64748b'}} 
                  axisLine={false}
                  tickLine={false}
                  domain={[0.5, 2.5]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="raw" 
                  stroke="#0284c7" 
                  strokeWidth={1} 
                  dot={false} 
                  opacity={0.3}
                />
                <Line 
                  type="monotone" 
                  dataKey="filtered" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  dot={false}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-8">
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1e293b] mb-4">Harmonic Constituents</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[#64748b] font-medium border-b border-[#e2e8f0]">
                  <tr>
                    <th className="pb-3 px-2 font-semibold">Component</th>
                    <th className="pb-3 px-2 font-semibold">Description</th>
                    <th className="pb-3 px-2 font-semibold">Amplitude (m)</th>
                    <th className="pb-3 px-2 font-semibold">Phase (deg)</th>
                    <th className="pb-3 px-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <ConstituentRow comp="M2" desc="Principal lunar semidiurnal" amp="0.542" phase="182.4" />
                  <ConstituentRow comp="S2" desc="Principal solar semidiurnal" amp="0.124" phase="240.1" />
                  <ConstituentRow comp="K1" desc="Luni-solar diurnal" amp="0.285" phase="115.3" />
                  <ConstituentRow comp="O1" desc="Lunar diurnal" amp="0.198" phase="094.2" />
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#1e293b]">Analysis Config</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#64748b] font-bold mb-1.5 gray-500">
                  Constituent Set
                </label>
                <select 
                  defaultValue="9 Components (Enhanced)"
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#1e293b] focus:ring-2 focus:ring-[#0284c7] outline-none"
                >
                  <option>4 Components (Standard)</option>
                  <option>9 Components (Enhanced)</option>
                  <option>UKHO Total Tide Plus</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#64748b] font-bold mb-1.5 gray-500">
                  Prediction Range
                </label>
                <select className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#1e293b] focus:ring-2 focus:ring-[#0284c7] outline-none">
                  <option>Next 7 Days</option>
                  <option>Next 30 Days</option>
                  <option>Next Year</option>
                </select>
              </div>
              <button className="mt-auto w-full py-2.5 bg-[#0284c7] hover:bg-[#0ea5e9] text-white rounded-lg text-sm font-bold shadow-md transition-all">
                Run Python Script
              </button>
            </div>
          </div>
        </div>
      </main>
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

function ConstituentRow({ comp, desc, amp, phase }: { comp: string, desc: string, amp: string, phase: string }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="py-3 px-2 font-bold text-[#0284c7]">{comp}</td>
      <td className="py-3 px-2 text-[#64748b] text-xs">{desc}</td>
      <td className="py-3 px-2 font-medium">{amp}</td>
      <td className="py-3 px-2 font-medium">{phase}</td>
      <td className="py-3 px-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] text-[10px] font-bold">
          <CheckCircle2 size={10} /> Active
        </span>
      </td>
    </tr>
  );
}
