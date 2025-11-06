#!/usr/bin/env node

/**
 * WebDaYi Data Pipeline Converter
 *
 * Converts Rime's dayi.dict.yaml to dayi_db.json
 * Input: raw_data/dayi.dict.yaml (format: char\tcode)
 * Output: ../mvp1/dayi_db.json (format: { "code": [{ "char": "字", "freq": N }] })
 */

const fs = require('fs');
const path = require('path');

// File paths
const INPUT_FILE = path.join(__dirname, 'raw_data', 'dayi.dict.yaml');
const OUTPUT_FILE = path.join(__dirname, '..', 'mvp1', 'dayi_db.json');

console.log('[Converter] Starting YAML to JSON conversion...');
console.log(`[Converter] Input: ${INPUT_FILE}`);
console.log(`[Converter] Output: ${OUTPUT_FILE}`);

// Read YAML file
let yamlContent;
try {
  yamlContent = fs.readFileSync(INPUT_FILE, 'utf-8');
  console.log('[Converter] ✓ YAML file loaded');
} catch (error) {
  console.error('[Converter] ✗ Failed to read YAML file:', error.message);
  process.exit(1);
}

// Parse YAML into code->characters mapping
const codeMap = new Map();
let lineCount = 0;
let dataLineCount = 0;
let skipCount = 0;

const lines = yamlContent.split('\n');

for (const line of lines) {
  lineCount++;

  // Skip empty lines
  if (!line.trim()) {
    skipCount++;
    continue;
  }

  // Skip header/metadata lines
  if (line.startsWith('#') ||
      line.startsWith('---') ||
      line.startsWith('...') ||
      line.includes('name:') ||
      line.includes('version:') ||
      line.includes('sort:') ||
      line.includes('use_preset')) {
    skipCount++;
    continue;
  }

  // Parse data line: char\tcode
  const parts = line.split('\t');
  if (parts.length !== 2) {
    skipCount++;
    continue;
  }

  const char = parts[0].trim();
  const code = parts[1].trim();

  if (!char || !code) {
    skipCount++;
    continue;
  }

  // Add to map
  if (!codeMap.has(code)) {
    codeMap.set(code, []);
  }

  // Add character with frequency based on order (first = highest)
  // Base frequency = 100, decrement by 1 for each subsequent entry
  const currentEntries = codeMap.get(code);
  const freq = 100 - currentEntries.length;

  codeMap.get(code).push({
    char: char,
    freq: freq > 0 ? freq : 1  // Minimum freq of 1
  });

  dataLineCount++;
}

console.log(`[Converter] ✓ Parsed ${dataLineCount} data lines (${skipCount} skipped, ${lineCount} total)`);
console.log(`[Converter] ✓ Found ${codeMap.size} unique codes`);

// Convert Map to plain object
const dbObject = {};
for (const [code, candidates] of codeMap.entries()) {
  // Sort candidates by frequency (descending)
  candidates.sort((a, b) => b.freq - a.freq);
  dbObject[code] = candidates;
}

// Write JSON file
try {
  const jsonContent = JSON.stringify(dbObject, null, 2);
  fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf-8');
  console.log(`[Converter] ✓ JSON file written (${jsonContent.length} bytes)`);
} catch (error) {
  console.error('[Converter] ✗ Failed to write JSON file:', error.message);
  process.exit(1);
}

// Validation: spot-check some known mappings
console.log('\n[Converter] Validation checks:');

const testCases = [
  { code: 'v', expectedChar: '大' },
  { code: 'a', expectedChars: ['人', '入'] },
];

let validationPassed = true;

for (const test of testCases) {
  if (test.expectedChar) {
    const found = dbObject[test.code]?.some(c => c.char === test.expectedChar);
    if (found) {
      console.log(`  ✓ "${test.code}" → includes "${test.expectedChar}"`);
    } else {
      console.log(`  ✗ "${test.code}" → missing "${test.expectedChar}"`);
      validationPassed = false;
    }
  }

  if (test.expectedChars) {
    const allFound = test.expectedChars.every(expectedChar =>
      dbObject[test.code]?.some(c => c.char === expectedChar)
    );
    if (allFound) {
      console.log(`  ✓ "${test.code}" → includes ${test.expectedChars.join(', ')}`);
    } else {
      console.log(`  ✗ "${test.code}" → missing some expected characters`);
      validationPassed = false;
    }
  }
}

// Show sample data
console.log('\n[Converter] Sample data:');
const sampleCodes = Array.from(codeMap.keys()).slice(0, 3);
for (const code of sampleCodes) {
  const candidates = dbObject[code].slice(0, 3);
  console.log(`  "${code}": [${candidates.map(c => `"${c.char}"(${c.freq})`).join(', ')}]`);
}

if (validationPassed) {
  console.log('\n[Converter] ✓ Conversion completed successfully!');
  process.exit(0);
} else {
  console.log('\n[Converter] ⚠ Conversion completed with validation warnings');
  process.exit(0);  // Still exit 0 as data was written
}
