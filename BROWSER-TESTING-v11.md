# MVP 1.0 v11 Browser Testing Checklist

**Status**: Ready for Browser Acceptance Testing (Final 5% of v11)
**Version**: v11 with Solution B Laplace Smoothing
**Date**: 2025-11-10

---

## ✅ Pre-Testing Verification (COMPLETE)

All automated tests passing:

- ✅ **Laplace Smoothing Tests**: 21/21 passing
- ✅ **N-gram Quick Fix Tests**: All passing
- ✅ **Core v11 Tests**: 30/30 passing
- ✅ **Total Test Coverage**: 96/96 passing (100%)

---

## 📋 Browser Testing Checklist

### 1️⃣ Environment Setup

**Desktop Testing:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile Testing:**
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet

**Files to Test:**
- File: `mvp1/index.html`
- Access: `file:///path/to/webdayi/mvp1/index.html`
- OR: `http://localhost:8000/mvp1/index.html` (if using local server)

---

### 2️⃣ Initial Load Tests

**Test 2.1: Page Loads Successfully**
- [ ] Open `index.html` in browser
- [ ] No console errors visible
- [ ] All UI elements visible:
  - [ ] Input box
  - [ ] Candidate area
  - [ ] Output buffer
  - [ ] Copy button
  - [ ] Mode toggle buttons (Character / Sentence)
  - [ ] Control panel (desktop: fixed buttons, mobile: FAB menu)

**Test 2.2: Default State**
- [ ] Input mode: "Character" (default)
- [ ] Code buffer: Empty
- [ ] Live preview: Not visible
- [ ] Prediction button: Hidden (only shows in sentence mode)
- [ ] dayi_db.json loads (check console: "✓ Dayi DB loaded")

**Test 2.3: Console Verification**
- [ ] Open Developer Console (F12)
- [ ] Check for: `✓ Dayi DB loaded. Total codes: X`
- [ ] Check for: `✓ Core logic initialized`
- [ ] Check for: `✓ Viterbi module loaded (v2.0 with Laplace smoothing - Solution B)`
- [ ] No error messages

---

### 3️⃣ Character Mode Tests (Traditional Input)

**Test 3.1: Basic Character Input**
1. Ensure mode is "Character"
2. Type: `v` → Expect candidates: "1. 大", "2. 夫", etc.
3. Press `1` → Expect "大" appended to output buffer
4. Result: [ ] Pass / [ ] Fail

**Test 3.2: Multi-Character Sequence**
1. Clear output buffer (Backspace)
2. Type: `v` → Press `1` → "大"
3. Type: `ad` → Press `1` → "在"
4. Type: `4jp` → Press `1` → "易"
5. Result in buffer: "大在易"
6. Result: [ ] Pass / [ ] Fail

**Test 3.3: Candidate Sorting**
1. Type: `4jp`
2. Check candidates are sorted by frequency (descending)
3. Example: "易" (freq: 80) before "義" (freq: 70)
4. Result: [ ] Pass / [ ] Fail

**Test 3.4: Invalid Code Handling**
1. Type: `zzz` (invalid code)
2. Expect: "無候選字" (No candidates)
3. Result: [ ] Pass / [ ] Fail

**Test 3.5: Copy to Clipboard**
1. After inputting characters, click "Copy" button
2. Paste into another application (notepad, etc.)
3. Verify copied text matches output buffer
4. Result: [ ] Pass / [ ] Fail

---

### 4️⃣ Sentence Mode Tests (Smart Engine)

**Test 4.1: Switch to Sentence Mode**
1. Click "📝 句模式" button (or "Sentence Mode" on mobile)
2. Verify:
   - [ ] Button highlighted (active state)
   - [ ] Character mode button not highlighted
   - [ ] Prediction button becomes visible
   - [ ] N-gram DB starts loading (check console)
3. Result: [ ] Pass / [ ] Fail

**Test 4.2: N-gram Database Loading**
1. After switching to sentence mode (first time)
2. Check console for:
   - [ ] "Loading N-gram database..."
   - [ ] "✓ N-gram DB loaded (15.7 MB)"
   - [ ] "- Unigrams: 18,215"
   - [ ] "- Bigrams: 279,220"
   - [ ] "- Version: 2.0 (with Laplace smoothing)"
3. Result: [ ] Pass / [ ] Fail

**Test 4.3: Code Buffering**
1. In sentence mode, type: `v`
2. Verify:
   - [ ] Code appears as badge in buffer display
   - [ ] Live preview shows: "易 ..." (first candidate)
   - [ ] Input box is NOT cleared
3. Type: `d/` (space separator)
4. Verify:
   - [ ] Two badges visible: "v", "d/"
   - [ ] Live preview: "易 在 ..." (first candidates)
5. Result: [ ] Pass / [ ] Fail

**Test 4.4: Backspace to Remove Code**
1. With codes in buffer ("v", "d/")
2. Press Backspace
3. Verify:
   - [ ] Last code "d/" removed from buffer
   - [ ] Only "v" badge remains
   - [ ] Live preview updates: "易 ..."
4. Result: [ ] Pass / [ ] Fail

**Test 4.5: Space Key Prediction (Desktop)**
1. Clear buffer, type: `v d/`
2. Press Space key
3. Verify:
   - [ ] Viterbi algorithm runs (check console)
   - [ ] Prediction result appears in output buffer
   - [ ] Expected: "大易" or similar based on N-gram data
   - [ ] Code buffer clears
   - [ ] Live preview hides
4. Result: [ ] Pass / [ ] Fail

**Test 4.6: Prediction Button (Mobile)**
1. On mobile device (or touch simulator)
2. Type codes: `v d/`
3. Tap "🔮 預測" button (large touch-friendly button)
4. Verify same behavior as Test 4.5
5. Result: [ ] Pass / [ ] Fail

**Test 4.7: Maximum Buffer Size (10 codes)**
1. Type 11 codes (e.g., `v d/ 4jp v d/ 4jp v d/ 4jp v d/`)
2. Verify:
   - [ ] Only first 10 codes accepted
   - [ ] Warning message: "最多 10 個碼" or similar
3. Result: [ ] Pass / [ ] Fail

**Test 4.8: Switch Back to Character Mode**
1. In sentence mode with codes in buffer
2. Click "🔤 字模式" button
3. Verify:
   - [ ] Buffer clears
   - [ ] Live preview hides
   - [ ] Prediction button hides
   - [ ] Returns to character-by-character input
4. Result: [ ] Pass / [ ] Fail

---

### 5️⃣ Laplace Smoothing Verification (Solution B)

**Test 5.1: Unseen Bigram Prediction**
1. In sentence mode, input two codes that form an unseen bigram
2. Example: Find two rare characters not in common use
3. Verify:
   - [ ] Prediction still works (no crash)
   - [ ] Fallback to Laplace smoothing (check console logs)
   - [ ] Result seems reasonable based on unigram frequencies
4. Result: [ ] Pass / [ ] Fail

**Test 5.2: Common Phrase Prediction**
1. Type codes for common phrase: `v d/` → "大易"
2. Check console for bigram probability:
   - [ ] Shows: "Bigram '大易': X.XXXX" (from actual corpus data)
3. Type codes for another common phrase
4. Compare which has higher probability
5. Result: [ ] Pass / [ ] Fail

**Test 5.3: Laplace vs Fixed Fallback**
1. Open console, look for Viterbi debug logs
2. Find example of:
   - Seen bigram: Uses `getLaplaceBigram()`
   - Unseen bigram: Uses `getLaplaceBigram()` with smoothing
3. Verify smoothing formula: `(count + α) / (total + α * vocab_size)`
4. Result: [ ] Pass / [ ] Fail

---

### 6️⃣ Mobile-Specific Tests

**Test 6.1: Touch-Friendly Buttons**
- [ ] Mode toggle buttons (80px height) easy to tap
- [ ] Prediction button (80px height) easy to tap
- [ ] Number selection (1-9) buttons responsive
- [ ] FAB menu opens/closes smoothly

**Test 6.2: Virtual Keyboard Compatibility**
- [ ] Virtual keyboard doesn't obscure candidate area
- [ ] Prediction button accessible (Space key may not work on virtual keyboards)
- [ ] Backspace key removes codes in sentence mode

**Test 6.3: Responsive Layout**
- [ ] Desktop: Fixed control panel on right side
- [ ] Mobile: FAB menu (hamburger icon) accessible
- [ ] All text readable on small screens
- [ ] No horizontal scrolling

---

### 7️⃣ Edge Cases & Error Handling

**Test 7.1: Empty Buffer Prediction**
1. In sentence mode, press Space without typing codes
2. Verify:
   - [ ] No crash
   - [ ] Warning message or no action
3. Result: [ ] Pass / [ ] Fail

**Test 7.2: Invalid Code in Buffer**
1. Type: `zzz` (invalid) in sentence mode
2. Verify:
   - [ ] Shows "?" or placeholder in live preview
   - [ ] Prediction handles gracefully (skips invalid code or shows warning)
3. Result: [ ] Pass / [ ] Fail

**Test 7.3: Large Input Test**
1. Input 50+ characters using character mode
2. Verify:
   - [ ] Output buffer scrolls properly
   - [ ] Copy button still works
   - [ ] No performance degradation
3. Result: [ ] Pass / [ ] Fail

**Test 7.4: Rapid Switching**
1. Rapidly switch between character/sentence mode (10 times)
2. Verify:
   - [ ] No errors
   - [ ] State remains consistent
   - [ ] N-gram DB loads only once (cached)
3. Result: [ ] Pass / [ ] Fail

---

### 8️⃣ Performance Tests

**Test 8.1: Initial Load Time**
- [ ] Page loads in < 2 seconds
- [ ] dayi_db.json (743KB) loads quickly
- [ ] Viterbi module initializes instantly

**Test 8.2: N-gram Lazy Loading**
- [ ] N-gram DB (15.7MB) only loads when switching to sentence mode
- [ ] First switch takes 2-5 seconds (acceptable)
- [ ] Subsequent switches instant (cached)

**Test 8.3: Prediction Speed**
- [ ] 2-code prediction: < 100ms
- [ ] 5-code prediction: < 500ms
- [ ] 10-code prediction: < 2 seconds

**Test 8.4: Memory Usage**
- [ ] Open browser task manager
- [ ] Check memory usage after loading N-gram DB
- [ ] Should be reasonable (< 100MB for page)

---

### 9️⃣ Console Log Verification

**Expected Console Output (Clean Session):**

```
✓ Core logic initialized
✓ Dayi DB loaded. Total codes: 3429
✓ Viterbi module loaded (v2.0 with Laplace smoothing - Solution B)
[Mode] Switched to: sentence
Loading N-gram database...
✓ N-gram DB loaded (15.7 MB)
  - Unigrams: 18,215
  - Bigrams: 279,220
  - Smoothing: Laplace (α=0.1)
  - Version: 2.0 (with Laplace smoothing)
[Viterbi] Starting prediction for 2 codes...
[Viterbi] Result: "大易" (score: -X.XXXX)
```

**Check for:**
- [ ] No error messages
- [ ] All "✓" checks present
- [ ] Version shows "2.0 with Laplace smoothing"
- [ ] Smoothing method: "Laplace (α=0.1)"

---

### 🔟 Cross-Browser Compatibility

**Test each feature above in:**

| Feature | Chrome | Firefox | Safari | Edge | Mobile Chrome | Mobile Safari |
|---------|--------|---------|--------|------|---------------|---------------|
| Character Mode | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Sentence Mode | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| N-gram Loading | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Viterbi Prediction | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Copy Button | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Mode Toggle | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Mobile UX | N/A | N/A | N/A | N/A | [ ] | [ ] |

---

## 📊 Acceptance Criteria

**MVP 1.0 v11 is considered 100% complete when:**

1. ✅ All automated tests pass (96/96) - **COMPLETE**
2. ⏳ All browser tests pass (checklist above)
3. ⏳ No critical bugs in character mode
4. ⏳ No critical bugs in sentence mode
5. ⏳ Laplace smoothing verified working
6. ⏳ Mobile UX fully functional
7. ⏳ Cross-browser compatibility confirmed
8. ⏳ Performance meets targets
9. ⏳ Documentation updated (README reflects 100% status)

---

## 🐛 Bug Reporting Template

If you find a bug during testing:

```
**Bug ID**: v11-BUG-XXX
**Severity**: Critical / Major / Minor
**Browser**: Chrome 120 / Firefox 121 / etc.
**Device**: Desktop / Mobile (specify)

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:


**Actual Behavior**:


**Console Errors** (if any):


**Screenshots/Videos**:

```

---

## 📝 Notes for Tester

- **Time Estimate**: 60-90 minutes for full checklist
- **Focus Areas**: Sentence mode, Laplace smoothing, mobile UX
- **Known Limitations**: N-gram DB is 15.7MB (may be slow on 3G)
- **Best Tested On**: Desktop Chrome + Mobile Safari (most common)

---

## ✅ Sign-Off

**Tester Name**: _________________
**Date**: _________________
**Overall Result**: [ ] PASS / [ ] FAIL
**Ready for Production**: [ ] YES / [ ] NO

**Notes**:


---

**Version**: MVP 1.0 v11 with Solution B Laplace Smoothing
**Document Created**: 2025-11-10
**Last Updated**: 2025-11-10
