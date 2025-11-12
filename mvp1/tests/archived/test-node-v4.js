#!/usr/bin/env node

/**
 * WebDaYi Core Logic Tests - v4 with Backspace UX
 *
 * New features:
 * - Backspace handling with smart behavior:
 *   1. 2 chars + backspace → 1 char (don't auto-select)
 *   2. 1 char + backspace → empty
 *   3. Empty input + backspace → delete from output buffer
 *   4. Continuous backspace → clear entire output buffer
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

  log(message) {
    console.log(`    \x1b[90m${message}\x1b[0m`);
    return this;
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message || 'Expected equal'}\nExpected ${expected}, got ${actual}`);
    }
  }

  summary() {
    console.log('\n' + '='.repeat(50));
    const total = this.passed + this.failed;
    if (this.failed === 0) {
      console.log(`\x1b[32m✓ All tests passed (${this.passed}/${total})\x1b[0m`);
    } else {
      console.log(`\x1b[31m✗ Some tests failed (${this.failed}/${total})\x1b[0m`);
    }
    console.log('='.repeat(50));
  }
}

const runner = new TestRunner();

// Load test database
const dbPath = path.join(__dirname, 'dayi_db.json');
const dbObject = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const testMap = createDatabaseMap(dbObject);

// ============================================
// Backspace UX Tests (NEW in v4)
// ============================================

runner
  .describe('Backspace Behavior - Auto-select Prevention (NEW)')
  .it('should NOT auto-select when backspace reduces 2 chars to 1', () => {
    // When user types "ab" then backspace, should NOT trigger auto-select
    const result = shouldAutoSelectOnInput('ab', 'a');
    runner.assert(!result, 'Backspace should not trigger auto-select');
  })
  .it('should auto-select when adding 3rd char (for comparison)', () => {
    // When user types "ab" then "c", SHOULD trigger auto-select
    const result = shouldAutoSelectOnInput('ab', 'abc');
    runner.assert(result, 'Adding 3rd char should trigger auto-select');
  })
  .it('should NOT auto-select when input becomes shorter', () => {
    const result = shouldAutoSelectOnInput('abc', 'ab');
    runner.assert(!result, 'Backspace should never trigger auto-select');
  });

runner
  .describe('Backspace Behavior - Delete from Output Buffer (NEW)')
  .it('should delete last character from output buffer', () => {
    const outputText = '測試文字';
    const result = deleteLastCharFromOutput(outputText);
    runner.assertEqual(result, '測試文', 'Should remove last character');
  })
  .it('should handle single character output', () => {
    const result = deleteLastCharFromOutput('測');
    runner.assertEqual(result, '', 'Should return empty string');
  })
  .it('should handle empty output', () => {
    const result = deleteLastCharFromOutput('');
    runner.assertEqual(result, '', 'Should remain empty');
  })
  .it('should handle multi-char deletion sequence', () => {
    let text = '測試';
    text = deleteLastCharFromOutput(text);
    runner.assertEqual(text, '測', 'First deletion');
    text = deleteLastCharFromOutput(text);
    runner.assertEqual(text, '', 'Second deletion');
    text = deleteLastCharFromOutput(text);
    runner.assertEqual(text, '', 'Third deletion (no effect)');
  });

runner
  .describe('Backspace Behavior - Should Handle Backspace Check (NEW)')
  .it('should detect when backspace should delete from output', () => {
    // Input empty, output has content → should delete from output
    const result = shouldDeleteFromOutput('', '測試');
    runner.assert(result, 'Should delete from output when input empty');
  })
  .it('should not delete from output when input has content', () => {
    // Input has content → should let default backspace work on input
    const result = shouldDeleteFromOutput('ab', '測試');
    runner.assert(!result, 'Should not delete from output when input has content');
  })
  .it('should not delete when both input and output are empty', () => {
    // Both empty → no-op
    const result = shouldDeleteFromOutput('', '');
    runner.assert(!result, 'Should not delete when output is empty');
  });

// ============================================
// Previous Tests (from v3)
// ============================================

runner
  .describe('Database Loading')
  .it('should create a Map from database object', () => {
    runner.assert(testMap instanceof Map, 'Should be a Map instance');
    runner.assert(testMap.size > 0, 'Should have entries');
  });

runner
  .describe('Selection Key Mapping')
  .it('should map Space to index 0', () => {
    const index = getSelectionIndexFromKey(' ');
    runner.assertEqual(index, 0, 'Space should select 1st candidate');
  })
  .it('should map = to -1 (not a selection key)', () => {
    const index = getSelectionIndexFromKey('=');
    runner.assertEqual(index, -1, '= is pagination key, not selection');
  });

runner
  .describe('Pagination System')
  .it('should calculate correct total pages', () => {
    const candidates = Array.from({ length: 15 }, (_, i) => ({ char: String(i), freq: 100 - i }));
    const pages = getTotalPages(candidates);
    runner.assertEqual(pages, 3, '15 candidates should need 3 pages (6+6+3)');
  })
  .it('should check if pagination is needed', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ char: String(i), freq: 100 - i }));
    const few = Array.from({ length: 3 }, (_, i) => ({ char: String(i), freq: 100 - i }));
    runner.assert(needsPagination(many), '10 candidates need pagination');
    runner.assert(!needsPagination(few), '3 candidates do not need pagination');
  });

runner
  .describe('Auto-select on 3rd Character')
  .it('should detect when auto-select is needed (2 chars → 3rd char)', () => {
    runner.assert(shouldAutoSelect('ab', 'c'), 'Typing 3rd char should trigger auto-select');
  })
  .it('should not auto-select on selection keys', () => {
    runner.assert(!shouldAutoSelect('ab', ' '), 'Space is selection key');
    runner.assert(!shouldAutoSelect('ab', '='), '= is pagination key');
  });

// Summary
runner.summary();

// Exit with appropriate code
process.exit(runner.failed > 0 ? 1 : 0);
