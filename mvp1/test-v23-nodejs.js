#!/usr/bin/env node
/**
 * v2.3 Verification Test - Node.js Version
 * This bypasses ALL browser caching issues!
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('🔬 v2.3 Frequency Bonus Verification (Node.js)');
console.log('='.repeat(80));
console.log('');

// Load the actual viterbi_module.js file
const viterbiCode = fs.readFileSync(path.join(__dirname, 'viterbi_module.js'), 'utf8');

// Check version
console.log('📝 Checking viterbi_module.js content:');
console.log('');

if (viterbiCode.includes('Version 2.3:')) {
  console.log('✓ File header shows Version 2.3');
} else {
  console.log('✗ File header does NOT show Version 2.3!');
}

if (viterbiCode.includes('freqBonus')) {
  console.log('✓ Code contains "freqBonus" variable');
  const count = (viterbiCode.match(/freqBonus/g) || []).length;
  console.log(`  Found ${count} occurrences of "freqBonus"`);
} else {
  console.log('✗ Code does NOT contain "freqBonus"!');
  console.log('  ⚠️ This means v2.3 code is NOT in the file!');
}

if (viterbiCode.includes('candidate.freq * 1e-9')) {
  console.log('✓ Code contains frequency bonus formula: candidate.freq * 1e-9');
} else {
  console.log('✗ Code does NOT contain frequency bonus formula!');
}

if (viterbiCode.includes('dp[t][char2] = maxProb + freqBonus')) {
  console.log('✓ Code applies freqBonus to DP score');
} else if (viterbiCode.includes('firstDP[char] = Math.log(unigramProb) + freqBonus')) {
  console.log('✓ Code applies freqBonus in initializeDP');
} else {
  console.log('✗ Code does NOT apply freqBonus!');
}

console.log('');
console.log('='.repeat(80));
console.log('📊 Code excerpt (showing frequency bonus application):');
console.log('='.repeat(80));

// Extract relevant code sections
const initDPMatch = viterbiCode.match(/function initializeDP[\s\S]{0,800}freqBonus[\s\S]{0,200}/);
if (initDPMatch) {
  console.log('');
  console.log('--- initializeDP function ---');
  console.log(initDPMatch[0].split('\n').slice(0, 20).join('\n'));
}

const forwardPassMatch = viterbiCode.match(/freqBonus = candidate\.freq[\s\S]{0,300}/);
if (forwardPassMatch) {
  console.log('');
  console.log('--- forwardPass freqBonus application ---');
  console.log(forwardPassMatch[0]);
}

console.log('');
console.log('='.repeat(80));
console.log('📏 File statistics:');
console.log('='.repeat(80));
console.log(`File size: ${viterbiCode.length} bytes`);
console.log(`Line count: ${viterbiCode.split('\n').length} lines`);

// Find the console.log line
const consoleLogMatch = viterbiCode.match(/console\.log\('✓ Viterbi module loaded.*'\)/);
if (consoleLogMatch) {
  console.log(`Console message: ${consoleLogMatch[0]}`);

  if (consoleLogMatch[0].includes('v2.3')) {
    console.log('✓ Console log shows v2.3');
  } else {
    console.log('✗ Console log does NOT show v2.3!');
  }
}

console.log('');
console.log('='.repeat(80));
console.log('🎯 CONCLUSION:');
console.log('='.repeat(80));

const hasV23Header = viterbiCode.includes('Version 2.3:');
const hasFreqBonus = viterbiCode.includes('freqBonus');
const hasFormula = viterbiCode.includes('candidate.freq * 1e-9');
const hasApplication = viterbiCode.includes('maxProb + freqBonus') || viterbiCode.includes('unigramProb) + freqBonus');

if (hasV23Header && hasFreqBonus && hasFormula && hasApplication) {
  console.log('✓✓✓ viterbi_module.js file IS CORRECT (v2.3 code present)');
  console.log('');
  console.log('⚠️ If browser still shows wrong results, the problem is:');
  console.log('   1. BROWSER CACHE - JavaScript not reloaded');
  console.log('   2. Try: Ctrl+Shift+R (hard refresh)');
  console.log('   3. Try: Clear all browser cache');
  console.log('   4. Try: Open in Incognito/Private mode');
  console.log('   5. Try: Different browser');
  console.log('   6. Check: DevTools Network tab - viterbi_module.js should be fresh (200), not cached (304)');
} else {
  console.log('✗✗✗ viterbi_module.js file IS MISSING v2.3 CODE!');
  console.log('');
  console.log('Missing components:');
  if (!hasV23Header) console.log('  - Version 2.3 header');
  if (!hasFreqBonus) console.log('  - freqBonus variable');
  if (!hasFormula) console.log('  - Frequency bonus formula');
  if (!hasApplication) console.log('  - DP score application');
  console.log('');
  console.log('⚠️ Code was not properly saved or git checkout reverted changes!');
}

console.log('');
