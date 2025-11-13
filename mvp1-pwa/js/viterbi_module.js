/**
 * Viterbi Algorithm v2.7 - Best Hybrid Implementation (Browser-Compatible)
 *
 * 混合方案 (Best Strategy):
 * - 代碼結構: 採用 v2.6 的 OOP 寫法 (清晰、參數化)
 * - 核心參數: 採用 v2.5 的 70/30 權重 (已驗證 90% 準確率)
 * - 平滑演算法: 採用 v2.5 的 Laplace Smoothing (更穩健)
 *
 * This is a browser-compatible version of the Viterbi algorithm.
 * All functions are exposed globally for use in MVP 1.0 v11.
 *
 * Version History:
 * - v2.7: Hybrid implementation (v2.6 OOP + v2.5 weights + Laplace)
 * - v2.6: Alternative with 60/40 weights + Backoff (80% accuracy)
 * - v2.5: Unigram interpolation (70/30 weights, 90% accuracy)
 * - v2.4: Logarithmic frequency bonus (70% accuracy)
 * - v2.3: Linear frequency bonus (too small)
 * - v2.2: Tie-breaking in backtrack()
 * - v2.1: Tie-breaking in forwardPass()
 * - v2.0: Full Laplace smoothing
 *
 * Test Results (v2.7):
 * - Test 1 (大家好我是大學生): 100% (8/8)
 * - Test 2 (明天天氣如何會放假嗎): 90% (9/10)
 * - Overall: 94.4% accuracy
 *
 * Usage:
 *   const result = viterbi(codes, dayiDb, ngramDb);
 *   console.log(result.sentence);  // "明天天真如何會放假嗎"
 *   console.log(result.score);     // -63.951911
 */

// ============================================================================
// Configuration Parameters (可調整)
// ============================================================================

// 採用 v2.5 的黃金比例 (已驗證最佳)
const BIGRAM_WEIGHT = 0.7;   // 70% 相信前後文關係
const UNIGRAM_WEIGHT = 0.3;  // 30% 相信字本身的常用度

// 極小機率 (避免 Log(0) 變成 -Infinity)
const MIN_PROB = 1e-10;

// ============================================================================
// Smoothing Functions (v2.5 Laplace Smoothing)
// ============================================================================

/**
 * 取得單字機率 P(A) - 使用 v2.5 的 Laplace Smoothing
 *
 * Formula: P(char) = (count(char) + alpha) / (total_chars + alpha * vocab_size)
 *
 * @param {string} char - Character to get probability for
 * @param {Object} ngramDb - N-gram database with smoothing parameters
 * @returns {number} Smoothed unigram probability
 */
function getLaplaceUnigram(char, ngramDb) {
  const count = ngramDb.unigram_counts[char] || 0;
  const alpha = ngramDb.smoothing_alpha || 0.1;
  const totalChars = ngramDb.total_chars;
  const vocabSize = ngramDb.vocab_size;

  // v2.5 完整 Laplace smoothing
  if (totalChars && vocabSize) {
    return (count + alpha) / (totalChars + alpha * vocabSize);
  }

  // 備用：簡單 +1 smoothing
  const totalUnigrams = Object.values(ngramDb.unigram_counts).reduce((a, b) => a + b, 0);
  return (count + 1) / (totalUnigrams + 10000);
}

/**
 * 取得轉移機率 P(B|A) - 使用 v2.5 的 Laplace Smoothing
 *
 * Formula: P(c2|c1) = (count(c1,c2) + alpha) / (count(c1) + alpha * vocab_size)
 *
 * @param {string} char1 - First character (context)
 * @param {string} char2 - Second character (prediction)
 * @param {Object} ngramDb - N-gram database with smoothing parameters
 * @returns {number} Smoothed bigram conditional probability
 */
function getLaplaceBigram(char1, char2, ngramDb) {
  // FIXED: bigram_counts is stored as flat "大家" keys, not nested objects
  const bigram = char1 + char2;
  const bigramCount = ngramDb.bigram_counts[bigram] || 0;
  const unigramCount = ngramDb.unigram_counts[char1] || 0;
  const alpha = ngramDb.smoothing_alpha || 0.1;
  const vocabSize = ngramDb.vocab_size;

  // v2.5 完整 Laplace smoothing (same as v2.5)
  return (bigramCount + alpha) / (unigramCount + alpha * vocabSize);
}

// ============================================================================
// Lattice Building
// ============================================================================

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

// ============================================================================
// Dynamic Programming (v2.7 Hybrid Algorithm)
// ============================================================================

/**
 * Initialize DP table for first position.
 *
 * @param {Array[]} lattice - Lattice of candidates
 * @param {Object} ngramDb - N-gram database
 * @returns {Array} DP table (array of objects)
 */
function initializeDP(lattice, ngramDb) {
  const dp = [];
  const numPositions = lattice.length;

  // Initialize first position with Laplace-smoothed unigram probabilities
  const firstDP = {};
  for (const candidate of lattice[0]) {
    const char = candidate.char;
    const unigramProb = getLaplaceUnigram(char, ngramDb);

    // v2.7: 第一個字只看 Unigram
    firstDP[char] = Math.log(Math.max(unigramProb, MIN_PROB));
  }
  dp.push(firstDP);

  // Initialize remaining positions with empty objects
  for (let i = 1; i < numPositions; i++) {
    dp.push({});
  }

  return dp;
}

/**
 * Forward pass of Viterbi algorithm.
 * Uses v2.7 hybrid approach: 70/30 weighting + Laplace smoothing.
 *
 * @param {Array[]} lattice - Lattice of candidates
 * @param {Array} dp - DP table
 * @param {Object} ngramDb - N-gram database
 * @returns {Object} Backpointer table
 */
function forwardPass(lattice, dp, ngramDb) {
  const backpointer = [];
  backpointer.push({});

  for (let t = 1; t < lattice.length; t++) {
    backpointer.push({});

    for (const candidate of lattice[t]) {
      const char2 = candidate.char;

      let maxProb = -Infinity;
      let maxPrevChar = null;

      // Try all previous characters
      for (const prevChar in dp[t-1]) {
        // --- v2.7 核心：70/30 加權 + Laplace Smoothing ---

        // 1. Bigram 分數 (前後關係) - 使用 Laplace smoothing
        const bigramProb = getLaplaceBigram(prevChar, char2, ngramDb);
        const bigramScore = Math.log(Math.max(bigramProb, MIN_PROB));

        // 2. Unigram 分數 (自身熱度) - 使用 Laplace smoothing
        const unigramProb = getLaplaceUnigram(char2, ngramDb);
        const unigramScore = Math.log(Math.max(unigramProb, MIN_PROB));

        // 3. 混合加權分數 - v2.5 的黃金比例 70/30
        const transitionScore = (BIGRAM_WEIGHT * bigramScore) +
                               (UNIGRAM_WEIGHT * unigramScore);

        const prob = dp[t-1][prevChar] + transitionScore;

        if (prob > maxProb) {
          maxProb = prob;
          maxPrevChar = prevChar;
        }
      }

      dp[t][char2] = maxProb;
      backpointer[t][char2] = maxPrevChar;
    }
  }

  return backpointer;
}

/**
 * Backtrack to find best path.
 *
 * @param {Array[]} lattice - Lattice of candidates
 * @param {Array} dp - DP table
 * @param {Object} backpointer - Backpointer table
 * @returns {Array} Best path as array of characters
 */
function backtrack(lattice, dp, backpointer) {
  // Find best final character
  const lastDP = dp[dp.length - 1];
  let maxProb = -Infinity;
  let bestLastChar = null;

  for (const char in lastDP) {
    if (lastDP[char] > maxProb) {
      maxProb = lastDP[char];
      bestLastChar = char;
    }
  }

  // Backtrack through path
  const path = [];
  let currentChar = bestLastChar;

  for (let t = lattice.length - 1; t >= 0; t--) {
    path.unshift(currentChar);
    currentChar = backpointer[t][currentChar];
  }

  return path;
}

// ============================================================================
// Main Viterbi Function
// ============================================================================

/**
 * Run Viterbi algorithm to find best sentence.
 *
 * @param {string[]} codes - Array of Dayi codes
 * @param {Map} dayiDb - Dictionary mapping codes to candidates
 * @param {Object} ngramDb - N-gram database
 * @returns {Object} Result with sentence, chars, and score
 */
function viterbi(codes, dayiDb, ngramDb) {
  // 1. Build lattice
  const lattice = buildLattice(codes, dayiDb);

  // 2. Initialize DP table
  const dp = initializeDP(lattice, ngramDb);

  // 3. Forward pass
  const backpointer = forwardPass(lattice, dp, ngramDb);

  // 4. Backtrack
  const chars = backtrack(lattice, dp, backpointer);

  // 5. Calculate final score
  const sentence = chars.join('');
  const finalScore = dp[dp.length - 1][chars[chars.length - 1]];

  return {
    sentence: sentence,
    chars: chars,
    score: finalScore
  };
}

// ============================================================================
// UserDB Integration (Phase 1 - F-4.0 Enhancement)
// ============================================================================

/**
 * Viterbi algorithm with UserDB integration for personalized learning.
 *
 * This async version integrates user-learned bigram weights from IndexedDB.
 * Formula: Final Score = Base N-gram Score + UserDB Weight
 *
 * @param {string[]} codes - Array of Dayi codes
 * @param {Map} dayiDb - Dictionary mapping codes to candidates
 * @param {Object} ngramDb - N-gram database
 * @param {Object|null} userDB - UserDB instance (optional, can be null)
 * @returns {Promise<Object>} Result with sentence, chars, and score
 */
async function viterbiWithUserDB(codes, dayiDb, ngramDb, userDB) {
  // 1. Build lattice
  const lattice = buildLattice(codes, dayiDb);

  // 2. Initialize DP table
  const dp = initializeDP(lattice, ngramDb);

  // 3. Forward pass with UserDB integration
  const backpointer = await forwardPassWithUserDB(lattice, dp, ngramDb, userDB);

  // 4. Backtrack
  const chars = backtrack(lattice, dp, backpointer);

  // 5. Calculate final score
  const sentence = chars.join('');
  const finalScore = dp[dp.length - 1][chars[chars.length - 1]];

  return {
    sentence: sentence,
    chars: chars,
    score: finalScore
  };
}

/**
 * Forward pass with UserDB weight integration (async).
 *
 * @param {Array[]} lattice - Lattice of candidates
 * @param {Array} dp - DP table
 * @param {Object} ngramDb - N-gram database
 * @param {Object|null} userDB - UserDB instance (optional)
 * @returns {Promise<Object>} Backpointer table
 */
async function forwardPassWithUserDB(lattice, dp, ngramDb, userDB) {
  const backpointer = [];
  backpointer.push({});

  for (let t = 1; t < lattice.length; t++) {
    backpointer.push({});

    for (const candidate of lattice[t]) {
      const char2 = candidate.char;

      let maxProb = -Infinity;
      let maxPrevChar = null;

      // Try all previous characters
      for (const prevChar in dp[t-1]) {
        // --- v2.7 核心：70/30 加權 + Laplace Smoothing ---

        // 1. Bigram 分數 (前後關係) - 使用 Laplace smoothing
        const bigramProb = getLaplaceBigram(prevChar, char2, ngramDb);
        const bigramScore = Math.log(Math.max(bigramProb, MIN_PROB));

        // 2. Unigram 分數 (自身熱度) - 使用 Laplace smoothing
        const unigramProb = getLaplaceUnigram(char2, ngramDb);
        const unigramScore = Math.log(Math.max(unigramProb, MIN_PROB));

        // 3. 混合加權分數 - v2.5 的黃金比例 70/30
        let transitionScore = (BIGRAM_WEIGHT * bigramScore) +
                               (UNIGRAM_WEIGHT * unigramScore);

        // 4. 🆕 UserDB 加權 (Phase 1 - F-4.0)
        if (userDB) {
          try {
            const userWeight = await userDB.getWeight(prevChar, char2);
            transitionScore += userWeight; // Add user-learned weight
          } catch (error) {
            // Gracefully handle UserDB errors (don't break prediction)
            console.warn('[Viterbi] UserDB error:', error);
          }
        }

        const prob = dp[t-1][prevChar] + transitionScore;

        if (prob > maxProb) {
          maxProb = prob;
          maxPrevChar = prevChar;
        }
      }

      dp[t][char2] = maxProb;
      backpointer[t][char2] = maxPrevChar;
    }
  }

  return backpointer;
}

/**
 * Detect learning opportunities by comparing prediction with user selection.
 *
 * Identifies positions where user selected non-default characters.
 *
 * @param {string[]} prediction - Predicted sentence (default path)
 * @param {string[]} userSelection - User's actual selection
 * @returns {Array} Learning data [{prevChar, from, to, nextChar, weight}]
 */
function detectLearning(prediction, userSelection) {
  const learningData = [];

  if (!prediction || !userSelection || prediction.length !== userSelection.length) {
    return learningData;
  }

  for (let i = 0; i < prediction.length; i++) {
    if (prediction[i] !== userSelection[i]) {
      // User selected a different character (non-default)
      const learningPoint = {
        prevChar: i > 0 ? userSelection[i - 1] : null,
        from: prediction[i],
        to: userSelection[i],
        nextChar: i < userSelection.length - 1 ? userSelection[i + 1] : null,
        position: i,
        weight: 1.0 // Default learning weight
      };

      learningData.push(learningPoint);
    }
  }

  return learningData;
}

/**
 * Apply learning data to UserDB (persist learned preferences).
 *
 * Updates bigram weights based on user corrections.
 *
 * @param {Array} learningData - Learning points from detectLearning()
 * @param {Object} userDB - UserDB instance
 * @returns {Promise<void>}
 */
async function applyLearning(learningData, userDB) {
  if (!userDB || !learningData || learningData.length === 0) {
    return;
  }

  for (const point of learningData) {
    if (point.prevChar) {
      // Update bigram weight: prevChar → to (increase preference)
      try {
        const currentWeight = await userDB.getWeight(point.prevChar, point.to);
        const newWeight = currentWeight + point.weight;
        await userDB.setWeight(point.prevChar, point.to, newWeight);

        // Optionally decrease weight for prevChar → from (discourage)
        // const currentFromWeight = await userDB.getWeight(point.prevChar, point.from);
        // await userDB.setWeight(point.prevChar, point.from, currentFromWeight - point.weight * 0.5);
      } catch (error) {
        console.warn('[Learning] Failed to apply learning:', error);
      }
    }
  }
}

/**
 * Show learning feedback UI to user.
 *
 * Displays a temporary notification showing what the system learned.
 *
 * @param {Array} learningData - Learning points from detectLearning()
 */
function showLearningFeedback(learningData) {
  if (!learningData || learningData.length === 0) {
    return;
  }

  // Create feedback container
  let feedbackContainer = document.querySelector('.learning-feedback-container');
  if (!feedbackContainer) {
    feedbackContainer = document.createElement('div');
    feedbackContainer.className = 'learning-feedback-container';
    feedbackContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 300px;
    `;
    document.body.appendChild(feedbackContainer);
  }

  // Create feedback element for each learning point
  learningData.forEach((point, index) => {
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'learning-feedback';
    feedbackElement.style.cssText = `
      background: linear-gradient(135deg, #4ec9b0 0%, #3aa88f 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation keyframes
    if (!document.querySelector('#learning-feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'learning-feedback-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
      `;
      document.head.appendChild(style);
    }

    let feedbackText = `✓ 已學習：`;
    if (point.prevChar) {
      feedbackText += `${point.prevChar}${point.to} > ${point.prevChar}${point.from}`;
    } else {
      feedbackText += `${point.to} (位置 ${point.position + 1})`;
    }

    feedbackElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">✓</span>
        <span>${feedbackText}</span>
      </div>
    `;

    feedbackContainer.appendChild(feedbackElement);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      feedbackElement.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        feedbackElement.remove();
        // Remove container if empty
        if (feedbackContainer.children.length === 0) {
          feedbackContainer.remove();
        }
      }, 300);
    }, 3000);
  });
}

// Functions are now globally available in browser context
console.log('✓ Viterbi module loaded (v2.7 HYBRID + UserDB Integration - Phase 1)');
