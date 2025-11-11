# Mobile Space Key Fix

**Issue**: Mobile virtual keyboards don't properly trigger Space key handler in sentence mode

**Date**: 2025-11-11
**Version**: 11.2.0 Build 006
**Status**: In Progress

---

## Problem Analysis

### Issue Description

**User Report** (Chinese):
> 手機版在整句mode下，v + 空格，會是無效編碼。應該是空格無法被視為 space

**Translation**: On mobile, in sentence mode, "v + space" shows "Invalid code". The space key is not being recognized as Space.

### Root Cause

Mobile virtual keyboards behave differently from physical keyboards:

**Desktop Flow** (✅ Works):
```
User presses Space → keydown event fires → key === ' ' →
preventDefault() → Get "v" → addToCodeBuffer("v") → clearInputBox()
```

**Mobile Flow** (❌ Broken):
```
User taps virtual Space → Space character inserted → "v " →
keydown might not fire or fires too late → preventDefault() fails →
Input = "v " → Treated as invalid code
```

### Technical Details

1. **Event Timing**: Virtual keyboards may insert the space character before/after the `keydown` event
2. **Event Availability**: Some virtual keyboards don't fire standard `keydown` events
3. **Character Insertion**: Space is directly inserted into the input field before handler can prevent it

### Current Implementation

File: `mvp1/core_logic.js:1509-1558`

```javascript
// Handle Space key
if (key === ' ') {
  e.preventDefault();  // ❌ Fails on mobile virtual keyboard

  if (isInSentenceMode) {
    const inputValue = inputBox.value.trim();
    if (inputValue.length > 0) {
      if (addToCodeBuffer(inputValue, dayiMap)) {
        clearInputBox();
        updateBufferDisplay();
      }
    }
  }
}
```

---

## Solution Design

### Multi-Layer Approach (Hybrid)

**Layer 1**: Keep `keydown` Space handler (for desktop) ✅ Already working
**Layer 2**: Add `input` event handler (for mobile virtual keyboards) 🆕
**Layer 3**: Add Space button (100% reliable fallback) 🆕

### Layer 2: Input Event Handler

Monitor the `input` event and detect space character insertion:

```javascript
let spaceHandledByKeydown = false;

// In keydown handler
if (key === ' ') {
  spaceHandledByKeydown = true;
  // ... existing logic ...
  setTimeout(() => spaceHandledByKeydown = false, 100);
}

// New input handler for mobile space detection
inputBox.addEventListener('input', (e) => {
  // Skip if already handled by keydown (desktop)
  if (spaceHandledByKeydown) return;

  // Only for sentence mode
  if (!isInSentenceMode) return;

  const value = inputBox.value;

  // Check if space was inserted at the end
  if (value.endsWith(' ')) {
    const codeWithoutSpace = value.trim();

    if (codeWithoutSpace.length > 0) {
      // Valid code, add to buffer
      if (addToCodeBuffer(codeWithoutSpace, dayiMap)) {
        clearInputBox();
        updateBufferDisplay();
        updateLivePreviewDisplay();
        console.log('[Mobile Space] Code buffered:', codeWithoutSpace);
      }
    } else {
      // Just remove the space
      inputBox.value = codeWithoutSpace;
    }
  }
});
```

**Advantages**:
- ✅ Captures all input changes (including virtual keyboards)
- ✅ Not dependent on `keydown` events
- ✅ Handles various input methods

**De-duplication**:
- Use `spaceHandledByKeydown` flag
- Set to `true` when keydown handles space
- Reset after 100ms
- `input` handler checks flag and skips if true

### Layer 3: Space Button UI

Add a visual button for space action (backup method):

**Location**: Next to "確認預測" button in sentence mode

```html
<!-- Space Buffer Button (for mobile - replaces Space key) -->
<button id="space-buffer-btn"
        class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg
               bg-gradient-to-r from-cyan-500 to-blue-500
               hover:from-cyan-600 hover:to-blue-600
               text-white font-semibold text-sm transition-all
               shadow-md hover:shadow-lg active:scale-98
               disabled:opacity-50 disabled:cursor-not-allowed">
  <span class="material-symbols-outlined text-lg">space_bar</span>
  <span>緩衝 (Space)</span>
</button>
```

**Behavior**:
- Only visible in sentence mode
- Click to buffer current input code
- Provides 100% reliable space action
- Good for users who have trouble with virtual keyboard

---

## Implementation Plan

### Phase 1: Input Event Handler (Primary Fix)

1. ✅ Add `spaceHandledByKeydown` flag
2. ✅ Update keydown Space handler to set flag
3. ✅ Add input event listener with space detection
4. ✅ Handle code buffering logic
5. ✅ Add de-duplication check

**Files to Modify**:
- `mvp1/core_logic.js` (add input event handler)

### Phase 2: Space Button UI (Fallback)

1. ✅ Add Space button HTML in index.html
2. ✅ Add button styling (Tailwind CSS)
3. ✅ Add click event handler in core_logic_v11_ui.js
4. ✅ Show/hide based on input mode
5. ✅ Disable when input is empty

**Files to Modify**:
- `mvp1/index.html` (add button)
- `mvp1/core_logic_v11_ui.js` (add event handler)

### Phase 3: TDD Testing

**Test Cases**:
1. ✅ Mobile input + space → Code buffered correctly
2. ✅ Desktop keydown + space → Code buffered (no duplication)
3. ✅ Space button click → Code buffered
4. ✅ Empty input + space → Space removed, no buffer
5. ✅ Invalid code + space → No buffer, error shown
6. ✅ Multiple spaces → Only first triggers buffer

**Test File**: `mvp1/test-mobile-space-fix.js`

---

## Testing Strategy

### Manual Testing (Mobile)

1. Open https://clarencechien.github.io/webdayi/mvp1/ on mobile
2. Switch to 整句模式 (Sentence Mode)
3. Type "v"
4. Tap space key on virtual keyboard
5. **Expected**: "v" added to buffer, input cleared, badge shows "v"
6. **Previously**: "v " shown as invalid code

### Automated Testing

Create test file with these scenarios:

```javascript
// Test 1: Mobile space insertion
test('Mobile: Space character inserted via input event', () => {
  // Simulate mobile space insertion
  inputBox.value = 'v ';
  inputBox.dispatchEvent(new Event('input'));

  assert(getCodeBuffer().includes('v'));
  assert(inputBox.value === '');
});

// Test 2: Desktop space keydown
test('Desktop: Space via keydown (no duplication)', () => {
  inputBox.value = 'v';
  const event = new KeyboardEvent('keydown', { key: ' ' });
  inputBox.dispatchEvent(event);

  // Should buffer once
  assert(getCodeBuffer().length === 1);
  assert(getCodeBuffer()[0] === 'v');
});

// Test 3: Space button click
test('Space button: Click to buffer', () => {
  inputBox.value = 'v';
  const btn = document.getElementById('space-buffer-btn');
  btn.click();

  assert(getCodeBuffer().includes('v'));
  assert(inputBox.value === '');
});
```

---

## Success Criteria

**Primary Goal**: Mobile users can use Space key to buffer codes in sentence mode

**Metrics**:
- ✅ Space character detection: 100% on mobile
- ✅ No duplicate buffering: 0 duplicates on desktop
- ✅ Button reliability: 100% on all devices
- ✅ Test coverage: All 6 test cases passing

**User Experience**:
- Mobile: "v + space" → Buffer "v" ✅ (instead of "Invalid code" ❌)
- Desktop: No change in behavior ✅
- Fallback: Button always works ✅

---

## Notes

- The `input` event fires after the input value has changed
- The `keydown` event fires before the input value changes
- De-duplication is critical to avoid double-buffering on desktop
- Button provides consistent UX across all devices and input methods

---

## References

- Issue: Space key on mobile not working in sentence mode
- Related: Event handler execution order fix (Commit e37cdd0)
- Related: Buffer display fix (Commit caef860)
