/**
 * Simple Test Runner
 */
const resultsDiv = document.getElementById('results');
let passed = 0;
let failed = 0;

function assert(condition, message) {
    const div = document.createElement('div');
    if (condition) {
        div.className = 'pass';
        div.textContent = `✓ ${message}`;
        passed++;
    } else {
        div.className = 'fail';
        div.textContent = `✗ ${message}`;
        failed++;
    }
    resultsDiv.appendChild(div);
}

function summary() {
    const div = document.createElement('div');
    div.className = 'summary';
    div.textContent = `Total: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`;
    div.style.color = failed > 0 ? '#f44336' : '#4caf50';
    resultsDiv.appendChild(div);
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

    summary();
}

runTests();
