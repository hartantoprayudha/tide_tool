const fs = require('fs');

const path = 'src/App.tsx';
let txt = fs.readFileSync(path, 'utf8');

const target = `            if (method === 'fft') {
                fittedZ0 = unifiedIntercept;
                let snrPassedCount = 0;
                
                const fftRawResults = compsToFit.map((c, i) => {
                    let sumCos = 0;
                    let sumSin = 0;
                    const f = HARMONIC_FREQS[c].f;
                    for (let j = 0; j < n; j++) {
                        const arg = 2 * Math.PI * f * t_hours[j];
                        const zeroMeanY = y_detrended[j] - unifiedIntercept;
                        sumCos += zeroMeanY * Math.cos(arg);
                        sumSin += zeroMeanY * Math.sin(arg);
                    }
                    const a = (2 / n) * sumCos;
                    const b = (2 / n) * sumSin;
                    const amp = Math.sqrt(a * a + b * b);
                    let phase = Math.atan2(b, a) * (180 / Math.PI);
                    if (phase < 0) phase += 360;
                    
                    return { c, a, b, amp, phase, f };
                });`;

const replacement = `            if (method === 'fft') {
                fittedZ0 = unifiedIntercept;
                let snrPassedCount = 0;
                
                // Using Successive Subtraction (Matching Pursuit) to resolve leakage and reduce RMSE
                let residual = new Float64Array(n);
                for(let j=0; j<n; j++) residual[j] = y_detrended[j] - unifiedIntercept;

                const fftRawResults = compsToFit.map((c, i) => {
                    let sumCos = 0;
                    let sumSin = 0;
                    const f = HARMONIC_FREQS[c].f;
                    
                    for (let j = 0; j < n; j++) {
                        const arg = 2 * Math.PI * f * t_hours[j];
                        sumCos += residual[j] * Math.cos(arg);
                        sumSin += residual[j] * Math.sin(arg);
                    }
                    const a = (2 / n) * sumCos;
                    const b = (2 / n) * sumSin;
                    const amp = Math.sqrt(a * a + b * b);
                    let phase = Math.atan2(b, a) * (180 / Math.PI);
                    if (phase < 0) phase += 360;
                    
                    for (let j = 0; j < n; j++) {
                        const arg = 2 * Math.PI * f * t_hours[j];
                        residual[j] -= (a * Math.cos(arg) + b * Math.sin(arg));
                    }
                    
                    return { c, a, b, amp, phase, f };
                });`;

fs.writeFileSync(path, txt.replace(target, replacement));
console.log('App.tsx patched for FFT successive subtraction.');
