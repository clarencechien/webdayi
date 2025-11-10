# MVP1 v10: Bugfix - Delete Key + Auto-Copy Feedback

**Date**: 2025-11-10
**Version**: MVP1 v10 (Bugfix)
**Status**: Design Phase

---

## Problems Identified

### Bug 1: Missing Delete Key Functionality
**Current State:**
- User can click "Clear" button to clear output buffer
- Backspace key deletes last character from output when input is empty
- No keyboard Delete key support for clearing entire output buffer

**User Request:**
> "加入delete鍵 可以清除output區文字"
> (Add Delete key to clear output area text)

**Expected Behavior:**
- Press Delete key → Clear entire output buffer
- Show feedback: "已清除" (Cleared)
- Works similar to Clear button, but via keyboard

### Bug 2: Auto-Copy Shows Wrong Feedback Message
**Current State:**
- Auto-copy shows "已清除" (Cleared) instead of copy confirmation
- Happens when user triggers auto-copy after using Clear button

**User Report:**
> "當自動複制時 提示訊息是'已清除' 檢查一下 是不是亂掉了"
> (When auto-copy triggers, feedback shows "已清除" - check if it's broken)

**Root Cause Analysis:**

1. **HTML Structure** (index.html:174-179):
```html
<div id="copy-toast" ...>
  <div class="flex items-center gap-2">
    <span class="material-symbols-outlined text-base">check_circle</span>
    <span>已複製到剪貼簿</span>
  </div>
</div>
```

2. **showTemporaryFeedback()** (core_logic.js:530-547):
```javascript
function showTemporaryFeedback(message) {
  const toast = document.getElementById('copy-toast');
  if (!toast) return;

  const originalText = toast.textContent;
  toast.textContent = message;  // ❌ Destroys HTML structure!
  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('show');
    toast.textContent = originalText;  // ❌ Restores plain text, not HTML!
  }, 2000);
}
```

**Problem:** Setting `toast.textContent = message` removes all inner HTML (icon + text structure), leaving only plain text "已清除".

3. **showCopyFeedback()** (core_logic.js:270-286):
```javascript
function showCopyFeedback() {
  const toast = document.getElementById('copy-toast');
  if (!toast) return;

  // Show toast (Tailwind CSS)
  toast.classList.remove('hidden');
  toast.classList.add('flex');

  // Hide after 2 seconds
  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('flex');
  }, 2000);
}
```

**Problem:** Doesn't update the text at all. Just shows whatever text is currently in the toast.

**Flow of Bug:**
1. User clicks Clear button
2. `showTemporaryFeedback('已清除')` sets toast content to plain text "已清除"
3. HTML structure is destroyed (icon removed)
4. Later, auto-copy triggers
5. `showCopyFeedback()` shows toast without changing text
6. User sees "已清除" instead of copy confirmation ❌

---

## Design Solutions

### Solution 1: Delete Key Functionality

**Keyboard Mapping:**
- **Delete key** → Clear entire output buffer (like Clear button)
- **Backspace key** → Delete last character (when input is empty) - keep existing behavior

**Implementation:**
Add Delete key handler in `initialize()` function (core_logic.js):

```javascript
// Handle Delete key for clearing output buffer
if (key === 'Delete') {
  e.preventDefault();
  const outputBuffer = document.getElementById('output-buffer');
  if (outputBuffer && outputBuffer.value) {
    outputBuffer.value = '';
    showTemporaryFeedback('已清除');
  }
  return;
}
```

### Solution 2: Fix Auto-Copy Feedback Message

**Strategy:** Fix `showTemporaryFeedback()` to preserve HTML structure

**New Implementation:**
```javascript
function showTemporaryFeedback(message) {
  if (typeof document === 'undefined') return;

  const toast = document.getElementById('copy-toast');
  if (!toast) return;

  // Find the text span (second span element)
  const textSpan = toast.querySelector('div > span:last-child');
  if (!textSpan) {
    // Fallback: if structure doesn't exist, use plain text
    const originalText = toast.textContent;
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('flex');

    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('flex');
      toast.textContent = originalText;
    }, 2000);
    return;
  }

  // Update only the text span, preserving HTML structure
  const originalText = textSpan.textContent;
  textSpan.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('flex');

  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('flex');
    textSpan.textContent = originalText;  // Restore original text
  }, 2000);
}
```

**Alternative (Simpler):** Keep auto-copy with default "已複製到剪貼簿" message by not modifying it:

```javascript
// Just ensure showCopyFeedback() doesn't mess with the text
// Let the HTML default text show through
```

But this doesn't allow customization. Better to fix `showTemporaryFeedback()`.

---

## Technical Implementation Plan

### Phase 1: Write Tests (TDD)

**File:** `mvp1/test-node-v10-bugfix.js`

**Test Categories:**

1. **Delete Key Tests** (5 tests)
   - ✓ Delete key clears output buffer when output has content
   - ✓ Delete key does nothing when output is empty
   - ✓ Delete key shows "已清除" feedback
   - ✓ Delete key works independently of input buffer state
   - ✓ Delete key doesn't affect input buffer

2. **Auto-Copy Feedback Tests** (8 tests)
   - ✓ showTemporaryFeedback() preserves HTML structure
   - ✓ showTemporaryFeedback() updates only text span
   - ✓ showTemporaryFeedback() restores original text
   - ✓ Auto-copy shows correct feedback (not "已清除")
   - ✓ Clear button shows "已清除" feedback
   - ✓ Font size change shows font size feedback
   - ✓ Toast icon remains visible after showTemporaryFeedback()
   - ✓ Multiple rapid feedback calls don't break structure

**Total:** 13 tests

### Phase 2: Implement Fixes

**Changes Required:**

1. **core_logic.js**
   - Fix `showTemporaryFeedback()` to preserve HTML structure
   - Add Delete key handler in `initialize()` function
   - Ensure all feedback calls work correctly

**No HTML changes needed** - The structure is already correct.

### Phase 3: Update Documentation

**Files to Update:**
- `memory-bank/activeContext.md` - Add v10 bugfix section
- `README.md` - Update if needed
- `README.en.md` - Update if needed

---

## Feature Specifications

### F-10-BF.1: Delete Key Functionality

**Location:** `initialize()` function in core_logic.js

**Code:**
```javascript
// In inputBox.addEventListener('keydown', (e) => { ... })

// Handle Delete key for clearing output buffer
if (key === 'Delete') {
  e.preventDefault();
  const outputBuffer = document.getElementById('output-buffer');
  if (outputBuffer && outputBuffer.value) {
    outputBuffer.value = '';
    showTemporaryFeedback('已清除');
  }
  return;
}
```

### F-10-BF.2: Fixed Auto-Copy Feedback

**Location:** `showTemporaryFeedback()` function in core_logic.js

**Key Changes:**
- Use `querySelector('div > span:last-child')` to find text span
- Update only `textSpan.textContent`, not `toast.textContent`
- Preserve HTML structure (icon + text)
- Properly restore original text

---

## Success Criteria

### Must Have (P0):
- ✅ Delete key clears output buffer
- ✅ Delete key shows correct feedback
- ✅ Auto-copy shows correct feedback (not "已清除")
- ✅ Clear button still works correctly
- ✅ All 13 new tests pass
- ✅ All 91 existing tests still pass (no regression)

### Should Have (P1):
- ✅ Toast icon visible for all feedback messages
- ✅ HTML structure preserved across all feedback calls
- ✅ Feedback timing consistent (2 seconds)

---

## Testing Strategy

### Manual Testing Checklist:

**Delete Key:**
- [ ] Type some characters, press Delete → output clears
- [ ] Press Delete when output is empty → nothing happens
- [ ] Check feedback message shows "已清除"

**Auto-Copy Feedback:**
- [ ] Enable auto-copy
- [ ] Click Clear button → see "已清除" feedback
- [ ] Select a candidate → see auto-copy feedback (NOT "已清除")
- [ ] Check that icon remains visible in all feedback messages

**Regression Testing:**
- [ ] All 91 existing tests pass
- [ ] Clear button still works
- [ ] Font size feedback still works
- [ ] Dark mode feedback still works

---

## Version Information

- **Previous Version:** v10 (Mobile UX + Font Control + Inline Hints)
- **Target Version:** v10 (Bugfix)
- **Estimated Completion:** ~1 hour
- **Test Count:** 13 new tests (104 total: 91 existing + 13 new)

---

## Expected User Experience

### Delete Key Flow:
```
User types: "ai"
Selects: 保
Output buffer: "保"

User presses Delete key
→ Output buffer: "" (cleared)
→ Toast shows: "已清除" (with icon)
```

### Auto-Copy Flow (Fixed):
```
User types: "ai"
Selects: 保
Output buffer: "保"

Auto-copy triggers
→ Clipboard: "保"
→ Toast shows: "已複製到剪貼簿" (with icon) ✅

NOT: "已清除" ❌
```

### Clear Button Flow (Unchanged):
```
User clicks Clear button
→ Output buffer: "" (cleared)
→ Toast shows: "已清除" (with icon)
```

---

## Notes

- This is a **pure bugfix** with no new features
- No breaking changes
- No HTML modifications needed
- Improves UX consistency and correctness
