const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const dayiMap = JSON.parse(fs.readFileSync(path.join(dataDir, 'dayi_db.json'), 'utf8'));

const target = '灣';
console.log(`Searching codes for '${target}'...`);

for (const [code, val] of Object.entries(dayiMap)) {
    const list = Array.isArray(val) ? val : [val];
    for (const item of list) {
        const char = typeof item === 'object' ? item.char : item;
        if (char === target) {
            console.log(`Found '${target}' at code: ${code}`);
        }
    }
}
