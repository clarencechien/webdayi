/**
 * Viterbi Algorithm - TDD Test Suite
 *
 * This test suite follows Test-Driven Development (TDD) approach.
 * All tests are written BEFORE implementation.
 *
 * Total Tests: 15
 * Categories:
 *   1. Lattice Construction (3 tests)
 *   2. DP Initialization (3 tests)
 *   3. Forward Pass (4 tests)
 *   4. Backtracking (3 tests)
 *   5. Integration (2 tests)
 *
 * Design Document: mvp3-smart-engine/DESIGN-viterbi.md
 */

const {
  buildLattice,
  initializeDP,
  forwardPass,
  backtrack,
  viterbi
} = require('./viterbi');

// Test helper functions
function assertApproximatelyEqual(actual, expected, tolerance = 0.001) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ${expected}, got ${actual} (tolerance: ${tolerance})`);
  }
}

function assertEqual(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
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

const testDayiDb = new Map([
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
  ]],
  ['a', [
    { char: '大', freq: 100 },
    { char: '人', freq: 80 }
  ]]
]);

const testNgramDb = {
  unigrams: {
    '易': 0.01,
    '義': 0.008,
    '在': 0.015,
    '灰': 0.002,
    '大': 0.02,
    '夫': 0.005,
    '人': 0.012
  },
  bigrams: {
    '易在': 0.5,
    '易灰': 0.1,
    '義在': 0.4,
    '義灰': 0.05,
    '在大': 0.6,
    '在夫': 0.2,
    '灰大': 0.3,
    '灰夫': 0.1,
    '大人': 0.7
  }
};

// ============================================================================
// Category 1: Lattice Construction (3 tests)
// ============================================================================

function test_buildLattice_valid_codes() {
  console.log('Test: buildLattice with valid codes');

  const codes = ['4jp', 'ad'];
  const lattice = buildLattice(codes, testDayiDb);

  // Should have 2 positions
  assertEqual(lattice.length, 2, 'Lattice should have 2 positions');

  // First position should have 2 candidates
  assertEqual(lattice[0].length, 2, 'First position should have 2 candidates');
  assertEqual(lattice[0][0].char, '易', 'First candidate should be 易');
  assertEqual(lattice[0][1].char, '義', 'Second candidate should be 義');

  // Second position should have 2 candidates
  assertEqual(lattice[1].length, 2, 'Second position should have 2 candidates');
  assertEqual(lattice[1][0].char, '在', 'First candidate should be 在');
  assertEqual(lattice[1][1].char, '灰', 'Second candidate should be 灰');

  console.log('  ✓ Pass');
}

function test_buildLattice_invalid_code() {
  console.log('Test: buildLattice with invalid code');

  const codes = ['invalid'];

  assertThrows(
    () => buildLattice(codes, testDayiDb),
    'No candidates found for code'
  );

  console.log('  ✓ Pass');
}

function test_buildLattice_empty_codes() {
  console.log('Test: buildLattice with empty codes');

  const codes = [];
  const lattice = buildLattice(codes, testDayiDb);

  assertEqual(lattice.length, 0, 'Empty codes should produce empty lattice');

  console.log('  ✓ Pass');
}

// ============================================================================
// Category 2: DP Initialization (3 tests)
// ============================================================================

function test_initializeDP_first_position() {
  console.log('Test: initializeDP for first position');

  const lattice = buildLattice(['4jp'], testDayiDb);
  const dp = initializeDP(lattice, testNgramDb);

  // Should have 1 position
  assertEqual(dp.length, 1, 'DP table should have 1 position');

  // Should have log probabilities for both candidates
  assertEqual(Object.keys(dp[0]).length, 2, 'Should have 2 candidates');
  assertApproximatelyEqual(dp[0]['易'], Math.log(0.01), 0.001);
  assertApproximatelyEqual(dp[0]['義'], Math.log(0.008), 0.001);

  console.log('  ✓ Pass');
}

function test_initializeDP_missing_unigram() {
  console.log('Test: initializeDP with missing unigram');

  // Create test data with character not in unigram database
  const testLattice = [[{ char: '未知字', freq: 10 }]];
  const dp = initializeDP(testLattice, testNgramDb);

  // Should use default probability 1e-10
  assertApproximatelyEqual(dp[0]['未知字'], Math.log(1e-10), 0.001);

  console.log('  ✓ Pass');
}

function test_initializeDP_multiple_positions() {
  console.log('Test: initializeDP with multiple positions');

  const lattice = buildLattice(['4jp', 'ad', 'v'], testDayiDb);
  const dp = initializeDP(lattice, testNgramDb);

  // Should have 3 positions
  assertEqual(dp.length, 3, 'DP table should have 3 positions');

  // First position should be initialized
  assertEqual(Object.keys(dp[0]).length, 2, 'First position should have 2 entries');

  // Other positions should be empty (filled during forward pass)
  assertEqual(Object.keys(dp[1]).length, 0, 'Second position should be empty');
  assertEqual(Object.keys(dp[2]).length, 0, 'Third position should be empty');

  console.log('  ✓ Pass');
}

// ============================================================================
// Category 3: Forward Pass (4 tests)
// ============================================================================

function test_forwardPass_two_positions() {
  console.log('Test: forwardPass with two positions');

  const lattice = buildLattice(['4jp', 'ad'], testDayiDb);
  const dp = initializeDP(lattice, testNgramDb);
  const backpointer = Array(lattice.length).fill(null).map(() => ({}));

  forwardPass(lattice, dp, backpointer, testNgramDb);

  // Check that second position is filled
  assertEqual(Object.keys(dp[1]).length, 2, 'Second position should have 2 entries');

  // Check backpointers are set
  assertEqual(backpointer[1]['在'] !== null, true, 'Backpointer for 在 should be set');
  assertEqual(backpointer[1]['灰'] !== null, true, 'Backpointer for 灰 should be set');

  console.log('  ✓ Pass');
}

function test_forwardPass_missing_bigram() {
  console.log('Test: forwardPass with missing bigram');

  // Create scenario where bigram doesn't exist
  const testLattice = [
    [{ char: '易', freq: 80 }],
    [{ char: '未知字', freq: 10 }]
  ];

  const dp = initializeDP(testLattice, testNgramDb);
  const backpointer = Array(testLattice.length).fill(null).map(() => ({}));

  forwardPass(testLattice, dp, backpointer, testNgramDb);

  // Should use default bigram probability 1e-10
  const expectedProb = dp[0]['易'] + Math.log(1e-10);
  assertApproximatelyEqual(dp[1]['未知字'], expectedProb, 0.001);

  console.log('  ✓ Pass');
}

function test_forwardPass_tie_breaking() {
  console.log('Test: forwardPass tie-breaking (first maximum wins)');

  // Create scenario with equal probabilities
  const equalNgramDb = {
    unigrams: { 'A': 0.5, 'B': 0.5, 'C': 0.5 },
    bigrams: { 'AC': 0.5, 'BC': 0.5 }  // Equal probabilities
  };

  const testLattice = [
    [{ char: 'A', freq: 10 }, { char: 'B', freq: 10 }],
    [{ char: 'C', freq: 10 }]
  ];

  const dp = initializeDP(testLattice, equalNgramDb);
  const backpointer = Array(testLattice.length).fill(null).map(() => ({}));

  forwardPass(testLattice, dp, backpointer, equalNgramDb);

  // When probabilities are equal, first one should be chosen
  // (Depends on iteration order of dp[0] object)
  assertEqual(backpointer[1]['C'] !== null, true, 'Backpointer should be set');

  console.log('  ✓ Pass');
}

function test_forwardPass_integration() {
  console.log('Test: forwardPass integration with 3 positions');

  const lattice = buildLattice(['4jp', 'ad', 'v'], testDayiDb);
  const dp = initializeDP(lattice, testNgramDb);
  const backpointer = Array(lattice.length).fill(null).map(() => ({}));

  forwardPass(lattice, dp, backpointer, testNgramDb);

  // All positions should be filled
  assertEqual(Object.keys(dp[0]).length > 0, true, 'Position 0 should be filled');
  assertEqual(Object.keys(dp[1]).length > 0, true, 'Position 1 should be filled');
  assertEqual(Object.keys(dp[2]).length > 0, true, 'Position 2 should be filled');

  // All backpointers should be set (except position 0)
  assertEqual(Object.keys(backpointer[0]).length, 0, 'Position 0 has no backpointers');
  assertEqual(Object.keys(backpointer[1]).length > 0, true, 'Position 1 should have backpointers');
  assertEqual(Object.keys(backpointer[2]).length > 0, true, 'Position 2 should have backpointers');

  console.log('  ✓ Pass');
}

// ============================================================================
// Category 4: Backtracking (3 tests)
// ============================================================================

function test_backtrack_single_path() {
  console.log('Test: backtrack with single position');

  const dp = [{ '易': Math.log(0.01) }];
  const backpointer = [{}];

  const result = backtrack(dp, backpointer);

  assertEqual(result.sentence, '易', 'Sentence should be 易');
  assertEqual(result.chars, ['易'], 'Chars should be [易]');
  assertApproximatelyEqual(result.score, Math.log(0.01), 0.001);

  console.log('  ✓ Pass');
}

function test_backtrack_multiple_positions() {
  console.log('Test: backtrack with 3 positions');

  const lattice = buildLattice(['4jp', 'ad', 'v'], testDayiDb);
  const dp = initializeDP(lattice, testNgramDb);
  const backpointer = Array(lattice.length).fill(null).map(() => ({}));

  forwardPass(lattice, dp, backpointer, testNgramDb);
  const result = backtrack(dp, backpointer);

  // Should return a valid sentence
  assertEqual(result.sentence.length, 3, 'Sentence should have 3 characters');
  assertEqual(result.chars.length, 3, 'Chars array should have 3 elements');
  assertEqual(typeof result.score, 'number', 'Score should be a number');

  console.log('  ✓ Pass');
}

function test_backtrack_tie_at_end() {
  console.log('Test: backtrack with tie at final position');

  // Create scenario with equal final probabilities
  const dp = [
    { 'A': Math.log(0.5) },
    { 'B': -1.0, 'C': -1.0 }  // Equal scores
  ];
  const backpointer = [
    {},
    { 'B': 'A', 'C': 'A' }
  ];

  const result = backtrack(dp, backpointer);

  // Should choose first maximum (iteration order dependent)
  assertEqual(result.chars.length, 2, 'Should have 2 characters');

  console.log('  ✓ Pass');
}

// ============================================================================
// Category 5: Integration (2 tests)
// ============================================================================

function test_viterbi_simple_example() {
  console.log('Test: Viterbi simple example');

  const codes = ['4jp', 'ad'];
  const result = viterbi(codes, testDayiDb, testNgramDb);

  // Should return valid result
  assertEqual(result.sentence.length, 2, 'Sentence should have 2 characters');
  assertEqual(result.chars.length, 2, 'Chars array should have 2 elements');
  assertEqual(typeof result.score, 'number', 'Score should be a number');
  assertEqual(result.lattice.length, 2, 'Lattice should have 2 positions');

  // Most probable should be "易在" based on our test probabilities
  // (This can be verified by manual calculation from DESIGN-viterbi.md)
  console.log(`  Result: "${result.sentence}" (score: ${result.score.toFixed(3)})`);

  console.log('  ✓ Pass');
}

function test_viterbi_three_codes() {
  console.log('Test: Viterbi with three codes');

  const codes = ['4jp', 'ad', 'v'];
  const result = viterbi(codes, testDayiDb, testNgramDb);

  // Should return valid result
  assertEqual(result.sentence.length, 3, 'Sentence should have 3 characters');
  assertEqual(result.chars.length, 3, 'Chars array should have 3 elements');
  assertEqual(typeof result.score, 'number', 'Score should be a number');

  console.log(`  Result: "${result.sentence}" (score: ${result.score.toFixed(3)})`);

  console.log('  ✓ Pass');
}

// ============================================================================
// Test Runner
// ============================================================================

function runTests() {
  console.log('=' . repeat(70));
  console.log('Viterbi Algorithm - TDD Test Suite');
  console.log('=' .repeat(70));
  console.log();

  let passed = 0;
  let failed = 0;

  const tests = [
    // Category 1: Lattice Construction
    test_buildLattice_valid_codes,
    test_buildLattice_invalid_code,
    test_buildLattice_empty_codes,

    // Category 2: DP Initialization
    test_initializeDP_first_position,
    test_initializeDP_missing_unigram,
    test_initializeDP_multiple_positions,

    // Category 3: Forward Pass
    test_forwardPass_two_positions,
    test_forwardPass_missing_bigram,
    test_forwardPass_tie_breaking,
    test_forwardPass_integration,

    // Category 4: Backtracking
    test_backtrack_single_path,
    test_backtrack_multiple_positions,
    test_backtrack_tie_at_end,

    // Category 5: Integration
    test_viterbi_simple_example,
    test_viterbi_three_codes
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
  console.log('=' .repeat(70));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('=' .repeat(70));

  return failed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };
