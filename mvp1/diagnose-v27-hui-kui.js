#!/usr/bin/env node
/**
 * Diagnose why browser selects 儈 instead of 會
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('🔍 Diagnosing Position 6: ad → 儈 vs 會');
console.log('='.repeat(80));
console.log('');

// Load v2.7
const v27Code = fs.readFileSync(path.join(__dirname, 'viterbi_module.js'), 'utf8');
eval(v27Code);

// Load databases
const dayiDbData = JSON.parse(fs.readFileSync(path.join(__dirname, 'dayi_db.json'), 'utf8'));
const dayiDb = new Map(Object.entries(dayiDbData));
const ngramDb = JSON.parse(fs.readFileSync(path.join(__dirname, 'ngram_db.json'), 'utf8'));

console.log('Database Info:');
console.log(`  total_chars: ${ngramDb.total_chars}`);
console.log(`  vocab_size: ${ngramDb.vocab_size}`);
console.log(`  smoothing_alpha: ${ngramDb.smoothing_alpha}`);
console.log('');

// Get candidates for code "ad"
const candidates_ad = dayiDb.get('ad');
console.log(`Candidates for code "ad": ${candidates_ad.length}`);

// Find 會 and 儈
const hui_會 = candidates_ad.find(c => c.char === '會');
const kui_儈 = candidates_ad.find(c => c.char === '儈');

console.log('');
console.log('Character Details:');
console.log(`  會: freq=${hui_會.freq}, rank=${candidates_ad.indexOf(hui_會) + 1}`);
console.log(`  儈: freq=${kui_儈 ? kui_儈.freq : 'NOT FOUND'}, rank=${kui_儈 ? candidates_ad.indexOf(kui_儈) + 1 : 'N/A'}`);
console.log('');

// Calculate probabilities using v2.7 functions
console.log('Unigram Probabilities (P(char)):');
const p_hui = getLaplaceUnigram('會', ngramDb);
const p_kui = kui_儈 ? getLaplaceUnigram('儈', ngramDb) : 0;
console.log(`  P(會) = ${p_hui.toExponential(6)}`);
console.log(`  P(儈) = ${p_kui.toExponential(6)}`);
console.log(`  Ratio: P(會)/P(儈) = ${(p_hui / p_kui).toFixed(2)}x`);
console.log('');

// Check unigram counts
console.log('Unigram Counts:');
console.log(`  count(會) = ${ngramDb.unigram_counts['會'] || 0}`);
console.log(`  count(儈) = ${ngramDb.unigram_counts['儈'] || 0}`);
console.log('');

// Check bigram probabilities from previous character (何)
console.log('Bigram Probabilities from 何:');
const p_bigram_hui = getLaplaceBigram('何', '會', ngramDb);
const p_bigram_kui = getLaplaceBigram('何', '儈', ngramDb);
console.log(`  P(會|何) = ${p_bigram_hui.toExponential(6)}`);
console.log(`  P(儈|何) = ${p_bigram_kui.toExponential(6)}`);
console.log(`  Ratio: P(會|何)/P(儈|何) = ${(p_bigram_hui / p_bigram_kui).toFixed(2)}x`);
console.log('');

// Check bigram counts
console.log('Bigram Counts:');
console.log(`  count(何會) = ${ngramDb.bigram_counts['何會'] || 0}`);
console.log(`  count(何儈) = ${ngramDb.bigram_counts['何儈'] || 0}`);
console.log(`  count(何) = ${ngramDb.unigram_counts['何'] || 0}`);
console.log('');

// Calculate v2.7 weighted scores
const BIGRAM_WEIGHT = 0.7;
const UNIGRAM_WEIGHT = 0.3;

const score_hui = (BIGRAM_WEIGHT * Math.log(p_bigram_hui)) + (UNIGRAM_WEIGHT * Math.log(p_hui));
const score_kui = (BIGRAM_WEIGHT * Math.log(p_bigram_kui)) + (UNIGRAM_WEIGHT * Math.log(p_kui));

console.log('v2.7 Weighted Scores (70/30):');
console.log(`  score(會) = 0.7 * log(P(會|何)) + 0.3 * log(P(會))`);
console.log(`           = 0.7 * ${Math.log(p_bigram_hui).toFixed(4)} + 0.3 * ${Math.log(p_hui).toFixed(4)}`);
console.log(`           = ${score_hui.toFixed(6)}`);
console.log('');
console.log(`  score(儈) = 0.7 * log(P(儈|何)) + 0.3 * log(P(儈))`);
console.log(`           = 0.7 * ${Math.log(p_bigram_kui).toFixed(4)} + 0.3 * ${Math.log(p_kui).toFixed(4)}`);
console.log(`           = ${score_kui.toFixed(6)}`);
console.log('');
console.log(`  Difference: score(會) - score(儈) = ${(score_hui - score_kui).toFixed(6)}`);
console.log('');

if (score_hui > score_kui) {
    console.log('✅ EXPECTED: 會 should win (higher score)');
} else {
    console.log('⚠️ PROBLEM: 儈 has higher score! This explains the browser behavior.');
}

console.log('');
console.log('='.repeat(80));
console.log('🎯 ANALYSIS:');
console.log('='.repeat(80));
console.log('');

// Run full viterbi to check actual result
const codes = ['dj', 'ev', 'ev', 'c8', 'lo', 'aj', 'ad', '.x', 'ax', 'ob'];
const result = viterbi(codes, dayiDb, ngramDb);

console.log('Full Viterbi Result:');
console.log(`  Sentence: ${result.sentence}`);
console.log(`  Position 6 (ad): ${result.chars[6]}`);
console.log(`  Score: ${result.score.toFixed(6)}`);
console.log('');

if (result.chars[6] === '會') {
    console.log('✅ Node.js test produces: 會 (correct)');
    console.log('⚠️ Browser produces: 儈 (wrong)');
    console.log('');
    console.log('Possible causes:');
    console.log('  1. Browser cached old viterbi_module.js');
    console.log('  2. ngram_db.json not loaded correctly in browser');
    console.log('  3. JavaScript precision differences');
    console.log('  4. Different code path taken in browser');
} else if (result.chars[6] === '儈') {
    console.log('⚠️ Both Node.js and browser produce: 儈');
    console.log('');
    console.log('This means v2.7 has a bug. The algorithm incorrectly prefers 儈 over 會.');
    console.log('Possible causes:');
    console.log('  1. Laplace smoothing parameters incorrect');
    console.log('  2. 70/30 weighting insufficient');
    console.log('  3. Need to check previous characters in path');
}

console.log('');
