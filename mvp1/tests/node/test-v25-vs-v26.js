#!/usr/bin/env node
/**
 * Compare v2.5 vs v2.6 Alternative Implementation
 *
 * v2.5: 70/30 weighting + Laplace smoothing
 * v2.6: 60/40 weighting + Backoff with 0.4 penalty
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('🔬 Comparing v2.5 (current) vs v2.6 (alternative)');
console.log('='.repeat(80));
console.log('');

// --- Load v2.5 (current implementation) ---
const v25Code = fs.readFileSync(path.join(__dirname, 'viterbi_module.js'), 'utf8');
eval(v25Code);
const viterbi_v25 = viterbi; // Store reference

// --- Load v2.6 (alternative implementation) ---
const { viterbi_v26 } = require('./viterbi_v26_alternative.js');

// --- Load databases ---
const dayiDbData = JSON.parse(fs.readFileSync(path.join(__dirname, 'dayi_db.json'), 'utf8'));
const dayiDb = new Map(Object.entries(dayiDbData));
const ngramDb = JSON.parse(fs.readFileSync(path.join(__dirname, 'ngram_db.json'), 'utf8'));

console.log('✓ Databases loaded');
console.log('');

// --- Test cases ---
const testCases = [
    {
        name: 'Test Case 1: 大家好我是大學生',
        codes: ['v', 'm,', 'lg', 'v5', 'd9', 'v', 'wg', '2e'],
        expected: ['大', '家', '好', '我', '是', '大', '學', '生']
    },
    {
        name: 'Test Case 2: 明天天氣如何會放假嗎',
        codes: ['dj', 'ev', 'ev', 'c8', 'lo', 'aj', 'ad', '.x', 'ax', 'ob'],
        expected: ['明', '天', '天', '氣', '如', '何', '會', '放', '假', '嗎']
    }
];

console.log('='.repeat(80));
console.log('📊 RESULTS:');
console.log('='.repeat(80));
console.log('');

for (const testCase of testCases) {
    console.log('─'.repeat(80));
    console.log(testCase.name);
    console.log('─'.repeat(80));
    console.log('Expected: ' + testCase.expected.join(''));
    console.log('');

    // Run v2.5
    const result_v25 = viterbi_v25(testCase.codes, dayiDb, ngramDb);
    let correct_v25 = 0;
    for (let i = 0; i < testCase.expected.length; i++) {
        if (result_v25.chars[i] === testCase.expected[i]) correct_v25++;
    }

    // Run v2.6
    const result_v26 = viterbi_v26(testCase.codes, dayiDb, ngramDb);
    let correct_v26 = 0;
    for (let i = 0; i < testCase.expected.length; i++) {
        if (result_v26.chars[i] === testCase.expected[i]) correct_v26++;
    }

    console.log('v2.5 (70/30 + Laplace):');
    console.log(`  Result:   ${result_v25.sentence}`);
    console.log(`  Score:    ${result_v25.score.toFixed(6)}`);
    console.log(`  Accuracy: ${correct_v25}/${testCase.expected.length} (${(correct_v25/testCase.expected.length*100).toFixed(0)}%)`);
    console.log('');

    console.log('v2.6 (60/40 + Backoff):');
    console.log(`  Result:   ${result_v26.sentence}`);
    console.log(`  Score:    ${result_v26.score.toFixed(6)}`);
    console.log(`  Accuracy: ${correct_v26}/${testCase.expected.length} (${(correct_v26/testCase.expected.length*100).toFixed(0)}%)`);
    console.log('');

    // Character-by-character comparison
    console.log('Character-by-character comparison:');
    for (let i = 0; i < testCase.expected.length; i++) {
        const v25_char = result_v25.chars[i];
        const v26_char = result_v26.chars[i];
        const expected_char = testCase.expected[i];

        const v25_status = v25_char === expected_char ? '✓' : '✗';
        const v26_status = v26_char === expected_char ? '✓' : '✗';

        let comparison = '';
        if (v25_char === expected_char && v26_char !== expected_char) {
            comparison = ' ← v2.5 BETTER';
        } else if (v26_char === expected_char && v25_char !== expected_char) {
            comparison = ' ← v2.6 BETTER';
        } else if (v25_char !== expected_char && v26_char !== expected_char && v25_char !== v26_char) {
            comparison = ' ← BOTH WRONG (different)';
        }

        console.log(`  ${i}. ${testCase.codes[i]}: expected ${expected_char}, v2.5=${v25_char} ${v25_status}, v2.6=${v26_char} ${v26_status}${comparison}`);
    }
    console.log('');
}

console.log('='.repeat(80));
console.log('🎯 ANALYSIS:');
console.log('='.repeat(80));
console.log('');
console.log('Algorithm Differences:');
console.log('');
console.log('v2.5 (Current):');
console.log('  - Weights: 70% bigram + 30% unigram');
console.log('  - Smoothing: Full Laplace smoothing with alpha=0.1');
console.log('  - Formula: (count + α) / (total + α * vocab_size)');
console.log('  - Pros: Statistically rigorous, proven 90% accuracy');
console.log('');
console.log('v2.6 (Alternative):');
console.log('  - Weights: 60% bigram + 40% unigram');
console.log('  - Smoothing: Simple +1 smoothing + Backoff with 0.4 penalty');
console.log('  - Backoff: Unseen bigrams get unigram * 0.4 instead of 0');
console.log('  - Pros: More conservative (trusts character frequency more)');
console.log('');
console.log('Recommendation:');
console.log('  If v2.6 >= 90% accuracy: Consider switching (simpler, more intuitive)');
console.log('  If v2.6 < 90% accuracy: Keep v2.5 (current champion)');
console.log('  If v2.6 fixes position 3 (天真→天氣): Definitely switch!');
console.log('');
