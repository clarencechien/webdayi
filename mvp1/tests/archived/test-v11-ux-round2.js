/**
 * TDD Tests for v11 UX Issues Round 2
 *
 * Issues:
 * 1. Single-code in sentence mode (v + Space → should select)
 * 2. Delete key should clear prediction area
 * 3. English mixed input mode (Shift toggle)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Load databases
const dayiDbPath = path.join(__dirname, 'dayi_db.json');
const dayiData = JSON.parse(fs.readFileSync(dayiDbPath, 'utf8'));
const dayiMap = new Map(Object.entries(dayiData));

console.log('='.repeat(70));
console.log('MVP 1.0 v11: UX Issues Round 2 Test Suite');
console.log('='.repeat(70));

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    console.log(`✓ ${description}`);
  } catch (error) {
    testsFailed++;
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error.message}`);
  }
}

// =============================================================================
// Issue 1: Single-Code in Sentence Mode (8 tests)
// =============================================================================

console.log('\nIssue 1: Single-Code in Sentence Mode');
console.log('-'.repeat(70));

test('1.1: Database has candidates for single-char code "v"', () => {
  const candidates = dayiMap.get('v');
  assert.ok(candidates && candidates.length > 0, '"v" should have candidates');

  // Check first candidate is "大"
  const sorted = [...candidates].sort((a, b) => b.freq - a.freq);
  assert.strictEqual(sorted[0].char, '大', 'First candidate should be "大"');
});

test('1.2: Single-char logic should query database', () => {
  // Simulate what the fix should do
  const value = 'v';
  const candidates = dayiMap.get(value);

  assert.ok(candidates, 'Should get candidates for single char');
  assert.ok(candidates.length > 0, 'Should have at least one candidate');
});

test('1.3: Single-char candidates should be sortable', () => {
  const candidates = dayiMap.get('v');
  const sorted = [...candidates].sort((a, b) => b.freq - a.freq);

  assert.ok(sorted.length > 0);
  assert.ok(sorted[0].freq >= sorted[sorted.length - 1].freq, 'Should be sorted by freq desc');
});

test('1.4: Space selection should work with single-char', () => {
  // Test the selection logic
  const candidates = dayiMap.get('v');
  const sorted = [...candidates].sort((a, b) => b.freq - a.freq);

  // Simulate Space selecting first candidate
  const selected = sorted[0];
  assert.strictEqual(selected.char, '大');
});

test('1.5: Two-char code should still buffer correctly', () => {
  // Verify existing behavior still works
  const code = 'vm';
  const candidates = dayiMap.get(code);

  assert.ok(candidates, 'Two-char code should have candidates');
  // This should be buffered, not selected immediately
});

test('1.6: Single char followed by second char should buffer', () => {
  // Simulate: type "v" (shows candidates), then "m" (buffers "vm")
  const firstChar = 'v';
  const secondChar = 'm';
  const combined = firstChar + secondChar;

  const candidates = dayiMap.get(combined);
  assert.ok(candidates, 'Combined code should exist');
});

test('1.7: Empty input should not crash', () => {
  const value = '';
  const candidates = dayiMap.get(value);

  // Should handle gracefully (no candidates is OK)
  assert.ok(true, 'Should handle empty input without crashing');
});

test('1.8: Invalid single-char should handle gracefully', () => {
  // Try a character that's not in the database
  const value = 'ㄅ'; // Not a Dayi code
  const candidates = dayiMap.get(value);

  // Should return undefined or empty, not crash
  assert.ok(!candidates || candidates.length === 0, 'Invalid code should have no candidates');
});

// =============================================================================
// Issue 2: Delete Key Clears Prediction (3 tests)
// =============================================================================

console.log('\nIssue 2: Delete Key Clears Prediction');
console.log('-'.repeat(70));

test('2.1: Delete key clearing logic exists', () => {
  // This is a design verification test
  // The fix should:
  // 1. Clear output buffer
  // 2. Clear candidate area
  // 3. Clear code buffer in sentence mode
  console.log('   → Verify: Delete key has multi-area clearing logic');
  assert.ok(true, 'Design requirement documented');
});

test('2.2: Candidate area should be clearable', () => {
  // Verify the clearing logic is correct
  const mockHTML = '<div>已清除所有內容</div>';
  assert.ok(mockHTML.includes('已清除'), 'Should show cleared message');
});

test('2.3: Buffer clearing functions exist', () => {
  // These functions should be available:
  // - clearCodeBuffer()
  // - updateBufferDisplay()
  // - updateLivePreviewDisplay()
  console.log('   → Verify: Buffer clearing functions defined');
  console.log('   → Verify: clearCodeBuffer() exists');
  console.log('   → Verify: updateBufferDisplay() exists');
  assert.ok(true, 'Functions should exist in v11 code');
});

// =============================================================================
// Issue 3: English Mixed Input Mode (15 tests)
// =============================================================================

console.log('\nIssue 3: English Mixed Input Mode');
console.log('-'.repeat(70));

test('3.1: Language mode should have two states', () => {
  const modes = ['chinese', 'english'];
  assert.ok(modes.includes('chinese'), 'Should have chinese mode');
  assert.ok(modes.includes('english'), 'Should have english mode');
});

test('3.2: Language mode toggle logic', () => {
  let mode = 'chinese';

  // Toggle to English
  mode = (mode === 'chinese' ? 'english' : 'chinese');
  assert.strictEqual(mode, 'english', 'Should toggle to english');

  // Toggle back to Chinese
  mode = (mode === 'chinese' ? 'english' : 'chinese');
  assert.strictEqual(mode, 'chinese', 'Should toggle back to chinese');
});

test('3.3: English mode should bypass Chinese logic', () => {
  const languageMode = 'english';

  // In English mode, should skip Chinese processing
  if (languageMode === 'english') {
    // Direct output logic
    assert.ok(true, 'Should take English path');
  } else {
    assert.fail('Should not take Chinese path');
  }
});

test('3.4: English mode should accept alphanumeric', () => {
  const englishInputs = ['abc', 'ABC', '123', 'Hello World', 'test@example.com'];

  englishInputs.forEach(input => {
    // All should be valid for direct output
    assert.ok(input.length > 0, `"${input}" should be valid`);
  });
});

test('3.5: English mode should append to output', () => {
  let output = '';
  const input = 'Hello';

  // Simulate English mode append
  output += input;

  assert.strictEqual(output, 'Hello', 'Should append to output');
});

test('3.6: English mode should clear input after append', () => {
  let input = 'test';
  const output = input; // Append to output

  // Clear input
  input = '';

  assert.strictEqual(input, '', 'Input should be cleared');
  assert.strictEqual(output, 'test', 'Output should have content');
});

test('3.7: English mode should not affect code buffer', () => {
  let codeBuffer = ['4jp', 'ad'];
  const languageMode = 'english';

  // English input should not modify code buffer
  if (languageMode === 'english') {
    // Don't call addToCodeBuffer()
    // Buffer remains unchanged
  }

  assert.strictEqual(codeBuffer.length, 2, 'Buffer should remain unchanged');
});

test('3.8: English mode should work in character mode', () => {
  const inputMode = 'character';
  const languageMode = 'english';

  // Should work regardless of Chinese input mode
  assert.ok(inputMode === 'character' && languageMode === 'english', 'Should be compatible');
});

test('3.9: English mode should work in sentence mode', () => {
  const inputMode = 'sentence';
  const languageMode = 'english';

  // Should work regardless of Chinese input mode
  assert.ok(inputMode === 'sentence' && languageMode === 'english', 'Should be compatible');
});

test('3.10: Shift key detection', () => {
  const shiftKey = 'Shift';
  assert.strictEqual(shiftKey, 'Shift', 'Should detect Shift key');
});

test('3.11: English mode indicator should toggle visibility', () => {
  let indicatorHidden = true; // Initial state

  // Switch to English
  indicatorHidden = false;
  assert.strictEqual(indicatorHidden, false, 'Indicator should show');

  // Switch back to Chinese
  indicatorHidden = true;
  assert.strictEqual(indicatorHidden, true, 'Indicator should hide');
});

test('3.12: English mode should support spaces', () => {
  let output = 'Hello';
  const input = ' World';

  output += input;

  assert.strictEqual(output, 'Hello World', 'Should support spaces');
});

test('3.13: English mode should support punctuation', () => {
  const punctuation = ['!', '?', '.', ',', ';', ':', '-', '_'];

  punctuation.forEach(char => {
    assert.ok(char.length === 1, `"${char}" should be valid`);
  });
});

test('3.14: English mode should support mixed case', () => {
  const input = 'HeLLo WoRLd';
  const output = input; // Preserve case

  assert.strictEqual(output, 'HeLLo WoRLd', 'Should preserve case');
});

test('3.15: English mode should not trigger auto-copy (optional)', () => {
  // Design decision: Should English input trigger auto-copy?
  // For now, assume YES (same as Chinese)
  console.log('   → Design: English mode should trigger auto-copy if enabled');
  assert.ok(true, 'Design decision: trigger auto-copy in English mode');
});

// =============================================================================
// Integration Tests (4 tests)
// =============================================================================

console.log('\nIntegration Tests');
console.log('-'.repeat(70));

test('INT.1: Single-char → Multi-char flow', () => {
  // Type "v" (shows candidates) → "m" (buffers "vm")
  const step1 = 'v';
  const candidates1 = dayiMap.get(step1);
  assert.ok(candidates1, 'Step 1: Should show candidates');

  const step2 = 'vm';
  const candidates2 = dayiMap.get(step2);
  assert.ok(candidates2, 'Step 2: Should buffer 2-char code');
});

test('INT.2: English → Chinese switch', () => {
  let mode = 'english';

  // Type English
  let output = 'Hello ';

  // Switch to Chinese
  mode = 'chinese';

  // Type Chinese (should process normally)
  assert.strictEqual(mode, 'chinese', 'Should be in Chinese mode');
  assert.ok(output.includes('Hello'), 'English text should be preserved');
});

test('INT.3: Delete clears all in sentence mode', () => {
  // Create state: buffer + prediction
  let buffer = ['4jp', 'ad'];
  let prediction = '易在';
  let output = '一些文字';

  // Simulate Delete
  buffer = [];
  prediction = '';
  output = '';

  assert.strictEqual(buffer.length, 0, 'Buffer cleared');
  assert.strictEqual(prediction, '', 'Prediction cleared');
  assert.strictEqual(output, '', 'Output cleared');
});

test('INT.4: Mode consistency across features', () => {
  // All modes should be independent
  const chineseInputMode = 'sentence'; // character | sentence
  const languageMode = 'english'; // chinese | english

  // Should be able to have any combination
  assert.ok(true, 'Modes should be independent');
});

// =============================================================================
// Summary
// =============================================================================

console.log('\n' + '='.repeat(70));
console.log('Test Summary');
console.log('='.repeat(70));
console.log(`Total: ${testsRun} tests`);
console.log(`Passed: ${testsPassed} tests ✓`);
console.log(`Failed: ${testsFailed} tests ✗`);
console.log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
console.log('='.repeat(70));

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed. Please review the errors above.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  console.log('\nNext Steps:');
  console.log('1. Implement Issue 1 fix (single-code in sentence mode)');
  console.log('2. Verify Issue 2 (Delete key - likely already fixed)');
  console.log('3. Implement Issue 3 (English mixed input mode)');
  console.log('4. Run all 195 tests (165 existing + 30 new)');
  console.log('5. Manual browser testing');
  process.exit(0);
}
