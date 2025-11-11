# Critical UX Issues - Round 2 (Post v11)

**Date**: 2025-11-11 (continued)
**Session**: claude/init-memory-bank-readme-011CUqoiGKdFk7wf79JNuW1h
**Status**: Analysis Phase

---

## Issues Identified

### Issue 1: Single-Code in Sentence Mode (CRITICAL)

**Problem**: User types "v" + Space in sentence mode → Nothing happens
- No candidates shown
- No selection possible
- Breaks basic workflow

**Root Cause**:
Lines 407-442 in `core_logic_v11_ui.js` only handle `value.length === 2`
```javascript
// Sentence mode: buffer 2-char codes
const value = originalInputBox.value.toLowerCase();

if (value.length === 2) {
  // Only processes 2-char input
  // Single char is completely ignored!
}
```

**User Expectations**:
1. Type "v" → Should see candidates (大, 丈, etc.)
2. Press Space → Should select first candidate "大"
3. OR continue typing → Should buffer for multi-code prediction

**Current Behavior**:
1. Type "v" → Nothing shown (input ignored)
2. Press Space → Nothing happens (buffer empty, prediction fails)
3. User is stuck

**Design Decision Needed**:

**Option A: Hybrid Mode (RECOMMENDED)**
- Single-char input → Show candidates (like character mode)
- Space → Select candidate
- Continue typing to 2 chars → Auto-buffer and show buffered state
- Allows both single-char selection AND multi-code prediction

**Option B: Strict Sentence Mode**
- Require 2-char codes always
- Show error for single-char input
- User must type full codes

**Recommendation**: Option A - More flexible, doesn't break user workflow

---

### Issue 2: Delete Key Should Clear Prediction

**Problem**: User wants Delete to clear prediction area in sentence mode

**Current Behavior** (from our v11 fix):
```javascript
if (key === 'Delete') {
  // Clears output buffer ✅
  // Clears candidate area ✅
  // Clears code buffer ✅
  // Shows feedback ✅
}
```

**Issue**: In sentence mode, after a prediction is shown, the prediction stays visible

**Expected Behavior**:
- Delete should clear the prediction display (candidate area)
- Should work the same as ESC currently does

**Fix**: Already implemented! Our Delete key fix (lines 1370-1394 in core_logic.js) should handle this.

**Need to Verify**: Is the candidate area being cleared properly?

---

### Issue 3: English Mixed Input Mode

**Status**: Deferred from previous session, now requested

**Requirements** (from DESIGN-v11-ux-improvements.md):
1. Press Shift → Toggle to English mode
2. Type English/numbers → Append directly to output
3. No Chinese input processing
4. Press Shift again → Return to Chinese mode
5. Visual indicator showing current mode

**Design** (already complete):
```javascript
let languageMode = 'chinese'; // 'chinese' | 'english'

if (key === 'Shift') {
  languageMode = (languageMode === 'chinese' ? 'english' : 'chinese');
  updateLanguageModeIndicator();
}

if (languageMode === 'english') {
  // Direct append to output
  outputBuffer.value += inputBox.value;
  inputBox.value = '';
  return; // Skip all Chinese logic
}
```

**Implementation**: ~2 hours, ready to implement

---

## Root Cause Analysis

### Issue 1 Deep Dive

**File**: `mvp1/core_logic_v11_ui.js`
**Lines**: 401-445 (input handler)

**Problem Code**:
```javascript
originalInputBox.addEventListener('input', (e) => {
  if (getInputMode() !== 'sentence') {
    return; // Character mode
  }

  // Sentence mode: ONLY handles 2-char codes
  const value = originalInputBox.value.toLowerCase();

  if (value.length === 2) {
    // Process 2-char code
  }
  // BUG: Single-char input is ignored!
  // No candidates shown, no way to select
});
```

**Why This Breaks**:
1. Character mode handler is skipped (mode guard at core_logic.js:1117)
2. Sentence mode handler ignores single-char input
3. Result: Single-char input falls through both handlers
4. User sees nothing, Space does nothing

**The Fix**:
```javascript
originalInputBox.addEventListener('input', (e) => {
  if (getInputMode() !== 'sentence') {
    return;
  }

  const value = originalInputBox.value.toLowerCase();

  // NEW: Handle single-char input
  if (value.length === 1) {
    // Show candidates (hybrid approach)
    const candidates = dayiMap.get(value);
    if (candidates && candidates.length > 0) {
      const sorted = sortCandidatesByFreq(candidates);
      updateCandidateArea(sorted, 0);
      // Space can now select from these candidates
    }
    return;
  }

  // Existing: Handle 2-char input
  if (value.length === 2) {
    // Buffer for prediction
    const added = addToCodeBuffer(value, dayiMap);
    // ...
  }
});
```

**Space Key Handling** (needs update):
```javascript
// In core_logic.js keydown handler
if (key === ' ') {
  e.preventDefault();

  if (isInSentenceMode) {
    const buffer = getCodeBuffer();
    const inputValue = inputBox.value.trim();

    // NEW: Check if showing candidates for single-char input
    if (buffer.length === 0 && inputValue.length === 1) {
      // Single-char with candidates → Select first candidate
      if (currentCandidates && currentCandidates.length > 0) {
        handleSelection(0);
        return;
      }
    }

    // Existing: Multi-code prediction
    if (buffer.length > 0) {
      // Let v11 handler trigger prediction
      return;
    }
  } else {
    // Character mode: Select first candidate
    if (currentCode && currentCandidates.length > 0) {
      handleSelection(0);
    }
  }
}
```

---

## Implementation Plan

### Phase 1: Issue 2 Verification (5 min)

**Goal**: Verify Delete key is working correctly

**Test**:
1. Enter sentence mode
2. Type "4jp ad" + Space → Prediction shows
3. Press Delete → Verify candidate area clears

**Expected**: Already fixed by our previous Delete enhancement

---

### Phase 2: Issue 1 Fix - Single-Code Hybrid Mode (1 hour)

**Step 1: Update input handler** (core_logic_v11_ui.js)
```javascript
// Add single-char handling before 2-char handling
if (value.length === 1) {
  // Query candidates
  const candidates = dayiMap.get(value);
  if (candidates && candidates.length > 0) {
    currentCode = value; // Set for Space handler
    currentCandidates = sortCandidatesByFreq(candidates);
    updateCandidateArea(currentCandidates, 0);
  }
  return;
}
```

**Step 2: Update Space key handler** (core_logic.js)
```javascript
// Add check for single-char selection in sentence mode
if (isInSentenceMode) {
  const buffer = getCodeBuffer();
  const inputValue = inputBox.value.trim();

  // Single-char + candidates → Select
  if (buffer.length === 0 && inputValue.length === 1 && currentCandidates.length > 0) {
    handleSelection(0);
    return;
  }

  // Multi-code → Predict
  if (buffer.length > 0) {
    return; // v11 handler
  }
}
```

**Step 3: TDD Tests**
- Test: Single "v" shows candidates in sentence mode
- Test: "v" + Space selects "大" in sentence mode
- Test: "v" + "m" buffers "vm" (2-char code)
- Test: Continue to multi-code prediction works

---

### Phase 3: Issue 3 Implementation - English Mode (2 hours)

**Step 1: Add language mode state** (core_logic.js)
```javascript
// Add after line 15
let languageMode = 'chinese'; // 'chinese' | 'english'
```

**Step 2: Add Shift key handler** (core_logic.js keydown)
```javascript
// Add before Delete key handler
if (key === 'Shift') {
  e.preventDefault();

  // Toggle language mode
  languageMode = (languageMode === 'chinese' ? 'english' : 'chinese');

  // Update UI indicator
  updateLanguageModeIndicator(languageMode);

  console.log(`[Language Mode] Switched to: ${languageMode}`);
  return;
}
```

**Step 3: Add language mode check to input handler**
```javascript
inputBox.addEventListener('input', (e) => {
  // NEW: English mode - direct output
  if (languageMode === 'english') {
    const outputBuffer = document.getElementById('output-buffer');
    if (outputBuffer) {
      outputBuffer.value += e.target.value;

      // Auto-copy if enabled
      if (autoCopyEnabled && performAutoCopy(outputBuffer.value)) {
        showCopyFeedback();
      }
    }
    inputBox.value = ''; // Clear input
    return; // Skip all Chinese logic
  }

  // Existing Chinese logic
  handleInput(e.target.value, previousValue);
  previousValue = e.target.value.trim().toLowerCase();
});
```

**Step 4: Add UI indicator** (index.html)
```html
<!-- Add after input box -->
<div id="language-mode-indicator" class="hidden fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-yellow-500 text-white font-semibold text-sm shadow-lg z-50">
  <span class="material-symbols-outlined text-base mr-2">language</span>
  <span>English Mode (按 Shift 返回中文)</span>
</div>
```

**Step 5: Add indicator functions** (core_logic.js)
```javascript
function updateLanguageModeIndicator(mode) {
  const indicator = document.getElementById('language-mode-indicator');
  if (!indicator) return;

  if (mode === 'english') {
    indicator.classList.remove('hidden');
  } else {
    indicator.classList.add('hidden');
  }
}
```

**Step 6: TDD Tests**
- Test: Shift toggles language mode
- Test: English mode appends directly to output
- Test: English mode skips Chinese logic
- Test: Shift returns to Chinese mode
- Test: Indicator shows/hides correctly
- Test: English mode works in both character and sentence modes

---

## Testing Strategy

### Issue 1 Tests

**File**: `test-v11-ux-round2.js` (new)

```javascript
// Test 1: Single-char shows candidates in sentence mode
test('1.1: Single char "v" shows candidates in sentence mode', () => {
  setInputMode('sentence');

  // Simulate typing "v"
  const candidates = dayiMap.get('v');
  assert.ok(candidates && candidates.length > 0);

  // Should show in candidate area
  // (UI test - check that updateCandidateArea called)
});

// Test 2: Single char + Space selects in sentence mode
test('1.2: "v" + Space selects first candidate', () => {
  setInputMode('sentence');

  // Type "v"
  simulateInput('v');

  // Press Space
  simulateKeyPress('Space');

  // Should append "大" to output
  const output = document.getElementById('output-buffer').value;
  assert.ok(output.includes('大'));
});

// Test 3: Continuing to 2 chars buffers
test('1.3: "v" + "m" buffers "vm" for prediction', () => {
  setInputMode('sentence');

  // Type "v" then "m"
  simulateInput('vm');

  // Should be buffered
  const buffer = getCodeBuffer();
  assert.deepStrictEqual(buffer, ['vm']);
});
```

### Issue 2 Tests

```javascript
// Test: Delete clears prediction in sentence mode
test('2.1: Delete clears prediction area', () => {
  setInputMode('sentence');

  // Create prediction
  addToCodeBuffer('4jp', dayiMap);
  addToCodeBuffer('ad', dayiMap);
  triggerPrediction(); // Shows "易在"

  // Press Delete
  simulateKeyPress('Delete');

  // Verify cleared
  const candidateArea = document.getElementById('candidate-area');
  const buffer = getCodeBuffer();

  assert.strictEqual(buffer.length, 0);
  assert.ok(candidateArea.innerHTML.includes('已清除'));
});
```

### Issue 3 Tests

```javascript
// Test: Shift toggles language mode
test('3.1: Shift toggles to English mode', () => {
  // Press Shift
  simulateKeyPress('Shift');

  // Verify mode switched
  assert.strictEqual(languageMode, 'english');

  // Verify indicator shown
  const indicator = document.getElementById('language-mode-indicator');
  assert.ok(!indicator.classList.contains('hidden'));
});

// Test: English input goes directly to output
test('3.2: English mode appends directly to output', () => {
  languageMode = 'english';

  // Type "abc"
  simulateInput('abc');

  // Should be in output
  const output = document.getElementById('output-buffer').value;
  assert.strictEqual(output, 'abc');

  // Input should be cleared
  const input = document.getElementById('input-box').value;
  assert.strictEqual(input, '');
});

// Test: Return to Chinese mode
test('3.3: Shift returns to Chinese mode', () => {
  languageMode = 'english';

  // Press Shift again
  simulateKeyPress('Shift');

  // Verify mode switched back
  assert.strictEqual(languageMode, 'chinese');

  // Verify indicator hidden
  const indicator = document.getElementById('language-mode-indicator');
  assert.ok(indicator.classList.contains('hidden'));
});
```

---

## Summary

**Critical Issues**:
1. ❌ Single-code in sentence mode broken (user stuck)
2. ✅ Delete key (likely already fixed, need verification)
3. 📋 English mode (feature request, design complete)

**Estimated Time**:
- Issue 1: 1 hour (fix + tests)
- Issue 2: 5 min (verification)
- Issue 3: 2 hours (implementation + tests)
- **Total**: 3-4 hours

**Priority**:
1. Issue 1 (CRITICAL - blocks usage)
2. Issue 2 (Verification)
3. Issue 3 (Feature enhancement)

---

**Next Steps**:
1. Verify Issue 2 in browser
2. Implement Issue 1 fix with TDD
3. Test thoroughly
4. Implement Issue 3 with TDD
5. Commit and push

---

**End of Analysis**
