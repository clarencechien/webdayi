# Phase 1.10: Character-Level Editing UI Design

**Created**: 2025-11-13
**Status**: 🎯 Design Phase
**Target**: Session 10.11 Part 6
**Priority**: HIGH (Blocks sentence mode UX completion)

---

## 🔴 Problem Statement

### Current Issue (Quick Fix Applied)
**What**: Users reported that Enter/= keys don't work inside the contenteditable prediction area
**Why**: contenteditable captures keyboard events and prevents bubbling to document level
**Quick Fix**: Added direct keydown handlers to contenteditable (temporary solution)

### Fundamental Design Flaw
**contenteditable is the wrong UI component for our use case**:
- ❌ Cannot easily implement "click character → show candidates"
- ❌ Cursor management is complex
- ❌ Keyboard event handling is unpredictable
- ❌ Not suitable for structured character-by-character editing

### Session 10.11 Part 6 Requirements (Not Yet Possible)
1. **Click Character**: Click "易" → Show 6 candidates (易/義/移/異/逸/益)
2. **Arrow Navigation**: Left/Right arrows → Move between characters
3. **Quick Keys**: Space/'[]\- → Select candidate (0-5)
4. **Escape**: Exit edit mode
5. **Auto-Advance**: After selecting, move to next character

---

## 🎯 Proposed Solution: Character Span Architecture

### Core Concept
Replace contenteditable with **individual clickable character components**.

### UI Structure

```html
<!-- Prediction Display Area -->
<div class="sentence-prediction">
  <!-- Header with indicator -->
  <div class="prediction-header">
    <span>智慧預測結果</span>
    <span class="indicator">預測 2/5</span>
  </div>

  <!-- Character Display (NOT editable) -->
  <div class="sentence-display" id="sentence-display" tabindex="0">
    <span class="char" data-index="0" data-code="4jp" data-candidates='["易","義","移","異","逸","益"]'>
      易
    </span>
    <span class="char" data-index="1" data-code="ad" data-candidates='["在","再","載","宰"]'>
      在
    </span>
    <span class="char" data-index="2" data-code="a" data-candidates='["大","太","夫"]'>
      大
    </span>
  </div>

  <!-- Code Breakdown -->
  <div class="char-breakdown">
    易 (4jp) → 在 (ad) → 大 (a)
  </div>

  <!-- Hint -->
  <div class="prediction-hint">
    <kbd>=</kbd> 切換預測 | <kbd>點擊字</kbd> 重選 | <kbd>Enter</kbd> 確認
  </div>
</div>

<!-- Candidate Selection Modal (Hidden by default) -->
<div class="candidate-modal" id="candidate-modal" style="display: none;">
  <div class="modal-header">
    <span>選擇字元 (Position 0: 4jp)</span>
    <button class="close-btn" onclick="closeCandidateModal()">✕</button>
  </div>
  <div class="candidates-grid">
    <!-- 6 candidates, keyboard shortcuts visible -->
    <button class="candidate" data-key="Space">0. 易</button>
    <button class="candidate" data-key="'">1. 義</button>
    <button class="candidate" data-key="[">2. 移</button>
    <button class="candidate" data-key="]">3. 異</button>
    <button class="candidate" data-key="-">4. 逸</button>
    <button class="candidate" data-key="\">5. 益</button>
  </div>
  <div class="modal-hint">
    <kbd>Space</kbd> <kbd>'</kbd> <kbd>[</kbd> <kbd>]</kbd> <kbd>-</kbd> <kbd>\</kbd> 快速選擇 | <kbd>Esc</kbd> 取消
  </div>
</div>
```

---

## 🔧 Implementation Details

### 1. Character Display Component

**CSS Classes**:
```css
.sentence-display {
  display: flex;
  gap: 2px;
  padding: 12px;
  background: rgba(78, 201, 176, 0.05);
  border-radius: 8px;
  outline: none; /* Remove focus outline */
}

.char {
  display: inline-block;
  padding: 6px 10px;
  font-size: 24px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  user-select: none;
}

.char:hover {
  background: rgba(78, 201, 176, 0.2);
  transform: scale(1.1);
}

.char.editing {
  background: rgba(78, 201, 176, 0.3);
  border: 2px solid #4ec9b0;
}
```

**JavaScript Event Handlers**:
```javascript
// Click character → Show modal
document.querySelectorAll('.char').forEach((charEl, index) => {
  charEl.addEventListener('click', function() {
    const candidates = JSON.parse(this.dataset.candidates);
    const code = this.dataset.code;
    showCandidateModal(index, code, candidates);
  });
});

// Keyboard navigation in sentence display
const sentenceDisplay = document.getElementById('sentence-display');
let currentEditIndex = -1; // -1 = not editing

sentenceDisplay.addEventListener('keydown', function(e) {
  const key = e.key;

  // Enter: Confirm entire sentence
  if (key === 'Enter') {
    e.preventDefault();
    window.confirmPrediction();
    return;
  }

  // = key: Cycle to next prediction
  if (key === '=') {
    e.preventDefault();
    window.triggerPrediction();
    return;
  }

  // Arrow keys: Navigate between characters
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    e.preventDefault();
    navigateCharacters(key);
    return;
  }

  // Quick selection keys when a character is focused
  if (currentEditIndex >= 0 && isQuickKey(key)) {
    e.preventDefault();
    selectCandidateByKey(key);
    return;
  }
});
```

### 2. Candidate Selection Modal

**Show Modal Logic**:
```javascript
function showCandidateModal(charIndex, code, candidates) {
  currentEditIndex = charIndex;

  // Highlight the editing character
  document.querySelectorAll('.char').forEach((el, i) => {
    el.classList.toggle('editing', i === charIndex);
  });

  // Populate modal
  const modal = document.getElementById('candidate-modal');
  const modalHeader = modal.querySelector('.modal-header span');
  modalHeader.textContent = `選擇字元 (Position ${charIndex}: ${code})`;

  const grid = modal.querySelector('.candidates-grid');
  grid.innerHTML = candidates.map((char, i) => {
    const keys = [' ', "'", '[', ']', '-', '\\'];
    const keyLabel = keys[i] || '';
    return `<button class="candidate" data-index="${i}" data-key="${keyLabel}">
              ${i}. ${char} <kbd>${keyLabel}</kbd>
            </button>`;
  }).join('');

  // Bind click handlers
  grid.querySelectorAll('.candidate').forEach((btn, i) => {
    btn.addEventListener('click', () => selectCandidate(charIndex, candidates[i]));
  });

  // Show modal
  modal.style.display = 'block';

  // Focus modal for keyboard input
  modal.focus();
}
```

**Close Modal Logic**:
```javascript
function closeCandidateModal() {
  const modal = document.getElementById('candidate-modal');
  modal.style.display = 'none';

  // Remove editing highlight
  document.querySelectorAll('.char').forEach(el => {
    el.classList.remove('editing');
  });

  currentEditIndex = -1;

  // Return focus to sentence display
  document.getElementById('sentence-display').focus();
}
```

**Select Candidate Logic**:
```javascript
function selectCandidate(charIndex, newChar) {
  // Update character in display
  const chars = document.querySelectorAll('.char');
  chars[charIndex].textContent = newChar;

  // Mark as user-edited (for learning)
  chars[charIndex].dataset.edited = 'true';

  // Close modal
  closeCandidateModal();

  // Auto-advance to next character (if exists)
  if (charIndex + 1 < chars.length) {
    const nextChar = chars[charIndex + 1];
    nextChar.click(); // Open next character's modal
  }
}
```

### 3. Integration with confirmPrediction()

**Update confirmPrediction() to read from character spans**:
```javascript
window.confirmPrediction = async function confirmPrediction() {
  // Get final sentence from character spans
  const chars = Array.from(document.querySelectorAll('.char'));
  const finalSentence = chars.map(el => el.textContent).join('');

  // Detect if any characters were edited
  const editedIndices = chars
    .map((el, i) => (el.dataset.edited === 'true' ? i : -1))
    .filter(i => i >= 0);

  console.log(`[v11 UI] Final sentence: "${finalSentence}"`);
  console.log(`[v11 UI] Edited indices: [${editedIndices.join(', ')}]`);

  // Compare with original prediction for learning
  if (originalPrediction && originalPrediction !== finalSentence) {
    // ... learning logic (same as before)
  }

  // Append to output buffer
  // ... (same as before)
};
```

---

## 📋 Implementation Checklist

### Phase 1.10.1: Core Infrastructure (1-2 hours)
- [ ] Replace contenteditable with character span display
- [ ] Add data attributes (index, code, candidates)
- [ ] Implement character click → log event
- [ ] Add CSS for hover/editing states

### Phase 1.10.2: Candidate Modal (2-3 hours)
- [ ] Create modal HTML structure
- [ ] Implement showCandidateModal()
- [ ] Implement closeCandidateModal()
- [ ] Implement selectCandidate()
- [ ] Add keyboard shortcuts (Space/'[]\-)

### Phase 1.10.3: Keyboard Navigation (1-2 hours)
- [ ] Arrow keys to move between characters
- [ ] Enter to confirm sentence
- [ ] = to cycle predictions
- [ ] Escape to close modal

### Phase 1.10.4: Learning Integration (1 hour)
- [ ] Update confirmPrediction() to read from spans
- [ ] Detect edited characters
- [ ] Apply learning (reuse existing logic)

### Phase 1.10.5: Testing (1 hour)
- [ ] Create test-character-editing-ui.html
- [ ] Test all keyboard shortcuts
- [ ] Test auto-advance
- [ ] Test learning detection

**Total Estimated Time**: 6-9 hours

---

## 🔄 Migration Path

### Current State (Quick Fix)
```javascript
// Quick fix: contenteditable with direct event handlers
<div contenteditable="true">易在大</div>
```

### Target State (Phase 1.10)
```javascript
// New: Character spans with modal
<div class="sentence-display">
  <span class="char" data-index="0">易</span>
  <span class="char" data-index="1">在</span>
  <span class="char" data-index="2">大</span>
</div>
```

### Transition Strategy
1. **Keep Quick Fix**: Don't break current functionality
2. **Add New UI**: Implement character span display in parallel
3. **Feature Flag**: Use config to toggle between old/new UI
4. **Gradual Rollout**: Test new UI, then make it default
5. **Remove Old**: Delete contenteditable code after verification

---

## 🎨 UX Benefits

### Before (contenteditable)
❌ Can't click individual characters
❌ Keyboard shortcuts don't work reliably
❌ Editing is confusing (free-form text)
❌ No visual feedback on edit position

### After (character spans)
✅ Click any character → See candidates
✅ Clear keyboard shortcuts with visual hints
✅ Structured editing (select from candidates only)
✅ Visual highlight on editing position
✅ Auto-advance after selection
✅ Escape to cancel

---

## 📊 Technical Comparison

| Feature | contenteditable | Character Spans |
|---------|----------------|-----------------|
| Click to edit | ❌ Free-form | ✅ Structured |
| Keyboard events | ❌ Captured | ✅ Propagate |
| Individual char edit | ❌ Difficult | ✅ Native |
| Cursor management | ❌ Complex | ✅ Simple (CSS) |
| Learning detection | ⚠️ String compare | ✅ Per-char tracking |
| Mobile friendly | ⚠️ Mediocre | ✅ Touch optimized |

---

## 🚀 Next Steps

1. **Review this design** with team/user
2. **Create TDD tests** for character editing
3. **Implement Phase 1.10.1** (core infrastructure)
4. **Iteratively add features** (1.10.2 → 1.10.5)
5. **Deploy and gather feedback**

---

## 📝 Notes

- Quick fix (direct event handlers) is TEMPORARY
- Character span architecture is the CORRECT long-term solution
- This design supports all Session 10.11 Part 6 requirements
- Estimated completion: 1-2 days of focused work
