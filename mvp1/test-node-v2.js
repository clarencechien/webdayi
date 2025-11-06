#!/usr/bin/env node

/**
 * WebDaYi Core Logic Tests - Updated for New Selection Keys
 *
 * Tests for the fixed selection behavior:
 * - 0-9 are input characters (NOT selection keys)
 * - Space selects 1st candidate
 * - ', [, ], -, \ for quick selection (2nd-6th)
 */

const fs = require('fs');
const path = require('path');

// Load core logic
const core_logic = fs.readFileSync(path.join(__dirname, 'core_logic.js'), 'utf-8');
eval(core_logic.replace(/if \(typeof document.*$/s, ''));

// Test framework
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  describe(suiteName) {
    console.log(`\n\x1b[1m${suiteName}\x1b[0m`);
    return this;
  }

  it(testName, testFn) {
    try {
      testFn();
      this.passed++;
      console.log(`  \x1b[32m✓\x1b[0m ${testName}`);
    } catch (error) {
      this.failed++;
      console.log(`  \x1b[31m✗\x1b[0m ${testName}`);
      console.log(`    \x1b[90m${error.message}\x1b[0m`);
    }
    return this;
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertDeepEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(message || `Expected ${expectedStr}, got ${actualStr}`);
    }
  }

  summary() {
    const total = this.passed + this.failed;
    console.log(`\n${'='.repeat(50)}`);
    if (this.failed === 0) {
      console.log(`\x1b[32m✓ All tests passed (${this.passed}/${total})\x1b[0m`);
    } else {
      console.log(`\x1b[31m✗ Some tests failed (${this.failed}/${total})\x1b[0m`);
    }
    console.log(`${'='.repeat(50)}\n`);
    return this.failed === 0;
  }
}

const runner = new TestRunner();

// Existing tests (should still pass)
runner
  .describe('Database Loading')
  .it('should create a Map from database object', () => {
    const testDb = {
      "v": [{ "char": "大", "freq": 100 }],
      "a": [{ "char": "人", "freq": 100 }]
    };
    const map = createDatabaseMap(testDb);
    runner.assert(map instanceof Map);
    runner.assertEqual(map.size, 2);
  })
  .it('should preserve candidate data', () => {
    const testDb = { "v": [{ "char": "大", "freq": 100 }] };
    const map = createDatabaseMap(testDb);
    runner.assertEqual(map.get('v')[0].char, '大');
  });

runner
  .describe('Query Function')
  .it('should return candidates for valid code', () => {
    const testMap = new Map([['v', [{ "char": "大", "freq": 100 }]]]);
    const results = queryCandidates(testMap, 'v');
    runner.assertEqual(results[0].char, '大');
  })
  .it('should return empty array for invalid code', () => {
    const testMap = new Map();
    const results = queryCandidates(testMap, 'xyz');
    runner.assertDeepEqual(results, []);
  });

runner
  .describe('Sort Function')
  .it('should sort by frequency descending', () => {
    const candidates = [
      { "char": "乙", "freq": 50 },
      { "char": "甲", "freq": 100 }
    ];
    const sorted = sortCandidatesByFreq(candidates);
    runner.assertEqual(sorted[0].char, '甲');
    runner.assertEqual(sorted[0].freq, 100);
  });

// NEW TESTS for selection key mapping
runner
  .describe('Selection Key Mapping (NEW)')
  .it('should map Space to candidate index 0', () => {
    const index = getSelectionIndexFromKey(' ');
    runner.assertEqual(index, 0, 'Space should select 1st candidate');
  })
  .it('should map apostrophe to candidate index 1', () => {
    const index = getSelectionIndexFromKey("'");
    runner.assertEqual(index, 1, "' should select 2nd candidate");
  })
  .it('should map [ to candidate index 2', () => {
    const index = getSelectionIndexFromKey('[');
    runner.assertEqual(index, 2, '[ should select 3rd candidate');
  })
  .it('should map ] to candidate index 3', () => {
    const index = getSelectionIndexFromKey(']');
    runner.assertEqual(index, 3, '] should select 4th candidate');
  })
  .it('should map - to candidate index 4', () => {
    const index = getSelectionIndexFromKey('-');
    runner.assertEqual(index, 4, '- should select 5th candidate');
  })
  .it('should map \\ to candidate index 5', () => {
    const index = getSelectionIndexFromKey('\\');
    runner.assertEqual(index, 5, '\\ should select 6th candidate');
  })
  .it('should return -1 for non-selection keys', () => {
    runner.assertEqual(getSelectionIndexFromKey('a'), -1);
    runner.assertEqual(getSelectionIndexFromKey('1'), -1);
    runner.assertEqual(getSelectionIndexFromKey('0'), -1);
    runner.assertEqual(getSelectionIndexFromKey('9'), -1);
  });

// NEW TESTS for input character validation
runner
  .describe('Input Character Validation (NEW)')
  .it('should allow 0-9 as input characters', () => {
    runner.assert(isValidInputChar('0'), '0 should be valid input');
    runner.assert(isValidInputChar('5'), '5 should be valid input');
    runner.assert(isValidInputChar('9'), '9 should be valid input');
  })
  .it('should allow a-z as input characters', () => {
    runner.assert(isValidInputChar('a'));
    runner.assert(isValidInputChar('z'));
  })
  .it('should allow common punctuation as input', () => {
    runner.assert(isValidInputChar(','));
    runner.assert(isValidInputChar('.'));
    runner.assert(isValidInputChar(';'));
  })
  .it('should reject selection keys as input', () => {
    runner.assert(!isValidInputChar(' '), 'Space is selection, not input');
    runner.assert(!isValidInputChar("'"), "' is selection, not input");
    runner.assert(!isValidInputChar('['), '[ is selection, not input');
  });

// Integration test with real data including number codes
runner
  .describe('Integration Test - Codes with Numbers')
  .it('should handle codes with numbers (e.g., t0, t1)', () => {
    const dbPath = path.join(__dirname, 'dayi_db.json');
    if (fs.existsSync(dbPath)) {
      const dbObject = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const map = createDatabaseMap(dbObject);

      // Test code with number
      if (map.has('t0')) {
        const results = queryCandidates(map, 't0');
        runner.assert(results.length > 0, 't0 should have candidates');
        console.log(`    \x1b[90mt0 → ${results.slice(0,3).map(c => c.char).join(', ')}\x1b[0m`);
      }

      if (map.has('t1')) {
        const results = queryCandidates(map, 't1');
        runner.assert(results.length > 0, 't1 should have candidates');
        console.log(`    \x1b[90mt1 → ${results.slice(0,3).map(c => c.char).join(', ')}\x1b[0m`);
      }
    }
  });

// Summary
const success = runner.summary();
process.exit(success ? 0 : 1);
