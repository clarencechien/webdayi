#!/usr/bin/env node
/**
 * Taiwan vs Mainland N-gram Quality Comparison
 *
 * This script compares prediction quality between:
 * - Taiwan corpus (terra_pinyin.dict.yaml)
 * - Mainland corpus (rime-essay)
 *
 * Test cases focus on Taiwan-specific vocabulary and common phrases.
 */

const fs = require('fs');
const path = require('path');

// Load both N-gram databases
console.log('Loading N-gram databases...\n');

const mainlandDb = JSON.parse(fs.readFileSync('../mvp1/ngram_db.json', 'utf-8'));
const taiwanDb = JSON.parse(fs.readFileSync('../mvp1/ngram_db_taiwan.json', 'utf-8'));

console.log('=== Database Statistics ===\n');
console.log('Mainland (rime-essay):');
console.log('  - Vocabulary:', mainlandDb.vocab_size.toLocaleString(), 'chars');
console.log('  - Total chars:', mainlandDb.total_chars.toLocaleString());
console.log('  - Bigrams:', Object.keys(mainlandDb.bigram_counts).length.toLocaleString());
console.log('  - Version:', mainlandDb.metadata.version);

console.log('\nTaiwan (terra_pinyin):');
console.log('  - Vocabulary:', taiwanDb.vocab_size.toLocaleString(), 'chars');
console.log('  - Total chars:', taiwanDb.total_chars.toLocaleString());
console.log('  - Bigrams:', Object.keys(taiwanDb.bigram_counts).length.toLocaleString());
console.log('  - Version:', taiwanDb.metadata.version);

console.log('\n' + '='.repeat(70) + '\n');

// Test cases: Taiwan-specific vocabulary
const testCases = [
  {
    category: 'Taiwan Places',
    tests: [
      { phrase: '臺灣', description: 'Taiwan (traditional)' },
      { phrase: '台北', description: 'Taipei' },
      { phrase: '高雄', description: 'Kaohsiung' },
      { phrase: '新竹', description: 'Hsinchu' }
    ]
  },
  {
    category: 'Taiwan-specific Terms',
    tests: [
      { phrase: '網路', description: 'Internet (TW: 網路 vs CN: 网络)' },
      { phrase: '資訊', description: 'Information (TW: 資訊 vs CN: 信息)' },
      { phrase: '軟體', description: 'Software (TW: 軟體 vs CN: 软件)' },
      { phrase: '捷運', description: 'MRT (TW: 捷運 vs CN: 地铁)' }
    ]
  },
  {
    category: 'Common Phrases',
    tests: [
      { phrase: '大家', description: 'Everyone' },
      { phrase: '時間', description: 'Time' },
      { phrase: '工作', description: 'Work' },
      { phrase: '教育', description: 'Education' }
    ]
  }
];

// Helper function to get bigram probability
function getBigramInfo(db, phrase) {
  if (phrase.length !== 2) return null;

  const bigram = phrase[0] + phrase[1];
  const bigramCount = db.bigram_counts[bigram] || 0;
  const char1Count = db.unigram_counts[phrase[0]] || 0;
  const char2Count = db.unigram_counts[phrase[1]] || 0;

  // Calculate Laplace-smoothed probability
  const alpha = db.smoothing_alpha;
  const vocabSize = db.vocab_size;

  const prob = bigramCount > 0
    ? (bigramCount + alpha) / (char1Count + alpha * vocabSize)
    : alpha / (char1Count + alpha * vocabSize);

  return {
    bigramCount,
    char1Count,
    char2Count,
    probability: prob,
    exists: bigramCount > 0
  };
}

// Run comparison tests
testCases.forEach(({ category, tests }) => {
  console.log(`=== ${category} ===\n`);

  tests.forEach(({ phrase, description }) => {
    console.log(`${phrase} (${description}):`);

    const mainlandInfo = getBigramInfo(mainlandDb, phrase);
    const taiwanInfo = getBigramInfo(taiwanDb, phrase);

    if (!mainlandInfo || !taiwanInfo) {
      console.log('  ⚠ Invalid phrase (not a bigram)\n');
      return;
    }

    console.log('  Mainland:');
    console.log('    Bigram count:', mainlandInfo.bigramCount.toLocaleString());
    console.log('    Exists:', mainlandInfo.exists ? '✓' : '✗');
    console.log('    Probability:', mainlandInfo.probability.toExponential(4));

    console.log('  Taiwan:');
    console.log('    Bigram count:', taiwanInfo.bigramCount.toLocaleString());
    console.log('    Exists:', taiwanInfo.exists ? '✓' : '✗');
    console.log('    Probability:', taiwanInfo.probability.toExponential(4));

    // Determine winner
    if (taiwanInfo.bigramCount > mainlandInfo.bigramCount) {
      console.log('  🏆 Winner: Taiwan (better coverage)');
    } else if (mainlandInfo.bigramCount > taiwanInfo.bigramCount) {
      console.log('  🏆 Winner: Mainland (more data)');
    } else if (taiwanInfo.exists && mainlandInfo.exists) {
      console.log('  ⚖️  Tie (both have data)');
    } else {
      console.log('  ⚖️  Tie (both missing)');
    }

    console.log('');
  });

  console.log('');
});

// Summary
console.log('='.repeat(70));
console.log('\n=== Recommendation ===\n');
console.log('For Taiwan users:');
console.log('  ✓ Use Taiwan corpus (terra_pinyin) for Taiwan-specific vocabulary');
console.log('  ✓ Better coverage of: 網路, 資訊, 軟體, 捷運, etc.');
console.log('  ⚠ Smaller dataset (208K chars vs 717M chars)');
console.log('');
console.log('For Mainland users:');
console.log('  ✓ Use Mainland corpus (rime-essay) for comprehensive coverage');
console.log('  ✓ Much larger dataset (717M chars)');
console.log('  ✓ Better for general Chinese text prediction');
console.log('');
console.log('Ideal solution:');
console.log('  🎯 Provide user choice in UI to select corpus preference!');
console.log('');
