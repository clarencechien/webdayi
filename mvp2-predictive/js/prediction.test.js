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
        "i": ["台", "巷"], // 'i' -> 台 (high freq), 巷 (low freq)
        "ir": ["台"],      // 'ir' -> 台 (exact)
        "x": []            // 'x' -> no match
    };

    const engine = new PredictionEngine(mockBigram);
    engine.setDayiMap(mockDayiMap);

    // Test 1: Initialization
    assert(engine.bigramData === mockBigram, 'Engine initialized with bigram data');

    // Test 2: Phantom Suggestion (Basic)
    const phantom1 = engine.predictPhantom('i');
    assert(phantom1 === '台', `Expected '台', got '${phantom1}'`);

    // Test 3: Phantom Suggestion (Exact Match)
    const phantom2 = engine.predictPhantom('ir');
    assert(phantom2 === '台', `Expected '台', got '${phantom2}'`);

    // Test 4: No Match
    const phantom3 = engine.predictPhantom('x');
    assert(phantom3 === null, `Expected null, got '${phantom3}'`);

    // Test 5: Empty Buffer
    const phantom4 = engine.predictPhantom('');
    assert(phantom4 === null, `Expected null for empty buffer`);

    // --- Bigram Tests ---

    // Test 6: Bigram Exact Match
    // Mock: "台": { "b": "北", "w": "灣" }
    const bigram1 = engine.getBigramSuggestion('台', 'b');
    assert(bigram1 === '北', `Expected '北', got '${bigram1}'`);

    // Test 7: Bigram Prefix Match (if implemented)
    // If user types 'j' (assuming 'j' maps to 'b' in some layout? No, let's stick to code)
    // Wait, the mock data keys are CODES.
    // "b" is the code for "北" (actually 'jb' is 北, but let's assume 'b' for simplicity or relative code)
    // Let's update mock to be realistic Dayi codes if possible, or stick to abstract.
    // Abstract is fine.
    // If I type "b", I get "北".

    // Test 8: Bigram No Match
    const bigram2 = engine.getBigramSuggestion('台', 'z');
    assert(bigram2 === null, `Expected null, got '${bigram2}'`);

    // Test 9: Bigram Unknown Last Char
    const bigram3 = engine.getBigramSuggestion('無', 'b');
    assert(bigram3 === null, `Expected null, got '${bigram3}'`);

    summary();
}

runTests();
