# MVP 1.0 v11: N-gram Sentence Prediction

**Version**: 1.0.11
**Date**: 2025-11-10
**Status**: Design Phase → Implementation

---

## 1. Overview

### Goal

Integrate N-gram language model and Viterbi algorithm into MVP 1.0 static webpage, enabling **intelligent sentence prediction** while maintaining all v10 features.

### User Story

> "As a user, I want to type multiple Dayi codes and get the most probable sentence prediction using N-gram statistics, so I can type faster with better accuracy."

### Success Criteria

- ✅ Two input modes: Character Mode (v10 behavior) + Sentence Mode (new)
- ✅ Sentence mode predicts best sentence from buffered codes
- ✅ All v10 features continue working (104 tests passing)
- ✅ N-gram database loads efficiently (<5s on 4G)
- ✅ Viterbi prediction completes in <200ms
- ✅ New TDD tests cover all new functionality

---

## 2. Architecture

### 2.1 Input Modes

**Character Mode** (Default):
- Existing v10 behavior
- Type 2-char code → select character → repeat
- All existing features work

**Sentence Mode** (New):
- Type multiple 2-char codes
- Codes accumulate in buffer
- Space key triggers Viterbi prediction
- Predicted sentence appended to output

### 2.2 Data Flow

```
┌─────────────────────────────────────────────┐
│ Page Load                                   │
├─────────────────────────────────────────────┤
│ 1. Load dayi_db.json (717KB)               │
│ 2. Initialize in Character Mode             │
│ 3. N-gram DB NOT loaded yet (lazy)         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ User Clicks "Sentence Mode"                 │
├─────────────────────────────────────────────┤
│ 1. Show loading indicator                   │
│ 2. Fetch ngram_db.json (10.4MB)            │
│ 3. Parse and cache in memory               │
│ 4. Hide loading indicator                   │
│ 5. Enable sentence input                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ User Types in Sentence Mode                 │
├─────────────────────────────────────────────┤
│ Input: "4jp" → Validate → Add to buffer    │
│ Input: "ad"  → Validate → Add to buffer    │
│ Input: "v"   → Validate → Add to buffer    │
│ Buffer: ["4jp", "ad", "v"]                 │
│ Preview: "易 在 大"                         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ User Presses Space                          │
├─────────────────────────────────────────────┤
│ 1. Run viterbi(buffer, dayiDb, ngramDb)    │
│ 2. Result: { sentence: "易在大", score: -5.809 } │
│ 3. Display prediction                       │
│ 4. Append to output buffer                  │
│ 5. Auto-copy if enabled                     │
│ 6. Clear buffer and input                   │
└─────────────────────────────────────────────┘
```

### 2.3 File Structure

```
mvp1/
  viterbi_module.js       (NEW) - Browser-compatible Viterbi
  ngram_db.json          (COPY) - 10.4MB N-gram database
  core_logic.js          (UPDATE) - Add sentence mode logic
  index.html             (UPDATE) - Add mode toggle UI
  style.css              (UPDATE) - Style new elements
  test-node-v11.js       (NEW) - 30+ TDD tests
  DESIGN-v11.md          (NEW) - This document
```

---

## 3. Implementation Details

### 3.1 Global State Extensions

```javascript
// Existing state
let dayiMap = null;           // Character dictionary
let userModel = new Map();    // User preferences
let autoCopyEnabled = true;   // Auto-copy setting
let currentPage = 0;          // Pagination state
let currentCandidates = [];   // Current query results

// NEW v11 state
let inputMode = 'character';  // 'character' | 'sentence'
let ngramDb = null;           // N-gram database (lazy loaded)
let ngramDbLoading = false;   // Loading state flag
let codeBuffer = [];          // Buffered codes in sentence mode
```

### 3.2 New Core Functions

#### Database Loading

```javascript
/**
 * Load N-gram database (lazy loading)
 * @returns {Promise<Object>} N-gram database
 */
async function loadNgramDatabase() {
  if (ngramDb) return ngramDb;  // Already loaded

  if (ngramDbLoading) {
    // Wait for existing load to complete
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!ngramDbLoading) {
          clearInterval(interval);
          resolve(ngramDb);
        }
      }, 100);
    });
  }

  ngramDbLoading = true;
  showLoadingIndicator('載入 N-gram 資料庫...');

  try {
    const response = await fetch('ngram_db.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    ngramDb = await response.json();

    // Validate structure
    if (!ngramDb.unigrams || !ngramDb.bigrams) {
      throw new Error('Invalid N-gram database structure');
    }

    console.log(`N-gram DB loaded: ${Object.keys(ngramDb.unigrams).length} unigrams, ${Object.keys(ngramDb.bigrams).length} bigrams`);

  } catch (error) {
    console.error('Failed to load N-gram database:', error);
    showTemporaryError('N-gram 資料庫載入失敗');
    ngramDb = null;
  } finally {
    hideLoadingIndicator();
    ngramDbLoading = false;
  }

  return ngramDb;
}
```

#### Input Mode Management

```javascript
/**
 * Set input mode
 * @param {string} mode - 'character' or 'sentence'
 */
function setInputMode(mode) {
  if (mode === inputMode) return;

  // Clear state when switching modes
  clearCodeBuffer();
  clearInput();
  clearCandidateArea();

  inputMode = mode;
  updateModeUI();

  // Lazy load N-gram DB when entering sentence mode
  if (mode === 'sentence' && !ngramDb && !ngramDbLoading) {
    loadNgramDatabase();
  }
}

/**
 * Update UI to reflect current mode
 */
function updateModeUI() {
  const charBtn = document.getElementById('char-mode-btn');
  const sentenceBtn = document.getElementById('sentence-mode-btn');
  const codeBufferDisplay = document.getElementById('code-buffer-display');
  const livePreview = document.getElementById('live-preview');

  if (inputMode === 'character') {
    charBtn.classList.add('active');
    sentenceBtn.classList.remove('active');
    codeBufferDisplay.classList.add('hidden');
    livePreview.classList.add('hidden');
  } else {
    charBtn.classList.remove('active');
    sentenceBtn.classList.add('active');
    codeBufferDisplay.classList.remove('hidden');
    // livePreview shown when buffer not empty
  }
}
```

#### Code Buffering

```javascript
/**
 * Add code to buffer (sentence mode)
 * @param {string} code - Dayi code to add
 * @returns {boolean} Success
 */
function addToCodeBuffer(code) {
  // Validate code has candidates
  const candidates = dayiMap.get(code);
  if (!candidates || candidates.length === 0) {
    return false;  // Invalid code
  }

  // Limit buffer size
  if (codeBuffer.length >= 10) {
    showTemporaryError('編碼緩衝區已滿 (最多 10 個)');
    return false;
  }

  codeBuffer.push(code);
  updateCodeBufferDisplay();
  updateLivePreview();
  return true;
}

/**
 * Remove last code from buffer
 */
function removeLastCodeFromBuffer() {
  if (codeBuffer.length > 0) {
    codeBuffer.pop();
    updateCodeBufferDisplay();
    updateLivePreview();
  }
}

/**
 * Clear code buffer
 */
function clearCodeBuffer() {
  codeBuffer = [];
  updateCodeBufferDisplay();
  updateLivePreview();
}

/**
 * Get current buffer contents
 * @returns {string[]} Copy of buffer
 */
function getCodeBuffer() {
  return [...codeBuffer];
}

/**
 * Update code buffer display
 */
function updateCodeBufferDisplay() {
  const container = document.getElementById('buffered-codes');
  if (!container) return;

  if (codeBuffer.length === 0) {
    container.innerHTML = '<span class="empty-buffer-hint">尚無編碼</span>';
    return;
  }

  container.innerHTML = codeBuffer.map(code =>
    `<span class="buffered-code">${code}</span>`
  ).join('');
}
```

#### Live Preview

```javascript
/**
 * Update live preview (first candidate of each code)
 */
function updateLivePreview() {
  const previewDiv = document.getElementById('live-preview');
  const previewText = document.getElementById('preview-text');

  if (!previewDiv || !previewText) return;

  if (inputMode !== 'sentence' || codeBuffer.length === 0) {
    previewDiv.classList.add('hidden');
    return;
  }

  // Get first candidate of each code
  const preview = codeBuffer.map(code => {
    const candidates = dayiMap.get(code);
    const sorted = sortCandidatesByFreq(candidates);
    const withPreference = applyUserPreference(code, sorted, userModel);
    return withPreference[0].char;
  }).join(' ');

  previewText.textContent = preview;
  previewDiv.classList.remove('hidden');
}
```

#### Viterbi Integration

```javascript
/**
 * Predict sentence using Viterbi algorithm
 * @returns {Promise<Object|null>} Prediction result
 */
async function predictSentence() {
  if (codeBuffer.length === 0) {
    showTemporaryError('編碼緩衝區為空');
    return null;
  }

  // Ensure N-gram DB is loaded
  const ngram = await loadNgramDatabase();
  if (!ngram) {
    showTemporaryError('N-gram 資料庫未載入');
    return null;
  }

  try {
    // Run Viterbi algorithm
    const result = viterbi(codeBuffer, dayiMap, ngram);
    return result;
  } catch (error) {
    console.error('Viterbi prediction failed:', error);
    showTemporaryError('預測失敗');
    return null;
  }
}

/**
 * Handle Space key in sentence mode
 */
async function handleSpaceInSentenceMode() {
  // Show prediction indicator
  showPredictionIndicator();

  const result = await predictSentence();

  hidePredictionIndicator();

  if (result) {
    // Display prediction (candidates area shows result)
    displaySentencePrediction(result);

    // Append to output buffer
    appendToOutputBuffer(result.sentence);

    // Auto-copy if enabled
    if (autoCopyEnabled) {
      performAutoCopy(document.getElementById('output-buffer').value);
      showCopyFeedback();
    }

    // Clear buffer and input
    clearCodeBuffer();
    clearInput();
  }
}

/**
 * Display sentence prediction result
 * @param {Object} result - Viterbi result
 */
function displaySentencePrediction(result) {
  const candidateArea = document.getElementById('candidate-area');
  if (!candidateArea) return;

  const { sentence, score, chars } = result;

  const html = `
    <div class="sentence-prediction">
      <div class="prediction-header">
        <span class="material-symbols-outlined">auto_awesome</span>
        <span>智慧預測</span>
      </div>
      <div class="predicted-sentence">${sentence}</div>
      <div class="prediction-details">
        <div class="char-breakdown">
          ${chars.map((char, i) =>
            `<span class="char-with-code">
              <span class="char">${char}</span>
              <span class="code">${codeBuffer[i]}</span>
            </span>`
          ).join(' → ')}
        </div>
        <div class="prediction-score">
          機率分數: ${score.toFixed(3)}
        </div>
      </div>
    </div>
  `;

  candidateArea.innerHTML = html;
}
```

### 3.3 Event Handling Updates

```javascript
/**
 * Handle keydown events (updated for sentence mode)
 */
function handleKeyDown(e) {
  const key = e.key;

  if (inputMode === 'sentence') {
    // === SENTENCE MODE KEY HANDLING ===

    // Space: Trigger prediction
    if (key === ' ') {
      e.preventDefault();
      handleSpaceInSentenceMode();
      return;
    }

    // Backspace (empty input): Remove last code from buffer
    if (key === 'Backspace' && inputBox.value === '') {
      e.preventDefault();
      removeLastCodeFromBuffer();
      return;
    }

    // Escape: Clear buffer
    if (key === 'Escape') {
      e.preventDefault();
      clearCodeBuffer();
      clearInput();
      return;
    }

    // Fall through to normal input handling for typing codes

  } else {
    // === CHARACTER MODE KEY HANDLING (existing v10 logic) ===

    // Space key for 1st candidate
    if (key === ' ') {
      e.preventDefault();
      handleSelection(0);
      return;
    }

    // Quick selection keys
    const index = getSelectionIndexFromKey(key);
    if (index !== -1) {
      e.preventDefault();
      handleSelection(index);
      return;
    }

    // Pagination
    if (key === '=') {
      e.preventDefault();
      handlePagination();
      return;
    }

    // Delete key for clearing output
    if (key === 'Delete') {
      e.preventDefault();
      const outputBuffer = document.getElementById('output-buffer');
      if (outputBuffer && outputBuffer.value) {
        outputBuffer.value = '';
        showTemporaryFeedback('已清除');
      }
      return;
    }

    // Backspace handling (smart backspace)
    // ... existing logic ...
  }
}

/**
 * Handle input events (updated for sentence mode)
 */
function handleInput(value, previousValue) {
  if (inputMode === 'sentence') {
    // === SENTENCE MODE INPUT HANDLING ===

    // Check for complete 2-char code
    if (value.length === 2) {
      const added = addToCodeBuffer(value);
      if (added) {
        // Successfully added, clear input for next code
        clearInput();
      } else {
        // Invalid code, show error and clear
        showTemporaryError(`無效編碼: ${value}`);
        setTimeout(() => clearInput(), 1000);
      }
      return;
    }

    // 1-char input: just wait for 2nd char
    // No candidate display in sentence mode

  } else {
    // === CHARACTER MODE INPUT HANDLING (existing v10 logic) ===

    // Auto-select detection
    const shouldAutoSelectNow = shouldAutoSelectOnInput(previousValue, value);

    if (shouldAutoSelectNow && previousValue.length === 2) {
      const autoResult = performAutoSelect(previousValue, dayiMap, userModel);
      if (autoResult.success) {
        appendToOutputBuffer(autoResult.selectedChar);

        if (autoCopyEnabled) {
          performAutoCopy(document.getElementById('output-buffer').value);
          showCopyFeedback();
        }

        const newCode = value.slice(-1);
        queryCandidates(dayiMap, newCode);
        inputBox.value = newCode;
        return;
      }
    }

    // Normal query
    const candidates = queryCandidates(dayiMap, value);
    const sorted = sortCandidatesByFreq(candidates);
    const withUserPreference = applyUserPreference(value, sorted, userModel);

    updateCandidateArea(withUserPreference, value);
  }
}
```

---

## 4. UI/UX Design

### 4.1 Mode Toggle

```html
<div class="mode-toggle-container">
  <div class="mode-toggle">
    <button id="char-mode-btn" class="mode-btn active">
      <span class="material-symbols-outlined">text_fields</span>
      <span>逐字模式</span>
    </button>
    <button id="sentence-mode-btn" class="mode-btn">
      <span class="material-symbols-outlined">auto_awesome</span>
      <span>整句模式</span>
    </button>
  </div>
  <div class="mode-description">
    <span id="mode-description-text">
      逐字模式: 每輸入一個編碼即選字
    </span>
  </div>
</div>
```

### 4.2 Code Buffer Display

```html
<div id="code-buffer-display" class="code-buffer-display hidden">
  <div class="buffer-header">
    <span class="buffer-label">
      <span class="material-symbols-outlined">code</span>
      已輸入編碼:
    </span>
    <button id="clear-buffer-btn" class="icon-btn" title="清除緩衝區 (Esc)">
      <span class="material-symbols-outlined">backspace</span>
    </button>
  </div>
  <div id="buffered-codes" class="buffered-codes">
    <span class="empty-buffer-hint">尚無編碼</span>
  </div>
</div>
```

### 4.3 Live Preview

```html
<div id="live-preview" class="live-preview hidden">
  <div class="preview-label">
    <span class="material-symbols-outlined">visibility</span>
    預覽:
  </div>
  <div id="preview-text" class="preview-text"></div>
  <div class="preview-hint">
    按 Space 鍵以智慧預測最佳句子
  </div>
</div>
```

### 4.4 Loading Indicator

```html
<div id="ngram-loading" class="loading-overlay hidden">
  <div class="loading-card">
    <div class="spinner"></div>
    <div class="loading-text">載入 N-gram 資料庫...</div>
    <div class="loading-subtext">首次使用需載入 10MB 資料</div>
  </div>
</div>
```

### 4.5 CSS Styling

```css
/* Mode Toggle */
.mode-toggle-container {
  margin-bottom: 1.5rem;
}

.mode-toggle {
  display: flex;
  gap: 0.5rem;
  background: var(--bg-secondary);
  padding: 0.25rem;
  border-radius: 0.75rem;
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.mode-btn:hover {
  background: rgba(15, 184, 240, 0.1);
  color: var(--primary-color);
}

.mode-btn.active {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(15, 184, 240, 0.3);
}

.mode-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

.mode-description {
  margin-top: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Code Buffer Display */
.code-buffer-display {
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 2px dashed var(--border-color);
}

.buffer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.buffer-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.buffered-codes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 2.5rem;
  align-items: center;
}

.buffered-code {
  padding: 0.5rem 0.75rem;
  background: var(--primary-color);
  color: white;
  border-radius: 0.375rem;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.05em;
  animation: slideIn 0.2s ease;
}

.empty-buffer-hint {
  color: var(--text-secondary);
  font-style: italic;
  font-size: 0.875rem;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Live Preview */
.live-preview {
  background: linear-gradient(135deg, rgba(15, 184, 240, 0.1), rgba(102, 126, 234, 0.1));
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 2px solid rgba(15, 184, 240, 0.3);
}

.preview-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.preview-text {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.3em;
  text-align: center;
  padding: 1rem 0;
  font-family: var(--font-display);
}

.preview-hint {
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.preview-hint .material-symbols-outlined {
  font-size: 1rem;
  vertical-align: middle;
}

/* Sentence Prediction Result */
.sentence-prediction {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  animation: fadeIn 0.3s ease;
}

.prediction-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
  opacity: 0.9;
}

.predicted-sentence {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.2em;
  margin: 1rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.prediction-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.char-breakdown {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
  font-size: 1.125rem;
}

.char-with-code {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.char-with-code .char {
  font-size: 1.5rem;
  font-weight: 600;
}

.char-with-code .code {
  font-size: 0.75rem;
  opacity: 0.8;
  font-family: 'Courier New', monospace;
}

.prediction-score {
  text-align: center;
  font-size: 0.875rem;
  opacity: 0.8;
  margin-top: 0.5rem;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.loading-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 20rem;
}

.spinner {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  border: 4px solid rgba(15, 184, 240, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.loading-subtext {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Dark mode adjustments */
.dark .code-buffer-display {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .live-preview {
  background: linear-gradient(135deg, rgba(15, 184, 240, 0.15), rgba(102, 126, 234, 0.15));
  border-color: rgba(15, 184, 240, 0.4);
}

/* Responsive */
@media (max-width: 640px) {
  .mode-btn span:not(.material-symbols-outlined) {
    display: none;
  }

  .predicted-sentence {
    font-size: 2rem;
  }

  .char-breakdown {
    font-size: 1rem;
  }
}
```

---

## 5. Test Plan (TDD)

### Test File: `test-node-v11.js`

**Total Tests**: ~30 tests

#### Category 1: N-gram Database Loading (5 tests)
1. `test_loadNgramDatabase_success` - Load database successfully
2. `test_loadNgramDatabase_structure` - Validate database structure
3. `test_loadNgramDatabase_cache` - Second load returns cached instance
4. `test_loadNgramDatabase_concurrent` - Handle concurrent load requests
5. `test_loadNgramDatabase_error` - Handle loading errors gracefully

#### Category 2: Input Mode Management (6 tests)
1. `test_setInputMode_initialize` - Initialize in character mode
2. `test_setInputMode_switchToSentence` - Switch to sentence mode
3. `test_setInputMode_switchBack` - Switch back to character mode
4. `test_setInputMode_clearState` - Clear buffer when switching
5. `test_setInputMode_lazyLoad` - Load N-gram DB when entering sentence mode
6. `test_updateModeUI` - UI updates correctly for mode

#### Category 3: Code Buffering (8 tests)
1. `test_addToCodeBuffer_valid` - Add valid code to buffer
2. `test_addToCodeBuffer_invalid` - Reject invalid code
3. `test_addToCodeBuffer_maxSize` - Respect max buffer size (10 codes)
4. `test_removeLastCodeFromBuffer` - Remove last code
5. `test_clearCodeBuffer` - Clear entire buffer
6. `test_getCodeBuffer` - Get buffer contents (returns copy)
7. `test_updateCodeBufferDisplay` - Display updates when buffer changes
8. `test_updateCodeBufferDisplay_empty` - Display empty state correctly

#### Category 4: Live Preview (3 tests)
1. `test_updateLivePreview_shown` - Show preview when buffer not empty
2. `test_updateLivePreview_hidden` - Hide preview when buffer empty
3. `test_updateLivePreview_content` - Preview shows first candidates

#### Category 5: Viterbi Integration (6 tests)
1. `test_predictSentence_twoCode` - Predict with 2 codes
2. `test_predictSentence_threeCodes` - Predict with 3 codes
3. `test_predictSentence_empty` - Handle empty buffer
4. `test_predictSentence_noNgram` - Handle N-gram DB not loaded
5. `test_displaySentencePrediction` - Display prediction correctly
6. `test_handleSpaceInSentenceMode` - Space triggers prediction and output

#### Category 6: Event Handling (5 tests)
1. `test_handleKeyDown_spaceInSentence` - Space triggers prediction
2. `test_handleKeyDown_backspaceRemoves` - Backspace removes last code
3. `test_handleKeyDown_escClears` - ESC clears buffer
4. `test_handleInput_sentenceMode` - Input handling in sentence mode
5. `test_handleInput_characterMode` - Character mode unchanged

#### Category 7: Integration & Regression (3 tests)
1. `test_integration_fullWorkflow` - Complete sentence mode workflow
2. `test_integration_modeSwitch` - Switch modes during input
3. `test_regression_v10Features` - All v10 features still work

---

## 6. Performance Requirements

| Metric | Target | Strategy |
|--------|--------|----------|
| N-gram DB load time | <5s on 4G | Show progress, use gzip |
| Viterbi prediction | <200ms for 5 codes | Algorithm is O(n*m²), should be fast |
| Memory usage | <20MB total | Acceptable for modern browsers |
| Initial page load | <2s | Lazy load N-gram DB |
| Mode switch | <100ms | Instant UI update |

---

## 7. Backward Compatibility

**All v10 features MUST continue working**:

| Feature | v10 Behavior | v11 Compatibility |
|---------|--------------|-------------------|
| Character mode | Default mode | Unchanged, same as v10 |
| Dark mode | Toggle theme | Applies to new UI elements |
| Font size | A-/A+ buttons | Applies to preview/prediction |
| Auto-copy | Copy after selection | Works in both modes |
| User personalization | Remember preferences | Works in character mode |
| Mobile responsive | FAB + panel | New elements also responsive |
| Touch-friendly | Click to select | Mode toggle touch-optimized |
| All 104 tests | Passing | Must all pass in v11 |

---

## 8. Risk Mitigation

### Risk 1: Large Database Load Time
- **Risk**: 10.4MB may be slow on mobile networks
- **Mitigation**:
  - Lazy loading (only when needed)
  - Show progress indicator with estimated time
  - Allow cancellation
  - Consider gzip compression (reduces to ~3-4MB)

### Risk 2: Viterbi Performance
- **Risk**: May be slow for long inputs
- **Mitigation**:
  - Limit buffer to 10 codes
  - Show "Computing..." indicator
  - Add timeout (2s) with fallback

### Risk 3: User Confusion
- **Risk**: Two modes might confuse users
- **Mitigation**:
  - Clear visual indicators
  - Mode descriptions
  - Tutorial/help text
  - Default to familiar character mode

### Risk 4: Backward Compatibility
- **Risk**: New code breaks existing features
- **Mitigation**:
  - TDD approach for all new code
  - Run all 104 v10 tests
  - Manual testing of all v10 features
  - Version control for easy rollback

---

## 9. Success Metrics

### Functional
- ✅ All 30 new tests passing
- ✅ All 104 v10 tests passing (no regression)
- ✅ Viterbi prediction works with real data
- ✅ Mode switching works smoothly
- ✅ All UI elements render correctly

### Performance
- ✅ N-gram DB loads in <5s on 4G
- ✅ Viterbi completes in <200ms
- ✅ No console errors
- ✅ Memory usage <20MB

### UX
- ✅ Loading indicators show during waits
- ✅ Error messages are clear and helpful
- ✅ Preview updates in real-time
- ✅ Prediction result is visually striking
- ✅ Mobile experience is smooth

---

## 10. Implementation Checklist

### Phase 1: Foundation
- [ ] Copy viterbi.js → viterbi_module.js (browser compatible)
- [ ] Copy ngram_db.json to mvp1/
- [ ] Add global state variables
- [ ] Add database loading function
- [ ] Write tests for database loading (5 tests)
- [ ] Verify tests pass

### Phase 2: Input Modes
- [ ] Add input mode management functions
- [ ] Add mode toggle UI (HTML/CSS)
- [ ] Write tests for mode management (6 tests)
- [ ] Implement mode switching
- [ ] Verify tests pass

### Phase 3: Code Buffering
- [ ] Add code buffer functions
- [ ] Add buffer display UI (HTML/CSS)
- [ ] Write tests for buffering (8 tests)
- [ ] Implement buffer logic
- [ ] Verify tests pass

### Phase 4: Live Preview
- [ ] Add preview functions
- [ ] Add preview UI (HTML/CSS)
- [ ] Write tests for preview (3 tests)
- [ ] Implement preview updates
- [ ] Verify tests pass

### Phase 5: Viterbi Integration
- [ ] Add prediction functions
- [ ] Add prediction result UI (HTML/CSS)
- [ ] Write tests for Viterbi integration (6 tests)
- [ ] Implement prediction workflow
- [ ] Verify tests pass

### Phase 6: Event Handling
- [ ] Update keydown handler
- [ ] Update input handler
- [ ] Write tests for events (5 tests)
- [ ] Implement event routing
- [ ] Verify tests pass

### Phase 7: Polish & Testing
- [ ] Add loading/error indicators
- [ ] Add animations and transitions
- [ ] Write integration tests (3 tests)
- [ ] Run all tests (30 new + 104 old)
- [ ] Manual testing (all scenarios)

### Phase 8: Documentation
- [ ] Update memory bank
- [ ] Create v11 README
- [ ] Update main README
- [ ] Add inline code comments
- [ ] Commit and push

---

**Status**: Design Complete ✓
**Next**: Begin Phase 1 Implementation with TDD
