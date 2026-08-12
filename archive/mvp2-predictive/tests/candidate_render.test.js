
const assert = require('assert');

// Mock Data
const mockPhantom = { text: '想', type: 'prediction' };
const mockCandidates = [
    { text: '相', code: 'i3', type: 'exact' },
    { text: '箱', code: 'i3', type: 'candidate' },
    { text: '香', code: 'i3', type: 'candidate' },
    { text: '鄉', code: 'i3', type: 'candidate' },
    { text: '廂', code: 'i3', type: 'candidate' },
    { text: '鑲', code: 'i3', type: 'candidate' },
    { text: '湘', code: 'i3', type: 'candidate' },
    { text: '襄', code: 'i3', type: 'candidate' },
    { text: '祥', code: 'i3', type: 'candidate' }, // 9th item
    { text: '詳', code: 'i3', type: 'candidate' }  // 10th item (should be cut)
];

// Function to test (Simulating app.js logic)
function mergeCandidates(phantom, candidates, limit = 9) {
    let displayList = [];

    // 1. Add Phantom (Prediction) if exists
    if (phantom) {
        displayList.push({ ...phantom, isPhantom: true, key: 'Tab' });
    }

    // 2. Add Candidates
    candidates.forEach((cand, index) => {
        // First candidate gets Space key if no phantom, or if phantom exists it's still Space?
        // User Requirement: Prediction -> Tab, Exact Match -> Space.
        // So the first item from `candidates` (which is Exact Match) gets 'Space'.
        let key;
        if (index === 0) key = 'Space';
        else key = (index + 1).toString(); // 2, 3, 4... (Visual index, not array index)

        // Adjust key for 1-based indexing in UI (excluding Space/Tab)
        // Actually, standard Dayi uses keys: Space, 2, 3, 4, 5, 6, 7, 8, 9, 0
        // But here we have Tab and Space taking slots.
        // Let's stick to the requirement: Tab, Space, then others.

        displayList.push({ ...cand, isPhantom: false, key: key });
    });

    // 3. Limit
    return displayList.slice(0, limit);
}

// Tests
console.log('Running Candidate Render Tests...');

// Test 1: Merge Phantom and Candidates
const result1 = mergeCandidates(mockPhantom, mockCandidates);
assert.strictEqual(result1.length, 9, 'Should limit to 9 items');
assert.strictEqual(result1[0].text, '想', 'First item should be Phantom');
assert.strictEqual(result1[0].key, 'Tab', 'First item key should be Tab');
assert.strictEqual(result1[1].text, '相', 'Second item should be Exact Match');
assert.strictEqual(result1[1].key, 'Space', 'Second item key should be Space');
assert.strictEqual(result1[8].text, '祥', '9th item should be correct');

// Test 2: No Phantom
const result2 = mergeCandidates(null, mockCandidates);
assert.strictEqual(result2.length, 9, 'Should limit to 9 items');
assert.strictEqual(result2[0].text, '相', 'First item should be Exact Match');
assert.strictEqual(result2[0].key, 'Space', 'First item key should be Space');

console.log('All Candidate Render Tests Passed!');
