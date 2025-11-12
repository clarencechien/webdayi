/**
 * Diagnostic Script: Chinese Text Recognition Issues
 *
 * This script tests the specific failing examples reported by the user:
 * 1. "大家嫭毧暰大學生" should be "大家好我是大學生"
 * 2. "明天天氣嬌俏侚艭傻嗎" should be "明天天氣如何會放假嗎"
 *
 * We'll trace through the Viterbi algorithm to understand why it's selecting
 * the wrong characters.
 */

const fs = require('fs');
const path = require('path');

// Load databases
const dayiDbPath = path.join(__dirname, 'dayi_db.json');
const ngramDbPath = path.join(__dirname, 'ngram_db.json');

console.log('Loading databases...');
const dayiDbRaw = JSON.parse(fs.readFileSync(dayiDbPath, 'utf-8'));
const ngramDb = JSON.parse(fs.readFileSync(ngramDbPath, 'utf-8'));

// Convert to Map
const dayiDb = new Map(Object.entries(dayiDbRaw));

console.log(`Loaded ${dayiDb.size} Dayi codes`);
console.log(`Loaded ${Object.keys(ngramDb.unigrams).length} unigrams`);
console.log(`Loaded ${Object.keys(ngramDb.bigrams).length} bigrams`);
console.log('');

// Test Case 1
console.log('=== Test Case 1 ===');
console.log('Expected: 大家好我是大學生');
console.log('Got:      大家嫭毧暰大學生');
console.log('Codes:    v m, lg v5 d9 v wg 2e');
console.log('');

const test1Codes = ['v', 'm,', 'lg', 'v5', 'd9', 'v', 'wg', '2e'];
const test1Expected = ['大', '家', '好', '我', '是', '大', '學', '生'];

console.log('Checking candidates for each code:');
test1Codes.forEach((code, i) => {
  const candidates = dayiDb.get(code);
  if (candidates) {
    const topCandidates = candidates.slice(0, 5).map(c => `${c.char}(${c.freq})`).join(', ');
    const expectedChar = test1Expected[i];
    const expectedInList = candidates.find(c => c.char === expectedChar);
    const expectedRank = expectedInList ? candidates.indexOf(expectedInList) + 1 : 'NOT FOUND';
    console.log(`  ${code}: [${topCandidates}]`);
    console.log(`         Expected '${expectedChar}' at rank ${expectedRank}`);
  } else {
    console.log(`  ${code}: NO CANDIDATES`);
  }
});
console.log('');

// Check N-gram probabilities for expected sequence
console.log('Checking N-gram probabilities for expected sequence:');
for (let i = 0; i < test1Expected.length; i++) {
  const char = test1Expected[i];
  const prevChar = i > 0 ? test1Expected[i - 1] : null;

  const unigramProb = ngramDb.unigrams[char] || 0;
  const unigramCount = ngramDb.unigram_counts[char] || 0;

  if (prevChar) {
    const bigram = prevChar + char;
    const bigramProb = ngramDb.bigrams[bigram] || 0;
    const bigramCount = ngramDb.bigram_counts[bigram] || 0;
    console.log(`  ${prevChar} → ${char}: bigram_prob=${bigramProb.toFixed(8)}, bigram_count=${bigramCount}, unigram_prob=${unigramProb.toFixed(8)}, unigram_count=${unigramCount}`);
  } else {
    console.log(`  ${char}: unigram_prob=${unigramProb.toFixed(8)}, unigram_count=${unigramCount}`);
  }
}
console.log('');

// Test Case 2
console.log('=== Test Case 2 ===');
console.log('Expected: 明天天氣如何會放假嗎');
console.log('Got:      明天天氣嬌俏侚艭傻嗎');
console.log('Codes:    dj ev ev c8 lo aj ad .x ax ob');
console.log('');

const test2Codes = ['dj', 'ev', 'ev', 'c8', 'lo', 'aj', 'ad', '.x', 'ax', 'ob'];
const test2Expected = ['明', '天', '天', '氣', '如', '何', '會', '放', '假', '嗎'];

console.log('Checking candidates for each code:');
test2Codes.forEach((code, i) => {
  const candidates = dayiDb.get(code);
  if (candidates) {
    const topCandidates = candidates.slice(0, 5).map(c => `${c.char}(${c.freq})`).join(', ');
    const expectedChar = test2Expected[i];
    const expectedInList = candidates.find(c => c.char === expectedChar);
    const expectedRank = expectedInList ? candidates.indexOf(expectedInList) + 1 : 'NOT FOUND';
    console.log(`  ${code}: [${topCandidates}]`);
    console.log(`         Expected '${expectedChar}' at rank ${expectedRank}`);
  } else {
    console.log(`  ${code}: NO CANDIDATES`);
  }
});
console.log('');

// Check N-gram probabilities for expected sequence
console.log('Checking N-gram probabilities for expected sequence:');
for (let i = 0; i < test2Expected.length; i++) {
  const char = test2Expected[i];
  const prevChar = i > 0 ? test2Expected[i - 1] : null;

  const unigramProb = ngramDb.unigrams[char] || 0;
  const unigramCount = ngramDb.unigram_counts[char] || 0;

  if (prevChar) {
    const bigram = prevChar + char;
    const bigramProb = ngramDb.bigrams[bigram] || 0;
    const bigramCount = ngramDb.bigram_counts[bigram] || 0;
    console.log(`  ${prevChar} → ${char}: bigram_prob=${bigramProb.toFixed(8)}, bigram_count=${bigramCount}, unigram_prob=${unigramProb.toFixed(8)}, unigram_count=${unigramCount}`);
  } else {
    console.log(`  ${char}: unigram_prob=${unigramProb.toFixed(8)}, unigram_count=${unigramCount}`);
  }
}
console.log('');

// Summary
console.log('=== Summary ===');
console.log('Possible issues:');
console.log('1. Expected characters are not ranked first by frequency (freq field)');
console.log('2. N-gram probabilities are too low or zero for expected bigrams');
console.log('3. Laplace smoothing parameters might not be tuned correctly');
console.log('');
console.log('N-gram DB metadata:');
console.log(`  smoothing_alpha: ${ngramDb.smoothing_alpha}`);
console.log(`  total_chars: ${ngramDb.total_chars}`);
console.log(`  vocab_size: ${ngramDb.vocab_size}`);
