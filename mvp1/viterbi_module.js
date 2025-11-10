/**
 * Viterbi Algorithm Implementation (Browser-Compatible)
 *
 * Finds the most probable sentence given a sequence of Dayi input codes
 * using N-gram language model probabilities.
 *
 * This is a browser-compatible version of the Viterbi algorithm.
 * All functions are exposed globally for use in MVP 1.0 v11.
 *
 * Version 2.0: Implements full Laplace smoothing (Solution B)
 *
 * Original: mvp3-smart-engine/viterbi.js
 * Design Document: mvp1/DESIGN-v11.md
 *
 * Usage:
 *   const result = viterbi(codes, dayiDb, ngramDb);
 *   console.log(result.sentence);  // "易在大"
 *   console.log(result.score);     // -5.809
 */

/**
 * Calculate Laplace-smoothed unigram probability.
 *
 * Solution B: Full Laplace smoothing implementation
 *
 * Formula: P(char) = (count(char) + alpha) / (total_chars + alpha * vocab_size)
 *
 * @param {string} char - Character to get probability for
 * @param {Object} ngramDb - N-gram database with smoothing parameters
 * @returns {number} Smoothed unigram probability
 */
function getLaplaceUnigram(char, ngramDb) {
  const count = ngramDb.unigram_counts[char] || 0;
  const alpha = ngramDb.smoothing_alpha;
  const totalChars = ngramDb.total_chars;
  const vocabSize = ngramDb.vocab_size;

  return (count + alpha) / (totalChars + alpha * vocabSize);
}

/**
 * Calculate Laplace-smoothed bigram probability.
 *
 * Solution B: Full Laplace smoothing implementation
 *
 * Formula: P(c2|c1) = (count(c1,c2) + alpha) / (count(c1) + alpha * vocab_size)
 *
 * @param {string} char1 - First character (context)
 * @param {string} char2 - Second character (prediction)
 * @param {Object} ngramDb - N-gram database with smoothing parameters
 * @returns {number} Smoothed bigram conditional probability
 */
function getLaplaceBigram(char1, char2, ngramDb) {
  const bigram = char1 + char2;
  const bigramCount = ngramDb.bigram_counts[bigram] || 0;
  const unigramCount = ngramDb.unigram_counts[char1] || 0;
  const alpha = ngramDb.smoothing_alpha;
  const vocabSize = ngramDb.vocab_size;

  return (bigramCount + alpha) / (unigramCount + alpha * vocabSize);
}

/**
 * Build lattice of candidates from input codes.
 *
 * @param {string[]} codes - Array of Dayi codes
 * @param {Map} dayiDb - Dictionary mapping codes to candidates
 * @returns {Array[]} Lattice of candidates
 * @throws {Error} If any code has no candidates
 */
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

/**
 * Initialize DP table for first position using Laplace-smoothed unigram probabilities.
 *
 * Solution B: Uses full Laplace smoothing for initialization
 *
 * @param {Array[]} lattice - Candidate lattice
 * @param {Object} ngramDb - N-gram database with smoothing parameters
 * @returns {Object[]} Initialized DP table
 */
function initializeDP(lattice, ngramDb) {
  const dp = [];
  const numPositions = lattice.length;

  // Initialize first position with Laplace-smoothed unigram probabilities
  const firstDP = {};
  for (const candidate of lattice[0]) {
    const char = candidate.char;
    // Solution B: Use full Laplace smoothing instead of fallback
    const unigramProb = getLaplaceUnigram(char, ngramDb);
    firstDP[char] = Math.log(unigramProb);
  }
  dp.push(firstDP);

  // Initialize remaining positions with empty objects
  for (let i = 1; i < numPositions; i++) {
    dp.push({});
  }

  return dp;
}

/**
 * Perform forward pass of Viterbi algorithm.
 *
 * @param {Array[]} lattice - Candidate lattice
 * @param {Object[]} dp - DP table (modified in place)
 * @param {Object[]} backpointer - Backpointer array (modified in place)
 * @param {Object} ngramDb - N-gram database
 */
function forwardPass(lattice, dp, backpointer, ngramDb) {
  for (let t = 1; t < lattice.length; t++) {
    for (const candidate of lattice[t]) {
      const char2 = candidate.char;
      let maxProb = -Infinity;
      let maxPrevChar = null;

      // Try all previous characters
      for (const prevChar in dp[t-1]) {
        // Solution B: Use full Laplace smoothing for bigrams
        // Replaces Quick Fix (unigram fallback) with proper statistical smoothing
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

/**
 * Backtrack to reconstruct the best path.
 *
 * @param {Object[]} dp - DP table
 * @param {Object[]} backpointer - Backpointer array
 * @returns {Object} Best path information
 */
function backtrack(dp, backpointer) {
  const lastT = dp.length - 1;

  // Find character with maximum probability at last position
  let maxChar = null;
  let maxProb = -Infinity;

  for (const char in dp[lastT]) {
    if (dp[lastT][char] > maxProb) {
      maxProb = dp[lastT][char];
      maxChar = char;
    }
  }

  // Reconstruct path backwards
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

/**
 * Run Viterbi algorithm to find most probable sentence.
 *
 * @param {string[]} codes - Array of Dayi codes
 * @param {Map} dayiDb - Dictionary mapping codes to candidates
 * @param {Object} ngramDb - N-gram database
 * @returns {Object} Best sentence with score and path
 *
 * @example
 * const result = viterbi(
 *   ["4jp", "ad", "v"],
 *   dayiDb,
 *   ngramDb
 * );
 * console.log(result.sentence);  // "易在大"
 * console.log(result.score);     // -5.809
 * console.log(result.chars);     // ["易", "在", "大"]
 */
function viterbi(codes, dayiDb, ngramDb) {
  // Validation
  if (!codes || codes.length === 0) {
    throw new Error("Codes array cannot be empty");
  }

  // 1. Build lattice
  const lattice = buildLattice(codes, dayiDb);

  // 2. Initialize DP table and backpointer
  const dp = initializeDP(lattice, ngramDb);
  const backpointer = Array(lattice.length).fill(null).map(() => ({}));

  // 3. Forward pass
  forwardPass(lattice, dp, backpointer, ngramDb);

  // 4. Backtrack
  const result = backtrack(dp, backpointer);

  // Optional: Add lattice for debugging
  result.lattice = lattice;

  return result;
}

// Functions are now globally available in browser context
// No module.exports needed - browser version
console.log('✓ Viterbi module loaded (v2.0 with Laplace smoothing - Solution B)');
