# MVP1 v10: Mobile UX Fixes + Font Size Control

**Date**: 2025-11-10
**Status**: Design Phase
**Related Issues**: Screenshot in `issue/Screenshot_20251110-153133.png`

---

## Problems Identified

### Bug 1: Control Buttons Overlap on Mobile (Android Web)
**Current State:**
- Fixed buttons in top-right corner (`fixed top-4 right-4`)
- Buttons: Dark/Light toggle, Focus mode, Auto-copy
- On mobile, these overlap visually with Output section's Copy/Clear buttons
- Space is too crowded on small screens

**Root Cause:**
- Fixed positioning doesn't account for content layout below
- No responsive behavior to collapse controls on mobile
- Three vertical buttons take up significant right-side real estate

### Bug 2: Missing Selection Key Hints
**Current State:**
- v9 redesign removed the selection key hints
- Users don't know which keys to press (Space/' /[/]/- /\)

**Previous State (v8):**
```html
<div class="candidate-header">
  候選字 (Candidates)
  <span class="hint">Press keys or click to select, = or buttons to page</span>
</div>
```

**Root Cause:**
- Tailwind redesign didn't preserve this UX element
- Information was in v8 but got lost in v9 refactor

### Bug 3: Inconsistent Font Sizes Across Devices
**Current State:**
- No font size control
- Text may appear too large on mobile or too small on desktop
- Different devices have different default font sizes

**User Need:**
- Want a +/- button to adjust font size
- Should be grouped with theme controls
- Should persist across sessions

---

## UX Design Solutions

### Solution 1: Responsive Control Panel

**Desktop (≥640px):**
- Keep fixed top-right buttons (current behavior)
- Add font size controls to the group

**Mobile (<640px):**
- Collapse all controls into a single floating action button (FAB)
- FAB opens a slide-in panel or modal with all controls
- Panel contains: Theme toggle, Focus mode, Auto-copy, Font size

**Implementation:**
```
┌─ Desktop ────────────────┐
│                    [🌙] │
│                    [🎯] │
│                    [📋] │
│                    [A-] │
│                    [A+] │
└──────────────────────────┘

┌─ Mobile ─────────────────┐
│                    [⚙️] │ ← Single FAB button
│                          │
│ (Tap opens panel) ──────┐│
│                   Panel ││
│                   [🌙]  ││
│                   [🎯]  ││
│                   [📋]  ││
│                   [A-]  ││
│                   [A+]  ││
│                   ──────┘│
└──────────────────────────┘
```

### Solution 2: Restore Selection Key Hints

**Location:** Below the "候選字 (Candidates)" label, above the candidate area

**Text (Bilingual):**
- Chinese: `按 Space/' /[/]/- /\ 選字 | 點擊選字 | = 翻頁`
- English: `Press Space/' /[/]/- /\ or click to select | = to page`

**Implementation:**
```html
<div class="space-y-2">
  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
    候選字 (Candidates)
  </label>
  <p class="text-xs text-slate-500 dark:text-slate-400">
    按 <kbd>Space</kbd><kbd>'</kbd><kbd>[</kbd><kbd>]</kbd><kbd>-</kbd><kbd>\</kbd> 選字 | 點擊選字 | <kbd>=</kbd> 翻頁
  </p>
  <div id="candidate-area" ...>
</div>
```

### Solution 3: Font Size Control

**Storage Key:** `webdayi_font_scale`
**Values:** `0.8`, `0.9`, `1.0` (default), `1.1`, `1.2`
**Min/Max:** 0.8 (80%) to 1.2 (120%)

**Implementation Strategy:**
- Use CSS custom property `--font-scale` on `:root`
- Apply via JavaScript: `document.documentElement.style.setProperty('--font-scale', scale)`
- Use Tailwind's arbitrary values or inline styles to apply scale

**UI:**
- Two buttons: "A−" (decrease) and "A+" (increase)
- Grouped with other control buttons
- Show current scale as tooltip or in panel

**CSS:**
```css
:root {
  --font-scale: 1.0;
}

body {
  font-size: calc(16px * var(--font-scale));
}
```

---

## Technical Implementation Plan

### Phase 1: Write Tests (TDD)

**File:** `mvp1/test-node-v10.js`

**Test Categories:**

1. **Mobile Layout Tests** (10 tests)
   - ✓ Control panel collapses on mobile viewport
   - ✓ FAB button exists on mobile
   - ✓ Panel opens/closes correctly
   - ✓ All controls accessible in panel
   - ✓ Panel closes when selecting option
   - ✓ Desktop shows fixed buttons
   - ✓ No overlap between controls and content
   - ✓ Responsive breakpoint at 640px
   - ✓ Panel has proper z-index layering
   - ✓ Panel animation works smoothly

2. **Selection Hints Tests** (5 tests)
   - ✓ Selection hints are displayed
   - ✓ Hints show correct key bindings
   - ✓ Hints visible in light mode
   - ✓ Hints visible in dark mode
   - ✓ Hints don't obstruct candidate area

3. **Font Size Control Tests** (12 tests)
   - ✓ Default font scale is 1.0
   - ✓ Increase button increments scale
   - ✓ Decrease button decrements scale
   - ✓ Min scale is 0.8 (can't go below)
   - ✓ Max scale is 1.2 (can't go above)
   - ✓ Scale persists to localStorage
   - ✓ Scale loads from localStorage on page load
   - ✓ Font size affects all text elements
   - ✓ Layout doesn't break at 0.8x scale
   - ✓ Layout doesn't break at 1.2x scale
   - ✓ Default scale can be reset
   - ✓ Visual feedback shows current scale

**Total:** 27 tests

### Phase 2: Implement Features

**Changes Required:**

1. **index.html**
   - Add control panel/modal HTML
   - Add font size controls
   - Add selection hint text
   - Add responsive breakpoint classes
   - Add FAB button for mobile

2. **core_logic.js**
   - Add `setupControlPanel()` function
   - Add `setupFontSizeControl()` function
   - Add `loadFontSizePreference()` function
   - Add `saveFontSizePreference()` function
   - Add `applyFontScale()` function
   - Add panel open/close event handlers

3. **style.css** (if needed)
   - Add custom CSS for font scaling
   - Add panel animation styles

### Phase 3: Update Documentation

**Files to Update:**
- `memory-bank/activeContext.md` - Add v10 section
- `memory-bank/progress.md` - Update to v10 (57%)
- `README.md` - Add v10 features
- `README.en.md` - Add v10 features

---

## Feature Specifications

### F-10.1: Responsive Control Panel

**Desktop (≥640px):**
```html
<!-- Fixed Buttons (keep current structure, add font controls) -->
<div class="fixed top-4 right-4 z-50 flex-col gap-2 hidden sm:flex">
  <button id="dark-mode-toggle">...</button>
  <button id="mode-toggle-btn">...</button>
  <button id="auto-copy-toggle-btn">...</button>
  <button id="font-size-decrease-btn">A−</button>
  <button id="font-size-increase-btn">A+</button>
</div>
```

**Mobile (<640px):**
```html
<!-- FAB -->
<button id="mobile-controls-fab" class="fixed top-4 right-4 z-50 flex sm:hidden">
  <span class="material-symbols-outlined">settings</span>
</button>

<!-- Slide-in Panel -->
<div id="mobile-controls-panel" class="fixed inset-0 z-50 hidden sm:hidden">
  <div class="backdrop" onclick="closePanel()"></div>
  <div class="panel slide-in-right">
    <h3>設定 (Settings)</h3>
    <!-- All controls here -->
  </div>
</div>
```

### F-10.2: Selection Key Hints

**Location:** Between "候選字 (Candidates)" label and candidate area

**HTML:**
```html
<p class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
  <span>按</span>
  <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">Space</kbd>
  <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">'</kbd>
  <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">[</kbd>
  <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">]</kbd>
  <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">-</kbd>
  <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">\</kbd>
  <span>選字 | 點擊選字 |</span>
  <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">=</kbd>
  <span>翻頁</span>
</p>
```

### F-10.3: Font Size Control

**Functions:**
```javascript
// Font scale management
let currentFontScale = 1.0;
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.2;
const SCALE_STEP = 0.1;

function loadFontSizePreference() {
  const saved = localStorage.getItem('webdayi_font_scale');
  if (saved) {
    currentFontScale = parseFloat(saved);
    applyFontScale(currentFontScale);
  }
}

function saveFontSizePreference(scale) {
  localStorage.setItem('webdayi_font_scale', scale.toString());
}

function applyFontScale(scale) {
  document.documentElement.style.fontSize = `${scale * 100}%`;
  currentFontScale = scale;
}

function increaseFontSize() {
  if (currentFontScale < MAX_SCALE) {
    const newScale = Math.min(currentFontScale + SCALE_STEP, MAX_SCALE);
    applyFontScale(newScale);
    saveFontSizePreference(newScale);
    showTemporaryFeedback(`字體大小: ${Math.round(newScale * 100)}%`);
  }
}

function decreaseFontSize() {
  if (currentFontScale > MIN_SCALE) {
    const newScale = Math.max(currentFontScale - SCALE_STEP, MIN_SCALE);
    applyFontScale(newScale);
    saveFontSizePreference(newScale);
    showTemporaryFeedback(`字體大小: ${Math.round(newScale * 100)}%`);
  }
}
```

---

## Success Criteria

### Must Have (P0):
- ✅ Control buttons don't overlap on mobile (Android Chrome tested)
- ✅ Selection key hints are visible and clear
- ✅ Font size controls work and persist
- ✅ All 27 tests pass
- ✅ All v9 features still work (59/59 tests pass)

### Should Have (P1):
- ✅ Smooth animations for panel open/close
- ✅ Keyboard shortcut to open controls (Ctrl+,)
- ✅ Visual feedback for font size changes
- ✅ Accessible ARIA labels for all controls

### Nice to Have (P2):
- 🔮 Font size reset button
- 🔮 Preview of current scale in panel
- 🔮 Tooltip showing scale percentage

---

## Testing Strategy

### Manual Testing Checklist:

**Mobile (Android Chrome):**
- [ ] Open on mobile device (or Chrome DevTools mobile viewport)
- [ ] Verify no button overlap in portrait mode
- [ ] Verify FAB button is visible
- [ ] Tap FAB, verify panel opens
- [ ] Verify all controls work in panel
- [ ] Verify panel closes after selection
- [ ] Test landscape mode

**Desktop (Chrome/Firefox/Safari):**
- [ ] Verify fixed buttons in top-right
- [ ] Verify no overlap with content
- [ ] Test all control buttons
- [ ] Test font size controls

**Cross-Browser:**
- [ ] Chrome ≥88
- [ ] Firefox ≥78
- [ ] Safari ≥14
- [ ] Edge ≥88

**Regression Testing:**
- [ ] All 59 v9 tests still pass
- [ ] Auto-copy still works
- [ ] Dark mode still works
- [ ] Personalization still works
- [ ] Pagination still works

---

## Rollout Plan

1. **Development Branch:** `claude/mvp1-v10-mobile-fixes-[sessionId]`
2. **Testing:** Manual testing on real Android device
3. **Documentation:** Update all docs
4. **Commit:** Clear commit message with before/after screenshots
5. **PR:** Create PR to main with comprehensive description
6. **Deploy:** Merge and deploy to GitHub Pages

---

## Version Information

- **Previous Version:** v9 (Modern UI with Tailwind CSS + Dark Mode)
- **Target Version:** v10 (Mobile UX Fixes + Font Size Control)
- **Estimated Completion:** ~3-4 hours
- **Test Count:** 27 new tests (86 total: 59 existing + 27 new)
