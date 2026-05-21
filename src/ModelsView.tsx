import React, { useState, useRef } from 'react';
import { Upload, FileText, Globe, Layers, Settings2, Play, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from './lib/utils';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Style, Stroke, Fill } from 'ol/style';
import { fromLonLat, transformExtent } from 'ol/proj';

export default function ModelsView() {
  const [selectedModel, setSelectedModel] = useState('TPXO9');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAssimilating, setIsAssimilating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<null | { rmse: number, improvement: number, coverage: string }>(null);
  
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  React.useEffect(() => {
    if (mapElementRef.current && !mapRef.current) {
      const boundaryExtent = transformExtent([90, -15, 150, 15], 'EPSG:4326', 'EPSG:3857');
      
      const boundaryFeature = new Feature({
        geometry: new Polygon([
          [
            fromLonLat([90, -15]),
            fromLonLat([150, -15]),
            fromLonLat([150, 15]),
            fromLonLat([90, 15]),
            fromLonLat([90, -15]),
          ]
        ])
      });

      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: [boundaryFeature]
        }),
        style: new Style({
          stroke: new Stroke({
            color: 'rgba(99, 102, 241, 0.8)',
            width: 2,
            lineDash: [5, 5]
          }),
          fill: new Fill({
            color: 'rgba(99, 102, 241, 0.05)'
          })
        })
      });

      mapRef.current = new Map({
        target: mapElementRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          vectorLayer
        ],
        view: new View({
          center: fromLonLat([120.0, 0.0]),
          zoom: 4,
        }),
      });

      mapRef.current.getView().fit(boundaryExtent, { padding: [50, 50, 50, 50] });
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const runAssimilation = () => {
    if (uploadedFiles.length === 0) {
      alert("Harap unggah file konstanta harmonik terlebih dahulu.");
      return;
    }
    
    setIsAssimilating(true);
    setProgress(0);
    setResult(null);

      // Simulate assimilation process
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress > 100) currentProgress = 100;
        setProgress(currentProgress);
        
        if (currentProgress === 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsAssimilating(false);
            setResult({
              rmse: 0.045,
              improvement: 18.2,
              coverage: '15°N - 15°S, 90°E - 150°E'
            });
          }, 500);
        }
      }, 500);
    };
    
    const handleDownloadNC = () => {
      const blob = new Blob(["Simulated NetCDF Data for Tidal Assimilation"], { type: "application/x-netcdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `regional_tide_model_${selectedModel}_15N_15S_90E_150E.nc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Config */}
        <div className="w-full lg:w-1/3 xl:w-1/4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 font-display mb-4 flex items-center gap-2">
              <Globe className="text-indigo-500" size={20} />
              Konfigurasi Model
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Model Pasut Global/Regional Dasar</label>
                <select 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isAssimilating}
                >
                  <option value="DTU23">DTU23 (Global)</option>
                  <option value="EOT20">EOT20 (Global)</option>
                  <option value="TPXO9">TPXO9 (Global)</option>
                  <option value="GOT4.10">GOT4.10 (Global)</option>
                  <option value="FES2014">FES2014 (Global)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Resolusi Spasial Target</label>
                <select disabled={isAssimilating} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                  <option value="0.125">1/8° x 1/8° (~13km)</option>
                  <option value="0.0625">1/16° x 1/16° (~6.5km)</option>
                  <option value="0.03125">1/32° x 1/32° (~3.2km)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md inline-block w-full border border-indigo-100">
                  Data Asimilasi (Konstanta Harmonik)
                </label>
                <div className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center transition-all",
                  uploadedFiles.length > 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-300 hover:border-slate-400 bg-slate-50"
                )}>
                  <input
                    type="file"
                    multiple
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="assimilation-upload"
                    disabled={isAssimilating}
                  />
                  <label htmlFor="assimilation-upload" className="cursor-pointer flex flex-col items-center">
                    {uploadedFiles.length > 0 ? (
                      <>
                        <CheckCircle2 className="text-emerald-500 mb-2" size={28} />
                        <span className="text-sm font-semibold text-emerald-700">{uploadedFiles.length} file dipilih</span>
                        <span className="text-xs text-emerald-600/70 block mt-1 break-all px-2">
                            {uploadedFiles.slice(0, 2).map(f => f.name).join(', ')}
                            {uploadedFiles.length > 2 && ` +${uploadedFiles.length - 2} lainnya`}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="text-slate-400 mb-2" size={28} />
                        <span className="text-sm font-semibold text-slate-600 block mb-1">Pilih File CSV/TXT</span>
                        <span className="text-xs text-slate-400 block max-w-[180px] mx-auto leading-relaxed">
                          Pilih output konstanta dari panel Harmonic
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={runAssimilation}
                  disabled={isAssimilating || uploadedFiles.length === 0}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm",
                    isAssimilating 
                      ? "bg-indigo-100 text-indigo-400 cursor-not-allowed" 
                      : uploadedFiles.length > 0
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-md"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {isAssimilating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      Proses Asimilasi...
                    </>
                  ) : (
                    <>
                      <Layers size={18} />
                      Asimilasi Data
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Visualization & Status */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px] lg:h-full min-h-[500px] relative">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-sm relative z-10">
               <div>
                 <h3 className="font-bold text-slate-800 font-display flex items-center gap-2">
                    Visualisasi Domain Model Regional (Indonesia)
                 </h3>
                 <p className="text-xs text-slate-500 mt-0.5">Memvisualisasikan luasan dan titik stasiun pasut assimilasi.</p>
               </div>
            </div>

            {/* Progress Overlay */}
            {isAssimilating && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-xl border border-indigo-100 text-center">
                  <Play className="text-indigo-500 mx-auto mb-4 animate-pulse" size={32} />
                  <h4 className="font-bold text-lg text-slate-800 mb-2 font-display">Mengasimilasi Model...</h4>
                  <p className="text-sm text-slate-500 mb-6">Membentuk matriks kovariansi dan mengeksekusi metode kuadrat terkecil untuk regional Indonesia menggunakan base model {selectedModel}.</p>
                  
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-300 ease-out"
                       style={{ width: `${progress}%` }}
                     />
                  </div>
                  <div className="mt-2 text-right text-xs font-bold text-indigo-600">{Math.round(progress)}%</div>
                </div>
              </div>
            )}

            {/* Map Container */}
            <div ref={mapElementRef} className="flex-1 w-full bg-slate-100" />
            
            {/* Legend overlay */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-2 border border-slate-200 rounded-lg shadow-sm text-xs font-medium text-slate-600 flex flex-col gap-1.5">
               <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-pink-500 bg-pink-100" />
                  Stasiun Pengamatan
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-indigo-400 bg-indigo-100/50" />
                  Batas Domain Regional
               </div>
            </div>
          </div>
        </div>

      </div>

      {/* Result Panel */}
      {result && (
        <div className="bg-gradient-to-br from-indigo-50 to-sky-50 rounded-2xl border border-indigo-100 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold font-display text-indigo-900 mb-1 flex items-center gap-2">
                   <CheckCircle2 className="text-emerald-500" />
                   Model Regional Berhasil Diekstrak
                </h3>
                <p className="text-sm text-indigo-700/80">Proses pencampuran konstanta {selectedModel} dengan {uploadedFiles.length} stasiun pantau telah selesai.</p>
              </div>
              <button onClick={handleDownloadNC} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2">
                 <Download size={16} />
                 Unduh Model (.nc)
              </button>
           </div>
           
           <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/50">
                 <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">RMSE Global</div>
                 <div className="text-2xl font-black text-indigo-900 font-display">{result.rmse} <span className="text-base text-indigo-500 font-medium font-sans">m</span></div>
              </div>
              <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/50">
                 <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Improvement</div>
                 <div className="text-2xl font-black text-emerald-600 font-display">+{result.improvement}%</div>
              </div>
              <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/50">
                 <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Domain Coverage</div>
                 <div className="text-lg font-bold text-indigo-900 leading-tight mt-1 truncate">{result.coverage}</div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
