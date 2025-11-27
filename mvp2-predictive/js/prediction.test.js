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
        "台": { "b": "北", "w": "灣" }
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
        "不": 0.01
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
    const phantom1 = engine.predictPhantom('i', null);
    assert(phantom1 === '巷', `Expected '巷' (User History), got '${phantom1}'`);

    // Test 3: Phantom Suggestion (Bigram Context)
    // Context: '台'. Input 'b'.
    // Bigram says 'b' -> '北'.
    // We need 'b' in dayiMap.
    mockDayiMap['b'] = [{ char: "北" }, { char: "不" }];

    // Without context: '不' (0.01) > '北' (0.002).
    const noContext = engine.predictPhantom('b', null);
    assert(noContext === '不', `Expected '不' (Freq), got '${noContext}'`);

    // With context '台': '北' gets Bigram boost (1.0 * 2.5 = 2.5).
    const withContext = engine.predictPhantom('b', '台');
    assert(withContext === '北', `Expected '北' (Bigram), got '${withContext}'`);

    // Test 4: No Match
    const phantom3 = engine.predictPhantom('x', null);
    assert(phantom3 === null, `Expected null, got '${phantom3}'`);

    summary();
}

runTests();
