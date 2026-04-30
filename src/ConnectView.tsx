import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle2, RotateCw, Table as TableIcon } from 'lucide-react';

export default function ConnectView({ onDataLoaded, onStationMetaLoaded }: { onDataLoaded: (data: any[], selectedSensorName?: string) => void, onStationMetaLoaded: (name: string, lat: string, lon: string) => void }) {
  const [host, setHost] = useState('10.10.140.19');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('r00t');
  const [database, setDatabase] = useState('bako');
  
  const [selectedTable, setSelectedTable] = useState('data_vsat5');
  const [limit, setLimit] = useState(1000);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load saved credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem('tide_db_credentials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.host) setHost(parsed.host);
        if (parsed.port) setPort(parsed.port);
        if (parsed.user) setUser(parsed.user);
        if (parsed.password) setPassword(parsed.password);
        if (parsed.database) setDatabase(parsed.database);
      } catch (e) {}
    }
  }, []);

  const saveCredentials = () => {
    localStorage.setItem('tide_db_credentials', JSON.stringify({ host, port, user, password, database }));
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    saveCredentials();

    try {
      // First, get station list if we can
      let stationMap: Record<string, any> = {};
      try {
        const stationRes = await fetch('/api/db/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, port, user, password, database, table: 'stationlist', limit: 1000 })
        });
        const stationData = await stationRes.json();
        if (stationData.success && stationData.data) {
          stationData.data.forEach((st: any) => {
            if (st.StationID) {
              stationMap[st.StationID] = st;
            }
          });
        }
      } catch (e) {
        console.warn("Could not fetch station list:", e);
      }

      // Then fetch actual data
      const res = await fetch('/api/db/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, user, password, database, table: selectedTable, limit })
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (!data.data || data.data.length === 0) {
          setError('Tabel kosong atau tidak ditemukan.');
          setIsLoading(false);
          return;
        }
        
        let stationIdFound = "";
        
        // Map database result to format expected by App.tsx
        // App.tsx expects objects like { Timestamp: 'yyyy-MM-dd HH:mm:ss', Sensor1: value, Sensor2: value }
        const mappedData = data.data.map((row: any) => {
          const newRow: any = {};
          
          if (row.StationID) stationIdFound = row.StationID;
          if (row.StationId) stationIdFound = row.StationId; // Case variation in ValidData table
          
          // Map TimeStamp
          newRow['Timestamp'] = row.TimeStamp || row.Timestamp;
          
          // Determine generic sensor columns from row keys. Exclude RecId, StationID, TimeStamp, ErCd...
          const excludeKeys = ['RecId', 'StationID', 'StationId', 'TimeStamp', 'Timestamp', 'CreateData', 'CreateBy', 'Last_Update', 'UpdateBy', 'Prediction', 'Source', 'Operator', 'Remark', 'Interpolation'];
          
          Object.keys(row).forEach(k => {
             if (!excludeKeys.includes(k) && !k.startsWith('ErCd')) {
                 newRow[k] = row[k];
             }
          });
          
          // Specific ValidData Table
          if (selectedTable === 'validdata') {
              if (row.combination !== undefined && row.combination !== null) {
                  newRow['Combination'] = row.combination;
              }
              if (row.Interpolation !== undefined && row.Interpolation !== null) {
                  newRow['Interpolation'] = row.Interpolation;
              }
          }
          
          return newRow;
        });

        // Ensure sorted chronologically (DB usually descendant for LIMIT if we want latest, but script expects chronological)
        mappedData.sort((a: any, b: any) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());

        // Call station meta loader if we found a station ID and mapping
        if (stationIdFound && stationMap[stationIdFound]) {
            const st = stationMap[stationIdFound];
            onStationMetaLoaded(st.StationName || stationIdFound, (st.Latitude || "").toString(), (st.Longitude || "").toString());
        }

        setSuccessMsg(`Berhasil memuat ${mappedData.length} baris dari tabel ${selectedTable === 'data_vsat5' ? 'Raw Data (data_vsat5)' : 'Valid Data (validdata)'}`);
        
        // Find default sensor Name (usually Sensor1)
        const sampleRow = mappedData[0] || {};
        const sensorColumns = Object.keys(sampleRow).filter(k => k !== 'Timestamp');
        
        setTimeout(() => {
            onDataLoaded(mappedData, sensorColumns.includes('Sensor1') ? 'Sensor1' : sensorColumns[0]);
        }, 1500);

      } else {
        setError(data.error || 'Gagal terhubung ke database.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight font-display">Koneksi Database MySQL</h1>
            <p className="text-slate-500 font-medium">Hubungkan aplikasi ke database MySQL untuk menarik data pasang surut secara langsung.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Credentials & Server</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Host</label>
              <input type="text" value={host} onChange={e => setHost(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-700 outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Port</label>
              <input type="text" value={port} onChange={e => setPort(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-700 outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Database Name</label>
              <input type="text" value={database} onChange={e => setDatabase(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-700 outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
              <input type="text" value={user} onChange={e => setUser(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-700 outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-700 outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Query Target</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Tabel Data</label>
              <div className="relative">
                <TableIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={selectedTable} 
                  onChange={e => setSelectedTable(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
                >
                  <option value="data_vsat5">Raw Data (data_vsat5)</option>
                  <option value="validdata">Valid Data (validdata)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jumlah Data (Limit)</label>
              <input type="number" min="10" max="50000" value={limit} onChange={e => setLimit(parseInt(e.target.value) || 1000)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-700 outline-none focus:ring-2 focus:ring-sky-500" />
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Data akan diambil secara Descendant (terbaru)</p>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-bold text-red-800">Koneksi Gagal</h4>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
          
          {successMsg && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-bold text-emerald-800">Berhasil Terhubung</h4>
                <p className="text-xs text-emerald-600 mt-1">{successMsg}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleConnect}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-[#1e293b] hover:bg-black text-white rounded-xl text-sm font-black tracking-widest uppercase transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <RotateCw className="animate-spin" size={18} /> : <Database size={18} />}
              {isLoading ? "Menghubungkan..." : "Hubungkan & Tarik Data"}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
