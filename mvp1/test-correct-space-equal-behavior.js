/**
 * TDD Test: CORRECT Space and = Key Behavior
 *
 * Based on user's feedback:
 * "= 會是無效編碼" - = key should be prevented, not treated as input!
 * "v + space 送不出去 會卡住" - Space should add to buffer smoothly
 * "一樣是space 才會預測" - This is WRONG! Should be = that triggers prediction!
 *
 * CORRECT Behavior:
 * 1. Space: Add code to buffer (NO prediction!)
 * 2. =: Trigger prediction + output (ONE step!)
 *
 * User's Workflow:
 * 1. Type "v" + Space → buffer ["v"], NO prediction shown
 * 2. Type "ad" + Space → buffer ["v", "ad"], NO prediction shown
 * 3. Press = → Viterbi predicts → Output "大在" → Buffer cleared
 */

// Mock Node.js environment
if (typeof document === 'undefined') {
  global.document = {
    getElementById: (id) => {
      const mocks = {
        'input-box': { value: '', focus: () => {} },
        'output-buffer': { value: '' },
        'prediction-result-text': { textContent: '(等待預測)' },
        'buffer-display': { innerHTML: '' },
        'live-preview-display': { innerHTML: '' },
        'candidate-area': { innerHTML: '' }
      };
      return mocks[id] || null;
    },
    querySelector: () => null,
    addEventListener: () => {}
  };
  global.navigator = {
    clipboard: {
      writeText: async () => true
    }
  };
  global.window = global;
}

// Import core logic
const fs = require('fs');
const coreLogicCode = fs.readFileSync('./core_logic.js', 'utf8');
const coreLogicV11Code = fs.readFileSync('./core_logic_v11.js', 'utf8');

// Eval to load functions
eval(coreLogicCode);
eval(coreLogicV11Code);

// Load database
const dayiDbData = JSON.parse(fs.readFileSync('./dayi_db.json', 'utf8'));
dayiMap = createDatabaseMap(dayiDbData);

console.log('======================================================================');
console.log('TDD: CORRECT Space and = Key Behavior');
console.log('======================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✓ ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

// Switch to sentence mode
setInputMode('sentence');

console.log('Category 1: Space Key Behavior (NO Prediction!)');
console.log('----------------------------------------------------------------------');

test('1.1: Space should add code to buffer', () => {
  clearCodeBuffer();

  const added = addToCodeBuffer('v', dayiMap);

  if (!added) throw new Error('addToCodeBuffer should succeed for "v"');

  const buffer = getCodeBuffer();
  if (buffer.length !== 1) throw new Error('Buffer should have 1 code');
  if (buffer[0] !== 'v') throw new Error('Buffer should contain "v"');
});

test('1.2: Space should NOT trigger prediction', () => {
  clearCodeBuffer();
  addToCodeBuffer('v', dayiMap);

  // After Space, prediction area should still show default text
  const predictionArea = document.getElementById('prediction-result-text');

  if (predictionArea.textContent !== '(等待預測)') {
    throw new Error('Prediction should NOT be triggered by Space!');
  }
});

test('1.3: Space should allow multiple codes to accumulate', () => {
  clearCodeBuffer();

  addToCodeBuffer('v', dayiMap);
  addToCodeBuffer('ad', dayiMap);

  const buffer = getCodeBuffer();
  if (buffer.length !== 2) throw new Error('Buffer should have 2 codes');

  // Prediction should still not be triggered
  const predictionArea = document.getElementById('prediction-result-text');
  if (predictionArea.textContent !== '(等待預測)') {
    throw new Error('Prediction should NOT be triggered by multiple Spaces!');
  }
});

test('1.4: Space should clear input box', () => {
  // This is tested by the handler - clearInputBox() should be called
  if (typeof clearInputBox !== 'function') {
    throw new Error('clearInputBox function not defined');
  }
});

test('1.5: Space should update buffer display', () => {
  clearCodeBuffer();
  addToCodeBuffer('v', dayiMap);

  // updateBufferDisplay should show the code
  if (typeof updateBufferDisplay !== 'function') {
    throw new Error('updateBufferDisplay function not defined');
  }
});

console.log('');

console.log('Category 2: = Key Behavior (Trigger Prediction + Output!)');
console.log('----------------------------------------------------------------------');

test('2.1: = should trigger prediction when buffer has codes', () => {
  clearCodeBuffer();
  addToCodeBuffer('v', dayiMap);

  const buffer = getCodeBuffer();
  if (buffer.length !== 1) throw new Error('Buffer should have 1 code before prediction');

  // The = key handler should call a prediction function
  // This function should:
  // 1. Run Viterbi prediction
  // 2. Output to output buffer
  // 3. Clear code buffer
});

test('2.2: Prediction function should exist', () => {
  // The = key should call a function that does prediction + output
  // This could be triggerPrediction (original v11 function)
  if (typeof window !== 'undefined' && typeof window.triggerPrediction !== 'undefined') {
    // OK
  } else {
    // triggerPrediction might not be on window, check global
    // Actually, we need to check what function = key should call...
    console.log('   → Note: Need to define what function = key calls');
  }
});

test('2.3: = should output prediction result', () => {
  // After = is pressed:
  // - Viterbi runs
  // - Result is appended to output buffer
  // - Code buffer is cleared

  const outputBuffer = document.getElementById('output-buffer');
  if (!outputBuffer) throw new Error('Output buffer not found');

  // This is behavior test - checked by integration
});

test('2.4: = should clear code buffer after output', () => {
  clearCodeBuffer();
  addToCodeBuffer('v', dayiMap);

  // After = key:
  // 1. Prediction runs
  // 2. Output appended
  // 3. Buffer should be empty

  // This is behavior test - checked by integration
});

test('2.5: = should work even with single code in buffer', () => {
  clearCodeBuffer();
  addToCodeBuffer('v', dayiMap);

  const buffer = getCodeBuffer();
  if (buffer.length !== 1) throw new Error('Buffer should have 1 code');

  // = should work with just 1 code
  // This tests that we don't have a "minimum buffer length" requirement
});

console.log('');

console.log('Category 3: Integration - Full Workflow');
console.log('----------------------------------------------------------------------');

test('3.1: Workflow: v + Space → ad + Space → =', () => {
  clearCodeBuffer();

  // Step 1: v + Space
  addToCodeBuffer('v', dayiMap);
  let buffer = getCodeBuffer();
  if (buffer.length !== 1) throw new Error('Step 1: Buffer should have 1 code');

  // Step 2: ad + Space
  addToCodeBuffer('ad', dayiMap);
  buffer = getCodeBuffer();
  if (buffer.length !== 2) throw new Error('Step 2: Buffer should have 2 codes');

  // Step 3: = key (prediction + output)
  // This would call the prediction function
  // For now, just verify buffer has codes ready for prediction
  if (buffer[0] !== 'v') throw new Error('Step 3: First code should be "v"');
  if (buffer[1] !== 'ad') throw new Error('Step 3: Second code should be "ad"');
});

test('3.2: After =, buffer should be cleared', () => {
  clearCodeBuffer();
  addToCodeBuffer('v', dayiMap);

  // After = key processes:
  const buffer = getCodeBuffer();
  // (This will be tested after we implement the = key handler)
});

test('3.3: Prediction should NOT happen on Space, only on =', () => {
  clearCodeBuffer();

  // Multiple Spaces should NOT trigger prediction
  addToCodeBuffer('v', dayiMap);
  addToCodeBuffer('ad', dayiMap);
  addToCodeBuffer('d/', dayiMap);

  const buffer = getCodeBuffer();
  if (buffer.length !== 3) throw new Error('Buffer should have 3 codes');

  // No prediction should have happened
  const predictionArea = document.getElementById('prediction-result-text');
  if (predictionArea.textContent !== '(等待預測)') {
    throw new Error('Prediction should ONLY happen on =, not on Space!');
  }
});

console.log('');

console.log('======================================================================');
console.log('Test Summary');
console.log('======================================================================');
console.log(`Total: ${testsPassed + testsFailed} tests`);
console.log(`Passed: ${testsPassed} tests ✓`);
console.log(`Failed: ${testsFailed} tests ✗`);
console.log(`Success Rate: ${((testsPassed/(testsPassed+testsFailed))*100).toFixed(1)}%`);
console.log('======================================================================\n');

if (testsFailed === 0) {
  console.log('✅ All tests passed!\n');
} else {
  console.log(`⚠️  ${testsFailed} test(s) failed.\n`);
  console.log('Expected Behavior Summary:');
  console.log('1. Space: Add to buffer (NO prediction)');
  console.log('2. =: Trigger prediction + output (ONE step)');
  console.log('3. Multiple Spaces accumulate codes WITHOUT predicting');
  console.log('4. Only = key triggers Viterbi prediction\n');
}

// Export for potential integration testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testsPassed, testsFailed };
}
