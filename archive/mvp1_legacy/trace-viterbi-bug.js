/**
 * Trace Viterbi Bug: Detailed DP Table Analysis
 *
 * This script traces through the Viterbi algorithm step-by-step
 * to understand why it's choosing "真" over "氣" despite lower bigram probability.
 */

const fs = require('fs');
const path = require('path');

// Load databases
const dayiDbPath = path.join(__dirname, 'dayi_db.json');
const ngramDbPath = path.join(__dirname, 'ngram_db.json');

const dayiDbRaw = JSON.parse(fs.readFileSync(dayiDbPath, 'utf-8'));
const ngramDb = JSON.parse(fs.readFileSync(ngramDbPath, 'utf-8'));
const dayiDb = new Map(Object.entries(dayiDbRaw));

// Viterbi functions
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

// Test simplified sequence: just the first 4 codes
console.log('=== Tracing Viterbi for: 明天天氣 ===');
const codes = ['dj', 'ev', 'ev', 'c8'];
const expectedChars = ['明', '天', '天', '氣'];

const lattice = buildLattice(codes, dayiDb);

console.log('Lattice (top 3 candidates for each position):');
lattice.forEach((candidates, i) => {
  const top3 = candidates.slice(0, 3).map(c => `${c.char}(${c.freq})`).join(', ');
  console.log(`  Position ${i} (${codes[i]}): [${top3}]`);
});
console.log('');

// Initialize DP
const dp = initializeDP(lattice, ngramDb);
const backpointer = Array(lattice.length).fill(null).map(() => ({}));

console.log('Position 0 (明):');
console.log(`  DP scores:`);
Object.keys(dp[0]).slice(0, 3).forEach(char => {
  const score = dp[0][char];
  const prob = getLaplaceUnigram(char, ngramDb);
  console.log(`    ${char}: ${score.toFixed(6)} (unigram_prob=${prob.toExponential(6)})`);
});
console.log('');

// Forward pass for position 1 (天)
console.log('Position 1 (天):');
const t = 1;
for (const candidate of lattice[t]) {
  const char2 = candidate.char;
  let maxProb = -Infinity;
  let maxPrevChar = null;

  console.log(`  Candidate: ${char2}`);

  for (const prevChar in dp[t-1]) {
    const bigramProb = getLaplaceBigram(prevChar, char2, ngramDb);
    const prob = dp[t-1][prevChar] + Math.log(bigramProb);

    console.log(`    From ${prevChar}: bigram_prob=${bigramProb.toExponential(6)}, log=${Math.log(bigramProb).toFixed(6)}, total=${prob.toFixed(6)}`);

    if (prob > maxProb) {
      maxProb = prob;
      maxPrevChar = prevChar;
    }
  }

  dp[t][char2] = maxProb;
  backpointer[t][char2] = maxPrevChar;

  console.log(`  Best: ${maxPrevChar} → ${char2} (score=${maxProb.toFixed(6)})`);

  // Only show top 3
  if (Object.keys(dp[t]).length >= 3) break;
}
console.log('');

// Forward pass for position 2 (天)
console.log('Position 2 (天):');
const t2 = 2;
for (const candidate of lattice[t2]) {
  const char2 = candidate.char;
  let maxProb = -Infinity;
  let maxPrevChar = null;

  console.log(`  Candidate: ${char2}`);

  for (const prevChar in dp[t2-1]) {
    const bigramProb = getLaplaceBigram(prevChar, char2, ngramDb);
    const prob = dp[t2-1][prevChar] + Math.log(bigramProb);

    console.log(`    From ${prevChar}: bigram_prob=${bigramProb.toExponential(6)}, log=${Math.log(bigramProb).toFixed(6)}, total=${prob.toFixed(6)}`);

    if (prob > maxProb) {
      maxProb = prob;
      maxPrevChar = prevChar;
    }
  }

  dp[t2][char2] = maxProb;
  backpointer[t2][char2] = maxPrevChar;

  console.log(`  Best: ${maxPrevChar} → ${char2} (score=${maxProb.toFixed(6)})`);

  // Only show top 3
  if (Object.keys(dp[t2]).length >= 3) break;
}
console.log('');

// Forward pass for position 3 (c8: 氣 vs 真)
console.log('Position 3 (c8: 氣 vs 真):');
const t3 = 3;
const targetCandidates = ['氣', '真'];

for (const targetChar of targetCandidates) {
  const candidate = lattice[t3].find(c => c.char === targetChar);
  if (!candidate) {
    console.log(`  Candidate ${targetChar} NOT FOUND in lattice!`);
    continue;
  }

  const char2 = candidate.char;
  let maxProb = -Infinity;
  let maxPrevChar = null;
  const scores = [];

  console.log(`  Candidate: ${char2}`);

  for (const prevChar in dp[t3-1]) {
    const bigramProb = getLaplaceBigram(prevChar, char2, ngramDb);
    const prob = dp[t3-1][prevChar] + Math.log(bigramProb);

    scores.push({
      prevChar,
      bigramProb,
      logBigramProb: Math.log(bigramProb),
      prevScore: dp[t3-1][prevChar],
      totalScore: prob
    });

    if (prob > maxProb) {
      maxProb = prob;
      maxPrevChar = prevChar;
    }
  }

  // Sort by total score descending
  scores.sort((a, b) => b.totalScore - a.totalScore);

  // Show top 3 paths
  scores.slice(0, 3).forEach((s, i) => {
    console.log(`    ${i+1}. From ${s.prevChar}: bigram_prob=${s.bigramProb.toExponential(6)}, log_bigram=${s.logBigramProb.toFixed(6)}, prev_score=${s.prevScore.toFixed(6)}, total=${s.totalScore.toFixed(6)}`);
  });

  dp[t3][char2] = maxProb;
  backpointer[t3][char2] = maxPrevChar;

  console.log(`  WINNER: ${maxPrevChar} → ${char2} (score=${maxProb.toFixed(6)})`);
  console.log('');
}

// Final comparison
console.log('=== Final Comparison ===');
console.log(`氣 final score: ${dp[3]['氣'].toFixed(6)}`);
console.log(`真 final score: ${dp[3]['真'].toFixed(6)}`);
console.log(`Algorithm will choose: ${dp[3]['氣'] > dp[3]['真'] ? '氣' : '真'}`);
console.log(`Expected: 氣`);
