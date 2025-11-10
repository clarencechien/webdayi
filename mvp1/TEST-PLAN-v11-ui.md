# MVP 1.0 v11 - UI Integration Manual Test Plan

This document provides a comprehensive manual testing checklist for MVP 1.0 v11 N-gram Sentence Prediction UI integration.

**Test Environment:**
- Browser: Chrome/Firefox/Safari (latest)
- URL: http://localhost:8000/index.html
- Resolution: Desktop (1920x1080) and Mobile (375x667)

---

## Pre-Test Checklist

- [ ] HTTP server running on port 8000
- [ ] All v11 files present in mvp1/:
  - [ ] viterbi_module.js
  - [ ] core_logic_v11.js
  - [ ] core_logic_v11_ui.js
  - [ ] ngram_db.json (10.4MB)
- [ ] Browser DevTools Console open (check for errors)
- [ ] Network tab open (monitor N-gram DB loading)

---

## Test Suite 1: Initial Load and Console Verification

### Test 1.1: Page Loads Without Errors
- [ ] Open http://localhost:8000/index.html
- [ ] **Expected:** Page loads successfully
- [ ] **Expected:** No JavaScript errors in console
- [ ] **Expected:** Console shows:
  ```
  [viterbi_module.js] Loaded successfully
  [core_logic_v11.js] Loaded successfully
  [v11 UI] Initializing...
  [v11 UI] Initialized successfully
  [v11 UI] Mode: character
  [v11 UI] N-gram DB: not loaded (lazy)
  ```

### Test 1.2: V10 UI Elements Present
- [ ] **Expected:** Input box visible
- [ ] **Expected:** Candidate area visible
- [ ] **Expected:** Output buffer visible
- [ ] **Expected:** Copy button visible
- [ ] **Expected:** Dark mode toggle visible

### Test 1.3: V11 UI Elements Present
- [ ] **Expected:** Mode toggle section visible
- [ ] **Expected:** "逐字模式" button (active/highlighted)
- [ ] **Expected:** "整句模式" button (inactive)
- [ ] **Expected:** Mode description: "逐字模式: 每輸入一個編碼即選字"
- [ ] **Expected:** Code buffer display HIDDEN (class="hidden")
- [ ] **Expected:** Live preview HIDDEN (class="hidden")
- [ ] **Expected:** N-gram loading indicator HIDDEN (class="hidden")

---

## Test Suite 2: Character Mode (V10 Regression Tests)

**Purpose:** Ensure all v10 functionality still works in v11 character mode

### Test 2.1: Basic Input
- [ ] Click in input box
- [ ] Type `4jp`
- [ ] **Expected:** Candidate area shows:
  ```
  1. 易
  2. 義
  ```
- [ ] **Expected:** Input box shows `4jp`

### Test 2.2: Number Key Selection
- [ ] Continue from Test 2.1
- [ ] Press `1` key
- [ ] **Expected:** "易" appears in output buffer
- [ ] **Expected:** Input box cleared
- [ ] **Expected:** Candidate area cleared

### Test 2.3: Multiple Character Input
- [ ] Type `ad`
- [ ] Press `1`
- [ ] **Expected:** "在" appears in output buffer (after "易")
- [ ] **Expected:** Output buffer now shows "易在"

### Test 2.4: Copy Button
- [ ] Click "Copy" button
- [ ] Paste into external text editor (Ctrl+V / Cmd+V)
- [ ] **Expected:** Clipboard contains "易在"

### Test 2.5: Auto-Copy (if enabled)
- [ ] Check if auto-copy toggle is ON
- [ ] Type `v` and press `1`
- [ ] **Expected:** Clipboard automatically contains "易在大"

### Test 2.6: Invalid Code
- [ ] Type `zzz`
- [ ] **Expected:** Candidate area shows "無候選字"

### Test 2.7: Dark Mode Toggle
- [ ] Click dark mode toggle
- [ ] **Expected:** Page switches to dark theme
- [ ] **Expected:** All v11 elements respect dark mode

---

## Test Suite 3: Mode Switching

### Test 3.1: Switch to Sentence Mode
- [ ] Click "整句模式" button
- [ ] **Expected:** "整句模式" button becomes active (highlighted)
- [ ] **Expected:** "逐字模式" button becomes inactive
- [ ] **Expected:** Mode description changes to "整句模式: 輸入多個編碼，按 Space 預測句子"
- [ ] **Expected:** Code buffer display becomes VISIBLE (class removed)
- [ ] **Expected:** Code buffer shows "尚無編碼 (No codes yet)"
- [ ] **Expected:** N-gram loading overlay appears (spinner visible)
- [ ] **Expected:** Console shows:
  ```
  [v11 UI] Switched to sentence mode
  [v11 UI] N-gram DB loaded: 18215 unigrams, 279220 bigrams
  ```
- [ ] **Expected:** Loading overlay disappears after ~2-5 seconds
- [ ] **Expected:** Candidate area shows "輸入編碼後按 Space 預測句子"

### Test 3.2: N-gram Database Loading
- [ ] Open Network tab in DevTools
- [ ] **Expected:** Request to `ngram_db.json` (10.4MB)
- [ ] **Expected:** Status: 200 OK
- [ ] **Expected:** Type: application/json

### Test 3.3: Switch Back to Character Mode
- [ ] Click "逐字模式" button
- [ ] **Expected:** Mode switches back
- [ ] **Expected:** Code buffer display becomes HIDDEN
- [ ] **Expected:** Live preview becomes HIDDEN
- [ ] **Expected:** Input box cleared
- [ ] **Expected:** Candidate area shows "請輸入大易碼"
- [ ] **Expected:** Console shows:
  ```
  [v11 UI] Switched to character mode
  ```

### Test 3.4: N-gram DB Cached
- [ ] Switch to sentence mode again
- [ ] **Expected:** NO loading overlay (database already loaded)
- [ ] **Expected:** Instant mode switch
- [ ] **Expected:** Console shows N-gram DB already loaded

---

## Test Suite 4: Code Buffering (Sentence Mode)

**Pre-condition:** Ensure in Sentence Mode

### Test 4.1: Add First Code
- [ ] Type `4jp` in input box
- [ ] **Expected:** After typing 2 characters:
  - Input box auto-clears to empty
  - Code buffer shows badge: `4jp`
  - Badge has blue background (#0fb8f0)
  - Badge has slide-in animation
  - Candidate area shows "已加入編碼 "4jp"，繼續輸入或按 Space 預測"

### Test 4.2: Add Second Code
- [ ] Type `ad`
- [ ] **Expected:** Code buffer shows two badges: `4jp` `ad`
- [ ] **Expected:** Each badge has spacing between them

### Test 4.3: Add Third Code
- [ ] Type `v`
- [ ] **Expected:** Code buffer shows three badges: `4jp` `ad` `v`

### Test 4.4: Invalid Code Rejection
- [ ] Type `zz`
- [ ] **Expected:** Candidate area shows "無效編碼: zz" (in red/rose color)
- [ ] **Expected:** After 1 second, input auto-clears
- [ ] **Expected:** Code buffer unchanged (still shows `4jp` `ad` `v`)

### Test 4.5: Maximum Buffer Size
- [ ] Continue adding codes until 10 total
- [ ] Try to add 11th code
- [ ] **Expected:** 11th code rejected (buffer max is 10)

---

## Test Suite 5: Live Preview

**Pre-condition:** In Sentence Mode with codes buffered

### Test 5.1: Live Preview Appears
- [ ] Ensure buffer has codes: `4jp` `ad` `v`
- [ ] **Expected:** Live preview section becomes VISIBLE
- [ ] **Expected:** Preview text shows: "易 在 大" (first candidates)
- [ ] **Expected:** Preview has gradient background
- [ ] **Expected:** Preview text is large (3xl) and bold
- [ ] **Expected:** Shows hint: "按 Space 鍵以智能預測最佳句子"

### Test 5.2: Preview Updates on Add
- [ ] Add another code `a`
- [ ] **Expected:** Preview updates to "易 在 大 大" (space-separated)

### Test 5.3: Preview Hides When Buffer Empty
- [ ] Clear buffer (ESC key or clear button)
- [ ] **Expected:** Live preview becomes HIDDEN

---

## Test Suite 6: Viterbi Prediction (Space Key)

**Pre-condition:** In Sentence Mode with codes buffered

### Test 6.1: Two-Code Prediction
- [ ] Clear buffer (ESC)
- [ ] Type `4jp` (wait for buffer)
- [ ] Type `ad` (wait for buffer)
- [ ] Press **Space** key
- [ ] **Expected:**
  - Candidate area shows prediction card:
    - Gradient background (purple/blue)
    - Header: "智能預測結果 (Prediction)"
    - Predicted sentence: "易在" (large, bold, letter-spaced)
    - Char breakdown: "易 (4jp) → 在 (ad)"
    - Prediction score: "機率分數: -5.298" (approximately)
  - Output buffer appends "易在"
  - Code buffer clears (shows "尚無編碼")
  - Live preview hides
  - Input box cleared
  - Console shows:
    ```
    [v11 UI] Predicting sentence for: 4jp, ad
    [v11 UI] Prediction: "易在" (score: -5.298)
    ```

### Test 6.2: Three-Code Prediction
- [ ] Type `4jp`, `ad`, `v` (buffer all three)
- [ ] Press **Space**
- [ ] **Expected:**
  - Prediction card shows "易在大"
  - Char breakdown: "易 (4jp) → 在 (ad) → 大 (v)"
  - Prediction score: approximately -5.809
  - Output buffer appends "易在大"

### Test 6.3: Space on Empty Buffer (No-op)
- [ ] Ensure buffer is empty
- [ ] Press **Space**
- [ ] **Expected:** Nothing happens (silent no-op)
- [ ] **Expected:** Console shows warning:
  ```
  [v11 UI] Buffer empty, cannot predict
  ```

### Test 6.4: Prediction with User Preference (Future)
- [ ] *Note:* User preference not yet implemented in v11
- [ ] **Expected:** Predictions use only N-gram probabilities

---

## Test Suite 7: Backspace and Clear

**Pre-condition:** In Sentence Mode

### Test 7.1: Backspace Removes Last Code
- [ ] Buffer codes: `4jp` `ad` `v`
- [ ] Ensure input box is EMPTY
- [ ] Press **Backspace** key
- [ ] **Expected:**
  - Code buffer now shows: `4jp` `ad` (v removed)
  - Live preview updates to "易 在"
  - Console shows:
    ```
    [v11 UI] Removed last code from buffer
    ```

### Test 7.2: Backspace on Empty Buffer (No-op)
- [ ] Clear buffer completely
- [ ] Press **Backspace** (input empty)
- [ ] **Expected:** Nothing happens (silent no-op)

### Test 7.3: Clear Button
- [ ] Buffer codes: `4jp` `ad` `v`
- [ ] Click "清除" button (next to "已輸入編碼")
- [ ] **Expected:**
  - Code buffer clears to "尚無編碼 (No codes yet)"
  - Live preview hides
  - Input box cleared
  - Candidate area shows "輸入編碼後按 Space 預測句子"
  - Console shows:
    ```
    [v11 UI] Buffer cleared
    ```

### Test 7.4: ESC Key Clear
- [ ] Buffer codes: `4jp` `ad`
- [ ] Press **ESC** key
- [ ] **Expected:** Same as Test 7.3 (full clear)
- [ ] **Expected:** Console shows:
  ```
  [v11 UI] Buffer cleared via ESC
  ```

---

## Test Suite 8: Auto-Copy Integration

**Pre-condition:** Auto-copy enabled, Sentence Mode

### Test 8.1: Prediction Triggers Auto-Copy
- [ ] Ensure auto-copy toggle is ON
- [ ] Buffer `4jp` `ad`
- [ ] Press **Space**
- [ ] **Expected:**
  - Prediction appears: "易在"
  - Output buffer appends "易在"
  - Clipboard automatically contains full output buffer content
  - Copy feedback animation shows (if implemented)

### Test 8.2: Auto-Copy Disabled
- [ ] Turn auto-copy toggle OFF
- [ ] Buffer `v` `a`
- [ ] Press **Space**
- [ ] **Expected:**
  - Prediction appears: "大大"
  - Output buffer appends "大大"
  - Clipboard NOT automatically updated

---

## Test Suite 9: Responsive Design (Mobile)

### Test 9.1: Mobile View (375px width)
- [ ] Open DevTools, toggle device toolbar
- [ ] Select iPhone SE or similar (375x667)
- [ ] **Expected:**
  - Mode toggle buttons show only icons (text hidden)
  - Code buffer badges wrap to multiple lines
  - Predicted sentence font-size reduces to 1.5rem
  - All elements remain accessible and readable

### Test 9.2: Touch Events (if testable)
- [ ] Tap mode toggle buttons
- [ ] Tap clear buffer button
- [ ] **Expected:** All interactions work via touch

---

## Test Suite 10: Error Handling

### Test 10.1: N-gram DB Load Failure
- [ ] Rename `ngram_db.json` to `ngram_db.json.bak` temporarily
- [ ] Reload page
- [ ] Switch to Sentence Mode
- [ ] **Expected:**
  - Loading overlay appears
  - Console error:
    ```
    [v11 UI] Failed to load N-gram database: HTTP 404
    ```
  - Alert dialog: "N-gram 資料庫載入失敗: HTTP 404"
  - Mode stays on Sentence Mode but prediction disabled
- [ ] Restore file name

### Test 10.2: Invalid N-gram Structure
- [ ] *Note:* Would require manually corrupting ngram_db.json
- [ ] **Expected:** Validation catches structure errors

### Test 10.3: Viterbi Prediction Failure
- [ ] *Note:* Difficult to trigger in normal usage
- [ ] **Expected:** If prediction fails, alert shows "預測失敗，請重試"

---

## Test Suite 11: Performance

### Test 11.1: N-gram DB Load Time
- [ ] Clear browser cache
- [ ] Reload page
- [ ] Switch to Sentence Mode
- [ ] Measure time from button click to console "loaded" message
- [ ] **Expected:** Load time < 10 seconds (depends on network/CPU)

### Test 11.2: Prediction Latency
- [ ] Buffer 3 codes
- [ ] Press Space
- [ ] Measure time from Space press to prediction displayed
- [ ] **Expected:** Latency < 500ms (instant feel)

### Test 11.3: Buffer Operations Responsiveness
- [ ] Type codes rapidly: `4jp` `ad` `v` `a` `ad`
- [ ] **Expected:** All badges appear without lag
- [ ] **Expected:** Live preview updates smoothly

---

## Test Suite 12: Console Log Validation

### Test 12.1: Expected Console Logs on Load
```
[viterbi_module.js] Loaded successfully
[core_logic_v11.js] Loaded successfully
[v11 UI] Initializing...
[v11 UI] Initialized successfully
[v11 UI] Mode: character
[v11 UI] N-gram DB: not loaded (lazy)
```

### Test 12.2: Expected Console Logs on Mode Switch
```
[v11 UI] Switched to sentence mode
[v11 UI] N-gram DB loaded: 18215 unigrams, 279220 bigrams
[v11 UI] Switched to character mode
```

### Test 12.3: Expected Console Logs on Prediction
```
[v11 UI] Added code to buffer: 4jp
[v11 UI] Added code to buffer: ad
[v11 UI] Predicting sentence for: 4jp, ad
[v11 UI] Prediction: "易在" (score: -5.298)
```

---

## Test Suite 13: V10 Regression (Critical)

**Purpose:** Ensure v11 changes do NOT break existing v10 features

### Test 13.1: Run v10 Test Suite
- [ ] Open http://localhost:8000/test-runner.html
- [ ] **Expected:** All 104 v10 tests PASS
- [ ] **Expected:** 0 failures

### Test 13.2: V10 Character Mode Features
- [ ] Ensure in Character Mode
- [ ] Test all features from Test Suite 2
- [ ] **Expected:** 100% identical behavior to v10

---

## Success Criteria

**MVP 1.0 v11 is ready for release if:**

✅ All console logs appear as expected
✅ All UI elements render correctly (desktop + mobile)
✅ Mode switching works smoothly
✅ N-gram DB loads successfully (lazy)
✅ Code buffering works with visual feedback
✅ Live preview updates in real-time
✅ Viterbi predictions are mathematically correct
✅ Space key triggers prediction correctly
✅ Backspace/ESC clear operations work
✅ Auto-copy integration works
✅ Error handling works gracefully
✅ Performance is acceptable (< 10s load, < 500ms prediction)
✅ **All 104 v10 regression tests PASS**
✅ No JavaScript errors in console
✅ Dark mode works for all v11 elements
✅ Responsive design works on mobile

---

## Test Results Log

**Tester:** ___________
**Date:** ___________
**Browser:** ___________
**OS:** ___________

**Summary:**
- Total Test Cases: ___ / ___
- Passed: ___
- Failed: ___
- Blocked: ___

**Critical Issues Found:**
1.
2.
3.

**Non-Critical Issues:**
1.
2.

**Notes:**


---

**End of Test Plan**
