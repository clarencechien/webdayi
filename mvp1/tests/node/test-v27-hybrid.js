#!/usr/bin/env node
/**
 * Test v2.7 Hybrid Implementation
 *
 * Verify that v2.7 (OOP structure + 70/30 weights + Laplace smoothing)
 * achieves the same 90% accuracy as v2.5
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('🧪 Testing v2.7 Hybrid Implementation');
console.log('='.repeat(80));
console.log('');
console.log('Architecture:');
console.log('  - Code Structure: v2.6 OOP design (clean, modular)');
console.log('  - Weighting: v2.5 golden ratio (70/30)');
console.log('  - Smoothing: v2.5 Laplace smoothing (rigorous)');
console.log('');
console.log('Expected Result: 90% accuracy (same as v2.5)');
console.log('');

// Load v2.7
const { viterbi_v27 } = require('./viterbi_v27_hybrid.js');

// Load databases
const dayiDbData = JSON.parse(fs.readFileSync(path.join(__dirname, 'dayi_db.json'), 'utf8'));
const dayiDb = new Map(Object.entries(dayiDbData));
const ngramDb = JSON.parse(fs.readFileSync(path.join(__dirname, 'ngram_db.json'), 'utf8'));

console.log('✓ Databases loaded');
console.log('✓ Viterbi v2.7 module loaded');
console.log('');

// Test cases
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

let totalCorrect = 0;
let totalChars = 0;

for (const testCase of testCases) {
    console.log('─'.repeat(80));
    console.log(testCase.name);
    console.log('─'.repeat(80));
    console.log('Codes:    ' + testCase.codes.join(' '));
    console.log('Expected: ' + testCase.expected.join(''));
    console.log('');

    // Run v2.7
    const result = viterbi_v27(testCase.codes, dayiDb, ngramDb);

    console.log('Got:      ' + result.sentence);
    console.log('Score:    ' + result.score.toFixed(6));
    console.log('');

    // Character-by-character analysis
    let correctCount = 0;
    console.log('Character-by-character:');
    for (let i = 0; i < testCase.expected.length; i++) {
        const status = result.chars[i] === testCase.expected[i] ? '✓' : '✗';
        const statusColor = result.chars[i] === testCase.expected[i] ? '' : ' ← WRONG';
        console.log(`  ${i}. ${testCase.codes[i]} → ${result.chars[i]} (expected: ${testCase.expected[i]}) ${status}${statusColor}`);

        if (result.chars[i] === testCase.expected[i]) {
            correctCount++;
        }
    }

    totalCorrect += correctCount;
    totalChars += testCase.expected.length;

    const accuracy = (correctCount / testCase.expected.length * 100).toFixed(0);
    console.log('');
    console.log(`Accuracy: ${correctCount}/${testCase.expected.length} (${accuracy}%)`);
    console.log('');
}

console.log('='.repeat(80));
console.log('🎯 FINAL VERDICT:');
console.log('='.repeat(80));
console.log('');

const overallAccuracy = (totalCorrect / totalChars * 100).toFixed(1);
console.log(`Overall Accuracy: ${totalCorrect}/${totalChars} (${overallAccuracy}%)`);
console.log('');

// Compare with v2.5
console.log('Comparison with v2.5:');
console.log('  - v2.5: 90% accuracy (9/10 on Test 2)');
console.log(`  - v2.7: ${overallAccuracy}% accuracy`);
console.log('');

if (overallAccuracy >= 90) {
    console.log('✅✅✅ SUCCESS! v2.7 MATCHES v2.5 PERFORMANCE!');
    console.log('');
    console.log('Benefits of v2.7:');
    console.log('  ✓ Clean OOP architecture (easier to understand)');
    console.log('  ✓ Adjustable weight parameters (BIGRAM_WEIGHT / UNIGRAM_WEIGHT)');
    console.log('  ✓ Same 90% accuracy as v2.5');
    console.log('  ✓ Proven Laplace smoothing algorithm');
    console.log('');
    console.log('📦 Recommendation: Replace v2.5 with v2.7 in production');
    console.log('   - Easier to maintain');
    console.log('   - Easier to tune weights if needed');
    console.log('   - Same accuracy, better code quality');
} else if (overallAccuracy >= 85) {
    console.log('✓ Good performance, but slightly lower than v2.5');
    console.log('');
    console.log('Recommendation: Keep v2.5 for now, investigate differences');
} else {
    console.log('⚠️ Performance regression detected');
    console.log('');
    console.log('Recommendation: Debug getBigramProb() and getUnigramProb()');
    console.log('  - Verify Laplace smoothing parameters');
    console.log('  - Check if ngramDb has all required fields');
}

console.log('');
