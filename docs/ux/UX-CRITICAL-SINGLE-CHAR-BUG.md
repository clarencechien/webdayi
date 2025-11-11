# CRITICAL BUG: Single-Char Selection in Sentence Mode

**Date**: 2025-11-11
**Status**: 🔥 CRITICAL - Blocking user workflow
**Reporter**: User feedback in Traditional Chinese

---

## User Report (Original)

> "在整句模式下 打單碼 v + space 沒有出現任何反應 也不會有候選字 這樣無法使用"

**Translation**: "In sentence mode, typing single code 'v' + Space has no response and no candidates appear - cannot use this way"

## Follow-up Report (After Initial Fix)

> "仍然無法使用 在單碼 v後 的確跳出候選字 但按下space 無法選字 點擊也無法選字"

**Translation**: "Still cannot use. After single code 'v', candidates DO appear, but pressing Space cannot select, clicking also cannot select"

---

## Root Cause Analysis

### Initial Diagnosis (Partially Correct)
We correctly identified that the sentence mode input handler (core_logic_v11_ui.js) was only processing 2-char codes, causing single-char to fall through.

**Fix Applied**: Added single-char handling in core_logic_v11_ui.js:410-438

**Result**: ✅ Candidates now appear for single-char input
**BUT**: ❌ Selection still doesn't work (Space + Click)

### Deeper Root Cause (The Real Problem)

**File**: `mvp1/core_logic_v11_ui.js` (lines 410-438)

The single-char handler calls:
```javascript
if (typeof updateCandidateArea === 'function') {
  updateCandidateArea(withUserPreference, 0);
}
```

This renders the candidates UI, BUT it **DOES NOT** set the required global state variables:
- `currentCode` - Required by `handleSelection()`
- `currentCandidates` - Required by `handleSelection()`

**File**: `mvp1/core_logic.js` (line 1227)

The `handleSelection()` function has this guard:
```javascript
function handleSelection(index) {
  if (!currentCode || currentCandidates.length === 0) return;
  // ... selection logic
}
```

Since `currentCode` is empty string and `currentCandidates` is empty array, the function **immediately returns** without doing anything!

### Why Clicking Also Doesn't Work

The click handlers call `handleSelection(index)`, which has the same guard condition. So clicking has the exact same problem as Space key.

---

## Impact

### Severity: 🔥 CRITICAL
- **Blocking**: Users cannot use single-char input in sentence mode at all
- **Frequency**: Every single-char input attempt (common codes: v, a, t, etc.)
- **Workaround**: Switch to character mode (but defeats purpose of sentence mode)

### Affected Functionality
1. ❌ Space key selection (most common method)
2. ❌ Click selection (touch-friendly method)
3. ❌ Number key selection (' [ ] - \) - all call handleSelection()
4. ❌ Any selection method in sentence mode with single-char input

---

## Solution Design

### Approach 1: Set Global State in v11 UI Handler ✅ RECOMMENDED

**Location**: `mvp1/core_logic_v11_ui.js` (after line 424)

**Add**:
```javascript
// Set global state for selection to work
currentCode = value;  // "v"
currentCandidates = withUserPreference;  // [{char: "大", freq: 9988}, ...]
currentPage = 0;  // Reset pagination
```

**Pros**:
- Minimal change (3 lines)
- Reuses existing selection infrastructure
- Works with Space, Click, and all selection keys
- Consistent with character mode behavior

**Cons**:
- Relies on global state (but this is existing architecture)
- Need to ensure these globals are accessible

### Approach 2: Dedicated Handler in v11 UI (NOT RECOMMENDED)

**Location**: `mvp1/core_logic_v11_ui.js`

**Add**: Separate Space/Click handlers specifically for single-char in sentence mode

**Pros**:
- Self-contained in v11 UI module

**Cons**:
- Code duplication
- Need to replicate all selection logic
- More complex to maintain
- Still need to handle user model, auto-copy, etc.

---

## Implementation Plan

### Step 1: TDD Tests ✅

**File**: `mvp1/test-single-char-sentence-mode.js`

**Test Categories**:
1. Global State Tests (5 tests)
   - currentCode should be set to single-char value
   - currentCandidates should be set to sorted candidates
   - currentPage should be reset to 0
   - State should persist until next input
   - State should clear on selection

2. Space Key Selection Tests (4 tests)
   - Space after single-char should call handleSelection(0)
   - Should append first candidate to output
   - Should clear input box
   - Should trigger auto-copy if enabled

3. Click Selection Tests (3 tests)
   - Clicking first candidate should select
   - Clicking second candidate should select
   - Click handlers should be attached

4. Number Key Selection Tests (3 tests)
   - ' key should select 2nd candidate
   - [ key should select 3rd candidate
   - All selection keys should work

5. Integration Tests (3 tests)
   - User model should be updated
   - Works with user preferences
   - Works with pagination (if >6 candidates)

**Total**: 18 comprehensive tests

### Step 2: Implementation

**File**: `mvp1/core_logic_v11_ui.js`

**After line 424**, add:
```javascript
// CRITICAL FIX: Set global state for selection to work
// Without this, handleSelection() returns immediately
currentCode = value;
currentCandidates = withUserPreference;
currentPage = 0;

console.log(`[v11 UI] Set currentCode="${value}", ${withUserPreference.length} candidates`);
```

### Step 3: Verification

**Manual Testing**:
1. Open index.html in browser
2. Switch to sentence mode
3. Type single char "v"
4. Verify candidates appear
5. Press Space → should select first candidate "大"
6. Type "v" again
7. Click on second candidate → should select
8. Type "a"
9. Press ' → should select second candidate "人"

**Automated Testing**:
```bash
node test-single-char-sentence-mode.js
# Expected: 18/18 tests passing
```

---

## Expected Outcomes

### After Fix

✅ **Space Key**: Selects first candidate in sentence mode
✅ **Click**: Selects clicked candidate in sentence mode
✅ **Number Keys**: Select respective candidates in sentence mode
✅ **User Model**: Updated with selections
✅ **Auto-Copy**: Triggers if enabled
✅ **Pagination**: Works if >6 candidates

### No Regressions

✅ **Character Mode**: Unchanged behavior
✅ **Sentence Mode 2-char**: Unchanged behavior (still buffers)
✅ **Sentence Mode Multi-char**: Unchanged behavior (prediction)

---

## Risk Assessment

### Risk Level: LOW (for fix)

**Reasoning**:
- Only affects single-char in sentence mode
- Change is minimal (3 lines)
- Reuses existing, well-tested infrastructure
- Global state is already part of architecture

### Testing Strategy

- TDD approach (tests first)
- 18 comprehensive tests
- Manual browser testing
- Regression testing (all 187+ existing tests)

---

## Success Criteria

1. ✅ All 18 new tests passing
2. ✅ All 187+ existing tests passing (no regression)
3. ✅ Manual verification: Space, Click, Number keys work
4. ✅ User model integration works
5. ✅ Auto-copy integration works

---

## Timeline

- **Analysis**: 30 min ✅ DONE
- **TDD Tests**: 45 min (18 tests)
- **Implementation**: 15 min (3 lines + logging)
- **Verification**: 30 min (manual + automated)
- **Documentation**: 30 min (memory bank update)
- **Total**: ~2.5 hours

---

## Related Issues

- **UX Round 2 - Issue 1**: Original report (candidates not appearing)
- **This Issue**: Follow-up (candidates appear, but selection doesn't work)

---

**END OF ANALYSIS**
