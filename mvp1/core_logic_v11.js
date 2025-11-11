/**
 * WebDaYi MVP1 v11: N-gram Sentence Prediction Functions
 *
 * These functions add sentence-level prediction using N-gram language model
 * and Viterbi algorithm for finding the most probable sentence.
 *
 * Design Document: mvp1/DESIGN-v11.md
 * Test File: mvp1/test-node-v11.js
 */

// ============================================
// Global State (v11 additions)
// ============================================

let ngramDb = null;  // N-gram database (lazy loaded)
let ngramDbLoading = false;  // Loading state flag
let inputMode = 'character';  // 'character' | 'sentence'
let codeBuffer = [];  // Buffered codes in sentence mode

// ============================================
// N-gram Database Management
// ============================================

/**
 * Reset N-gram state (for testing)
 */
function resetNgramState() {
  ngramDb = null;
  ngramDbLoading = false;
}

/**
 * Get N-gram database
 * @returns {Object|null} N-gram database or null
 */
function getNgramDb() {
  return ngramDb;
}

/**
 * Set N-gram database
 * @param {Object} db - N-gram database
 */
function setNgramDb(db) {
  ngramDb = db;
}

/**
 * Check if N-gram database is loading
 * @returns {boolean} Loading state
 */
function isNgramDbLoading() {
  return ngramDbLoading;
}

/**
 * Set N-gram database loading state
 * @param {boolean} loading - Loading state
 */
function setNgramDbLoading(loading) {
  ngramDbLoading = loading;
}

/**
 * Validate N-gram database structure
 * @param {Object} db - Database to validate
 * @returns {boolean} Valid or not
 */
function validateNgramDb(db) {
  if (!db) return false;
  if (typeof db !== 'object') return false;
  if (!db.unigrams || typeof db.unigrams !== 'object') return false;
  if (!db.bigrams || typeof db.bigrams !== 'object') return false;
  return true;
}

/**
 * Get N-gram database statistics
 * @returns {Object} Statistics
 */
function getNgramDbStats() {
  if (!ngramDb) {
    return { uniqueChars: 0, uniqueBigrams: 0, totalChars: 0 };
  }

  return {
    uniqueChars: Object.keys(ngramDb.unigrams).length,
    uniqueBigrams: Object.keys(ngramDb.bigrams).length,
    totalChars: ngramDb.metadata ? (ngramDb.metadata.total_chars || 0) : 0
  };
}

// ============================================
// Input Mode Management
// ============================================

/**
 * Reset input mode state (for testing)
 */
function resetInputModeState() {
  inputMode = 'character';
  codeBuffer = [];
}

/**
 * Get current input mode
 * @returns {string} 'character' or 'sentence'
 */
function getInputMode() {
  return inputMode;
}

/**
 * Set input mode
 * @param {string} mode - 'character' or 'sentence'
 */
function setInputMode(mode) {
  if (mode !== 'character' && mode !== 'sentence') {
    console.warn(`[v11] Invalid input mode: ${mode}`);
    return;
  }

  // Clear buffer when switching modes
  if (mode !== inputMode) {
    clearCodeBuffer();
  }

  inputMode = mode;
}

/**
 * Check if in character mode
 * @returns {boolean}
 */
function isCharacterMode() {
  return inputMode === 'character';
}

/**
 * Check if in sentence mode
 * @returns {boolean}
 */
function isSentenceMode() {
  return inputMode === 'sentence';
}

// ============================================
// Code Buffering
// ============================================

/**
 * Add code to buffer
 * @param {string} code - Dayi code
 * @param {Map} dayiMap - Dayi database
 * @returns {boolean} Success
 */
function addToCodeBuffer(code, dayiMap) {
  // Validate code has candidates
  const candidates = dayiMap.get(code);
  if (!candidates || candidates.length === 0) {
    return false;
  }

  // Check max size (10 codes)
  if (codeBuffer.length >= 10) {
    return false;
  }

  codeBuffer.push(code);
  return true;
}

/**
 * Remove last code from buffer
 */
function removeLastCodeFromBuffer() {
  if (codeBuffer.length > 0) {
    codeBuffer.pop();
  }
}

/**
 * Clear code buffer
 */
function clearCodeBuffer() {
  codeBuffer = [];
}

/**
 * Get code buffer (returns copy)
 * @returns {string[]} Copy of buffer
 */
function getCodeBuffer() {
  return [...codeBuffer];
}

// ============================================
// Live Preview
// ============================================

/**
 * Generate live preview from buffered codes
 * @param {string[]} codes - Buffered codes
 * @param {Map} dayiMap - Dayi database
 * @param {Map} userModel - User preferences (optional)
 * @returns {string} Preview text
 */
function generateLivePreview(codes, dayiMap, userModel = null) {
  if (codes.length === 0) {
    return '';
  }

  const previewChars = codes.map(code => {
    const candidates = dayiMap.get(code);
    if (!candidates || candidates.length === 0) {
      return '?';
    }

    const sorted = sortCandidatesByFreq(candidates);

    // Apply user preference if available
    const final = userModel ?
      applyUserPreference(code, sorted, userModel) :
      sorted;

    return final[0].char;
  });

  return previewChars.join(' ');
}

// ============================================
// Viterbi Integration
// ============================================

/**
 * Predict sentence from buffered codes
 * @param {string[]} codes - Buffered codes
 * @param {Map} dayiMap - Dayi database
 * @param {Object} ngramDb - N-gram database
 * @returns {Object|null} Prediction result or null
 */
function predictSentenceFromBuffer(codes, dayiMap, ngramDb) {
  if (!codes || codes.length === 0) {
    return null;
  }

  if (!ngramDb) {
    return null;
  }

  try {
    // Call Viterbi algorithm (defined in viterbi_module.js)
    const result = viterbi(codes, dayiMap, ngramDb);
    return result;
  } catch (error) {
    console.error('[v11] Viterbi prediction failed:', error);
    return null;
  }
}

/**
 * Format prediction result for display
 * @param {Object} result - Viterbi result
 * @param {string[]} codes - Input codes
 * @returns {string} Formatted HTML
 */
function formatPredictionResult(result, codes) {
  const { sentence, score, chars } = result;

  const breakdown = chars.map((char, i) =>
    `${char} (${codes[i]})`
  ).join(' → ');

  return `
    <div class="sentence-prediction">
      <div class="prediction-header">
        <span class="material-symbols-outlined">auto_awesome</span>
        <span>智慧預測</span>
      </div>
      <div class="predicted-sentence">${sentence}</div>
      <div class="prediction-details">
        <div class="char-breakdown">${breakdown}</div>
        <div class="prediction-score">機率分數: ${score.toFixed(3)}</div>
      </div>
    </div>
  `;
}

/**
 * Predict sentence with current state
 * @param {Map} dayiMap - Dayi database
 * @returns {Object|null} Prediction result or null
 */
function predictSentenceWithCurrentState(dayiMap) {
  return predictSentenceFromBuffer(codeBuffer, dayiMap, ngramDb);
}

// ============================================
// Event Handling Helpers
// ============================================

/**
 * Check if should trigger prediction
 * @param {string} key - Key pressed
 * @param {string} mode - Current mode
 * @returns {boolean}
 */
function shouldTriggerPrediction(key, mode) {
  return key === ' ' && mode === 'sentence' && codeBuffer.length > 0;
}

console.log('✓ v11 N-gram functions loaded');
