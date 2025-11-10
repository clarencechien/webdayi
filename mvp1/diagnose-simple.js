/**
 * Simple N-gram Diagnostic
 */

const fs = require('fs');

// Load data
const ngramDb = JSON.parse(fs.readFileSync('ngram_db.json', 'utf-8'));
const dayiDb = JSON.parse(fs.readFileSync('dayi_db.json', 'utf-8'));

console.log('=== N-gram Database Check ===\\n');

const unigrams = ngramDb.unigrams || {};
const bigrams = ngramDb.bigrams || {};

console.log('Stats:');
console.log('  Unigrams:', Object.keys(unigrams).length);
console.log('  Bigrams:', Object.keys(bigrams).length);
console.log('  Total chars:', ngramDb.total_chars || 0);
console.log('  Smoothing:', ngramDb.smoothing_alpha || 0);

// Problem 1: Check if smoothing params exist
console.log('\\nProblem 1: Smoothing Parameters');
if (!ngramDb.total_chars || !ngramDb.smoothing_alpha) {
  console.log('  [FAIL] Missing smoothing parameters!');
  console.log('  Impact: Unseen bigrams get hardcoded 1e-10 (too small)');
  console.log('  Fix: Regenerate ngram_db.json with smoothing params');
} else {
  console.log('  [PASS] Smoothing parameters exist');
}

// Problem 2: Check unigram normalization
console.log('\\nProblem 2: Unigram Normalization');
const unigramSum = Object.values(unigrams).reduce((a, b) => a + b, 0);
console.log('  Sum:', unigramSum.toFixed(6));
if (Math.abs(unigramSum - 1.0) > 0.01) {
  console.log('  [FAIL] Unigrams do not sum to 1.0');
  console.log('  Fix: Check build_ngram.py probability calculation');
} else {
  console.log('  [PASS] Properly normalized');
}

// Problem 3: Check bigram coverage
console.log('\\nProblem 3: Bigram Coverage');
const commonBigrams = ['的是', '一個', '可以', '這個', '我們', '中國'];
let found = 0;
for (const bg of commonBigrams) {
  if (bigrams[bg]) {
    found++;
    console.log('  [OK]', bg + ':', bigrams[bg].toFixed(6));
  } else {
    console.log('  [MISS]', bg + ': not found');
  }
}
console.log('  Coverage:', found + '/' + commonBigrams.length);

// Problem 4: Check algorithm implementation
console.log('\\nProblem 4: Algorithm Check');
console.log('  Reading viterbi_module.js...');
const viterbiCode = fs.readFileSync('viterbi_module.js', 'utf-8');

// Check for smoothing usage
if (viterbiCode.includes('1e-10') || viterbiCode.includes('1e-8')) {
  console.log('  [ISSUE] Found hardcoded small values (1e-10 or 1e-8)');
  console.log('  Line: const bigramProb = ngramDb.bigrams[bigram] || 1e-10;');
  console.log('  Problem: Unseen bigrams get extreme penalty');
  console.log('  Fix: Use Laplace smoothing instead');
} else {
  console.log('  [OK] No hardcoded small values found');
}

// Summary
console.log('\\n=== Summary ===');
console.log('\\nMost Likely Root Causes:');
console.log('1. [DATA] Missing smoothing parameters in ngram_db.json');
console.log('   - total_chars = 0');
console.log('   - smoothing_alpha = 0');
console.log('');
console.log('2. [ALGORITHM] Hardcoded 1e-10 fallback too punitive');
console.log('   - Unseen bigrams get extreme negative log-prob');
console.log('   - Should use: (count + alpha) / (total + alpha * V)');
console.log('');
console.log('Recommended Fix:');
console.log('1. Regenerate ngram_db.json with proper smoothing params');
console.log('2. Update viterbi_module.js to use Laplace smoothing');
console.log('3. Test with real sentences');
