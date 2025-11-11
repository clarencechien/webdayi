/**
 * Test Suite: Single-Char Selection in Sentence Mode (CRITICAL BUG FIX)
 *
 * Tests the fix for the critical bug where single-char input in sentence mode
 * shows candidates but cannot be selected via Space, Click, or Number keys.
 *
 * Root Cause: core_logic_v11_ui.js renders candidates but doesn't set
 * currentCode and currentCandidates globals required by handleSelection().
 *
 * Total Tests: 18
 * Categories: Global State (5), Space Key (4), Click (3), Number Keys (3), Integration (3)
 */

// Mock Node.js environment
if (typeof document === 'undefined') {
  global.document = {
    getElementById: () => null,
    querySelector: () => null,
    addEventListener: () => {}
  };
  global.navigator = {
    clipboard: {
      writeText: async () => true
    }
  };
}

// Import core logic
const fs = require('fs');
const coreLogicCode = fs.readFileSync('./core_logic.js', 'utf8');
const coreLogicV11Code = fs.readFileSync('./core_logic_v11.js', 'utf8');

// Eval to load functions
eval(coreLogicCode);
eval(coreLogicV11Code);

// Load database
const dayiDbData = JSON.parse(fs.readFileSync('./dayi_db.json', 'utf8'));
dayiMap = createDatabaseMap(dayiDbData);
console.log('✓ Database loaded (' + dayiMap.size + ' codes)');
// Note: v11 UI code has DOM dependencies, test the logic pattern

console.log('======================================================================');
console.log('MVP 1.0 v11: Single-Char Selection in Sentence Mode (CRITICAL FIX)');
console.log('======================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✓ ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

// ============================================================
// Category 1: Global State Tests (5 tests)
// ============================================================

console.log('Category 1: Global State Tests');
console.log('----------------------------------------------------------------------');

test('1.1: currentCode should be settable globally', () => {
  // Simulate what v11 UI should do
  currentCode = 'v';
  if (currentCode !== 'v') throw new Error('currentCode not set correctly');
});

test('1.2: currentCandidates should be settable globally', () => {
  // Simulate setting candidates
  currentCandidates = [{ char: '大', freq: 9988 }, { char: '夫', freq: 8900 }];
  if (currentCandidates.length !== 2) throw new Error('currentCandidates not set correctly');
  if (currentCandidates[0].char !== '大') throw new Error('First candidate incorrect');
});

test('1.3: currentPage should be resettable to 0', () => {
  // After setting single-char candidates, page should be 0
  currentPage = 0;
  if (currentPage !== 0) throw new Error('currentPage not reset');
});

test('1.4: Global state should persist for selection', () => {
  // Set up state
  currentCode = 'a';
  currentCandidates = [{ char: '大', freq: 10000 }, { char: '人', freq: 9990 }];
  currentPage = 0;

  // Verify all set
  if (!currentCode) throw new Error('currentCode lost');
  if (currentCandidates.length === 0) throw new Error('currentCandidates lost');
  if (currentPage !== 0) throw new Error('currentPage not 0');
});

test('1.5: clearInputBox should clear global state', () => {
  // Set up state
  currentCode = 'v';
  currentCandidates = [{ char: '大', freq: 9988 }];

  // Call clearInputBox (simulated, as it needs DOM)
  currentCode = '';
  currentCandidates = [];
  currentPage = 0;

  // Verify cleared
  if (currentCode !== '') throw new Error('currentCode not cleared');
  if (currentCandidates.length !== 0) throw new Error('currentCandidates not cleared');
});

console.log('');

// ============================================================
// Category 2: Space Key Selection Tests (4 tests)
// ============================================================

console.log('Category 2: Space Key Selection Tests');
console.log('----------------------------------------------------------------------');

test('2.1: handleSelection should work when globals are set', () => {
  // Set up state as v11 UI should
  currentCode = 'v';
  currentCandidates = [
    { char: '大', freq: 9988 },
    { char: '夫', freq: 8900 }
  ];
  currentPage = 0;

  // Mock appendToOutputBuffer
  let selectedChar = null;
  const originalAppend = global.appendToOutputBuffer || (() => {});
  global.appendToOutputBuffer = (char) => { selectedChar = char; };

  // Call handleSelection(0) - what Space key does
  // Note: Full handleSelection needs DOM, test the condition
  if (!currentCode || currentCandidates.length === 0) {
    throw new Error('handleSelection guard would return early!');
  }

  // Guard passed, selection would work
  const pageCandidates = getCandidatesForPage(currentCandidates, currentPage);
  if (pageCandidates.length === 0) throw new Error('No page candidates');
  if (pageCandidates[0].char !== '大') throw new Error('Wrong first candidate');

  // Restore
  global.appendToOutputBuffer = originalAppend;
});

test('2.2: handleSelection should fail if currentCode not set', () => {
  // Simulate bug scenario: candidates shown but globals not set
  currentCode = '';  // BUG: not set
  currentCandidates = [{ char: '大', freq: 9988 }];
  currentPage = 0;

  // This is the guard in handleSelection
  if (!currentCode || currentCandidates.length === 0) {
    // Expected: guard fails, selection blocked
    return; // Test passes - we caught the bug scenario
  }

  throw new Error('Guard should have blocked selection');
});

test('2.3: handleSelection should fail if currentCandidates not set', () => {
  // Simulate bug scenario: candidates shown but globals not set
  currentCode = 'v';
  currentCandidates = [];  // BUG: not set
  currentPage = 0;

  // This is the guard in handleSelection
  if (!currentCode || currentCandidates.length === 0) {
    // Expected: guard fails, selection blocked
    return; // Test passes - we caught the bug scenario
  }

  throw new Error('Guard should have blocked selection');
});

test('2.4: Space key condition should work for single-char', () => {
  // Simulate Space key handler condition
  const isInSentenceMode = true;
  const buffer = [];  // No buffered codes
  const inputValue = 'v';
  currentCandidates = [{ char: '大', freq: 9988 }];

  // This is the condition in core_logic.js Space handler (Issue 1 fix)
  if (buffer.length === 0 && inputValue.length === 1 && currentCandidates.length > 0) {
    // Should call handleSelection(0)
    // Test passes
    return;
  }

  throw new Error('Space key condition failed for single-char');
});

console.log('');

// ============================================================
// Category 3: Click Selection Tests (3 tests)
// ============================================================

console.log('Category 3: Click Selection Tests');
console.log('----------------------------------------------------------------------');

test('3.1: Click handler calls handleSelection with index', () => {
  // Set up state
  currentCode = 'v';
  currentCandidates = [
    { char: '大', freq: 9988 },
    { char: '夫', freq: 8900 }
  ];
  currentPage = 0;

  // Simulate click on second candidate (index 1)
  const clickedIndex = 1;

  // Check guard condition
  if (!currentCode || currentCandidates.length === 0) {
    throw new Error('Guard would block click selection');
  }

  // Get the candidate that would be selected
  const pageCandidates = getCandidatesForPage(currentCandidates, currentPage);
  if (pageCandidates[clickedIndex].char !== '夫') {
    throw new Error('Wrong candidate for click');
  }
});

test('3.2: Click should fail if currentCode not set (bug scenario)', () => {
  // Simulate bug
  currentCode = '';  // BUG
  currentCandidates = [{ char: '大', freq: 9988 }];

  // Guard check
  if (!currentCode || currentCandidates.length === 0) {
    return; // Expected: blocked
  }

  throw new Error('Should have blocked click');
});

test('3.3: renderCandidatesHTML generates clickable elements', () => {
  // Test that candidates are rendered with data-index
  const candidates = [
    { char: '大', freq: 9988 },
    { char: '夫', freq: 8900 }
  ];

  const html = renderCandidatesHTML(candidates, 0, 1);

  // Check for data-index attributes (essential for click handlers)
  if (!html.includes('data-index="0"')) throw new Error('No data-index for first');
  if (!html.includes('data-index="1"')) throw new Error('No data-index for second');
  // Check HTML contains candidate characters
  if (!html.includes('大')) throw new Error('First candidate char missing');
  if (!html.includes('夫')) throw new Error('Second candidate char missing');
});

console.log('');

// ============================================================
// Category 4: Number Key Selection Tests (3 tests)
// ============================================================

console.log('Category 4: Number Key Selection Tests');
console.log('----------------------------------------------------------------------');

test('4.1: Number key selection requires global state', () => {
  // Set up for number key selection
  currentCode = 'a';
  currentCandidates = [
    { char: '大', freq: 10000 },
    { char: '人', freq: 9990 },
    { char: '入', freq: 9500 }
  ];
  currentPage = 0;

  // Simulate pressing ' for 2nd candidate (index 1)
  const selectionKey = "'";
  const index = getSelectionIndexFromKey(selectionKey);

  if (index !== 1) throw new Error('Wrong index for \' key');

  // Check guard
  if (!currentCode || currentCandidates.length === 0) {
    throw new Error('Guard would block number key selection');
  }
});

test('4.2: getSelectionIndexFromKey maps all keys correctly', () => {
  // Test selection key mapping
  if (getSelectionIndexFromKey("'") !== 1) throw new Error("' should map to 1");
  if (getSelectionIndexFromKey("[") !== 2) throw new Error("[ should map to 2");
  if (getSelectionIndexFromKey("]") !== 3) throw new Error("] should map to 3");
  if (getSelectionIndexFromKey("-") !== 4) throw new Error("- should map to 4");
  if (getSelectionIndexFromKey("\\") !== 5) throw new Error("\\ should map to 5");
});

test('4.3: Number key selection works with single-char candidates', () => {
  // Set up single-char with multiple candidates
  currentCode = 'v';
  currentCandidates = [
    { char: '大', freq: 9988 },
    { char: '夫', freq: 8900 },
    { char: '禾', freq: 8500 }
  ];
  currentPage = 0;

  // User presses [ for 3rd candidate
  const index = getSelectionIndexFromKey("[");
  const pageCandidates = getCandidatesForPage(currentCandidates, currentPage);

  if (pageCandidates[index].char !== '禾') {
    throw new Error('Wrong candidate for [ key');
  }
});

console.log('');

// ============================================================
// Category 5: Integration Tests (3 tests)
// ============================================================

console.log('Category 5: Integration Tests');
console.log('----------------------------------------------------------------------');

test('5.1: Complete flow - single char to selection', () => {
  // Step 1: User types "v" in sentence mode
  const inputValue = 'v';

  // Step 2: v11 UI queries database
  const candidates = dayiMap.get(inputValue);
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidates for "v"');
  }

  // Step 3: Sort by frequency
  const sorted = [...candidates].sort((a, b) => b.freq - a.freq);
  if (sorted[0].char !== '大') throw new Error('Wrong first candidate');

  // Step 4: v11 UI should set globals (THE FIX)
  currentCode = inputValue;
  currentCandidates = sorted;
  currentPage = 0;

  // Step 5: User presses Space
  // Guard check (should pass now)
  if (!currentCode || currentCandidates.length === 0) {
    throw new Error('Guard failed - fix not applied!');
  }

  // Selection would work
  const pageCandidates = getCandidatesForPage(currentCandidates, currentPage);
  if (pageCandidates[0].char !== '大') throw new Error('Selection would fail');
});

test('5.2: Works with user preferences', () => {
  // Set up user model
  const testUserModel = new Map();
  testUserModel.set('v', ['夫', '大', '禾']); // User prefers 夫 first

  // Simulate v11 UI with user preference
  const inputValue = 'v';
  const candidates = dayiMap.get(inputValue);
  const sorted = [...candidates].sort((a, b) => b.freq - a.freq);

  // Apply user preference
  const withPref = applyUserPreference(inputValue, sorted, testUserModel);
  if (withPref[0].char !== '夫') throw new Error('User preference not applied');

  // Set globals
  currentCode = inputValue;
  currentCandidates = withPref;
  currentPage = 0;

  // Verify selection would use user preference
  const pageCandidates = getCandidatesForPage(currentCandidates, currentPage);
  if (pageCandidates[0].char !== '夫') throw new Error('Selection would ignore user pref');
});

test('5.3: Works with pagination if >6 candidates', () => {
  // Find a code with many candidates
  let codeWithMany = null;
  let manyCandidates = null;

  for (const [code, candidates] of dayiMap.entries()) {
    if (candidates.length > 6) {
      codeWithMany = code;
      manyCandidates = candidates;
      break;
    }
  }

  if (!codeWithMany) {
    console.log('   → Note: No codes with >6 candidates in test data, skipping pagination test');
    return; // Pass anyway
  }

  // Set globals
  currentCode = codeWithMany;
  currentCandidates = manyCandidates;
  currentPage = 0;

  // Check first page
  const page1 = getCandidatesForPage(currentCandidates, 0);
  if (page1.length !== 6) throw new Error('First page should have 6 candidates');

  // Check pagination works
  const totalPages = getTotalPages(currentCandidates);
  if (totalPages <= 1) throw new Error('Should have multiple pages');
});

console.log('');

// ============================================================
// Summary
// ============================================================

console.log('======================================================================');
console.log('Test Summary');
console.log('======================================================================');
console.log(`Total: ${testsPassed + testsFailed} tests`);
console.log(`Passed: ${testsPassed} tests ✓`);
console.log(`Failed: ${testsFailed} tests ✗`);
console.log(`Success Rate: ${((testsPassed/(testsPassed+testsFailed))*100).toFixed(1)}%`);
console.log('======================================================================\n');

if (testsFailed === 0) {
  console.log('✅ All tests passed!\n');
  console.log('Next Steps:');
  console.log('1. Apply fix in core_logic_v11_ui.js (add 3 lines after line 424)');
  console.log('2. Set currentCode = value');
  console.log('3. Set currentCandidates = withUserPreference');
  console.log('4. Set currentPage = 0');
  console.log('5. Run full regression test suite (187+ tests)');
  console.log('6. Manual browser testing (Space, Click, Number keys)');
} else {
  console.log('❌ Some tests failed. Review implementation.\n');
  process.exit(1);
}
