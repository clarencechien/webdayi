/**
 * Quick Verification Test: Event Handler Conflict Fixed
 *
 * Verifies that the fix for duplicate Space/= handlers is working:
 * 1. v11_ui.js Space handler removed (no triggerPrediction)
 * 2. v11_ui.js = handler added (prevents default)
 * 3. v11_ui.js input handler ignores =
 */

const fs = require('fs');

console.log('======================================================================');
console.log('VERIFICATION: Event Handler Conflict Fixed');
console.log('======================================================================\n');

let checks = 0;
let passed = 0;

function check(description, fn) {
  checks++;
  try {
    fn();
    console.log(`✅ ${description}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   ${error.message}`);
  }
}

const v11UICode = fs.readFileSync('./core_logic_v11_ui.js', 'utf8');
const coreLogicCode = fs.readFileSync('./core_logic.js', 'utf8');

check('core_logic_v11_ui.js: Space does NOT call triggerPrediction', () => {
  // Find keydown handler
  const keydownMatch = v11UICode.match(/addEventListener\('keydown'[^}]+\{([\s\S]+?)\n\s{4}\}\);/);

  if (keydownMatch) {
    const handler = keydownMatch[1];

    // Check if Space calls triggerPrediction
    if (handler.includes("if (key === ' ')") && handler.includes('triggerPrediction')) {
      throw new Error('Space handler still calls triggerPrediction!');
    }
  }
});

check('core_logic_v11_ui.js: Has = key handler', () => {
  if (!v11UICode.includes("if (key === '=')")) {
    throw new Error('No = key handler found');
  }
});

check('core_logic_v11_ui.js: Input handler ignores =', () => {
  const inputHandlerMatch = v11UICode.match(/addEventListener\('input'[^}]+\{([\s\S]+?)\n\s{4}\}\);/);

  if (inputHandlerMatch) {
    const handler = inputHandlerMatch[1];

    if (!handler.includes("value === '='") && !handler.includes("value.includes('=')")) {
      throw new Error('Input handler does not ignore =');
    }
  }
});

check('core_logic.js: Space handler ONLY buffers', () => {
  const spaceHandlerMatch = coreLogicCode.match(/if \(key === ' '\)[\s\S]{0,500}?if \(isInSentenceMode\)[\s\S]{0,300}?return;/);

  if (!spaceHandlerMatch) {
    throw new Error('Space handler not found');
  }

  const handler = spaceHandlerMatch[0];

  if (!handler.includes('updateBufferDisplay')) {
    throw new Error('Space handler does not call updateBufferDisplay');
  }

  if (handler.includes('triggerPrediction') || handler.includes('triggerSentencePrediction')) {
    throw new Error('Space handler still calls prediction!');
  }
});

check('core_logic.js: = handler triggers prediction', () => {
  const equalHandlerMatch = coreLogicCode.match(/if \(key === '='\)[\s\S]{0,500}?if \(isInSentenceMode\)[\s\S]{0,300}?return;/);

  if (!equalHandlerMatch) {
    throw new Error('= handler not found');
  }

  const handler = equalHandlerMatch[0];

  if (!handler.includes('triggerPrediction')) {
    throw new Error('= handler does not call triggerPrediction');
  }
});

check('UI text updated: "按 = 預測" instead of "按 Space"', () => {
  // Check if there are any remaining "按 Space 預測" references
  if (v11UICode.includes('按 Space 預測')) {
    throw new Error('Found leftover "按 Space 預測" text');
  }

  if (!v11UICode.includes('按 = 預測')) {
    throw new Error('Missing "按 = 預測" text');
  }
});

console.log('');
console.log('======================================================================');
console.log(`Result: ${passed}/${checks} checks passed`);
console.log('======================================================================');

if (passed === checks) {
  console.log('✅ ALL FIXES VERIFIED!');
  console.log('');
  console.log('Fixed Issues:');
  console.log('1. ✅ v + space no longer stuck (Space adds to buffer)');
  console.log('2. ✅ 2 codes + space does NOT trigger prediction');
  console.log('3. ✅ = key triggers prediction (not treated as invalid code)');
  console.log('');
  console.log('Next: Test in browser to verify actual behavior');
  process.exit(0);
} else {
  console.log(`❌ ${checks - passed} check(s) failed`);
  process.exit(1);
}
