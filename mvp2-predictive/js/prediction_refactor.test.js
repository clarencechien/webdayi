
const assert = {
    strictEqual: (actual, expected, message) => {
        if (actual !== expected) {
            throw new Error(`${message}: Expected ${expected}, but got ${actual}`);
        }
    },
    ok: (value, message) => {
        if (!value) {
            throw new Error(`${message}: Expected truthy value`);
        }
    }
};

// Mock Data
const mockDayiMap = {
    'i': [{ char: '木' }], // Exact match for 'i'
    'i3': [{ char: '想' }], // Extension
    'o': [{ char: '人' }]
};

const mockBigramData = {};
const mockFreqMap = { '木': 0.1, '想': 0.05 }; // '木' is common
const mockUserHistory = {
    getScore: (char) => char === '想' ? 100 : 0 // User loves '想' (High Score)
};

async function runTests() {
    console.log('Running Prediction Engine Refactor Tests...');

    const engine = new PredictionEngine({
        bigramData: mockBigramData,
        freqMap: mockFreqMap,
        userHistory: mockUserHistory
    });
    engine.setDayiMap(mockDayiMap);

    try {
        // Test 1: getCandidates should prioritize Exact Match ('木') over High Score Prediction ('想')
        console.log('Test 1: getCandidates - Exact Match Priority');
        const candidates = engine.getCandidates('i', null);

        assert.ok(candidates.length >= 2, 'Should have at least 2 candidates');
        assert.strictEqual(candidates[0].char, '木', 'First candidate should be Exact Match (木)');
        assert.strictEqual(candidates[0].isExact, true, 'First candidate should be marked isExact');

        // '想' has huge user score (100 * 10 = 1000), '木' has small freq score (0.1 * 1 = 0.1).
        // Without the fix, '想' would be first. With the fix, '木' must be first.

        console.log('PASS: Exact Match Priority');

        // Test 2: getBestPrediction should return the High Score Prediction ('想')
        console.log('Test 2: getBestPrediction - High Score Prediction');
        const bestPred = engine.getBestPrediction('i', null);

        assert.ok(bestPred, 'Should return a prediction');
        assert.strictEqual(bestPred.char, '想', 'Best prediction should be (想)');
        assert.strictEqual(bestPred.isExact, false, 'Prediction should NOT be exact match');

        console.log('PASS: Best Prediction');

    } catch (err) {
        console.error('FAIL:', err.message);
        process.exit(1);
    }
}

// Load Engine and Run
if (typeof window === 'undefined') {
    // Node.js environment: Load the file manually
    const fs = require('fs');
    const vm = require('vm');
    const path = require('path');

    const engineCode = fs.readFileSync(path.join(__dirname, 'prediction_engine.js'), 'utf8');
    const context = { window: {}, console, PredictionEngine: null };
    vm.createContext(context);
    vm.runInContext(engineCode, context);
    global.PredictionEngine = context.window.PredictionEngine;

    runTests();
}
