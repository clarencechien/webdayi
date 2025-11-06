#!/usr/bin/env node

/**
 * WebDaYi Core Logic Tests - v3 with Pagination and Auto-select
 *
 * New features:
 * - Pagination with = key (cycle through pages when > 6 candidates)
 * - Auto-select first candidate when typing 3rd character
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

// Existing core tests
runner
  .describe('Database Loading')
  .it('should create a Map from database object', () => {
    const testDb = { "v": [{ "char": "大", "freq": 100 }] };
    const map = createDatabaseMap(testDb);
    runner.assert(map instanceof Map);
    runner.assertEqual(map.size, 1);
  });

runner
  .describe('Selection Key Mapping')
  .it('should map Space to index 0', () => {
    runner.assertEqual(getSelectionIndexFromKey(' '), 0);
  })
  .it('should map = to -1 (not a selection key)', () => {
    runner.assertEqual(getSelectionIndexFromKey('='), -1);
  });

// NEW: Pagination tests
runner
  .describe('Pagination System (NEW)')
  .it('should calculate correct total pages', () => {
    const candidates = Array.from({ length: 15 }, (_, i) => ({ char: String(i), freq: 100 - i }));
    const pages = getTotalPages(candidates);
    runner.assertEqual(pages, 3, '15 candidates should need 3 pages (6+6+3)');
  })
  .it('should calculate 1 page for ≤6 candidates', () => {
    const candidates = Array.from({ length: 6 }, (_, i) => ({ char: String(i), freq: 100 }));
    runner.assertEqual(getTotalPages(candidates), 1);
  })
  .it('should calculate 2 pages for 7-12 candidates', () => {
    const candidates = Array.from({ length: 12 }, (_, i) => ({ char: String(i), freq: 100 }));
    runner.assertEqual(getTotalPages(candidates), 2);
  })
  .it('should get correct candidates for page 1', () => {
    const candidates = Array.from({ length: 15 }, (_, i) => ({ char: String(i), freq: 100 - i }));
    const page1 = getCandidatesForPage(candidates, 0);
    runner.assertEqual(page1.length, 6);
    runner.assertEqual(page1[0].char, '0');
    runner.assertEqual(page1[5].char, '5');
  })
  .it('should get correct candidates for page 2', () => {
    const candidates = Array.from({ length: 15 }, (_, i) => ({ char: String(i), freq: 100 - i }));
    const page2 = getCandidatesForPage(candidates, 1);
    runner.assertEqual(page2.length, 6);
    runner.assertEqual(page2[0].char, '6');
    runner.assertEqual(page2[5].char, '11');
  })
  .it('should get correct candidates for last page (partial)', () => {
    const candidates = Array.from({ length: 15 }, (_, i) => ({ char: String(i), freq: 100 - i }));
    const page3 = getCandidatesForPage(candidates, 2);
    runner.assertEqual(page3.length, 3, 'Last page should have 3 candidates');
    runner.assertEqual(page3[0].char, '12');
    runner.assertEqual(page3[2].char, '14');
  })
  .it('should cycle to next page', () => {
    const nextPage = getNextPage(0, 3);
    runner.assertEqual(nextPage, 1);
  })
  .it('should cycle back to first page from last page', () => {
    const nextPage = getNextPage(2, 3);
    runner.assertEqual(nextPage, 0, 'Should cycle back to page 0');
  })
  .it('should check if pagination is needed', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ char: String(i), freq: 100 }));
    const few = Array.from({ length: 5 }, (_, i) => ({ char: String(i), freq: 100 }));
    runner.assert(needsPagination(many), 'Should need pagination for 10 candidates');
    runner.assert(!needsPagination(few), 'Should not need pagination for 5 candidates');
  });

// NEW: Auto-select tests
runner
  .describe('Auto-select on 3rd Character (NEW)')
  .it('should detect when auto-select is needed (2 chars → 3rd char)', () => {
    runner.assert(shouldAutoSelect('ab', 'c'), 'Typing 3rd char should trigger auto-select');
  })
  .it('should not auto-select on 1st or 2nd character', () => {
    runner.assert(!shouldAutoSelect('', 'a'), 'Should not auto-select on 1st char');
    runner.assert(!shouldAutoSelect('a', 'b'), 'Should not auto-select on 2nd char');
  })
  .it('should not auto-select on selection keys', () => {
    runner.assert(!shouldAutoSelect('ab', ' '), 'Space is selection key');
    runner.assert(!shouldAutoSelect('ab', "'"), 'Apostrophe is selection key');
    runner.assert(!shouldAutoSelect('ab', '='), '= is pagination key');
  })
  .it('should extract current and new code correctly', () => {
    const result = splitCodeForAutoSelect('ab', 'c');
    runner.assertEqual(result.currentCode, 'ab');
    runner.assertEqual(result.newCode, 'c');
  })
  .it('should handle auto-select with valid code', () => {
    const testMap = new Map([
      ['ab', [
        { char: '測', freq: 100 },
        { char: '試', freq: 90 }
      ]]
    ]);

    const result = performAutoSelect('ab', testMap);
    runner.assert(result.success, 'Auto-select should succeed');
    runner.assertEqual(result.selectedChar, '測', 'Should select first candidate');
  })
  .it('should handle auto-select with invalid code', () => {
    const testMap = new Map();
    const result = performAutoSelect('zz', testMap);
    runner.assert(!result.success, 'Auto-select should fail for invalid code');
  });

// Integration test with real data
runner
  .describe('Integration Test - Pagination with Real Data')
  .it('should handle codes with many candidates (ux: 61 candidates)', () => {
    const dbPath = path.join(__dirname, 'dayi_db.json');
    if (fs.existsSync(dbPath)) {
      const dbObject = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const map = createDatabaseMap(dbObject);

      if (map.has('ux')) {
        const candidates = queryCandidates(map, 'ux');
        console.log(`    \x1b[90mux has ${candidates.length} candidates\x1b[0m`);

        runner.assert(candidates.length > 6, 'Should have more than 6 candidates');

        const totalPages = getTotalPages(candidates);
        console.log(`    \x1b[90mTotal pages needed: ${totalPages}\x1b[0m`);

        const page1 = getCandidatesForPage(candidates, 0);
        runner.assertEqual(page1.length, 6, 'First page should have 6 candidates');

        const lastPage = getCandidatesForPage(candidates, totalPages - 1);
        runner.assert(lastPage.length > 0 && lastPage.length <= 6, 'Last page should have 1-6 candidates');

        console.log(`    \x1b[90mPage 1: ${page1.map(c => c.char).join(', ')}\x1b[0m`);
      }
    }
  });

// Summary
const success = runner.summary();
process.exit(success ? 0 : 1);
