#!/usr/bin/env node
/**
 * Test v2.7 Browser Version (viterbi_module_v27.js)
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('🧪 Testing v2.7 Browser Version');
console.log('='.repeat(80));
console.log('');

// Load v2.7 browser version
const v27Code = fs.readFileSync(path.join(__dirname, 'viterbi_module_v27.js'), 'utf8');
eval(v27Code);

// Load databases
const dayiDbData = JSON.parse(fs.readFileSync(path.join(__dirname, 'dayi_db.json'), 'utf8'));
const dayiDb = new Map(Object.entries(dayiDbData));
const ngramDb = JSON.parse(fs.readFileSync(path.join(__dirname, 'ngram_db.json'), 'utf8'));

console.log('✓ Databases loaded');
console.log('✓ Viterbi v2.7 browser module loaded');
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
    const result = viterbi(testCase.codes, dayiDb, ngramDb);

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

if (overallAccuracy >= 90) {
    console.log('✅✅✅ SUCCESS! Browser version works perfectly!');
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Backup current viterbi_module.js → viterbi_module_v25_backup.js');
    console.log('  2. Replace viterbi_module.js with viterbi_module_v27.js');
    console.log('  3. Update version.json to v11.3.5 (v2.7 upgrade)');
    console.log('  4. Update index.html cache-busting parameter');
    console.log('  5. Commit and push');
} else {
    console.log('⚠️ Performance issue detected');
}

console.log('');
