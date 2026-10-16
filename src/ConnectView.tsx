import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle2, RotateCw, Table as TableIcon, Calendar, MapPin, Download, ChevronDown, Search, Server, Radio, Wrench, AlertTriangle, ShieldCheck, Terminal, Copy, Check, Sparkles, PlusCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subHours, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import { registerDbStations, getAllStations, syncStationListFromDb, findStationByNameOrId } from './tideStations';

export default function ConnectView({ 
  onDataLoaded, 
  onStationMetaLoaded,
  onConnectionChange
}: { 
  onDataLoaded: (data: any[], selectedSensorName?: string) => void, 
  onStationMetaLoaded: (name: string, lat: string, lon: string) => void,
  onConnectionChange?: (isConnected: boolean, creds: { host: string, port: string, user: string, database: string, password?: string }) => void
}) {
  const [host, setHost] = useState('10.10.140.19');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('bako');
  
  const [selectedTable, setSelectedTable] = useState('data_vsat5');
  const [stationQuery, setStationQuery] = useState('');
  const [stationSearch, setStationSearch] = useState('');
  const [isStationDropdownOpen, setIsStationDropdownOpen] = useState(false);
  const [stations, setStations] = useState<{id: string, name: string}[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [connStatus, setConnStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [timePresetMenuPos, setTimePresetMenuPos] = useState<{ x: number, y: number } | null>(null);

  // Table Repair & Maintenance States
  const [isRepairing, setIsRepairing] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [isCrashedError, setIsCrashedError] = useState(false);
  const [tableNotFound, setTableNotFound] = useState(false);
  const [repairReport, setRepairReport] = useState<{ message: string, details?: any } | null>(null);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const isLocalhostApp = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '0.0.0.0');

  const isPrivateHost = (h: string) => {
    if (!h) return false;
    const trimmed = h.trim().toLowerCase();
    return trimmed === 'localhost' || trimmed === '127.0.0.1' || trimmed === '::1' ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(trimmed) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(trimmed);
  };

  // Load saved credentials & initial stations on mount
  useEffect(() => {
    const initialList = getAllStations();
    if (initialList.length > 0) {
      setStations(initialList.map(s => ({ id: s.id, name: s.name })));
    }

    // Lakukan sync latar belakang jika ada kredensial tersimpan
    syncStationListFromDb().then(updated => {
      if (updated && updated.length > 0) {
        setStations(updated.map(s => ({ id: s.id, name: s.name })));
      }
    });

    const handleStationsUpdated = () => {
      const updated = getAllStations();
      setStations(updated.map(s => ({ id: s.id, name: s.name })));
    };
    window.addEventListener('tide_stations_updated', handleStationsUpdated);

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

    return () => {
      window.removeEventListener('tide_stations_updated', handleStationsUpdated);
    };
  }, []);

  useEffect(() => {
      const handleClickOutside = () => setTimePresetMenuPos(null);
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleTimeContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      
      const menuWidth = 192; // 48 * 4 (w-48)
      const menuHeight = 360; // Approximate height of the menu
      
      let x = e.clientX;
      let y = e.clientY;
      
      if (x + menuWidth > window.innerWidth) {
          x = window.innerWidth - menuWidth - 10;
      }
      
      if (y + menuHeight > window.innerHeight) {
          y = window.innerHeight - menuHeight - 10;
      }
      
      setTimePresetMenuPos({ x, y });
  };

  const applyTimePreset = (preset: string) => {
      const now = new Date();
      let start: Date | null = null;
      let end: Date | null = now;

      try {
          switch(preset) {
              case '24h':
                  start = subHours(now, 24);
                  break;
              case '1w':
                  start = subDays(now, 7);
                  break;
              case '1m':
                  start = subMonths(now, 1);
                  break;
              case 'today':
                  start = startOfDay(now);
                  end = endOfDay(now);
                  break;
              case 'this_week':
                  start = startOfWeek(now, { weekStartsOn: 1 });
                  end = endOfWeek(now, { weekStartsOn: 1 });
                  break;
              case 'this_month':
                  start = startOfMonth(now);
                  end = endOfMonth(now);
                  break;
              case 'this_year':
                  start = startOfYear(now);
                  end = endOfYear(now);
                  break;
              case 'specific_day': {
                  const input = prompt("Masukkan tanggal (YYYY-MM-DD):", format(now, 'yyyy-MM-dd'));
                  if (!input) return;
                  const d = new Date(input + "T00:00:00");
                  if (!isNaN(d.getTime())) {
                      start = startOfDay(d);
                      end = endOfDay(d);
                  }
                  break;
              }
              case 'specific_month': {
                  const input = prompt("Masukkan bulan (YYYY-MM):", format(now, 'yyyy-MM'));
                  if (!input) return;
                  const [y, m] = input.split('-');
                  const d = new Date(Number(y), Number(m) - 1, 1);
                  if (!isNaN(d.getTime())) {
                      start = startOfMonth(d);
                      end = endOfMonth(d);
                  }
                  break;
              }
              case 'specific_year': {
                  const input = prompt("Masukkan tahun (YYYY):", format(now, 'yyyy'));
                  if (!input) return;
                  const d = new Date(Number(input), 0, 1);
                  if (!isNaN(d.getTime())) {
                      start = startOfYear(d);
                      end = endOfYear(d);
                  }
                  break;
              }
              default: return;
          }
          
          if (start && end) {
              setStartDate(format(start, "yyyy-MM-dd'T'HH:mm"));
              setEndDate(format(end, "yyyy-MM-dd'T'HH:mm"));
          }
      } catch (err) {
          console.warn("Invalid preset selection");
      }
      setTimePresetMenuPos(null);
  };

  const saveCredentials = () => {
    localStorage.setItem('tide_db_credentials', JSON.stringify({ host, port, user, password, database }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnStatus('idle');
    setError('');
    saveCredentials();

    try {
      const res = await fetch('/api/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, user, password, database })
      });
      const data = await res.json();
      if (data.success) {
        setConnStatus('success');
        setError('');
        localStorage.setItem('tide_db_connected', 'true');
        onConnectionChange?.(true, { host, port, user, database, password });
        
        try {
          const stationRes = await fetch('/api/db/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host, port, user, password, database, table: 'stationlist', limit: 1000 })
          });
          const stationData = await stationRes.json();
          if (stationData.success && Array.isArray(stationData.data)) {
            registerDbStations(stationData.data);
            const updated = getAllStations();
            setStations(updated.map((s: any) => ({ id: s.id, name: s.name })));
          }
        } catch (e) {
          console.warn("Could not fetch station list:", e);
        }
      } else {
        setConnStatus('error');
        setError(data.error || 'Gagal terhubung ke database.');
      }
    } catch (e: any) {
      setConnStatus('error');
      setError(e.message || 'Gagal menghubungi server.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleFetchData = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    saveCredentials();

    let formattedStart = undefined;
    let formattedEnd = undefined;

    if (startDate) {
        formattedStart = format(new Date(startDate), 'yyyy-MM-dd HH:mm:ss');
    }
    if (endDate) {
        const endD = new Date(endDate);
        formattedEnd = format(endD, 'yyyy-MM-dd HH:mm:ss');
    }

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
        if (stationData.success && Array.isArray(stationData.data)) {
          stationData.data.forEach((st: any) => {
            const stId = st.StationID || st.StationId || st.stationid || st.id;
            if (stId) {
              stationMap[stId] = st;
            }
          });
          registerDbStations(stationData.data);
          const updated = getAllStations();
          setStations(updated.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (e) {
        console.warn("Could not fetch station list:", e);
      }

      // Then fetch actual data
      const res = await fetch('/api/db/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            host, port, user, password, database, 
            table: selectedTable,
            station: stationQuery,
            startDate: formattedStart,
            endDate: formattedEnd
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('tide_db_connected', 'true');
        onConnectionChange?.(true, { host, port, user, database, password });
        setIsCrashedError(false);
        setTableNotFound(false);

        if (!data.data || data.data.length === 0) {
          setError(`Tabel '${selectedTable}' kosong atau tidak ditemukan baris data yang cocok dengan filter yang dipilih.`);
          setIsLoading(false);
          return;
        }
        
        let stationIdFound = "";
        
        // Map database result to format expected by App.tsx
        // App.tsx expects objects like { Timestamp: 'yyyy-MM-dd HH:mm:ss', Sensor1: value, Sensor2: value, Intp: value, ... }
        const mappedData = data.data.map((row: any) => {
          const newRow: any = {};
          
          if (row.StationID) stationIdFound = row.StationID;
          if (row.StationId) stationIdFound = row.StationId; // Case variation in ValidData table
          
          // Map TimeStamp, format precisely to 'yyyy-MM-dd HH:mm:ss' to make it bulletproof
          let rawTs = row.TimeStamp || row.Timestamp;
          if (rawTs) {
             let tsStr = "";
             if (rawTs instanceof Date) {
                 tsStr = format(rawTs, 'yyyy-MM-dd HH:mm:ss');
             } else {
                 tsStr = String(rawTs);
             }
             newRow['Timestamp'] = tsStr;
          }
          
          // Map Intp and combination if present in validdata / validdata2
          if (row.Intp !== undefined && row.Intp !== null) {
             newRow['Intp'] = row.Intp;
          } else if (row.Interpolation !== undefined && row.Interpolation !== null && selectedTable !== 'data_vsat5') {
             newRow['Intp'] = row.Interpolation;
          }
          
          if (row.combination !== undefined && row.combination !== null) {
             newRow['combination'] = row.combination;
          }

          // Determine generic sensor columns from row keys. Exclude metadata columns
          const excludeKeys = ['RecId', 'StationID', 'StationId', 'TimeStamp', 'Timestamp', 'CreateData', 'CreateBy', 'Last_Update', 'UpdateBy', 'Prediction', 'Source', 'Operator', 'Remark', 'Interpolation', 'combination', 'Intp'];
          
          Object.keys(row).forEach(k => {
             if (!excludeKeys.includes(k) && !k.startsWith('ErCd')) {
                 newRow[k] = row[k];
             }
          });
          
          return newRow;
        });

        // Ensure sorted chronologically (DB usually descendant for LIMIT if we want latest, but script expects chronological)
        mappedData.sort((a: any, b: any) => {
            const tsA = typeof a.Timestamp === 'string' ? a.Timestamp : String(a.Timestamp || '');
            const tsB = typeof b.Timestamp === 'string' ? b.Timestamp : String(b.Timestamp || '');
            return tsA < tsB ? -1 : (tsA > tsB ? 1 : 0);
        });

        // Call station meta loader if we found a station ID and mapping
        if (stationIdFound) {
            if (stationMap[stationIdFound]) {
                const st = stationMap[stationIdFound];
                onStationMetaLoaded(st.StationName || stationIdFound, (st.Latitude || "").toString(), (st.Longitude || "").toString());
            } else {
                const found = findStationByNameOrId(stationIdFound);
                if (found) {
                    onStationMetaLoaded(found.name, found.lat.toString(), found.lon.toString());
                }
            }
        }

        const tableNames: Record<string, string> = {
          data_vsat5: 'Raw Data (data_vsat5)',
          validdata: 'Valid Data (validdata)',
          validdata2: 'Valid Data 2 (validdata2)'
        };
        const currentTableLabel = tableNames[selectedTable] || selectedTable;

        if (data.autoRepaired) {
          setSuccessMsg(data.repairNotice || `Tabel ${currentTableLabel} otomatis diperbaiki dan berhasil memuat ${mappedData.length} baris data!`);
        } else {
          setSuccessMsg(`Berhasil memuat ${mappedData.length} baris dari tabel ${currentTableLabel}`);
        }
        
        // Find default sensor Name (usually Sensor1, or Intp, or combination)
        const sampleRow = mappedData[0] || {};
        const sensorColumns = Object.keys(sampleRow).filter(k => k !== 'Timestamp');
        
        let preferredSensor = '';
        if (sensorColumns.includes('Sensor1') && mappedData.some((r: any) => r.Sensor1 != null && r.Sensor1 !== '')) {
          preferredSensor = 'Sensor1';
        } else if (sensorColumns.includes('Intp') && mappedData.some((r: any) => r.Intp != null && r.Intp !== '')) {
          preferredSensor = 'Intp';
        } else if (sensorColumns.includes('combination') && mappedData.some((r: any) => r.combination != null && r.combination !== '')) {
          preferredSensor = 'combination';
        } else {
          preferredSensor = sensorColumns.find((c: any) => mappedData.some((r: any) => r[c] != null && r[c] !== '')) || sensorColumns[0] || 'Sensor1';
        }
        
        setTimeout(() => {
            onDataLoaded(mappedData, preferredSensor);
        }, 1500);

      } else {
        const errMsg = data.error || 'Gagal terhubung ke database.';
        setError(errMsg);
        if (data.isCrashedTable || errMsg.toLowerCase().includes('marked as crashed') || errMsg.toLowerCase().includes('should be repaired')) {
          setIsCrashedError(true);
        }
        if (data.tableNotFound || data.code === 'ER_NO_SUCH_TABLE') {
          setTableNotFound(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepairTable = async (tableToRepair = selectedTable, mode = 'extended') => {
    setIsRepairing(true);
    setRepairReport(null);
    setError('');
    saveCredentials();

    try {
      const res = await fetch('/api/db/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port,
          user,
          password,
          database,
          table: tableToRepair,
          mode
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsCrashedError(false);
        setRepairReport({
          message: data.message || `Perbaikan tabel ${tableToRepair} selesai.`,
          details: data.repairResult
        });
        setSuccessMsg(`Tabel '${tableToRepair}' berhasil diperbaiki. Mengambil ulang data...`);
        // Otomatis tarik data kembali
        setTimeout(() => {
          handleFetchData();
        }, 1200);
      } else {
        setError(data.error || `Gagal memperbaiki tabel ${tableToRepair}.`);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim permintaan perbaikan tabel.');
    } finally {
      setIsRepairing(false);
    }
  };

  const handleCreateTable = async (targetTable = selectedTable) => {
    setIsCreatingTable(true);
    setError('');
    saveCredentials();

    try {
      const res = await fetch('/api/db/create-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port,
          user,
          password,
          database,
          table: targetTable
        })
      });

      const data = await res.json();
      if (data.success) {
        setTableNotFound(false);
        setSuccessMsg(data.message || `Tabel '${targetTable}' berhasil dibuat di basis data ${database || 'bako'}.`);
        setTimeout(() => {
          handleFetchData();
        }, 800);
      } else {
        setError(data.error || `Gagal membuat tabel ${targetTable}.`);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim perintah pembuatan tabel.');
    } finally {
      setIsCreatingTable(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
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
            <p className="text-slate-500 font-medium">Hubungkan aplikasi ke database MySQL lokal atau cloud untuk menarik data pasang surut.</p>
          </div>
        </div>

        {/* Credentials Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Server size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Credentials & Server</h2>
                <p className="text-xs text-slate-500 font-medium">Pengaturan alamat host dan port koneksi MySQL</p>
              </div>
            </div>
            {connStatus === 'success' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Terhubung
              </span>
            )}
            {connStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200/80 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Gagal
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Alamat Host
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={host} 
                  onChange={e => setHost(e.target.value)} 
                  placeholder="e.g. 10.10.140.19 atau localhost atau domain.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-700 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400" 
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Port
              </label>
              <input 
                type="text" 
                value={port} 
                onChange={e => setPort(e.target.value)} 
                placeholder="3306"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-700 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all text-center sm:text-left placeholder:text-slate-400" 
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Nama Database
              </label>
              <input 
                type="text" 
                value={database} 
                onChange={e => setDatabase(e.target.value)} 
                placeholder="bako"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-700 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400" 
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                User MySQL
              </label>
              <input 
                type="text" 
                value={user} 
                onChange={e => setUser(e.target.value)} 
                placeholder="root"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-700 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400" 
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-700 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400" 
              />
            </div>
          </div>

          {isLocalhostApp ? (
            <div className="mt-4 p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                <div>
                  <span className="font-bold text-slate-800">Mode Server Lokal (Localhost):</span>{' '}
                  <span className="text-slate-600">Aplikasi berjalan pada server lokal. Koneksi langsung ke database MySQL pada mesin ini didukung penuh.</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setHost('localhost')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition border ${host === 'localhost' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white hover:bg-sky-100 text-sky-700 border-sky-200'}`}
                >
                  localhost
                </button>
                <button
                  type="button"
                  onClick={() => setHost('127.0.0.1')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition border ${host === '127.0.0.1' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white hover:bg-sky-100 text-sky-700 border-sky-200'}`}
                >
                  127.0.0.1
                </button>
                <button
                  type="button"
                  onClick={() => setHost('10.10.140.19')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition border ${host === '10.10.140.19' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white hover:bg-sky-100 text-sky-700 border-sky-200'}`}
                >
                  10.10.140.19
                </button>
              </div>
            </div>
          ) : isPrivateHost(host) && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-800 text-xs flex items-start gap-3">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <div className="font-bold text-amber-900">Alamat IP Jaringan Lokal/Privat Terdeteksi ({host})</div>
                <p className="text-amber-800 leading-relaxed">
                  Aplikasi ini berjalan di container cloud (Google Cloud Run) dan tidak dapat terhubung langsung ke IP privat/intranet lokal (10.x.x.x / 192.168.x.x / 127.0.0.1) tanpa tunnel jaringan.
                </p>
                <div className="pt-1 text-amber-900 font-medium">
                  <strong>Opsi Menghubungkan:</strong>
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-amber-800">
                    <li>Jalankan aplikasi di komputer lokal Anda menggunakan <code>Start-Tide-Tools.bat</code> atau <code>npm run dev</code> untuk terhubung langsung ke localhost.</li>
                    <li>Gunakan tunnel seperti <strong>ngrok</strong> di server lokal Anda (contoh: <code>ngrok tcp 3306</code>) lalu masukkan host & port ngrok di atas.</li>
                    <li>Gunakan IP Publik / domain server yang port 3306-nya telah di-forward / dibuka di firewall.</li>
                    <li>Atau unggah data langsung via menu <strong>Import CSV</strong> untuk analisis instan tanpa perlu koneksi database langsung.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {connStatus === 'error' && error && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div>
                <div className="font-bold text-red-900">Koneksi Database Gagal</div>
                <p className="text-red-700 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {connStatus === 'success' && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
              <div>
                <div className="font-bold text-emerald-900">Koneksi Database Berhasil</div>
                <p className="text-emerald-700 mt-0.5">Terhubung ke database {database || 'MySQL'} di {host}:{port}. Silakan pilih tabel dan stasiun di bawah untuk menarik data.</p>
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button 
              onClick={handleTestConnection}
              disabled={isTesting}
              className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm ${
                connStatus === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                connStatus === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                'bg-sky-600 hover:bg-sky-700 text-white'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isTesting ? <RotateCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              {isTesting ? 'Menguji Koneksi...' : connStatus === 'success' ? 'Koneksi Terverifikasi (Uji Lagi)' : connStatus === 'error' ? 'Coba Hubungkan Ulang' : 'Uji & Simpan Koneksi'}
            </button>
          </div>
        </div>

        {/* Query Target Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Query to Database</h2>
            <button
              type="button"
              onClick={() => setShowToolsPanel(!showToolsPanel)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition"
              title="Periksa atau perbaiki tabel MyISAM (REPAIR TABLE)"
            >
              <Wrench size={13} />
              <span>{showToolsPanel ? 'Sembunyikan Menu Perbaikan' : 'Pemeliharaan / Perbaiki Tabel'}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Tabel Data</label>
              <div className="relative">
                <TableIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={selectedTable} 
                  onChange={e => {
                    setSelectedTable(e.target.value);
                    setError('');
                    setIsCrashedError(false);
                    setTableNotFound(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer"
                >
                  <option value="data_vsat5">Raw Data (data_vsat5)</option>
                  <option value="validdata">Valid Data (validdata)</option>
                  <option value="validdata2">Valid Data 2 (validdata2)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 relative">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter Nama/ID Stasiun <span className="text-slate-400 font-normal lowercase tracking-normal">(Opsional)</span></label>
              
              <div 
                className="relative cursor-pointer" 
                onClick={() => setIsStationDropdownOpen(!isStationDropdownOpen)}
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 flex items-center h-full">
                   <MapPin size={16} />
                </div>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-700 min-h-[42px] flex items-center">
                   {stationQuery ? stations.find(s => s.id === stationQuery)?.name || stationQuery : "Semua Stasiun"}
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 flex items-center h-full pointer-events-none">
                   <ChevronDown size={16} />
                </div>
              </div>

              {isStationDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                   <div className="p-2 border-b border-slate-100 bg-slate-50 relative">
                     <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                       type="text" 
                       autoFocus
                       className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 pl-8 text-sm outline-none focus:ring-2 focus:ring-sky-500" 
                       placeholder="Cari stasiun..."
                       value={stationSearch}
                       onChange={e => setStationSearch(e.target.value)}
                       onClick={e => e.stopPropagation()}
                     />
                   </div>
                   <div className="max-h-60 overflow-y-auto">
                     <div 
                       className={`px-3 py-2 text-sm cursor-pointer hover:bg-sky-50 ${!stationQuery ? 'bg-sky-50 font-bold text-sky-700' : 'text-slate-700'}`}
                       onClick={() => { setStationQuery(''); setIsStationDropdownOpen(false); setStationSearch(''); }}
                     >
                        Semua Stasiun
                     </div>
                     {stations.filter(s => s.name.toLowerCase().includes(stationSearch.toLowerCase()) || s.id.toLowerCase().includes(stationSearch.toLowerCase())).map(st => (
                       <div 
                         key={st.id} 
                         className={`px-3 py-2 text-sm cursor-pointer hover:bg-sky-50 ${stationQuery === st.id ? 'bg-sky-50 font-bold text-sky-700' : 'text-slate-700'}`}
                         onClick={() => { 
  setStationQuery(st.id); 
  setIsStationDropdownOpen(false); 
  setStationSearch(""); 
  const found = findStationByNameOrId(st.id) || findStationByNameOrId(st.name);
  if (found) {
    onStationMetaLoaded(found.name, found.lat.toString(), found.lon.toString());
  } else {
    onStationMetaLoaded(st.name, "", "");
  }
}}
                       >
                         {st.name} <span className="text-slate-400 text-xs ml-1">({st.id})</span>
                       </div>
                     ))}
                     {stations.filter(s => s.name.toLowerCase().includes(stationSearch.toLowerCase()) || s.id.toLowerCase().includes(stationSearch.toLowerCase())).length === 0 && (
                       <div className="px-3 py-4 text-sm text-center text-slate-500 italic">
                         Stasiun tidak ditemukan. Pastikan Anda telah melakukan Test Connection.
                       </div>
                     )}
                   </div>
                </div>
              )}
            </div>

            <div className="md:col-span-1" onContextMenu={handleTimeContextMenu}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mulai Tanggal <span className="text-slate-400 font-normal lowercase tracking-normal">(Opsional)</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>

            <div className="md:col-span-1" onContextMenu={handleTimeContextMenu}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sampai Tanggal <span className="text-slate-400 font-normal lowercase tracking-normal">(Opsional)</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>

          </div>

          {/* Table Not Found (ER_NO_SUCH_TABLE) Box */}
          {tableNotFound && (
            <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={18} />
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Tabel '{selectedTable}' Belum Ada di Database</h4>
                    <p className="text-amber-800 mt-0.5">
                      Tabel <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">{selectedTable}</code> belum ada dalam skema basis data <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">{database || 'bako'}</code>.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isCreatingTable}
                      onClick={() => handleCreateTable(selectedTable)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
                    >
                      {isCreatingTable ? <RotateCw className="animate-spin" size={14} /> : <PlusCircle size={14} />}
                      {isCreatingTable ? 'Sedang Membuat Tabel...' : `Buat Tabel '${selectedTable}' Sekarang (Auto-Create)`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Crashed Table / Repair Tools Panel */}
          {(isCrashedError || showToolsPanel) && (
            <div className={`mt-5 p-4 rounded-xl border text-xs ${isCrashedError ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
              <div className="flex items-start gap-3">
                <Wrench className={`${isCrashedError ? 'text-rose-600' : 'text-sky-600'} mt-0.5 shrink-0`} size={20} />
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold ${isCrashedError ? 'text-rose-900' : 'text-slate-900'}`}>
                        {isCrashedError ? `Peringatan: Tabel '${selectedTable}' Ditandai Crashed / Corrupt` : `Alat Perbaikan Tabel MyISAM (${selectedTable})`}
                      </h4>
                      {isCrashedError && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">
                          Error 145 / Crashed
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 leading-relaxed ${isCrashedError ? 'text-rose-800' : 'text-slate-600'}`}>
                      Pada MySQL MyISAM, jika komputer atau layanan MySQL berhenti mendadak saat operasi tulis berlangsung, berkas indeks (<code className="font-mono font-bold">.MYI</code>) dapat mengalami korupsi dan MySQL memunculkan pesan <em className="font-serif">"Table is marked as crashed and should be repaired"</em>. Jalankan perintah perbaikan di bawah untuk memperbaiki tabel secara otomatis:
                    </p>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isRepairing}
                      onClick={() => handleRepairTable(selectedTable, 'extended')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
                    >
                      {isRepairing ? <RotateCw className="animate-spin" size={14} /> : <Wrench size={14} />}
                      {isRepairing ? 'Sedang Memperbaiki...' : `Perbaiki '${selectedTable}' Sekarang (REPAIR TABLE EXTENDED)`}
                    </button>

                    <button
                      type="button"
                      disabled={isRepairing}
                      onClick={() => handleRepairTable(selectedTable, 'quick')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      Perbaikan Cepat (QUICK)
                    </button>

                    <button
                      type="button"
                      disabled={isRepairing}
                      onClick={() => handleRepairTable(selectedTable, 'use_frm')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition disabled:opacity-50"
                      title="Gunakan berkas format .frm jika header index rusak parah"
                    >
                      Gunakan Header .frm (USE_FRM)
                    </button>
                  </div>

                  {/* Repair Output Message if available */}
                  {repairReport && (
                    <div className="p-3 bg-white border border-emerald-200 rounded-lg text-emerald-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span>{repairReport.message}</span>
                      </div>
                      {Array.isArray(repairReport.details) && repairReport.details.length > 0 && (
                        <div className="font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 mt-1">
                          {repairReport.details.map((d: any, idx: number) => (
                            <div key={idx}>
                              {d.Table} &bull; {d.Op} &bull; {d.Msg_type}: <span className="font-bold text-emerald-700">{d.Msg_text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Commands Accordion for Localhost/Windows/XAMPP */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Terminal size={13} />
                      <span>Atau Jalankan Manual di Localhost / XAMPP:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      {/* Option A: SQL Query */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-slate-700 block mb-1">Via phpMyAdmin / HeidiSQL / MySQL Console:</span>
                          <code className="block font-mono bg-slate-100 text-slate-800 p-1.5 rounded select-all text-[10.5px]">
                            USE {database || 'bako'};<br />
                            REPAIR TABLE {selectedTable} EXTENDED;
                          </code>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`USE ${database || 'bako'};\nREPAIR TABLE ${selectedTable} EXTENDED;`, 'sql')}
                          className="mt-2 text-[10px] font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 self-end"
                        >
                          {copiedCmd === 'sql' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          {copiedCmd === 'sql' ? 'Tersalin' : 'Salin Perintah SQL'}
                        </button>
                      </div>

                      {/* Option B: Windows Command Prompt (myisamchk) */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-slate-700 block mb-1">Via Windows Command Prompt (myisamchk):</span>
                          <code className="block font-mono bg-slate-100 text-slate-800 p-1.5 rounded select-all text-[10.5px]">
                            myisamchk -r -v "C:\xampp\mysql\data\{database || 'bako'}\{selectedTable}.MYI"
                          </code>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`myisamchk -r -v "C:\\xampp\\mysql\\data\\${database || 'bako'}\\${selectedTable}.MYI"`, 'cli')}
                          className="mt-2 text-[10px] font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 self-end"
                        >
                          {copiedCmd === 'cli' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          {copiedCmd === 'cli' ? 'Tersalin' : 'Salin Perintah CLI'}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
          
          {error && !isCrashedError && !tableNotFound && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
              <div>
                <h4 className="text-sm font-bold text-red-800">Gagal Mengambil Data</h4>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
          
          {successMsg && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={18} />
              <div>
                <h4 className="text-sm font-bold text-emerald-800">Berhasil Ditarik</h4>
                <p className="text-xs text-emerald-600 mt-1">{successMsg}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            {isCrashedError && (
              <button
                type="button"
                disabled={isRepairing}
                onClick={() => handleRepairTable(selectedTable, 'extended')}
                className="flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold tracking-wide transition-colors shadow-md disabled:opacity-70"
              >
                {isRepairing ? <RotateCw className="animate-spin" size={18} /> : <Wrench size={18} />}
                {isRepairing ? "Memperbaiki..." : `Perbaiki ${selectedTable}`}
              </button>
            )}
            <button 
              onClick={handleFetchData}
              disabled={isLoading || isRepairing}
              className="flex items-center gap-2 px-6 py-3 bg-[#1e293b] hover:bg-black text-white rounded-xl text-sm font-black tracking-widest uppercase transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <RotateCw className="animate-spin" size={18} /> : <Download size={18} />}
              {isLoading ? "Mengambil Data..." : "Import Data"}
            </button>
          </div>
          
        </div>
      </div>
      
      {/* Context Menu for Time Preset */}
      {timePresetMenuPos && (
          <div 
            className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-xl w-48 text-sm overflow-hidden flex flex-col"
            style={{ top: timePresetMenuPos.y, left: timePresetMenuPos.x }}
            onClick={e => e.stopPropagation()}
          >
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 font-bold text-slate-500 text-xs tracking-widest uppercase flex items-center justify-center">
                  Pilih Waktu
              </div>
              <div className="py-1">
                  <button className="w-full text-left px-4 py-1.5 hover:bg-sky-50 text-slate-700 transition" onClick={() => applyTimePreset('24h')}>24 jam terakhir</button>
                  <button className="w-full text-left px-4 py-1.5 hover:bg-sky-50 text-slate-700 transition" onClick={() => applyTimePreset('1w')}>1 minggu terakhir</button>
                  <button className="w-full text-left px-4 py-1.5 hover:bg-sky-50 text-slate-700 transition" onClick={() => applyTimePreset('1m')}>1 Bulan terakhir</button>
              </div>
              <div className="border-t border-slate-100 py-1">
                  <button className="w-full text-left px-4 py-1.5 hover:bg-sky-50 text-slate-700 transition" onClick={() => applyTimePreset('today')}>Hari ini</button>
                  <button className="w-full text-left px-4 py-1.5 hover:bg-sky-50 text-slate-700 transition" onClick={() => applyTimePreset('this_week')}>Pekan ini</button>
                  <button className="w-full text-left px-4 py-1.5 hover:bg-sky-50 text-slate-700 transition" onClick={() => applyTimePreset('this_month')}>Bulan ini</button>
                  <button className="w-full text-left px-4 py-1.5 hover:bg-sky-50 text-slate-700 transition" onClick={() => applyTimePreset('this_year')}>Tahun ini</button>
              </div>
              <div className="border-t border-slate-100 py-1">
                  <button className="w-full text-left px-4 py-1.5 hover:bg-sky-50 text-slate-700 transition" onClick={() => applyTimePreset('specific_day')}>Satu Hari Tertentu</button>
                  <button className="w-full text-left px-4 py-1.5 hover:bg-sky-50 text-slate-700 transition" onClick={() => applyTimePreset('specific_month')}>Satu Bulan Tertentu</button>
                  <button className="w-full text-left px-4 py-1.5 hover:bg-sky-50 text-slate-700 transition" onClick={() => applyTimePreset('specific_year')}>Satu Tahun Tertentu</button>
              </div>
          </div>
      )}
    </div>
  );
}
