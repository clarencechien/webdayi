# Mobile UX Improvements - Design Document

**Date**: 2025-11-11
**Version**: 11.2.0 Build 007
**Status**: Design & Implementation

---

## 🎯 User Feedback (Chinese)

> 1. mobile 版整句模式已經可以使用 空格 請先移除"緩衝編碼" 按鈕
> 2. 請套用相同的邏輯在逐字模式中 讓mobile版可以用空格當作space 選第一個字
> 3. 請重新考慮mobile 的ux 因為虛擬鍵盤就會佔畫面的一半 如果在整句模式 還要拉上拉下 請讓mobile 與laptop版都有更好的ux 讓輸入的介面更為順暢

**Translation**:
1. Mobile sentence mode Space key now works - please remove "Buffer Code" button
2. Apply same logic to character mode - let mobile use Space to select first candidate
3. Reconsider mobile UX - virtual keyboard takes half the screen, sentence mode requires scrolling up/down, improve flow for both mobile and laptop

---

## 🔍 Problem Analysis

### Problem 1: Redundant Space Button ✅ SIMPLE

**Current State**:
- Layer 2 (input event handler) successfully handles mobile Space key
- Layer 3 (Space button UI) is now redundant
- Button adds visual clutter

**Solution**: Remove the Space buffer button

---

### Problem 2: Character Mode Space Selection on Mobile ⚠️ CRITICAL

**Current State**:
- Character mode Space selection only works via keydown handler
- Mobile virtual keyboards don't reliably trigger keydown
- User types "v" → taps Space → sees "v " (invalid code) instead of selecting "大"

**Current Code** (core_logic.js:1561-1567):
```javascript
// Character mode: Select first candidate (unchanged)
if (currentCode && currentCandidates.length > 0) {
  handleSelection(0);  // Select first candidate
  previousValue = '';  // Reset after selection
}
return;
```

**Issue**: This only runs in keydown handler, not in input event handler

**Solution**:
Add character mode space detection in input event handler
- Check if in character mode
- Detect space at end of input
- Look up candidates for code (without space)
- Auto-select first candidate
- Clear input and append to output

---

### Problem 3: Mobile Virtual Keyboard UX 🚀 MAJOR REDESIGN

**Current Problem**:

When virtual keyboard appears (takes 50% of screen):

```
┌─────────────────────────────┐
│ 控制面板 (top)              │
│ 輸出緩衝區                  │  ← User can't see this
│ [整句模式面板]              │  ← User can't see this
│   - 預覽                    │
│   - 緩衝編碼                │
│   - 預測按鈕                │
├─────────────────────────────┤
│ 輸入框 (input-box)          │  ← Visible (just above keyboard)
│ 候選字 (candidates)         │  ← Visible
├─────────────────────────────┤
│                             │
│   VIRTUAL KEYBOARD          │  ← Takes 50% of screen
│                             │
└─────────────────────────────┘
```

**User Flow Issues**:
1. Type code → see candidates ✅
2. Want to see sentence preview → **must scroll up** ❌
3. Want to see output → **must scroll up more** ❌
4. Want to continue typing → **must scroll down** ❌
5. Constant scrolling interrupts flow

**Root Cause**: Information hierarchy doesn't match mobile constraints

---

## 💡 Solution Design

### Solution 1: Remove Space Button ✅

**Implementation**:
- Remove from index.html (line ~356-360)
- Remove from core_logic_v11_ui.js (lines ~44, 487-523)
- Update updateModeUI to remove button state logic

**Impact**: Cleaner UI, no functionality loss

---

### Solution 2: Character Mode Space Selection (Input Event) 🔧

**Implementation Strategy**:

Add to existing input event handler in core_logic.js:

```javascript
// Mobile space key fix: Handle space insertion via input event
inputBox.addEventListener('input', (e) => {
  // Skip if already handled by keydown
  if (spaceHandledByKeydown) return;

  const value = inputBox.value;

  // Check if space was inserted at the end
  if (value.endsWith(' ')) {
    const isInSentenceMode = (typeof isSentenceMode === 'function' && isSentenceMode());

    if (isInSentenceMode) {
      // Existing sentence mode logic...
    } else {
      // NEW: Character mode space selection
      const codeWithoutSpace = value.trim();

      if (codeWithoutSpace.length > 0) {
        // Look up candidates
        const candidates = dayiMap.get(codeWithoutSpace);

        if (candidates && candidates.length > 0) {
          // Select first candidate (same as Space key)
          // This calls handleSelection(0)
          currentCode = codeWithoutSpace;
          currentCandidates = candidates;
          handleSelection(0);

          // Clear input
          inputBox.value = '';

          console.log('[Mobile Space] Character mode: selected first candidate');
        } else {
          // Invalid code, leave space in to show error
          console.warn('[Mobile Space] Invalid code:', codeWithoutSpace);
        }
      } else {
        // Just remove the space
        inputBox.value = '';
      }
    }
  }
});
```

**Testing**:
- Mobile: "v" + Space → Should select "大"
- Desktop: No regression (keydown still works)
- Sentence mode: No interference with buffering

---

### Solution 3: Mobile UX Redesign - Compact Layout 🚀

#### Design Principles

1. **Minimize Scrolling**: Keep active elements visible
2. **Visual Hierarchy**: Prioritize by interaction frequency
3. **Compact but Readable**: Reduce padding, maintain tap targets
4. **Progressive Disclosure**: Show only relevant information

#### Layout Comparison

**Desktop Layout** (Current - Keep):
```
┌──────────────────────────────────┐
│ Control Panel (fixed top)        │
├──────────────────────────────────┤
│ Output Buffer (result)           │
│ (Large, prominent)               │
├──────────────────────────────────┤
│ [Sentence Mode Panel]            │
│   Preview: 易在大                │
│   Buffer: [v] [ad] [4jp]         │
│   [Confirm Prediction]           │
├──────────────────────────────────┤
│ Input Box                        │
├──────────────────────────────────┤
│ Candidates                       │
└──────────────────────────────────┘
```

**Mobile Layout** (NEW - Compact):
```
┌──────────────────────────────────┐
│ Output Buffer (compact, scroll)  │ ← Scrollable, less emphasis
├──────────────────────────────────┤
│ Input Box                        │ ← Fixed above keyboard
├──────────────────────────────────┤
│ Candidates                       │ ← Immediately visible
├──────────────────────────────────┤
│ [Sentence Mode Panel - Inline]  │ ← Compact, right below candidates
│  緩衝: [v] [ad]  預覽: 易在      │
│  [= 確認]                        │ ← Single line when possible
├──────────────────────────────────┤
│                                  │
│    VIRTUAL KEYBOARD              │
│                                  │
└──────────────────────────────────┘
```

**Key Changes**:
1. **Reorder sections** on mobile: Output → Input → Candidates → Sentence Panel
2. **Compact sentence panel**: Horizontal layout, smaller text, inline elements
3. **Reduce spacing**: Less padding/margin on mobile
4. **Sticky input**: Input box stays above keyboard
5. **Output less prominent**: Still accessible via scroll, but not primary focus

#### CSS Implementation Strategy

Use Tailwind responsive classes:

```html
<!-- Desktop: Normal order -->
<div class="hidden sm:block">
  <div id="output-buffer-section">...</div>
  <div id="sentence-mode-panel">...</div>
  <div id="input-section">...</div>
  <div id="candidate-area">...</div>
</div>

<!-- Mobile: Compact order -->
<div class="block sm:hidden">
  <div id="output-buffer-section-mobile" class="max-h-32 overflow-y-auto">...</div>
  <div id="input-section-mobile">...</div>
  <div id="candidate-area-mobile">...</div>
  <div id="sentence-mode-panel-mobile" class="compact">...</div>
</div>
```

**OR** use CSS flexbox order:

```css
@media (max-width: 640px) {
  .mobile-container {
    display: flex;
    flex-direction: column;
  }

  #output-buffer-section { order: 1; max-height: 8rem; } /* Compact */
  #input-section { order: 2; } /* Fixed position */
  #candidate-area { order: 3; }
  #sentence-mode-panel { order: 4; } /* Move below candidates */
}
```

**Compact Sentence Panel** (Mobile):
```html
<!-- Desktop: Vertical, spacious -->
<div class="hidden sm:block space-y-4 p-6">
  <div class="text-lg">即時預覽</div>
  <div class="text-2xl">易在大</div>
  <div class="space-y-2">緩衝的編碼</div>
  <div class="flex gap-2">[v] [ad] [4jp]</div>
  <button class="w-full py-3">確認預測</button>
</div>

<!-- Mobile: Horizontal, compact -->
<div class="block sm:hidden p-2 text-sm">
  <div class="flex items-center gap-2 mb-1">
    <span class="text-slate-500">緩衝:</span>
    <div class="flex gap-1">[v] [ad]</div>
    <span class="text-slate-500">預覽:</span>
    <span class="font-bold">易在</span>
  </div>
  <button class="w-full py-2 text-sm">= 確認預測</button>
</div>
```

---

## 📋 Implementation Plan

### Phase 1: Remove Space Button ✅
1. Remove button HTML from index.html
2. Remove button handler from core_logic_v11_ui.js
3. Clean up button state management

### Phase 2: Character Mode Space Selection 🔧
1. Add character mode logic to input event handler
2. Handle space detection and candidate lookup
3. Call handleSelection(0) for first candidate
4. Add diagnostic logging

### Phase 3: Mobile UX Redesign 🚀
1. **Option A**: Use CSS `order` property (simpler)
   - Keep single HTML structure
   - Reorder via CSS on mobile

2. **Option B**: Duplicate sections with responsive classes
   - More control over mobile layout
   - Can customize content per viewport

**Recommended**: Option A (CSS order) for maintainability

**Steps**:
1. Add mobile-specific CSS classes
2. Reorder sections on mobile (output → input → candidates → sentence panel)
3. Compact sentence panel styling
4. Reduce padding/spacing on mobile
5. Test on actual mobile device

### Phase 4: TDD Testing 🧪
1. Character mode space selection tests
2. Mobile layout tests (visual verification)
3. Integration tests (desktop + mobile)

---

## 🎯 Success Criteria

### Functionality
- ✅ Mobile Space key works in sentence mode (already working)
- ✅ Mobile Space key works in character mode (NEW)
- ✅ Desktop Space key has no regression
- ✅ Space button removed (cleaner UI)

### Mobile UX
- ✅ Input box visible above virtual keyboard
- ✅ Candidates immediately visible
- ✅ Sentence panel visible without scrolling
- ✅ Output accessible via minimal scroll
- ✅ No constant up/down scrolling required

### Testing
- ✅ 20+ new tests passing
- ✅ No regression in existing tests
- ✅ Visual verification on mobile device

---

## 📱 Testing Plan

### Manual Testing

**Mobile (iOS/Android)**:
1. Character mode: "v" + Space → Should select "大"
2. Sentence mode: "v" + Space → Should buffer "v"
3. Layout: All sections visible without scrolling (except output on demand)
4. No button clutter

**Desktop**:
1. Space key still works (no regression)
2. Layout unchanged
3. All functionality preserved

---

## 🚀 Next Steps

1. ✅ Complete this design document
2. ⏳ Implement Phase 1 (Remove button)
3. ⏳ Implement Phase 2 (Character mode Space)
4. ⏳ Implement Phase 3 (Mobile UX redesign)
5. ⏳ Write TDD tests
6. ⏳ Update memory bank
7. ⏳ Update README
8. ⏳ Test on mobile device (user verification)

---

## 📝 Notes

- CSS `order` property is well-supported (IE11+, all modern browsers)
- Tailwind classes handle responsive breakpoints automatically
- Consider adding "compact mode" toggle for advanced users
- Future: Floating action button (FAB) for mode switching on mobile

---

## 🔗 References

- Original mobile Space fix: Commit 7ddc269
- Event handler order fix: Commit e37cdd0
- Buffer display fix: Commit caef860
- MOBILE-SPACE-KEY-FIX.md (three-layer solution)
