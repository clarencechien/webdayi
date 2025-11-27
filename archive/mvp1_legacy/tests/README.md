# WebDaYi Test Suite

This directory contains all test files and diagnostic tools for WebDaYi MVP 1.0.

## Directory Structure

```
tests/
├── node/           # Node.js test scripts (automated testing)
├── browser/        # Browser-based test pages (manual verification)
├── diagnostic/     # Diagnostic tools for debugging
└── archived/       # Historical tests (reference only)
```

## Test Categories

### Node.js Tests (`node/`)
Automated test scripts using Node.js for unit testing and algorithm verification.

**Current Tests:**
- `test-v27-hybrid.js` - v2.7 hybrid implementation test (94.4% accuracy)
- `test-v25-unigram.js` - v2.5 unigram interpolation test
- `test-laplace-smoothing.js` - Laplace smoothing unit tests (21/21 passing)
- `test-v11-*.js` - v11 UI/UX integration tests

**Usage:**
```bash
node tests/node/test-v27-hybrid.js
```

### Browser Tests (`browser/`)
Interactive HTML pages for manual testing in web browsers.

**Current Tests:**
- `test-browser-v27-version.html` - v2.7 version verification with cache-busting
- `test-browser-diagnosis.html` - General diagnostic page

**Usage:**
Open in browser: `http://localhost:8000/mvp1/tests/browser/test-browser-v27-version.html`

### Diagnostic Tools (`diagnostic/`)
Scripts for debugging specific issues and analyzing algorithm behavior.

**Current Tools:**
- `diagnose-v27-hui-kui.js` - Analyzes why 儈 vs 會 selection occurs
- `diagnose-remaining-errors.js` - Identifies error patterns in predictions
- `check-duplicates.js` - Verifies no duplicate characters in candidate lists

**Usage:**
```bash
node tests/diagnostic/diagnose-v27-hui-kui.js
```

### Archived Tests (`archived/`)
Historical test files kept for reference. Not actively maintained.

## Running All Tests

```bash
# Run all Node.js tests
for test in tests/node/test-*.js; do
  echo "Running $test..."
  node "$test"
done

# Open browser tests
python3 -m http.server 8000
# Then visit: http://localhost:8000/mvp1/tests/browser/
```

## Test Results (Latest)

### v2.7 Hybrid Implementation
- **Test Case 1** (大家好我是大學生): 100% (8/8)
- **Test Case 2** (明天天氣如何會放假嗎): 90% (9/10)
- **Overall Accuracy**: 94.4% (17/18)

### Known Issues
- Position 3: c8 → 真 (expected: 氣) - "天真" vs "天氣" bigram competition

## Adding New Tests

1. Place Node.js tests in `tests/node/`
2. Place browser tests in `tests/browser/`
3. Place diagnostic tools in `tests/diagnostic/`
4. Update this README with test descriptions

## Test File Naming Convention

- `test-*.js` - Automated test scripts
- `test-*.html` - Browser-based test pages
- `diagnose-*.js` - Diagnostic tools
- `check-*.js` - Verification utilities
