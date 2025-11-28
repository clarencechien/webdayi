const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const bigramData = JSON.parse(fs.readFileSync(path.join(dataDir, 'bigram_lite.json'), 'utf8'));
const freqMap = JSON.parse(fs.readFileSync(path.join(dataDir, 'freq_map.json'), 'utf8'));

const targets = ['謝', '台'];

console.log('--- Bigram Candidates Inspection ---');

targets.forEach(ctx => {
    const candidates = bigramData[ctx];
    if (!candidates) {
        console.log(`[${ctx}] No bigram data.`);
        return;
    }

    const list = [];
    for (const [code, char] of Object.entries(candidates)) {
        const freq = freqMap[char] || 0;
        list.push({ code, char, freq });
    }

    // Sort by freq desc (simulating predictNextChar logic)
    list.sort((a, b) => b.freq - a.freq);

    console.log(`[${ctx}] Candidates:`);
    list.forEach(item => {
        console.log(`  ${item.char} (${item.code}) - Freq: ${item.freq}`);
    });
    console.log('');
});
