const fs = require('fs');
const path = require('path');

const CIN_PATH = path.join(__dirname, '../data/dayi4.cin');
const NGRAM_PATH = path.join(__dirname, '../data/ngram_pruned.json');
const OUTPUT_PATH = path.join(__dirname, '../data/bigram_lite.json');

// Load Data
console.log('Loading data...');
if (!fs.existsSync(CIN_PATH) || !fs.existsSync(NGRAM_PATH)) {
    console.error('Missing source files!');
    process.exit(1);
}

// Parse CIN File
console.log('Parsing dayi4.cin...');
const cinContent = fs.readFileSync(CIN_PATH, 'utf8');
const charToCode = {};
let inCharDef = false;

const lines = cinContent.split('\n');
for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '%chardef begin') {
        inCharDef = true;
        continue;
    }
    if (trimmed === '%chardef end') {
        inCharDef = false;
        break;
    }
    if (!inCharDef) continue;

    // Format: code char
    // e.g. ", 力"
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
        const code = parts[0];
        const char = parts[1];

        // Store shortest code for the char
        if (!charToCode[char] || code.length < charToCode[char].length) {
            charToCode[char] = code;
        }
    }
}

console.log(`Loaded codes for ${Object.keys(charToCode).length} characters.`);

// Load Ngram Data
console.log('Loading ngram_pruned.json...');
const ngramDb = JSON.parse(fs.readFileSync(NGRAM_PATH, 'utf8'));

// Process Bigrams
const bigramMap = {}; // { "CharA": { "nextCodeChar": "CharB" } }

// Determine source data structure
let sourceData = ngramDb;
if (ngramDb.bigrams) {
    sourceData = ngramDb.bigrams;
} else if (ngramDb.unigrams) {
    // If unigrams is a key, maybe bigrams are mixed in root?
    // Or maybe we just iterate the root keys that are length 2?
    // Let's assume root keys.
    sourceData = ngramDb;
}

let count = 0;
Object.entries(sourceData).forEach(([word, prob]) => {
    if (word.length !== 2) return;

    const charA = word[0];
    const charB = word[1];

    // Get code for charB
    const codeB = charToCode[charB];
    if (!codeB) return; // No code found for B

    const triggerKey = codeB[0]; // First key of the code

    if (!bigramMap[charA]) {
        bigramMap[charA] = {};
    }

    // Strategy: Keep the highest probability one for this trigger key
    const current = bigramMap[charA][triggerKey];

    // Ensure prob is a number
    const probability = typeof prob === 'number' ? prob : 0;

    if (!current || probability > current.prob) {
        bigramMap[charA][triggerKey] = { char: charB, prob: probability };
    }
    count++;
});

// Clean up to just { "CharA": { "t": "CharB" } }
const finalOutput = {};
Object.entries(bigramMap).forEach(([charA, nextMap]) => {
    finalOutput[charA] = {};
    Object.entries(nextMap).forEach(([key, obj]) => {
        finalOutput[charA][key] = obj.char;
    });
});

console.log(`Processed ${count} bigrams.`);
console.log(`Generated prediction map for ${Object.keys(finalOutput).length} characters.`);
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalOutput, null, 2));
console.log('Done.');
