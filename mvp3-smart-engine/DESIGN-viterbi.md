# Viterbi Algorithm Design Document

**Version**: 1.0
**Date**: 2025-11-10
**Component**: viterbi.js - Sentence Prediction Engine
**Status**: Design Phase

---

## 1. Overview

### Purpose

Implement the Viterbi algorithm to find the most probable sentence given a sequence of Dayi input codes using N-gram language model probabilities.

### Input

- **codes**: Array of Dayi codes (e.g., `["4jp", "ad", "v"]`)
- **dayiDb**: Map of code → candidates with frequencies
- **ngramDb**: N-gram probabilities (unigrams + bigrams)

### Output

```javascript
{
  sentence: "易在大",        // Most probable sentence
  score: -12.345,             // Log probability
  chars: ["易", "在", "大"],  // Individual characters
  lattice: [...],             // Full candidate graph (optional, for debugging)
  path: [...]                 // Chosen path through lattice (optional)
}
```

---

## 2. Algorithm Overview

### Viterbi Algorithm

The Viterbi algorithm is a **dynamic programming** algorithm that finds the most probable sequence of hidden states (characters) given a sequence of observations (input codes).

**Key Concepts:**
- **Lattice**: Graph of all possible character sequences
- **DP Table**: Stores maximum probability for each state at each time step
- **Backpointer**: Tracks the best previous state for path reconstruction

**Steps:**
1. Build lattice from input codes
2. Initialize DP table for first position
3. Forward pass: Calculate max probabilities
4. Backtracking: Reconstruct best path

---

## 3. Data Structures

### Lattice Structure

```javascript
// Lattice: Array of candidate arrays
const lattice = [
  // Position 0 (code "4jp")
  [
    { char: "易", freq: 80 },
    { char: "義", freq: 70 },
    { char: "儀", freq: 30 }
  ],
  // Position 1 (code "ad")
  [
    { char: "在", freq: 90 },
    { char: "灰", freq: 45 }
  ],
  // Position 2 (code "v")
  [
    { char: "大", freq: 100 },
    { char: "夫", freq: 60 },
    { char: "禾", freq: 40 }
  ]
]
```

### DP Table Structure

```javascript
// DP table: Array of objects mapping char → max log probability
const dp = [
  // Position 0
  {
    "易": -2.8134,  // log(P(易))
    "義": -3.1242,  // log(P(義))
    "儀": -4.5123   // log(P(儀))
  },
  // Position 1
  {
    "在": -5.2341,  // log(P(易→在)) + dp[0]["易"]
    "灰": -7.8932   // log(P(易→灰)) + dp[0]["易"]
  },
  // Position 2
  {
    "大": -8.4521,  // log(P(在→大)) + dp[1]["在"]
    "夫": -10.234,  // log(P(在→夫)) + dp[1]["在"]
    "禾": -11.567   // log(P(在→禾)) + dp[1]["在"]
  }
]
```

### Backpointer Structure

```javascript
// Backpointer: Array of objects mapping char → previous char
const backpointer = [
  // Position 0 (no backpointer for first position)
  {},
  // Position 1
  {
    "在": "易",  // Best previous char for "在"
    "灰": "易"   // Best previous char for "灰"
  },
  // Position 2
  {
    "大": "在",  // Best previous char for "大"
    "夫": "在",  // Best previous char for "夫"
    "禾": "在"   // Best previous char for "禾"
  }
]
```

---

## 4. Core Functions

### buildLattice(codes, dayiDb)

Build lattice of candidates from input codes.

```javascript
/**
 * Build lattice from input codes.
 *
 * @param {string[]} codes - Array of Dayi codes
 * @param {Map} dayiDb - Dictionary mapping codes to candidates
 * @returns {Array[]} Lattice of candidates
 *
 * @throws {Error} If any code has no candidates
 */
function buildLattice(codes, dayiDb) {
  const lattice = [];

  for (const code of codes) {
    const candidates = dayiDb.get(code);

    if (!candidates || candidates.length === 0) {
      throw new Error(`No candidates found for code: ${code}`);
    }

    lattice.push(candidates);
  }

  return lattice;
}
```

**Test Cases:**
- Valid codes with candidates
- Code with no candidates (error)
- Empty codes array
- Single code
- Multiple codes

---

### initializeDP(lattice, ngramDb)

Initialize DP table for first position using unigram probabilities.

```javascript
/**
 * Initialize DP table for first position.
 *
 * @param {Array[]} lattice - Candidate lattice
 * @param {Object} ngramDb - N-gram database
 * @returns {Object[]} Initialized DP table
 */
function initializeDP(lattice, ngramDb) {
  const dp = [];
  const numPositions = lattice.length;

  // Initialize first position with unigram probabilities
  const firstDP = {};
  for (const candidate of lattice[0]) {
    const char = candidate.char;
    const unigramProb = ngramDb.unigrams[char] || 1e-10;
    firstDP[char] = Math.log(unigramProb);
  }
  dp.push(firstDP);

  // Initialize remaining positions with empty objects
  for (let i = 1; i < numPositions; i++) {
    dp.push({});
  }

  return dp;
}
```

**Test Cases:**
- Single position lattice
- Multiple positions
- Character not in unigram dictionary (default probability)
- Empty lattice (error)

---

### forwardPass(lattice, dp, backpointer, ngramDb)

Perform forward pass to calculate maximum probabilities.

```javascript
/**
 * Perform forward pass of Viterbi algorithm.
 *
 * @param {Array[]} lattice - Candidate lattice
 * @param {Object[]} dp - DP table (modified in place)
 * @param {Object[]} backpointer - Backpointer array (modified in place)
 * @param {Object} ngramDb - N-gram database
 */
function forwardPass(lattice, dp, backpointer, ngramDb) {
  for (let t = 1; t < lattice.length; t++) {
    for (const candidate of lattice[t]) {
      const char2 = candidate.char;
      let maxProb = -Infinity;
      let maxPrevChar = null;

      // Try all previous characters
      for (const prevChar in dp[t-1]) {
        const bigram = prevChar + char2;
        const bigramProb = ngramDb.bigrams[bigram] || 1e-10;
        const prob = dp[t-1][prevChar] + Math.log(bigramProb);

        if (prob > maxProb) {
          maxProb = prob;
          maxPrevChar = prevChar;
        }
      }

      dp[t][char2] = maxProb;
      backpointer[t][char2] = maxPrevChar;
    }
  }
}
```

**Test Cases:**
- Two positions
- Three positions
- Bigram not in dictionary (default probability)
- All bigrams have equal probability
- Tie-breaking (first maximum wins)

---

### backtrack(dp, backpointer)

Backtrack to find the best path.

```javascript
/**
 * Backtrack to reconstruct the best path.
 *
 * @param {Object[]} dp - DP table
 * @param {Object[]} backpointer - Backpointer array
 * @returns {Object} Best path information
 */
function backtrack(dp, backpointer) {
  const lastT = dp.length - 1;

  // Find character with maximum probability at last position
  let maxChar = null;
  let maxProb = -Infinity;

  for (const char in dp[lastT]) {
    if (dp[lastT][char] > maxProb) {
      maxProb = dp[lastT][char];
      maxChar = char;
    }
  }

  // Reconstruct path backwards
  const chars = [];
  let currentChar = maxChar;

  for (let t = lastT; t >= 0; t--) {
    chars.unshift(currentChar);
    currentChar = backpointer[t][currentChar];
  }

  return {
    sentence: chars.join(''),
    score: maxProb,
    chars: chars
  };
}
```

**Test Cases:**
- Single position
- Two positions
- Three positions
- Tie at final position (first maximum wins)

---

### viterbi(codes, dayiDb, ngramDb)

Main entry point for Viterbi algorithm.

```javascript
/**
 * Run Viterbi algorithm to find most probable sentence.
 *
 * @param {string[]} codes - Array of Dayi codes
 * @param {Map} dayiDb - Dictionary mapping codes to candidates
 * @param {Object} ngramDb - N-gram database
 * @returns {Object} Best sentence with score and path
 *
 * @example
 * const result = viterbi(
 *   ["4jp", "ad", "v"],
 *   dayiDb,
 *   ngramDb
 * );
 * console.log(result.sentence);  // "易在大"
 * console.log(result.score);     // -12.345
 */
function viterbi(codes, dayiDb, ngramDb) {
  // Validation
  if (!codes || codes.length === 0) {
    throw new Error("Codes array cannot be empty");
  }

  // 1. Build lattice
  const lattice = buildLattice(codes, dayiDb);

  // 2. Initialize DP table and backpointer
  const dp = initializeDP(lattice, ngramDb);
  const backpointer = Array(lattice.length).fill(null).map(() => ({}));

  // 3. Forward pass
  forwardPass(lattice, dp, backpointer, ngramDb);

  // 4. Backtrack
  const result = backtrack(dp, backpointer);

  // Optional: Add lattice for debugging
  result.lattice = lattice;

  return result;
}
```

**Test Cases:**
- Single code
- Two codes
- Three codes
- Invalid code (no candidates)
- Empty codes array
- Integration test with real dayi_db and ngram_db

---

## 5. Test-Driven Development Plan

### Test File: viterbi.test.js

**Total Tests**: ~15 tests

#### Category 1: Lattice Construction (3 tests)
1. `test_buildLattice_valid_codes` - Build lattice from valid codes
2. `test_buildLattice_invalid_code` - Throw error for invalid code
3. `test_buildLattice_empty_codes` - Handle empty codes array

#### Category 2: DP Initialization (3 tests)
1. `test_initializeDP_first_position` - Initialize with unigram probabilities
2. `test_initializeDP_missing_unigram` - Handle missing unigram with default
3. `test_initializeDP_multiple_positions` - Initialize all positions

#### Category 3: Forward Pass (4 tests)
1. `test_forwardPass_two_positions` - Calculate probabilities for 2 positions
2. `test_forwardPass_missing_bigram` - Handle missing bigram with default
3. `test_forwardPass_tie_breaking` - Tie-breaking behavior (first maximum)
4. `test_forwardPass_integration` - Full forward pass with 3 positions

#### Category 4: Backtracking (3 tests)
1. `test_backtrack_single_path` - Reconstruct single path
2. `test_backtrack_multiple_positions` - Reconstruct path with 3 positions
3. `test_backtrack_tie_at_end` - Handle tie at final position

#### Category 5: Integration (2 tests)
1. `test_viterbi_simple_example` - Full Viterbi with known input/output
2. `test_viterbi_real_data` - Integration with real dayi_db.json and ngram_db.json

---

## 6. Example Execution

### Input

```javascript
const codes = ["4jp", "ad", "v"];

const dayiDb = new Map([
  ["4jp", [
    { char: "易", freq: 80 },
    { char: "義", freq: 70 }
  ]],
  ["ad", [
    { char: "在", freq: 90 },
    { char: "灰", freq: 45 }
  ]],
  ["v", [
    { char: "大", freq: 100 },
    { char: "夫", freq: 60 }
  ]]
]);

const ngramDb = {
  unigrams: {
    "易": 0.01,
    "義": 0.008,
    "在": 0.015,
    "灰": 0.002,
    "大": 0.02,
    "夫": 0.005
  },
  bigrams: {
    "易在": 0.5,
    "易灰": 0.1,
    "義在": 0.4,
    "義灰": 0.05,
    "在大": 0.6,
    "在夫": 0.2,
    "灰大": 0.3,
    "灰夫": 0.1
  }
};
```

### Execution

```javascript
const result = viterbi(codes, dayiDb, ngramDb);

console.log(result);
// {
//   sentence: "易在大",
//   score: -8.234,
//   chars: ["易", "在", "大"],
//   lattice: [...]
// }
```

### Step-by-Step Trace

**Step 1: Build Lattice**
```
lattice = [
  [易(80), 義(70)],
  [在(90), 灰(45)],
  [大(100), 夫(60)]
]
```

**Step 2: Initialize DP**
```
dp[0] = {
  "易": log(0.01) = -4.605,
  "義": log(0.008) = -4.828
}
```

**Step 3: Forward Pass - Position 1**
```
For "在":
  易→在: -4.605 + log(0.5) = -4.605 + (-0.693) = -5.298
  義→在: -4.828 + log(0.4) = -4.828 + (-0.916) = -5.744
  max = -5.298 (from 易)
  dp[1]["在"] = -5.298, backpointer[1]["在"] = "易"

For "灰":
  易→灰: -4.605 + log(0.1) = -4.605 + (-2.303) = -6.908
  義→灰: -4.828 + log(0.05) = -4.828 + (-2.996) = -7.824
  max = -6.908 (from 易)
  dp[1]["灰"] = -6.908, backpointer[1]["灰"] = "易"
```

**Step 4: Forward Pass - Position 2**
```
For "大":
  在→大: -5.298 + log(0.6) = -5.298 + (-0.511) = -5.809
  灰→大: -6.908 + log(0.3) = -6.908 + (-1.204) = -8.112
  max = -5.809 (from 在)
  dp[2]["大"] = -5.809, backpointer[2]["大"] = "在"

For "夫":
  在→夫: -5.298 + log(0.2) = -5.298 + (-1.609) = -6.907
  灰→夫: -6.908 + log(0.1) = -6.908 + (-2.303) = -9.211
  max = -6.907 (from 在)
  dp[2]["夫"] = -6.907, backpointer[2]["夫"] = "在"
```

**Step 5: Backtrack**
```
Final position: max("大": -5.809, "夫": -6.907) = "大" (-5.809)

Path reconstruction:
  Position 2: "大" (backpointer = "在")
  Position 1: "在" (backpointer = "易")
  Position 0: "易" (backpointer = null)

Result: "易在大" with score -5.809
```

---

## 7. Performance Considerations

### Complexity

- **Time**: O(n * m^2)
  - n = number of codes
  - m = average number of candidates per code
  - For typical input: 3-5 codes, 5-10 candidates → ~500 operations

- **Space**: O(n * m)
  - DP table and backpointer storage

### Optimization Strategies

1. **Pruning**: Remove low-probability candidates (prob < threshold)
2. **Beam Search**: Keep only top-k candidates at each step
3. **Caching**: Cache bigram probability lookups

### Target Performance

- **Latency**: < 200ms for 5-code input (per PRD requirement)
- **Memory**: < 10MB for DP table and lattice

---

## 8. Error Handling

### Invalid Inputs

```javascript
// Empty codes
viterbi([], dayiDb, ngramDb);
// → Error: "Codes array cannot be empty"

// Invalid code
viterbi(["invalid"], dayiDb, ngramDb);
// → Error: "No candidates found for code: invalid"

// Null inputs
viterbi(null, dayiDb, ngramDb);
// → Error: "Codes array cannot be empty"
```

### Missing Probabilities

```javascript
// Missing unigram → use default 1e-10
const unigramProb = ngramDb.unigrams[char] || 1e-10;

// Missing bigram → use default 1e-10
const bigramProb = ngramDb.bigrams[bigram] || 1e-10;
```

### Numerical Stability

Use **log probabilities** to avoid underflow:
- Probabilities are in (0, 1], products become very small
- Log space: log(a * b) = log(a) + log(b)
- Prevents underflow for long sequences

---

## 9. Testing Strategy

### Unit Tests (11 tests)

Test each function independently with controlled inputs.

### Integration Tests (2 tests)

Test full Viterbi pipeline with:
1. Simple synthetic data (known correct answer)
2. Real data (dayi_db.json + ngram_db.json)

### Test Data

**Synthetic** (test-viterbi-data.js):
```javascript
export const testDayiDb = new Map([...]);
export const testNgramDb = {...};
export const testCases = [
  {
    codes: ["4jp", "ad"],
    expected: "易在"
  }
];
```

**Real** (use actual databases):
- mvp1/dayi_db.json
- mvp3-smart-engine/ngram_db.json

---

## 10. Success Criteria

### Functional

- ✅ Correctly finds most probable sentence for simple inputs
- ✅ Handles edge cases (single code, missing probabilities)
- ✅ All 15 tests pass
- ✅ Works with real dayi_db and ngram_db

### Performance

- ✅ Latency < 200ms for 5-code input
- ✅ Memory usage < 10MB

### Code Quality

- ✅ Well-documented functions
- ✅ Comprehensive error handling
- ✅ Clean, readable code

---

**Status**: Design Complete ✓
**Next**: Implement TDD test suite (15 tests in Node.js)
