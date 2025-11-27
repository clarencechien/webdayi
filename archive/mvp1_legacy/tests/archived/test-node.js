#!/usr/bin/env node

/**
 * Node.js Test Runner for WebDaYi Core Logic
 *
 * Run with: node test-node.js
 */

const fs = require('fs');
const path = require('path');

// Load core logic (we need to extract just the pure functions)
const core_logic = fs.readFileSync(path.join(__dirname, 'core_logic.js'), 'utf-8');

// Extract and eval the pure functions (not DOM-dependent)
eval(core_logic.replace(/if \(typeof document.*$/s, ''));  // Remove auto-init

// Test framework
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
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

// Run Tests
const runner = new TestRunner();

runner
  .describe('Database Loading')
  .it('should create a Map from database object', () => {
    const testDb = {
      "v": [{ "char": "大", "freq": 100 }],
      "a": [{ "char": "人", "freq": 100 }, { "char": "入", "freq": 99 }]
    };
    const map = createDatabaseMap(testDb);
    runner.assert(map instanceof Map, 'Should return a Map');
    runner.assertEqual(map.size, 2, 'Should have 2 entries');
    runner.assert(map.has('v'), 'Should have key "v"');
  })
  .it('should preserve candidate data', () => {
    const testDb = {
      "v": [{ "char": "大", "freq": 100 }]
    };
    const map = createDatabaseMap(testDb);
    const candidates = map.get('v');
    runner.assertEqual(candidates[0].char, '大', 'Should preserve character');
    runner.assertEqual(candidates[0].freq, 100, 'Should preserve frequency');
  });

runner
  .describe('Query Function')
  .it('should return candidates for valid code', () => {
    const testMap = new Map([
      ['v', [{ "char": "大", "freq": 100 }]]
    ]);
    const results = queryCandidates(testMap, 'v');
    runner.assertEqual(results.length, 1);
    runner.assertEqual(results[0].char, '大');
  })
  .it('should return empty array for invalid code', () => {
    const testMap = new Map();
    const results = queryCandidates(testMap, 'xyz');
    runner.assertDeepEqual(results, []);
  })
  .it('should handle empty code', () => {
    const testMap = new Map();
    const results = queryCandidates(testMap, '');
    runner.assertDeepEqual(results, []);
  });

runner
  .describe('Sort Function')
  .it('should sort by frequency descending', () => {
    const candidates = [
      { "char": "乙", "freq": 50 },
      { "char": "甲", "freq": 100 },
      { "char": "丙", "freq": 75 }
    ];
    const sorted = sortCandidatesByFreq(candidates);
    runner.assertEqual(sorted[0].char, '甲');
    runner.assertEqual(sorted[0].freq, 100);
    runner.assertEqual(sorted[2].freq, 50);
  })
  .it('should handle empty array', () => {
    const sorted = sortCandidatesByFreq([]);
    runner.assertDeepEqual(sorted, []);
  })
  .it('should not mutate original array', () => {
    const candidates = [
      { "char": "乙", "freq": 50 },
      { "char": "甲", "freq": 100 }
    ];
    const original = [...candidates];
    sortCandidatesByFreq(candidates);
    runner.assertDeepEqual(candidates, original);
  });

runner
  .describe('Render Function')
  .it('should generate HTML for candidates', () => {
    const candidates = [
      { "char": "大", "freq": 100 }
    ];
    const html = renderCandidatesHTML(candidates);
    runner.assert(html.includes('1.'), 'Should include number');
    runner.assert(html.includes('大'), 'Should include character');
  })
  .it('should handle empty candidates', () => {
    const html = renderCandidatesHTML([]);
    runner.assertEqual(html, '');
  })
  .it('should limit to 9 candidates', () => {
    const candidates = Array.from({ length: 15 }, (_, i) => ({
      char: String(i),
      freq: 100 - i
    }));
    const html = renderCandidatesHTML(candidates);
    const matches = html.match(/candidate-number">\d+\./g);
    runner.assertEqual(matches.length, 9, 'Should show max 9');
  });

// Integration test with real data
runner
  .describe('Integration Test (Real Data)')
  .it('should load and query real database', () => {
    const dbPath = path.join(__dirname, 'dayi_db.json');
    if (fs.existsSync(dbPath)) {
      const dbObject = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const map = createDatabaseMap(dbObject);

      // Test known mappings
      const vCandidates = queryCandidates(map, 'v');
      runner.assert(vCandidates.length > 0, 'Should have candidates for "v"');
      runner.assert(
        vCandidates.some(c => c.char === '大'),
        'Should include "大" for code "v"'
      );

      const aCandidates = queryCandidates(map, 'a');
      runner.assert(
        aCandidates.some(c => c.char === '人'),
        'Should include "人" for code "a"'
      );

      console.log(`    \x1b[90mDatabase has ${map.size} codes\x1b[0m`);
    } else {
      throw new Error('Database file not found');
    }
  });

// Summary
const success = runner.summary();
process.exit(success ? 0 : 1);
