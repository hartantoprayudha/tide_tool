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
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  Maximize,
  X,
  Layers,
  Info,
  ClipboardList,
  BookOpen,
  Map as MapIcon
} from 'lucide-react';
import SummarizeView from './SummarizeView';

import { 
  ComposedChart,
  Scatter,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  Brush,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import Papa from 'papaparse';
import { cn } from '@/src/lib/utils';
import { format, addDays, parse, isValid } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';
import { jsPDF } from 'jspdf';

// --- UTILS ---
const formatUTC = (date: Date, fmt: string) => {
  // Offset the date so that format() outputs UTC components
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
  return format(new Date(utcTime), fmt);
};

// --- TYPES ---
interface TideRecord {
  timestamp: Date;
  raw: number;
  combined: number;
  filtered: number;
  interpolated: number;
  isOutlier: boolean;
  predictedLevel?: number;
  allSamples?: Record<string, number>;
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
  'MN4': { f: 0.159510646, d: 'Shallow water quarter diurnal' },
  'MSf': { f: 0.002821933, d: 'Lunisolar synodic fortnightly' },
  'Mf': { f: 0.003050013, d: 'Lunar fortnightly' },
  'Mm': { f: 0.001512151, d: 'Lunar monthly' },
  'Ssa': { f: 0.000228159, d: 'Solar semi-annual' },
  'Sa': { f: 0.000114079, d: 'Solar annual' },
  // Adding 8 more to complete 34 UKHO Constants
  'RHO1': { f: 0.034661706, d: 'Larger lunar elliptic diurnal' },
  'M1': { f: 0.040268595, d: 'Smaller lunar elliptic diurnal' },
  'PI1': { f: 0.041438515, d: 'Solar diurnal' },
  '2Q1': { f: 0.035706434, d: 'Elliptic diurnal' },
  '2SM2': { f: 0.086155266, d: 'Shallow water semidiurnal' },
  'M3': { f: 0.120767102, d: 'Lunar terdiurnal' },
  'M8': { f: 0.322045602, d: 'Shallow water eighth diurnal' },
  '2MK3': { f: 0.122292147, d: 'Shallow water terdiurnal' },
  // Adding 33 more to complete UTide 67 Constants
  'MSM': { f: 0.001309781, d: 'Lunar monthly' },
  'ALP1': { f: 0.034396570, d: 'Diurnal' },
  'SIG1': { f: 0.035908722, d: 'Diurnal' },
  'TAU1': { f: 0.038933027, d: 'Diurnal' },
  'BET1': { f: 0.040040445, d: 'Diurnal' },
  'NO1': { f: 0.040268594, d: 'Diurnal' },
  'CHI1': { f: 0.040470968, d: 'Diurnal' },
  'S1': { f: 0.041666672, d: 'Solar diurnal' },
  'PSI1': { f: 0.041894820, d: 'Diurnal' },
  'PHI1': { f: 0.042008900, d: 'Diurnal' },
  'THE1': { f: 0.043082000, d: 'Diurnal' },
  'SO1': { f: 0.044602700, d: 'Diurnal' },
  'OQ2': { f: 0.075974900, d: 'Semidiurnal' },
  'EPS2': { f: 0.076177300, d: 'Semidiurnal' },
  'MKS2': { f: 0.080739500, d: 'Semidiurnal' },
  'LDA2': { f: 0.081821200, d: 'Semidiurnal' },
  'R2': { f: 0.083447400, d: 'Semidiurnal' },
  'MSN2': { f: 0.084845500, d: 'Semidiurnal' },
  'ETA2': { f: 0.085073600, d: 'Semidiurnal' },
  'MO3': { f: 0.119242100, d: 'Terdiurnal' },
  'SO3': { f: 0.122064000, d: 'Terdiurnal' },
  'SK3': { f: 0.125114100, d: 'Terdiurnal' },
  'SN4': { f: 0.162332600, d: 'Quarter diurnal' },
  'MK4': { f: 0.164072900, d: 'Quarter diurnal' },
  'SK4': { f: 0.166894800, d: 'Quarter diurnal' },
  '2MK5': { f: 0.202803500, d: 'Fifth diurnal' },
  '2SK5': { f: 0.208447400, d: 'Fifth diurnal' },
  '2MN6': { f: 0.240022100, d: 'Sixth diurnal' },
  '2MS6': { f: 0.244356100, d: 'Sixth diurnal' },
  '2MK6': { f: 0.244584300, d: 'Sixth diurnal' },
  '2SM6': { f: 0.247178100, d: 'Sixth diurnal' },
  'MSK6': { f: 0.247406200, d: 'Sixth diurnal' },
  '3MK7': { f: 0.283314900, d: 'Seventh diurnal' },
  'E2': { f: 0.076177300, d: 'EPS2' },
  'La2': { f: 0.081821200, d: 'LDA2' },
  'Mu2': { f: 0.077689470, d: 'MU2' },
  'Nu2': { f: 0.079201621, d: 'NU2' },
  'MSqm': { f: 0.004333900, d: 'Lunar solar quarter monthly' },
  'Mtm': { f: 0.004562100, d: 'Lunar third monthly' },
  'N4': { f: 0.157998498, d: 'Over-tide' }
};

const getMoonEvents = (data: any[]) => {
  const events = [];
  let lastPhaseType = -1;
  for (let i = 0; i < data.length; i++) {
      const p = data[i];
      if (!p.timestamp) continue;
      const lud = 29.53058867;
      const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14)).getTime();
      const days = (p.timestamp.getTime() - knownNewMoon) / 86400000;
      const phase = ((days % lud) + lud) % lud;
      const ratio = phase / lud;
      
      let currentType = -1;
      if (ratio > 0.985 || ratio < 0.015) currentType = 0; // New
      else if (ratio > 0.235 && ratio < 0.265) currentType = 1; // 1st Quarter
      else if (ratio > 0.485 && ratio < 0.515) currentType = 2; // Full
      else if (ratio > 0.735 && ratio < 0.765) currentType = 3; // 3rd Quarter

      if (currentType !== -1 && currentType !== lastPhaseType) {
          const symbol = currentType === 0 ? '🌑' : currentType === 1 ? '🌓' : currentType === 2 ? '🌕' : '🌗';
          const phaseName = currentType === 0 ? 'New Moon' : currentType === 1 ? 'First Quarter' : currentType === 2 ? 'Full Moon' : 'Last Quarter';
          events.push({ time: p.timeStr || p.time, symbol, phaseName });
          lastPhaseType = currentType;
      } else if (currentType === -1) {
          lastPhaseType = -1;
      }
  }
  return events;
};

function solveCubicSpline(x: number[], y: number[], xi: number[]): number[] {
    const n = x.length;
    if (n === 0) return xi.map(() => NaN);
    if (n === 1) return xi.map(() => y[0]);
    if (n === 2) {
        return xi.map(xiVal => {
            const t = (xiVal - x[0]) / (x[1] - x[0]);
            return y[0] + t * (y[1] - y[0]);
        });
    }

    const a = y.slice();
    const h = [];
    for (let i = 0; i < n - 1; i++) {
        h.push(x[i + 1] - x[i]);
    }

    const alpha = [0];
    for (let i = 1; i < n - 1; i++) {
        alpha.push(3 / h[i] * (a[i + 1] - a[i]) - 3 / h[i - 1] * (a[i] - a[i - 1]));
    }

    const c = new Array(n).fill(0);
    const l = new Array(n).fill(1);
    const mu = new Array(n).fill(0);
    const z = new Array(n).fill(0);

    for (let i = 1; i < n - 1; i++) {
        l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1];
        mu[i] = h[i] / l[i];
        z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }

    const b = new Array(n).fill(0);
    const d = new Array(n).fill(0);

    for (let j = n - 2; j >= 0; j--) {
        c[j] = z[j] - mu[j] * c[j + 1];
        b[j] = (a[j + 1] - a[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
        d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    }

    return xi.map(xiVal => {
        if (xiVal <= x[0]) return y[0];
        if (xiVal >= x[n - 1]) return y[n - 1];
        
        let i = 0;
        let j = n - 1;
        while (i <= j) {
            const mid = Math.floor((i + j) / 2);
            if (x[mid] <= xiVal && xiVal < x[mid + 1]) {
                i = mid;
                break;
            } else if (xiVal < x[mid]) {
                j = mid - 1;
            } else {
                i = mid + 1;
            }
        }
        
        const dx = xiVal - x[i];
        return a[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx;
    });
}

interface PartialModifier {
  startMs: number;
  endMs: number;
  sensor: string;
  offset: number;
  scale: number;
  referenceSensor?: string;
  action?: 'modify' | 'delete';
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<TideRecord[]>([]);
  const [datums, setDatums] = useState<{ mhws: number, mlws: number, hat: number, lat: number } | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [modifiers, setModifiers] = useState<PartialModifier[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Station Metadata
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const stationNameRef = useRef("");
  const stationLatRef = useRef("");
  const stationLonRef = useRef("");

  // Configuration State
  const [availableSensors, setAvailableSensors] = useState<string[]>([]);
  const [selectedSensor, setSelectedSensor] = useState('');
  const [visibleSensors, setVisibleSensors] = useState<string[]>([]);
  const [constituentSet, setConstituentSet] = useState<'4' | '9' | 'IHO23' | 'FES2014' | 'UTIDE' | 'AUTO'>('9');
  const [isLoading, setIsLoading] = useState(false);
  const [verticalOffset, setVerticalOffset] = useState<number>(0);
  const [timeOffset, setTimeOffset] = useState<number>(0);
  
  const [vOffsetStr, setVOffsetStr] = useState<string>('');
  const [tOffsetStr, setTOffsetStr] = useState<string>('');

  useEffect(() => {
    setVOffsetStr(verticalOffset === 0 ? '' : verticalOffset.toString());
  }, [verticalOffset]);

  useEffect(() => {
    setTOffsetStr(timeOffset === 0 ? '' : timeOffset.toString());
  }, [timeOffset]);

  // Analysis State
  const [zThreshold, setZThreshold] = useState(3.0);
  const [manualMin, setManualMin] = useState<number | "">("");
  const [manualMax, setManualMax] = useState<number | "">("");
  const [filterType, setFilterType] = useState<'ma' | 'median' | 'butterworth'>('ma');
  const [filterWindow, setFilterWindow] = useState(15);
  const [medianWindow, setMedianWindow] = useState(3);
  const [butterCutoff, setButterCutoff] = useState(0.5);
  const [harmonicResults, setHarmonicResults] = useState<ConstituentResult[]>([]);
  const [rmseVal, setRmseVal] = useState<number | null>(null);
  const isProcessing = useRef(false);
  const [z0, setZ0] = useState(0);
  const [linearTrend, setLinearTrend] = useState<{ slope: number, intercept: number, rateYear: number, lsqTrend?: { slope: number, intercept: number, rateYear: number }, stlTrend?: { slope: number, intercept: number, rateYear: number } } | null>(null);
  const [isDeTiding, setIsDeTiding] = useState(true);
  const [isFullAnalysisRun, setIsFullAnalysisRun] = useState(false);
  const [validCache, setValidCache] = useState<Record<string, number[]>>({});
  
  // Combination State
  const [combinationSettings, setCombinationSettings] = useState({
    enabled: false,
    referenceSensor: '',
    sourceSensors: [] as string[]
  });
  const [showCombinationModal, setShowCombinationModal] = useState(false);

  // Interpolation State
  const [interpolationSettings, setInterpolationSettings] = useState({
    enabled: false,
    maxGapMinutes: 15
  });
  
  // Prediction State
  const [predStartDate, setPredStartDate] = useState(formatUTC(new Date(), 'yyyy-MM-dd'));
  const [predEndDate, setPredEndDate] = useState(formatUTC(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [predictions, setPredictions] = useState<any[]>([]);
  const [dataLengthWarning, setDataLengthWarning] = useState<string | null>(null);
  const [autoDiagnostics, setAutoDiagnostics] = useState<{ rayleighPassed: number, totalTested: number, snrPassed: number } | null>(null);
  const [chartTitle, setChartTitle] = useState("Tide Analysis Visualization");

  // Dynamic README Context for Github Sync
  const [readmeContent, setReadmeContent] = useState<string>('Memuat dokumentasi...');

  useEffect(() => {
    // Dynamically import README.md as raw string
    // @ts-ignore
    import('../README.md?raw')
      .then(res => {
        if (res.default) setReadmeContent(res.default);
      })
      .catch(err => console.error("Failed to load README.md", err));
  }, []);

  // --- CORE ANALYTICS ENGINE (Client-side) ---

  const doInterpolation = (settings: typeof interpolationSettings, recordsToInterpolate: any[]) => {
      const updated = [...recordsToInterpolate];
      if (!settings.enabled) {
          for (let i = 0; i < updated.length; i++) {
              updated[i].interpolated = NaN;
          }
          return updated;
      }
      
      let dt = 60000;
      if (updated.length > 1) {
          dt = updated[1].timestamp.getTime() - updated[0].timestamp.getTime();
      }

      const interpolatedStream = new Array(updated.length);
      for (let i = 0; i < updated.length; i++) {
          // Fall back to filtered (Valid stream) if combined is NaN or disabled
          let baseVal = updated[i].combined;
          if (isNaN(baseVal)) baseVal = updated[i].filtered;
          interpolatedStream[i] = baseVal;
      }

      let i = 0;
      while (i < updated.length) {
          if (!isNaN(interpolatedStream[i])) {
              updated[i].interpolated = interpolatedStream[i];
              i++;
              continue;
          }

          let startGap = i;
          let endGap = i;
          while (endGap < updated.length && isNaN(interpolatedStream[endGap])) {
              endGap++;
          }
          const gapLength = endGap - startGap;
          const gapDurationMins = (gapLength * dt) / 60000;

          const prevVal = startGap > 0 ? interpolatedStream[startGap - 1] : NaN;
          const nextVal = endGap < updated.length ? interpolatedStream[endGap] : NaN;
          
          if (!isNaN(prevVal) && !isNaN(nextVal) && gapDurationMins <= settings.maxGapMinutes) {
              let xPoints = [];
              let yPoints = [];
              let ptsBefore = 0;
              for (let k = startGap - 1; k >= 0 && ptsBefore < 3; k--) {
                  if (!isNaN(interpolatedStream[k])) {
                      xPoints.unshift(k);
                      yPoints.unshift(interpolatedStream[k]);
                      ptsBefore++;
                  } else break;
              }
              let ptsAfter = 0;
              for (let k = endGap; k < updated.length && ptsAfter < 3; k++) {
                  if (!isNaN(interpolatedStream[k])) {
                      xPoints.push(k);
                      yPoints.push(interpolatedStream[k]);
                      ptsAfter++;
                  } else break;
              }
              
              let xi = [];
              for (let j = startGap; j < endGap; j++) {
                  xi.push(j);
              }
              
              const yi = solveCubicSpline(xPoints, yPoints, xi);
              
              for (let j = startGap; j < endGap; j++) {
                  const minBound = Math.min(...yPoints);
                  const maxBound = Math.max(...yPoints);
                  let interp = yi[j - startGap];
                  if (interp < minBound - 0.5) interp = minBound - 0.5; 
                  if (interp > maxBound + 0.5) interp = maxBound + 0.5;
                  
                  interpolatedStream[j] = parseFloat(interp.toFixed(3));
                  updated[j].interpolated = interpolatedStream[j];
              }
          } else {
              for (let j = startGap; j < endGap; j++) {
                  updated[j].interpolated = NaN;
              }
          }
          i = endGap;
      }
      return updated;
  };

  const solveLeastSquares = (t: number[], y: number[], comps: string[]) => {
    // Solve y = Z0 + sum(Ai cos(wi t) + Bi sin(wi t))
    const numRows = t.length;
    const numComps = comps.length;
    const numParams = 1 + 2 * numComps;

    // Construct Matrix A and vector b using Typed Arrays for performance
    const A = new Float64Array(numParams * numParams);
    const b = new Float64Array(numParams);

    const f_list = new Float64Array(comps.map(c => 2 * Math.PI * HARMONIC_FREQS[c].f));
    const rowVals = new Float64Array(numParams);
    
    for (let i = 0; i < numRows; i++) {
        const ti = t[i];
        rowVals[0] = 1;
        for (let j = 0; j < numComps; j++) {
            const angle = f_list[j] * ti;
            rowVals[1 + 2 * j] = Math.cos(angle);
            rowVals[1 + 2 * j + 1] = Math.sin(angle);
        }

        const yi = y[i];
        for (let r = 0; r < numParams; r++) {
            const rv_r = rowVals[r];
            const offset = r * numParams;
            for (let c = r; c < numParams; c++) { 
                A[offset + c] += rv_r * rowVals[c];
            }
            b[r] += rv_r * yi;
        }
    }

    // Fill symmetric part
    for (let r = 0; r < numParams; r++) {
        for (let c = 0; c < r; c++) {
            A[r * numParams + c] = A[c * numParams + r];
        }
    }

    // Convert back to 2D array for gaussianSolve (minimal overhead since n is small)
    const A2D: number[][] = [];
    for (let i = 0; i < numParams; i++) {
        A2D.push(Array.from(A.slice(i * numParams, (i + 1) * numParams)));
    }
    const bArr = Array.from(b);
    
    // Apply Tikhonov Regularization
    for (let r = 1; r < numParams; r++) {
        A2D[r][r] += 0.0001 * numRows;
    }

    const x = gaussianSolve(A2D, bArr);
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

  const runAnalysis = (rawRows: any[], sensorToUse?: string, vOffset: number = verticalOffset, tOffset: number = timeOffset, activeMods: PartialModifier[] = modifiers, useDeTiding: boolean = isDeTiding, combSettings: any = combinationSettings, interpSettings: any = interpolationSettings, forceFullAnalysis: boolean = isFullAnalysisRun) => {
    if (!rawRows.length) return;
    if (isProcessing.current) return;
    const currentSensor = sensorToUse || selectedSensor;
    if (!currentSensor) return;

    isProcessing.current = true;
    setIsLoading(true);

    // Simulate async for loading state
    setTimeout(() => {
      try {
        const isCurrentCm = currentSensor.toLowerCase().includes('(cm)');

        // 1. Data Parsing with flexible Date format
        // Optimization: Pre-calculate formats and avoid object creation in inner sensors loop where possible
        const fmts = ['dd/MM/yyyy HH:mm:ss', 'dd/MM/yyyy HH:mm', 'dd-MM-yyyy HH:mm:ss', 'dd-MM-yyyy HH:mm', 'yyyy-MM-dd HH:mm:ss', 'yyyy-MM-dd HH:mm', 'ddMMyyyy HH:mm', 'ddMMyyyy HHmm', 'dd/MM/yyyy HH.mm'];
        
        let processed: TideRecord[] = [];
        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];
          let tsStr = (row['Timestamp'] || row[0] || "").trim();
          let valStr = (row[currentSensor] || "").trim();
          tsStr = tsStr.replace(/\s+/g, ' ');

          let dateObj: Date = new Date(NaN);
          for (const fmt of fmts) {
            const p = parse(tsStr, fmt, new Date());
            if (isValid(p)) {
              dateObj = p;
              break;
            }
          }

          if (!isValid(dateObj)) dateObj = new Date(tsStr);
          if (!isValid(dateObj)) continue;
          
          // Interpret input components as UTC time directly
          dateObj = new Date(Date.UTC(
              dateObj.getFullYear(),
              dateObj.getMonth(),
              dateObj.getDate(),
              dateObj.getHours(),
              dateObj.getMinutes(),
              dateObj.getSeconds()
          ));

          const unmodifiedDateMs = dateObj.getTime();
          if (tOffset !== 0) {
              dateObj = new Date(unmodifiedDateMs + tOffset * 3600000);
          }

          const allSamples: Record<string, number> = {};
          for (let sIdx = 0; sIdx < availableSensors.length; sIdx++) {
              const s = availableSensors[sIdx];
              const sValStr = (row[s] || "").trim();
              const isCm = s.toLowerCase().includes('(cm)');
              let sValRaw = parseFloat(sValStr.replace(',', '.'));
              if (sValRaw === 999 || sValRaw === -999 || sValRaw < -200 || sValRaw > 900) sValRaw = NaN;
              if (isCm && !isNaN(sValRaw)) sValRaw = sValRaw / 100;
              
              if (!isNaN(sValRaw)) {
                  for (let mIdx = 0; mIdx < activeMods.length; mIdx++) {
                      const mod = activeMods[mIdx];
                      if (mod.sensor === s && unmodifiedDateMs >= mod.startMs && unmodifiedDateMs <= mod.endMs) {
                          if (mod.action === 'delete') {
                              sValRaw = NaN;
                          } else {
                              sValRaw = (sValRaw * mod.scale) + mod.offset;
                          }
                      }
                  }
                  allSamples[s] = parseFloat(sValRaw.toFixed(3));
              }
          }

          let valRaw = parseFloat(valStr.replace(',', '.'));
          if (valRaw === 999 || valRaw === -999 || valRaw < -200 || valRaw > 900) valRaw = NaN;
          
          if (isCurrentCm && !isNaN(valRaw)) valRaw = valRaw / 100;
          valRaw += vOffset;
          
          if (!isNaN(valRaw)) {
              for (let mIdx = 0; mIdx < activeMods.length; mIdx++) {
                  const mod = activeMods[mIdx];
                  if (mod.sensor === currentSensor && unmodifiedDateMs >= mod.startMs && unmodifiedDateMs <= mod.endMs) {
                      if (mod.action === 'delete') {
                          valRaw = NaN;
                      } else {
                          valRaw = (valRaw * mod.scale) + mod.offset;
                      }
                  }
              }
          }

          processed.push({
            timestamp: dateObj,
            raw: isNaN(valRaw) ? NaN : parseFloat(valRaw.toFixed(3)),
            combined: NaN, // will be computed after outlier detection
            allSamples,
            filtered: 0,
            interpolated: NaN,
            isOutlier: false
          });
        }

        if (processed.length === 0) {
          alert("Gagal memproses data. Kolom sensor atau format waktu mungkin salah.");
          setIsLoading(false);
          return;
        }

        // --- Data Regularization (Infer missing rows & Gap Definition) ---
        processed.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());

        let dts = [];
        for (let i = 0; i < processed.length - 1; i++) {
            dts.push(processed[i+1].timestamp.getTime() - processed[i].timestamp.getTime());
        }
        dts.sort((a,b) => a - b);
        const dt = dts.length > 0 ? dts[Math.floor(dts.length / 2)] : 60000;

        const regularized: TideRecord[] = [];
        let currIdx = 0;
        const startT = processed[0].timestamp.getTime();
        const endT = processed[processed.length - 1].timestamp.getTime();

        for (let t = startT; t <= endT; t += dt) {
            while (currIdx < processed.length && processed[currIdx].timestamp.getTime() < t - dt / 2) {
                currIdx++;
            }
            if (currIdx < processed.length && Math.abs(processed[currIdx].timestamp.getTime() - t) <= dt / 2) {
                const rec = processed[currIdx];
                regularized.push({ ...rec, timestamp: new Date(t) });
            } else {
                regularized.push({
                    timestamp: new Date(t),
                    raw: NaN,
                    combined: NaN,
                    filtered: 0,
                    interpolated: NaN,
                    isOutlier: false
                });
            }
        }
        processed = regularized;
        // -----------------------------------------------------------------

        // Phase 1.5: Gross error removal (flat value > 60 mins check)
        for (const s of availableSensors) {
             let flatCount = 1;
             let flatStartIndex = 0;
             let lastVal = s === currentSensor ? processed[0]?.raw : processed[0]?.allSamples?.[s];
             
             for (let i = 1; i < processed.length; i++) {
                  const currentVal = s === currentSensor ? processed[i].raw : processed[i].allSamples?.[s];
                  if (!isNaN(currentVal as number) && !isNaN(lastVal as number) && currentVal === lastVal) {
                      flatCount++;
                  } else {
                      if (flatCount * dt > 3600000) {
                          for (let j = flatStartIndex; j < i; j++) {
                              if (s === currentSensor) processed[j].raw = NaN;
                              if (processed[j].allSamples) processed[j].allSamples[s] = NaN;
                          }
                      }
                      flatCount = 1;
                      lastVal = currentVal;
                      flatStartIndex = i;
                  }
             }
             if (flatCount * dt > 3600000) {
                  for (let j = flatStartIndex; j < processed.length; j++) {
                       if (s === currentSensor) processed[j].raw = NaN;
                       if (processed[j].allSamples) processed[j].allSamples[s] = NaN;
                  }
             }
        }

        // Let full processing (outliers, filters) happen, so we just remove the early exit here.

        // 2. Harmonic Outlier Detection (Two-Pass Logic)
        let compsToFit: string[] = [];
        
        const durationHoursCheck = (processed[processed.length - 1].timestamp.getTime() - processed[0].timestamp.getTime()) / 3600000;
        
        if (constituentSet === '4') compsToFit = ['M2', 'S2', 'K1', 'O1'];
        else if (constituentSet === '9') compsToFit = ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4'];
        else if (constituentSet === 'IHO23') compsToFit = ['Sa', 'Ssa', 'Mm', 'Mf', 'Q1', 'O1', 'P1', 'K1', 'J1', '2N2', 'MU2', 'N2', 'NU2', 'M2', 'L2', 'T2', 'S2', 'R2', 'K2', 'MN4', 'M4', 'MS4', 'M6'];
        else if (constituentSet === 'FES2014') compsToFit = ['2N2', 'E2', 'J1', 'K1', 'K2', 'L2', 'La2', 'M2', 'M3', 'M4', 'M6', 'M8', 'Mf', 'MKS2', 'Mm', 'MN4', 'MS4', 'MSf', 'MSqm', 'Mtm', 'Mu2', 'N2', 'N4', 'Nu2', 'O1', 'P1', 'Q1', 'R2', 'S1', 'S2', 'S4', 'Sa', 'Ssa', 'T2'];
        else if (constituentSet === 'AUTO') {
            const rayleighCriterionFreq = 1.0 / durationHoursCheck;
            const priorityList = ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4', 'Q1', 'J1', '2N2', 'MU2', 'NU2', 'L2', 'T2', 'S4', 'M6', 'S6', 'MN4', 'MSf', 'Mf', 'Mm', 'Ssa', 'Sa', 'E2', 'La2', 'M3', 'M8', 'MKS2', 'MSqm', 'Mtm', 'N4', 'R2', 'S1'];
            
            Object.keys(HARMONIC_FREQS).forEach(k => {
                if (!priorityList.includes(k)) priorityList.push(k);
            });
            
            let autoComps: string[] = [];
            priorityList.forEach(c => {
                 if (!HARMONIC_FREQS[c]) return;
                 let canAdd = true;
                 for (let i = 0; i < autoComps.length; i++) {
                     if (Math.abs(HARMONIC_FREQS[c].f - HARMONIC_FREQS[autoComps[i]].f) < rayleighCriterionFreq) {
                         canAdd = false;
                         break;
                     }
                 }
                 if (canAdd) autoComps.push(c);
            });
            compsToFit = autoComps;
            if (autoComps.length > 0) {
               setAutoDiagnostics({ rayleighPassed: autoComps.length, totalTested: Object.keys(HARMONIC_FREQS).length, snrPassed: 0 });
            }
        }
        else compsToFit = Object.keys(HARMONIC_FREQS); // UTIDE (All 67)

        // A. Quick 1st Pass Harmonic Analysis on Raw Data to determine HAT/LAT astronomical bounds
        // For outlier detection "Jalankan Pembersihan", we strictly use "9 Constants (Standard)" as requested
        const roughCompsToFit = ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'M4', 'MS4']; 
        
        const validForRough = processed.filter(r => !isNaN(r.raw));
        const t_hours_raw = validForRough.map(r => (r.timestamp.getTime() - processed[0].timestamp.getTime()) / 3600000);
        const y_vals_raw = validForRough.map(r => r.raw);
        const meanRaw = y_vals_raw.reduce((a, b) => a + b, 0) / (y_vals_raw.length || 1);
        const stdRaw = Math.sqrt(y_vals_raw.map(x => Math.pow(x - meanRaw, 2)).reduce((a, b) => a + b, 0) / (y_vals_raw.length || 1));

        const _isInsufficient = durationHoursCheck < 29 * 24;
        
        let roughZ0 = meanRaw;
        let roughHAT = meanRaw + 3 * stdRaw; // fallback
        let roughLAT = meanRaw - 3 * stdRaw; // fallback
        let roughSolution: number[] = [];

        if (!_isInsufficient) {
            roughSolution = solveLeastSquares(t_hours_raw, y_vals_raw, roughCompsToFit);
            roughZ0 = roughSolution[0] || meanRaw;
            let roughHatAmpSum = 0;
            for (let i = 0; i < roughCompsToFit.length; i++) {
                const a = roughSolution[1 + 2 * i] || 0;
                const b = roughSolution[1 + 2 * i + 1] || 0;
                roughHatAmpSum += Math.sqrt(a * a + b * b);
            }
            if (roughHatAmpSum > 0) {
               roughHAT = roughZ0 + roughHatAmpSum;
               roughLAT = roughZ0 - roughHatAmpSum;
            }
            setDataLengthWarning(null);
        } else {
            setDataLengthWarning("Warning: Panjang data Anda kurang dari 29 piantan (hari). Analisis harmonik dan prediksi pasut tidak dapat dilakukan.");
        }

        // Calculate predicted levels based on rough solution to detect outliers (and store in cache)
        let residualSumX2 = 0;
        let residualCount = 0;
        
        // First pass: compute predicted levels and sum of squared residuals
        processed.forEach(r => {
            const tHour = (r.timestamp.getTime() - processed[0].timestamp.getTime()) / 3600000;
            let predictedLevel = roughZ0;
            if (!_isInsufficient && roughSolution.length > 0) {
                for (let i = 0; i < roughCompsToFit.length; i++) {
                    const comp = roughCompsToFit[i];
                    const freq = HARMONIC_FREQS[comp]?.f || 0;
                    const a = roughSolution[1 + 2 * i] || 0;
                    const b = roughSolution[1 + 2 * i + 1] || 0;
                    const arg = 2 * Math.PI * freq * tHour;
                    predictedLevel += a * Math.cos(arg) + b * Math.sin(arg);
                }
            }
            (r as any).predictedLevel = predictedLevel; // cache the predicted level
            
            if (!isNaN(r.raw)) {
                const res = r.raw - predictedLevel;
                residualSumX2 += res * res;
                residualCount++;
            }
        });
        
        const stdResidual = residualCount > 0 ? Math.sqrt(residualSumX2 / residualCount) : stdRaw;

        processed = processed.map(r => {
            if (isNaN(r.raw)) {
                return { ...r, isOutlier: true };
            }
            // B. Apply Outlier Detection
            const predictedLevel = (r as any).predictedLevel;
            const residual = Math.abs(r.raw - predictedLevel);
            let isStatOutlier = false;
            let isHarmonicOutlier = false;
            
            if (!_isInsufficient) {
                 isHarmonicOutlier = residual > (zThreshold * stdResidual); // use standard deviation of residuals
            } else {
                 isStatOutlier = Math.abs(r.raw - meanRaw) > (zThreshold * stdRaw);
            }
            
            // Limit bounds
            if (r.raw > roughHAT + (zThreshold * stdResidual * 0.5) || r.raw < roughLAT - (zThreshold * stdResidual * 0.5)) {
                 isHarmonicOutlier = true;
            }
            
            // Manual Range Check
            let isManualOutlier = false;
            if (manualMin !== "" && r.raw < (manualMin as number)) isManualOutlier = true;
            if (manualMax !== "" && r.raw > (manualMax as number)) isManualOutlier = true;

            return {
                ...r,
                isOutlier: isStatOutlier || isHarmonicOutlier || isManualOutlier
            };
        });

        // C. Prepare Data Streams
        // 1. Valid (Filtered) Stream: No interpolation, keeping NaNs for gaps/outliers
        const validUnfiltered = new Array(processed.length);

        for (let i = 0; i < processed.length; i++) {
            const r = processed[i];
            const leadValid = r.isOutlier ? NaN : r.raw;
            validUnfiltered[i] = leadValid;

            // Retain existing combined and interpolated if they exist (or leave as NaN)
            // If combinationSettings is explicitly disabled during runAnalysis, we drop it.
            processed[i].combined = combSettings.enabled ? (records[i]?.combined ?? NaN) : NaN;
            processed[i].interpolated = interpSettings.enabled ? (records[i]?.interpolated ?? NaN) : NaN;
        }

        // C. Cleaned Input for Filtering (Still needs continuous data to avoid filter artifacts)  
        // We'll use the interpolated stream if available, but "Valid" output line will be masked by NaNs later.
        const cleanedInput = new Array(processed.length);
        for (let idx = 0; idx < processed.length; idx++) {
            // Internal use for filtering: temporary interpolation for long gaps to maintain filter state
            // but we won't show these in the final 'filtered' (Valid) results where raw was NaN.
            if (!isNaN(validUnfiltered[idx])) {
                cleanedInput[idx] = validUnfiltered[idx];
            } else {
                // Temporary fill for filter stability - using linear trend or roughZ0
                cleanedInput[idx] = roughZ0; 

            }
        }
        
        // Refine cleanedInput for filtering near gaps
        let i = 0;
        while (i < processed.length) {
            if (isNaN(validUnfiltered[i])) {
                let startGap = i;
                let endGap = i;
                while (endGap < processed.length && isNaN(validUnfiltered[endGap])) {
                    endGap++;
                }
                const gapLength = endGap - startGap;
                const prevVal = startGap > 0 ? validUnfiltered[startGap - 1] : roughZ0;
                const nextVal = endGap < processed.length ? validUnfiltered[endGap] : roughZ0;
                for (let j = startGap; j < endGap; j++) {
                    const fraction = (j - startGap + 1) / (gapLength + 1);
                    cleanedInput[j] = prevVal + (nextVal - (isNaN(prevVal) ? roughZ0 : prevVal)) * fraction;
                }
                i = endGap;
            } else {
                i++;
            }
        }

        // 3. Low-Pass Filter Logic (Optimized Sliding Window)
        if (filterType === 'ma') {
          const maSamples = Math.max(1, Math.round((filterWindow * 60000) / dt));
          const n = cleanedInput.length;
          const filteredArr = new Float64Array(n);
          
          let windowSum = 0;
          const half = Math.floor(maSamples / 2);
          
          // Initial window sum
          for (let i = 0; i <= half && i < n; i++) {
            windowSum += cleanedInput[i];
          }
          
          for (let i = 0; i < n; i++) {
            const right = i + half;
            const left = i - half - 1;
            
            if (right < n && right > half) {
              windowSum += cleanedInput[right];
            }
            if (left >= 0) {
              windowSum -= cleanedInput[left];
            }
            
            const start = Math.max(0, i - half);
            const end = Math.min(n - 1, i + half);
            const count = end - start + 1;
            filteredArr[i] = windowSum / count;
          }

          for(let i = 0; i < n; i++) {
            processed[i].filtered = isNaN(validUnfiltered[i]) ? NaN : parseFloat(filteredArr[i].toFixed(3));
          }
        } else if (filterType === 'median') {
          processed = processed.map((r, i) => {
            const start = Math.max(0, i - Math.floor(medianWindow / 2));
            const end = Math.min(cleanedInput.length, i + Math.ceil(medianWindow / 2));
            const windowVals = cleanedInput.slice(start, end);
            windowVals.sort((a, b) => a - b);
            const median = windowVals[Math.floor(windowVals.length / 2)];
            const filteredVal = isNaN(validUnfiltered[i]) ? NaN : parseFloat(median.toFixed(3));
            return { ...r, filtered: filteredVal };
          });
        } else if (filterType === 'butterworth') {
            const wc = Math.tan(Math.PI * butterCutoff);
            const k1 = Math.SQRT2 * wc;
            const k2 = wc * wc;
            const a0 = 1 + k1 + k2;
            const b0 = k2 / a0;
            const b1 = 2 * b0;
            const b2 = b0;
            const a1 = 2 * (k2 - 1) / a0;
            const a2 = (1 - k1 + k2) / a0;

            const output = new Array(cleanedInput.length).fill(0);
            for(let i = 0; i < cleanedInput.length; i++) {
                if (i < 2) {
                    output[i] = cleanedInput[i];
                } else {
                    output[i] = b0 * cleanedInput[i] + b1 * cleanedInput[i-1] + b2 * cleanedInput[i-2] - a1 * output[i-1] - a2 * output[i-2];
                }
            }
            
            processed = processed.map((r, i) => ({
                ...r,
                filtered: isNaN(validUnfiltered[i]) ? NaN : parseFloat(output[i].toFixed(3))
            }));
        }

        // D. Final Output Assignment
        processed = processed.map((r, idx) => {
            // Mask filtering results where original data was missing or outlier
            // As requested: "Hilangkan fungsi interpolasi untuk mengisi gap pada penghitungan nilai 'Valid'"
            const filteredValue = isNaN(validUnfiltered[idx]) ? NaN : r.filtered;
            return {
                ...r,
                filtered: filteredValue
            };
        });

        // Store the final Valid data in our cache
        const finalValid = processed.map(r => r.filtered);
        const updatedCache = { ...validCache, [currentSensor]: finalValid };
        setValidCache(updatedCache);
        
        // As requested: Trigger for Combined and Interpolated are from their respective buttons.
        // So we do NOT automatically recalculate combination and interpolation here.
        // We just retain them from records (done above) or let them stay NaN.

        if (!forceFullAnalysis) {
             requestAnimationFrame(() => {
               setRecords(processed);
             });
             return;
        }

        // 4. Final Precise Harmonic Analysis (on the mathematically cleaned and filtered data)
        const validForFinal = processed.filter(r => !isNaN(r.filtered));
        const t_hours = validForFinal.map(r => (r.timestamp.getTime() - processed[0].timestamp.getTime()) / 3600000);
        const y_vals = validForFinal.map(r => r.filtered);
        
        let fittedZ0 = meanRaw;
        let results: ConstituentResult[] = [];
        
        let unifiedSlope = 0;
        let unifiedIntercept = fittedZ0;
        
        if (!_isInsufficient) {
            // First, calculate simple linear trend to detrend the data before harmonic analysis
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            const n = t_hours.length;
            for (let i = 0; i < n; i++) {
                sumX += t_hours[i];
                sumY += y_vals[i];
                sumXY += t_hours[i] * y_vals[i];
                sumX2 += t_hours[i] * t_hours[i];
            }
            unifiedSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            unifiedIntercept = (sumY - unifiedSlope * sumX) / n;
            
            // Detrend the data
            const y_detrended = y_vals.map((y, i) => y - (unifiedSlope * t_hours[i]));

            const solution = solveLeastSquares(t_hours, y_detrended, compsToFit);
            fittedZ0 = solution[0] || meanRaw;
            
            // Calculate residuals for ANOVA/SNR
            let residualVariance = 0;
            if (constituentSet === 'AUTO') {
               let sumResSq = 0;
               for (let i = 0; i < t_hours.length; i++) {
                   let fitVal = fittedZ0;
                   for (let j = 0; j < compsToFit.length; j++) {
                       const a = solution[1 + 2 * j] || 0;
                       const b = solution[1 + 2 * j + 1] || 0;
                       const phaseArg = 2 * Math.PI * HARMONIC_FREQS[compsToFit[j]].f * t_hours[i];
                       fitVal += a * Math.cos(phaseArg) + b * Math.sin(phaseArg);
                   }
                   sumResSq += Math.pow(y_detrended[i] - fitVal, 2);
               }
               residualVariance = sumResSq / Math.max(1, t_hours.length - compsToFit.length * 2 - 1);
            }
            
            let snrPassedCount = 0;
            
            results = compsToFit.map((c, i) => {
                const a = solution[1 + 2 * i] || 0;
                const b = solution[1 + 2 * i + 1] || 0;
                const amp = Math.sqrt(a * a + b * b);
                let phase = Math.atan2(b, a) * (180 / Math.PI);
                if (phase < 0) phase += 360;
                
                let snr = 0;
                if (constituentSet === 'AUTO' && residualVariance > 0) {
                    snr = (amp * amp / 2) / (residualVariance / t_hours.length);
                    if (snr > 2) snrPassedCount++; // Conventional significance threshold
                }
                
                return {
                  comp: c,
                  amp,
                  phase,
                  desc: HARMONIC_FREQS[c].d,
                  freq: HARMONIC_FREQS[c].f,
                  snr: constituentSet === 'AUTO' ? snr : undefined
                };
            });
            
            if (constituentSet === 'AUTO') {
                setAutoDiagnostics(prev => prev ? { ...prev, snrPassed: snrPassedCount } : null);
            }
        }

        setZ0(parseFloat(fittedZ0.toFixed(3)));
        setHarmonicResults(results);

        // Chart Datum Calculations
        if (!_isInsufficient) {
            const am2 = results.find(r => r.comp === 'M2')?.amp || 0;
            const as2 = results.find(r => r.comp === 'S2')?.amp || 0;
            const sumAmp = results.reduce((acc, r) => acc + r.amp, 0);
            
            setDatums({
                mhws: fittedZ0 + (am2 + as2),
                mlws: fittedZ0 - (am2 + as2),
                hat: fittedZ0 + sumAmp,
                lat: fittedZ0 - sumAmp
            });
        } else {
            setDatums(null);
        }

        // 5. Linear Trend & Least Squares Analysis with optional De-Tiding
        let validRecords = processed.filter(r => !isNaN(r.filtered) && !r.isOutlier);
        if (validRecords.length > 1) {
            const t0 = processed[0].timestamp.getTime();
            const x = validRecords.map(r => (r.timestamp.getTime() - t0) / 3600000);
            
            // 5a. Linear Regression (Standard)
            const calculateTrend = (dataX: number[], dataY: number[]) => {
                const n = dataX.length;
                let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
                for (let i = 0; i < n; i++) {
                    sumX += dataX[i];
                    sumY += dataY[i];
                    sumXY += dataX[i] * dataY[i];
                    sumX2 += dataX[i] * dataX[i];
                }
                const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                const intercept = (sumY - slope * sumX) / n;
                const rateYear = slope * 24 * 365.25;
                return { slope, intercept, rateYear };
            };

            // Use unified fit values if valid, otherwise fallback to simple regression
            const regTrend = !_isInsufficient 
                ? { slope: unifiedSlope, intercept: unifiedIntercept, rateYear: unifiedSlope * 24 * 365.25 }
                : calculateTrend(x, validRecords.map(r => r.filtered));
            
            const lsqTrend = regTrend;

            // 5c. STL Decomposition-based Trend (Simplified 1-Year Moving Average) for data > 1 year
            let stlTrendData: ReturnType<typeof calculateTrend> | undefined;
            const tEnd = processed[processed.length - 1].timestamp.getTime();
            const durationHours = (tEnd - t0) / 3600000;
            
            if (durationHours > 8760) {
                const dt_ms = (tEnd - t0) / (processed.length - 1);
                const windowSize = Math.max(1, Math.round((365.25 * 24 * 3600 * 1000) / dt_ms));
                const halfWindow = Math.floor(windowSize / 2);
    
                const yFull = new Float64Array(processed.length);
                yFull.fill(NaN);
                
                const f_list = results.map(r => 2 * Math.PI * r.freq);
                for (let i = 0; i < processed.length; i++) {
                    const r = processed[i];
                    if (!isNaN(r.filtered) && !r.isOutlier) {
                        if (useDeTiding && results.length > 0) {
                            const ti = (r.timestamp.getTime() - t0) / 3600000;
                            let tideSum = 0;
                            for (let k = 0; k < results.length; k++) {
                                tideSum += results[k].amp * Math.cos(f_list[k] * ti - results[k].phase * (Math.PI / 180));
                            }
                            yFull[i] = r.filtered - tideSum;
                        } else {
                            yFull[i] = r.filtered;
                        }
                    }
                }
                
                const stlTrendX: number[] = [];
                const stlTrendY: number[] = [];
                let currentSum = 0;
                let currentCount = 0;
                
                for (let i = 0; i < windowSize && i < yFull.length; i++) {
                    if (!isNaN(yFull[i])) {
                        currentSum += yFull[i];
                        currentCount++;
                    }
                }
                
                for (let i = halfWindow; i < yFull.length - halfWindow; i++) {
                    if (currentCount > (windowSize * 0.25)) { // Output if we have at least 25% of data in the window
                        stlTrendX.push((processed[i].timestamp.getTime() - t0) / 3600000);
                        stlTrendY.push(currentSum / currentCount);
                    }
                    
                    const outgoingIdx = i - halfWindow;
                    if (outgoingIdx >= 0 && !isNaN(yFull[outgoingIdx])) {
                        currentSum -= yFull[outgoingIdx];
                        currentCount--;
                    }
                    const incomingIdx = outgoingIdx + windowSize;
                    if (incomingIdx < yFull.length && !isNaN(yFull[incomingIdx])) {
                        currentSum += yFull[incomingIdx];
                        currentCount++;
                    }
                }
                
                if (stlTrendX.length > 2) {
                    stlTrendData = calculateTrend(stlTrendX, stlTrendY);
                }
            }

            setLinearTrend({ ...regTrend, lsqTrend, stlTrend: stlTrendData });
            
            // Calculate RMSE
            let sumSqE = 0, countE = 0;
            const rt0 = processed[0].timestamp.getTime();
            processed.forEach(r => {
                if (!r.isOutlier && !isNaN(r.filtered)) {
                    const rt = (r.timestamp.getTime() - rt0) / 3600000;
                    let p = fittedZ0;
                    if (!_isInsufficient) {
                        p += unifiedSlope * rt;
                    }
                    results.forEach(res => {
                        const w = 2 * Math.PI * res.freq;
                        const ph = res.phase * (Math.PI / 180);
                        p += res.amp * Math.cos(w * rt - ph);
                    });
                    sumSqE += Math.pow(r.filtered - p, 2);
                    countE++;
                }
            });
            const rVal = countE > 0 ? Math.sqrt(sumSqE / countE) : 0;
            setRmseVal(rVal);
        }

        requestAnimationFrame(() => {
          setRecords(processed);
        });
      } catch (err) {
        console.error("Analysis error", err);
      } finally {
        setIsLoading(false);
        isProcessing.current = false;
      }
    }, 500);
  };

  const runCombination = (settings: typeof combinationSettings) => {
      setCombinationSettings(settings);
      if (!records.length) return;
      const currentSensor = selectedSensor;
      const updatedRecords = [...records];
      
      if (!settings.enabled) {
         for (let i = 0; i < updatedRecords.length; i++) {
             updatedRecords[i].combined = NaN;
         }
      } else {
         for (let i = 0; i < updatedRecords.length; i++) {
             let combinedVal = validCache[currentSensor]?.[i] ?? NaN;
             if (isNaN(combinedVal)) {
                 for (const source of settings.sourceSensors) {
                     const srcValid = validCache[source]?.[i];
                     if (srcValid !== undefined && !isNaN(srcValid)) {
                         combinedVal = srcValid;
                         break;
                     }
                 }
             }
             updatedRecords[i].combined = combinedVal;
         }
      }
      
      // Every time we update combination, we must re-evaluate interpolation on top of it.
      const finalRecords = doInterpolation(interpolationSettings, updatedRecords);
      setRecords(finalRecords);
  };

  const runInterpolation = (settings: typeof interpolationSettings) => {
      setInterpolationSettings(settings);
      if (!records.length) return;
      
      const updatedRecords = doInterpolation(settings, records);
      setRecords(updatedRecords);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(files.length === 1 ? files[0].name : `${files.length} Files Selected`);
      setIsLoading(true);

      try {
        const filePromises = Array.from(files).map((file) => {
          return new Promise<Papa.ParseResult<any>>((resolve, reject) => {
            // First read as text to detect special formats
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const lines = text.trim().split('\n');
                if (lines.length > 0) {
                    const firstLine = lines[0];
                    // Split by tabs or multiple spaces first
                    let p = firstLine.split(/\t|\s{2,}/).filter(x => x.trim() !== "");
                    
                    // IF we have only 2 parts and it's not a full timestamp, maybe it's space delimited
                    if (p.length < 3) {
                        p = firstLine.split(/\s+/).filter(x => x.trim() !== "");
                    }

                    if (p.length >= 2) {
                        const testFormats = ['dd/MM/yyyy HH:mm:ss', 'dd/MM/yyyy HH:mm', 'ddMMyyyy HH:mm', 'dd-MM-yyyy HH:mm', 'yyyy-MM-dd HH:mm:ss', 'dd-MM-yyyy HH:mm:ss', 'yyyy-MM-dd HH:mm'];
                        
                        // Strategy 1: Column 1 is full timestamp
                        const raw1 = p[0].trim();
                        let isStrategy1 = false;
                        for (const fmt of testFormats) {
                            if (isValid(parse(raw1, fmt, new Date()))) {
                                isStrategy1 = true;
                                break;
                            }
                        }
                        
                        // Strategy 2: Column 1 + Column 2 is timestamp
                        const tsCombined = (p[0].trim() + " " + p[1].trim()).trim();
                        let isStrategy2 = false;
                        for (const fmt of testFormats) {
                            if (isValid(parse(tsCombined, fmt, new Date()))) {
                                isStrategy2 = true;
                                break;
                            }
                        }

                        if (isStrategy2 && p.length >= 3) {
                            // Format: Date | Time | Val...
                            setTimeout(() => {
                                const data = lines.map(line => {
                                    const parts = line.split(/\t|\s+/).filter(x => x.trim() !== "");
                                    const obj: any = { 'Timestamp': (parts[0]?.trim() + " " + parts[1]?.trim()).trim() };
                                    for (let i = 2; i < parts.length; i++) {
                                        obj[`Sensor ${i - 1} (cm)`] = parts[i]?.trim();
                                    }
                                    return obj;
                                });
                                resolve({ data, meta: { fields: Object.keys(data[0]) }, errors: [] } as any);
                            }, 50);
                            return;
                        } else if (isStrategy1) {
                            // Format: FullTimestamp | Val...
                            setTimeout(() => {
                                const data = lines.map(line => {
                                    const parts = line.split(/\t|\s{2,}/).filter(x => x.trim() !== "");
                                    const obj: any = { 'Timestamp': parts[0].trim() };
                                    for (let i = 1; i < parts.length; i++) {
                                        obj[`Sensor ${i} (cm)`] = parts[i]?.trim();
                                    }
                                    return obj;
                                });
                                resolve({ data, meta: { fields: Object.keys(data[0]) }, errors: [] } as any);
                            }, 50);
                            return;
                        }
                    }
                }
                
                // Fallback to PapaParse for standard CSVs
                Papa.parse(file, {
                  header: true,
                  skipEmptyLines: true,
                  worker: true,
                  complete: resolve,
                  error: reject
                });
            };
            reader.readAsText(file);
          });
        });

        const results = await Promise.all(filePromises);
        
        // Validate headers if merging multiple files
        if (results.length > 1) {
          const firstHeader = JSON.stringify(results[0].meta.fields);
          for (let i = 1; i < results.length; i++) {
            if (JSON.stringify(results[i].meta.fields) !== firstHeader) {
              alert('Error: File CSV yang di-merge tidak memiliki judul header yang sama persis!');
              setIsLoading(false);
              return; // Abort if headers mismatch
            }
          }
        }

        // Merge Data
        let mergedData: any[] = [];
        results.forEach(res => {
          mergedData = mergedData.concat(res.data);
        });

        const fields = results[0].meta.fields || [];
        const detectedSensors = fields.filter((f:string) => {
           const lowerF = f.toLowerCase();
           return lowerF.includes('(m)') || lowerF.includes('(cm)') || lowerF.startsWith('sensor');
        });
        setAvailableSensors(detectedSensors);
        setVisibleSensors(detectedSensors);
        const initialSensor = detectedSensors.length > 0 ? detectedSensors[0] : '';
        setSelectedSensor(initialSensor);
        setRawData(mergedData);
        setModifiers([]); // Reset modifiers on new file load
        setIsFullAnalysisRun(false);
        runAnalysis(mergedData, initialSensor, verticalOffset, timeOffset, [], isDeTiding, combinationSettings, interpolationSettings, false);
        setActiveTab('dashboard');
        setShowMetadataModal(true);
      } catch (err) {
        alert("Terjadi kesalahan saat membaca file CSV.");
      }
      setIsLoading(false);
    }
  };

  const generatePredictions = () => {
    if (!records.length || !harmonicResults.length) return;
    setIsLoading(true);

    setTimeout(() => {
        try {
            const [sYear, sMonth, sDay] = predStartDate.split('-');
            const start = new Date(Date.UTC(Number(sYear), Number(sMonth) - 1, Number(sDay), 0, 0, 0));
            
            const [eYear, eMonth, eDay] = predEndDate.split('-');
            const end = new Date(Date.UTC(Number(eYear), Number(eMonth) - 1, Number(eDay) + 1, 0, 0, 0));

            if (!isValid(start) || !isValid(end)) {
                alert("Tanggal prediksi tidak valid");
                return;
            }

            const diffHours = Math.ceil((end.getTime() - start.getTime()) / 3600000);
            const diffDays = diffHours / 24;
            
            if (diffHours <= 0) {
                alert("Tanggal akhir harus setelah tanggal awal");
                return;
            }

            const predData = [];
            const t0 = records[0].timestamp.getTime();
            const dailyStats: Record<string, any> = {};

            const calcValue = (d: Date) => {
                const t = (d.getTime() - t0) / 3600000;
                let val = z0;
                harmonicResults.forEach(res => {
                    const w = 2 * Math.PI * res.freq;
                    const ph = res.phase * (Math.PI / 180);
                    val += res.amp * Math.cos(w * t - ph);
                });
                return val;
            };

            for (let h = 0; h <= diffHours; h++) {
                const d = new Date(start.getTime() + h * 3600000);
                const val = calcValue(d);
                const dayKey = formatUTC(d, 'yyyyMMdd');

                if (!dailyStats[dayKey]) dailyStats[dayKey] = { max: -Infinity, min: Infinity };
                if (val > dailyStats[dayKey].max) dailyStats[dayKey].max = val;
                if (val < dailyStats[dayKey].min) dailyStats[dayKey].min = val;

                predData.push({
                    time: formatUTC(d, 'ddMMyy'),
                    fullTime: formatUTC(d, 'dd/MM/yy HH:mm'),
                    value: parseFloat(val.toFixed(3)),
                    timestamp: d,
                    dayKey: dayKey
                });
            }

            // Assign daily extremes
            for (const p of predData) {
                p.dayMax = dailyStats[p.dayKey].max;
                p.dayMin = dailyStats[p.dayKey].min;
            }

            setPredictions(predData);
        } catch (err) {
            console.error("Prediction failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, 300);
  };

  const exportPredictions = (formatType: 'csv' | 'txt') => {
    if (!predictions.length) return;
    
    // Build Fast UTC Formatter for predictions (dd/MM/yyyy HH:mm:ss)
    const formatTimestamp = (date: Date) => {
        const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
        const d = new Date(utcTime);
        const pad = (n: number) => n.toString().padStart(2, '0');
        if (formatType === 'csv') {
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    let content = "";
    if (formatType === 'csv') {
      const lines = ["Timestamp,Predicted Height (m)"];
      predictions.forEach(p => {
        lines.push(`${formatTimestamp(p.timestamp)},${p.value}`);
      });
      content = lines.join('\n');
    } else {
      const lines = [
        `Tide Prediction Report`,
        `Range: ${predStartDate} to ${predEndDate}`,
        `Note: Timestamps are formatted as dd/mm/yyyy hh:mm:ss`,
        `------------------------------------------`
      ];
      predictions.forEach(p => {
          lines.push(`${formatTimestamp(p.timestamp)}\t${typeof p.value === 'number' ? p.value.toFixed(3) : p.value}`);
      });
      content = lines.join('\n');
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tide_prediction_${predStartDate}_${predEndDate}.${formatType}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelections, setExportSelections] = useState<Record<string, boolean>>({});
  const [exportIntervalMode, setExportIntervalMode] = useState<'1_minute' | 'hourly_sampling' | 'hourly_average'>('1_minute');
  const [withHydrasHeader, setWithHydrasHeader] = useState(true);

  const toggleExportSelection = (key: string) => {
      setExportSelections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const exportHYDRAS = () => {
    if (!records.length) return;
    
    const selectedKeys = Object.keys(exportSelections).filter(k => exportSelections[k]);
    if (selectedKeys.length === 0) {
        alert("Pilih setidaknya satu kolom data untuk diekspor.");
        return;
    }

    const isOneMinuteData = records.length > 1 && Math.abs(records[1].timestamp.getTime() - records[0].timestamp.getTime()) >= 59000 && Math.abs(records[1].timestamp.getTime() - records[0].timestamp.getTime()) <= 61000;
    const currentMode = isOneMinuteData ? exportIntervalMode : '1_minute';

    let exportRecords = records;

    if (currentMode === 'hourly_sampling') {
        exportRecords = records.filter(r => r.timestamp.getMinutes() === 0 && r.timestamp.getSeconds() === 0);
    } else if (currentMode === 'hourly_average') {
        const grouped = new Map<number, typeof records>();
        records.forEach(r => {
            const hr = new Date(r.timestamp);
            hr.setMinutes(0, 0, 0);
            const key = hr.getTime();
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(r);
        });

        exportRecords = Array.from(grouped.entries()).map(([ts, group]) => {
            const avgRecord = { ...group[group.length - 1], timestamp: new Date(ts) };
            
            let filteredSum = 0;
            let filteredCount = 0;
            let combinedSum = 0;
            let combinedCount = 0;
            group.forEach(r => {
                if (typeof r.filtered === 'number' && !isNaN(r.filtered)) {
                    filteredSum += r.filtered;
                    filteredCount++;
                }
                if (typeof r.combined === 'number' && !isNaN(r.combined)) {
                    combinedSum += r.combined;
                    combinedCount++;
                }
            });
            avgRecord.filtered = filteredCount > 0 ? filteredSum / filteredCount : NaN;
            avgRecord.combined = combinedCount > 0 ? combinedSum / combinedCount : NaN;

            const avgSamples: Record<string, number> = {};
            if (group[0].allSamples) {
                const sampleKeys = Object.keys(group[0].allSamples);
                sampleKeys.forEach(k => {
                    let sum = 0;
                    let count = 0;
                    group.forEach(r => {
                         if (r.allSamples && typeof r.allSamples[k] === 'number' && !isNaN(r.allSamples[k])) {
                             sum += r.allSamples[k];
                             count++;
                         }
                    });
                    avgSamples[k] = count > 0 ? sum / count : NaN;
                });
            }
            avgRecord.allSamples = avgSamples;

            return avgRecord;
        });
    }

    const lines: string[] = [];
    if (withHydrasHeader) {
        const activeStation = stationNameRef.current || chartTitle;
        lines.push(`Station: ${activeStation}`);
        if (stationLatRef.current || stationLonRef.current) {
            lines.push(`Latitude: ${stationLatRef.current || '-'}`);
            lines.push(`Longitude: ${stationLonRef.current || '-'}`);
        }
        lines.push(`Type: WATERLEVEL`);
        lines.push(`Datum: MSL`);
        lines.push(`Reference: ${isNaN(z0) ? '0.000' : z0.toFixed(3)}`);
        lines.push(`Date Format: DD.MM.YYYY hh:mm:ss`);
        lines.push(`Data Start`);
    }

    // Build Fast UTC Formatter for dd/MM/yyyy HH:mm:ss
    const formatTimestamp = (date: Date) => {
        const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
        const d = new Date(utcTime);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    };

    exportRecords.forEach(r => {
        let rowStr = formatTimestamp(r.timestamp);
        selectedKeys.forEach(k => {
            const getStrVal = (num: number | undefined | null) => {
                if (typeof num !== 'number' || isNaN(num) || num === 999 || num === -999) return '999';
                return Math.round(num * 100).toString();
            };

            if (k.endsWith('(Valid)')) {
                const sensorName = k.replace(' (Valid)', '');
                if (sensorName === selectedSensor) {
                    rowStr += `\t${getStrVal(r.filtered)}`;
                } else {
                    rowStr += `\t${getStrVal(r.allSamples?.[sensorName])}`;
                }
            } else if (k.endsWith('(Combined)')) {
                const sensorName = k.replace(' (Combined)', '');
                if (sensorName === selectedSensor) {
                    rowStr += `\t${getStrVal(r.combined)}`;
                } else {
                     rowStr += `\t${getStrVal(r.allSamples?.[sensorName])}`;
                }
            } else if (k.endsWith('(Interpolated)')) {
                const sensorName = k.replace(' (Interpolated)', '');
                if (sensorName === selectedSensor) {
                    rowStr += `\t${getStrVal(r.interpolated)}`;
                } else {
                     rowStr += `\t${getStrVal(r.allSamples?.[sensorName])}`;
                }
            } else {
                rowStr += `\t${getStrVal(r.allSamples?.[k])}`;
            }
        });
        lines.push(rowStr);
    });

    const content = lines.join('\r\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Export_HYDRAS_${fileName.replace('.csv', '').replace('.txt', '')}.txt`; // Maintain uploaded format
    link.click();
    setShowExportModal(false);
  };

  const exportLogTxt = () => {
    let grossErrors = 0;
    const sensorKey = selectedSensor || availableSensors[0] || '';
    rawData.forEach(row => {
      const valStr = (row[sensorKey] || "").toString().trim();
      let valRaw = parseFloat(valStr.replace(',', '.'));
      if (isNaN(valRaw) || valRaw === 999 || valRaw === -999 || valRaw < -200 || valRaw > 900) {
        grossErrors++;
      }
    });

    const isCurrentCm = sensorKey.toLowerCase().includes('(cm)');

    let logContent = "=========================================================\n";
    logContent += "       BIG TIDAL ANALYSIS - DATA MANIPULATION LOG        \n";
    logContent += "=========================================================\n\n";
    logContent += `Waktu Ekspor      : ${formatUTC(new Date(), 'yyyy-MM-dd HH:mm:ss')} UTC\n`;
    logContent += `Nama File Asli    : ${fileName || 'Tidak ada file'}\n`;
    logContent += `Sensor Dipilih    : ${sensorKey || 'Otomatis'} ${isCurrentCm ? '(dikonversi dari cm ke m)' : '(m)'}\n\n`;
    logContent += "---------------------------------------------------------\n";
    logContent += "LANGKAH MANIPULASI (PARAMETER YANG DIGUNAKAN):\n";
    logContent += "---------------------------------------------------------\n";
    logContent += `1. Value Offset     : ${verticalOffset} m\n`;
    
    const offsetMods = modifiers.filter(m => m.offset !== 0);
    const scaleMods = modifiers.filter(m => m.scale !== 1);
    
    logContent += `2. Local Offset     : ${offsetMods.length} koreksi\n`;
    offsetMods.forEach((m, i) => {
      logContent += `   - Offset [${i+1}]: ${m.offset} m pada sensor target [${m.sensor}] (${formatUTC(new Date(m.startMs), 'yyyy-MM-dd HH:mm')} sd ${formatUTC(new Date(m.endMs), 'yyyy-MM-dd HH:mm')})\n`;
    });

    logContent += `3. Scaling Factor   : ${scaleMods.length} koreksi\n`;
    scaleMods.forEach((m, i) => {
      logContent += `   - Scaling [${i+1}]: multiplier x${m.scale.toFixed(4)} (Referensi: [${m.referenceSensor || 'TBA'}] -> Target: [${m.sensor}]) (${formatUTC(new Date(m.startMs), 'yyyy-MM-dd HH:mm')} sd ${formatUTC(new Date(m.endMs), 'yyyy-MM-dd HH:mm')})\n`;
    });

    logContent += `4. Time Offset      : ${timeOffset} jam\n`;
    logContent += `5. Time Resampling  : otomatis berdasarkan interval data data\n`;
    logContent += `6. Deteksi Outlier  : Z-Score Threshold: ${zThreshold} / Manual Range: [${manualMin === "" ? "none" : manualMin}, ${manualMax === "" ? "none" : manualMax}]\n`;
    logContent += `7. Set Konstanta    : ${constituentSet}\n`;
    logContent += `8. De-Tiding Trend  : ${isDeTiding ? 'Aktif' : 'Tidak Aktif'}\n`;
    logContent += `9. Smoothing Filter : ${filterType} (Window: ${filterType === 'ma' ? filterWindow : filterType === 'median' ? medianWindow : 'N/A'})\n`;
    logContent += `10. Combine Sensors  : ${combinationSettings.enabled ? 'Aktif' : 'Tidak Aktif'}\n`;
    if (combinationSettings.enabled) {
        logContent += `    - Sensor Referensi: ${combinationSettings.referenceSensor}\n`;
        logContent += `    - Sensor Sumber   : ${combinationSettings.sourceSensors.join(', ')}\n`;
    }
    logContent += `11. Interpolasi Gaps: ${interpolationSettings.enabled ? 'Aktif' : 'Tidak Aktif'} (Maks Gap: ${interpolationSettings.maxGapMinutes} menit)\n\n`;
    
    const outlierCount = records.filter(r => r.isOutlier).length;
    const validCount = records.length - outlierCount;

    logContent += "---------------------------------------------------------\n";
    logContent += "STATISTIK DATA:\n";
    logContent += "---------------------------------------------------------\n";
    logContent += `Total Records Awal (Baris)       : ${rawData.length}\n`;
    logContent += `Total Records Akhir (Resampled)  : ${records.length}\n`;
    logContent += `Data Gross Error (Invalid/NaN)   : ${grossErrors}\n`;
    logContent += `Data Terdeteksi Outlier          : ${outlierCount}\n`;
    logContent += `Total Data Valid (Analyzed Data) : ${validCount}\n`;
    if (records.length > 0) {
        logContent += `Periode Data                     : ${formatUTC(records[0].timestamp, 'yyyy-MM-dd HH:mm:ss')} sd ${formatUTC(records[records.length - 1].timestamp, 'yyyy-MM-dd HH:mm:ss')}\n`;
    }
    logContent += `Status Peringatan                : ${dataLengthWarning ? dataLengthWarning : 'Aman (Durasi mencukupi)'}\n`;
    logContent += "=========================================================\n";

    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tidal_Analysis_Log_${formatUTC(new Date(), 'yyyyMMdd_HHmm')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadUserGuide = () => {
    const content = `# BIG Tidal Analysis - Scientific User Guide

## Pengantar
Aplikasi BIG Tidal Analysis dirancang untuk memproses, menganalisis, dan memodelkan data pasut (pasang surut) laut. Algoritma yang diimplementasikan dalam aplikasi ini didasarkan pada fondasi matematika dan statistik yang kuat yang berstandar internasional. Dokumen ini menjelaskan kerangka teori ilmiah dari setiap fitur pengolahan data.

---

## 1. Outlier Detection (Deteksi Data Ekstrem)
Aplikasi ini menggunakan metode Z-Score dan Manual Range untuk membuang anomali atau *spike* dalam observasi data pasut.

### a. Z-Score (Standard Score)
Algoritma Z-Score mengukur seberapa jauh suatu data tunggal menyimpang dari nilai rata-rata sampelnya, diekspresikan dalam satuan standar deviasi.
- **Teori:** Jika data berdistribusi normal, 99.7% dari data akan berada dalam rentang Z-Score antara -3 hingga 3 (aturan empiris 68-95-99.7).
- **Implementasi:** Aplikasi menghitung *Mean* (Rata-rata) dan *Standard Deviation* dari keseluruhan deret waktu. Data yang memiliki nilai absolut Z-Score $|Z| > Threshold$ (default 3.0) diidentifikasi sebagai outlier. Algoritma ini bersifat iteratif hingga batas maksimum eliminasi (15% dari total observasi) untuk mencegah hilangnya data pasut aktual seperti saat terjadi badai (*storm surge*).

### b. Manual Range Filter
Terkadang malfungsi sensor menghasilkan lonjakan data (misal: -999 atau +9999). Filter ini bekerja dari segi fisik ambang batas (*physical thresholds*), yang secara deterministik memotong data observasi:
$Data\_Valid = \\{ x \\in X \\mid Min \\leq x \\leq Max \\}$

---

## 2. Low Pass Filter (Smoothing Data)
Karena data sering kali mengandung noise instrumental berfrekuensi tinggi atau efek gelombang angin pendek, data di-smoothing.

### a. Moving Average (Rata-rata Bergerak)
Filter konvolusi *low-pass* linear yang meratakan data dengan mengambil nilai rata-rata dalam rentang selang waktu *window* tertentu.
- **Teori:** Meratakan deret waktu dengan mengurangi varian acak. Pada data oseanografi, *window* yang umum digunakan terpusat (*centered moving average*) agar tidak terjadi pergeseran fase (phase shift) dalam gelombang. 
- **Persamaan:** $\\hat{x}_t = \\frac{1}{2k+1} \\sum_{i=-k}^{k} x_{t+i}$
  (Di mana window size = $2k+1$)

### b. Median Filter
Filter non-linear yang sangat efektif untuk membuang noise *salt-and-pepper* atau paku-paku durasi pendek tanpa menghaluskan atau mendistorsi bentuk asli puncak dan lembah dari gelombang pasut (yang sangat rentan rusak oleh rata-rata bergerak).

---

## 3. Harmonic Analysis (Analisis Kuadrat Terkecil / Least Squares Method)
Metode ini digunakan untuk mengekstraksi parameter konstanta harmonik pasut yang memengaruhi elevasi muka air berdasarkan periode astronomis (bulan dan matahari).

### Teori Analisis Harmonik
Ketinggian muka laut setiap saat $h(t)$ dipresentasikan sebagai kombinasi deret harmonik (Fourier):
$h(t) = Z_0 + \\sum_{i=1}^{N} A_i \\cos(\\omega_i t - \\Phi_i)$
- $Z_0$ = Mean Sea Level (MSL) jangka panjang (atau *vertical offset* pada stasiun tersebut).
- $A_i$ = Amplitudo (besaran efek gravitasi / gaya pembangkit pasut konstituen ke-i).
- $\\omega_i$ = Frekuensi angular/sudut dari konstituen ke-i yang dihitung matematis dari lintasan bulan dan matahari (konstan).
- $\\Phi_i$ = Fase (kelambatan sudut waktu, *Phase Lag*).

### Resolusi Matriks Least Squares OLS (Ordinary Least Squares)
Aplikasi ini melinierisasi persamaan di atas lewat identitas trigonometri. Algoritma ini menggunakan regresi kuadrat terkecil multivariabel, secara analitik dipecahkan dengan Dekomposisi Cholesky (Cholesky Decomposition) untuk kestabilan numerik tertinggi. Variabel matriks disusun sebagai konstanta $\\cos(\\omega_i t)$ dan $\\sin(\\omega_i t)$ dari tiap konstituen (M2, S2, K1, O1, dsb).

---

## 4. De-Tiding & Sea Level Trend (Analisis Tren Kenaikan Muka Air Laut)
Untuk melihat sinyal dari perubahan iklim, efek gelombang osilatif pasut astronomi harus dibuang (De-tiding).

### a. Linear Regression
Kecocokan *Best Fit Line* dari data ter-dekontruksi. Digunakan persamaan regresi linear $y_t = a + b \\cdot t$, di mana *slope* $b$ adalah rata-rata kecepatan Sea Level Rise (misal milimeter/tahun).

### b. STL Decomposition (Seasonal and Trend decomposition using Loess)
Pendekatan non-parametrik yang memisahkan deret waktu ke dalam tiga komponen:
$Y_t = T_t + S_t + R_t$ (Trend + Seasonality + Remainder)
Aplikasi ini mengekstraksi komponen Tren ($T_t$) dari data harian yang telah diproses (*Daily Averaging*). Trend jangka panjang ini tidak bergantung pada regresi yang linear sempurna, namun menangkap variasi dekadal dari kenaikan air laut secara dinamis dengan regresi polinomial lokal berseri.

---

## 5. Chart Datums & Range (Elevasi Referensi Peta)
Setelah analisis didapatkan, algoritma mensintesis datum elevasi untuk kebutuhan hidrografik.
- **HAT / LAT (Highest / Lowest Astronomical Tide):** Estimasi batas surut dan pasang terjauh murni secara teoritis berdasarkan konstituen penggerak (tergantung kepada interaksi semua konstituen).
- **MHWS / MLWS (Mean High / Low Water Springs):** Rata-rata pasang dan surut tertinggi yang biasanya diasosiasikan dengan konstanta utama semi-diurnal (2 komponen terbesar): $Z_0 \\pm (M_2 + S_2)$.
- **MSL (Mean Sea Level):** Rata-rata Muka Air Laut, didapatkan secara iteratif ekuivalen denga konstanta $Z_0$ di Least Squares Fitting.

---
Dokumen dan pemodelan ini dirancang mengikuti pedoman IHO (International Hydrographic Organization) serta publikasi resmi rujukan oseanografi dari BIG.`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tidal_Analysis_Scientific_User_Guide.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportReport = (formatType: 'csv' | 'txt') => {
    if (!records.length) return;

    let content = "";
    if (formatType === 'csv') {
      const lines = [`Timestamp,${selectedSensor || 'Sensor Data'} (m),${selectedSensor || 'Sensor'} Filtered (m),Is Outlier`];
      
      const formatTimestamp = (date: Date) => {
          const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
          const d = new Date(utcTime);
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };

      records.forEach(r => {
        lines.push(`${formatTimestamp(r.timestamp)},${r.raw},${r.filtered},${r.isOutlier}`);
      });
      content = lines.join('\n');
    } else {
      // Calculate Stats
      const t0 = records[0].timestamp.getTime();
      let sumE = 0, sumAbsE = 0, sumSqE = 0, count = 0;
      records.forEach(r => {
        if (!r.isOutlier && !isNaN(r.filtered)) {
            const t = (r.timestamp.getTime() - t0) / 3600000;
            let p = z0;
            if (linearTrend && linearTrend.lsqTrend) {
                p += linearTrend.lsqTrend.slope * t;
            }
            harmonicResults.forEach(res => {
                const w = 2 * Math.PI * res.freq;
                const ph = res.phase * (Math.PI / 180);
                p += res.amp * Math.cos(w * t - ph);
            });
            const e = r.filtered - p;
            sumE += e;
            sumAbsE += Math.abs(e);
            sumSqE += e * e;
            count++;
        }
      });
      const me = count > 0 ? (sumE / count) : 0;
      const mae = count > 0 ? (sumAbsE / count) : 0;
      const rmse = count > 0 ? Math.sqrt(sumSqE / count) : 0;

      content = `Tide Analysis Report\t${fileName}\n`;
      const sName = stationNameRef.current;
      const sLat = stationLatRef.current;
      const sLon = stationLonRef.current;
      if (sName || sLat || sLon) {
          content += `Station Name\t${sName || '-'}\n`;
          content += `Latitude\t${sLat ? Number(sLat).toFixed(6) : '-'}\n`;
          content += `Longitude\t${sLon ? Number(sLon).toFixed(6) : '-'}\n`;
      }
      if (records.length > 0) {
          const tStart = records[0].timestamp;
          const tEnd = records[records.length - 1].timestamp;
          const durationDays = (tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24);
          content += `Data Start\t${tStart.toLocaleString()}\n`;
          content += `Data End\t${tEnd.toLocaleString()}\n`;
          content += `Data Duration\t${durationDays.toFixed(2)} days\n`;
      }
      content += `Generated\t${new Date().toLocaleString()}\n\n`;

      content += `--- CHART DATUMS & TIDAL RANGES ---\n`;
      content += `Parameter\tValue\tUnit\n`;
      content += `MSL (Mean Sea Level)\t${z0.toFixed(3)}\tm\n`;
      if (datums) {
          const am2 = harmonicResults.find(r => r.comp === 'M2')?.amp || 0;
          const as2 = harmonicResults.find(r => r.comp === 'S2')?.amp || 0;
          const ak1 = harmonicResults.find(r => r.comp === 'K1')?.amp || 0;
          const ao1 = harmonicResults.find(r => r.comp === 'O1')?.amp || 0;
          
          let tidalType = "Unknown";
          const d = am2 + as2;
          if (d !== 0) {
              const f = (ak1 + ao1) / d;
              if (f <= 0.25) tidalType = "Semi-diurnal (Pasang Surut Ganda)";
              else if (f <= 1.5) tidalType = "Mixed, mainly semi-diurnal (Campuran Condong Ganda)";
              else if (f <= 3.0) tidalType = "Mixed, mainly diurnal (Campuran Condong Tunggal)";
              else tidalType = "Diurnal (Pasang Surut Tunggal)";
          }

          const meanSpringTide = 2 * (am2 + as2);
          const meanNeapTide = 2 * Math.abs(am2 - as2);
          const maxAstroRange = datums.hat - datums.lat;

          content += `HAT (Highest Astronomical Tide)\t${datums.hat.toFixed(3)}\tm\n`;
          content += `MHWS (Mean High Water Springs)\t${datums.mhws.toFixed(3)}\tm\n`;
          content += `MLWS (Mean Low Water Springs)\t${datums.mlws.toFixed(3)}\tm\n`;
          content += `LAT (Lowest Astronomical Tide)\t${datums.lat.toFixed(3)}\tm\n`;
          content += `Mean Spring Tide\t${meanSpringTide.toFixed(3)}\tm\n`;
          content += `Mean Neap Tide\t${meanNeapTide.toFixed(3)}\tm\n`;
          content += `Maximum Astronomical Tidal Range\t${maxAstroRange.toFixed(3)}\tm\n`;
          content += `Tidal Type (Formzahl)\t${tidalType}\t-\n`;
      }

      if (linearTrend) {
          content += `\n--- SEA LEVEL TREND ---\n`;
          content += `Method\tRate\tUnit\n`;
          if (linearTrend.stlTrend) {
              content += `STL Decomposition\t${linearTrend.stlTrend.rateYear.toFixed(4)}\tm/year\n`;
          }
          content += `Linear Regression\t${linearTrend.rateYear.toFixed(4)}\tm/year\n`;
      }

      content += `\n--- MODEL ACCURACIES (Harmonic vs Analyzed) ---\n`;
      content += `Parameter\tValue\tUnit\n`;
      content += `RMSE (Root Mean Square Error)\t${rmse.toFixed(4)}\tm\n`;
      content += `MAE (Mean Absolute Error)\t${mae.toFixed(4)}\tm\n`;
      content += `ME (Mean Error)\t${me.toFixed(4)}\tm\n\n`;

      content += `--- HARMONIC CONSTITUENTS ---\n`;
      content += `Comp\tAmp (m)\tPhase (deg)\tDesc\n`;
      harmonicResults.forEach(r => {
        content += `${r.comp}\t${r.amp.toFixed(3)}\t${r.phase.toFixed(3)}\t${r.desc}\n`;
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
      <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col p-6 shrink-0 shadow-sm z-20 relative">
        <button 
          onClick={() => setActiveTab('readme')}
          className="flex items-center gap-2 font-extrabold text-xl text-[#0284c7] mb-10 hover:opacity-80 transition-opacity text-left"
          title="Baca Petunjuk Penggunaan"
        >
          <span className="text-2xl">🌊</span>
          <span>Tide Tools</span>
        </button>
        
        <nav className="flex-1 space-y-1">
          {['dashboard', 'validate', 'harmonic', 'predictions', 'summarize', 'about'].map((tab) => (
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
              {tab === 'validate' && <Search size={18} />}
              {tab === 'harmonic' && <Piano size={18} />}
              {tab === 'predictions' && <TrendingUp size={18} />}
              {tab === 'summarize' && <MapIcon size={18} />}
              {tab === 'about' && <Info size={18} />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          {availableSensors.length > 0 && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-display">Sensor Terdeteksi</label>
              <select 
                value={selectedSensor}
                onChange={(e) => {
                  setSelectedSensor(e.target.value);
                  setIsFullAnalysisRun(false);
                  runAnalysis(rawData, e.target.value, verticalOffset, timeOffset, modifiers, isDeTiding, combinationSettings, interpolationSettings, false);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-100 cursor-pointer hover:border-sky-300 transition-colors"
              >
                {availableSensors.map(sensor => (
                  <option key={sensor} value={sensor}>{sensor}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5 pt-4 border-t border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-display">Custom Chart Title</label>
            <input 
              type="text"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              placeholder="Enter chart name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-100 placeholder:text-slate-400 mb-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-display">V-Offset (m)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={vOffsetStr}
                  placeholder="0.00"
                  onChange={(e) => setVOffsetStr(e.target.value)}
                  onBlur={() => {
                      const val = parseFloat(vOffsetStr) || 0;
                      if (val !== verticalOffset) {
                          setVerticalOffset(val);
                          runAnalysis(rawData, selectedSensor, val, timeOffset, modifiers, isDeTiding, combinationSettings, interpolationSettings, isFullAnalysisRun);
                      }
                  }}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                          e.currentTarget.blur();
                      }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-100"
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-display">T-Offset (Hr)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={tOffsetStr}
                  placeholder="0.0"
                  onChange={(e) => setTOffsetStr(e.target.value)}
                  onBlur={() => {
                      const val = parseFloat(tOffsetStr) || 0;
                      if (val !== timeOffset) {
                          setTimeOffset(val);
                          runAnalysis(rawData, selectedSensor, verticalOffset, val, modifiers, isDeTiding, combinationSettings, interpolationSettings, isFullAnalysisRun);
                      }
                  }}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                          e.currentTarget.blur();
                      }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-100"
                />
            </div>
          </div>
          
          <div className="hidden">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-display flex items-center gap-1 cursor-pointer" title="Centang jika waktu di file data Anda merupakan waktu UTC. Menghindari shift akibat timezone lokal komputer.">
                <input 
                    type="checkbox" 
                    checked={false} 
                    onChange={(e) => {}} 
                    className="rounded text-[#0284c7] focus:ring-[#0284c7]"
                />
                Input Time is UTC
             </label>
          </div>

            {records.length > 0 && (
              <div className="flex gap-2">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 group flex flex-col items-center justify-center gap-1 py-4 bg-[#0284c7] text-white rounded-xl hover:bg-[#0ea5e9] transition-all shadow-lg shadow-sky-100"
                >
                    <div className="flex items-center gap-2 font-bold text-sm">
                        <Upload size={14} />
                        Import Data
                    </div>
                    <span className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">format file csv, txt</span>
                </button>
              </div>
            )}
            {!records.length && (
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="group w-full flex flex-col items-center justify-center gap-1 py-4 bg-[#0284c7] text-white rounded-xl hover:bg-[#0ea5e9] transition-all shadow-lg shadow-sky-100"
                >
                    <div className="flex items-center gap-2 font-bold text-sm">
                        <Upload size={14} />
                        Import Data
                    </div>
                    <span className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">format file csv, txt</span>
                </button>
            )}
          <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv,.txt" />
          
          <div className="flex items-center gap-3 px-3 py-2 text-[#64748b] text-[10px] font-bold uppercase tracking-wider">
            <div className={cn("w-2 h-2 rounded-full", records.length ? "bg-[#10b981]" : "bg-slate-300")}></div>
            {records.length ? `${records.length} records active` : "No Data Loaded"}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
        <header className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <a href="https://www.big.go.id" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/Badan_Informasi_Geospasial_logo.png" alt="Logo Badan Informasi Geospasial" className="h-20 w-auto object-contain" referrerPolicy="no-referrer" />
            </a>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">BIG Tidal Analysis</h1>
              <p className="text-sm font-semibold text-sky-700 tracking-wide mt-1">
                 Created by Direktorat Sistem Referensi Geospasial BIG
              </p>
              <p className="text-sm text-[#64748b] mt-1.5">
                {fileName ? `Processing: ${fileName}` : "Silakan import file CSV dengan kolom Timestamp & Data Sensor"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2.5">
            <button 
              onClick={downloadUserGuide}
              className="flex items-center justify-center gap-2 px-4 h-9 bg-slate-100 text-slate-700 rounded-xl text-[11px] font-black tracking-widest hover:bg-slate-200 transition-all uppercase shadow-sm"
            >
              <BookOpen size={14} strokeWidth={3} />
              User Guide
            </button>
            {records.length > 0 && (
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                <button 
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center justify-center gap-2 px-4 h-11 min-w-[150px] bg-rose-600 text-white rounded-xl text-[11px] font-black tracking-widest hover:bg-rose-700 shadow-md shadow-rose-100 transition-all hover:-translate-y-0.5 active:scale-95 uppercase"
                >
                  <Download size={15} strokeWidth={3} />
                  EXPORT HYDRAS
                </button>
                <button 
                  onClick={() => exportReport('csv')}
                  className="flex items-center justify-center gap-2 px-4 h-11 min-w-[150px] bg-emerald-600 text-white rounded-xl text-[11px] font-black tracking-widest hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all hover:-translate-y-0.5 active:scale-95 uppercase"
                >
                  <FileSpreadsheet size={15} strokeWidth={3} />
                  EXPORT CSV
                </button>
                <button 
                  onClick={() => exportReport('txt')}
                  className="flex items-center justify-center gap-2 px-4 h-11 min-w-[150px] bg-slate-800 text-white rounded-xl text-[11px] font-black tracking-widest hover:bg-slate-900 shadow-md shadow-slate-200 transition-all hover:-translate-y-0.5 active:scale-95 uppercase"
                >
                  <FileText size={15} strokeWidth={3} />
                  Generate Report
                </button>
                <button 
                  onClick={exportLogTxt}
                  className="flex items-center justify-center gap-2 px-4 h-11 min-w-[150px] bg-indigo-600 text-white rounded-xl text-[11px] font-black tracking-widest hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all hover:-translate-y-0.5 active:scale-95 uppercase"
                >
                  <ClipboardList size={15} strokeWidth={3} />
                  Export Log
                </button>
              </div>
            )}
          </div>
        </header>
        
        {dataLengthWarning && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-sm animate-in slide-in-from-top-2">
                <div className="flex items-start">
                    <AlertCircle className="text-rose-500 mt-0.5 mr-3" size={20} />
                    <div>
                        <h3 className="text-rose-800 font-bold text-sm">Perhatian</h3>
                        <p className="text-rose-700 text-xs mt-1">{dataLengthWarning}</p>
                    </div>
                </div>
            </div>
        )}

        {!records.length && (activeTab !== 'readme' && activeTab !== 'about' && activeTab !== 'summarize') ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center gap-6 shadow-sm">
            <div className="w-20 h-20 bg-sky-50 rounded-3xl flex items-center justify-center text-[#0284c7] rotate-3 hover:rotate-0 transition-transform duration-300">
              <Waves size={40} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Siap Menganalisis Pasang Surut?</h2>
              <p className="text-slate-500 max-w-sm mx-auto mt-2 text-[13px] leading-relaxed">
                Import file CSV atau TXT Anda. Kami akan menangani outlier, filter, dan prediksi secara otomatis.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-10 py-4 bg-[#0284c7] text-white rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-sky-200 uppercase tracking-widest text-sm"
                >
                  Import Data
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">format file: csv, txt</span>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {(activeTab === 'readme' || activeTab === 'about') && (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-xl font-bold font-display text-slate-800">{activeTab === 'about' ? 'About Tide Tools' : 'Petunjuk Penggunaan'}</h2>
                            {activeTab === 'about' && (
                                <p className="text-sm text-slate-500 mt-1">Laman ini tersinkronisasi otomatis (Live Sync) dari repository Github master file.</p>
                            )}
                        </div>
                        {activeTab === 'about' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Synced Live
                            </div>
                        )}
                    </div>
                    <div className="prose prose-slate max-w-none prose-headings:font-display prose-headings:font-black prose-headings:text-slate-800 prose-p:font-sans prose-p:text-slate-600 prose-p:leading-relaxed prose-li:font-sans prose-li:text-slate-600 prose-a:text-[#0284c7] prose-img:rounded-2xl prose-img:shadow-md prose-img:border prose-img:border-slate-100 prose-img:w-full prose-img:object-cover">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{readmeContent}</ReactMarkdown>
                    </div>
                </div>
            )}
            {activeTab === 'summarize' && <SummarizeView />}
            {activeTab === 'dashboard' && records.length > 0 && (
                <DashboardView 
                    records={records} 
                    z0={z0} 
                    trend={linearTrend} 
                    datums={datums} 
                    title={chartTitle} 
                    availableSensors={availableSensors}
                    selectedSensor={selectedSensor}
                    rawData={rawData}
                    runAnalysis={runAnalysis}
                    setRecords={setRecords}
                    visibleSensors={visibleSensors}
                    setVisibleSensors={setVisibleSensors}
                    modifiers={modifiers}
                    setModifiers={setModifiers}
                    verticalOffset={verticalOffset}
                    timeOffset={timeOffset}
                    isDeTiding={isDeTiding}
                    setIsDeTiding={setIsDeTiding}
                    combinationSettings={combinationSettings}
                    setCombinationSettings={setCombinationSettings}
                    setShowCombinationModal={setShowCombinationModal}
                    interpolationSettings={interpolationSettings}
                    setInterpolationSettings={setInterpolationSettings}
                    runInterpolation={runInterpolation}
                    onReset={() => {
                        setVerticalOffset(0);
                        setTimeOffset(0);
                        setModifiers([]);
                        setCombinationSettings({ enabled: false, referenceSensor: '', sourceSensors: [] });
                        setInterpolationSettings({ enabled: false, maxGapMinutes: 15 });
                        setValidCache({});
                        setIsFullAnalysisRun(false);
                        
                        // Still run raw analysis without any offsets to recompute raw
                        runAnalysis(rawData, selectedSensor, 0, 0, [], isDeTiding, { enabled: false, referenceSensor: '', sourceSensors: [] }, { enabled: false, maxGapMinutes: 15 }, false);
                    }}
                />
            )}
            
            {showCombinationModal && (
                <CombinationModal 
                    availableSensors={availableSensors}
                    currentSettings={combinationSettings}
                    onCancel={() => setShowCombinationModal(false)}
                    onApply={(settings: any) => {
                        setShowCombinationModal(false);
                        runCombination(settings);
                    }}
                />
            )}
            {activeTab === 'validate' && records.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <OutlierView 
                      records={records} 
                      threshold={zThreshold} 
                      setThreshold={setZThreshold}
                      manualMin={manualMin}
                      setManualMin={setManualMin}
                      manualMax={manualMax}
                      setManualMax={setManualMax}
                      onUpdate={() => { runAnalysis(rawData, selectedSensor, verticalOffset, timeOffset, modifiers, isDeTiding, combinationSettings, interpolationSettings, false); }} 
                    />
                    <FilterView 
                       type={filterType}
                       setType={setFilterType}
                       window={filterWindow} 
                       setWindow={setFilterWindow} 
                       medianWindow={medianWindow}
                       setMedianWindow={setMedianWindow}
                       cutoff={butterCutoff}
                       setCutoff={setButterCutoff}
                       onUpdate={() => { runAnalysis(rawData, selectedSensor, verticalOffset, timeOffset, modifiers, isDeTiding, combinationSettings, interpolationSettings, false); }} 
                    />
                </div>
            )}
            {activeTab === 'harmonic' && records.length > 0 && (
              <div className="space-y-6">
                 <HarmonicView 
                    results={harmonicResults} 
                    rmse={rmseVal} 
                    constituentSet={constituentSet}
                    setConstituentSet={setConstituentSet}
                    onCalculate={() => { 
                        setIsFullAnalysisRun(true); 
                        runAnalysis(rawData, selectedSensor, verticalOffset, timeOffset, modifiers, isDeTiding, combinationSettings, interpolationSettings, true); 
                    }}
                    isCalculating={isLoading}
                    autoDiagnostics={autoDiagnostics}
                 />
              </div>
            )}
            {activeTab === 'predictions' && records.length > 0 && (
                <PredictionView 
                    predictions={predictions} 
                    startDate={predStartDate}
                    endDate={predEndDate}
                    setStartDate={setPredStartDate}
                    setEndDate={setPredEndDate}
                    onGenerate={generatePredictions}
                    onExport={exportPredictions}
                    isLoading={isLoading}
                    title={chartTitle}
                    hasInsufficientData={!!dataLengthWarning}
                />
            )}
            
            {/* Metadata Modal */}
            {showMetadataModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 block">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                      <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                          <div>
                              <h3 className="text-lg font-black text-slate-800 font-display">Metadata Stasiun</h3>
                              <p className="text-xs text-slate-500 font-medium">Lengkapi data stasiun (Opsional)</p>
                          </div>
                      </div>
                      <div className="p-6 space-y-4">
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-display">Nama Stasiun</label>
                              <input 
                                  type="text" 
                                  defaultValue={stationNameRef.current}
                                  onChange={(e) => stationNameRef.current = e.target.value}
                                  placeholder="Contoh: Stasiun Tanjung Priok"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-100"
                              />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-display">Latitude (Degrees)</label>
                              <input 
                                  type="number" 
                                  step="0.000001"
                                  defaultValue={stationLatRef.current}
                                  onChange={(e) => stationLatRef.current = e.target.value}
                                  placeholder="Contoh: -6.103000"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-100"
                              />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-display">Longitude (Degrees)</label>
                              <input 
                                  type="number" 
                                  step="0.000001"
                                  defaultValue={stationLonRef.current}
                                  onChange={(e) => stationLonRef.current = e.target.value}
                                  placeholder="Contoh: 106.883000"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-100"
                              />
                          </div>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                          <button onClick={() => setShowMetadataModal(false)} className="px-6 py-2 bg-[#0284c7] hover:bg-sky-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors">
                              Selesai
                          </button>
                      </div>
                  </div>
              </div>
            )}
            
            {/* Export Modal */}
            {showExportModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                      <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                          <div>
                              <h3 className="text-lg font-black text-slate-800 font-display">Export HYDRAS Format</h3>
                              <p className="text-xs text-slate-500 font-medium mt-1">Pilih data yang ingin diekspor sejajar dengan Timestamp.</p>
                          </div>
                          <button onClick={() => setShowExportModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><X size={20} /></button>
                      </div>
                      <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                          {records.length > 1 && Math.abs(records[1].timestamp.getTime() - records[0].timestamp.getTime()) >= 59000 && Math.abs(records[1].timestamp.getTime() - records[0].timestamp.getTime()) <= 61000 && (
                            <div className="space-y-2 mb-4">
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Opsi Interval Ekspor</div>
                               <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                                   <label className="flex items-center gap-3 cursor-pointer">
                                       <input 
                                           type="radio" 
                                           name="exportInterval" 
                                           value="1_minute" 
                                           checked={exportIntervalMode === '1_minute'} 
                                           onChange={() => setExportIntervalMode('1_minute')}
                                           className="w-4 h-4 text-sky-500 border-slate-300 focus:ring-sky-500"
                                       />
                                       <span className="text-sm font-bold text-slate-700">1 Menit (Original)</span>
                                   </label>
                                   <label className="flex items-center gap-3 cursor-pointer">
                                       <input 
                                           type="radio" 
                                           name="exportInterval" 
                                           value="hourly_sampling" 
                                           checked={exportIntervalMode === 'hourly_sampling'} 
                                           onChange={() => setExportIntervalMode('hourly_sampling')}
                                           className="w-4 h-4 text-sky-500 border-slate-300 focus:ring-sky-500"
                                       />
                                       <span className="text-sm font-bold text-slate-700">Hourly Sampling (Setiap Jam Bulat)</span>
                                   </label>
                                   <label className="flex items-center gap-3 cursor-pointer">
                                       <input 
                                           type="radio" 
                                           name="exportInterval" 
                                           value="hourly_average" 
                                           checked={exportIntervalMode === 'hourly_average'} 
                                           onChange={() => setExportIntervalMode('hourly_average')}
                                           className="w-4 h-4 text-sky-500 border-slate-300 focus:ring-sky-500"
                                       />
                                       <span className="text-sm font-bold text-slate-700">Hourly Average (Rerata 1 Jam)</span>
                                   </label>
                               </div>
                            </div>
                          )}
                          <div className="space-y-2 mb-4">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Opsi Header</div>
                            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={withHydrasHeader} 
                                    onChange={(e) => setWithHydrasHeader(e.target.checked)}
                                    className="w-4 h-4 rounded text-sky-500 border-slate-300 focus:ring-sky-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">Cantumkan Header HYDRAS3</span>
                                    <span className="text-[10px] text-slate-500 font-medium">Beri centang untuk menambah Station, Type, Datum, dsb.</span>
                                </div>
                            </label>
                          </div>
                          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                              <input 
                                  type="checkbox" 
                                  checked={exportSelections['Timestamp'] ?? true} 
                                  readOnly
                                  disabled
                                  className="w-4 h-4 rounded text-sky-500 bg-slate-100 border-slate-300"
                              />
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-700">Timestamp</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Data waktu selalu disertakan (Wajib)</span>
                              </div>
                          </label>
                          
                          <div className="space-y-2">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Raw Sensor Data</div>
                             {availableSensors.map(s => (
                                 <label key={s} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                                     <input 
                                         type="checkbox" 
                                         checked={exportSelections[s] || false} 
                                         onChange={() => toggleExportSelection(s)}
                                         className="w-4 h-4 rounded text-sky-500 border-slate-300 focus:ring-sky-500"
                                     />
                                     <span className="text-sm font-bold text-slate-700">{s}</span>
                                 </label>
                             ))}
                          </div>
                          
                          <div className="space-y-2">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Valid Sensor Data</div>
                             {availableSensors.map(s => (
                                 <label key={`${s} (Valid)`} className="flex items-center gap-3 p-3 rounded-xl border border-sky-200 bg-sky-50/30 cursor-pointer hover:bg-sky-50 transition-colors">
                                     <input 
                                         type="checkbox" 
                                         checked={exportSelections[`${s} (Valid)`] || false} 
                                         onChange={() => toggleExportSelection(`${s} (Valid)`)}
                                         className="w-4 h-4 rounded text-sky-600 border-sky-300 focus:ring-sky-600"
                                     />
                                     <div className="flex flex-col">
                                         <span className="text-sm font-bold text-sky-900">{s}</span>
                                         <span className="text-[10px] text-sky-600 font-medium">Dataset terfilter & offset</span>
                                     </div>
                                 </label>
                             ))}
                          </div>

                          {combinationSettings.enabled && (
                            <div className="space-y-2">
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Combined Sensor Data</div>
                               {availableSensors.map(s => (
                                   <label key={`${s} (Combined)`} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 cursor-pointer hover:bg-emerald-50 transition-colors">
                                       <input 
                                           type="checkbox" 
                                           checked={exportSelections[`${s} (Combined)`] || false} 
                                           onChange={() => toggleExportSelection(`${s} (Combined)`)}
                                           className="w-4 h-4 rounded text-emerald-600 border-emerald-300 focus:ring-emerald-600"
                                       />
                                       <div className="flex flex-col">
                                           <span className="text-sm font-bold text-emerald-900">{s} (Combined)</span>
                                           <span className="text-[10px] text-emerald-600 font-medium">Data gabungan dari sensor lain (Gap-filling)</span>
                                       </div>
                                   </label>
                               ))}
                            </div>
                          )}

                          <div className="space-y-2">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Interpolated Data</div>
                             {availableSensors.map(s => (
                                 <label key={`${s} (Interpolated)`} className="flex items-center gap-3 p-3 rounded-xl border border-rose-200 bg-rose-50/30 cursor-pointer hover:bg-rose-50 transition-colors">
                                     <input 
                                         type="checkbox" 
                                         checked={exportSelections[`${s} (Interpolated)`] || false} 
                                         onChange={() => toggleExportSelection(`${s} (Interpolated)`)}
                                         className="w-4 h-4 rounded text-rose-600 border-rose-300 focus:ring-rose-600"
                                     />
                                     <div className="flex flex-col">
                                         <span className="text-sm font-bold text-rose-900">{s} (Interpolated)</span>
                                         <span className="text-[10px] text-rose-600 font-medium">Gap filling (&le;15 menit)</span>
                                     </div>
                                 </label>
                             ))}
                          </div>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                          <button onClick={() => setShowExportModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">Batal</button>
                          <button onClick={exportHYDRAS} className="px-6 py-2 bg-[#0284c7] hover:bg-sky-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2">
                              <Download size={16} /> Download .txt
                          </button>
                      </div>
                  </div>
              </div>
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

function DashboardView({ records, z0, trend, datums, title, availableSensors, selectedSensor, rawData, runAnalysis, setRecords, visibleSensors, setVisibleSensors, modifiers, setModifiers, verticalOffset, timeOffset, onReset, isDeTiding, setIsDeTiding, combinationSettings, setCombinationSettings, setShowCombinationModal, interpolationSettings, setInterpolationSettings, runInterpolation }: any) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const [vZoom, setVZoom] = useState(1);
  
  // Correction States
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [scaleReference, setScaleReference] = useState<string>('');
  const [scaleTarget, setScaleTarget] = useState<string>('');
  const [offsetReference, setOffsetReference] = useState<string>('');
  const [offsetTarget, setOffsetTarget] = useState<string>('');
  const [localOffset, setLocalOffset] = useState<number>(0);
  
  // Zoom States
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [zoomDomain, setZoomDomain] = useState<{start: number, end: number} | null>(null);
  const [dragAction, setDragAction] = useState<'zoom' | 'delete'>('zoom');
  const [showDifferences, setShowDifferences] = useState<boolean>(false);

  const outliers = useMemo(() => records.filter((r:any) => r.isOutlier).length, [records]);

  const handleLegendClick = (e: any) => {
    let key = e.dataKey;
    if (e.value === "Valid") key = "filtered";
    else if (e.value === "Sea Level Trend") key = "trendline";
    else if (availableSensors.includes(e.value)) key = e.value;
    
    if (typeof key === 'function' && typeof e.value === 'string') {
        key = e.value;
    }
    
    setHiddenLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Consolidate data processing for the chart to avoid multiple full-array mappings
  const displayData = useMemo(() => {
    if (!records.length) return [];
    
    // 1. Determine the domain to sample from
    const domainSearch = zoomDomain || { start: records[0].timestamp.getTime(), end: records[records.length - 1].timestamp.getTime() };
    const domainBuffer = zoomDomain ? (zoomDomain.end - zoomDomain.start) * 0.05 : 0;
    const startMs = domainSearch.start - domainBuffer;
    const endMs = domainSearch.end + domainBuffer;

    // 2. Filter data by domain (if zoomed)
    let filteredRecords = records;
    if (zoomDomain) {
      filteredRecords = records.filter(r => {
        const t = r.timestamp.getTime();
        return t >= startMs && t <= endMs;
      });
    }

    // 3. Sample the filtered data
    // Targeted resolution: ~2000 points for smoothness without lag
    const maxPoints = 2000;
    let sampled;
    if (filteredRecords.length > maxPoints) {
      const step = Math.ceil(filteredRecords.length / maxPoints);
      sampled = filteredRecords.filter((_, i) => i % step === 0);
    } else {
      sampled = filteredRecords;
    }

    // 4. Map only the sampled records to add necessary chart properties (trendline, timeMs)
    const t0 = records[0].timestamp.getTime();
    return sampled.map(r => {
      const timeMs = r.timestamp.getTime();
      return {
        ...r,
        timeMs,
        trendline: trend ? (trend.slope * ((timeMs - t0) / 3600000) + trend.intercept) : undefined
      };
    });
  }, [records, trend, zoomDomain]);

  const handleDragAction = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      if (dragAction === 'delete' && refAreaLeft) {
        const ts = Number(refAreaLeft);
        if (!isNaN(ts)) {
            const newMods = [...modifiers, { startMs: ts, endMs: ts, sensor: selectedSensor, offset: 0, scale: 1, action: 'delete' as const }];
            setModifiers(newMods);
            runAnalysis(rawData, selectedSensor, verticalOffset, timeOffset, newMods, isDeTiding);
        }
      }
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    let startMs = Number(refAreaLeft);
    let endMs = Number(refAreaRight);
    if (startMs > endMs) {
      const temp = startMs;
      startMs = endMs;
      endMs = temp;
    }

    if (dragAction === 'zoom') {
      setZoomDomain({ start: startMs, end: endMs });
    } else if (dragAction === 'delete') {
      const newMods = [...modifiers, { startMs, endMs, sensor: selectedSensor, offset: 0, scale: 1, action: 'delete' as const }];
      setModifiers(newMods);
      runAnalysis(rawData, selectedSensor, verticalOffset, timeOffset, newMods, isDeTiding);
    }
    
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  const zoomOut = () => setZoomDomain(null);

  const applyPartialOffset = () => {
    if (localOffset === 0) return;
    if (records.length === 0) return;

    let startMs, endMs;

    if (zoomDomain) {
        startMs = zoomDomain.start;
        endMs = zoomDomain.end;
    } else {
        startMs = records[0].timestamp.getTime();
        endMs = records[records.length - 1].timestamp.getTime();
    }

    const newMods = [...modifiers, { startMs, endMs, sensor: selectedSensor, offset: localOffset, scale: 1 }];
    setModifiers(newMods);
    runAnalysis(rawData, selectedSensor, verticalOffset, timeOffset, newMods);
    setLocalOffset(0);
    alert(`Partial offset diterapkan pada ${zoomDomain ? 'area zoom' : 'seluruh data'}.`);
  };

  const computePartialOffset = () => {
    if (!offsetReference || !offsetTarget) return;

    let dataToUse = records;
    if (zoomDomain) {
        dataToUse = records.filter((r: any) => r.timestamp.getTime() >= zoomDomain.start && r.timestamp.getTime() <= zoomDomain.end);
    }

    let refSum = 0, targetSum = 0, count = 0;
    dataToUse.forEach((r: any) => {
        const rv = r.allSamples?.[offsetReference];
        const tv = r.allSamples?.[offsetTarget];
        if (typeof rv === 'number' && !isNaN(rv) && typeof tv === 'number' && !isNaN(tv)) {
            refSum += rv;
            targetSum += tv;
            count++;
        }
    });

    if (count > 0) {
        const refMean = refSum / count;
        const targetMean = targetSum / count;
        const diff = refMean - targetMean;
        setLocalOffset(parseFloat(diff.toFixed(3)));
    } else {
        alert("Tidak ada cukup titik data valid dari kedua sensor yang bertumpukan di area ini.");
    }
  };

  const applyScaling = () => {
    if (!scaleReference || !scaleTarget || !scaleFactor) return;
    if (records.length === 0) return;
    
    let startMs, endMs;
    
    if (zoomDomain) {
        startMs = zoomDomain.start;
        endMs = zoomDomain.end;
    } else {
        // Apply globally if no zoom domain is selected
        startMs = records[0].timestamp.getTime();
        endMs = records[records.length - 1].timestamp.getTime();
    }

    const newMods = [...modifiers, { startMs, endMs, sensor: scaleTarget, offset: 0, scale: scaleFactor, referenceSensor: scaleReference }];
    setModifiers(newMods);
    runAnalysis(rawData, selectedSensor, verticalOffset, timeOffset, newMods);
    alert(`Faktor skala ${scaleFactor} diterapkan pada ${zoomDomain ? 'area zoom' : 'seluruh data'} untuk sensor ${scaleTarget}`);
  };

  const undoModifier = () => {
      if (modifiers.length === 0) return;
      const newMods = modifiers.slice(0, -1);
      setModifiers(newMods);
      runAnalysis(rawData, selectedSensor, verticalOffset, timeOffset, newMods);
  };

  const resetModifiers = () => {
      setModifiers([]);
      runAnalysis(rawData, selectedSensor, verticalOffset, timeOffset, []);
  };

  const computeScalingFactor = () => {
    if (!scaleReference || !scaleTarget) return;

    let dataToUse = records;
    if (zoomDomain) {
        dataToUse = records.filter(r => r.timestamp.getTime() >= zoomDomain.start && r.timestamp.getTime() <= zoomDomain.end);
    }

    let refSum = 0, targetSum = 0, count = 0;
    dataToUse.forEach(r => {
        const rv = r.allSamples?.[scaleReference];
        const tv = r.allSamples?.[scaleTarget];
        if (typeof rv === 'number' && !isNaN(rv) && typeof tv === 'number' && !isNaN(tv)) {
            refSum += rv;
            targetSum += tv;
            count++;
        }
    });

    if (count > 1) {
        const refMean = refSum / count;
        const targetMean = targetSum / count;
        let refVar = 0, targetVar = 0;

        dataToUse.forEach(r => {
            const rv = r.allSamples?.[scaleReference];
            const tv = r.allSamples?.[scaleTarget];
            if (typeof rv === 'number' && !isNaN(rv) && typeof tv === 'number' && !isNaN(tv)) {
                refVar += Math.pow(rv - refMean, 2);
                targetVar += Math.pow(tv - targetMean, 2);
            }
        });

        if (targetVar > 0) {
            // Using Standard Deviation Ratio (RMS Ratio of centered signal)
            // This is more robust for purely multiplicative scaling issues in tide measurement
            const scale = Math.sqrt(refVar / targetVar);
            setScaleFactor(parseFloat(scale.toFixed(4)));
        } else {
            alert("Varian target adalah nol, tidak bisa menghitung rasio.");
        }
    } else {
        alert("Tidak ada cukup titik data valid dari kedua sensor yang bertumpukan di area ini.");
    }
  };

  const handleDownload = async (format: 'png' | 'jpeg' | 'pdf') => {
    if (!chartRef.current) return;
    const node = chartRef.current;
    const filter = (el: HTMLElement) => !el.classList?.contains('export-exclude');
    try {
      if (format === 'png') {
        const dataUrl = await htmlToImage.toPng(node, { backgroundColor: '#ffffff', filter });
        download(dataUrl, 'BIG-Tidal-Analysis.png');
      } else if (format === 'jpeg') {
        const dataUrl = await htmlToImage.toJpeg(node, { backgroundColor: '#ffffff', filter, quality: 0.95 });
        download(dataUrl, 'BIG-Tidal-Analysis.jpg');
      } else if (format === 'pdf') {
        const dataUrl = await htmlToImage.toPng(node, { backgroundColor: '#ffffff', filter });
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [node.offsetWidth, node.offsetHeight] });
        pdf.addImage(dataUrl, 'PNG', 0, 0, node.offsetWidth, node.offsetHeight);
        pdf.save('BIG-Tidal-Analysis.pdf');
      }
    } catch (error) { console.error(error); }
  };

  const moonEvents = useMemo(() => getMoonEvents(displayData), [displayData]);

  const yDomain = useMemo(() => {
    if (!displayData.length) return ['auto', 'auto'];
    
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;
    displayData.forEach(d => {
        if (d.raw < min) min = d.raw;
        if (d.raw > max) max = d.raw;
    });
    if (datums) {
        if (datums.lat < min) min = datums.lat;
        if (datums.hat > max) max = datums.hat;
    }
    
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
  }, [displayData, datums, vZoom]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
            <StatCard label="Z0 (MSL)" value={`${isNaN(z0) ? "---" : z0.toFixed(3)} m`} trend="Least Squares Fit" />
            <div className="relative group h-full">
                <StatCard 
                  label="Sea Level Trend" 
                  value={`${trend ? ((trend.stlTrend ? trend.stlTrend.rateYear : trend.rateYear) * 1000).toFixed(2) : "0.00"} mm/y`} 
                  trend={trend?.stlTrend ? "STL Decomposition" : (isDeTiding ? "De-tided Regr" : "Linear Regr")} 
                  trendColor={trend ? ((trend.stlTrend ? trend.stlTrend.rateYear : trend.rateYear) > 0 ? "text-red-500" : "text-emerald-500") : "text-slate-500"} 
                  valueClassName="pl-[3px] pr-[6px]"
                />
                <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white shadow-xl border border-slate-200 p-2 rounded-lg text-[9px] font-bold text-slate-500 min-w-[120px]">
                        <div className="border-b border-slate-100 pb-1 mb-1 text-slate-400 uppercase">Trend Methods</div>
                        {trend?.stlTrend && (
                          <div className="flex justify-between items-center gap-2">
                             <span>STL Trend:</span>
                             <span className="text-slate-800">{(trend.stlTrend.rateYear * 1000).toFixed(2)} mm/y</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center gap-2">
                           <span>Least Square:</span>
                           <span className="text-slate-800">{( (trend?.lsqTrend?.rateYear || 0) * 1000).toFixed(2)} mm/y</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                           <span>Regression:</span>
                           <span className="text-slate-800">{( (trend?.rateYear || 0) * 1000).toFixed(2)} mm/y</span>
                        </div>
                    </div>
                </div>
            </div>
            <StatCard 
              label="HAT / LAT" 
              value={`${datums ? datums.hat.toFixed(2) : '--'} / ${datums ? datums.lat.toFixed(2) : '--'}`} 
              trend="Highest/Lowest" 
              valueClassName="pl-[3px] pr-[4px]"
            />
            <StatCard label="MHWS / MLWS" value={`${datums ? datums.mhws.toFixed(2) : '--'} / ${datums ? datums.mlws.toFixed(2) : '--'}`} trend="High/Low Springs" />
          </div>

          <div className="w-full xl:w-80 space-y-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <Settings size={16} className="text-slate-400" />
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Dashboard Controls</h4>
             </div>
             
             {/* Partial Offset */}
             <div className="space-y-2 p-3 bg-amber-50/50 border border-amber-100 rounded-xl relative">
                <label className="text-[10px] font-bold text-amber-700 flex items-center justify-between">
                    <span>Partial Offset (m)</span>
                    <Clock size={12}/>
                </label>
                
                <div className="grid grid-cols-2 gap-2 mt-1">
                   <select 
                       value={offsetReference} 
                       onChange={(e) => setOffsetReference(e.target.value)}
                       className="bg-white border border-amber-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 outline-none"
                   >
                       <option value="">Ref Sensor...</option>
                       {availableSensors.map((s: string) => <option key={s} value={s}>{s}</option>)}
                   </select>
                   <select 
                       value={offsetTarget} 
                       onChange={(e) => setOffsetTarget(e.target.value)}
                       className="bg-white border border-amber-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 outline-none"
                   >
                       <option value="">Tgt Sensor...</option>
                       {availableSensors.map((s: string) => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="number" step="0.001"
                        value={Number.isNaN(localOffset) ? '' : localOffset}
                        onChange={(e) => setLocalOffset(parseFloat(e.target.value))}
                        className="w-[140.5px] bg-white border border-amber-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-200"
                        placeholder="Offset (m)"
                    />
                    <button onClick={computePartialOffset} className="px-2 py-1.5 border border-amber-300 text-amber-700 bg-white rounded-lg text-[10px] font-black hover:bg-amber-100 transition-colors shadow-sm" title="Auto Align Vertical Means">AUTO</button>
                    <button onClick={applyPartialOffset} className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm uppercase tracking-tighter">FIX</button>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-[9px] text-amber-600/70 italic leading-tight">Apply to zoomed area.</p>
                    {modifiers.length > 0 && (
                        <div className="flex items-center gap-1">
                            <button onClick={undoModifier} className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-200/50 text-amber-700 rounded hover:bg-amber-200 transition-colors">Undo</button>
                            <button onClick={resetModifiers} className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded hover:bg-rose-200 transition-colors">Reset</button>
                        </div>
                    )}
                </div>
             </div>

             {/* Scaling */}
             <div className="space-y-2 p-3 bg-sky-50/50 border border-sky-100 rounded-xl">
                <label className="text-[10px] font-bold text-sky-700">Scaling Correction</label>
                <div className="grid grid-cols-2 gap-2">
                    <select 
                        value={scaleReference} 
                        onChange={(e) => setScaleReference(e.target.value)}
                        className="bg-white border border-sky-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 outline-none"
                    >
                        <option value="">Reference...</option>
                        {availableSensors.map((s: string) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select 
                        value={scaleTarget} 
                        onChange={(e) => setScaleTarget(e.target.value)}
                        className="bg-white border border-sky-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 outline-none"
                    >
                        <option value="">Target...</option>
                        {availableSensors.map((s: string) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex gap-1.5">
                    <input 
                        type="number" step="0.0001"
                        value={Number.isNaN(scaleFactor) ? '' : scaleFactor}
                        onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
                        className="min-w-0 flex-1 bg-white border border-sky-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                        placeholder="Factor"
                    />
                    <button onClick={computeScalingFactor} className="flex-none p-1 px-2 border border-sky-200 text-sky-600 rounded-lg text-[9px] font-extrabold bg-white hover:bg-sky-100 transition-colors" title="Auto Compute Factor">AUTO</button>
                    <button onClick={applyScaling} className="flex-none p-1 px-3 bg-sky-600 text-white rounded-lg text-[9px] font-extrabold hover:bg-sky-700 transition-colors shadow-sm">FIX</button>
                </div>
             </div>

             {/* Trend Analysis Settings */}
             <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Trend & Sync Analysis</label>
                
                <button 
                    onClick={() => setShowCombinationModal(true)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${combinationSettings.enabled ? 'bg-sky-50 border-sky-200 text-sky-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                >
                    <div className={`p-1.5 rounded-lg ${combinationSettings.enabled ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        <Layers size={14} />
                    </div>
                    <div className="flex flex-col items-start text-left">
                        <span className="text-[10px] font-black uppercase tracking-tight">Sensor Combination</span>
                        <span className="text-[9px] font-bold opacity-70 leading-none">{combinationSettings.enabled ? 'Active (Gap Filling)' : 'Click to combine sensors'}</span>
                    </div>
                </button>

                <div className="flex flex-col gap-2 mt-2">
                    <label className="flex items-center gap-2 px-2 py-2 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={interpolationSettings.enabled} 
                            onChange={(e) => {
                                const newVal = { ...interpolationSettings, enabled: e.target.checked };
                                setInterpolationSettings(newVal);
                                runInterpolation(newVal);
                            }} 
                            className="rounded text-rose-900 focus:ring-rose-900 w-3.5 h-3.5"
                        />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-700 leading-tight">Interpolate</span>
                            <span className="text-[8px] text-rose-800 opacity-60 font-medium tracking-tight">Gap Filling (&le; 15m)</span>
                        </div>
                    </label>
                </div>

                <label className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                   <input 
                      type="checkbox" 
                      checked={isDeTiding} 
                      onChange={(e) => {
                         setIsDeTiding(e.target.checked);
                         runAnalysis(rawData, selectedSensor, verticalOffset, timeOffset, modifiers, e.target.checked);
                      }}
                      className="w-3.5 h-3.5 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                   />
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-700 uppercase">Detide Data</span>
                   </div>
                </label>
             </div>

             {/* Multi-sensor toggles */}
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Multi-Sensor Overlay</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {availableSensors.map((s: string) => {
                        const palette = ['#6366f1', '#3b82f6', '#ff00ff', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];
                        const color = palette[availableSensors.indexOf(s) % palette.length];
                        const isActive = visibleSensors.includes(s);
                        return (
                            <button 
                                key={s}
                                onClick={() => setVisibleSensors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                className={cn(
                                    "px-2 py-1 rounded-full text-[9px] font-bold border transition-all shadow-sm",
                                    isActive ? "text-white border-transparent" : "bg-white text-slate-400 border-slate-200"
                                )}
                                style={isActive ? { backgroundColor: color } : {}}
                            >
                                {s}
                            </button>
                        );
                    })}
                </div>
             </div>
             {availableSensors.length > 1 && (
                 <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <label className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                       <input 
                          type="checkbox" 
                          checked={showDifferences} 
                          onChange={(e) => setShowDifferences(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                       />
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-700 uppercase">Tampilkan Grafik Beda Sensor</span>
                       </div>
                    </label>
                 </div>
             )}
          </div>
      </div>

      <div ref={chartRef} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 pt-10 shadow-sm relative">
        <div className="relative mb-8 flex justify-center items-center">
          <h3 className="text-2xl font-black text-slate-800 px-2 font-display text-center">{title}</h3>
          <div className="absolute right-0 -top-4 flex gap-2 export-exclude">
            <button 
                onClick={onReset}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shadow-sm border border-rose-100 mr-2"
                title="Reset all corrections (Offsets, Modifiers, Scaling)"
            >
                <RefreshCw size={14} />
                General Reset
            </button>
            {zoomDomain && (
              <button onClick={zoomOut} className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors mr-4 shadow-sm border border-sky-200"><ZoomOut size={14} /> Reset Zoom X</button>
            )}
            
            <div className="flex bg-slate-100 p-1 rounded-lg mr-4 border border-slate-200">
              <button onClick={() => setDragAction('zoom')} className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wider transition-colors ${dragAction === 'zoom' ? 'bg-white shadow-sm text-sky-700' : 'text-slate-500'}`}>Zoom</button>
              <button onClick={() => setDragAction('delete')} className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wider transition-colors ${dragAction === 'delete' ? 'bg-rose-500 shadow-sm text-white' : 'text-slate-500'}`}>Delete</button>
            </div>

            {modifiers.length > 0 && (
              <button onClick={undoModifier} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors mr-4 shadow-sm border border-amber-200">
                Undo Delete/Mod
              </button>
            )}
            
            <button onClick={() => handleDownload('png')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"><Download size={14} /> PNG</button>
            <button onClick={() => handleDownload('jpeg')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"><Download size={14} /> JPG</button>
            <button onClick={() => handleDownload('pdf')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"><Download size={14} /> PDF</button>
          </div>
        </div>
        <div className="relative h-[580px] w-full group bg-white pt-2 pb-4">
          {dragAction === 'delete' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-rose-50 border border-rose-200 px-4 py-2 rounded-full shadow-lg z-20 flex items-center gap-2 animate-in slide-in-from-top duration-300">
               <Trash2 size={16} className="text-rose-600" />
               <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Delete Mode Aktif: Klik atau Drag untuk menghapus data</span>
            </div>
          )}
          <div className="export-exclude absolute right-2 top-2 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setVZoom(z => z * 1.25)} className="p-1.5 bg-white border border-slate-200 rounded shadow-sm text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-colors" title="Zoom In Vertical">
              <ZoomIn size={14} />
            </button>
            <button onClick={() => setVZoom(1)} className="p-1.5 bg-white border border-slate-200 rounded shadow-sm text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-colors" title="Reset Vertical Zoom">
              <Maximize size={14} />
            </button>
            <button onClick={() => setVZoom(z => z * 0.8)} className="p-1.5 bg-white border border-slate-200 rounded shadow-sm text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-colors" title="Zoom Out Vertical">
              <ZoomOut size={14} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
                data={displayData} 
                margin={{ bottom: 40, left: 30, right: 20, top: 40 }} 
                style={{ cursor: dragAction === 'delete' ? 'copy' : 'crosshair', userSelect: 'none' }}
                onMouseDown={(e: any) => e && e.activeLabel && setRefAreaLeft(e.activeLabel)}
                onMouseMove={(e: any) => refAreaLeft && e && e.activeLabel && setRefAreaRight(e.activeLabel)}
                onMouseUp={handleDragAction}
                onClick={(e: any) => {
                    if (dragAction === 'delete' && e && e.activeLabel) {
                        const ts = Number(e.activeLabel);
                        if (!isNaN(ts)) {
                            const newMods = [...modifiers, { startMs: ts, endMs: ts, sensor: selectedSensor, offset: 0, scale: 1, action: 'delete' as const }];
                            setModifiers(newMods);
                            runAnalysis(rawData, selectedSensor, verticalOffset, timeOffset, newMods, isDeTiding);
                        }
                    }
                }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
              <XAxis 
                dataKey="timeMs" 
                tickFormatter={(val: number) => formatUTC(new Date(val), 'dd/MM HH:mm')}
                tick={{fontSize: 9, fill:'#64748b'}} 
                interval={Math.floor(displayData.length/12)} 
                axisLine={false} 
                tickMargin={10}
                height={65}
                label={{ value: 'Waktu (UTC)', position: 'insideBottom', offset: -15, style: { fontSize: '14px', fontWeight: 'bold', fill: '#475569' } }}
              />
              <YAxis 
                tickFormatter={(val: number) => val.toFixed(3)}
                label={{ value: 'Tinggi Muka Laut (m)', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: '14px', fontWeight: 'bold', fill: '#475569' } }}
                tick={{fontSize: 9, fill:'#64748b'}} 
                axisLine={false} 
                domain={yDomain} 
                width={80}
              />
              <Tooltip 
                cursor={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-3 rounded-xl shadow-lg ring-1 ring-black/5 pointer-events-none min-w-[200px]">
                        <p className="font-bold text-slate-700 text-xs mb-2 pb-2 border-b border-slate-100">Waktu: {formatUTC(new Date(Number(label)), 'dd/MM/yyyy HH:mm:ss')}</p>
                        <div className="space-y-2 w-full">
                          {data.filtered !== undefined && !isNaN(data.filtered) && (
                              <div className="flex items-center justify-between gap-6 text-[11px]">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-sm bg-[#ec7017]" />
                                  <span className="font-semibold text-slate-600">Valid</span>
                                </div>
                                <span className="font-bold text-slate-800 font-mono">
                                  {data.filtered.toFixed(3)} m
                                </span>
                              </div>
                          )}

                          {data.combined !== undefined && !isNaN(data.combined) && (
                            <div className="flex items-center justify-between gap-6 text-[11px]">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-[#F5BF03]" />
                                <span className="font-semibold text-slate-600">Combined</span>
                              </div>
                              <span className="font-bold text-slate-800 font-mono">
                                {typeof data.combined === 'number' ? data.combined.toFixed(3) : 'NaN'} m
                              </span>
                            </div>
                          )}

                          {data.interpolated !== undefined && !isNaN(data.interpolated) && (
                            <div className="flex items-center justify-between gap-6 text-[11px]">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-[#800000]" />
                                <span className="font-semibold text-slate-600">Interpolated</span>
                              </div>
                              <span className="font-bold text-slate-800 font-mono">
                                {typeof data.interpolated === 'number' ? data.interpolated.toFixed(3) : 'NaN'} m
                              </span>
                            </div>
                          )}
                          
                          {visibleSensors.map((s, idx) => {
                             const palette = ['#2563eb', '#059669', '#ff00ff', '#7c3aed', '#0891b2', '#db2777', '#4b5563', '#1e40af'];
                             const color = palette[availableSensors.indexOf(s) % palette.length];
                             return (
                               <div key={s} className="flex items-center justify-between gap-6 text-[11px]">
                                 <div className="flex items-center gap-2">
                                   <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                                   <span className="font-semibold text-slate-600">{s} (Raw)</span>
                                 </div>
                                 <span className="font-bold text-slate-800 font-mono">
                                   {typeof data.allSamples?.[s] === 'number' ? data.allSamples[s].toFixed(3) : 'NaN'} m
                                 </span>
                               </div>
                             );
                          })}

                          {data.trendline !== undefined && !isNaN(data.trendline) && (
                              <div className="flex items-center justify-between gap-6 text-[11px]">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]" />
                                  <span className="font-semibold text-slate-600">Sea Level Trend</span>
                                </div>
                                <span className="font-bold text-slate-800 font-mono">
                                  {data.trendline.toFixed(3)} m
                                </span>
                              </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={50} 
                wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', cursor: 'pointer', paddingBottom: '20px'}} 
                onClick={handleLegendClick}
              />
              
              {datums && (
                <>
                  <ReferenceLine y={datums.hat} label={{ position: 'right', value: `HAT (${datums.hat.toFixed(3)})`, fontSize: 9, fill: '#94a3b8' }} stroke="#94a3b8" strokeDasharray="3 3" />
                  <ReferenceLine y={datums.lat} label={{ position: 'right', value: `LAT (${datums.lat.toFixed(3)})`, fontSize: 9, fill: '#94a3b8' }} stroke="#94a3b8" strokeDasharray="3 3" />
                  <ReferenceLine y={z0} label={{ position: 'right', value: `MSL (${z0.toFixed(3)})`, fontSize: 9, fill: '#0284c7' }} stroke="#0284c7" strokeDasharray="5 5" opacity={0.5} />
                </>
              )}

              {moonEvents.map((me, i) => (
                <ReferenceLine key={i} x={me.time} stroke="none" label={{ position: 'top', value: me.symbol, fontSize: 18 }} />
              ))}
              
              {refAreaLeft && refAreaRight ? (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#0ea5e9" fillOpacity={0.15} />
              ) : null}

              {availableSensors.map((sensor, idx) => {
                  const palette = ['#2563eb', '#059669', '#ff00ff', '#7c3aed', '#0891b2', '#db2777', '#4b5563', '#1e40af'];
                  const color = palette[idx % palette.length];
                  if (!visibleSensors.includes(sensor)) return null;
                  return (
                    <Line 
                      key={sensor}
                      hide={hiddenLines[sensor]} 
                      dataKey={`allSamples.${sensor}`}
                      stroke={color}
                      strokeWidth={1.5}
                      dot={displayData.length <= 720 ? { r: 1.5, strokeWidth: 0, fill: color } : false}
                      activeDot={{ r: 3, fill: color }}
                      type="monotone"
                      name={sensor} 
                      isAnimationActive={false} 
                      connectNulls={false}
                    />
                  );
              })}
              <Line hide={hiddenLines.filtered} type="monotone" dataKey="filtered" stroke="#ec7017" strokeOpacity={0.90} strokeWidth={2.5} dot={false} name="Valid" isAnimationActive={false} />
              <Line hide={hiddenLines.combined} type="monotone" dataKey="combined" stroke="#F5BF03" strokeWidth={2} dot={false} name="Combined" isAnimationActive={false} connectNulls={false} />
              <Line hide={hiddenLines.interpolated} type="monotone" dataKey="interpolated" stroke="#800000" strokeWidth={2} dot={false} name="Interpolated" isAnimationActive={false} connectNulls={false} />
              <Line hide={hiddenLines.trendline} type="monotone" dataKey="trendline" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Sea Level Trend" isAnimationActive={false} />
              
              <Brush 
                dataKey="timeMs" 
                tickFormatter={(val: number) => formatUTC(new Date(val), 'MMM yyyy')}
                height={30} 
                stroke="#cbd5e1" 
                travellerWidth={10} 
                fill="#f8fafc" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {showDifferences && availableSensors.length > 1 && (
            <div className="mt-6 border-t border-slate-100 pt-6">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest text-center mb-4">Grafik Selisih Sensor (m)</h4>
                <div className="relative h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={displayData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="timeMs" 
                                type="number" 
                                domain={['dataMin', 'dataMax']} 
                                tickFormatter={(val: number) => formatUTC(new Date(val), 'dd/MM HH:mm')} 
                                stroke="#94a3b8" 
                                fontSize={10} 
                            />
                            <YAxis stroke="#94a3b8" fontSize={10} width={45} tickFormatter={(val) => val.toFixed(2)} />
                            <Tooltip
                                labelFormatter={(label: number) => formatUTC(new Date(label), 'dd MMM yyyy HH:mm:ss')}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                formatter={(val: number, name: string) => [val.toFixed(3) + ' m', name]}
                            />
                            <Legend 
                                wrapperStyle={{ paddingTop: '10px', fontSize: '10px', cursor: 'pointer' }}
                                onClick={handleLegendClick}
                            />
                            {(() => {
                                const diffLines = [];
                                const palette = ['#dc2626', '#d97706', '#65a30d', '#0891b2', '#4f46e5', '#db2777'];
                                let colorIdx = 0;
                                for (let i = 0; i < availableSensors.length; i++) {
                                    for (let j = i + 1; j < availableSensors.length; j++) {
                                        const s1 = availableSensors[i];
                                        const s2 = availableSensors[j];
                                        const lineName = `${s1} - ${s2}`;
                                        const color = palette[colorIdx % palette.length];
                                        colorIdx++;
                                        diffLines.push(
                                            <Line 
                                                key={`diff_${s1}_${s2}`}
                                                hide={hiddenLines[lineName]}
                                                type="monotone" 
                                                dataKey={(d: any) => {
                                                    if (!d.allSamples) return null;
                                                    const v1 = d.allSamples[s1];
                                                    const v2 = d.allSamples[s2];
                                                    if (typeof v1 === 'number' && !isNaN(v1) && typeof v2 === 'number' && !isNaN(v2)) {
                                                        return v1 - v2;
                                                    }
                                                    return null;
                                                }}
                                                name={lineName}
                                                stroke={color}
                                                strokeWidth={1.5}
                                                dot={false}
                                                isAnimationActive={false}
                                            />
                                        );
                                    }
                                }
                                return diffLines;
                            })()}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        <div className="mt-4 flex items-center gap-2 justify-center">
             <div className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-bold rounded uppercase tracking-widest">Visual Optimization: Hourly Sampling Active</div>
        </div>
      </div>
    </div>
  );
}

function OutlierView({ records, threshold, setThreshold, manualMin, setManualMin, manualMax, setManualMax, onUpdate }: any) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-6 shadow-sm overflow-hidden">
       <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-50 rounded-xl text-amber-500 shadow-inner">
          <Search size={24} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800">Spike & Outlier Control</h2>
          <p className="text-[11px] text-slate-500 leading-tight">Gunakan Z-Score atau rentang manual untuk membuang anomali data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-slate-700 font-display uppercase tracking-widest">Threshold Z-Score</label>
              <span className="text-xl font-black text-[#0284c7] font-mono">{isNaN(threshold) ? 0 : threshold}σ</span>
            </div>
            <input 
              type="range" min="0.5" max="5" step="0.1" 
              value={isNaN(threshold) ? 3.0 : threshold} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setThreshold(isNaN(val) ? 3.0 : val);
              }}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
            />
            <p className="text-[9px] text-slate-400 font-medium italic">Nilai lebih kecil menghapus lebih banyak data.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
             <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest block font-display">Pembersihan Manual (m)</label>
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Min</div>
                   <input 
                      type="number" 
                      step="0.001"
                      value={manualMin}
                      placeholder="Min..."
                      onChange={(e) => setManualMin(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-sky-100"
                   />
                </div>
                <div className="space-y-1">
                   <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Max</div>
                   <input 
                      type="number" 
                      step="0.001"
                      value={manualMax}
                      placeholder="Max..."
                      onChange={(e) => setManualMax(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-sky-100"
                   />
                </div>
             </div>
          </div>

          <button 
            onClick={onUpdate}
            className="w-full py-3 bg-[#1e293b] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-md active:scale-95 uppercase tracking-wider"
          >
            <RefreshCw size={16} /> Jalankan Pembersihan
          </button>
        </div>

        <div className="flex flex-col gap-3 justify-center">
            <div className="bg-white p-4 rounded-xl border-2 border-slate-100 text-center shadow-sm">
                <div className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest font-display">Statistik Outlier</div>
                <div className="flex flex-col divide-y divide-slate-100">
                   <div className="pb-4">
                       <div className="text-3xl font-mono font-black text-slate-800 leading-none">{records.filter((r:any) => r.isOutlier).length}</div>
                       <div className="text-[10px] font-black text-amber-500 uppercase mt-2 tracking-widest">Data Dibuang</div>
                   </div>
                   <div className="pt-4">
                       <div className="text-3xl font-mono font-black text-emerald-700 leading-none">{records.filter((r:any) => !r.isOutlier).length}</div>
                       <div className="text-[10px] font-black text-emerald-600 uppercase mt-2 tracking-widest">Data Terverifikasi</div>
                   </div>
                </div>
            </div>
            <div className="p-3 bg-[#0284c7]/5 rounded-xl border border-sky-100 space-y-1">
               <div className="text-[9px] font-black text-[#0284c7] uppercase tracking-widest">Tips</div>
               <p className="text-[10px] text-slate-600 italic leading-snug">
                  Gunakan manual range untuk membuang data "jump" sensor yang ekstrem.
               </p>
            </div>
        </div>
      </div>
    </div>
  );
}

function FilterView({ type, setType, window, setWindow, medianWindow, setMedianWindow, cutoff, setCutoff, onUpdate }: any) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-6 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-sky-50 rounded-xl text-[#0284c7] shadow-inner">
          <Radio size={24} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Signal Analysis & Filtering</h2>
          <p className="text-[11px] text-slate-500 leading-tight">Isolasi profil pasut utama melalui filtering sinyal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method Selection */}
        <div className="space-y-3">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 font-display">Pilih Algoritma</label>
          <div className="flex flex-col gap-1.5">
            {[
              { id: 'ma', name: 'Moving Average', icon: <Clock size={12} /> },
              { id: 'median', name: 'Median Filter', icon: <Radio size={12} /> },
              { id: 'butterworth', name: 'Butterworth IIR', icon: <RefreshCw size={12} /> }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setType(m.id as any)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all",
                  type === m.id ? "bg-sky-50 border-[#0284c7] text-[#0284c7]" : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                )}
              >
                <div className={cn("p-1.5 rounded-lg", type === m.id ? "bg-[#0284c7] text-white" : "bg-slate-50")}>
                  {m.icon}
                </div>
                <div className="font-bold text-xs">{m.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl border border-slate-100 p-5">
          {type === 'ma' && (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Window Size (Menit)</h4>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Standar BIG: 15 / 30 Menit</p>
                </div>
                <span className="text-2xl font-black text-[#0284c7] font-mono">{window}m</span>
              </div>
              <input 
                type="range" min="5" max="120" step="5" 
                value={window} 
                onChange={(e) => setWindow(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
              />
            </div>
          )}

          {type === 'median' && (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Median Window (Samples)</h4>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Efektif membuang spike</p>
                </div>
                <span className="text-2xl font-black text-[#0284c7] font-mono">{medianWindow}pt</span>
              </div>
              <input 
                type="range" min="3" max="21" step="2" 
                value={medianWindow} 
                onChange={(e) => setMedianWindow(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
              />
            </div>
          )}

          {type === 'butterworth' && (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Cutoff Frequency</h4>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Butterworth 2nd Order</p>
                </div>
                <span className="text-2xl font-black text-[#0284c7] font-mono">{cutoff.toFixed(3)}</span>
              </div>
              <input 
                type="range" min="0.01" max="0.5" step="0.01" 
                value={cutoff} 
                onChange={(e) => setCutoff(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
              />
            </div>
          )}

          <div className="mt-6">
            <button 
              onClick={onUpdate}
              className="w-full py-3 bg-[#1e293b] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-md active:scale-95 uppercase tracking-wider"
            >
              <RefreshCw size={16} /> Jalankan Filter
            </button>
            <p className="text-[8px] text-center text-slate-400 mt-2 font-bold uppercase tracking-widest text-[9px]">Setiap perubahan parameter harus dikalkulasi ulang</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HarmonicView({ results, rmse, constituentSet, setConstituentSet, onCalculate, isCalculating, autoDiagnostics }: any) {
  const handleDownloadCSV = () => {
    if (!results || results.length === 0) return;
    let csv = "Component,Definition,Frequency (cph),Amplitude (m),Phase (deg)\n";
    results.forEach((r: any) => {
      csv += `${r.comp},${r.desc},${r.freq.toFixed(8)},${r.amp.toFixed(3)},${r.phase.toFixed(3)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    download(blob, 'Harmonic_Constants.csv');
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm overflow-hidden flex flex-col gap-6">
       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          <div className="flex-1">
              <h3 className="text-lg font-black text-slate-800 px-2 font-display">Analisis Konstanta Harmonik</h3>
              {rmse !== undefined && rmse !== null && results.length > 0 && (
                  <div className="px-2 mt-1">
                      <span className="text-xs font-semibold text-slate-500">Root Mean Square Error (RMSE): </span>
                      <span className="text-[13px] font-black text-sky-600">{rmse.toFixed(4)} m</span>
                  </div>
              )}
          </div>
          
          <div className="flex flex-wrap items-end gap-3 w-full xl:w-auto">
             <div className="flex flex-col gap-1.5 min-w-[200px]">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Constituent Set</label>
                <select 
                  value={constituentSet}
                  onChange={(e) => setConstituentSet(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-100 cursor-pointer"
                >
                  <option value="4">4 Constants (Basic)</option>
                  <option value="9">9 Constants (Standard)</option>
                  <option value="IHO23">IHO 23 Constants (GeoTide)</option>
                  <option value="FES2014">FES2014 (34 Constants)</option>
                  <option value="UTIDE">UTide Standard (67)</option>
                  <option value="AUTO">Auto (Rayleigh & SNR)</option>
                </select>
             </div>
             
             <button 
                onClick={onCalculate}
                disabled={isCalculating}
                className="flex flex-1 xl:flex-none items-center justify-center gap-2 px-6 h-11 bg-[#1e293b] text-white rounded-xl text-xs font-black tracking-widest hover:bg-black transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed group uppercase"
             >
                {isCalculating ? <RefreshCw size={14} className="animate-spin" /> : <Piano size={16} className="group-hover:rotate-12 transition-transform" />}
                Hitung Konstanta Harmonik
             </button>

             {results.length > 0 && (
               <button onClick={handleDownloadCSV} className="px-4 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                 <Download size={14} /> CSV
               </button>
             )}
          </div>
       </div>

       {constituentSet === 'AUTO' && autoDiagnostics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-sky-50/70 rounded-xl border border-sky-100 animate-in fade-in slide-in-from-top-1">
             <div className="flex justify-between items-center px-2">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Tested:</span>
                <span className="text-xs font-black text-sky-800">{autoDiagnostics.totalTested}</span>
             </div>
             <div className="flex justify-between items-center px-2 border-l border-sky-200/30">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Rayleigh Passed:</span>
                <span className="text-xs font-black text-sky-800">{autoDiagnostics.rayleighPassed}</span>
             </div>
             <div className="flex justify-between items-center px-2 border-l border-sky-200/30">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Significant Signal:</span>
                <span className="text-xs font-black text-[#0284c7]">{autoDiagnostics.snrPassed}</span>
             </div>
          </div>
       )}

       {results.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 bg-slate-50 uppercase text-[10px] font-black tracking-widest font-display">
                <tr>
                  <th className="py-4 px-6 font-display">Component</th>
                  <th className="py-4 px-6 font-display">Definition</th>
                  <th className="py-4 px-6 font-display text-center">Frequency (cph)</th>
                  <th className="py-4 px-6 font-display text-center">Amplitude (m)</th>
                  <th className="py-4 px-6 font-display text-center">Phase (deg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r: any) => (
                   <tr key={r.comp} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-black text-[#0284c7]">{r.comp}</td>
                    <td className="py-4 px-6 text-slate-500 text-xs leading-snug">{r.desc}</td>
                    <td className="py-4 px-6 font-mono text-[10px] text-slate-400 text-center">{r.freq.toFixed(8)}</td>
                    <td className="py-4 px-6 font-black text-slate-800 font-mono text-center">{r.amp.toFixed(3)}</td>
                    <td className="py-4 px-6 font-black text-slate-800 font-mono text-center">{r.phase.toFixed(3)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-center gap-6">
             <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 ring-1 ring-slate-100">
                <Piano size={32} />
             </div>
             <div className="max-w-[320px]">
                <h4 className="text-md font-black text-slate-800 uppercase tracking-tight">Hitung Konstanta Harmonik</h4>
                <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">Pilih constituent set yang diinginkan, kemudian klik tombol <span className="font-bold text-slate-800 italic underline decoration-sky-300">"Hitung Konstanta Harmonik"</span> di atas untuk memulai kalkulasi least squares.</p>
             </div>
          </div>
       )}
    </div>
  );
}

const PredictionTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isMonthly = data.isMonthlyMean;
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-4 rounded-xl shadow-xl ring-1 ring-black/5 z-50 min-w-[220px]">
        <p className="font-bold text-slate-800 text-[13px] mb-3 pb-2 border-b border-slate-100">{data.fullTime}</p>
        <div className="flex items-center justify-between gap-6 text-xs mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#0284c7]" />
            <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{isMonthly ? 'Prediksi Mean' : 'Prediksi Level'}</span>
          </div>
          <span className="font-black text-[#0284c7] font-mono text-[13px]">
            {typeof data.value === 'number' ? data.value.toFixed(3) : data.value} m
          </span>
        </div>
        {(data.dayMax !== undefined && data.dayMin !== undefined) && (
            <div className="pt-3 border-t border-slate-100 flex justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-slate-400 uppercase tracking-widest font-black text-[9px] mb-1">{isMonthly ? 'Bulanan Max' : 'Harian Max'}</span>
                    <span className="text-emerald-600 font-bold font-mono text-[11px]">{typeof data.dayMax === 'number' ? data.dayMax.toFixed(3) : data.dayMax} m</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-slate-400 uppercase tracking-widest font-black text-[9px] mb-1">{isMonthly ? 'Bulanan Min' : 'Harian Min'}</span>
                    <span className="text-amber-600 font-bold font-mono text-[11px]">{typeof data.dayMin === 'number' ? data.dayMin.toFixed(3) : data.dayMin} m</span>
                </div>
            </div>
        )}
      </div>
    );
  }
  return null;
};

function PredictionView({ predictions, startDate, endDate, setStartDate, setEndDate, onGenerate, onExport, isLoading, title, hasInsufficientData }: any) {
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [zoomDomain, setZoomDomain] = useState<{start: number, end: number} | null>(null);

  const displayPredsRaw = useMemo(() => {
    // 366 days safe threshold for leap years
    const oneYearHours = 366 * 24;
    
    if (predictions.length <= oneYearHours) {
      return predictions.map((p: any) => {
          const { timestamp, ...rest } = p;
          return {
              ...rest,
              timeMs: timestamp.getTime()
          };
      });
    } else {
      // If > 1 year: Show entire duration as monthly means
      const monthlyData: Record<string, { sum: number, count: number, date: Date, max: number, min: number }> = {};
      
      predictions.forEach((p: any) => {
          const monthKey = formatUTC(p.timestamp, 'yyyy-MM');
          if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { sum: 0, count: 0, date: p.timestamp, max: -Infinity, min: Infinity };
          }
          monthlyData[monthKey].sum += p.value;
          monthlyData[monthKey].count += 1;
          if (p.value > monthlyData[monthKey].max) monthlyData[monthKey].max = p.value;
          if (p.value < monthlyData[monthKey].min) monthlyData[monthKey].min = p.value;
      });

      return Object.values(monthlyData).map((m: any) => ({
          time: formatUTC(m.date, 'MMM yy'),
          fullTime: formatUTC(m.date, 'MMMM yyyy'),
          value: parseFloat((m.sum / m.count).toFixed(3)),
          timeMs: m.date.getTime(),
          dayMax: m.max,
          dayMin: m.min,
          isMonthlyMean: true
      }));
    }
  }, [predictions]);

  const displayPreds = useMemo(() => {
    let sliced = displayPredsRaw;
    if (zoomDomain) {
        const startIndex = displayPredsRaw.findIndex((d: any) => d.timeMs === zoomDomain.start);
        const endIndex = displayPredsRaw.findIndex((d: any) => d.timeMs === zoomDomain.end);
        if (startIndex !== -1 && endIndex !== -1) {
            let s = startIndex, e = endIndex;
            if (s > e) { s = endIndex; e = startIndex; }
            sliced = displayPredsRaw.slice(s, e + 1);
        }
    }
    
    if (sliced.length > 2500) {
        const step = Math.ceil(sliced.length / 2500);
        return sliced.filter((_, i) => i % step === 0);
    }
    return sliced;
  }, [displayPredsRaw, zoomDomain]);

  const moonEvents = useMemo(() => getMoonEvents(displayPreds), [displayPreds]);

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }
    setZoomDomain({ start: Number(refAreaLeft), end: Number(refAreaRight) });
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  const zoomOut = () => setZoomDomain(null);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-500 shadow-inner">
            <TrendingUp size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500">Estimasi ketinggian air laut berdasarkan parameter harmonik yang ditemukan.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-700 font-display uppercase tracking-wider">Tanggal Mulai</label>
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
            <label className="text-xs font-black text-slate-700 font-display uppercase tracking-wider">Tanggal Selesai</label>
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
            {hasInsufficientData && (
              <span className="text-[10px] text-rose-500 font-bold uppercase animate-pulse px-2 mb-2 text-center">
                 Kurang dari 29 Piantan
              </span>
            )}
            <button 
              onClick={onGenerate}
              disabled={isLoading || !startDate || !endDate || endDate < startDate || hasInsufficientData}
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
            <h3 className="font-black text-slate-800 text-lg font-display">Predicted Mean Sea Level (m)</h3>
            <div className="flex gap-2">
              {zoomDomain && (
                <button onClick={zoomOut} className="flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 border border-sky-200 rounded-xl text-xs font-bold text-sky-700 transition-colors"><ZoomOut size={14} /> Reset Zoom X</button>
              )}
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
              <span className="px-3 py-2 bg-sky-50 text-[#0284c7] text-[10px] font-black rounded-lg uppercase tracking-wider">
                  Interval : {predictions.length > 366 * 24 ? 'monthly mean' : '1 Hour'}
              </span>
            </div>
          </div>
          <div className="h-[400px] w-full" style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={displayPreds} 
                margin={{ bottom: 20 }}
                style={{ cursor: 'crosshair', userSelect: 'none' }}
                onMouseDown={(e: any) => e && e.activeLabel && setRefAreaLeft(e.activeLabel)}
                onMouseMove={(e: any) => refAreaLeft && e && e.activeLabel && setRefAreaRight(e.activeLabel)}
                onMouseUp={zoom}
              >
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="timeMs" 
                tick={{fontSize: 9, fill: '#64748b'}} 
                tickFormatter={(val: number) => formatUTC(new Date(val), 'dd/MM/yyyy')}
                interval={Math.floor(displayPreds.length/12)} 
                axisLine={false} 
              />
              <YAxis 
                tickFormatter={(val: number) => val.toFixed(3)}
                label={{ value: 'Elevasi (m)', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: '11px', fontWeight: 'bold', fill: '#475569' } }}
                tick={{fontSize: 9, fill: '#64748b'}} 
                axisLine={false} 
                domain={['auto', 'auto']} 
                width={80}
              />
              <Tooltip content={<PredictionTooltip />} />
              
              {moonEvents.map((me, i) => (
                <ReferenceLine key={i} x={me.time} stroke="none" label={{ position: 'top', value: me.symbol, fontSize: 16 }} />
              ))}

              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#0284c7" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorVal)" 
                animationDuration={0} 
                isAnimationActive={false}
                connectNulls 
              />
              
              {refAreaLeft && refAreaRight ? (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#0ea5e9" fillOpacity={0.15} />
              ) : null}

              <Brush 
                dataKey="timeMs" 
                tickFormatter={(val: number) => formatUTC(new Date(val), 'MMM yyyy')}
                height={30} 
                stroke="#cbd5e1" 
                travellerWidth={10} 
                fill="#f8fafc" 
              />
            </AreaChart>
            </ResponsiveContainer>
          </div>
          {predictions.length > (365 * 24) && (
             <div className="mt-4 px-3 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg uppercase tracking-widest text-center border border-amber-100 flex items-center justify-center gap-2">
                 <AlertCircle size={14} /> Tampilan Grafik Diagregasi ke Monthly-Mean untuk Performa ({predictions.length.toLocaleString()} Jam Data Prediksi BISA DI-EXPORT)
             </div>
          )}
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

function CombinationModal({ availableSensors, onApply, onCancel, currentSettings }: any) {
    const [enabled, setEnabled] = useState(currentSettings.enabled);
    const [referenceSensor, setReferenceSensor] = useState(currentSettings.referenceSensor || availableSensors[0] || '');
    const [sourceSensors, setSourceSensors] = useState<string[]>(currentSettings.sourceSensors || []);

    const toggleSource = (s: string) => {
        setSourceSensors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <Layers size={20} className="text-sky-500" />
                        Sensor Combination
                    </h3>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-100">
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-sky-900">Aktifkan Kombinasi</span>
                            <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">Isi data kosong (NaN) otomatis</span>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={enabled} 
                            onChange={(e) => setEnabled(e.target.checked)}
                            className="w-5 h-5 rounded text-sky-600 border-sky-300 focus:ring-sky-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sensor Utama (Lead)</label>
                        <select 
                            value={referenceSensor}
                            onChange={(e) => setReferenceSensor(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-none"
                        >
                            <option value="">Semua Sensor (Gunakan urutan dibawah)</option>
                            {availableSensors.map((s: string) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sensor Sumber untuk Mengisi Gap</label>
                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {availableSensors.map((s: string) => (
                                <label key={s} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${sourceSensors.includes(s) ? 'bg-sky-50 border-sky-200 outline-2 outline-sky-500/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={sourceSensors.includes(s)}
                                        onChange={() => toggleSource(s)}
                                        className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                                    />
                                    <span className={`text-sm font-bold ${s === referenceSensor ? 'text-sky-700 underline' : 'text-slate-700'}`}>{s} {s === referenceSensor && '(Lead)'}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                    <button 
                        onClick={() => onApply({ enabled, referenceSensor, sourceSensors })}
                        className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-200 transition-all active:scale-[0.98]"
                    >
                        Terapkan
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, trend, trendColor, valueClassName }: { label: string, value: string, trend: string, trendColor?: string, valueClassName?: string }) {
  return (
    <div className="relative h-full min-h-[140px] overflow-hidden bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all flex flex-col items-center justify-center gap-1 group text-center">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sky-100/50 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-50/40 to-transparent rounded-tr-full -ml-4 -mb-4 transition-transform group-hover:scale-110" />
      
      <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest font-display z-10 mb-1">{label}</div>
      <div className={cn("text-4xl xl:text-[2.5rem] 2xl:text-5xl leading-tight font-black text-transparent bg-clip-text bg-gradient-to-br from-sky-600 to-indigo-600 font-display tracking-tighter drop-shadow-sm z-10 break-words", valueClassName)}>{value}</div>
      <div className={cn("text-[11px] font-bold z-10 mt-3 bg-slate-50/80 px-3 py-1 rounded-full border border-slate-100 whitespace-nowrap", trendColor || "text-slate-400")}>{trend}</div>
    </div>
  );
}
