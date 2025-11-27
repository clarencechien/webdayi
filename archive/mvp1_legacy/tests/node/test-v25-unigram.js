#!/usr/bin/env node
/**
 * Test v2.5 Unigram Interpolation Fix
 * Verify that Rare Word Trap is fixed
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('🧪 Testing v2.5 Unigram Interpolation');
console.log('='.repeat(80));
console.log('');

// Load viterbi_module.js
const viterbiCode = fs.readFileSync(path.join(__dirname, 'viterbi_module.js'), 'utf8');

// Execute the module code to define functions
eval(viterbiCode);

// Load databases
const dayiDbData = JSON.parse(fs.readFileSync(path.join(__dirname, 'dayi_db.json'), 'utf8'));
const dayiDb = new Map(Object.entries(dayiDbData));

const ngramDb = JSON.parse(fs.readFileSync(path.join(__dirname, 'ngram_db.json'), 'utf8'));

console.log('✓ Databases loaded');
console.log('✓ Viterbi v2.5 module loaded');
console.log('');

// Test Case 2: The failing case
const codes = ['dj', 'ev', 'ev', 'c8', 'lo', 'aj', 'ad', '.x', 'ax', 'ob'];
const expected = ['明', '天', '天', '氣', '如', '何', '會', '放', '假', '嗎'];

console.log('Test Case: "明天天氣如何會放假嗎"');
console.log('Codes: ' + codes.join(' '));
console.log('');

// Run Viterbi
const result = viterbi(codes, dayiDb, ngramDb);

console.log('='.repeat(80));
console.log('📊 RESULTS:');
console.log('='.repeat(80));
console.log('');
console.log('Expected: ' + expected.join(''));
console.log('Got:      ' + result.sentence);
console.log('Score:    ' + result.score.toFixed(6));
console.log('');

// Character-by-character analysis
console.log('Character-by-character:');
let correctCount = 0;
for (let i = 0; i < 10; i++) {
  const status = result.chars[i] === expected[i] ? '✓' : '✗';
  const statusColor = result.chars[i] === expected[i] ? '' : ' ← WRONG';
  console.log(`  ${i}. ${codes[i]} → ${result.chars[i]} (expected: ${expected[i]}) ${status}${statusColor}`);

  if (result.chars[i] === expected[i]) {
    correctCount++;
  }
}

console.log('');
console.log('='.repeat(80));
console.log('🎯 VERDICT:');
console.log('='.repeat(80));
console.log('');
console.log(`Accuracy: ${correctCount}/10 (${(correctCount/10*100).toFixed(0)}%)`);
console.log('');

if (correctCount === 10) {
  console.log('✅✅✅ TEST PASSED! v2.5 FIXES THE RARE WORD TRAP!');
  console.log('');
  console.log('Success: Unigram interpolation ensures common words beat rare combinations');
  console.log('  - "會放假" (common words) now beats "侚艭傻" (rare characters)');
  console.log('  - 0.7 * log(P(B|A)) + 0.3 * log(P(B)) balances context and popularity');
} else if (correctCount >= 8) {
  console.log('✓ Major Improvement! 80%+ accuracy achieved');
  console.log('');
  console.log('Remaining errors:');
  for (let i = 0; i < 10; i++) {
    if (result.chars[i] !== expected[i]) {
      console.log(`  - Position ${i}: ${codes[i]} → ${result.chars[i]} (expected: ${expected[i]})`);
    }
  }
  console.log('');
  console.log('May need to adjust interpolation weights (currently 0.7/0.3)');
} else {
  console.log('⚠️ Still below 80% - needs further investigation');
  console.log('');
  console.log('Errors:');
  for (let i = 0; i < 10; i++) {
    if (result.chars[i] !== expected[i]) {
      console.log(`  - Position ${i}: ${codes[i]} → ${result.chars[i]} (expected: ${expected[i]})`);
    }
  }
}

console.log('');
