const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/bigram_lite.json');
const bigramData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const patches = {
    '大': { 's': '家' }, // 大 -> 家 (so)
    '不': { 'o': '知' }, // 不 -> 知 (or)
    '謝': { 'i': '謝' }, // 謝 -> 謝 (ii)
    '明': { 'e': '天' }, // 明 -> 天 (ev)
    '台': { 'b': '北', 'x': '灣' }, // 台 -> 北 (bf), 台 -> 灣 (xb)
    '因': { 'b': '為' }, // 因 -> 為 (bi)
    '所': { 'h': '以' }, // 所 -> 以 (h.)
    '但': { 'd': '是' }, // 但 -> 是 (d)
    '開': { 'l': '始' }, // 開 -> 始 (l.)
    '覺': { 'a': '得' }, // 覺 -> 得 (ao)
    '可': { 'h': '以' }  // 可 -> 以 (h.)
};

let added = 0;
let updated = 0;

for (const [key, map] of Object.entries(patches)) {
    if (!bigramData[key]) {
        bigramData[key] = {};
        added++;
    }
    for (const [code, char] of Object.entries(map)) {
        bigramData[key][code] = char;
        updated++;
    }
}

const removals = {
    '大': ['/'], // Remove '的' (code /)
    '謝': ['b', 'v', 'a', 'e', 't'], // Remove '了', '大', '你', '天', '絕'
    '明': ['b'], // Remove '了'
    '台': ['3', 'w', 'l'], // Remove '縣', '山', '女'
    '因': ['d', 'a', 'k'], // Remove '是', '人', '之'
    '開': ['b'], // Remove '了'
    '覺': ['/', 'd', '9', 'w'] // Remove '的', '是', '上', '出'
};

for (const [key, codes] of Object.entries(removals)) {
    if (bigramData[key]) {
        codes.forEach(code => {
            if (bigramData[key][code]) {
                console.log(`Removing ${key} -> ${bigramData[key][code]} (${code})`);
                delete bigramData[key][code];
                updated++;
            } else {
                console.log(`Key ${key} -> code ${code} not found for removal.`);
            }
        });
    }
}

fs.writeFileSync(dataPath, JSON.stringify(bigramData), 'utf8');

console.log(`Patched bigram_lite.json: Added ${added} keys, Updated/Removed ${updated} entries.`);
