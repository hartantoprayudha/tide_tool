import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Upload, Download, Map as MapIcon, X, Menu } from 'lucide-react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat, transformExtent } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';

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

  const [isTableVisible, setIsTableVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

  const [hoveredStation, setHoveredStation] = useState<ParsedSummaryData | null>(null);
  const [selectedStation, setSelectedStation] = useState<ParsedSummaryData | null>(null);

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
    let finalTrend = 0;
    let msl = 0;
    let hat = 0;
    let lat = 0;
    let mhws = 0;
    let mlws = 0;

    let hasSsa = false;
    let ssaTrend = 0;
    let hasLinear = false;
    let linearTrend = 0;
    let stlTrend = 0; // fallback

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
      } else if (inSeaLevelTrendSection) {
        if (line.startsWith('STL Decomposition')) {
          stlTrend = parseFloat(extractVal(line)) || 0;
        } else if (line.startsWith('Iterative SSA')) {
          hasSsa = true;
          ssaTrend = parseFloat(extractVal(line)) || 0;
        } else if (line.startsWith('Linear Regression')) {
          hasLinear = true;
          linearTrend = parseFloat(extractVal(line)) || 0;
        }
      }
    });

    if (hasSsa) {
      finalTrend = ssaTrend;
    } else if (hasLinear) {
      finalTrend = linearTrend;
    } else {
      finalTrend = stlTrend;
    }

    if (stationName !== 'Unknown' || latitude !== 0 || longitude !== 0 || msl !== 0 || hat !== 0 || finalTrend !== 0 || text.includes('Tide Analysis Report')) {
        return {
          stationName, latitude, longitude, stlTrend: finalTrend, msl, hat, lat, mhws, mlws, fileName
        };
    }
    return null;
  };

  const removeRow = (indexToRemove: number) => {
      setSummaryData(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const formatSummaryExport = (): string => {
    let content = 'Station Name\tLatitude\tLongitude\tTrend (m/year)\tMSL (m)\tHAT (m)\tLAT (m)\tMHWS (m)\tMLWS (m)\n';
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

  const trendStats = useMemo(() => {
    if (summaryData.length === 0) return { min: -0.01, max: 0.01 };
    const trends = summaryData.map(d => d.stlTrend);
    let min = Math.min(...trends);
    let max = Math.max(...trends);
    if (min === max) {
        min -= 0.001;
        max += 0.001;
    }
    return { min, max };
  }, [summaryData]);

  const mapExtent = useMemo(() => {
    if (summaryData.length === 0) return { center: [-2.5, 118] as [number, number], minLat: -11, maxLat: 6, minLon: 95, maxLon: 141 };
    const lats = summaryData.map(d => d.latitude).filter(l => !isNaN(l));
    const lons = summaryData.map(d => d.longitude).filter(l => !isNaN(l));
    
    if (lats.length === 0) return { center: [-2.5, 118] as [number, number], minLat: -11, maxLat: 6, minLon: 95, maxLon: 141 };
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    return { center: [(minLat + maxLat) / 2, (minLon + maxLon) / 2] as [number, number], minLat, maxLat, minLon, maxLon };
  }, [summaryData]);

  const mapAspectRatio = useMemo(() => {
     let w = mapExtent.maxLon - mapExtent.minLon;
     let h = mapExtent.maxLat - mapExtent.minLat;
     
     // default Indonesia aspect ratio if points are identical or empty
     if (w <= 0.1 || h <= 0.1) {
         w = 141 - 95;
         h = 6 - (-11);
     }
     // Mercator distortion correction isn't huge at equator, but let's keep it simple
     let ratio = w / h;
     // Clamp between a square and a very wide rectangle
     return Math.max(1, Math.min(3, ratio));
  }, [mapExtent]);

  const getColorForTrend = useCallback((trend: number) => {
    const { min, max } = trendStats;
    let v = (trend - min) / (max - min);
    v = Math.max(0, Math.min(1, v));
    
    const r = Math.max(0, Math.min(1, 1.5 - Math.abs(4 * v - 3)));
    const g = Math.max(0, Math.min(1, 1.5 - Math.abs(4 * v - 2)));
    const b = Math.max(0, Math.min(1, 1.5 - Math.abs(4 * v - 1)));
    
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  }, [trendStats]);

  useEffect(() => {
      if (!mapElementRef.current) return;
      
      const source = new VectorSource();
      vectorSourceRef.current = source;
      const vectorLayer = new VectorLayer({
          source: source,
      });

      const initialMap = new Map({
          target: mapElementRef.current,
          layers: [
              new TileLayer({
                  source: new OSM()
              }),
              vectorLayer
          ],
          view: new View({
              center: fromLonLat([mapExtent.center[1], mapExtent.center[0]]),
              zoom: 5
          })
      });
      mapRef.current = initialMap;

      initialMap.on('pointermove', (e) => {
         if (e.dragging) return;
         let hitFeature: any = null;
         initialMap.forEachFeatureAtPixel(e.pixel, (feature) => {
             hitFeature = feature;
             return true;
         });
         
         if (hitFeature) {
             initialMap.getTargetElement().style.cursor = 'pointer';
             const station = hitFeature.get('stationData');
             setHoveredStation(station);
         } else {
             initialMap.getTargetElement().style.cursor = '';
             setHoveredStation(null);
         }
      });

      initialMap.on('click', (e) => {
         let hitFeature: any = null;
         initialMap.forEachFeatureAtPixel(e.pixel, (feature) => {
             hitFeature = feature;
             return true;
         });
         
         if (hitFeature) {
             const station = hitFeature.get('stationData');
             setSelectedStation(station);
         } else {
             setSelectedStation(null);
         }
      });

      return () => {
          initialMap.setTarget(undefined);
          mapRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
      if (!vectorSourceRef.current) return;
      
      vectorSourceRef.current.clear();
      
      const features = summaryData.map(row => {
          const feature = new Feature({
              geometry: new Point(fromLonLat([row.longitude, row.latitude])),
              stationData: row
          });
          
          const isHovered = hoveredStation?.fileName === row.fileName;
          const color = getColorForTrend(row.stlTrend);
          
          feature.setStyle(new Style({
              image: new CircleStyle({
                  radius: isHovered ? 10 : 6,
                  fill: new Fill({ color: color }),
                  stroke: new Stroke({ color: '#ffffff', width: 2 })
              }),
              zIndex: isHovered ? 10 : 1
          }));
          
          return feature;
      });
      
      vectorSourceRef.current.addFeatures(features);
  }, [summaryData, hoveredStation, getColorForTrend]);

  useEffect(() => {
     if (!mapRef.current || summaryData.length === 0) return;
     const extent = [mapExtent.minLon, mapExtent.minLat, mapExtent.maxLon, mapExtent.maxLat];
     const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
     mapRef.current.getView().fit(transformedExtent, { padding: [50, 50, 50, 50], duration: 1000 });
  }, [mapExtent, summaryData]);

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
        className="flex-1 overflow-y-auto overflow-x-hidden xl:overflow-hidden flex flex-col xl:flex-row p-6 gap-6"
      >
          {/* Table View */}
          {isTableVisible && (
            <div className="w-full xl:w-1/2 flex-none bg-white border border-slate-200 rounded-xl flex flex-col h-[500px] xl:h-full overflow-hidden shrink-0">
                <div className="p-4 flex-none bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Tabel Gabungan Data</h3>
                    <button 
                        onClick={() => setIsTableVisible(false)}
                        className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition"
                        title="Hide Table"
                    >
                        <Menu size={18} />
                    </button>
                </div>
              <div className="flex-1 min-h-0 overflow-auto p-0">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-100 sticky top-0 z-10 text-slate-600">
                         <tr>
                             <th className="px-4 py-3 font-semibold border-b">Stasiun</th>
                             <th className="px-4 py-3 font-semibold border-b">Lat</th>
                             <th className="px-4 py-3 font-semibold border-b">Lon</th>
                             <th className="px-4 py-3 font-semibold border-b text-right">Trend</th>
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
          )}

          {/* Map View */}
          <div className={`min-w-0 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shrink-0 ${isTableVisible ? 'xl:w-1/2 flex-none xl:flex-1' : 'w-full flex-1'}`}>
             <div className="p-4 flex-none bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      {!isTableVisible && (
                          <button 
                            onClick={() => setIsTableVisible(true)}
                            className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition"
                            title="Show Table"
                          >
                              <Menu size={18} />
                          </button>
                      )}
                      <h3 className="font-bold text-slate-700">Peta Sebaran Sea Level Trend</h3>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                      <span className="font-semibold text-slate-700 text-xs italic">ISSA Trend</span>
                      <div className="w-24 md:w-48">
                          <div 
                             className="w-full h-3 rounded shadow-sm border border-slate-200/50" 
                             style={{ 
                                 background: 'linear-gradient(to right, rgb(0,0,128), rgb(0,0,255), rgb(0,255,255), rgb(255,255,0), rgb(255,0,0), rgb(128,0,0))'
                             }}
                          ></div>
                          <div className="flex justify-between w-full text-[10px] font-medium text-slate-600 mt-1">
                             <span className="">{(trendStats.min * 1000).toFixed(2)}</span>
                             <span className="">{(trendStats.max * 1000).toFixed(2)} mm/yr</span>
                          </div>
                      </div>
                  </div>
              </div>
              <div 
                  className={`w-full relative bg-slate-100 aspect-[var(--map-aspect)] ${isTableVisible ? 'xl:aspect-auto xl:flex-1 xl:min-h-0' : ''}`}
                  style={{ '--map-aspect': mapAspectRatio } as React.CSSProperties}
              >
                  <div ref={mapElementRef} className="w-full h-full" />

                  {/* Custom Tooltip/Popup for Selection */}
                  {selectedStation && (
                     <div className="absolute top-4 left-4 z-50 bg-white/95 backdrop-blur shadow-2xl border border-slate-200 p-4 rounded-2xl min-w-[200px] animate-in fade-in zoom-in duration-200">
                         <div className="flex justify-between items-start mb-3">
                             <div className="font-black text-slate-800 text-sm uppercase tracking-tight">{selectedStation.stationName}</div>
                             <button onClick={() => setSelectedStation(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                                 <X size={16} strokeWidth={3} />
                             </button>
                         </div>
                         <div className="space-y-2 text-[11px]">
                             <div className="flex justify-between">
                                 <span className="text-slate-400 font-bold uppercase tracking-wider">Latitude</span>
                                 <span className="text-slate-900 font-mono font-bold">{selectedStation.latitude.toFixed(5)}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-slate-400 font-bold uppercase tracking-wider">Longitude</span>
                                 <span className="text-slate-900 font-mono font-bold">{selectedStation.longitude.toFixed(5)}</span>
                             </div>
                             <div className="border-t border-slate-100 my-2 pt-2">
                                 <div className="flex justify-between">
                                     <span className="text-slate-400 font-bold uppercase tracking-wider">MSL</span>
                                     <span className="text-slate-900 font-mono font-bold">{selectedStation.msl.toFixed(3)} m</span>
                                 </div>
                                 <div className="flex justify-between items-center mt-1">
                                     <span className="text-slate-400 font-bold uppercase tracking-wider">ISSA Trend</span>
                                     <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md font-mono font-bold shadow-sm ring-1 ring-white/10">
                                         {(selectedStation.stlTrend * 1000).toFixed(2)} mm/yr
                                     </span>
                                 </div>
                             </div>
                         </div>
                     </div>
                  )}

                  {/* Hover Tooltip */}
                  {hoveredStation && !selectedStation && (
                      <div className="absolute bottom-4 right-4 z-40 bg-slate-900/90 text-white p-2 rounded-lg text-[10px] font-bold shadow-lg backdrop-blur pointer-events-none">
                          {hoveredStation.stationName} ({(hoveredStation.stlTrend * 1000).toFixed(2)} mm/yr)
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
