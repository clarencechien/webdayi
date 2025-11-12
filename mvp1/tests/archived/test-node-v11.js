/**
 * MVP 1.0 v11: N-gram Sentence Prediction - TDD Test Suite
 *
 * This test suite follows Test-Driven Development (TDD) approach.
 * Tests are written BEFORE implementation.
 *
 * Total Tests: 30
 * Categories:
 *   1. N-gram Database Loading (5 tests)
 *   2. Input Mode Management (6 tests)
 *   3. Code Buffering (8 tests)
 *   4. Live Preview (3 tests)
 *   5. Viterbi Integration (6 tests)
 *   6. Event Handling (2 tests)
 *
 * Design Document: mvp1/DESIGN-v11.md
 */

const fs = require('fs');
const path = require('path');

// Mock browser globals for Node.js testing
global.document = {
  getElementById: function(id) {
    return {
      value: '',
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      textContent: '',
      innerHTML: ''
    };
  },
  addEventListener: function() {}
};

global.localStorage = {
  getItem: function() { return null; },
  setItem: function() {},
  removeItem: function() {}
};

// Load core_logic.js
const coreLogicPath = path.join(__dirname, 'core_logic.js');
let coreLogicCode = fs.readFileSync(coreLogicPath, 'utf8');
eval(coreLogicCode);

// Load v11 N-gram functions
const v11Path = path.join(__dirname, 'core_logic_v11.js');
let v11Code = fs.readFileSync(v11Path, 'utf8');
eval(v11Code);

// Load viterbi_module.js
const viterbiPath = path.join(__dirname, 'viterbi_module.js');
let viterbiCode = fs.readFileSync(viterbiPath, 'utf8');
eval(viterbiCode);

// Test helper functions
function assertApproximatelyEqual(actual, expected, tolerance = 0.001) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ${expected}, got ${actual} (tolerance: ${tolerance})`);
  }
}

function assertEqual(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`);
  }
}

function assertTrue(condition, message = '') {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertFalse(condition, message = '') {
  if (condition) {
    throw new Error(`Assertion failed (expected false): ${message}`);
  }
}

function assertThrows(fn, expectedMessage) {
  try {
    fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (e) {
    if (!e.message.includes(expectedMessage)) {
      throw new Error(`Expected error message to include "${expectedMessage}", got: ${e.message}`);
    }
  }
}

// ============================================================================
// Test Data
// ============================================================================

// Mock N-gram database (small subset for testing)
// v2.0 structure with Solution B Laplace smoothing support
const mockNgramDb = {
  // Probabilities (for backward compatibility)
  unigrams: {
    '易': 0.01,
    '義': 0.008,
    '在': 0.015,
    '灰': 0.002,
    '大': 0.02,
    '夫': 0.005
  },
  bigrams: {
    '易在': 0.5,
    '易灰': 0.1,
    '義在': 0.4,
    '義灰': 0.05,
    '在大': 0.6,
    '在夫': 0.2,
    '灰大': 0.3,
    '灰夫': 0.1
  },

  // Raw counts (for Laplace smoothing - Solution B)
  unigram_counts: {
    '易': 10000,
    '義': 8000,
    '在': 15000,
    '灰': 2000,
    '大': 20000,
    '夫': 5000
  },
  bigram_counts: {
    '易在': 5000,
    '易灰': 1000,
    '義在': 4000,
    '義灰': 500,
    '在大': 6000,
    '在夫': 2000,
    '灰大': 3000,
    '灰夫': 1000
  },

  // Laplace smoothing parameters (Solution B)
  smoothing_alpha: 0.1,
  total_chars: 1000000,
  vocab_size: 6,

  metadata: {
    total_chars: 1000000,
    unique_chars: 6,
    total_bigrams: 22500,
    unique_bigrams: 8,
    version: '2.0',
    smoothing_method: 'laplace',
    smoothing_alpha: 0.1
  }
};

// Mock Dayi database
const mockDayiMap = new Map([
  ['4jp', [
    { char: '易', freq: 80 },
    { char: '義', freq: 70 }
  ]],
  ['ad', [
    { char: '在', freq: 90 },
    { char: '灰', freq: 45 }
  ]],
  ['v', [
    { char: '大', freq: 100 },
    { char: '夫', freq: 60 }
  ]]
]);

// ============================================================================
// Category 1: N-gram Database Loading (5 tests)
// ============================================================================

function test_getNgramDb_initially_null() {
  console.log('Test: getNgramDb() initially returns null');

  // Reset state
  if (typeof resetNgramState === 'function') {
    resetNgramState();
  }

  const db = getNgramDb();
  assertEqual(db, null, 'N-gram DB should be null initially');

  console.log('  ✓ Pass');
}

function test_setNgramDb_stores_database() {
  console.log('Test: setNgramDb() stores database');

  setNgramDb(mockNgramDb);
  const retrieved = getNgramDb();

  assertEqual(retrieved.metadata.unique_chars, 6, 'Should retrieve stored database');
  assertTrue(retrieved.unigrams['易'] === 0.01, 'Unigram data should be correct');

  console.log('  ✓ Pass');
}

function test_isNgramDbLoading_tracks_loading_state() {
  console.log('Test: isNgramDbLoading() tracks loading state');

  // Reset state
  if (typeof resetNgramState === 'function') {
    resetNgramState();
  }

  assertFalse(isNgramDbLoading(), 'Initially not loading');

  setNgramDbLoading(true);
  assertTrue(isNgramDbLoading(), 'Should be loading');

  setNgramDbLoading(false);
  assertFalse(isNgramDbLoading(), 'Should not be loading');

  console.log('  ✓ Pass');
}

function test_validateNgramDb_structure() {
  console.log('Test: validateNgramDb() validates structure');

  // Valid database
  assertTrue(validateNgramDb(mockNgramDb), 'Should validate correct structure');

  // Invalid databases
  assertFalse(validateNgramDb(null), 'Null should be invalid');
  assertFalse(validateNgramDb({}), 'Empty object should be invalid');
  assertFalse(validateNgramDb({ unigrams: {} }), 'Missing bigrams should be invalid');
  assertFalse(validateNgramDb({ bigrams: {} }), 'Missing unigrams should be invalid');

  console.log('  ✓ Pass');
}

function test_getNgramDbStats() {
  console.log('Test: getNgramDbStats() returns database statistics');

  setNgramDb(mockNgramDb);
  const stats = getNgramDbStats();

  assertEqual(stats.uniqueChars, 6, 'Should have 6 unique chars');
  assertEqual(stats.uniqueBigrams, 8, 'Should have 8 unique bigrams');
  assertTrue(stats.totalChars > 0, 'Should have total chars from metadata');

  console.log('  ✓ Pass');
}

// ============================================================================
// Category 2: Input Mode Management (6 tests)
// ============================================================================

function test_getInputMode_default_character() {
  console.log('Test: getInputMode() defaults to character mode');

  // Reset state
  if (typeof resetInputModeState === 'function') {
    resetInputModeState();
  }

  const mode = getInputMode();
  assertEqual(mode, 'character', 'Default mode should be character');

  console.log('  ✓ Pass');
}

function test_setInputMode_switches_to_sentence() {
  console.log('Test: setInputMode() switches to sentence mode');

  setInputMode('sentence');
  const mode = getInputMode();
  assertEqual(mode, 'sentence', 'Mode should be sentence');

  console.log('  ✓ Pass');
}

function test_setInputMode_switches_back_to_character() {
  console.log('Test: setInputMode() switches back to character mode');

  setInputMode('sentence');
  setInputMode('character');
  const mode = getInputMode();
  assertEqual(mode, 'character', 'Mode should be character');

  console.log('  ✓ Pass');
}

function test_setInputMode_clears_buffer_on_switch() {
  console.log('Test: setInputMode() clears buffer when switching');

  // Start in sentence mode with buffered codes
  setInputMode('sentence');
  addToCodeBuffer('4jp', mockDayiMap);
  addToCodeBuffer('ad', mockDayiMap);

  assertTrue(getCodeBuffer().length > 0, 'Buffer should have codes');

  // Switch to character mode
  setInputMode('character');

  assertEqual(getCodeBuffer().length, 0, 'Buffer should be cleared');

  console.log('  ✓ Pass');
}

function test_isCharacterMode() {
  console.log('Test: isCharacterMode() helper function');

  setInputMode('character');
  assertTrue(isCharacterMode(), 'Should be in character mode');

  setInputMode('sentence');
  assertFalse(isCharacterMode(), 'Should not be in character mode');

  console.log('  ✓ Pass');
}

function test_isSentenceMode() {
  console.log('Test: isSentenceMode() helper function');

  setInputMode('sentence');
  assertTrue(isSentenceMode(), 'Should be in sentence mode');

  setInputMode('character');
  assertFalse(isSentenceMode(), 'Should not be in sentence mode');

  console.log('  ✓ Pass');
}

// ============================================================================
// Category 3: Code Buffering (8 tests)
// ============================================================================

function test_addToCodeBuffer_valid_code() {
  console.log('Test: addToCodeBuffer() adds valid code');

  clearCodeBuffer();
  const result = addToCodeBuffer('4jp', mockDayiMap);

  assertTrue(result, 'Should return true for valid code');
  assertEqual(getCodeBuffer().length, 1, 'Buffer should have 1 code');
  assertEqual(getCodeBuffer()[0], '4jp', 'Buffer should contain 4jp');

  console.log('  ✓ Pass');
}

function test_addToCodeBuffer_invalid_code() {
  console.log('Test: addToCodeBuffer() rejects invalid code');

  clearCodeBuffer();
  const result = addToCodeBuffer('invalid', mockDayiMap);

  assertFalse(result, 'Should return false for invalid code');
  assertEqual(getCodeBuffer().length, 0, 'Buffer should remain empty');

  console.log('  ✓ Pass');
}

function test_addToCodeBuffer_multiple_codes() {
  console.log('Test: addToCodeBuffer() adds multiple codes');

  clearCodeBuffer();
  addToCodeBuffer('4jp', mockDayiMap);
  addToCodeBuffer('ad', mockDayiMap);
  addToCodeBuffer('v', mockDayiMap);

  assertEqual(getCodeBuffer().length, 3, 'Buffer should have 3 codes');
  assertEqual(getCodeBuffer()[0], '4jp', 'First code should be 4jp');
  assertEqual(getCodeBuffer()[1], 'ad', 'Second code should be ad');
  assertEqual(getCodeBuffer()[2], 'v', 'Third code should be v');

  console.log('  ✓ Pass');
}

function test_addToCodeBuffer_max_size() {
  console.log('Test: addToCodeBuffer() respects max size (10 codes)');

  clearCodeBuffer();

  // Add 10 codes (max)
  for (let i = 0; i < 10; i++) {
    addToCodeBuffer('4jp', mockDayiMap);
  }

  assertEqual(getCodeBuffer().length, 10, 'Buffer should have 10 codes');

  // Try to add 11th code
  const result = addToCodeBuffer('ad', mockDayiMap);

  assertFalse(result, 'Should reject 11th code');
  assertEqual(getCodeBuffer().length, 10, 'Buffer should still have 10 codes');

  console.log('  ✓ Pass');
}

function test_removeLastCodeFromBuffer() {
  console.log('Test: removeLastCodeFromBuffer() removes last code');

  clearCodeBuffer();
  addToCodeBuffer('4jp', mockDayiMap);
  addToCodeBuffer('ad', mockDayiMap);
  addToCodeBuffer('v', mockDayiMap);

  assertEqual(getCodeBuffer().length, 3, 'Buffer should have 3 codes');

  removeLastCodeFromBuffer();

  assertEqual(getCodeBuffer().length, 2, 'Buffer should have 2 codes');
  assertEqual(getCodeBuffer()[1], 'ad', 'Last code should now be ad');

  console.log('  ✓ Pass');
}

function test_removeLastCodeFromBuffer_empty() {
  console.log('Test: removeLastCodeFromBuffer() handles empty buffer');

  clearCodeBuffer();

  // Should not throw error
  removeLastCodeFromBuffer();

  assertEqual(getCodeBuffer().length, 0, 'Buffer should still be empty');

  console.log('  ✓ Pass');
}

function test_clearCodeBuffer() {
  console.log('Test: clearCodeBuffer() clears all codes');

  clearCodeBuffer();
  addToCodeBuffer('4jp', mockDayiMap);
  addToCodeBuffer('ad', mockDayiMap);

  assertTrue(getCodeBuffer().length > 0, 'Buffer should have codes');

  clearCodeBuffer();

  assertEqual(getCodeBuffer().length, 0, 'Buffer should be empty');

  console.log('  ✓ Pass');
}

function test_getCodeBuffer_returns_copy() {
  console.log('Test: getCodeBuffer() returns copy (not reference)');

  clearCodeBuffer();
  addToCodeBuffer('4jp', mockDayiMap);

  const buffer1 = getCodeBuffer();
  const buffer2 = getCodeBuffer();

  // Modifying buffer1 should not affect buffer2
  buffer1.push('modified');

  assertEqual(buffer2.length, 1, 'Buffer2 should still have 1 element');
  assertEqual(getCodeBuffer().length, 1, 'Original buffer should still have 1 element');

  console.log('  ✓ Pass');
}

// ============================================================================
// Category 4: Live Preview (3 tests)
// ============================================================================

function test_generateLivePreview_shows_first_candidates() {
  console.log('Test: generateLivePreview() shows first candidate of each code');

  clearCodeBuffer();
  addToCodeBuffer('4jp', mockDayiMap);
  addToCodeBuffer('ad', mockDayiMap);
  addToCodeBuffer('v', mockDayiMap);

  const preview = generateLivePreview(getCodeBuffer(), mockDayiMap);

  assertEqual(preview, '易 在 大', 'Preview should show first candidates');

  console.log('  ✓ Pass');
}

function test_generateLivePreview_empty_buffer() {
  console.log('Test: generateLivePreview() handles empty buffer');

  clearCodeBuffer();
  const preview = generateLivePreview(getCodeBuffer(), mockDayiMap);

  assertEqual(preview, '', 'Preview should be empty string');

  console.log('  ✓ Pass');
}

function test_generateLivePreview_respects_user_preference() {
  console.log('Test: generateLivePreview() respects user preferences');

  // Mock user model that prefers 義 over 易
  const mockUserModel = new Map([
    ['4jp', ['義', '易']]
  ]);

  clearCodeBuffer();
  addToCodeBuffer('4jp', mockDayiMap);

  const preview = generateLivePreview(getCodeBuffer(), mockDayiMap, mockUserModel);

  assertEqual(preview, '義', 'Preview should show user-preferred candidate');

  console.log('  ✓ Pass');
}

// ============================================================================
// Category 5: Viterbi Integration (6 tests)
// ============================================================================

function test_predictSentenceFromBuffer_two_codes() {
  console.log('Test: predictSentenceFromBuffer() with 2 codes');

  clearCodeBuffer();
  addToCodeBuffer('4jp', mockDayiMap);
  addToCodeBuffer('ad', mockDayiMap);

  const result = predictSentenceFromBuffer(getCodeBuffer(), mockDayiMap, mockNgramDb);

  assertTrue(result !== null, 'Result should not be null');
  assertEqual(result.sentence.length, 2, 'Sentence should have 2 characters');
  assertEqual(result.chars.length, 2, 'Chars array should have 2 elements');
  assertTrue(typeof result.score === 'number', 'Score should be a number');

  console.log(`  Result: "${result.sentence}" (score: ${result.score.toFixed(3)})`);
  console.log('  ✓ Pass');
}

function test_predictSentenceFromBuffer_three_codes() {
  console.log('Test: predictSentenceFromBuffer() with 3 codes');

  clearCodeBuffer();
  addToCodeBuffer('4jp', mockDayiMap);
  addToCodeBuffer('ad', mockDayiMap);
  addToCodeBuffer('v', mockDayiMap);

  const result = predictSentenceFromBuffer(getCodeBuffer(), mockDayiMap, mockNgramDb);

  assertTrue(result !== null, 'Result should not be null');
  assertEqual(result.sentence.length, 3, 'Sentence should have 3 characters');
  assertEqual(result.chars.length, 3, 'Chars array should have 3 elements');

  console.log(`  Result: "${result.sentence}" (score: ${result.score.toFixed(3)})`);
  console.log('  ✓ Pass');
}

function test_predictSentenceFromBuffer_empty_buffer() {
  console.log('Test: predictSentenceFromBuffer() with empty buffer');

  clearCodeBuffer();

  const result = predictSentenceFromBuffer(getCodeBuffer(), mockDayiMap, mockNgramDb);

  assertEqual(result, null, 'Result should be null for empty buffer');

  console.log('  ✓ Pass');
}

function test_predictSentenceFromBuffer_no_ngram_db() {
  console.log('Test: predictSentenceFromBuffer() without N-gram DB');

  clearCodeBuffer();
  addToCodeBuffer('4jp', mockDayiMap);
  addToCodeBuffer('ad', mockDayiMap);

  const result = predictSentenceFromBuffer(getCodeBuffer(), mockDayiMap, null);

  assertEqual(result, null, 'Result should be null without N-gram DB');

  console.log('  ✓ Pass');
}

function test_formatPredictionResult() {
  console.log('Test: formatPredictionResult() formats result for display');

  const result = {
    sentence: '易在大',
    score: -5.809,
    chars: ['易', '在', '大']
  };

  const codes = ['4jp', 'ad', 'v'];

  const formatted = formatPredictionResult(result, codes);

  assertTrue(formatted.includes('易在大'), 'Should include sentence');
  assertTrue(formatted.includes('-5.809'), 'Should include score');
  assertTrue(formatted.includes('4jp'), 'Should include codes');

  console.log('  ✓ Pass');
}

function test_predictSentence_integration() {
  console.log('Test: Full sentence prediction integration');

  // This is the high-level function that will be called from UI
  clearCodeBuffer();
  setNgramDb(mockNgramDb);

  addToCodeBuffer('4jp', mockDayiMap);
  addToCodeBuffer('ad', mockDayiMap);

  const result = predictSentenceWithCurrentState(mockDayiMap);

  assertTrue(result !== null, 'Result should not be null');
  assertEqual(result.sentence.length, 2, 'Sentence should have 2 characters');

  console.log(`  Result: "${result.sentence}" (score: ${result.score.toFixed(3)})`);
  console.log('  ✓ Pass');
}

// ============================================================================
// Category 6: Event Handling (2 tests)
// ============================================================================

function test_shouldTriggerPrediction_space_with_buffer() {
  console.log('Test: shouldTriggerPrediction() with Space key and buffer');

  clearCodeBuffer();
  addToCodeBuffer('4jp', mockDayiMap);

  const should = shouldTriggerPrediction(' ', 'sentence');

  assertTrue(should, 'Should trigger with Space in sentence mode');

  console.log('  ✓ Pass');
}

function test_shouldTriggerPrediction_character_mode() {
  console.log('Test: shouldTriggerPrediction() in character mode');

  clearCodeBuffer();
  addToCodeBuffer('4jp', mockDayiMap);

  const should = shouldTriggerPrediction(' ', 'character');

  assertFalse(should, 'Should not trigger in character mode');

  console.log('  ✓ Pass');
}

// ============================================================================
// Test Runner
// ============================================================================

function runTests() {
  console.log('='.repeat(70));
  console.log('MVP 1.0 v11: N-gram Sentence Prediction - TDD Test Suite');
  console.log('='.repeat(70));
  console.log();

  let passed = 0;
  let failed = 0;

  const tests = [
    // Category 1: N-gram Database Loading
    test_getNgramDb_initially_null,
    test_setNgramDb_stores_database,
    test_isNgramDbLoading_tracks_loading_state,
    test_validateNgramDb_structure,
    test_getNgramDbStats,

    // Category 2: Input Mode Management
    test_getInputMode_default_character,
    test_setInputMode_switches_to_sentence,
    test_setInputMode_switches_back_to_character,
    test_setInputMode_clears_buffer_on_switch,
    test_isCharacterMode,
    test_isSentenceMode,

    // Category 3: Code Buffering
    test_addToCodeBuffer_valid_code,
    test_addToCodeBuffer_invalid_code,
    test_addToCodeBuffer_multiple_codes,
    test_addToCodeBuffer_max_size,
    test_removeLastCodeFromBuffer,
    test_removeLastCodeFromBuffer_empty,
    test_clearCodeBuffer,
    test_getCodeBuffer_returns_copy,

    // Category 4: Live Preview
    test_generateLivePreview_shows_first_candidates,
    test_generateLivePreview_empty_buffer,
    test_generateLivePreview_respects_user_preference,

    // Category 5: Viterbi Integration
    test_predictSentenceFromBuffer_two_codes,
    test_predictSentenceFromBuffer_three_codes,
    test_predictSentenceFromBuffer_empty_buffer,
    test_predictSentenceFromBuffer_no_ngram_db,
    test_formatPredictionResult,
    test_predictSentence_integration,

    // Category 6: Event Handling
    test_shouldTriggerPrediction_space_with_buffer,
    test_shouldTriggerPrediction_character_mode
  ];

  for (const test of tests) {
    try {
      test();
      passed++;
    } catch (e) {
      console.log(`  ✗ Fail: ${e.message}`);
      failed++;
    }
  }

  console.log();
  console.log('='.repeat(70));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(70));

  return failed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };
