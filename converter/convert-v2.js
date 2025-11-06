#!/usr/bin/env node

/**
 * WebDaYi Enhanced Data Pipeline Converter (v2)
 *
 * Converts Rime's dayi.dict.yaml to dayi_db.json with real-world frequency ranking
 * Input 1: raw_data/dayi.dict.yaml (format: char\tcode)
 * Input 2: raw_data/freq.yaml (format: char\trank) - OPTIONAL
 * Output: ../mvp1/dayi_db.json (format: { "code": [{ "char": "字", "freq": N }] })
 *
 * If freq.yaml is not provided, falls back to v1 algorithm (order-based frequency)
 */

const fs = require('fs');
const path = require('path');
const converter = require('./convert-v2-lib.js');

// File paths
const DAYI_INPUT = path.join(__dirname, 'raw_data', 'dayi.dict.yaml');
const FREQ_INPUT = path.join(__dirname, 'raw_data', 'freq.yaml');
const OUTPUT_FILE = path.join(__dirname, '..', 'mvp1', 'dayi_db.json');

console.log('[Converter v2] Starting enhanced YAML to JSON conversion...');
console.log(`[Converter v2] Dayi input: ${DAYI_INPUT}`);
console.log(`[Converter v2] Freq input: ${FREQ_INPUT}`);
console.log(`[Converter v2] Output: ${OUTPUT_FILE}`);

// Read Dayi dictionary YAML file
let dayiContent;
try {
  dayiContent = fs.readFileSync(DAYI_INPUT, 'utf-8');
  console.log('[Converter v2] ✓ Dayi dictionary loaded');
} catch (error) {
  console.error('[Converter v2] ✗ Failed to read Dayi dictionary:', error.message);
  process.exit(1);
}

// Read frequency YAML file (optional)
let freqContent = '';
let hasFreqFile = false;
try {
  freqContent = fs.readFileSync(FREQ_INPUT, 'utf-8');
  hasFreqFile = true;
  console.log('[Converter v2] ✓ Frequency file loaded');
} catch (error) {
  console.log('[Converter v2] ⚠ Frequency file not found, using fallback algorithm');
  console.log('[Converter v2]   To use frequency ranking, create: raw_data/freq.yaml');
}

// Parse frequency data
console.log('\n[Converter v2] Parsing frequency data...');
const freqMap = hasFreqFile ? converter.parseFrequencyYAML(freqContent) : new Map();
console.log(`[Converter v2] ✓ Parsed ${freqMap.size} frequency rankings`);

// Parse Dayi dictionary
console.log('\n[Converter v2] Parsing Dayi dictionary...');
const codeMap = converter.parseDayiYAML(dayiContent);
console.log(`[Converter v2] ✓ Parsed ${codeMap.size} unique codes`);

// Calculate total characters
let totalChars = 0;
for (const chars of codeMap.values()) {
  totalChars += chars.length;
}
console.log(`[Converter v2] ✓ Found ${totalChars} character entries`);

// Build database
console.log('\n[Converter v2] Building database with frequency ranking...');
const dbObject = converter.buildDatabase(codeMap, freqMap);

// Write JSON file
try {
  const jsonContent = JSON.stringify(dbObject, null, 2);
  fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf-8');
  console.log(`[Converter v2] ✓ JSON file written (${jsonContent.length} bytes)`);
} catch (error) {
  console.error('[Converter v2] ✗ Failed to write JSON file:', error.message);
  process.exit(1);
}

// Validation: spot-check some known mappings
console.log('\n[Converter v2] Validation checks:');

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
console.log('\n[Converter v2] Sample data (with frequencies):');
const sampleCodes = Array.from(codeMap.keys()).slice(0, 5);
for (const code of sampleCodes) {
  const candidates = dbObject[code].slice(0, 3);
  console.log(`  "${code}": [${candidates.map(c => `"${c.char}"(${c.freq})`).join(', ')}]`);
}

// Show frequency distribution stats
console.log('\n[Converter v2] Frequency statistics:');
let highFreqCount = 0; // freq >= 9000
let medFreqCount = 0;  // 2000 <= freq < 9000
let lowFreqCount = 0;  // freq < 2000

for (const candidates of Object.values(dbObject)) {
  for (const candidate of candidates) {
    if (candidate.freq >= 9000) highFreqCount++;
    else if (candidate.freq >= 2000) medFreqCount++;
    else lowFreqCount++;
  }
}

console.log(`  High frequency (>=9000): ${highFreqCount} characters`);
console.log(`  Medium frequency (2000-8999): ${medFreqCount} characters`);
console.log(`  Low frequency (<2000): ${lowFreqCount} characters`);

if (hasFreqFile) {
  const rankedChars = highFreqCount + Math.floor(medFreqCount * 0.8); // Rough estimate
  console.log(`  Characters with frequency ranking: ~${rankedChars}`);
  console.log(`  Characters using default frequency: ~${totalChars - rankedChars}`);
}

if (validationPassed) {
  console.log('\n[Converter v2] ✓ Conversion completed successfully!');
  console.log('[Converter v2] Database ready at: ../mvp1/dayi_db.json');
  process.exit(0);
} else {
  console.log('\n[Converter v2] ⚠ Conversion completed with validation warnings');
  process.exit(0);  // Still exit 0 as data was written
}
