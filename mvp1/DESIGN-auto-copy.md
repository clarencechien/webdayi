# Auto-Copy Feature Design (MVP1 v8)

**Date**: 2025-11-10
**Feature**: Automatic clipboard copy after character selection
**Version**: MVP1 v8

---

## Problem Statement

**Current UX Pain Point**:
- User must manually click "Copy" button after composing text
- Extra step interrupts typing flow
- Especially painful on mobile devices
- Not intuitive for IME users who expect seamless workflow

**User Request** (translated):
> "Add auto-copy logic. After selecting a character, automatically copy to user's clipboard (desktop or mobile). Selection can be: Space, quick keys, click selection, or auto-select. The logic should be 'when selecting the last character' automatically copy."

---

## Requirements Analysis

### Selection Methods to Support
1. **Space key** - Select 1st candidate
2. **Quick selection keys** - `'` `[` `]` `-` `\` (2nd-6th candidates)
3. **Click selection** - Touch/mouse click on candidate (v7 feature)
4. **Auto-select** - 3rd character auto-selects first candidate (v3 feature)

### Key Challenge: "When selecting the last character"

**Interpretation Options**:

**Option A: Copy after every selection**
- ✅ Simple to implement
- ✅ Predictable behavior
- ✅ Works for all use cases
- ⚠️ Might be aggressive for long compositions
- ✅ User can still compose longer text in output buffer

**Option B: Copy after delay (e.g., 2 seconds)**
- ⚠️ Complex timing logic
- ⚠️ Unpredictable for user
- ❌ Doesn't match IME expectations

**Option C: Copy on blur/focus loss**
- ⚠️ Doesn't help mobile users
- ⚠️ Delayed feedback
- ❌ Not intuitive

**Option D: Smart detection (output buffer unchanged for N seconds)**
- ⚠️ Complex state management
- ⚠️ Unpredictable timing
- ❌ Over-engineering for MVP

**DECISION: Option A - Copy after every selection**

**Rationale**:
- Matches IME workflow: type → select → paste → repeat
- Simple and predictable
- User has immediate clipboard access
- Manual "Copy" button remains as backup
- Can be toggled off if user prefers manual copy
- For MVP1 (validation tool), this is most pragmatic

---

## Solution Design

### Core Functionality

**Auto-Copy Trigger Points**:
```javascript
// 1. After manual selection (Space, quick keys)
handleSelection(index) {
  // ... existing selection logic ...
  if (autoCopyEnabled) {
    copyToClipboard(outputBuffer.value);
    showCopyFeedback();
  }
}

// 2. After click selection
candidateArea.addEventListener('click', (e) => {
  // ... existing click logic ...
  if (autoCopyEnabled) {
    copyToClipboard(outputBuffer.value);
    showCopyFeedback();
  }
});

// 3. After auto-select
handleInput(value, previousValue) {
  // ... existing auto-select logic ...
  if (autoSelectTriggered && autoCopyEnabled) {
    copyToClipboard(outputBuffer.value);
    showCopyFeedback();
  }
}
```

### User Control

**Toggle Feature**:
- Add "Auto-Copy" toggle button near existing mode toggle
- Save preference to localStorage
- Default: **ENABLED** (since user requested the feature)
- Visual indicator when enabled

**Settings Storage**:
```javascript
localStorage.setItem('webDayi_AutoCopy', 'true');  // or 'false'
```

### User Feedback

**Visual Feedback**:
- Brief flash/highlight on output buffer
- Optional: Toast notification "已複製" (Copied)
- Subtle, non-intrusive

**Mobile Considerations**:
- Use modern Clipboard API: `navigator.clipboard.writeText()`
- Fallback for older browsers
- Handle permission prompts gracefully

---

## Implementation Plan (TDD)

### Phase 1: Core Auto-Copy Logic (test-node-v8.js)

**Test Group 1: Auto-Copy Settings (4 tests)**
1. Get storage key for auto-copy preference
2. Load auto-copy preference (enabled by default)
3. Load auto-copy preference (existing value)
4. Save auto-copy preference to localStorage

**Test Group 2: Auto-Copy Trigger Detection (5 tests)**
1. Should auto-copy after Space key selection
2. Should auto-copy after quick key selection
3. Should auto-copy after click selection
4. Should auto-copy after auto-select
5. Should NOT auto-copy when feature disabled

**Test Group 3: Auto-Copy Execution (4 tests)**
1. Execute clipboard write with correct content
2. Handle empty output buffer
3. Handle multi-character output
4. Track last copy timestamp

**Test Group 4: Integration (3 tests)**
1. Full workflow: select → auto-copy → clipboard updated
2. Toggle feature off → no auto-copy
3. Toggle feature on → auto-copy resumes

**Total: 16 new tests**

### Phase 2: UI Implementation

**HTML Changes** (index.html):
```html
<!-- Auto-Copy Toggle (near mode toggle) -->
<button id="auto-copy-toggle-btn" class="feature-toggle" aria-label="自動複製">
  🔄 自動複製: 開啟
</button>

<!-- Copy Feedback (toast notification) -->
<div id="copy-toast" class="copy-toast hidden">
  ✓ 已複製
</div>
```

**CSS Changes** (style.css):
```css
/* Auto-copy toggle button */
.feature-toggle {
  position: fixed;
  top: 60px;  /* Below mode toggle */
  right: 20px;
  padding: 8px 16px;
  /* ... similar to mode-toggle ... */
}

.feature-toggle.active {
  background: #667eea;
  color: white;
}

/* Copy feedback toast */
.copy-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
}

.copy-toast.hidden {
  display: none;
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

**JavaScript Changes** (core_logic.js):
```javascript
// Global state
let autoCopyEnabled = true;  // Default enabled

// Storage functions
function getAutoCopyStorageKey() {
  return 'webDayi_AutoCopy';
}

function loadAutoCopyPreference() {
  const key = getAutoCopyStorageKey();
  const stored = localStorage.getItem(key);
  if (stored === null) return true;  // Default enabled
  return stored === 'true';
}

function saveAutoCopyPreference(enabled) {
  const key = getAutoCopyStorageKey();
  localStorage.setItem(key, enabled.toString());
}

// Auto-copy execution
function performAutoCopy(text) {
  if (!autoCopyEnabled) return false;
  if (!text) return false;  // Don't copy empty

  return copyToClipboard(text);
}

function showCopyFeedback() {
  const toast = document.getElementById('copy-toast');
  if (!toast) return;

  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2000);  // Hide after 2 seconds
}

// Update handleSelection
function handleSelection(index) {
  // ... existing selection logic ...

  // Auto-copy after selection
  if (autoCopyEnabled) {
    const outputBuffer = document.getElementById('output-buffer');
    if (performAutoCopy(outputBuffer.value)) {
      showCopyFeedback();
    }
  }
}

// Update click handler
candidateArea.addEventListener('click', (e) => {
  // ... existing click logic ...

  // Auto-copy after click selection
  if (autoCopyEnabled) {
    const outputBuffer = document.getElementById('output-buffer');
    if (performAutoCopy(outputBuffer.value)) {
      showCopyFeedback();
    }
  }
});

// Update auto-select handler
function handleInput(value, previousValue) {
  // ... existing auto-select logic ...

  // Auto-copy after auto-select
  if (autoSelectTriggered && autoCopyEnabled) {
    const outputBuffer = document.getElementById('output-buffer');
    if (performAutoCopy(outputBuffer.value)) {
      showCopyFeedback();
    }
  }
}

// Toggle button handler
function setupAutoCopyToggle() {
  const toggleBtn = document.getElementById('auto-copy-toggle-btn');
  if (!toggleBtn) return;

  function updateToggleUI() {
    toggleBtn.textContent = autoCopyEnabled ?
      '🔄 自動複製: 開啟' : '🔄 自動複製: 關閉';
    toggleBtn.classList.toggle('active', autoCopyEnabled);
    toggleBtn.setAttribute('aria-label',
      autoCopyEnabled ? '關閉自動複製' : '開啟自動複製');
  }

  updateToggleUI();

  toggleBtn.addEventListener('click', () => {
    autoCopyEnabled = !autoCopyEnabled;
    saveAutoCopyPreference(autoCopyEnabled);
    updateToggleUI();
  });
}

// Initialize
function initialize() {
  // ... existing initialization ...
  autoCopyEnabled = loadAutoCopyPreference();
  setupAutoCopyToggle();
}
```

---

## Success Criteria

**Functional**:
- ✅ Auto-copy triggers after all 4 selection methods
- ✅ Toggle button works (enable/disable)
- ✅ Preference persists across page reloads
- ✅ Visual feedback shows on copy
- ✅ Works on desktop and mobile
- ✅ No errors in console

**User Experience**:
- ✅ Seamless workflow (no extra clicks needed)
- ✅ Immediate clipboard access after selection
- ✅ Clear visual feedback
- ✅ User can toggle feature if preferred
- ✅ Non-intrusive notifications

**Testing**:
- ✅ All 16 new tests passing
- ✅ All 76 existing tests still passing (no regression)
- ✅ Manual testing on Chrome (desktop)
- ✅ Manual testing on Chrome (mobile)

---

## Alternative Considered: "Copy on Last Character"

**Why we didn't implement this**:

The user mentioned "選最後一個字時 自動複製" (when selecting the LAST character).

**Interpretation challenge**:
- What defines "last character"?
- How does system know user is done?

**Possible approaches**:
1. **Time-based**: Copy after N seconds of inactivity
   - ❌ Unpredictable timing
   - ❌ Doesn't match user intent

2. **Smart detection**: Analyze typing patterns
   - ❌ Over-engineering
   - ❌ Unreliable

3. **Explicit signal**: User presses Enter or Tab
   - ⚠️ Adds extra step (defeats purpose)
   - ⚠️ Not intuitive for IME

**Our decision**: Copy after EVERY selection
- User gets immediate clipboard access
- If composing longer text, they can paste incrementally or wait
- More predictable and reliable
- User can disable feature if it doesn't match their workflow

---

## Future Enhancements (Post-MVP)

**For MVP 2a+ (Browser Plugin)**:
- Auto-paste after auto-copy (inject directly into focused field)
- Smart detection: Don't copy if typing continuously
- Copy delay setting (0s, 1s, 2s, 3s)
- Copy history (clipboard manager)
- Sync auto-copy preference via chrome.storage.sync

**For MVP1 (if user feedback suggests)**:
- Configurable delay before auto-copy
- Different modes: "immediate", "delayed", "manual"
- Copy confirmation sound (optional)

---

## Risk Assessment

**Low Risk**:
- ✅ Feature can be toggled off
- ✅ Doesn't break existing functionality
- ✅ Clear user feedback

**Medium Risk**:
- ⚠️ Clipboard API permissions on mobile (handled with try-catch)
- ⚠️ User might find it too aggressive (mitigated with toggle)

**Mitigation**:
- Default to enabled (since user requested it)
- Provide clear toggle button
- Show visual feedback so user understands what's happening
- Graceful fallback if clipboard API unavailable

---

## Documentation Updates Needed

**Files to update**:
1. `mvp1/README.md` - Add auto-copy feature documentation
2. `mvp1/index.html` - Add usage instructions
3. `memory-bank/activeContext.md` - Document v8 features
4. `memory-bank/progress.md` - Update completion status
5. Root `README.md` - Update feature list and badges

---

## Summary

**Feature**: Auto-Copy after character selection (MVP1 v8)

**Key Decision**: Copy after every selection (not just "last character")

**Implementation**:
- 16 new tests (TDD approach)
- Toggle button for user control
- Visual feedback (toast notification)
- localStorage persistence
- Works for all 4 selection methods

**Benefits**:
- Seamless workflow
- No manual copy needed
- Immediate clipboard access
- User-controllable
- Mobile-friendly

**Next Steps**:
1. Write tests first (test-node-v8.js)
2. Implement core logic
3. Add UI (toggle + toast)
4. Update documentation
5. Commit and deploy
