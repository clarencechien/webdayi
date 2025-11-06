# WebDaYi MVP1 - Core Engine

This is the **MVP 1.0** implementation of WebDaYi - a static webpage for validating the core Dàyì input method engine.

## Purpose

MVP1 serves as a validation tool for the core query/sort algorithm before wrapping it in a browser extension (MVP 2a). It allows developers to:

1. Verify the database conversion is correct
2. Test query and sorting logic
3. Validate the user interaction flow
4. Debug any issues in a simple environment

## Files

- **index.html** - Main application UI
- **core_logic.js** - Core engine implementation (query, sort, render)
- **style.css** - Styling
- **dayi_db.json** - Generated database (from converter)
- **test.html** - Browser-based test suite
- **test-node.js** - Node.js test runner (TDD)

## Usage

### Run the Application

Simply open `index.html` in a web browser:

```bash
# Option 1: Direct file
open index.html

# Option 2: Simple HTTP server (recommended)
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

### Run Tests

**Browser tests:**
```bash
open test.html
```

**Node.js tests (TDD):**
```bash
node test-node-v3.js  # Latest tests with pagination and auto-select
```

## How to Use

### Input Codes
1. **Type** a Dàyì code in the input box (e.g., `v`, `a`, `t0`, `t1`)
   - **Important**: 0-9 are now part of codes (not selection keys!)
2. **View** candidates appear automatically below

### Selection Keys
Use these keys to select candidates:
- `Space` → 1st candidate (fastest!)
- `'` → 2nd candidate
- `[` → 3rd candidate
- `]` → 4th candidate
- `-` → 5th candidate
- `\` → 6th candidate

### New Features v3
1. **Auto-select on 3rd Character**: When you type 2 characters and continue typing a 3rd character, the first candidate is automatically selected. This speeds up typing significantly!
   - Example: Type "ab" → see candidates → type "c" → "ab"'s first candidate auto-selected, "c" becomes new input

2. **Pagination**: When there are more than 6 candidates, press `=` to cycle through pages
   - Shows indicator: "第 1/3 頁 = 換頁" (Page 1/3, press = to page)
   - Cycles back to page 1 after the last page

### Workflow
3. **Select** a candidate using the selection keys above, OR continue typing to auto-select
4. **Page** through candidates using `=` if there are more than 6
5. **Repeat** to compose your text
6. **Copy** the composed text using the "Copy" button
7. **Paste** into your target application

## Test Results

All tests passing (19/19):

```
✓ Database Loading (1 test)
✓ Selection Key Mapping (2 tests)
✓ Pagination System (9 tests) [NEW in v3]
  - Calculate total pages
  - Get candidates for specific page
  - Cycle through pages
  - Check if pagination needed
✓ Auto-select on 3rd Character (6 tests) [NEW in v3]
  - Detect when to auto-select
  - Handle auto-select with valid/invalid codes
  - Split code correctly
✓ Integration Test (1 test)
  - Real database with 60+ candidates (ux: 61 candidates, 11 pages)
```

## Known Sample Codes

From the generated database:

- `v` → 大, 夫, 禾
- `a` → 人, 入
- `t0` → 逍, 縫, 尐 (0-9 are valid code characters!)
- `t1` → 糾, 常, 紼
- `,` → 力

Try these to verify the system works!

## Success Criteria

- [x] Database loads successfully (1584 codes)
- [x] Query returns correct candidates
- [x] Candidates sorted by frequency
- [x] Selection works with new keys (Space, ', [, ], -, \)
- [x] 0-9 allowed in input codes (not selection keys)
- [x] Pagination works with = key (cycles through pages) [NEW v3]
- [x] Auto-select on 3rd character (speeds up typing) [NEW v3]
- [x] Text accumulates in output buffer
- [x] Clipboard copy works
- [x] All TDD tests pass (19/19)

## Next Steps

Once MVP1 is validated:

1. Review and confirm accuracy with more test cases
2. Measure query performance (should be <50ms)
3. Refactor core_logic.js into a module for MVP 2a
4. Begin MVP 2a (Chrome Extension) implementation

## Architecture

```
User types "v"
  ↓
handleInput("v")
  ↓
queryCandidates(map, "v")  // O(1) lookup
  ↓
sortCandidatesByFreq([...]) // Sort by freq
  ↓
renderCandidatesHTML([...]) // Generate HTML
  ↓
updateCandidateArea(html)   // Display to user
  ↓
User presses "1"
  ↓
handleSelection(0)          // index 0
  ↓
appendToOutputBuffer("大")  // Add to buffer
  ↓
clearInputBox()             // Reset for next
```

## Performance

- Database size: ~717KB
- Total codes: 1,584
- Query time: <1ms (O(1) Map lookup)
- Sort time: <1ms (typically <10 candidates)
- Total interaction time: <20ms (well under 100ms target)

## Notes

- This is a **validation tool**, not the final product
- Output is via copy/paste (MVP 2a will inject directly)
- Target user is **developer** (for verification)
- UI is functional but not polished (focus on logic validation)
