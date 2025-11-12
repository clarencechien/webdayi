#!/usr/bin/env node
/**
 * Diagnose why positions 6-8 are still wrong even with v2.4 logarithmic bonus
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('🔍 Diagnosing Remaining Errors (Positions 6-8)');
console.log('='.repeat(80));
console.log('');

// Load database
const dayiDbData = JSON.parse(fs.readFileSync(path.join(__dirname, 'dayi_db.json'), 'utf8'));

// Test case 2 codes and expected characters
const codes = ['dj', 'ev', 'ev', 'c8', 'lo', 'aj', 'ad', '.x', 'ax', 'ob'];
const expected = ['明', '天', '天', '氣', '如', '何', '會', '放', '假', '嗎'];
const actual_v24 = ['明', '天', '天', '氣', '如', '何', '侚', '艭', '傻', '嗎'];

console.log('Test Case Analysis:');
console.log('Expected: ' + expected.join(''));
console.log('v2.4 Got:  ' + actual_v24.join(''));
console.log('');
console.log('Status:');
for (let i = 0; i < 10; i++) {
  const status = expected[i] === actual_v24[i] ? '✓' : '✗';
  console.log(`  ${i}. ${codes[i]} → ${actual_v24[i]} ${expected[i] === actual_v24[i] ? '' : `(expected: ${expected[i]})`} ${status}`);
}

console.log('');
console.log('='.repeat(80));
console.log('📊 Analyzing Problem Positions (6-8):');
console.log('='.repeat(80));

// Focus on positions 6-8 where errors occurred
const problemPositions = [6, 7, 8];

for (const pos of problemPositions) {
  const code = codes[pos];
  const expectedChar = expected[pos];
  const actualChar = actual_v24[pos];

  console.log('');
  console.log(`Position ${pos}: code="${code}"`);
  console.log(`  Expected: ${expectedChar}`);
  console.log(`  Got:      ${actualChar}`);
  console.log('');

  const candidates = dayiDbData[code];
  if (!candidates) {
    console.log('  ⚠️ No candidates found!');
    continue;
  }

  // Find expected and actual characters
  const expectedInfo = candidates.find(c => c.char === expectedChar);
  const actualInfo = candidates.find(c => c.char === actualChar);

  const expectedRank = candidates.findIndex(c => c.char === expectedChar) + 1;
  const actualRank = candidates.findIndex(c => c.char === actualChar) + 1;

  console.log(`  Expected char: ${expectedChar}`);
  console.log(`    - Rank: ${expectedRank}/${candidates.length}`);
  console.log(`    - Frequency: ${expectedInfo ? expectedInfo.freq : 'N/A'}`);
  console.log(`    - v2.4 bonus: ${expectedInfo ? Math.log(1 + expectedInfo.freq / 10000).toFixed(4) : 'N/A'}`);
  console.log('');
  console.log(`  Actual char: ${actualChar}`);
  console.log(`    - Rank: ${actualRank}/${candidates.length}`);
  console.log(`    - Frequency: ${actualInfo ? actualInfo.freq : 'N/A'}`);
  console.log(`    - v2.4 bonus: ${actualInfo ? Math.log(1 + actualInfo.freq / 10000).toFixed(4) : 'N/A'}`);
  console.log('');

  if (expectedInfo && actualInfo) {
    const freqDiff = expectedInfo.freq - actualInfo.freq;
    const bonusDiff = Math.log(1 + expectedInfo.freq / 10000) - Math.log(1 + actualInfo.freq / 10000);
    console.log(`  Analysis:`);
    console.log(`    - Freq difference: ${freqDiff} (${expectedChar} has ${freqDiff > 0 ? 'higher' : 'lower'} freq)`);
    console.log(`    - Bonus difference: ${bonusDiff.toFixed(4)} (${expectedChar} should get ${bonusDiff > 0 ? '+' : ''}${bonusDiff.toFixed(4)} more)`);

    if (freqDiff > 0 && bonusDiff > 0) {
      console.log(`    - ✓ Expected char HAS higher frequency and bonus`);
      console.log(`    - ⚠️ But N-gram path through "${actualChar}" must have been ${bonusDiff.toFixed(4)} better!`);
      console.log(`    - 💡 This means the N-gram evidence STRONGLY favors "${actualChar}"`);
    } else if (freqDiff < 0) {
      console.log(`    - ⚠️ Expected char has LOWER frequency - algorithm is working as designed`);
      console.log(`    - 💡 The issue is the expected sequence might not be most common in training data`);
    }
  }

  // Show top 5 candidates
  console.log('');
  console.log(`  Top 5 candidates for code "${code}":`);
  for (let i = 0; i < Math.min(5, candidates.length); i++) {
    const c = candidates[i];
    const bonus = Math.log(1 + c.freq / 10000);
    const marker = c.char === expectedChar ? ' ← EXPECTED' : c.char === actualChar ? ' ← SELECTED' : '';
    console.log(`    ${i+1}. ${c.char} (freq=${c.freq}, bonus=${bonus.toFixed(4)})${marker}`);
  }
}

console.log('');
console.log('='.repeat(80));
console.log('🎯 Conclusion:');
console.log('='.repeat(80));

const correctCount = actual_v24.filter((c, i) => c === expected[i]).length;
console.log(`Correct: ${correctCount}/10 (${(correctCount/10*100).toFixed(0)}%)`);
console.log('');

if (correctCount >= 6) {
  console.log('✅ v2.4 IS WORKING! Major improvement from v2.3 (2/10)');
  console.log('');
  console.log('Remaining errors are likely due to:');
  console.log('  1. Strong N-gram evidence for wrong path');
  console.log('  2. Training data (rime-essay) has different common phrases');
  console.log('  3. May need to increase frequency bonus weight');
  console.log('');
  console.log('Possible next steps:');
  console.log('  - Increase frequency bonus: log(1 + freq/5000) instead of /10000');
  console.log('  - Add higher weight: 2 * log(1 + freq/10000)');
  console.log('  - Or accept that N-gram should dominate (this is correct behavior!)');
} else {
  console.log('⚠️ Still significant issues - needs more investigation');
}

console.log('');
