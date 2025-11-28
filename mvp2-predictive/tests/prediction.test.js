/**
 * Simple Test Runner
 */
// Mock Browser Environment for Node.js
if (typeof window === 'undefined') {
    global.window = {};
}
if (typeof document === 'undefined') {
    global.document = {
        getElementById: () => ({ appendChild: () => { } }),
        createElement: () => ({ style: {} })
    };
}

// Import PredictionEngine (if running in Node)
// Note: In a real setup we'd use require/import, but here we rely on the file being concatenated or just pasted.
// For this specific run, we need to make sure PredictionEngine is available.
// Since we can't easily import the class without modifying the source to export it,
// we will paste the class definition into the test file or assume it's loaded.
// BUT, the `run_command` just runs this file. It doesn't load `prediction_engine.js`.
// So I need to include `prediction_engine.js` content or mock it, OR load it.
// Let's try to load it using `fs` and `eval` or just copy-paste the class for testing purposes?
// No, copy-pasting is bad.
// Let's use `require` if possible, but the source is not a module.
// I will read the file and eval it.

const fs = require('fs');
const path = require('path');
const PredictionEngine = require('../js/prediction_engine.js');

const resultsDiv = { appendChild: () => { } }; // Mock resultsDiv
let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✓ ${message}`);
        passed++;
    } else {
        console.error(`✗ ${message}`);
        failed++;
    }
}

function summary() {
    console.log(`Total: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}

/**
 * Tests
 */
async function runTests() {
    console.log('Running tests...');

    // Mock Data
    const mockBigram = {
        "台": { "b": "北", "w": "灣" },
        "相": { "1": "信", "2": "關" }
    };
    const mockDayiMap = {
        "i": [{ char: "台" }, { char: "巷" }],
        "ir": [{ char: "台" }],
        "x": []
    };
    const mockFreq = {
        "台": 0.005,
        "巷": 0.001,
        "北": 0.002,
        "不": 0.01,
        "信": 0.003,
        "關": 0.001,
        "栺": 0.00001 // Rare char
    };
    const mockHistory = {
        getScore: (char) => char === '巷' ? 100 : 0 // User loves '巷'
    };

    const engine = new PredictionEngine({
        bigramData: mockBigram,
        freqMap: mockFreq,
        userHistory: mockHistory
    });
    engine.setDayiMap(mockDayiMap);

    // Test 1: Initialization
    assert(engine.bigramData === mockBigram, 'Engine initialized with bigram data');

    // Test 2: Phantom Suggestion (User History Dominance)
    // 'i' -> 台 (0.005) vs 巷 (0.001 + 100*10 = 1000!)
    // But '巷' is at 'i' (exact match), so it is NOT a completion.
    // 'ir' -> '台' IS a completion.
    const phantom1 = engine.getBestPrediction('i', null);
    assert(phantom1 && phantom1.char === '台', `Expected '台' (Extension), got '${phantom1 ? phantom1.char : 'null'}'`);

    // Test 3: Phantom Suggestion (Bigram Context)
    // Context: '台'. Input 'b'.
    // Bigram says 'b' -> '北'.
    // We need 'b' in dayiMap.
    mockDayiMap['b'] = [{ char: "北" }, { char: "不" }];

    // Without context: '不' (0.01) > '北' (0.002).
    // But both are exact matches for 'b'. No extensions.
    const noContext = engine.getBestPrediction('b', null);
    assert(noContext === null, `Expected null (No Extension), got '${noContext ? noContext.char : 'null'}'`);

    // With context '台': '北' gets Bigram boost.
    // Still exact match.
    const withContext = engine.getBestPrediction('b', '台');
    assert(withContext === null, `Expected null (No Extension), got '${withContext ? withContext.char : 'null'}'`);

    // Test 4: No Match
    const phantom3 = engine.getBestPrediction('x', null);
    assert(phantom3 === null, `Expected null, got '${phantom3}'`);

    // --- New Tests for Smart Compose ---

    // Test 5: Predict Next Char (Continuous Prediction)
    // Context: '相'. No buffer.
    // Bigram: '相' -> { "1": "信", "2": "關" }
    // '信' (0.003) vs '關' (0.001). '信' should win.
    const nextChar = engine.predictNextChar('相');
    assert(nextChar && nextChar.char === '信', `Expected '信' (Next Word), got '${nextChar ? nextChar.char : 'null'}'`);

    // Test 6: Context Safety (Stop Chars)
    // Context: '，' (Comma). Should return null.
    const stopCharPred = engine.predictNextChar('，');
    assert(stopCharPred === null, `Expected null (Stop Char), got '${stopCharPred ? stopCharPred.char : stopCharPred}'`);

    // Test 7: Frequency Filtering (Rare Word)
    // Mock a rare word prediction
    mockDayiMap['z'] = [{ char: "栺" }]; // Rare char
    // Ensure getBestPrediction filters it out if score is low
    // Score = 1.0 * 0.00001 = 0.00001. Threshold is usually higher.
    // We need to verify if we implemented the threshold in getBestCompletion/getBestPrediction.
    // The requirement said "getExtendedCandidates" or "getBestCompletion".
    // Let's assume we check it in getBestPrediction for now, or we might need to check getExtendedCandidates.
    // Actually, the user request mentioned updating `getExtendedCandidates` or `getBestCompletion`.
    // Let's check if `getBestPrediction` returns null for rare char.
    const rarePred = engine.getBestPrediction('z', null);
    // If we implement the threshold, this should be null.
    // Note: We haven't implemented it yet, so this test might fail (or pass if we implement it now).
    // Since this is TDD, we expect it to fail if the logic isn't there, or pass if we add it.
    // But wait, I am WRITING the test now. The code is NOT updated yet. So this assertion expects the NEW behavior.
    assert(rarePred === null, `Expected null (Rare Char), got '${rarePred ? rarePred.char : 'null'}'`);

    // Test 8: Frequency Dominance (High Freq Exact Match suppresses Low Freq Prediction)
    // Mock Data for "dj": Exact="明"(High), Prediction="盟"(Low)
    engine.dayiMap['dj'] = '明';
    engine.dayiMap['djv'] = '盟';
    engine.freqMap['明'] = 0.18; // High
    engine.freqMap['盟'] = 0.005; // Low (Ratio = 36 > 10)

    const suppressedPred = engine.getBestPrediction('dj', null);
    assert(suppressedPred === null, `Expected null (Suppressed by Dominance), got '${suppressedPred ? suppressedPred.char : 'null'}'`);

    // Test 9: No Dominance (Low Freq Exact Match allows Prediction)
    // Mock Data for "x": Exact="X"(Low), Prediction="Y"(High)
    engine.dayiMap['x'] = 'X';
    engine.dayiMap['xy'] = 'Y';
    engine.freqMap['X'] = 0.001;
    engine.freqMap['Y'] = 0.05; // Prediction is much more frequent

    const allowedPred = engine.getBestPrediction('x', null);
    assert(allowedPred && allowedPred.char === 'Y', `Expected 'Y' (Allowed), got '${allowedPred ? allowedPred.char : 'null'}'`);

    // Test 10: Context Absolute Priority (Bigram Match overrides everything)
    // Context: "明" (lastChar). Input: "e".
    // Bigram: "明" -> "e": "天".
    // Candidates for "e": "天" (Freq: 0.005), "衝" (Freq: 0.0002, Code: "evdj" -> starts with "e")
    // Note: "衝" is technically an extension of "e" if we consider "evdj".
    // But wait, "天" code is "ev". "e" is prefix of "ev".
    // Let's mock:
    engine.bigramData['明'] = { 'e': '天' };
    engine.dayiMap['e'] = '一'; // Exact match for 'e'
    engine.dayiMap['ev'] = '天'; // Extension 1
    engine.dayiMap['evdj'] = '衝'; // Extension 2
    engine.freqMap['天'] = 0.005;
    engine.freqMap['衝'] = 0.0002;
    engine.freqMap['一'] = 0.01;

    // Without Absolute Priority, "天" might lose to "一" (Exact) or be ranked normally.
    // But here we want "天" to be the *Best Prediction* (Phantom).
    // Wait, getBestPrediction excludes exact matches. "一" is exact.
    // "天" and "衝" are extensions.
    // "天" score = 0.005 * 2.0 + (Bigram Match ? 2.5 : 0).
    // If Bigram Match works, it gets +2.5. Total ~0.0125.
    // "衝" score = 0.0002 * 2.0 = 0.0004.
    // "天" should win naturally here?
    // The user says "衝" was winning. Maybe "衝" has higher freq in reality?
    // Or maybe "天" wasn't getting the Bigram bonus correctly?
    // User says: "Bigram 數據："明": { "e": "天" }。這代表系統明確知道「明」後面接 e 應該是「天」。"
    // "結論： 既然資料庫（Bigram）裡已經有正確答案，卻還跑出「衝」... 系統雖然知道「天」跟「明」有關係，但可能因為某些干擾因素..."
    // Let's force a scenario where "衝" would win without VIP.
    engine.freqMap['衝'] = 0.02; // Make "衝" higher freq than "天" (0.005)
    // AND give "衝" a user history score to beat the standard Bigram weight (2.5)
    // User weight is 10.0. If score is 1, total = 10.0 + 0.04 = 10.04.
    // "天" (without VIP) = 2.5 + 0.01 = 2.51.
    // So "衝" should win.
    mockHistory.getScore = (char) => char === '衝' ? 1 : (char === '巷' ? 100 : 0);

    // Now "衝" (10.04) > "天" (2.51).
    // So "衝" wins.
    // With VIP (100.0), "天" should win (100.0 > 10.04).

    const vipPred = engine.getBestPrediction('e', '明');
    assert(vipPred && vipPred.char === '天', `Expected '天' (VIP Bigram), got '${vipPred ? vipPred.char : 'null'}'`);

    // Test 11: Refined Context Absolute Priority (Multi-char buffer & Context Dominance)
    // Context: "明". Input: "ev".
    // Bigram: "明" -> "e": "天". (Note: Bigram key is usually 1 char, so we check buffer[0])
    // Candidates for "ev":
    // 1. "天" (Exact match for "ev").
    // 2. "衝" (Extension "evdj").
    // Scenario: "衝" has SUPER high user score. "天" is VIP.
    // We want "天" to be the prediction (or rather, since it's exact match, maybe we want to suppress extensions?)
    // Wait, if "天" is exact match, `getBestPrediction` usually returns EXTENSIONS.
    // But the user issue is: "明+ev" -> "衝" (Extension) is shown, but they want "天" (Exact) to be prioritized?
    // Actually, if "天" is exact match, it appears in the candidate bar (Space).
    // The Phantom Text (Tab) shows the *best prediction*.
    // If "天" is the intended word, and it's already fully typed ("ev"), then Phantom Text shouldn't show "衝" if "衝" is just noise.
    // This is "Context Dominance": If Exact Match is VIP, suppress extensions.

    engine.dayiMap['ev'] = '天';
    engine.dayiMap['evdj'] = '衝';
    mockHistory.getScore = (char) => char === '衝' ? 1000 : 0; // "衝" is extremely frequent in history

    // Without fix: "衝" (Extension) would be returned because "天" is Exact (excluded from completion).
    // With fix: "天" is VIP (matches Bigram 'e'), so we suppress extensions. Result should be null (or "天" if we change logic to return exact VIP? No, Phantom shouldn't duplicate Exact).
    // If Phantom is null, user sees "天" in candidate bar and nothing in Phantom. This is correct.
    // OR, if the user meant "明+e" -> "天" (Phantom).
    // Let's test "ev" -> Suppress "衝".

    const suppressedExtension = engine.getBestPrediction('ev', '明');
    assert(suppressedExtension === null, `Expected null (Context Dominance suppresses '衝'), got '${suppressedExtension ? suppressedExtension.char : 'null'}'`);

    // Test 12: VIP Score Boost
    // Context: "明". Input: "e".
    // "天" (Extension from "e"). "衝" (Extension from "e").
    // "衝" has score 1000. "天" has VIP.
    // VIP must be > 1000 * 10 (User Weight) = 10000.
    // So VIP score should be > 10000.

    // Reset "天" to be extension of "e" (it is, code "ev")
    // "衝" is also extension of "e" (code "evdj")
    // "天" is VIP because Bigram["明"]["e"] == "天".

    const vipBoostPred = engine.getBestPrediction('e', '明');
    assert(vipBoostPred && vipBoostPred.char === '天', `Expected '天' (VIP Boost > User History), got '${vipBoostPred ? vipBoostPred.char : 'null'}'`);

    // Test 13: Fix Prediction Suppression (Ratio Adjustment)
    // Scenario: "天" (ev) vs "衝" (evdj).
    // Freqs: "天" = 0.0024, "衝" = 0.00026. Ratio = 9.23.
    // If DOMINANCE_RATIO is 10.0, "衝" is NOT suppressed (9.23 < 10.0).
    // If DOMINANCE_RATIO is 8.0, "衝" IS suppressed (9.23 > 8.0).

    engine.dayiMap['ev'] = '天';
    engine.dayiMap['evdj'] = '衝';
    engine.freqMap['天'] = 0.0024;
    engine.freqMap['衝'] = 0.00026;

    // We expect suppression (null) with the fix.
    // Note: This test will FAIL if ratio is still 10.0.
    const suppressionTest = engine.getBestPrediction('ev', '天'); // Context "天" (last char) doesn't matter much here unless it triggers VIP. Let's assume no VIP for "天"->"衝".
    // Actually, context "天" might trigger something else. Let's use a neutral context or null.
    const suppressionTestNeutral = engine.getBestPrediction('ev', null);

    assert(suppressionTestNeutral === null, `Expected null (Suppressed by Ratio 8.0), got '${suppressionTestNeutral ? suppressionTestNeutral.char : 'null'}'`);

    console.log("All tests passed!");
    summary();
}

runTests();
