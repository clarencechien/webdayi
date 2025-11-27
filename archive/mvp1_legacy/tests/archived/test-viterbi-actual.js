/**
 * Test Viterbi Algorithm with Actual Prediction
 *
 * This script runs the Viterbi algorithm on the failing test cases
 * and shows what it actually predicts vs what we expect.
 */

const fs = require('fs');
const path = require('path');

// Load databases
const dayiDbPath = path.join(__dirname, 'dayi_db.json');
const ngramDbPath = path.join(__dirname, 'ngram_db.json');

console.log('Loading databases...');
const dayiDbRaw = JSON.parse(fs.readFileSync(dayiDbPath, 'utf-8'));
const ngramDb = JSON.parse(fs.readFileSync(ngramDbPath, 'utf-8'));

// Convert to Map
const dayiDb = new Map(Object.entries(dayiDbRaw));

// Load Viterbi module (from viterbi_module.js, adapted for Node.js)
function getLaplaceUnigram(char, ngramDb) {
  const count = ngramDb.unigram_counts[char] || 0;
  const alpha = ngramDb.smoothing_alpha;
  const totalChars = ngramDb.total_chars;
  const vocabSize = ngramDb.vocab_size;
  return (count + alpha) / (totalChars + alpha * vocabSize);
}

function getLaplaceBigram(char1, char2, ngramDb) {
  const bigram = char1 + char2;
  const bigramCount = ngramDb.bigram_counts[bigram] || 0;
  const unigramCount = ngramDb.unigram_counts[char1] || 0;
  const alpha = ngramDb.smoothing_alpha;
  const vocabSize = ngramDb.vocab_size;
  return (bigramCount + alpha) / (unigramCount + alpha * vocabSize);
}

function buildLattice(codes, dayiDb) {
  const lattice = [];
  for (const code of codes) {
    const candidates = dayiDb.get(code);
    if (!candidates || candidates.length === 0) {
      throw new Error(`No candidates found for code: ${code}`);
    }
    lattice.push(candidates);
  }
  return lattice;
}

function initializeDP(lattice, ngramDb) {
  const dp = [];
  const numPositions = lattice.length;

  const firstDP = {};
  for (const candidate of lattice[0]) {
    const char = candidate.char;
    const unigramProb = getLaplaceUnigram(char, ngramDb);
    firstDP[char] = Math.log(unigramProb);
  }
  dp.push(firstDP);

  for (let i = 1; i < numPositions; i++) {
    dp.push({});
  }

  return dp;
}

function forwardPass(lattice, dp, backpointer, ngramDb) {
  for (let t = 1; t < lattice.length; t++) {
    for (const candidate of lattice[t]) {
      const char2 = candidate.char;
      let maxProb = -Infinity;
      let maxPrevChar = null;

      for (const prevChar in dp[t-1]) {
        const bigramProb = getLaplaceBigram(prevChar, char2, ngramDb);
        const prob = dp[t-1][prevChar] + Math.log(bigramProb);

        if (prob > maxProb) {
          maxProb = prob;
          maxPrevChar = prevChar;
        }
      }

      dp[t][char2] = maxProb;
      backpointer[t][char2] = maxPrevChar;
    }
  }
}

function backtrack(dp, backpointer) {
  const lastT = dp.length - 1;

  let maxChar = null;
  let maxProb = -Infinity;

  for (const char in dp[lastT]) {
    if (dp[lastT][char] > maxProb) {
      maxProb = dp[lastT][char];
      maxChar = char;
    }
  }

  const chars = [];
  let currentChar = maxChar;

  for (let t = lastT; t >= 0; t--) {
    chars.unshift(currentChar);
    currentChar = backpointer[t][currentChar];
  }

  return {
    sentence: chars.join(''),
    score: maxProb,
    chars: chars
  };
}

function viterbi(codes, dayiDb, ngramDb) {
  if (!codes || codes.length === 0) {
    throw new Error("Codes array cannot be empty");
  }

  const lattice = buildLattice(codes, dayiDb);
  const dp = initializeDP(lattice, ngramDb);
  const backpointer = Array(lattice.length).fill(null).map(() => ({}));

  forwardPass(lattice, dp, backpointer, ngramDb);

  const result = backtrack(dp, backpointer);
  result.lattice = lattice;

  return result;
}

// Test Case 1
console.log('=== Test Case 1 ===');
const test1Codes = ['v', 'm,', 'lg', 'v5', 'd9', 'v', 'wg', '2e'];
const test1Expected = '大家好我是大學生';

const result1 = viterbi(test1Codes, dayiDb, ngramDb);

console.log(`Expected: ${test1Expected}`);
console.log(`Got:      ${result1.sentence}`);
console.log(`Score:    ${result1.score.toFixed(3)}`);
console.log(`Match:    ${result1.sentence === test1Expected ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Show character breakdown
console.log('Character breakdown:');
result1.chars.forEach((char, i) => {
  const code = test1Codes[i];
  const expected = test1Expected[i];
  const match = char === expected ? '✓' : '✗';
  console.log(`  ${match} ${char} (${code}) ${char === expected ? '' : '!= ' + expected}`);
});
console.log('');

// Test Case 2
console.log('=== Test Case 2 ===');
const test2Codes = ['dj', 'ev', 'ev', 'c8', 'lo', 'aj', 'ad', '.x', 'ax', 'ob'];
const test2Expected = '明天天氣如何會放假嗎';

const result2 = viterbi(test2Codes, dayiDb, ngramDb);

console.log(`Expected: ${test2Expected}`);
console.log(`Got:      ${result2.sentence}`);
console.log(`Score:    ${result2.score.toFixed(3)}`);
console.log(`Match:    ${result2.sentence === test2Expected ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Show character breakdown
console.log('Character breakdown:');
result2.chars.forEach((char, i) => {
  const code = test2Codes[i];
  const expected = test2Expected[i];
  const match = char === expected ? '✓' : '✗';
  console.log(`  ${match} ${char} (${code}) ${char === expected ? '' : '!= ' + expected}`);
});
console.log('');

// Detailed analysis for position where it fails
console.log('=== Detailed Analysis for Test Case 2 ===');
console.log('Analyzing why wrong characters were selected...');
console.log('');

// Find first mismatch
let firstMismatch = -1;
for (let i = 0; i < result2.chars.length; i++) {
  if (result2.chars[i] !== test2Expected[i]) {
    firstMismatch = i;
    break;
  }
}

if (firstMismatch >= 0) {
  const wrongChar = result2.chars[firstMismatch];
  const correctChar = test2Expected[firstMismatch];
  const code = test2Codes[firstMismatch];
  const prevChar = firstMismatch > 0 ? result2.chars[firstMismatch - 1] : null;

  console.log(`First mismatch at position ${firstMismatch}:`);
  console.log(`  Code: ${code}`);
  console.log(`  Got: ${wrongChar}`);
  console.log(`  Expected: ${correctChar}`);
  if (prevChar) {
    console.log(`  Previous char: ${prevChar}`);
    console.log('');
    console.log('Comparing bigram probabilities:');

    const wrongBigram = prevChar + wrongChar;
    const correctBigram = prevChar + correctChar;

    const wrongBigramCount = ngramDb.bigram_counts[wrongBigram] || 0;
    const correctBigramCount = ngramDb.bigram_counts[correctBigram] || 0;

    const wrongBigramProb = getLaplaceBigram(prevChar, wrongChar, ngramDb);
    const correctBigramProb = getLaplaceBigram(prevChar, correctChar, ngramDb);

    console.log(`  ${wrongBigram}: count=${wrongBigramCount}, prob=${wrongBigramProb.toExponential(6)}, log=${Math.log(wrongBigramProb).toFixed(6)}`);
    console.log(`  ${correctBigram}: count=${correctBigramCount}, prob=${correctBigramProb.toExponential(6)}, log=${Math.log(correctBigramProb).toFixed(6)}`);
    console.log('');
    console.log(`Winner: ${wrongBigramProb > correctBigramProb ? wrongBigram : correctBigram} (higher probability)`);
  }
}
