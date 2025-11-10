/**
 * N-gram Prediction Quality Diagnostic Tool
 *
 * 用途：診斷 N-gram 效果不佳的原因
 *
 * 可能原因：
 * 1. 演算法問題（Viterbi 實作錯誤）
 * 2. 資料品質問題（ngram_db.json 訓練不足）
 * 3. Smoothing 問題（unseen bigrams 處理不當）
 */

// ============================================
// Load Dependencies
// ============================================

const fs = require('fs');
const path = require('path');

// Load N-gram database
const ngramDbPath = path.join(__dirname, 'ngram_db.json');
const ngramDb = JSON.parse(fs.readFileSync(ngramDbPath, 'utf-8'));

// Load dayi database
const dayiDbPath = path.join(__dirname, 'dayi_db.json');
const dayiDb = JSON.parse(fs.readFileSync(dayiDbPath, 'utf-8'));
const dayiMap = new Map(Object.entries(dayiDb));

// Load Viterbi module
const viterbiPath = path.join(__dirname, 'viterbi_module.js');
eval(fs.readFileSync(viterbiPath, 'utf-8'));

// ============================================
// Diagnostic Functions
// ============================================

/**
 * Test 1: Check N-gram Database Quality
 */
function testNgramDataQuality() {
  console.log('\n=== Test 1: N-gram Database Quality ===\n');

  const unigrams = ngramDb.unigrams || {};
  const bigrams = ngramDb.bigrams || {};

  console.log(`Unigrams: ${Object.keys(unigrams).length}`);
  console.log(`Bigrams: ${Object.keys(bigrams).length}`);
  console.log(`Total chars: ${ngramDb.total_chars || 'NOT SET'} ⚠️`);
  console.log(`Smoothing alpha: ${ngramDb.smoothing_alpha || 'NOT SET'} ⚠️`);

  // Check top unigrams sum to reasonable probability
  const unigramSum = Object.values(unigrams).reduce((a, b) => a + b, 0);
  console.log(`\nUnigram probability sum: ${unigramSum.toFixed(6)}`);
  if (Math.abs(unigramSum - 1.0) > 0.01) {
    console.log('  ⚠️  WARNING: Unigrams don't sum to 1.0!');
  } else {
    console.log('  ✓ Unigrams properly normalized');
  }

  // Check common bigrams
  const testBigrams = [
    '的是', '一個', '可以', '這個', '我們', '中國',
    '不是', '在這', '他的', '我的'
  ];

  console.log('\nCommon bigram coverage:');
  let found = 0;
  for (const bg of testBigrams) {
    if (bigrams[bg]) {
      found++;
      console.log(`  ✓ ${bg}: ${bigrams[bg].toFixed(8)}`);
    } else {
      console.log(`  ✗ ${bg}: MISSING`);
    }
  }
  console.log(`Coverage: ${found}/${testBigrams.length} (${(found/testBigrams.length*100).toFixed(1)}%)`);

  return {
    unigramCount: Object.keys(unigrams).length,
    bigramCount: Object.keys(bigrams).length,
    hasSmoothing: !!ngramDb.smoothing_alpha,
    hasTotalChars: !!ngramDb.total_chars,
    unigramNormalized: Math.abs(unigramSum - 1.0) < 0.01,
    bigramCoverage: found / testBigrams.length
  };
}

/**
 * Test 2: Check Viterbi Algorithm
 */
function testViterbiAlgorithm() {
  console.log('\n=== Test 2: Viterbi Algorithm Check ===\n');

  // Test case: 大易在中國 (a ad 7c 7p 9jk)
  const testCases = [
    {
      name: '常見詞組',
      codes: ['a', 'ad'],  // 大在
      expected: '大在'
    },
    {
      name: '常見句子',
      codes: ['a', 'ad', '7c'],  // 大在中
      expected: '大在中'
    }
  ];

  let passed = 0;
  for (const testCase of testCases) {
    console.log(`Test: ${testCase.name}`);
    console.log(`Codes: ${testCase.codes.join(', ')}`);

    try {
      const result = viterbi(testCase.codes, dayiMap, ngramDb);
      const predicted = result.path.join('');

      console.log(`Expected: ${testCase.expected}`);
      console.log(`Predicted: ${predicted}`);
      console.log(`Score: ${result.score.toFixed(6)}`);

      if (predicted === testCase.expected) {
        console.log('✓ PASS\n');
        passed++;
      } else {
        console.log('✗ FAIL\n');

        // Debug: show alternative paths
        console.log('Top candidates for each position:');
        for (let i = 0; i < testCase.codes.length; i++) {
          const code = testCase.codes[i];
          const candidates = dayiMap.get(code) || [];
          console.log(`  ${code}: ${candidates.slice(0, 5).map(c => c.char).join(', ')}`);
        }
        console.log('');
      }
    } catch (error) {
      console.log(`✗ ERROR: ${error.message}\n`);
    }
  }

  console.log(`Viterbi Tests: ${passed}/${testCases.length} passed`);
  return { passed, total: testCases.length };
}

/**
 * Test 3: Check Smoothing Impact
 */
function testSmoothingImpact() {
  console.log('\n=== Test 3: Smoothing Impact Analysis ===\n');

  const bigrams = ngramDb.bigrams || {};

  // Find unseen bigram examples
  const unseenExamples = [
    '大易', '易大', '中文', '文中',
    '輸入', '入法', '測試', '試用'
  ];

  console.log('Checking unseen bigrams (應該用 smoothing):');
  let unseenCount = 0;
  for (const bg of unseenExamples) {
    const prob = bigrams[bg];
    if (!prob) {
      unseenCount++;
      console.log(`  ${bg}: UNSEEN (會被賦予 ${1e-10})`);
    } else {
      console.log(`  ${bg}: ${prob.toFixed(8)} (在訓練資料中)`);
    }
  }

  console.log(`\nUnseen bigrams: ${unseenCount}/${unseenExamples.length}`);

  if (unseenCount > 0) {
    console.log('\n⚠️  WARNING: Unseen bigrams 使用 hardcoded 1e-10');
    console.log('   建議：實作 Laplace smoothing');
    console.log('   公式：P(w2|w1) = (count(w1,w2) + α) / (count(w1) + α*V)');
  }

  return { unseenCount, total: unseenExamples.length };
}

/**
 * Test 4: Real-world Prediction Test
 */
function testRealWorldPrediction() {
  console.log('\n=== Test 4: Real-world Prediction Test ===\n');

  // 真實測試案例
  const realTests = [
    {
      name: '我在大易',
      codes: ['2i', 'ad', 'a', '4jp'],
      // 2i: 我, ad: 在, a: 大, 4jp: 易
      hint: '2i=我, ad=在, a=大, 4jp=易'
    },
    {
      name: '中國人',
      codes: ['7c', '9jk', '2v'],
      hint: '7c=中, 9jk=國, 2v=人'
    }
  ];

  for (const test of realTests) {
    console.log(`\n測試: ${test.name}`);
    console.log(`編碼: ${test.codes.join(' ')}`);
    console.log(`提示: ${test.hint}`);

    try {
      const result = viterbi(test.codes, dayiMap, ngramDb);
      console.log(`預測: ${result.path.join('')}`);
      console.log(`分數: ${result.score.toFixed(6)}`);

      // Show detail for each position
      console.log('\n每個位置的最佳選擇:');
      for (let i = 0; i < test.codes.length; i++) {
        const code = test.codes[i];
        const char = result.path[i];
        const candidates = dayiMap.get(code) || [];
        const topCandidates = candidates.slice(0, 3).map(c => c.char).join(', ');
        console.log(`  ${code} → ${char} (其他: ${topCandidates})`);
      }
    } catch (error) {
      console.log(`錯誤: ${error.message}`);
    }
  }
}

/**
 * Test 5: Identify Root Cause
 */
function identifyRootCause(test1, test2, test3) {
  console.log('\n=== Root Cause Analysis ===\n');

  const issues = [];

  // Check data quality
  if (!test1.hasSmoothing || !test1.hasTotalChars) {
    issues.push({
      type: 'DATA',
      severity: 'HIGH',
      issue: 'ngram_db.json 缺少 smoothing 參數',
      fix: '重新生成 ngram_db.json，加入 total_chars 和 smoothing_alpha'
    });
  }

  if (test1.bigramCoverage < 0.8) {
    issues.push({
      type: 'DATA',
      severity: 'MEDIUM',
      issue: '常見 bigram 覆蓋率不足',
      fix: '使用更大的訓練語料（essay.txt 可能太小）'
    });
  }

  if (!test1.unigramNormalized) {
    issues.push({
      type: 'DATA',
      severity: 'HIGH',
      issue: 'Unigram 機率未正規化（總和 ≠ 1）',
      fix: '檢查 build_ngram.py 的機率計算'
    });
  }

  // Check algorithm
  if (test2.passed < test2.total) {
    issues.push({
      type: 'ALGORITHM',
      severity: 'HIGH',
      issue: 'Viterbi 演算法測試未通過',
      fix: '檢查 viterbi_module.js 實作'
    });
  }

  // Check smoothing
  if (test3.unseenCount > 0) {
    issues.push({
      type: 'ALGORITHM',
      severity: 'MEDIUM',
      issue: 'Unseen bigrams 使用 hardcoded 極小值（1e-10）',
      fix: '實作 Laplace smoothing: P(w2|w1) = (count+α)/(total+α*V)'
    });
  }

  // Report
  if (issues.length === 0) {
    console.log('✓ 未發現明顯問題');
    console.log('  如果效果仍不理想，可能需要：');
    console.log('  1. 更大的訓練語料');
    console.log('  2. 調整 smoothing 參數');
    console.log('  3. 使用更複雜的語言模型（trigram, 4-gram）');
  } else {
    console.log(`發現 ${issues.length} 個問題:\n`);

    issues.forEach((issue, i) => {
      console.log(`${i+1}. [${issue.type}] ${issue.issue}`);
      console.log(`   嚴重性: ${issue.severity}`);
      console.log(`   解決方案: ${issue.fix}\n`);
    });

    // Prioritize
    const highPriority = issues.filter(i => i.severity === 'HIGH');
    if (highPriority.length > 0) {
      console.log('🔥 高優先級問題（建議優先處理）:');
      highPriority.forEach(i => console.log(`  - ${i.issue}`));
    }
  }
}

// ============================================
// Run All Diagnostics
// ============================================

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   N-gram Prediction Quality Diagnostic Tool           ║');
console.log('╚════════════════════════════════════════════════════════╝');

const test1Result = testNgramDataQuality();
const test2Result = testViterbiAlgorithm();
const test3Result = testSmoothingImpact();
testRealWorldPrediction();
identifyRootCause(test1Result, test2Result, test3Result);

console.log('\n診斷完成！\n');
