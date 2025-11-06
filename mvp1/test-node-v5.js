#!/usr/bin/env node

/**
 * WebDaYi Core Logic Tests - v5 with Input Mode Toggle
 *
 * New features:
 * - Express mode toggle (hide everything except input/candidates/output)
 * - LocalStorage persistence for mode preference
 * - Keyboard shortcut support
 */

const fs = require('fs');
const path = require('path');

// Load core logic
const core_logic = fs.readFileSync(path.join(__dirname, 'core_logic.js'), 'utf-8');
// Remove the auto-initialize block at the end
const cleanedCode = core_logic.replace(/\/\/ Auto-initialize when DOM is ready[\s\S]*$/, '');
eval(cleanedCode);

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
// Input Mode Toggle Tests (NEW in v5)
// ============================================

runner
  .describe('Input Mode Toggle - Mode Management (NEW)')
  .it('should have default mode as "normal"', () => {
    const mode = getInputMode();
    runner.assertEqual(mode, 'normal', 'Default mode should be normal');
  })
  .it('should toggle between normal and express modes', () => {
    let mode = 'normal';
    mode = toggleInputMode(mode);
    runner.assertEqual(mode, 'express', 'Should toggle to express');

    mode = toggleInputMode(mode);
    runner.assertEqual(mode, 'normal', 'Should toggle back to normal');
  })
  .it('should validate mode values', () => {
    runner.assert(isValidInputMode('normal'), 'normal is valid');
    runner.assert(isValidInputMode('express'), 'express is valid');
    runner.assert(!isValidInputMode('invalid'), 'invalid is not valid');
    runner.assert(!isValidInputMode(''), 'empty is not valid');
  });

runner
  .describe('Input Mode Toggle - Storage (NEW)')
  .it('should save mode to storage format', () => {
    const storageKey = getInputModeStorageKey();
    runner.assertEqual(storageKey, 'webdayi_input_mode', 'Storage key should be correct');
  })
  .it('should format mode value for storage', () => {
    const normalValue = formatModeForStorage('normal');
    const expressValue = formatModeForStorage('express');
    runner.assertEqual(normalValue, 'normal', 'Should format normal correctly');
    runner.assertEqual(expressValue, 'express', 'Should format express correctly');
  })
  .it('should parse mode value from storage', () => {
    const normal = parseModeFromStorage('normal');
    const express = parseModeFromStorage('express');
    const invalid = parseModeFromStorage('invalid');
    const empty = parseModeFromStorage(null);

    runner.assertEqual(normal, 'normal', 'Should parse normal');
    runner.assertEqual(express, 'express', 'Should parse express');
    runner.assertEqual(invalid, 'normal', 'Should default invalid to normal');
    runner.assertEqual(empty, 'normal', 'Should default empty to normal');
  });

runner
  .describe('Input Mode Toggle - UI Class Management (NEW)')
  .it('should get correct body class for mode', () => {
    const normalClass = getBodyClassForMode('normal');
    const expressClass = getBodyClassForMode('express');

    runner.assertEqual(normalClass, '', 'Normal mode should have no class');
    runner.assertEqual(expressClass, 'express-mode', 'Express mode should have express-mode class');
  })
  .it('should determine if express mode from class', () => {
    runner.assert(isExpressModeClass('express-mode'), 'express-mode should be express');
    runner.assert(!isExpressModeClass(''), 'empty class should not be express');
    runner.assert(!isExpressModeClass('other-class'), 'other class should not be express');
  });

runner
  .describe('Input Mode Toggle - Mode Labels (NEW)')
  .it('should get correct label for mode', () => {
    const normalLabel = getModeLabel('normal');
    const expressLabel = getModeLabel('express');

    runner.assertEqual(normalLabel, '正常模式', 'Normal mode label in Chinese');
    runner.assertEqual(expressLabel, '專注模式', 'Express mode label in Chinese');
  })
  .it('should get correct toggle button text', () => {
    const fromNormal = getToggleButtonText('normal');
    const fromExpress = getToggleButtonText('express');

    runner.assertEqual(fromNormal, '切換至專注模式', 'Button text when in normal');
    runner.assertEqual(fromExpress, '切換至正常模式', 'Button text when in express');
  });

// ============================================
// Previous Tests (from v4)
// ============================================

runner
  .describe('Backspace Behavior - Auto-select Prevention')
  .it('should NOT auto-select when backspace reduces 2 chars to 1', () => {
    const result = shouldAutoSelectOnInput('ab', 'a');
    runner.assert(!result, 'Backspace should not trigger auto-select');
  })
  .it('should auto-select when adding 3rd char (for comparison)', () => {
    const result = shouldAutoSelectOnInput('ab', 'abc');
    runner.assert(result, 'Adding 3rd char should trigger auto-select');
  });

runner
  .describe('Backspace Behavior - Delete from Output Buffer')
  .it('should delete last character from output buffer', () => {
    const result = deleteLastCharFromOutput('測試文字');
    runner.assertEqual(result, '測試文', 'Should remove last character');
  })
  .it('should handle empty output', () => {
    const result = deleteLastCharFromOutput('');
    runner.assertEqual(result, '', 'Should remain empty');
  });

runner
  .describe('Database and Core Functions')
  .it('should create a Map from database object', () => {
    runner.assert(testMap instanceof Map, 'Should be a Map instance');
    runner.assert(testMap.size > 0, 'Should have entries');
  })
  .it('should map selection keys correctly', () => {
    runner.assertEqual(getSelectionIndexFromKey(' '), 0, 'Space = 1st');
    runner.assertEqual(getSelectionIndexFromKey('='), -1, '= is pagination');
  })
  .it('should calculate pagination correctly', () => {
    const candidates = Array.from({ length: 15 }, (_, i) => ({ char: String(i), freq: 100 - i }));
    runner.assertEqual(getTotalPages(candidates), 3, '15 candidates = 3 pages');
  })
  .it('should detect auto-select correctly', () => {
    runner.assert(shouldAutoSelect('ab', 'c'), '2 chars + 3rd = auto-select');
    runner.assert(!shouldAutoSelect('ab', ' '), 'Space is selection key');
  });

// Summary
runner.summary();

// Exit with appropriate code
process.exit(runner.failed > 0 ? 1 : 0);
