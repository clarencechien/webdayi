/**
 * Viterbi Algorithm Implementation (DEBUG VERSION)
 *
 * This version has extensive console logging to trace the algorithm execution
 * and identify why it's picking low-frequency candidates.
 *
 * Version 2.1: Implements full Laplace smoothing + frequency-based tie-breaking + DEBUG
 *
 * v2.1 Changes:
 * - Added frequency-based tie-breaking to prefer high-frequency candidates
 * - When multiple paths have equal DP scores (within epsilon=1e-9), prefer path through higher-frequency character
 * - Enhanced debug output to show tie-breaking decisions
 */

/**
 * Calculate Laplace-smoothed unigram probability.
 */
function getLaplaceUnigram_debug(char, ngramDb) {
  const count = ngramDb.unigram_counts[char] || 0;
  const alpha = ngramDb.smoothing_alpha;
  const totalChars = ngramDb.total_chars;
  const vocabSize = ngramDb.vocab_size;
  return (count + alpha) / (totalChars + alpha * vocabSize);
}

/**
 * Calculate Laplace-smoothed bigram probability.
 */
function getLaplaceBigram_debug(char1, char2, ngramDb) {
  const bigram = char1 + char2;
  const bigramCount = ngramDb.bigram_counts[bigram] || 0;
  const unigramCount = ngramDb.unigram_counts[char1] || 0;
  const alpha = ngramDb.smoothing_alpha;
  const vocabSize = ngramDb.vocab_size;
  return (bigramCount + alpha) / (unigramCount + alpha * vocabSize);
}

/**
 * Build lattice of candidates from input codes.
 */
function buildLattice_debug(codes, dayiDb) {
  const lattice = [];

  console.log('[DEBUG] Building lattice...');
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const candidates = dayiDb.get(code);

    if (!candidates || candidates.length === 0) {
      throw new Error(`No candidates found for code: ${code}`);
    }

    console.log(`[DEBUG] Position ${i} (${code}): ${candidates.length} candidates`);
    console.log(`[DEBUG]   Top 3: ${candidates.slice(0, 3).map(c => `${c.char}(${c.freq})`).join(', ')}`);

    lattice.push(candidates);
  }

  return lattice;
}

/**
 * Initialize DP table for first position.
 */
function initializeDP_debug(lattice, ngramDb) {
  const dp = [];
  const numPositions = lattice.length;

  console.log('[DEBUG] Initializing DP table...');
  const firstDP = {};
  for (const candidate of lattice[0]) {
    const char = candidate.char;
    const unigramProb = getLaplaceUnigram_debug(char, ngramDb);
    firstDP[char] = Math.log(unigramProb);
  }
  dp.push(firstDP);

  // Show top 3 initial scores
  const sorted = Object.entries(firstDP).sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log('[DEBUG] Position 0 initial scores (top 3):');
  sorted.forEach(([char, score]) => {
    console.log(`[DEBUG]   ${char}: ${score.toFixed(3)}`);
  });

  for (let i = 1; i < numPositions; i++) {
    dp.push({});
  }

  return dp;
}

/**
 * Perform forward pass of Viterbi algorithm (DEBUG VERSION with v2.1 tie-breaking).
 */
function forwardPass_debug(lattice, dp, backpointer, ngramDb, debugPositions = []) {
  for (let t = 1; t < lattice.length; t++) {
    const shouldDebug = debugPositions.includes(t);

    if (shouldDebug) {
      console.log(`\n[DEBUG] === Processing position ${t} ===`);
    }

    // Build frequency map for PREVIOUS position (t-1) for tie-breaking
    const prevFreqMap = {};
    if (t > 0) {
      for (const candidate of lattice[t-1]) {
        prevFreqMap[candidate.char] = candidate.freq;
      }
    }

    for (const candidate of lattice[t]) {
      const char2 = candidate.char;
      let maxProb = -Infinity;
      let maxPrevChar = null;
      let maxPrevCharFreq = 0;

      if (shouldDebug && candidate.freq >= 1000) {
        console.log(`[DEBUG] Evaluating candidate: ${char2} (freq=${candidate.freq})`);
      }

      // Try all previous characters
      for (const prevChar in dp[t-1]) {
        const bigramProb = getLaplaceBigram_debug(prevChar, char2, ngramDb);
        const prob = dp[t-1][prevChar] + Math.log(bigramProb);

        // Get frequency of previous character for tie-breaking
        const prevCharFreq = prevFreqMap[prevChar] || 0;
        const epsilon = 1e-9;

        if (shouldDebug && candidate.freq >= 1000) {
          const isTie = Math.abs(prob - maxProb) < epsilon;
          const isNewMax = prob > maxProb + epsilon;
          const isBetterTie = isTie && prevCharFreq > maxPrevCharFreq;

          if (isNewMax || isBetterTie) {
            console.log(`[DEBUG]   From ${prevChar} (freq=${prevCharFreq}): bigram_prob=${bigramProb.toExponential(3)}, prev_score=${dp[t-1][prevChar].toFixed(3)}, total=${prob.toFixed(3)} ${isNewMax ? '← NEW MAX' : isBetterTie ? '← BETTER TIE (higher freq)' : ''}`);
          }
        }

        // BUG FIX (v2.1): Tie-breaking by frequency
        // If scores are essentially equal (within epsilon), prefer higher-frequency previous character
        if (prob > maxProb + epsilon ||
            (Math.abs(prob - maxProb) < epsilon && prevCharFreq > maxPrevCharFreq)) {
          maxProb = prob;
          maxPrevChar = prevChar;
          maxPrevCharFreq = prevCharFreq;
        }
      }

      dp[t][char2] = maxProb;
      backpointer[t][char2] = maxPrevChar;

      if (shouldDebug && candidate.freq >= 1000) {
        console.log(`[DEBUG]   RESULT: ${char2} gets score ${maxProb.toFixed(3)} from ${maxPrevChar} (freq=${maxPrevCharFreq})`);
      }
    }

    // Show top 3 scores at this position
    if (shouldDebug) {
      const sorted = Object.entries(dp[t]).sort((a, b) => b[1] - a[1]).slice(0, 3);
      console.log(`[DEBUG] Position ${t} top 3 scores:`);
      sorted.forEach(([char, score]) => {
        const candidate = lattice[t].find(c => c.char === char);
        console.log(`[DEBUG]   ${char} (freq=${candidate?.freq}): ${score.toFixed(3)}`);
      });
    }
  }
}

/**
 * Backtrack to reconstruct the best path (DEBUG VERSION).
 */
function backtrack_debug(dp, backpointer, lattice) {
  const lastT = dp.length - 1;

  console.log('\n[DEBUG] === Backtracking ===');

  // Find character with maximum probability at last position
  let maxChar = null;
  let maxProb = -Infinity;

  for (const char in dp[lastT]) {
    if (dp[lastT][char] > maxProb) {
      maxProb = dp[lastT][char];
      maxChar = char;
    }
  }

  console.log(`[DEBUG] Final position best char: ${maxChar} (score=${maxProb.toFixed(3)})`);

  // Reconstruct path backwards
  const chars = [];
  let currentChar = maxChar;

  for (let t = lastT; t >= 0; t--) {
    chars.unshift(currentChar);
    const candidate = lattice[t].find(c => c.char === currentChar);
    console.log(`[DEBUG] Position ${t}: ${currentChar} (freq=${candidate?.freq}) ← from ${backpointer[t][currentChar] || 'START'}`);
    currentChar = backpointer[t][currentChar];
  }

  return {
    sentence: chars.join(''),
    score: maxProb,
    chars: chars
  };
}

/**
 * Run Viterbi algorithm (DEBUG VERSION).
 */
function viterbi_debug(codes, dayiDb, ngramDb, options = {}) {
  const { debugPositions = [] } = options;

  console.log('\n[DEBUG] ========================================');
  console.log('[DEBUG] VITERBI DEBUG MODE');
  console.log('[DEBUG] ========================================');
  console.log('[DEBUG] Input codes:', codes);

  // Validation
  if (!codes || codes.length === 0) {
    throw new Error("Codes array cannot be empty");
  }

  // 1. Build lattice
  const lattice = buildLattice_debug(codes, dayiDb);

  // 2. Initialize DP table and backpointer
  const dp = initializeDP_debug(lattice, ngramDb);
  const backpointer = Array(lattice.length).fill(null).map(() => ({}));

  // 3. Forward pass
  forwardPass_debug(lattice, dp, backpointer, ngramDb, debugPositions);

  // 4. Backtrack
  const result = backtrack_debug(dp, backpointer, lattice);

  console.log('[DEBUG] ========================================');
  console.log('[DEBUG] FINAL RESULT:', result.sentence);
  console.log('[DEBUG] ========================================\n');

  // Optional: Add lattice for debugging
  result.lattice = lattice;

  return result;
}

console.log('✓ Viterbi DEBUG module loaded');
