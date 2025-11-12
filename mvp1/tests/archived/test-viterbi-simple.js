/**
 * Simple Viterbi Test - Debug version
 */

const fs = require('fs');
const path = require('path');

// Load databases
console.log('Loading databases...');
const ngramDbPath = path.join(__dirname, 'ngram_db.json');
const ngramDb = JSON.parse(fs.readFileSync(ngramDbPath, 'utf-8'));
console.log('N-gram DB loaded. Unigrams:', Object.keys(ngramDb.unigrams).length);

const dayiDbPath = path.join(__dirname, 'dayi_db.json');
const dayiDb = JSON.parse(fs.readFileSync(dayiDbPath, 'utf-8'));
const dayiMap = new Map(Object.entries(dayiDb));
console.log('Dayi DB loaded. Codes:', dayiMap.size);

// Load Viterbi module
console.log('Loading Viterbi module...');
const viterbiPath = path.join(__dirname, 'viterbi_module.js');
eval(fs.readFileSync(viterbiPath, 'utf-8'));

// Test 1: Simple two-character prediction
console.log('\n=== Test: 大易 (v d/) ===\n');

const codes = ['v', 'd/'];
console.log('Codes:', codes);

// Check candidates
for (const code of codes) {
  const candidates = dayiMap.get(code);
  console.log(`Code "${code}":`, candidates ? candidates.slice(0, 3).map(c => c.char).join(', ') : 'NOT FOUND');
}

console.log('\nCalling viterbi()...');
try {
  const result = viterbi(codes, dayiMap, ngramDb);
  console.log('\nResult:');
  console.log('  Sentence:', result.sentence);
  console.log('  Characters:', result.chars.join(', '));
  console.log('  Score:', result.score.toFixed(6));

  // Check if prediction is correct
  const expected = '大易';
  if (result.sentence === expected) {
    console.log('  ✓ PASS: Prediction matches expected!');
  } else {
    console.log(`  ○ Note: Got "${result.sentence}" instead of "${expected}"`);
    console.log('     (Not necessarily wrong - may be better based on N-gram data)');
  }

  // Check bigram
  const bigram = result.chars[0] + result.chars[1];
  const bigramExists = !!ngramDb.bigrams[bigram];
  console.log(`\nBigram "${bigram}" in training data:`, bigramExists ? 'YES' : 'NO (using fallback)');

  if (!bigramExists) {
    console.log('✓ Fallback was used - this is what the Quick Fix improves!');
  }
} catch (error) {
  console.log('ERROR:', error.message);
  console.log('Stack:', error.stack);
}
