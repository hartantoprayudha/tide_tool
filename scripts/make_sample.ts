import * as fs from 'fs';
import * as path from 'path';

function generateSample() {
    const rows = [];
    const header = "Timestamp,Sensor (m)";
    rows.push(header);

    const startDate = new Date('2023-01-01T00:00:00Z');
    const totalHours = 365 * 24;

    const M2 = { amp: 1.2, freq: 0.0805114, phase: 45 * Math.PI / 180 };
    const S2 = { amp: 0.4, freq: 0.0833333, phase: 90 * Math.PI / 180 };
    const K1 = { amp: 0.6, freq: 0.0417807, phase: 10 * Math.PI / 180 };
    const O1 = { amp: 0.4, freq: 0.0387307, phase: 20 * Math.PI / 180 };

    for (let i = 0; i < totalHours; i++) {
        const current = new Date(startDate.getTime() + i * 3600000);
        const day = current.getUTCDate().toString().padStart(2, '0');
        const month = (current.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = current.getUTCFullYear();
        const hr = current.getUTCHours().toString().padStart(2, '0');
        const min = current.getUTCMinutes().toString().padStart(2, '0');
        
        const timeStr = `${day}/${month}/${year} ${hr}:${min}`;

        // Compute theoretical tide
        // Mean Sea Level = 2.0 (so minimums aren't negative for this fake sensor)
        const MSL = 2.0;
        const trend = 0.00002 * i; // slight sea level rise trend
        const noise = (Math.random() - 0.5) * 0.15; // random noise

        let val = MSL + trend + noise +
            M2.amp * Math.cos(2 * Math.PI * M2.freq * i - M2.phase) +
            S2.amp * Math.cos(2 * Math.PI * S2.freq * i - S2.phase) +
            K1.amp * Math.cos(2 * Math.PI * K1.freq * i - K1.phase) +
            O1.amp * Math.cos(2 * Math.PI * O1.freq * i - O1.phase);

        // Inject Outliers, NaN, Gross Errors
        let finalValStr = val.toFixed(3);

        // 1 in 400 chance to be an extreme outlier (spike)
        if (Math.random() < 0.0025) {
            val += (Math.random() > 0.5 ? 2.5 : -2.5); // large spike
            finalValStr = val.toFixed(3);
        }
        
        // 1 in 500 chance to be a gross error (e.g. sensor floating: 8.000)
        else if (Math.random() < 0.002) {
            finalValStr = "8.450";
        }
        
        // 1 in 600 chance to be a NaN gap (sensor offline)
        else if (Math.random() < 0.0016) {
            finalValStr = "NaN";
        }

        // 1 in 800 chance for string blank
        else if (Math.random() < 0.0012) {
            finalValStr = "";
        }

        rows.push(`${timeStr},${finalValStr}`);
    }

    const outPath = path.join(process.cwd(), 'public', 'examples', 'sample_data.csv');
    // ensure dir exists
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outPath, rows.join('\n'), 'utf8');
    console.log("Sample file created at:", outPath);
}

generateSample();
