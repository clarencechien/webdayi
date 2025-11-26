#!/usr/bin/env node

/**
 * WebDaYi CIN Converter
 *
 * Converts dayi4.cin to dayi_db.json
 * Input: converter/raw_data/dayi4.cin
 * Output: lite/data/dayi_db.json
 */

const fs = require('fs');
const path = require('path');

// File paths
const INPUT_FILE = path.join(__dirname, '..', 'lite', 'data', 'dayi4.cin');
const OUTPUT_FILE = path.join(__dirname, '..', 'lite', 'dayi_db.json');

console.log('[Converter] Starting CIN to JSON conversion...');
console.log(`[Converter] Input: ${INPUT_FILE}`);
console.log(`[Converter] Output: ${OUTPUT_FILE}`);

// Read CIN file
let cinContent;
try {
    cinContent = fs.readFileSync(INPUT_FILE, 'utf-8');
    console.log('[Converter] ✓ CIN file loaded');
} catch (error) {
    console.error('[Converter] ✗ Failed to read CIN file:', error.message);
    process.exit(1);
}

// Parse CIN into code->characters mapping
const codeMap = new Map();
let lineCount = 0;
let dataLineCount = 0;
let inCharDef = false;

const lines = cinContent.split('\n');

for (const line of lines) {
    lineCount++;
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) continue;

    // Check for section markers
    if (trimmedLine === '%chardef begin') {
        inCharDef = true;
        continue;
    }
    if (trimmedLine === '%chardef end') {
        inCharDef = false;
        break; // End of data
    }

    // Process data lines only inside %chardef
    if (!inCharDef) continue;

    // Parse line: code char
    // CIN files usually use space or tab as separator
    // Some lines might have comments or multiple spaces
    const parts = trimmedLine.split(/\s+/);

    if (parts.length < 2) continue;

    const code = parts[0];
    const char = parts[1];

    if (!code || !char) continue;

    // Add to map
    if (!codeMap.has(code)) {
        codeMap.set(code, []);
    }

    // Add character
    // For CIN files, the order in the file usually implies priority.
    // We'll assign frequency based on order (first = highest).
    const currentEntries = codeMap.get(code);

    // Check if char already exists for this code (avoid duplicates)
    if (currentEntries.some(e => e.char === char)) continue;

    // Base frequency = 100, decrement by 1 for each subsequent entry
    const freq = 100 - currentEntries.length;

    codeMap.get(code).push({
        char: char,
        freq: freq > 0 ? freq : 1
    });

    dataLineCount++;
}

console.log(`[Converter] ✓ Parsed ${dataLineCount} data lines`);
console.log(`[Converter] ✓ Found ${codeMap.size} unique codes`);

// Convert Map to plain object
const dbObject = {};
for (const [code, candidates] of codeMap.entries()) {
    // Sort candidates by frequency (descending) - though they should already be in order
    candidates.sort((a, b) => b.freq - a.freq);
    dbObject[code] = candidates;
}

// Write JSON file
try {
    // Ensure directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const jsonContent = JSON.stringify(dbObject, null, 2);
    fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf-8');
    console.log(`[Converter] ✓ JSON file written (${jsonContent.length} bytes)`);
} catch (error) {
    console.error('[Converter] ✗ Failed to write JSON file:', error.message);
    process.exit(1);
}

// Validation
console.log('\n[Converter] Validation checks:');
const testCases = [
    { code: 'v', expectedChar: '大' },
    { code: 'a', expectedChars: ['人', '入'] },
];

let validationPassed = true;
for (const test of testCases) {
    if (test.expectedChar) {
        const found = dbObject[test.code]?.some(c => c.char === test.expectedChar);
        if (found) console.log(`  ✓ "${test.code}" → includes "${test.expectedChar}"`);
        else {
            console.log(`  ✗ "${test.code}" → missing "${test.expectedChar}"`);
            validationPassed = false;
        }
    }
    if (test.expectedChars) {
        const allFound = test.expectedChars.every(expectedChar =>
            dbObject[test.code]?.some(c => c.char === expectedChar)
        );
        if (allFound) console.log(`  ✓ "${test.code}" → includes ${test.expectedChars.join(', ')}`);
        else {
            console.log(`  ✗ "${test.code}" → missing some expected characters`);
            validationPassed = false;
        }
    }
}

if (validationPassed) {
    console.log('\n[Converter] ✓ Conversion completed successfully!');
} else {
    console.log('\n[Converter] ⚠ Conversion completed with validation warnings');
}
