const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const dayiMap = JSON.parse(fs.readFileSync(path.join(dataDir, 'dayi_db.json'), 'utf8'));
const freqMap = JSON.parse(fs.readFileSync(path.join(dataDir, 'freq_map.json'), 'utf8'));

const code = 'o';
const candidates = dayiMap[code];

console.log(`Candidates for code '${code}':`);
if (candidates) {
    const list = Array.isArray(candidates) ? candidates : [candidates];
    list.forEach(item => {
        const char = typeof item === 'object' ? item.char : item;
        const freq = freqMap[char] || 0;
        console.log(`  ${char} - Freq: ${freq}`);
    });
} else {
    console.log('No candidates.');
}
