#!/usr/bin/env node

/**
 * Test Suite v7 - Auto-Select with User Preferences Bug Fix
 *
 * This test suite focuses on testing the bug where auto-select
 * doesn't respect user preferences.
 *
 * Bug Description:
 * - User selects non-default candidate (e.g., "到" instead of "互" for "en")
 * - User preference should remember this
 * - But auto-select (typing 2 chars + 3rd char) uses original order
 * - Manual selection (Space key) works correctly
 *
 * Root Cause:
 * - performAutoSelect() doesn't apply user preferences
 * - Only uses static frequency sorting
 */

// Simple test runner
class TestRunner {
  constructor() {
    this.tests = [];
    this.currentSuite = '';
  }

  describe(suiteName) {
    this.currentSuite = suiteName;
    console.log(`\n\x1b[1m${suiteName}\x1b[0m`);
    return this;
  }

  it(testName, testFn) {
    this.tests.push({ suite: this.currentSuite, name: testName, fn: testFn });
    try {
      testFn();
      console.log(`  \x1b[32m✓\x1b[0m ${testName}`);
    } catch (error) {
      console.log(`  \x1b[31m✗\x1b[0m ${testName}`);
      console.log(`    \x1b[31mError: ${error.message}\x1b[0m`);
      throw error;
    }
    return this;
  }

  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`${message}\n    Expected: ${expected}\n    Actual: ${actual}`);
    }
  }

  assertDeepEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(`${message}\n    Expected: ${expectedStr}\n    Actual: ${actualStr}`);
    }
  }

  assertTrue(value, message = '') {
    if (!value) {
      throw new Error(`${message}\n    Expected: true\n    Actual: ${value}`);
    }
  }

  assertFalse(value, message = '') {
    if (value) {
      throw new Error(`${message}\n    Expected: false\n    Actual: ${value}`);
    }
  }

  run() {
    const passed = this.tests.length;
    console.log('\n' + '='.repeat(50));
    console.log(`\x1b[32m✓ All tests passed (${passed}/${passed})\x1b[0m`);
    console.log('='.repeat(50));
  }
}

const runner = new TestRunner();

// Load the core logic
eval(require('fs').readFileSync('./core_logic.js', 'utf8'));

// ============================================================================
// Test Suite: Auto-Select with User Preferences Bug
// ============================================================================

runner
  .describe('Auto-Select Bug - Setup (Reproduce Issue)')
  .it('should have performAutoSelect function', () => {
    runner.assertEqual(typeof performAutoSelect, 'function', 'performAutoSelect should be a function');
  })
  .it('should have applyUserPreference function', () => {
    runner.assertEqual(typeof applyUserPreference, 'function', 'applyUserPreference should be a function');
  });

runner
  .describe('Auto-Select Bug - Reproduce the Bug')
  .it('performAutoSelect WITHOUT user preferences returns default order', () => {
    // Simulate: en code has candidates ["互", "到", "其他"]
    const testMap = new Map();
    testMap.set('en', [
      { char: '互', freq: 100 },  // Default first
      { char: '到', freq: 90 },   // User prefers this
      { char: '五', freq: 80 }
    ]);

    const result = performAutoSelect('en', testMap);

    runner.assertTrue(result.success, 'Should successfully auto-select');
    runner.assertEqual(result.selectedChar, '互', 'BUG: Returns default "互" instead of user preference "到"');
  })
  .it('applyUserPreference correctly reorders candidates', () => {
    const staticCandidates = [
      { char: '互', freq: 100 },
      { char: '到', freq: 90 },
      { char: '五', freq: 80 }
    ];

    const userModel = new Map();
    userModel.set('en', ['到', '互', '五']); // User prefers 到 first

    const reordered = applyUserPreference('en', staticCandidates, userModel);

    runner.assertEqual(reordered[0].char, '到', 'First should be user preference "到"');
    runner.assertEqual(reordered[1].char, '互', 'Second should be "互"');
    runner.assertEqual(reordered[2].char, '五', 'Third should be "五"');
  });

runner
  .describe('Auto-Select Bug - Test Fixed performAutoSelect')
  .it('performAutoSelect WITH user preferences should return user preference', () => {
    const testMap = new Map();
    testMap.set('en', [
      { char: '互', freq: 100 },
      { char: '到', freq: 90 },
      { char: '五', freq: 80 }
    ]);

    const userModel = new Map();
    userModel.set('en', ['到', '互', '五']);

    // Now test the FIXED version
    const result = performAutoSelect('en', testMap, userModel);

    runner.assertTrue(result.success, 'Should successfully auto-select');
    runner.assertEqual(result.selectedChar, '到', 'FIXED: Should return user preference "到"');
  })
  .it('performAutoSelect without user model falls back to default', () => {
    const testMap = new Map();
    testMap.set('ab', [
      { char: '大', freq: 100 },
      { char: '小', freq: 90 }
    ]);

    // No user model provided
    const result = performAutoSelect('ab', testMap, null);

    runner.assertTrue(result.success, 'Should successfully auto-select');
    runner.assertEqual(result.selectedChar, '大', 'Should fall back to default order');
  })
  .it('performAutoSelect with empty user model falls back to default', () => {
    const testMap = new Map();
    testMap.set('cd', [
      { char: '中', freq: 100 },
      { char: '央', freq: 90 }
    ]);

    const emptyUserModel = new Map();

    const result = performAutoSelect('cd', testMap, emptyUserModel);

    runner.assertTrue(result.success, 'Should successfully auto-select');
    runner.assertEqual(result.selectedChar, '中', 'Should fall back to default when no preference');
  });

runner
  .describe('Auto-Select Bug - Golden Path Test Cases')
  .it('golden path: user selects 2nd candidate, auto-select uses it next time', () => {
    const testMap = new Map();
    testMap.set('xy', [
      { char: '一', freq: 100 },
      { char: '二', freq: 90 },
      { char: '三', freq: 80 }
    ]);

    // Step 1: User selects 2nd candidate (index 1)
    const userModel = new Map();
    const candidates = [
      { char: '一', freq: 100 },
      { char: '二', freq: 90 },
      { char: '三', freq: 80 }
    ];
    updateUserModel('xy', candidates, 1, userModel);

    // Step 2: Auto-select should use user preference
    const result = performAutoSelect('xy', testMap, userModel);

    runner.assertTrue(result.success, 'Should auto-select');
    runner.assertEqual(result.selectedChar, '二', 'Should auto-select user preference "二"');
  })
  .it('golden path: user selects 3rd candidate multiple times', () => {
    const testMap = new Map();
    testMap.set('zz', [
      { char: 'A', freq: 100 },
      { char: 'B', freq: 90 },
      { char: 'C', freq: 80 }
    ]);

    const userModel = new Map();
    const candidates = [
      { char: 'A', freq: 100 },
      { char: 'B', freq: 90 },
      { char: 'C', freq: 80 }
    ];

    // User selects C (index 2)
    updateUserModel('zz', candidates, 2, userModel);

    const result = performAutoSelect('zz', testMap, userModel);

    runner.assertEqual(result.selectedChar, 'C', 'Should auto-select "C"');
  });

runner
  .describe('Auto-Select Bug - Edge Cases')
  .it('edge case: invalid code returns failure', () => {
    const testMap = new Map();
    const userModel = new Map();

    const result = performAutoSelect('invalid', testMap, userModel);

    runner.assertFalse(result.success, 'Should fail for invalid code');
    runner.assertEqual(result.selectedChar, '', 'Should return empty string');
  })
  .it('edge case: user preference has char not in static DB', () => {
    const testMap = new Map();
    testMap.set('aa', [
      { char: 'X', freq: 100 },
      { char: 'Y', freq: 90 }
    ]);

    const userModel = new Map();
    // User preference includes 'Z' which doesn't exist in static DB
    userModel.set('aa', ['Z', 'Y', 'X']);

    const result = performAutoSelect('aa', testMap, userModel);

    runner.assertTrue(result.success, 'Should succeed');
    // Should return first available char from user preference that exists in DB
    runner.assertEqual(result.selectedChar, 'Y', 'Should return "Y" (first valid from user pref)');
  })
  .it('edge case: user preference is empty array', () => {
    const testMap = new Map();
    testMap.set('bb', [
      { char: 'M', freq: 100 },
      { char: 'N', freq: 90 }
    ]);

    const userModel = new Map();
    userModel.set('bb', []); // Empty preference

    const result = performAutoSelect('bb', testMap, userModel);

    runner.assertEqual(result.selectedChar, 'M', 'Should fall back to default');
  })
  .it('edge case: code has only one candidate', () => {
    const testMap = new Map();
    testMap.set('qq', [
      { char: 'Q', freq: 100 }
    ]);

    const userModel = new Map();
    userModel.set('qq', ['Q']);

    const result = performAutoSelect('qq', testMap, userModel);

    runner.assertEqual(result.selectedChar, 'Q', 'Should return single candidate');
  });

runner
  .describe('Auto-Select Bug - Integration Test')
  .it('integration: full workflow with user preference', () => {
    // Simulate full workflow
    const testMap = new Map();
    testMap.set('tt', [
      { char: '天', freq: 100 },
      { char: '田', freq: 90 },
      { char: '甜', freq: 80 }
    ]);

    const userModel = createEmptyUserModel();

    // Step 1: User queries 'tt'
    const candidates1 = queryCandidates(testMap, 'tt');
    const sorted1 = sortCandidatesByFreq(candidates1);
    runner.assertEqual(sorted1[0].char, '天', 'Default first is 天');

    // Step 2: User selects 2nd candidate 田 (index 1)
    updateUserModel('tt', sorted1, 1, userModel);

    // Step 3: User queries 'tt' again (should see user preference)
    const candidates2 = queryCandidates(testMap, 'tt');
    const sorted2 = sortCandidatesByFreq(candidates2);
    const withPreference = applyUserPreference('tt', sorted2, userModel);
    runner.assertEqual(withPreference[0].char, '田', 'User preference applied: 田 first');

    // Step 4: Auto-select should use user preference
    const autoResult = performAutoSelect('tt', testMap, userModel);
    runner.assertEqual(autoResult.selectedChar, '田', 'Auto-select uses user preference 田');
  });

runner
  .describe('Previous Tests - Ensure No Regression')
  .it('should still pass: create database map', () => {
    const testDb = {
      'v': [{ char: '大', freq: 100 }]
    };
    const map = createDatabaseMap(testDb);
    runner.assertEqual(map.size, 1, 'Map should have 1 entry');
    runner.assertTrue(map.has('v'), 'Map should have key "v"');
  })
  .it('should still pass: selection key mapping', () => {
    runner.assertEqual(getSelectionIndexFromKey(' '), 0, 'Space maps to 0');
    runner.assertEqual(getSelectionIndexFromKey("'"), 1, "' maps to 1");
  });

// Run all tests
try {
  runner.run();
  process.exit(0);
} catch (error) {
  console.log('\n\x1b[31m✗ Tests failed\x1b[0m');
  process.exit(1);
}
