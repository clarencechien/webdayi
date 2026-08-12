# MVP 3.0: N-gram Smart Engine

> ## 📦 已封存(Archived, 2026-08-12)
>
> 選字穩定選錯、結果不可用,已完成驗屍。**死因 (b):方向是解碼(正確),
> 但資料品質不足**——bigram 由 rime-essay 詞頻表(lexicon)建出而非連續語料,
> 跨詞轉移系統性缺失;並疊加計分缺陷(t≥1 位置無字頻項、未見 bigram 死刑罰分,
> 結構性重現 MVP2「上下文絕對優先」)。完整證據與錯字重現見
> **`/smart/docs/mvp3-postmortem.md`**。
>
> 可重用資產(碼表、n-gram 基線資料、驗屍/評測腳本)已抽出至 `/smart/`。
> 本目錄僅供考古,不再維護。

**Status**: 🔄 In Development (Experimental Feature Branch)
**Branch**: feature/ngram-engine track
**PRD**: WebDaYi PRD v1.3, Section 7

---

## Overview

This directory contains the implementation of the **N-gram Smart Engine** for WebDaYi, which upgrades the input method from **character-by-character (逐字)** to **sentence prediction with blind typing (整句預測 / 盲打)**.

### Key Features

1. **N-gram Language Model**: Uses real-world Chinese text corpus (rime-essay) to build statistical language model
2. **Viterbi Algorithm**: Dynamic programming for finding the most probable sentence given a code sequence
3. **Blind Typing**: User types full code sequence, presses Space for sentence prediction
4. **Learning System**: Adapts to user's personal typing patterns over time

---

## Architecture

### Core Components

```
mvp3-smart-engine/
├── README.md                   # This file
├── viterbi.js                  # Viterbi algorithm implementation
├── viterbi.test.js             # TDD tests for Viterbi
├── ngram_db.json               # Generated N-gram database (6MB+)
├── background_smart.js         # Enhanced Chrome Extension background script
├── content_smart.js            # Enhanced Chrome Extension content script
└── DESIGN-mvp3.md              # Design documentation
```

### Data Pipeline (in /converter/)

```
converter/
├── build_ngram.py              # N-gram database builder
├── build_ngram.test.py         # TDD tests for N-gram pipeline
└── raw_data/
    └── essay.txt               # Source corpus from rime-essay (~6MB)
```

---

## Data Flow

### Training Phase (Offline)

```
rime-essay/essay.txt (6MB corpus)
         ↓
   build_ngram.py (Python script)
         ↓
   Count unigrams (character frequencies)
   Count bigrams (character transitions)
         ↓
   Calculate probabilities
         ↓
   mvp3-smart-engine/ngram_db.json
```

### Runtime Phase (Browser Extension)

```
User types: "4jp ad v"
         ↓
content.js buffers codes: ["4jp", "ad", "v"]
         ↓
User presses Space
         ↓
content.js sends: { type: "querySentence", codes: ["4jp", "ad", "v"] }
         ↓
background.js receives message
         ↓
Query dayi_db.json for each code:
  "4jp" → ["易", "義", "儀", ...]
  "ad"  → ["在", "灰", ...]
  "v"   → ["大", "夫", ...]
         ↓
Build Lattice (candidate graph)
         ↓
Run Viterbi algorithm with ngram_db.json probabilities
         ↓
Return best sentence: "易在大"
         ↓
content.js injects result into page
```

---

## N-gram Database Schema

### Structure (ngram_db.json)

```json
{
  "unigrams": {
    "的": 0.0623,
    "一": 0.0312,
    "是": 0.0287,
    "大": 0.0156,
    ...
  },
  "bigrams": {
    "的時": 0.0045,
    "時候": 0.0089,
    "一個": 0.0034,
    "大家": 0.0021,
    ...
  },
  "metadata": {
    "total_chars": 6234567,
    "unique_chars": 4523,
    "total_bigrams": 1234567,
    "unique_bigrams": 234567,
    "source": "rime-essay/essay.txt",
    "generated_at": "2025-11-10T12:00:00Z"
  }
}
```

### Probability Calculation

**Unigram Probability**:
```
P(char) = count(char) / total_chars
```

**Bigram Probability** (with smoothing):
```
P(char2 | char1) = count(char1, char2) / count(char1)

With Laplace smoothing:
P(char2 | char1) = (count(char1, char2) + 1) / (count(char1) + V)
where V = vocabulary size
```

---

## Viterbi Algorithm

### Input

- **Codes**: Array of Dayi codes (e.g., ["4jp", "ad", "v"])
- **dayi_db**: Dictionary mapping (code → candidates with frequencies)
- **ngram_db**: N-gram probabilities

### Output

- **Best sentence**: Most probable character sequence
- **Score**: Log probability of the sentence
- **Lattice**: Full graph for debugging (optional)

### Algorithm Pseudocode

```javascript
function viterbi(codes, dayiDb, ngramDb) {
  // 1. Build Lattice
  const lattice = codes.map(code => dayiDb.get(code));

  // 2. Initialize DP table
  const dp = Array(codes.length).fill(null).map(() => ({}));
  const backpointer = Array(codes.length).fill(null).map(() => ({}));

  // 3. Forward pass
  for (let t = 0; t < codes.length; t++) {
    for (const candidate of lattice[t]) {
      if (t === 0) {
        // First position: use unigram probability
        dp[t][candidate.char] = Math.log(ngramDb.unigrams[candidate.char] || 1e-10);
      } else {
        // Subsequent positions: use bigram probability
        let maxProb = -Infinity;
        let maxPrev = null;

        for (const prevChar in dp[t-1]) {
          const bigramKey = prevChar + candidate.char;
          const bigramProb = ngramDb.bigrams[bigramKey] || 1e-10;
          const prob = dp[t-1][prevChar] + Math.log(bigramProb);

          if (prob > maxProb) {
            maxProb = prob;
            maxPrev = prevChar;
          }
        }

        dp[t][candidate.char] = maxProb;
        backpointer[t][candidate.char] = maxPrev;
      }
    }
  }

  // 4. Backtracking
  const lastT = codes.length - 1;
  let maxChar = null;
  let maxProb = -Infinity;

  for (const char in dp[lastT]) {
    if (dp[lastT][char] > maxProb) {
      maxProb = dp[lastT][char];
      maxChar = char;
    }
  }

  // Reconstruct path
  const result = [];
  let currentChar = maxChar;

  for (let t = lastT; t >= 0; t--) {
    result.unshift(currentChar);
    currentChar = backpointer[t][currentChar];
  }

  return {
    sentence: result.join(''),
    score: maxProb,
    chars: result
  };
}
```

---

## Chrome Extension Integration

### Enhanced background.js

```javascript
// Load both databases on startup
let dayiDb = null;
let ngramDb = null;

chrome.runtime.onInstalled.addListener(async () => {
  // Load dayi_db.json
  const dayiResponse = await fetch(chrome.runtime.getURL('dayi_db.json'));
  const dayiData = await dayiResponse.json();
  dayiDb = new Map(Object.entries(dayiData));

  // Load ngram_db.json
  const ngramResponse = await fetch(chrome.runtime.getURL('ngram_db.json'));
  ngramDb = await ngramResponse.json();

  console.log('Both databases loaded successfully');
});

// Handle querySentence requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'querySentence') {
    const result = viterbi(request.codes, dayiDb, ngramDb);
    sendResponse(result);
  }
  return true;  // Async response
});
```

### Enhanced content.js

```javascript
let codeBuffer = [];

inputBox.addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    // Space key triggers sentence prediction
    e.preventDefault();

    if (codeBuffer.length > 0) {
      // Send codes to background for Viterbi prediction
      chrome.runtime.sendMessage({
        type: 'querySentence',
        codes: codeBuffer
      }, (result) => {
        // Inject predicted sentence
        document.execCommand('insertText', false, result.sentence);
        codeBuffer = [];
      });
    }
  } else {
    // Buffer the code (not immediate query like MVP 2a)
    // Will query when Space is pressed
    codeBuffer.push(currentCode);
  }
});
```

---

## Performance Requirements

Based on PRD v1.3:

| Metric | Target | Why |
|--------|--------|-----|
| querySentence latency | < 200ms | User perception of "instant" |
| Extension size | 5-10MB | Includes ngram_db.json, gzipped |
| Viterbi memory | < 50MB | RAM usage during prediction |
| Database load time | < 2s | On extension startup |

---

## Development Approach

### TDD (Test-Driven Development)

1. Write tests first for each component
2. Implement to pass tests
3. Refactor for performance

### Test Coverage

- **build_ngram.py**: Unit tests for counting, probability calculation
- **viterbi.js**: Unit tests for DP table, backtracking, edge cases
- **Integration**: End-to-end tests with real data

### Milestones

1. **Milestone 1**: N-gram pipeline working (essay.txt → ngram_db.json)
2. **Milestone 2**: Viterbi algorithm working (codes → sentence)
3. **Milestone 3**: Chrome extension integration working
4. **Milestone 4**: Learning system working (MVP 3.1+)

---

## Known Challenges

### 1. Database Size
- **Problem**: ngram_db.json may be large (6MB+)
- **Solution**: Gzip compression in Chrome extension, lazy loading

### 2. Performance
- **Problem**: Viterbi algorithm is O(n * m^2) where n=codes, m=avg candidates
- **Solution**: Optimize DP implementation, prune low-probability paths

### 3. Accuracy
- **Problem**: N-gram model may not match user's context
- **Solution**: Learning system (MVP 3.1+) to adapt to user

---

## References

- **PRD**: `/home/user/webdayi/PRD.md` v1.3, Section 7
- **Data Source**: https://github.com/rime/rime-essay (essay.txt)
- **Viterbi Algorithm**: https://en.wikipedia.org/wiki/Viterbi_algorithm
- **N-gram Models**: https://en.wikipedia.org/wiki/N-gram

---

## Status

**Current Phase**: Setup & Design (0%)

**Next Steps**:
1. Download essay.txt from rime-essay
2. Design N-gram database schema
3. Implement build_ngram.py with TDD
4. Generate ngram_db.json
5. Implement Viterbi algorithm with TDD
6. Integrate into Chrome extension

**Last Updated**: 2025-11-10
