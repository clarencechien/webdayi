#!/usr/bin/env node

/**
 * WebDaYi Core Logic Tests - v6 with User Personalization
 *
 * New features (MVP1.7, MVP1.8, MVP1.9):
 * - Load user preference from localStorage (MVP1.7)
 * - Save user preference when selecting non-default candidate (MVP1.8)
 * - Prioritize user preference in candidate ordering (MVP1.9)
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

  assertArrayEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${message || 'Expected arrays equal'}\nExpected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
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
// User Personalization Tests (NEW in v6)
// ============================================

runner
  .describe('User Model - Storage Keys (MVP1.7)')
  .it('should have correct localStorage key', () => {
    const key = getUserModelStorageKey();
    runner.assertEqual(key, 'webDayi_UserModel', 'Storage key should be webDayi_UserModel');
  })
  .it('should create empty user model', () => {
    const model = createEmptyUserModel();
    runner.assert(model instanceof Map, 'Should be a Map');
    runner.assertEqual(model.size, 0, 'Should be empty');
  });

runner
  .describe('User Model - Load and Parse (MVP1.7)')
  .it('should parse valid JSON to Map', () => {
    const json = '{"4jp":["義","易"],"v":["夫","大","禾"]}';
    const model = parseUserModelFromStorage(json);

    runner.assert(model instanceof Map, 'Should be a Map');
    runner.assertEqual(model.size, 2, 'Should have 2 entries');
    runner.assertArrayEqual(model.get('4jp'), ['義','易'], '4jp should have correct order');
    runner.assertArrayEqual(model.get('v'), ['夫','大','禾'], 'v should have correct order');
  })
  .it('should handle empty JSON', () => {
    const model = parseUserModelFromStorage('{}');
    runner.assertEqual(model.size, 0, 'Should be empty Map');
  })
  .it('should handle null/invalid JSON', () => {
    const model1 = parseUserModelFromStorage(null);
    const model2 = parseUserModelFromStorage('invalid');
    runner.assertEqual(model1.size, 0, 'null should return empty Map');
    runner.assertEqual(model2.size, 0, 'invalid JSON should return empty Map');
  });

runner
  .describe('User Model - Save and Format (MVP1.8)')
  .it('should convert Map to JSON string', () => {
    const model = new Map();
    model.set('4jp', ['義','易']);
    model.set('v', ['夫','大']);

    const json = formatUserModelForStorage(model);
    const parsed = JSON.parse(json);

    runner.assertArrayEqual(parsed['4jp'], ['義','易'], '4jp should be correct');
    runner.assertArrayEqual(parsed['v'], ['夫','大'], 'v should be correct');
  })
  .it('should handle empty Map', () => {
    const model = new Map();
    const json = formatUserModelForStorage(model);
    runner.assertEqual(json, '{}', 'Empty Map should produce {}');
  });

runner
  .describe('User Model - Update Logic (MVP1.8)')
  .it('should move selected char to front', () => {
    const candidates = [
      { char: '易', freq: 100 },
      { char: '義', freq: 90 },
      { char: '宜', freq: 80 }
    ];

    // User selects index 1 (義)
    const newOrder = reorderBySelection(candidates, 1);

    runner.assertArrayEqual(newOrder, ['義','易','宜'], 'Selected char should be first');
  })
  .it('should handle first selection (no change needed)', () => {
    const candidates = [
      { char: '易', freq: 100 },
      { char: '義', freq: 90 }
    ];

    // User selects index 0 (易) - already first
    const newOrder = reorderBySelection(candidates, 0);

    runner.assertArrayEqual(newOrder, ['易','義'], 'Order should remain same');
  })
  .it('should handle last selection', () => {
    const candidates = [
      { char: '易', freq: 100 },
      { char: '義', freq: 90 },
      { char: '宜', freq: 80 }
    ];

    // User selects index 2 (宜)
    const newOrder = reorderBySelection(candidates, 2);

    runner.assertArrayEqual(newOrder, ['宜','易','義'], 'Last char should move to front');
  });

runner
  .describe('User Model - Apply Preferences (MVP1.9)')
  .it('should apply user preference to candidates', () => {
    const staticCandidates = [
      { char: '易', freq: 100 },
      { char: '義', freq: 90 },
      { char: '宜', freq: 80 }
    ];

    const userModel = new Map();
    userModel.set('4jp', ['義','宜','易']); // User prefers 義 first

    const reordered = applyUserPreference('4jp', staticCandidates, userModel);

    runner.assertEqual(reordered[0].char, '義', 'First should be 義 (user preference)');
    runner.assertEqual(reordered[1].char, '宜', 'Second should be 宜');
    runner.assertEqual(reordered[2].char, '易', 'Third should be 易');
  })
  .it('should use static order when no user preference exists', () => {
    const staticCandidates = [
      { char: '易', freq: 100 },
      { char: '義', freq: 90 }
    ];

    const userModel = new Map(); // Empty - no preference

    const reordered = applyUserPreference('4jp', staticCandidates, userModel);

    runner.assertEqual(reordered[0].char, '易', 'Should use static order');
    runner.assertEqual(reordered[1].char, '義', 'Should use static order');
  })
  .it('should handle partial user preference (some chars not in static)', () => {
    const staticCandidates = [
      { char: '易', freq: 100 },
      { char: '義', freq: 90 }
    ];

    const userModel = new Map();
    userModel.set('4jp', ['義','舊字','易']); // '舊字' not in static candidates

    const reordered = applyUserPreference('4jp', staticCandidates, userModel);

    runner.assertEqual(reordered[0].char, '義', 'Should apply valid user preference');
    runner.assertEqual(reordered[1].char, '易', 'Should include remaining static chars');
    runner.assertEqual(reordered.length, 2, 'Should not include non-existent chars');
  });

runner
  .describe('User Model - Integration')
  .it('should update model after selection', () => {
    const userModel = new Map();
    const candidates = [
      { char: '易', freq: 100 },
      { char: '義', freq: 90 }
    ];

    // User selects index 1 (義)
    updateUserModel('4jp', candidates, 1, userModel);

    runner.assert(userModel.has('4jp'), 'Should have entry for 4jp');
    runner.assertArrayEqual(userModel.get('4jp'), ['義','易'], 'Should reorder with 義 first');
  })
  .it('should update existing preference', () => {
    const userModel = new Map();
    userModel.set('4jp', ['義','易']); // Existing preference

    const candidates = [
      { char: '義', freq: 90 },
      { char: '易', freq: 100 },
      { char: '宜', freq: 80 }
    ];

    // User now selects index 2 (宜)
    updateUserModel('4jp', candidates, 2, userModel);

    runner.assertArrayEqual(userModel.get('4jp'), ['宜','義','易'], 'Should update with new order');
  });

// ============================================
// Previous Tests (from v5)
// ============================================

runner
  .describe('Input Mode Toggle')
  .it('should have default mode as "normal"', () => {
    runner.assertEqual(getInputMode(), 'normal', 'Default should be normal');
  })
  .it('should toggle between modes', () => {
    let mode = toggleInputMode('normal');
    runner.assertEqual(mode, 'express', 'Should toggle to express');
    mode = toggleInputMode(mode);
    runner.assertEqual(mode, 'normal', 'Should toggle back to normal');
  });

runner
  .describe('Core Functions')
  .it('should create Map from database', () => {
    runner.assert(testMap instanceof Map);
    runner.assert(testMap.size > 0);
  })
  .it('should map selection keys', () => {
    runner.assertEqual(getSelectionIndexFromKey(' '), 0);
    runner.assertEqual(getSelectionIndexFromKey('='), -1);
  });

// Summary
runner.summary();

// Exit with appropriate code
process.exit(runner.failed > 0 ? 1 : 0);
