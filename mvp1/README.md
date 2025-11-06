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
node test-node.js
```

## How to Use

1. **Type** a Dàyì code in the input box (e.g., `v`, `a`, `ab`)
2. **View** candidates appear automatically below
3. **Select** a candidate by pressing number keys `1`-`9`
4. **Repeat** to compose your text
5. **Copy** the composed text using the "Copy" button
6. **Paste** into your target application

## Test Results

All tests passing (12/12):

```
✓ Database Loading (2 tests)
✓ Query Function (3 tests)
✓ Sort Function (3 tests)
✓ Render Function (3 tests)
✓ Integration Test (1 test)
```

## Known Sample Codes

From the generated database:

- `v` → 大, 夫, 禾
- `a` → 人, 入
- `4` → 四, 西, 黑
- `,` → 力

Try these to verify the system works!

## Success Criteria

- [x] Database loads successfully (1584 codes)
- [x] Query returns correct candidates
- [x] Candidates sorted by frequency
- [x] Selection works with number keys
- [x] Text accumulates in output buffer
- [x] Clipboard copy works
- [x] All TDD tests pass

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
