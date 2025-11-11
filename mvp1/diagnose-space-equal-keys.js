/**
 * Diagnosis Test: Why Space and = Keys Not Working in Sentence Mode
 *
 * User Report: "space的邏輯 與= 的邏輯都沒有作動"
 *
 * This test checks:
 * 1. Are the functions defined? (triggerSentencePrediction, confirmPrediction)
 * 2. Is isSentenceMode() accessible?
 * 3. Is inputMode correctly set?
 * 4. Can the event handlers find the functions?
 */

// Mock Node.js environment
if (typeof document === 'undefined') {
  global.document = {
    getElementById: (id) => {
      const mocks = {
        'input-box': { value: 'v', focus: () => {} },
        'output-buffer': { value: '' },
        'prediction-result-text': { textContent: '(等待預測)' },
        'buffer-display': { innerHTML: '' },
        'live-preview-display': { innerHTML: '' }
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

  // CRITICAL: Mock window object for Node.js!
  global.window = global;
}

// Import core logic
const fs = require('fs');
const coreLogicCode = fs.readFileSync('./core_logic.js', 'utf8');
const coreLogicV11Code = fs.readFileSync('./core_logic_v11.js', 'utf8');
const coreLogicV11UICode = fs.readFileSync('./core_logic_v11_ui.js', 'utf8');

// Eval to load functions
eval(coreLogicCode);
eval(coreLogicV11Code);

// Load database
const dayiDbData = JSON.parse(fs.readFileSync('./dayi_db.json', 'utf8'));
dayiMap = createDatabaseMap(dayiDbData);

// Now eval UI code (after dayiMap is ready)
eval(coreLogicV11UICode);

console.log('======================================================================');
console.log('DIAGNOSIS: Space and = Keys Not Working in Sentence Mode');
console.log('======================================================================\n');

let issuesFound = 0;

console.log('CHECK 1: Are core v11 functions defined?');
console.log('----------------------------------------------------------------------');

if (typeof isSentenceMode !== 'function') {
  console.log('❌ isSentenceMode() NOT defined');
  issuesFound++;
} else {
  console.log('✅ isSentenceMode() is defined');
}

if (typeof addToCodeBuffer !== 'function') {
  console.log('❌ addToCodeBuffer() NOT defined');
  issuesFound++;
} else {
  console.log('✅ addToCodeBuffer() is defined');
}

if (typeof clearInputBox !== 'function') {
  console.log('❌ clearInputBox() NOT defined');
  issuesFound++;
} else {
  console.log('✅ clearInputBox() is defined');
}

console.log('');

console.log('CHECK 2: Are new functions defined on window object?');
console.log('----------------------------------------------------------------------');

if (typeof window !== 'undefined' && typeof window.triggerSentencePrediction === 'function') {
  console.log('✅ window.triggerSentencePrediction is defined');
} else if (typeof triggerSentencePrediction === 'function') {
  console.log('⚠️  triggerSentencePrediction is defined but NOT on window object');
  issuesFound++;
} else if (typeof global.triggerSentencePrediction === 'function') {
  console.log('✅ global.triggerSentencePrediction is defined (Node.js)');
} else {
  console.log('❌ triggerSentencePrediction NOT defined anywhere');
  issuesFound++;
}

if (typeof window !== 'undefined' && typeof window.confirmPrediction === 'function') {
  console.log('✅ window.confirmPrediction is defined');
} else if (typeof confirmPrediction === 'function') {
  console.log('⚠️  confirmPrediction is defined but NOT on window object');
  issuesFound++;
} else if (typeof global.confirmPrediction === 'function') {
  console.log('✅ global.confirmPrediction is defined (Node.js)');
} else {
  console.log('❌ confirmPrediction NOT defined anywhere');
  issuesFound++;
}

console.log('');

console.log('CHECK 3: Can we switch to sentence mode?');
console.log('----------------------------------------------------------------------');

if (typeof setInputMode !== 'function') {
  console.log('❌ setInputMode() NOT defined');
  issuesFound++;
} else {
  console.log('✅ setInputMode() is defined');

  // Try to switch to sentence mode
  setInputMode('sentence');

  const currentMode = isSentenceMode();
  if (currentMode) {
    console.log('✅ Successfully switched to sentence mode');
  } else {
    console.log('❌ Failed to switch to sentence mode');
    issuesFound++;
  }
}

console.log('');

console.log('CHECK 4: Simulate Space key in sentence mode');
console.log('----------------------------------------------------------------------');

if (typeof isSentenceMode === 'function' && isSentenceMode()) {
  console.log('Current mode: Sentence ✓');

  const inputBox = document.getElementById('input-box');
  inputBox.value = 'v';

  console.log(`Input box value: "${inputBox.value}"`);

  // Check if functions are accessible
  const hasAddToCodeBuffer = typeof addToCodeBuffer === 'function';
  const hasTriggerPrediction = typeof triggerSentencePrediction === 'function' ||
                                (typeof global !== 'undefined' && typeof global.triggerSentencePrediction === 'function');

  console.log(`addToCodeBuffer available: ${hasAddToCodeBuffer}`);
  console.log(`triggerSentencePrediction available: ${hasTriggerPrediction}`);

  if (hasAddToCodeBuffer && hasTriggerPrediction) {
    console.log('✅ All required functions are available');
  } else {
    console.log('❌ Missing required functions!');
    issuesFound++;
  }
} else {
  console.log('❌ Not in sentence mode!');
  issuesFound++;
}

console.log('');

console.log('CHECK 5: Check event handler code in core_logic.js');
console.log('----------------------------------------------------------------------');

// Check if the Space key handler has the correct code
if (coreLogicCode.includes('if (isInSentenceMode)') &&
    coreLogicCode.includes('triggerSentencePrediction')) {
  console.log('✅ Space key handler includes sentence mode logic');
} else {
  console.log('❌ Space key handler missing sentence mode logic!');
  issuesFound++;
}

// Check if the = key handler has the correct code
if (coreLogicCode.includes('confirmPrediction')) {
  console.log('✅ = key handler includes confirmPrediction logic');
} else {
  console.log('❌ = key handler missing confirmPrediction logic!');
  issuesFound++;
}

console.log('');

console.log('======================================================================');
console.log('DIAGNOSIS SUMMARY');
console.log('======================================================================');

if (issuesFound === 0) {
  console.log('✅ No issues found! Logic should be working.');
  console.log('');
  console.log('If still not working in browser:');
  console.log('1. Check browser console for errors');
  console.log('2. Verify index.html loads scripts in correct order');
  console.log('3. Check if other event listeners are interfering');
} else {
  console.log(`❌ Found ${issuesFound} issue(s)!`);
  console.log('');
  console.log('Root Cause Hypothesis:');
  console.log('- Functions may not be properly exported to global scope');
  console.log('- IIFE in core_logic_v11_ui.js may not execute correctly');
  console.log('- Need to make functions globally accessible BEFORE event handlers are set up');
}

console.log('======================================================================\n');
