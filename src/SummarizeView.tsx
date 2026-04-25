import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Upload, Download, Map as MapIcon, X } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Tooltip as LeafletTooltip } from 'react-leaflet';

function BoundsUpdater({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds);
  }, [bounds, map]);
  return null;
}
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for icon issues with Leaflet in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ParsedSummaryData {
  stationName: string;
  latitude: number;
  longitude: number;
  stlTrend: number;
  msl: number;
  hat: number;
  lat: number;
  mhws: number;
  mlws: number;
  fileName: string;
}

export default function SummarizeView() {
  const [summaryData, setSummaryData] = useState<ParsedSummaryData[]>([]);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      if (percentage >= 15 && percentage <= 85) {
        setLeftWidth(percentage);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Disable text selection globally while dragging
    const oldSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = oldSelect;
    };
  }, [isDragging]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError('');
    
    let processedCount = 0;
    const newData: ParsedSummaryData[] = [];
    let parsingErrors: string[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const parsed = parseReportText(text, file.name);
          if (parsed) {
            newData.push(parsed);
          } else {
             parsingErrors.push(file.name);
          }
        } catch (err) {
          parsingErrors.push(file.name);
        }

        processedCount++;
        if (processedCount === files.length) {
          if (parsingErrors.length > 0) {
            setError(`Gagal memparsing beberapa file: ${parsingErrors.slice(0, 3).join(', ')}${parsingErrors.length > 3 ? '...' : ''}`);
          }
          setSummaryData(prev => {
             // Avoid duplicates by stationName or fileName? Just append for now, but maybe prevent duplicate file names.
             const existingNames = new Set(prev.map(p => p.fileName));
             const uniqueNewData = newData.filter(n => !existingNames.has(n.fileName));
             return [...prev, ...uniqueNewData];
          });
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    });
  };

  const parseReportText = (text: string, fileName: string): ParsedSummaryData | null => {
    const lines = text.split('\n');
    let stationName = 'Unknown';
    let latitude = 0;
    let longitude = 0;
    let stlTrend = 0;
    let msl = 0;
    let hat = 0;
    let lat = 0;
    let mhws = 0;
    let mlws = 0;

    // Helper to find value from line
    const extractVal = (line: string, index: number = 1) => {
      const parts = line.split('\t');
      return parts.length > index ? parts[index].trim() : '';
    };

    let inSeaLevelTrendSection = false;

    lines.forEach(line => {
      if (line.startsWith('Station Name')) {
        stationName = extractVal(line);
      } else if (line.startsWith('Latitude')) {
        latitude = parseFloat(extractVal(line)) || 0;
      } else if (line.startsWith('Longitude')) {
        longitude = parseFloat(extractVal(line)) || 0;
      } else if (line.startsWith('MSL (Mean Sea Level)')) {
        msl = parseFloat(extractVal(line)) || 0;
      } else if (line.startsWith('HAT (Highest Astronomical Tide)')) {
        hat = parseFloat(extractVal(line)) || 0;
      } else if (line.startsWith('MHWS (Mean High Water Springs)')) {
        mhws = parseFloat(extractVal(line)) || 0;
      } else if (line.startsWith('MLWS (Mean Low Water Springs)')) {
        mlws = parseFloat(extractVal(line)) || 0;
      } else if (line.startsWith('LAT (Lowest Astronomical Tide)')) {
        lat = parseFloat(extractVal(line)) || 0;
      } else if (line.includes('SEA LEVEL TREND')) {
        inSeaLevelTrendSection = true;
      } else if (line.includes('MODEL ACCURACIES') || line.includes('HARMONIC CONSTITUENTS')) {
        inSeaLevelTrendSection = false;
      } else if (inSeaLevelTrendSection && line.startsWith('STL Decomposition')) {
        stlTrend = parseFloat(extractVal(line)) || 0;
      }
    });

    if (stationName && (latitude !== 0 || longitude !== 0)) {
        return {
          stationName, latitude, longitude, stlTrend, msl, hat, lat, mhws, mlws, fileName
        };
    }
    return null;
  };

  const removeRow = (indexToRemove: number) => {
      setSummaryData(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const formatSummaryExport = (): string => {
    // Tab delimited header
    let content = 'Station Name\tLatitude\tLongitude\tSTL Trend (m/year)\tMSL (m)\tHAT (m)\tLAT (m)\tMHWS (m)\tMLWS (m)\n';
    
    summaryData.forEach(row => {
      content += `${row.stationName}\t${row.latitude}\t${row.longitude}\t${row.stlTrend}\t${row.msl}\t${row.hat}\t${row.lat}\t${row.mhws}\t${row.mlws}\n`;
    });
    return content;
  };

  const downloadSummaryTxt = () => {
    if (summaryData.length === 0) return;
    const content = formatSummaryExport();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tidal_Analysis_Summary.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Compute color for stlTrend
  const getColorForTrend = (trend: number) => {
    // Red for large positive (e.g. > 0.01), Blue for negative (< 0)
    // using a colormap from dark blue to red
    // let's define a basic colormap manually
    // Scale from -0.01 to 0.01
    const minTrend = -0.01;
    const maxTrend = +0.01;
    
    // Clamp
    let normalized = (trend - minTrend) / (maxTrend - minTrend);
    normalized = Math.max(0, Math.min(1, normalized));
    
    const r = Math.round(normalized * 255);
    const b = Math.round((1 - normalized) * 255);
    const g = Math.round(50 + (1 - Math.abs(normalized - 0.5) * 2) * 100);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const mapBounds = useMemo(() => {
    if (summaryData.length === 0) return [[-10, 95], [10, 140]] as L.LatLngBoundsExpression; // Default Indonesia loosely
    const lats = summaryData.map(d => d.latitude).filter(l => !isNaN(l));
    const lons = summaryData.map(d => d.longitude).filter(l => !isNaN(l));
    
    if (lats.length === 0) return [[-10, 95], [10, 140]] as L.LatLngBoundsExpression;
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    return [[minLat - 2, minLon - 2], [maxLat + 2, maxLon + 2]] as L.LatLngBoundsExpression;
  }, [summaryData]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="p-6 bg-white border-b border-slate-200">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <MapIcon className="text-sky-600" />
          Spatial Summary
        </h2>
        <p className="text-slate-500 mt-1">
          Silakan upload file(s) report hasil pengolahan anda (*.txt)
        </p>

        <div className="mt-6 flex flex-wrap gap-4 items-center">
            <input 
              type="file" 
              multiple 
              accept=".txt" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button
               onClick={() => fileInputRef.current?.click()}
               className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg font-bold text-sm hover:bg-sky-700 transition"
            >
               <Upload size={16} />
               Upload Reports (.txt)
            </button>

            {summaryData.length > 0 && (
                <button
                   onClick={downloadSummaryTxt}
                   className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition"
                >
                   <Download size={16} />
                   Download Summary (TXT)
                </button>
            )}
        </div>
        {error && <p className="text-rose-500 text-sm mt-3 font-semibold">{error}</p>}
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden flex flex-col xl:flex-row p-6 gap-6 xl:gap-0"
        style={{ 
          '--left-width': `${leftWidth}%`,
          cursor: isDragging ? 'col-resize' : 'default',
        } as React.CSSProperties}
      >
          {/* Table View */}
          <div className="w-full xl:w-[calc(var(--left-width)-12px)] flex-none bg-white border border-slate-200 rounded-xl flex flex-col h-[400px] xl:h-full overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-bold text-slate-700">Tabel Gabungan Data</h3>
              </div>
              <div className="flex-1 overflow-auto p-0">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-100 sticky top-0 z-10 text-slate-600">
                         <tr>
                             <th className="px-4 py-3 font-semibold border-b">Stasiun</th>
                             <th className="px-4 py-3 font-semibold border-b">Lat</th>
                             <th className="px-4 py-3 font-semibold border-b">Lon</th>
                             <th className="px-4 py-3 font-semibold border-b text-right">Trend (STL)</th>
                             <th className="px-4 py-3 font-semibold border-b text-right">MSL</th>
                             <th className="px-4 py-3 font-semibold border-b text-right">HAT</th>
                             <th className="px-4 py-3 font-semibold border-b text-right">LAT</th>
                             <th className="px-4 py-3 font-semibold border-b text-right">MHWS</th>
                             <th className="px-4 py-3 font-semibold border-b text-right">MLWS</th>
                             <th className="px-4 py-3 font-semibold border-b text-center">Aksi</th>
                         </tr>
                      </thead>
                      <tbody>
                          {summaryData.length === 0 ? (
                              <tr>
                                  <td colSpan={10} className="text-center py-12 text-slate-400">
                                      Belum ada data. Silakan upload file TXT Report.
                                  </td>
                              </tr>
                          ) : (
                              summaryData.map((row, idx) => (
                                  <tr key={idx} className="border-b last:border-0 hover:bg-sky-50">
                                      <td className="px-4 py-2 font-medium text-slate-800">{row.stationName}</td>
                                      <td className="px-4 py-2 text-slate-500">{row.latitude.toFixed(5)}</td>
                                      <td className="px-4 py-2 text-slate-500">{row.longitude.toFixed(5)}</td>
                                      <td className="px-4 py-2 text-right">
                                         <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${row.stlTrend > 0 ? 'bg-red-100 text-red-700' : row.stlTrend < 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {row.stlTrend.toFixed(5)}
                                         </span>
                                      </td>
                                      <td className="px-4 py-2 text-right text-slate-600">{row.msl.toFixed(3)}</td>
                                      <td className="px-4 py-2 text-right text-slate-600">{row.hat.toFixed(3)}</td>
                                      <td className="px-4 py-2 text-right text-slate-600">{row.lat.toFixed(3)}</td>
                                      <td className="px-4 py-2 text-right text-slate-600">{row.mhws.toFixed(3)}</td>
                                      <td className="px-4 py-2 text-right text-slate-600">{row.mlws.toFixed(3)}</td>
                                      <td className="px-4 py-2 text-center">
                                          <button 
                                            onClick={() => removeRow(idx)}
                                            className="text-rose-400 hover:text-rose-600 p-1"
                                            title="Hapus baris"
                                          >
                                              <X size={16} />
                                          </button>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* Resizer Handle */}
          <div 
            className="hidden xl:flex w-6 cursor-col-resize items-center justify-center group shrink-0"
            onMouseDown={handleMouseDown}
          >
            <div className={`w-1 h-12 rounded-full transition-colors ${isDragging ? 'bg-sky-500' : 'bg-slate-200 group-hover:bg-sky-400'}`} />
          </div>

          {/* Map View */}
          <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[400px]">
             <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">Peta Sebaran Sea Level Trend</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                     <span>Trend:</span>
                     <div className="w-4 h-4 rounded-full" style={{ background: getColorForTrend(-0.01) }}></div> -
                     <div className="w-4 h-4 rounded-full" style={{ background: getColorForTrend(0) }}></div> 0
                     <div className="w-4 h-4 rounded-full" style={{ background: getColorForTrend(0.01) }}></div> +
                  </div>
              </div>
              <div className="flex-1 relative bg-slate-100 min-h-[400px]">
                  <MapContainer 
                    bounds={mapBounds} 
                    style={{ height: "100%", width: "100%", zIndex: 0 }}
                    key="shared-map"
                  >
                      <BoundsUpdater bounds={mapBounds} />
                      <TileLayer
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                      />
                      {summaryData.map((row, idx) => {
                          const color = getColorForTrend(row.stlTrend);
                          return (
                            <CircleMarker 
                                key={idx} 
                                center={[row.latitude, row.longitude]} 
                                radius={8}
                                pathOptions={{
                                    color: '#ffffff',
                                    weight: 2,
                                    fillColor: color,
                                    fillOpacity: 0.8
                                }}
                            >
                                <Popup>
                                    <div className="text-sm font-sans">
                                        <div className="font-bold text-slate-800 mb-1">{row.stationName}</div>
                                        <div className="text-slate-600 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                                            <span>Lat:</span> <span>{row.latitude.toFixed(5)}</span>
                                            <span>Lon:</span> <span>{row.longitude.toFixed(5)}</span>
                                            <span className="font-medium text-slate-800 mt-1">STL Trend:</span> 
                                            <span className="font-medium text-slate-800 mt-1">{row.stlTrend.toFixed(5)} m/yr</span>
                                        </div>
                                    </div>
                                </Popup>
                                <LeafletTooltip>{row.stationName}</LeafletTooltip>
                            </CircleMarker>
                          );
                      })}
                  </MapContainer>
              </div>
          </div>
      </div>
    </div>
  );
}
