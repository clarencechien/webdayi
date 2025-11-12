/**
 * Check for duplicate characters in candidate lists
 */

const fs = require('fs');
const path = require('path');

const dayiDbPath = path.join(__dirname, 'dayi_db.json');
const dayiDbRaw = JSON.parse(fs.readFileSync(dayiDbPath, 'utf-8'));

console.log('Checking for duplicate characters in candidate lists...\n');

let totalCodes = 0;
let codesWithDuplicates = 0;
const problemCodes = [];

for (const [code, candidates] of Object.entries(dayiDbRaw)) {
  totalCodes++;
  const chars = candidates.map(c => c.char);
  const uniqueChars = new Set(chars);

  if (chars.length !== uniqueChars.size) {
    codesWithDuplicates++;
    problemCodes.push({
      code,
      totalCandidates: candidates.length,
      uniqueChars: uniqueChars.size,
      duplicates: chars.length - uniqueChars.size
    });

    if (codesWithDuplicates <= 5) {
      console.log(`Code: ${code}`);
      console.log(`  Total candidates: ${candidates.length}`);
      console.log(`  Unique characters: ${uniqueChars.size}`);
      console.log(`  Duplicates: ${chars.length - uniqueChars.size}`);

      // Show the duplicates
      const charCount = {};
      chars.forEach(char => {
        charCount[char] = (charCount[char] || 0) + 1;
      });

      const dupes = Object.entries(charCount).filter(([_, count]) => count > 1);
      console.log(`  Duplicate characters:`);
      dupes.forEach(([char, count]) => {
        console.log(`    ${char}: appears ${count} times`);
        const entries = candidates.filter(c => c.char === char);
        entries.forEach((entry, i) => {
          console.log(`      Entry ${i+1}: freq=${entry.freq}`);
        });
      });
      console.log('');
    }
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total codes: ${totalCodes}`);
console.log(`Codes with duplicates: ${codesWithDuplicates}`);

if (codesWithDuplicates > 0) {
  console.log(`\n⚠️ FOUND DUPLICATES! This could cause the Viterbi algorithm to overwrite DP entries.`);
  console.log(`The last occurrence of each duplicate character would overwrite the first.`);
  console.log(`If the last occurrence has lower frequency, this explains the bug!`);
} else {
  console.log(`\n✓ No duplicates found. The problem is elsewhere.`);
}
