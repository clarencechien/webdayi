#!/usr/bin/env node

/**
 * Convert feq.yaml (from main branch) to freq.yaml format
 * Input: feq.yaml (YAML format: rank: char)
 * Output: freq.yaml (TSV format: char\trank)
 */

const fs = require('fs');
const path = require('path');

console.log('[Converter] Converting feq.yaml to freq.yaml format...');

const INPUT_FILE = path.join(__dirname, 'raw_data', 'feq.yaml');
const OUTPUT_FILE = path.join(__dirname, 'raw_data', 'freq.yaml');

// Read input file
let content;
try {
  content = fs.readFileSync(INPUT_FILE, 'utf-8');
  console.log(`[Converter] ✓ Read ${INPUT_FILE}`);
} catch (error) {
  console.error(`[Converter] ✗ Failed to read ${INPUT_FILE}:`, error.message);
  process.exit(1);
}

// Parse YAML-like format: "  序號: 字元"
const lines = content.split('\n');
const freqData = [];

for (const line of lines) {
  // Match pattern: "  1234: 字"
  const match = line.match(/^\s+(\d+):\s+(.+)$/);
  if (match) {
    const rank = parseInt(match[1], 10);
    const char = match[2].trim();
    freqData.push({ rank, char });
  }
}

console.log(`[Converter] ✓ Parsed ${freqData.length} character entries`);

// Verify we have 2000 entries
if (freqData.length !== 2000) {
  console.warn(`[Converter] ⚠ Warning: Expected 2000 entries but got ${freqData.length}`);
}

// Sort by rank to ensure correct order
freqData.sort((a, b) => a.rank - b.rank);

// Generate output in TSV format: char\trank
let output = '# 教育部高頻漢字前 2000 字\n';
output += '# 來源：台灣教育部常用字頻率統計\n';
output += '# 格式：char\\trank\n';
output += '# Rank 1 = 最常用字，Rank 2000 = 第 2000 名\n';
output += '---\n';

for (const entry of freqData) {
  output += `${entry.char}\t${entry.rank}\n`;
}

// Write output file
try {
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`[Converter] ✓ Written ${OUTPUT_FILE} (${output.length} bytes)`);
} catch (error) {
  console.error(`[Converter] ✗ Failed to write ${OUTPUT_FILE}:`, error.message);
  process.exit(1);
}

// Show sample data
console.log('\n[Converter] Sample data (first 10):');
for (let i = 0; i < Math.min(10, freqData.length); i++) {
  console.log(`  Rank ${freqData[i].rank}: ${freqData[i].char}`);
}

console.log('\n[Converter] Sample data (last 10):');
for (let i = Math.max(0, freqData.length - 10); i < freqData.length; i++) {
  console.log(`  Rank ${freqData[i].rank}: ${freqData[i].char}`);
}

console.log('\n[Converter] ✓ Conversion completed successfully!');
console.log('[Converter] Next step: Run "node convert-v2.js" to generate dayi_db.json');
