# CRITICAL UX REDESIGN: Space Key Behavior in Sentence Mode

**Date**: 2025-11-11
**Status**: 🔥 CRITICAL - Fundamental UX Misunderstanding
**Reported By**: User feedback in Traditional Chinese

---

## User Report (Critical Insight)

> "目前仍是有問題 請好好考慮在整句模式下 單碼與雙碼存在的情境
> 單碼應該只要能送出 不應該選字 而是在最後用預測的整句模式去推出句子
> 所以問題應該是space 不應該是選字與預測共用
> 請將預測hotkey換為= 並且讓 user的v+space 能進入預測區 來預測整個句子"

**Translation**:
"There's still a problem. Please carefully consider the scenario of single-code and double-code in sentence mode.
Single-code should only be submitted, NOT selected. It should use sentence prediction mode at the end.
So the problem is that Space should NOT be shared between selection and prediction.
Please change the prediction hotkey to =, and let 'v + Space' enter the prediction area to predict the whole sentence."

---

## Root Cause: Fundamental UX Misunderstanding

### My Previous (WRONG) Understanding

I treated **Sentence Mode** as "Character Mode + Buffering":
- Single code "v" → Show candidates → Space selects from candidates ❌
- This is just character mode with a buffer - NOT sentence prediction!

### Correct Understanding (User's Vision)

**Sentence Mode** is "Blind Typing + N-gram Prediction":
- Single code "v" → Space adds to buffer → Viterbi predicts → Shows "大" ✅
- This is TRUE sentence prediction with statistical language model!

---

## Correct Design Specification

### Character Mode (逐字模式) - UNCHANGED
```
Flow:
1. Type "v" → Candidates appear
2. Press Space/' /[/etc → Select from candidates → Append to output
3. Input cleared, ready for next character

Purpose: One character at a time, manual selection
```

### Sentence Mode (整句模式) - NEEDS REDESIGN

**Current (WRONG) Flow**:
```
1. Type "v" → Candidates appear
2. Press Space → Select first candidate → Append to output  ❌ WRONG!
   (This is just character mode behavior!)
```

**Correct Flow (User's Vision)**:
```
1. Type "v" → (Optional: Live preview shows first candidate)
2. Press Space →
   - "v" added to code buffer as one unit
   - Input box cleared
   - Viterbi prediction triggered with buffer ["v"]
   - Prediction area shows "大" (based on N-gram)
3. Type "ad" → (Optional: Live preview shows "在")
4. Press Space →
   - "ad" added to code buffer
   - Input box cleared
   - Viterbi triggered with buffer ["v", "ad"]
   - Prediction area shows "大在"
5. Press = →
   - Prediction result "大在" appended to output
   - Code buffer cleared
   - Prediction area cleared
   - Ready for next sentence

Alternative at step 5:
- Press Backspace → Remove last code "ad" from buffer
- Prediction updates to "大"
- Can continue adding more codes
```

**Key Insight**:
- Space = "Confirm current code and add to buffer + predict"
- = = "Confirm prediction and output"
- Selection keys (' [ ] - \) = DISABLED in sentence mode (no manual selection!)

---

## Technical Changes Required

### 1. Space Key Behavior in Sentence Mode

**File**: `mvp1/core_logic.js`

**Current (WRONG)**:
```javascript
// Space in sentence mode with single-char → Select from candidates
if (buffer.length === 0 && inputValue.length === 1 && currentCandidates.length > 0) {
  handleSelection(0);  // ❌ WRONG - this is character mode behavior!
}
```

**Correct**:
```javascript
// Space in sentence mode → Add code to buffer + trigger prediction
if (key === ' ') {
  e.preventDefault();

  if (isInSentenceMode) {
    const inputValue = inputBox.value.trim();

    if (inputValue.length > 0) {
      // Add code to buffer (works for both single and double char)
      if (typeof addToCodeBuffer === 'function') {
        const added = addToCodeBuffer(inputValue, dayiMap);

        if (added) {
          // Clear input
          clearInputBox();

          // Trigger prediction with current buffer
          if (typeof triggerSentencePrediction === 'function') {
            triggerSentencePrediction();
          }
        }
      }
    }
    return;
  }

  // Character mode: Select first candidate (unchanged)
  if (currentCode && currentCandidates.length > 0) {
    handleSelection(0);
  }
}
```

### 2. = Key Behavior Change

**Current**: Pagination (cycle to next page)
**New**: Confirm prediction and output

**File**: `mvp1/core_logic.js`

```javascript
// = key handler
if (key === '=') {
  e.preventDefault();

  if (isInSentenceMode) {
    // NEW: Confirm prediction and output
    if (typeof confirmPrediction === 'function') {
      confirmPrediction();
    }
  } else {
    // Character mode: Pagination (unchanged)
    handlePagination();
  }
  return;
}
```

### 3. Selection Keys Disabled in Sentence Mode

**File**: `mvp1/core_logic.js`

```javascript
// Handle selection keys (' [ ] - \)
const selectionIndex = getSelectionIndexFromKey(key);
if (selectionIndex !== -1) {
  e.preventDefault();

  // NEW: Disable selection in sentence mode
  if (isInSentenceMode) {
    console.log('[Sentence Mode] Selection keys disabled - use Space to buffer, = to confirm');
    return;
  }

  // Character mode: Selection (unchanged)
  if (currentCode && currentCandidates.length > 0) {
    handleSelection(selectionIndex);
  }
}
```

### 4. New Function: triggerSentencePrediction()

**File**: `mvp1/core_logic_v11.js` or `core_logic_v11_ui.js`

```javascript
/**
 * Trigger sentence prediction based on current code buffer
 * Called when Space is pressed in sentence mode
 */
function triggerSentencePrediction() {
  const buffer = getCodeBuffer();

  if (buffer.length === 0) {
    console.log('[Prediction] No codes in buffer');
    return;
  }

  // Call existing prediction function (already implemented)
  if (typeof predictSentenceFromBuffer === 'function') {
    const result = predictSentenceFromBuffer(buffer, dayiMap, ngramDb);

    if (result) {
      // Update prediction display
      if (typeof updatePredictionDisplay === 'function') {
        updatePredictionDisplay(result.sentence, result.score);
      }
    }
  }
}
```

### 5. New Function: confirmPrediction()

**File**: `mvp1/core_logic_v11_ui.js`

```javascript
/**
 * Confirm prediction and output to buffer
 * Called when = is pressed in sentence mode
 */
function confirmPrediction() {
  const predictionArea = document.getElementById('prediction-result-text');
  if (!predictionArea) return;

  const predictedSentence = predictionArea.textContent;

  if (predictedSentence && predictedSentence !== '(等待預測)') {
    // Append to output
    const outputBuffer = document.getElementById('output-buffer');
    if (outputBuffer) {
      outputBuffer.value += predictedSentence;

      // Auto-copy if enabled
      if (autoCopyEnabled && performAutoCopy(outputBuffer.value)) {
        showCopyFeedback();
      }
    }

    // Clear buffer and prediction
    clearCodeBuffer();
    updateBufferDisplay();
    updateLivePreviewDisplay();
    predictionArea.textContent = '(等待預測)';

    console.log(`[Prediction Confirmed] Output: "${predictedSentence}"`);
  }
}
```

### 6. Remove Single-Char Selection Logic

**File**: `mvp1/core_logic_v11_ui.js` (lines 427-432)

**REMOVE** the fix I just added:
```javascript
// CRITICAL FIX: Set global state for selection to work
currentCode = value;  // ❌ REMOVE - wrong approach!
currentCandidates = withUserPreference;
currentPage = 0;
```

**Reasoning**: Single-char should NOT trigger selection in sentence mode!

---

## TDD Test Plan

### Test File: `test-sentence-mode-space-key.js`

**Category 1: Space Key Adds to Buffer (Single Code)**
1. Type "v" + Space → code "v" in buffer
2. Buffer display shows ["v"]
3. Input box cleared
4. Prediction triggered

**Category 2: Space Key Adds to Buffer (Double Code)**
1. Type "ad" + Space → code "ad" in buffer
2. Buffer shows ["ad"]
3. Input cleared
4. Prediction triggered

**Category 3: Multiple Codes**
1. "v" + Space → buffer ["v"], prediction "大"
2. "ad" + Space → buffer ["v", "ad"], prediction "大在"
3. Verify buffer accumulates correctly

**Category 4: = Key Confirms Prediction**
1. Buffer has ["v", "ad"]
2. Prediction shows "大在"
3. Press = → output has "大在"
4. Buffer cleared
5. Prediction cleared

**Category 5: Selection Keys Disabled**
1. In sentence mode, press ' → no selection
2. Press [ → no selection
3. Only Space and = work

**Category 6: Live Preview (Optional)**
1. Type "v" (don't press Space yet)
2. Live preview shows "大" (first candidate)
3. But no selection yet - waiting for Space

**Total**: ~25 comprehensive tests

---

## Migration Plan

### Phase 1: Write TDD Tests
- Create comprehensive test suite
- Document expected behavior
- Run tests (will fail initially)

### Phase 2: Implement Changes
- Update Space key handler
- Update = key handler
- Disable selection keys in sentence mode
- Remove wrong single-char selection fix

### Phase 3: Verification
- All new tests pass
- Existing character mode tests still pass
- Manual browser testing

### Phase 4: Documentation
- Update UX docs
- Update memory bank
- Add usage instructions to UI

---

## Expected User Experience

### Scenario: Type "易在大" (easy to exist large)

**User Actions**:
```
1. Switch to Sentence Mode
2. Type "4jp" + Space
   → Buffer: ["4jp"]
   → Prediction: "易"
3. Type "ad" + Space
   → Buffer: ["4jp", "ad"]
   → Prediction: "易在"
4. Type "v" + Space
   → Buffer: ["4jp", "ad", "v"]
   → Prediction: "易在大"
5. Press =
   → Output: "易在大"
   → Buffer: cleared
   → Ready for next sentence
```

**Key Benefits**:
- ✅ True blind typing (don't need to look at candidates)
- ✅ Statistical prediction (N-gram chooses best path)
- ✅ Can accumulate many codes before confirming
- ✅ Natural sentence input flow
- ✅ Matches user's mental model

---

## Success Criteria

1. ✅ Space adds code to buffer (single or double char)
2. ✅ Space triggers Viterbi prediction
3. ✅ = confirms prediction and outputs
4. ✅ Selection keys disabled in sentence mode
5. ✅ Character mode unchanged (no regression)
6. ✅ All tests passing (new + existing)

---

**END OF REDESIGN SPECIFICATION**
