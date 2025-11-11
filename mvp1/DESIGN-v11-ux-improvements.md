# Design Document: MVP 1.0 v11 UX Improvements

**Version**: 1.0
**Date**: 2025-11-11
**Status**: Design Phase
**Author**: Claude (AI Assistant)

---

## Executive Summary

This document outlines critical UX improvements for MVP 1.0 v11 based on user feedback. The issues affect both desktop and mobile users and require careful fixes to maintain backward compatibility while improving the user experience.

---

## Issues Identified

### Issue 1: Terminology - 智能 → 智慧 (Taiwan Localization)

**Problem**: Using "智能" (Mainland China term) instead of "智慧" (Taiwan term)
**Impact**: Language inconsistency for Taiwan users
**Severity**: Low (cosmetic)
**Scope**: UI text, documentation, comments

**Files Affected**:
- mvp1/index.html
- mvp1/core_logic_v11.js
- mvp1/core_logic_v11_ui.js
- mvp1/TEST-PLAN-v11-ui.md
- mvp1/DESIGN-v11.md
- Documentation files

**Fix**: Global search-and-replace "智能" → "智慧"

---

### Issue 2: Sentence Mode Duplication Bug

**Problem**: User reports "dj ev" produces "天明天" instead of "明天"
**Impact**: Critical - produces incorrect output
**Severity**: High (functional bug)

**Current Behavior**:
```
Input: dj ev
Buffer: ["dj", "ev"]
Live Preview: Shows "明 天" (correct)
After Space: Output shows "天明天" (WRONG - duplication + wrong order!)
```

**Expected Behavior**:
```
Input: dj ev
Buffer: ["dj", "ev"]
Live Preview: Shows "明 天"
After Space: Output shows "明天" (correct)
```

**Hypothesis - Possible Causes**:

1. **Live Preview Character Leakage**:
   - Live preview might be appending to output buffer before prediction
   - Check: Does live preview directly modify output-buffer?

2. **Character Mode Handler Conflict**:
   - When typing "dj ev", character mode handler might be executing alongside sentence mode
   - Check: Are both handlers active simultaneously?

3. **Viterbi Result Duplication**:
   - Viterbi algorithm might be returning duplicate characters
   - Check: What does `predictSentenceFromBuffer()` actually return?

4. **Auto-Select Interference**:
   - Auto-select (3rd char trigger) might be executing when it shouldn't
   - Check: Is auto-select disabled in sentence mode?

**Investigation Steps**:
1. Add debug logging to trace execution flow
2. Test with known inputs: "dj" (明), "ev" (天)
3. Check if character mode handlers are firing in sentence mode
4. Verify Viterbi output before appending to buffer

---

### Issue 3: Single-Code UX Problem

**Problem**: Desktop - Single code + Space should select character, not trigger prediction
**Impact**: High - breaks existing workflow
**Severity**: High (UX regression)

**Current Behavior**:
```
Desktop:
1. User types "v" (大)
2. Sees candidates: 1. 大 Space
3. Presses Space → Nothing happens (buffer empty, prediction fails)
4. Cannot select "大"

Expected:
1. User types "v" (大)
2. Sees candidates: 1. 大 Space
3. Presses Space → "大" appended to output (character mode selection)
```

**Mobile Issue**:
```
Mobile:
1. User types "v" (大)
2. Sees candidates
3. Cannot press Space (virtual keyboard doesn't send Space key)
4. User types "m," (for 家)
5. Buffer now has ["v", "m,"] but prediction fails
```

**Root Cause**: Sentence mode logic interferes with normal character selection

**Solution Design**:

**Option A: Mode-Aware Space Key Handling**
```javascript
if (key === ' ') {
  if (isSentenceMode() && codeBuffer.length > 0) {
    // Sentence mode with buffered codes → predict
    await triggerPrediction();
  } else {
    // Character mode OR empty buffer → select first candidate
    handleSelection(0); // Select 1st candidate
  }
}
```

**Option B: Explicit Mode Separation**
- Character mode: Space always selects
- Sentence mode: Space always predicts (requires Enter/click to finalize)
- Clear UI indication of mode

**Recommended**: Option A - More intuitive, maintains backward compatibility

---

### Issue 4: English Mixed Input Mode

**Problem**: No way to type English/numbers directly
**Impact**: Medium - workflow interruption
**Severity**: Medium (missing feature)

**Requirements**:
1. Press Shift → Enter English mode
2. Type English/numbers → Append directly to output buffer
3. Do NOT add to sentence prediction
4. Press Shift again → Return to Chinese input
5. Visual indicator of current mode

**Design**:

**State Management**:
```javascript
let languageMode = 'chinese'; // 'chinese' | 'english'
```

**Shift Key Handler**:
```javascript
if (key === 'Shift') {
  e.preventDefault();
  if (languageMode === 'chinese') {
    languageMode = 'english';
    showEnglishModeIndicator();
  } else {
    languageMode = 'chinese';
    hideEnglishModeIndicator();
  }
}
```

**Input Handler**:
```javascript
if (languageMode === 'english') {
  // Direct input to output buffer
  outputBuffer.value += inputBox.value;
  inputBox.value = '';
  return; // Skip Chinese logic
}
```

**UI Indicator**:
```html
<div id="language-mode-indicator" class="hidden">
  <span class="material-symbols-outlined">language</span>
  <span>English Mode (Press Shift to return)</span>
</div>
```

---

### Issue 5: Delete Key Behavior

**Problem**: Delete key should clear both output and prediction areas
**Impact**: Low - convenience feature
**Severity**: Low (enhancement)

**Current Behavior**:
```
Delete key: Clears output-buffer only
```

**Expected Behavior**:
```
Delete key:
1. Clear output-buffer
2. Clear candidate-area (prediction result)
3. Clear code buffer (if in sentence mode)
4. Show feedback toast
```

**Implementation**:
```javascript
if (key === 'Delete') {
  e.preventDefault();

  // Clear output buffer
  const outputBuffer = document.getElementById('output-buffer');
  if (outputBuffer) {
    outputBuffer.value = '';
  }

  // Clear candidate area
  const candidateArea = document.getElementById('candidate-area');
  if (candidateArea) {
    candidateArea.innerHTML = '<div class="...">已清除所有內容</div>';
  }

  // Clear sentence mode buffer
  if (isSentenceMode()) {
    clearCodeBuffer();
    updateBufferDisplay();
    updateLivePreviewDisplay();
  }

  // Show feedback
  showTemporaryFeedback('已清除所有區域');
}
```

---

## Implementation Plan

### Phase 1: Terminology Fix (15 min)
1. Global search "智能" in mvp1/
2. Replace with "智慧"
3. Verify UI text
4. Commit: "Localization: 智能 → 智慧 for Taiwan users"

### Phase 2: Debug Duplication Bug (1-2 hours)
1. Add detailed logging to:
   - `triggerPrediction()`
   - `predictSentenceFromBuffer()`
   - `viterbi()` function
   - Character mode handlers
2. Test with "dj ev" input
3. Identify root cause
4. Implement fix with TDD
5. Verify fix with 10+ test cases

### Phase 3: Single-Code UX Fix (1 hour)
1. Write TDD tests for Space key behavior
2. Implement mode-aware Space handling
3. Test on desktop and mobile
4. Update documentation

### Phase 4: English Mixed Input (2 hours)
1. Write TDD tests for language mode switching
2. Implement Shift key handler
3. Implement English input flow
4. Add UI indicator
5. Test toggling between modes

### Phase 5: Delete Key Enhancement (30 min)
1. Write TDD test for Delete key
2. Implement multi-area clearing
3. Test feedback messages
4. Update documentation

---

## Testing Strategy

### Unit Tests

**File**: `mvp1/test-node-v11-ux-improvements.js`

**Test Categories**:
1. **Terminology** (2 tests)
   - Verify no "智能" in UI strings
   - Verify "智慧" is used correctly

2. **Duplication Bug** (8 tests)
   - Test "dj ev" → "明天" (not "天明天")
   - Test single code → correct character
   - Test multiple codes → correct sentence
   - Verify no character mode interference
   - Verify live preview doesn't leak to output

3. **Single-Code UX** (6 tests)
   - Character mode + Space → select character
   - Sentence mode + empty buffer + Space → no action
   - Sentence mode + codes + Space → predict
   - Desktop vs mobile behavior

4. **English Mode** (10 tests)
   - Shift toggle works
   - English input goes to output
   - English doesn't affect code buffer
   - Return to Chinese mode works
   - Indicator visibility

5. **Delete Key** (5 tests)
   - Clears output buffer
   - Clears candidate area
   - Clears code buffer
   - Shows feedback
   - Works in both modes

**Total**: 31 new tests

### Manual Testing

**Test Scenarios**:
1. Type "dj ev" + Space → Verify "明天" appears once
2. Type "v" + Space → Verify "大" selected (not prediction)
3. Type "abc" in English mode → Verify direct output
4. Press Delete → Verify all areas cleared
5. Toggle modes multiple times → Verify state consistency

---

## Backward Compatibility

**Breaking Changes**: None

**Behavioral Changes**:
- Space key behavior in sentence mode (more intelligent)
- Delete key clears more areas (enhancement)
- New English mode (additive feature)

**Existing Tests**: All 75 existing tests should still pass

---

## Documentation Updates

**Files to Update**:
1. `mvp1/README.md` - Add new features
2. `mvp1/TEST-PLAN-v11-ui.md` - Add test cases
3. `memory-bank/activeContext.md` - Update status
4. `memory-bank/progress.md` - Track progress

---

## Success Criteria

### Must Have ✅
- [ ] All "智能" replaced with "智慧"
- [ ] "dj ev" produces "明天" (not "天明天")
- [ ] "v" + Space selects "大" in character mode
- [ ] Delete key clears all areas
- [ ] All 75 existing tests pass
- [ ] 31 new tests pass

### Should Have ✨
- [ ] English mode implemented
- [ ] Clear UI feedback for mode changes
- [ ] Mobile UX verified

### Nice to Have 🎁
- [ ] Comprehensive documentation
- [ ] User guide update
- [ ] Performance profiling

---

## Risk Assessment

**High Risk**:
- Duplication bug fix might break existing Viterbi logic
- Space key change might affect existing users

**Mitigation**:
- Comprehensive TDD before implementation
- Feature flags for gradual rollout
- Detailed logging for debugging

**Low Risk**:
- Terminology change (cosmetic only)
- Delete key enhancement (additive)
- English mode (new feature, no conflicts)

---

## Timeline

**Total Estimated**: 5-7 hours

| Phase | Time | Priority |
|-------|------|----------|
| Phase 1: Terminology | 15 min | P0 |
| Phase 2: Duplication | 2 hrs | P0 |
| Phase 3: Single-Code UX | 1 hr | P0 |
| Phase 4: English Mode | 2 hrs | P1 |
| Phase 5: Delete Key | 30 min | P2 |
| Testing | 1 hr | P0 |

**Recommended Order**: 1 → 2 → 3 → 5 → 4 (by priority and dependency)

---

## Notes

- User feedback suggests these are real pain points
- Fixes should be conservative to avoid regressions
- TDD approach mandatory for all behavioral changes
- Mobile testing critical (different input behavior)

---

**End of Design Document**
