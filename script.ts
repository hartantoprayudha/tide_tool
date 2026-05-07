import * as fs from 'fs';

const appTsx = fs.readFileSync('src/App.tsx', 'utf8');
const freqsMatch = appTsx.match(/const HARMONIC_FREQS: Record<string, \{ f: number, d: string \}> = (\{[\s\S]*?\n\});/);

if (freqsMatch) {
    const evalData = new Function('return ' + freqsMatch[1])();
    
    let pythonDictStr = "HARMONIC_FREQS = {\n";
    for (const [key, val] of Object.entries(evalData)) {
        pythonDictStr += `    '${key}': {'f': ${val.f}, 'd': '${val.d.replace(/'/g, "\\'")}'},\n`;
    }
    pythonDictStr += "}\n";

    const tideEngine = fs.readFileSync('tide_engine.py', 'utf8');
    const newTideEngine = tideEngine.replace(/HARMONIC_FREQS = \{[\s\S]*?\n\}/, pythonDictStr);
    fs.writeFileSync('tide_engine.py', newTideEngine);
    console.log("Updated tide_engine.py with all constants!");
} else {
    console.log("Not found.");
}
