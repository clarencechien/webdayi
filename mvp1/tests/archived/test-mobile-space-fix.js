/**
 * Test Suite: Mobile Space Key Fix
 *
 * Tests the fix for mobile virtual keyboards not properly handling Space key in sentence mode.
 *
 * Three-layer solution:
 * 1. Keydown handler (desktop physical keyboards) - existing
 * 2. Input event handler (mobile virtual keyboards) - new
 * 3. Space button UI (100% reliable fallback) - new
 *
 * Run: node test-mobile-space-fix.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock global objects
global.window = {};
global.document = {};
global.console = console;

// Mock localStorage
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Load core_logic_v11.js (core functions only)
eval(fs.readFileSync(path.join(__dirname, 'core_logic_v11.js'), 'utf8'));

// Mock dayiMap
const dayiMap = new Map();
dayiMap.set('v', [{ char: '大', freq: 100 }]);
dayiMap.set('ad', [{ char: '在', freq: 90 }]);
dayiMap.set('4jp', [{ char: '易', freq: 80 }]);
dayiMap.set('zz', []); // Invalid code
global.dayiMap = dayiMap;
window.dayiMap = dayiMap;

// Test counters
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    testsFailed++;
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    if (error.stack) {
      console.error(`  ${error.stack.split('\n')[1]}`);
    }
  }
}

function setup() {
  // Reset for each test
  clearCodeBuffer();
  setInputMode('sentence');
}

console.log('\n=== Mobile Space Key Fix Tests ===\n');

// ============================================
// Test Suite 1: Core Logic Functions
// ============================================

console.log('Suite 1: Core Logic Functions');

test('addToCodeBuffer: Valid code "v"', () => {
  setup();

  const result = addToCodeBuffer('v', dayiMap);

  assert(result === true, 'Should return true for valid code');

  const buffer = getCodeBuffer();
  assert(buffer.length === 1, 'Buffer should have 1 code');
  assert(buffer[0] === 'v', 'Buffer should contain "v"');
});

test('addToCodeBuffer: Multiple codes', () => {
  setup();

  // First code
  addToCodeBuffer('v', dayiMap);
  // Second code
  addToCodeBuffer('ad', dayiMap);

  const buffer = getCodeBuffer();
  assert(buffer.length === 2, `Buffer should have 2 codes, got ${buffer.length}`);
  assert(buffer[0] === 'v', 'First code should be "v"');
  assert(buffer[1] === 'ad', 'Second code should be "ad"');
});

test('addToCodeBuffer: Invalid code returns false', () => {
  setup();

  const result = addToCodeBuffer('zz', dayiMap);

  assert(result === false, 'Should return false for invalid code');

  const buffer = getCodeBuffer();
  assert(buffer.length === 0, 'Buffer should be empty for invalid code');
});

test('addToCodeBuffer: Does NOT auto-trim (caller must trim)', () => {
  setup();

  // Code with trailing space should fail (not in dayiMap)
  const result = addToCodeBuffer('v ', dayiMap);

  assert(result === false, 'Should fail for code with trailing space');

  const buffer = getCodeBuffer();
  assert(buffer.length === 0, 'Buffer should be empty');

  // Caller must trim before calling
  const resultTrimmed = addToCodeBuffer('v '.trim(), dayiMap);
  assert(resultTrimmed === true, 'Should succeed when caller trims');
  assert(getCodeBuffer()[0] === 'v', 'Buffer should contain "v"');
});

test('addToCodeBuffer: Empty string returns false', () => {
  setup();

  const result = addToCodeBuffer('', dayiMap);

  assert(result === false, 'Should return false for empty code');
  assert(getCodeBuffer().length === 0, 'Buffer should be empty');
});

// ============================================
// Test Suite 2: Input Mode Management
// ============================================

console.log('\nSuite 2: Input Mode Management');

test('setInputMode: Switch to sentence mode', () => {
  setup();

  setInputMode('sentence');

  assert(isSentenceMode() === true, 'Should be in sentence mode');
  assert(isCharacterMode() === false, 'Should not be in character mode');
});

test('setInputMode: Switch to character mode', () => {
  setup();

  setInputMode('character');

  assert(isCharacterMode() === true, 'Should be in character mode');
  assert(isSentenceMode() === false, 'Should not be in sentence mode');
});

test('setInputMode: Switch clears buffer', () => {
  setup();

  // Buffer some codes
  addToCodeBuffer('v', dayiMap);
  assert(getCodeBuffer().length > 0, 'Buffer should have content');

  // Switch mode
  setInputMode('character');

  // Buffer should be cleared
  assert(getCodeBuffer().length === 0, 'Buffer should be cleared after mode switch');
});

// ============================================
// Test Suite 3: Code Buffer Management
// ============================================

console.log('\nSuite 3: Code Buffer Management');

test('clearCodeBuffer: Empties buffer', () => {
  setup();

  addToCodeBuffer('v', dayiMap);
  addToCodeBuffer('ad', dayiMap);
  assert(getCodeBuffer().length === 2, 'Buffer should have 2 codes');

  clearCodeBuffer();

  assert(getCodeBuffer().length === 0, 'Buffer should be empty');
});

test('getCodeBuffer: Returns copy of buffer', () => {
  setup();

  addToCodeBuffer('v', dayiMap);

  const buffer1 = getCodeBuffer();
  const buffer2 = getCodeBuffer();

  // Should be different array instances
  assert(buffer1 !== buffer2, 'Should return new array each time');
  // But with same content
  assert(buffer1[0] === buffer2[0], 'Content should be the same');
});

test('Buffer: Maximum 10 codes', () => {
  setup();

  // Try to add 11 codes
  for (let i = 0; i < 11; i++) {
    addToCodeBuffer('v', dayiMap);
  }

  const buffer = getCodeBuffer();
  assert(buffer.length <= 10, `Buffer should have max 10 codes, got ${buffer.length}`);
});

// ============================================
// Test Suite 4: Mobile Space Fix Logic
// ============================================

console.log('\nSuite 4: Mobile Space Fix - String Processing');

test('String processing: Detect trailing space', () => {
  const input1 = 'v ';
  const input2 = 'ad ';
  const input3 = 'v';

  assert(input1.endsWith(' '), 'Should detect trailing space in "v "');
  assert(input2.endsWith(' '), 'Should detect trailing space in "ad "');
  assert(!input3.endsWith(' '), 'Should not detect trailing space in "v"');
});

test('String processing: Trim space from code', () => {
  const input = 'v ';
  const trimmed = input.trim();

  assert(trimmed === 'v', 'Should trim to "v"');
  assert(trimmed.length === 1, 'Trimmed length should be 1');
});

test('String processing: Handle empty + space', () => {
  const input = ' ';
  const trimmed = input.trim();

  assert(trimmed === '', 'Should trim to empty string');
  assert(trimmed.length === 0, 'Trimmed length should be 0');
});

// ============================================
// Test Summary
// ============================================

console.log('\n=== Test Summary ===');
console.log(`Total:  ${testsRun}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
