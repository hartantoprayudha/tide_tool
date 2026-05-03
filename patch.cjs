const fs = require('fs');

const path = 'src/App.tsx';
let txt = fs.readFileSync(path, 'utf8');

// Patch 1: sorting the files
txt = txt.replace(
  'const filePromises = Array.from(files).map((file) => {',
  'const filesArray = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));\n        const filePromises = filesArray.map((file) => {'
);

const searchMerge = `        // Validate headers if merging multiple files
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

        const fields = results[0].meta.fields || [];`;

const replaceMerge = `        let mergedData: any[] = [];
        let finalFields: string[] = [];

        if (results.length > 1) {
            const set1 = new Set(results[0].data.map((d: any) => d['Timestamp']));
            let hasOverlap = false;
            for (let i = 0; i < Math.min(100, results[1].data.length); i++) {
                if (set1.has(results[1].data[i]['Timestamp'])) {
                    hasOverlap = true;
                    break;
                }
            }

            if (hasOverlap) {
                // HORIZONTAL MERGE
                const tsMap = new Map<string, any>();
                let sensorCounter = 1;
                finalFields = ['Timestamp'];

                results.forEach((res) => {
                    const rowFields = res.meta.fields || Object.keys(res.data[0] || {});
                    const sensorFields = rowFields.filter((f: string) => {
                        const lowerF = f.toLowerCase();
                        return f !== 'Timestamp' && (lowerF.includes('(m)') || lowerF.includes('(cm)') || lowerF.includes('sensor'));
                    });

                    const fieldMap = new Map<string, string>();
                    sensorFields.forEach(f => {
                       const newName = \`Sensor \${sensorCounter} (cm)\`;
                       fieldMap.set(f, newName);
                       finalFields.push(newName);
                       sensorCounter++;
                    });

                    res.data.forEach((row: any) => {
                        const ts = row['Timestamp'];
                        if (!ts) return;
                        if (!tsMap.has(ts)) {
                            tsMap.set(ts, { 'Timestamp': ts });
                        }
                        const existing = tsMap.get(ts);
                        sensorFields.forEach(f => {
                            if (row[f] !== undefined && row[f] !== null) {
                                existing[fieldMap.get(f)!] = row[f];
                            }
                        });
                    });
                });
                
                mergedData = Array.from(tsMap.values());
            } else {
                // VERTICAL MERGE
                const firstHeader = JSON.stringify(results[0].meta.fields || Object.keys(results[0].data[0]||{}));
                for (let i = 1; i < results.length; i++) {
                    const currentHeader = JSON.stringify(results[i].meta.fields || Object.keys(results[i].data[0]||{}));
                    if (currentHeader !== firstHeader) {
                        alert('Error: File CSV yang di-merge vertikal tidak memiliki judul header yang sama persis!');
                        setIsLoading(false);
                        return;
                    }
                }
                results.forEach(res => {
                    mergedData = mergedData.concat(res.data);
                });
                finalFields = results[0].meta.fields || Object.keys(mergedData[0] || {});
            }
        } else {
            mergedData = results[0].data;
            finalFields = results[0].meta.fields || Object.keys(mergedData[0] || {});
        }

        const fields = finalFields;`;

fs.writeFileSync(path, txt.replace(searchMerge, replaceMerge));
console.log('App.tsx patched for horizontal merge.');
