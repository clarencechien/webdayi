/**
 * Deep Diagnostic: Compare Viterbi inputs between test page and main app
 *
 * This diagnostic will trace exactly what data is being passed to the Viterbi
 * algorithm and show why the results are different.
 */

const fs = require('fs');
const path = require('path');

// Load databases
const dayiDbPath = path.join(__dirname, 'dayi_db.json');
const ngramDbPath = path.join(__dirname, 'ngram_db.json');

const dayiDbRaw = JSON.parse(fs.readFileSync(dayiDbPath, 'utf-8'));
const ngramDb = JSON.parse(fs.readFileSync(ngramDbPath, 'utf-8'));
const dayiDb = new Map(Object.entries(dayiDbRaw));

console.log('=== Investigating: Why different results? ===');
console.log('');
console.log('Test page result:  明天天真如何會放假嗎');
console.log('Main app result:   明天天氣嬌俏侚艭傻嗎');
console.log('Expected result:   明天天氣如何會放假嗎');
console.log('');

// Check candidates for problematic codes
const problematicCodes = [
  { code: 'c8', pos: 3, testPageGot: '真', mainAppGot: '氣', expected: '氣' },
  { code: 'lo', pos: 4, testPageGot: '如', mainAppGot: '嬌', expected: '如' },
  { code: 'aj', pos: 5, testPageGot: '何', mainAppGot: '俏', expected: '何' },
  { code: 'ad', pos: 6, testPageGot: '會', mainAppGot: '侚', expected: '會' },
];

console.log('=== Checking candidates for problematic codes ===');
problematicCodes.forEach(({ code, pos, testPageGot, mainAppGot, expected }) => {
  const candidates = dayiDb.get(code);
  console.log(`\nPosition ${pos} - Code: ${code}`);
  console.log(`  Test page got: ${testPageGot}`);
  console.log(`  Main app got:  ${mainAppGot}`);
  console.log(`  Expected:      ${expected}`);
  console.log(`  Candidates (top 10):`);

  candidates.slice(0, 10).forEach((c, i) => {
    const markers = [];
    if (c.char === expected) markers.push('EXPECTED');
    if (c.char === testPageGot) markers.push('TEST_PAGE');
    if (c.char === mainAppGot) markers.push('MAIN_APP');

    const marker = markers.length > 0 ? ` ← ${markers.join(', ')}` : '';
    console.log(`    ${i+1}. ${c.char} (freq=${c.freq})${marker}`);
  });

  // Check if candidates are sorted by frequency
  let isSorted = true;
  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i].freq > candidates[i-1].freq) {
      isSorted = false;
      break;
    }
  }
  console.log(`  Sorted by freq: ${isSorted ? 'YES' : 'NO'}`);
});

console.log('\n\n=== Hypothesis ===');
console.log('1. If candidates are NOT sorted, Viterbi might be iterating in wrong order');
console.log('2. If test page vs main app load candidates differently, results differ');
console.log('3. Check if there\'s a sorting step missing somewhere');
