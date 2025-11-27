/**
 * Debug Script for Sentence Mode Duplication Bug
 *
 * User Report: "dj ev" produces "天明天" instead of "明天"
 *
 * This script traces the execution flow to identify the root cause.
 */

const fs = require('fs');
const path = require('path');

// Load databases
const dayiDbPath = path.join(__dirname, 'dayi_db.json');
const dayiData = JSON.parse(fs.readFileSync(dayiDbPath, 'utf8'));
const dayiMap = new Map(Object.entries(dayiData));

console.log('='.repeat(60));
console.log('DEBUG: Sentence Mode Duplication Bug');
console.log('='.repeat(60));

// Test 1: Check what characters exist for "dj" and "ev"
console.log('\n1. Database Lookup:');
console.log('   Code "dj" candidates:');
const djCandidates = dayiMap.get('dj');
if (djCandidates) {
  djCandidates.forEach((c, i) => {
    console.log(`      ${i + 1}. ${c.char} (freq: ${c.freq})`);
  });
} else {
  console.log('      ❌ No candidates found!');
}

console.log('\n   Code "ev" candidates:');
const evCandidates = dayiMap.get('ev');
if (evCandidates) {
  evCandidates.forEach((c, i) => {
    console.log(`      ${i + 1}. ${c.char} (freq: ${c.freq})`);
  });
} else {
  console.log('      ❌ No candidates found!');
}

// Test 2: Simulate live preview generation
console.log('\n2. Live Preview Simulation:');
function generateLivePreview(codes) {
  const previewChars = codes.map(code => {
    const candidates = dayiMap.get(code);
    if (!candidates || candidates.length === 0) {
      return '?';
    }
    // Sort by freq (descending)
    const sorted = [...candidates].sort((a, b) => b.freq - a.freq);
    return sorted[0].char;
  });
  return previewChars.join(' ');
}

const preview = generateLivePreview(['dj', 'ev']);
console.log(`   Input: ["dj", "ev"]`);
console.log(`   Preview: "${preview}"`);

// Test 3: Check if issue is in character extraction
console.log('\n3. Character Extraction:');
const djChar = djCandidates && djCandidates.length > 0 ? djCandidates[0].char : null;
const evChar = evCandidates && evCandidates.length > 0 ? evCandidates[0].char : null;
console.log(`   dj → "${djChar}"`);
console.log(`   ev → "${evChar}"`);
console.log(`   Concatenated: "${djChar}${evChar}"`);

// Test 4: Check character codes (to detect duplicates)
console.log('\n4. Character Code Analysis:');
if (djChar) {
  console.log(`   dj char "${djChar}"`);
  console.log(`      - Unicode: U+${djChar.charCodeAt(0).toString(16).toUpperCase()}`);
  console.log(`      - Length: ${djChar.length}`);
}
if (evChar) {
  console.log(`   ev char "${evChar}"`);
  console.log(`      - Unicode: U+${evChar.charCodeAt(0).toString(16).toUpperCase()}`);
  console.log(`      - Length: ${evChar.length}`);
}

// Test 5: User reported output
console.log('\n5. User Report Analysis:');
const expectedOutput = '明天';
const actualOutput = '天明天';  // User reported

console.log(`   Expected: "${expectedOutput}"`);
console.log(`   Actual: "${actualOutput}"`);
console.log(`   Character breakdown:`);
for (let i = 0; i < actualOutput.length; i++) {
  const char = actualOutput[i];
  console.log(`      [${i}] "${char}" (U+${char.charCodeAt(0).toString(16).toUpperCase()})`);
}

// Test 6: Hypothesis - Is "天" appearing twice?
console.log('\n6. Duplication Hypothesis:');
const tianCount = (actualOutput.match(/天/g) || []).length;
const mingCount = (actualOutput.match(/明/g) || []).length;
console.log(`   "明" appears: ${mingCount} times`);
console.log(`   "天" appears: ${tianCount} times`);

if (tianCount > 1) {
  console.log(`   ⚠️  HYPOTHESIS: "天" is being appended twice!`);
  console.log(`   Possible causes:`);
  console.log(`      1. Live preview character leaking to output`);
  console.log(`      2. Character mode handler firing alongside sentence mode`);
  console.log(`      3. Viterbi returning duplicate characters`);
}

// Test 7: Check if issue is order-related
console.log('\n7. Order Analysis:');
console.log(`   Expected order: 明(dj) → 天(ev) = "明天"`);
console.log(`   Actual order: 天(ev) → 明(dj) → 天(ev) = "天明天"`);
console.log(`   ⚠️  Pattern suggests: ev processed BEFORE and AFTER dj!`);

console.log('\n8. Recommendations:');
console.log('   ✅ Check: Are input event handlers firing multiple times?');
console.log('   ✅ Check: Is sentence mode properly isolating from character mode?');
console.log('   ✅ Check: Does triggerPrediction() get called more than once?');
console.log('   ✅ Check: Are codes being added to buffer in wrong order?');
console.log('   ✅ Add: Detailed logging in core_logic_v11_ui.js input handler');
console.log('   ✅ Add: Debouncing or防抖 to prevent duplicate processing');

console.log('\n' + '='.repeat(60));
console.log('Next Step: Run with real N-gram DB and Viterbi algorithm');
console.log('='.repeat(60));
