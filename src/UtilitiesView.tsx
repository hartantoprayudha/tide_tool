import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import download from 'downloadjs';

export default function UtilitiesView() {
    const [files, setFiles] = useState<File[]>([]);
    const [mergeFiles, setMergeFiles] = useState<File[]>([]);
    const [converting, setConverting] = useState(false);
    const [merging, setMerging] = useState(false);
    const [results, setResults] = useState<{ name: string, content: string }[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleMergeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setMergeFiles(Array.from(e.target.files));
        }
    };

    const mergeHydrasFiles = async () => {
        if (mergeFiles.length === 0) return;
        setMerging(true);
        
        const allEntries: { ts: number, line: string }[] = [];

        for (const file of mergeFiles) {
            try {
                const text = await file.text();
                const lines = text.split(/\r?\n/);
                for (const line of lines) {
                    if (!line.trim()) continue;
                    // Format: DD/MM/YYYY HH:mm:ss\tValue
                    const parts = line.split('\t');
                    if (parts.length < 2) continue;
                    
                    const dateTimeStr = parts[0];
                    const [datePart, timePart] = dateTimeStr.split(' ');
                    if (!datePart || !timePart) continue;

                    const [d, m, y] = datePart.split('/').map(Number);
                    const [h, min, s] = timePart.split(':').map(Number);
                    
                    const date = new Date(y, m - 1, d, h, min, s);
                    if (!isNaN(date.getTime())) {
                        allEntries.push({ ts: date.getTime(), line: line.trim() });
                    }
                }
            } catch (err) {
                console.error("Error reading file for merge:", file.name, err);
            }
        }

        // Sort by timestamp
        allEntries.sort((a, b) => a.ts - b.ts);

        const output = allEntries.map(e => e.line).join('\n');
        if (output) {
            const outputName = "merged_hydras_" + new Date().getTime() + ".txt";
            setResults(prev => [...prev, { name: outputName, content: output }]);
        }
        
        setMerging(false);
    };

    const convertTogaToHydras = async () => {
        if (files.length === 0) return;
        setConverting(true);
        const newResults: { name: string, content: string }[] = [];

        for (const file of files) {
            try {
                const text = await file.text();
                const lines = text.split(/\r?\n/);
                if (lines.length < 3) continue;

                // Line 1: Month Year
                // Example: " 1 1985 042 C"
                const header1 = lines[0].trim().split(/\s+/);
                const month = parseInt(header1[0]);
                const year = parseInt(header1[1]);

                if (isNaN(month) || isNaN(year)) {
                    console.error("Invalid TOGA header in file:", file.name);
                    continue;
                }

                let output = "";
                // Data lines start from index 2
                for (let i = 2; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line.trim()) continue;

                    const day = i - 1; // Row 3 is Day 1
                    
                    // Parse 24 hourly values
                    // TOGA format is fixed width, 4 chars per value: " vvv." or "   ."
                    for (let hour = 0; hour < 24; hour++) {
                        const start = hour * 4;
                        const chunk = line.substring(start, start + 4).trim();
                        
                        // If it's a dot, it's missing data
                        if (chunk === "." || !chunk || chunk.includes(".")) {
                            const val = chunk.replace(".", "").trim();
                            if (!val) continue; // It was just a dot or spaces

                            // If we have a value accompanied by a dot (e.g. "085."), use it
                            const value = parseInt(val);
                            if (!isNaN(value)) {
                                const dateStr = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                                const timeStr = `${hour.toString().padStart(2, '0')}:00:00`;
                                output += `${dateStr} ${timeStr}\t${value}\n`;
                            }
                        } else {
                            const value = parseInt(chunk);
                            if (!isNaN(value)) {
                                const dateStr = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                                const timeStr = `${hour.toString().padStart(2, '0')}:00:00`;
                                output += `${dateStr} ${timeStr}\t${value}\n`;
                            }
                        }
                    }
                }

                if (output) {
                    const outputName = file.name.replace(/\.[^/.]+$/, "") + "_hydras.txt";
                    newResults.push({ name: outputName, content: output });
                }
            } catch (err) {
                console.error("Error converting file:", file.name, err);
            }
        }

        setResults(newResults);
        setConverting(false);
    };

    const downloadAll = () => {
        results.forEach(res => {
            download(res.content, res.name, "text/plain");
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-50 rounded-xl text-[#0284c7] shadow-inner">
                    <Wrench size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Utilities</h2>
                    <p className="text-sm text-slate-500 font-medium">Tools bantu untuk konversi format data pasang surut.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* TOGA to Hydras Section */}
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <FileText size={20} className="text-[#0284c7]" />
                        </div>
                        <h3 className="font-bold text-slate-700">TOGA to Hydras</h3>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        Konversi format TOGA (.dat) ke Hydras (.txt). 
                        Mendukung input multiple files.
                    </p>

                    <div className="space-y-4">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-white hover:border-[#0284c7] transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-slate-400 group-hover:text-[#0284c7]" />
                                <p className="text-xs text-slate-500 font-bold">Upload file TOGA</p>
                            </div>
                            <input type="file" className="hidden" multiple onChange={handleFileChange} accept=".dat,.txt" />
                        </label>

                        {files.length > 0 && (
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">File ({files.length})</div>
                                <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
                                    {files.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between gap-2 p-1 bg-white rounded-lg border border-slate-50 group/file">
                                            <div className="text-[10px] font-bold text-slate-600 truncate flex-1">{f.name}</div>
                                            <button 
                                                onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={convertTogaToHydras}
                                    disabled={converting}
                                    className="w-full py-2 bg-[#1e293b] text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    {converting ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
                                    KONVERSI SEKARANG
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Merge Hydras Section */}
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Download size={20} className="text-[#0284c7]" />
                        </div>
                        <h3 className="font-bold text-slate-700">Merge Hydras</h3>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        Gabungkan beberapa file Hydras menjadi 1 file tunggal yang terurut secara waktu.
                    </p>

                    <div className="space-y-4">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-white hover:border-[#0284c7] transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-slate-400 group-hover:text-[#0284c7]" />
                                <p className="text-xs text-slate-500 font-bold">Upload files untuk di-merge</p>
                            </div>
                            <input type="file" className="hidden" multiple onChange={handleMergeFileChange} accept=".txt" />
                        </label>

                        {mergeFiles.length > 0 && (
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">File ({mergeFiles.length})</div>
                                <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
                                    {mergeFiles.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between gap-2 p-1 bg-slate-50 rounded-lg group/file">
                                            <div className="text-[10px] font-bold text-slate-600 truncate flex-1">{f.name}</div>
                                            <button 
                                                onClick={() => setMergeFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={mergeHydrasFiles}
                                    disabled={merging}
                                    className="w-full py-2 bg-[#0284c7] text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-[#0369a1] transition-all shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    {merging ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
                                    MERGE & URUTKAN
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col gap-6 shadow-sm ring-4 ring-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg shadow-sm">
                                <Download size={20} className="text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-slate-700">Hasil Konversi</h3>
                        </div>
                        {results.length > 0 && (
                            <button onClick={() => setResults([])} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>

                    {results.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl mb-3 flex items-center justify-center">
                                <Download size={24} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada hasil</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                                {results.map((res, i) => (
                                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-white rounded-lg shadow-sm text-emerald-600">
                                                <FileText size={14} />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">{res.name}</span>
                                        </div>
                                        <button 
                                            onClick={() => download(res.content, res.name, "text/plain")}
                                            className="p-2 bg-white text-emerald-600 rounded-lg border border-emerald-100 shadow-sm hover:bg-emerald-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Download size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={downloadAll}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-md active:scale-95 shadow-emerald-100"
                            >
                                <Download size={14} /> DOWNLOAD SEMUA (.TXT)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Note Section */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-amber-800 uppercase tracking-widest">Penting</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                        Pastikan file TOGA Anda memiliki format kolom yang tepat (24 jam per baris). 
                        Aplikasi ini mendeteksi missing data melalui karakter titik (.) dan mengonversinya ke format Hydras dengan pemisah TAB (\t).
                    </p>
                </div>
            </div>
        </div>
    );
}

function RefreshCw({ className, size }: { className?: string, size?: number }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size || 24} 
            height={size || 24} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}
