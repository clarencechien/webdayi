# MVP 3.0 Smart Upgrade: Personalized Learning & Context-Aware Engine

**Document Version**: 1.0
**Created**: 2025-11-12
**Status**: 📋 Planning Phase
**Target**: MVP 2a Chrome Extension + MVP 1.0 Enhancement

---

## Executive Summary

MVP 3.0 represents a **fundamental shift** from static N-gram prediction to **intelligent, adaptive prediction**. We will implement two parallel "shared feature modules" that solve v2.5's ambiguity problems and dramatically improve user experience:

- **F-4.0: Personalized N-gram Learning (User LoRA)** - Let users teach the engine their preferences
- **F-5.0: Context-Adaptive Weights (Adaptive Weights)** - Automatically adjust to website context

Both modules are designed as **shared services** that work in both "character mode" and "sentence mode", automatically enhancing all Viterbi.js predictions.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [F-4.0: Personalized N-gram Learning (User LoRA)](#3-f-40-personalized-n-gram-learning-user-lora)
4. [F-5.0: Context-Adaptive Weights](#4-f-50-context-adaptive-weights)
5. [Architecture Evolution](#5-architecture-evolution)
6. [Implementation Plan](#6-implementation-plan)
7. [Testing Strategy](#7-testing-strategy)
8. [Success Metrics](#8-success-metrics)

---

## 1. Problem Statement

### Current State (v2.7 Hybrid)

**Achievements**:
- ✅ 94.4% accuracy with v2.7 Hybrid (OOP + 70/30 + Laplace smoothing)
- ✅ Full ngram_db.json (16MB, 279K bigrams)
- ✅ Stable character mode + sentence mode

**Limitations**:
- ❌ **Tie-breaking problem**: When "天氣" and "天真" have similar N-gram scores (70/30 split), the engine cannot learn user preference
- ❌ **Context blindness**: Same predictions for GitHub (formal) and PTT (casual)
- ❌ **One-size-fits-all**: Cannot adapt to individual typing habits
- ❌ **Static model**: No personalization or learning capability

### Real-World Examples

**Scenario 1: Tie-breaking (F-4.0 solves this)**
```
User types: 天 (ev) + c8
Candidates: [氣, 真] (both common, similar N-gram scores)
Problem: System always picks "真" (higher base frequency)
Reality: User wants "氣" 90% of the time

With F-4.0:
- User corrects "真" → "氣" once
- UserDB.js records: {"天": {"氣": +10, "真": -5}}
- Next time: "天氣" wins automatically
```

**Scenario 2: Context mismatch (F-5.0 solves this)**
```
User typing on github.com:
Input: "實作演算法"
Problem: System suggests "實做演算法" (colloquial "做")
Reality: On GitHub, formal "作" is more appropriate

With F-5.0:
- ContextEngine.js detects: hostname = "github.com"
- Returns: {bigram: 0.8, unigram: 0.2} (trust structure over popularity)
- Result: "實作演算法" (formal) wins
```

---

## 2. Solution Overview

### Core Concept: Shared Modules

Both F-4.0 and F-5.0 are implemented as **shared services** that enhance the Viterbi scoring function. They work transparently across:
- ✅ Character mode (逐字模式) - Candidate sorting
- ✅ Sentence mode (整句模式) - Path scoring

### Design Principles

1. **Separation of Concerns**
   - Base Model (ngram_db.json): Static, read-only, provides foundation
   - User Model (UserDB.js): Dynamic, read-write, learns preferences
   - Context Engine (ContextEngine.js): Dynamic, adjusts scoring weights

2. **Minimal Disruption**
   - No changes to core Viterbi algorithm logic
   - Only modify scoring calculation: `score = baseScore + userBoost + contextWeight`

3. **Progressive Enhancement**
   - F-4.0 and F-5.0 are independent, can be enabled separately
   - Graceful degradation: If modules fail, falls back to v2.7 behavior

---

## 3. F-4.0: Personalized N-gram Learning (User LoRA)

### Concept: User-Side LoRA (Low-Rank Adaptation)

Inspired by machine learning's LoRA technique, we implement a **user adaptation layer** on top of the static N-gram model.

```
┌────────────────────────────────────────────────────────┐
│  Final Score = Base Model Score + User LoRA Score     │
│                                                        │
│  Base Model (ngram.json)      User LoRA (chrome.storage)│
│  ├─ 天 → 真: 0.35            ├─ 天 → 氣: +10         │
│  ├─ 天 → 氣: 0.30            └─ 天 → 真: -5          │
│  └─ (static, read-only)         (dynamic, read-write)│
│                                                        │
│  Result: 天氣 wins (0.30 + 10 = 10.30 > 0.35 - 5)   │
└────────────────────────────────────────────────────────┘
```

### 3.1. New Module: UserDB.js

**Location**: `mvp2a-plugin/modules/UserDB.js` (for extension)
**Location**: `mvp1/user_db.js` (for MVP1 browser testing)

**Interface**:
```javascript
class UserDB {
  constructor(storage) {
    this.storage = storage; // chrome.storage.sync or localStorage
    this.userWeights = new Map(); // {"天": {"氣": 10, "真": -5}}
  }

  /**
   * Get user's learned weight for a bigram
   * @param {string} prevChar - Previous character (e.g., "天")
   * @param {string} currChar - Current character (e.g., "氣")
   * @returns {number} - Weight adjustment (e.g., +10, -5, or 0 if not learned)
   */
  async getWeights(prevChar, currChar) {
    if (!this.userWeights.has(prevChar)) return 0;
    const nextWeights = this.userWeights.get(prevChar);
    return nextWeights[currChar] || 0;
  }

  /**
   * Record a user correction to update weights
   * @param {string} prevChar - Previous character
   * @param {string} currChar - Current character
   * @param {string} action - "promote" (+5) or "demote" (-2)
   */
  async recordCorrection(prevChar, currChar, action) {
    // Load current weights
    if (!this.userWeights.has(prevChar)) {
      this.userWeights.set(prevChar, {});
    }
    const nextWeights = this.userWeights.get(prevChar);

    // Update weight
    const delta = action === "promote" ? 5 : -2;
    nextWeights[currChar] = (nextWeights[currChar] || 0) + delta;

    // Persist to storage
    await this.save();
  }

  async load() {
    const data = await this.storage.get("userWeights");
    this.userWeights = new Map(Object.entries(data || {}));
  }

  async save() {
    const obj = Object.fromEntries(this.userWeights);
    await this.storage.set({ userWeights: obj });
  }
}
```

### 3.2. Integration: Character Mode (逐字模式)

**Scenario**: User types "天" (ev), then types "c8" → sees [氣, 真]

**Before (v2.7)**:
```javascript
// core_logic.js: sortCandidates()
candidates.sort((a, b) => b.freq - a.freq); // Static frequency only
// Result: [真(80), 氣(70)] - Always same order
```

**After (v3.0 with F-4.0)**:
```javascript
// core_logic.js: sortCandidates()
async function sortCandidates(candidates, prevChar, userDB) {
  for (let candidate of candidates) {
    const baseScore = candidate.freq;
    const userBoost = await userDB.getWeights(prevChar, candidate.char);
    candidate.finalScore = baseScore + userBoost;
  }
  candidates.sort((a, b) => b.finalScore - a.finalScore);
}

// Example scores:
// 真: 80 + (-5) = 75
// 氣: 70 + (+10) = 80  ← Wins!
```

**Learning Flow**:
1. User types "ev" → sees "天"
2. User types "c8" → sees [1. 真, 2. 氣] (default order)
3. User presses "2" (selects 氣, non-default choice)
4. content.js detects: "User chose #2, not #1"
5. content.js calls: `userDB.recordCorrection("天", "氣", "promote")`
6. content.js calls: `userDB.recordCorrection("天", "真", "demote")` (optional)
7. Next time: [1. 氣, 2. 真] (learned!)

### 3.3. Integration: Sentence Mode (整句模式)

**Scenario**: User blind-types "明天天氣..." → presses Space

**Before (v2.7)**:
```javascript
// viterbi_module.js: forwardPass()
const transitionProb = getBigramProb("天", "真"); // Static N-gram only
// Path "明天天真" may score higher than "明天天氣"
```

**After (v3.0 with F-4.0)**:
```javascript
// viterbi_module.js: forwardPass()
async function forwardPass(lattice, ngramDb, userDB) {
  for (let t = 1; t < lattice.length; t++) {
    for (let currNode of lattice[t]) {
      for (let prevNode of lattice[t-1]) {
        const baseProb = getBigramProb(prevNode.char, currNode.char);
        const userBoost = await userDB.getWeights(prevNode.char, currNode.char);

        // Convert to log space for numerical stability
        const logProb = Math.log(baseProb) + userBoost;

        // ... rest of Viterbi logic
      }
    }
  }
}

// Example:
// Path 1: 明 → 天 → 天 → 真
//   baseProb("天", "真") = 0.35
//   userBoost("天", "真") = -5 (demoted)
//   finalScore = log(0.35) + (-5) = -6.05
//
// Path 2: 明 → 天 → 天 → 氣
//   baseProb("天", "氣") = 0.30
//   userBoost("天", "氣") = +10 (promoted)
//   finalScore = log(0.30) + 10 = 8.80  ← Wins!
```

**Learning Flow**:
1. User blind-types codes: "dj ev ev ..." (明天天...)
2. User presses Space → Viterbi predicts "明天天真..."
3. User sees prediction is wrong, manually corrects:
   - Backspace to "明天天"
   - Types "c8" + "1" → selects "氣"
4. content.js detects: Correction at position 3
5. content.js calls: `userDB.recordCorrection("天", "氣", "promote")`
6. Next time: "明天天氣..." predicted correctly!

### 3.4. Synergy: Cross-Mode Learning

**Key Insight**: Character mode and sentence mode share the same UserDB!

**Example**:
```
Day 1: User teaches in Character Mode
  - Types "ev" (天) + "c8" + selects "2" (氣)
  - UserDB learns: {"天": {"氣": +5}}

Day 2: Sentence Mode immediately benefits
  - User blind-types "dj ev ev c8 ..." (明天天氣...)
  - Viterbi automatically uses UserDB boost
  - Result: "明天天氣..." predicted correctly on first try!
```

---

## 4. F-5.0: Context-Adaptive Weights

### Concept: Dynamic Scoring Formula Adjustment

Our current ngram_db.json is 70% general-purpose + 30% chat. But context matters:
- On **GitHub**: Users write formal docs → bigram structure matters more
- On **PTT**: Users write casual chat → popular characters matter more

**Wrong Approach** (discarded):
```javascript
// Load two separate models (SLOW!)
if (hostname === "github.com") {
  model = formalModel; // 16MB
} else if (hostname === "ptt.cc") {
  model = chatModel; // 16MB
}
// Problem: 32MB total, slow switching
```

**Right Approach** (F-5.0):
```javascript
// Load ONE model, adjust scoring weights dynamically
const weights = ContextEngine.getWeights(hostname);
const score = weights.bigram * bigramScore + weights.unigram * unigramScore;
// Problem solved: 16MB total, instant switching
```

### 4.1. New Module: ContextEngine.js

**Location**: `mvp2a-plugin/modules/ContextEngine.js`
**Location**: `mvp1/context_engine.js` (for MVP1 testing)

**Interface**:
```javascript
class ContextEngine {
  constructor() {
    this.contextRules = {
      // Code/formal websites: Trust bigram structure
      "github.com": { bigram: 0.8, unigram: 0.2 },
      "stackoverflow.com": { bigram: 0.8, unigram: 0.2 },
      "medium.com": { bigram: 0.75, unigram: 0.25 },

      // Chat/casual websites: Trust popular characters
      "ptt.cc": { bigram: 0.6, unigram: 0.4 },
      "dcard.tw": { bigram: 0.6, unigram: 0.4 },
      "facebook.com": { bigram: 0.65, unigram: 0.35 },

      // Default: Our v2.5 golden ratio
      "default": { bigram: 0.7, unigram: 0.3 }
    };
  }

  /**
   * Get scoring weights for a given URL context
   * @param {string} url - Full URL or hostname (e.g., "github.com")
   * @returns {Object} - {bigram: 0.8, unigram: 0.2}
   */
  getWeights(url) {
    const hostname = new URL(url).hostname;

    // Exact match
    if (this.contextRules[hostname]) {
      return this.contextRules[hostname];
    }

    // Pattern match (e.g., "*.github.io")
    for (let pattern in this.contextRules) {
      if (hostname.includes(pattern)) {
        return this.contextRules[pattern];
      }
    }

    // Default fallback
    return this.contextRules["default"];
  }

  /**
   * Allow users to customize context rules
   * @param {string} hostname - Website hostname
   * @param {Object} weights - {bigram: 0.7, unigram: 0.3}
   */
  async setCustomWeights(hostname, weights) {
    this.contextRules[hostname] = weights;
    await chrome.storage.sync.set({ contextRules: this.contextRules });
  }
}
```

### 4.2. Integration: Pass Context Through Message Chain

**content.js** (Detect context):
```javascript
// When user starts typing
const currentUrl = window.location.hostname; // "github.com"

// Send context with every query
chrome.runtime.sendMessage({
  type: "queryCharacter",
  code: "4jp",
  context: currentUrl  // NEW!
});
```

**background.js** (Forward context to Viterbi):
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "queryCharacter") {
    const candidates = dayiMap.get(request.code);
    const context = request.context; // "github.com"

    // Apply context-aware sorting (NEW!)
    const weights = contextEngine.getWeights(context);
    const sorted = sortWithContext(candidates, weights);

    sendResponse(sorted);
  }
});
```

**viterbi_module.js** (Use context in scoring):
```javascript
function forwardPass(lattice, ngramDb, contextWeights) {
  for (let t = 1; t < lattice.length; t++) {
    for (let currNode of lattice[t]) {
      for (let prevNode of lattice[t-1]) {
        const bigramProb = getBigramProb(prevNode.char, currNode.char);
        const unigramProb = getUnigramProb(currNode.char);

        // Context-adaptive scoring (NEW!)
        const finalProb =
          contextWeights.bigram * bigramProb +
          contextWeights.unigram * unigramProb;

        // ... rest of Viterbi
      }
    }
  }
}
```

### 4.3. Example: GitHub vs PTT

**Scenario**: User types "實作" (implement)

**On github.com**:
```javascript
context = "github.com"
weights = {bigram: 0.8, unigram: 0.2}

Candidate A: "實作" (formal)
  bigramScore = 0.30 (moderate structure)
  unigramScore = 0.05 (less common)
  finalScore = 0.8 * 0.30 + 0.2 * 0.05 = 0.25

Candidate B: "實做" (colloquial)
  bigramScore = 0.25 (weaker structure)
  unigramScore = 0.08 (more common)
  finalScore = 0.8 * 0.25 + 0.2 * 0.08 = 0.216

Result: "實作" wins (0.25 > 0.216) ✓ Formal context!
```

**On ptt.cc**:
```javascript
context = "ptt.cc"
weights = {bigram: 0.6, unigram: 0.4}

Candidate A: "實作" (formal)
  bigramScore = 0.30
  unigramScore = 0.05
  finalScore = 0.6 * 0.30 + 0.4 * 0.05 = 0.20

Candidate B: "實做" (colloquial)
  bigramScore = 0.25
  unigramScore = 0.08
  finalScore = 0.6 * 0.25 + 0.4 * 0.08 = 0.182

Result: "實作" still wins, but margin smaller
        (If unigram diff was bigger, "實做" could win)
```

---

## 5. Architecture Evolution

### v2.5/v2.7 Architecture (Current)

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (MVP 1)                     │
│         index.html + core_logic.js + viterbi.js        │
│  ┌────────────────┐              ┌─────────────────┐   │
│  │ Character Mode │              │ Sentence Mode   │   │
│  │ (逐字模式)      │              │ (整句模式)       │   │
│  └────────┬───────┘              └────────┬────────┘   │
└───────────┼──────────────────────────────┼─────────────┘
            │                              │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │   viterbi_module.js      │
            │   (Scoring Engine)       │
            └──────────────┬───────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │   ngram_db.json          │
            │   (Static Model)         │
            │   16MB, 279K bigrams     │
            └──────────────────────────┘
```

### v3.0 Architecture (Target)

```
┌──────────────────────────────────────────────────────────────────┐
│                     UI Layer                                     │
│                                                                  │
│  ┌────────────────┐              ┌──────────────────┐          │
│  │ Character Mode │              │  Sentence Mode   │          │
│  │ (逐字模式)      │              │  (整句模式)       │          │
│  │                │              │                  │          │
│  │ - Sort by freq │              │ - Viterbi path   │          │
│  │ - Apply UserDB │              │ - Apply UserDB   │          │
│  │ - Apply Context│              │ - Apply Context  │          │
│  └────────┬───────┘              └────────┬─────────┘          │
└───────────┼──────────────────────────────┼────────────────────┘
            │                              │
            │     Both modes use           │
            │     shared modules           │
            │              ┌───────────────┘
            │              │
            ▼              ▼
┌───────────────────────────────────────────────────────────┐
│              Engine Layer (Shared Logic)                  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          viterbi_module.js (Core Algorithm)         │ │
│  │                                                     │ │
│  │  function calculateScore(prevChar, currChar, ctx) │ │
│  │    baseScore = getNgramProb(...)                  │ │
│  │    userBoost = userDB.getWeights(...)   ← F-4.0  │ │
│  │    contextWt = contextEngine.getWeights(...)      │ │
│  │                                          ← F-5.0  │ │
│  │    return baseScore + userBoost * contextWt       │ │
│  │  }                                                 │ │
│  └─────────────────────────────────────────────────────┘ │
│                            │                             │
│            ┌───────────────┼───────────────┐             │
│            ▼               ▼               ▼             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │   UserDB.js  │ │ ContextEngine│ │ ngram_db.json│    │
│  │   (F-4.0)    │ │   (F-5.0)    │ │  (Static)    │    │
│  │              │ │              │ │              │    │
│  │ - getWeights │ │ - getWeights │ │ - unigrams   │    │
│  │ - record     │ │ - setCustom  │ │ - bigrams    │    │
│  │ - learn      │ │              │ │ - smoothing  │    │
│  └──────┬───────┘ └──────────────┘ └──────────────┘    │
│         │                                                │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │chrome.storage│                                       │
│  │   .sync      │                                       │
│  │  (Cloud DB)  │                                       │
│  └──────────────┘                                       │
└───────────────────────────────────────────────────────────┘
```

### Key Improvements in v3.0

1. **Unified Scoring**: Both character and sentence modes use the same enhanced scoring function
2. **Modular Design**: UserDB and ContextEngine are independent, reusable modules
3. **Cloud Persistence**: User preferences sync across devices via chrome.storage.sync
4. **Graceful Degradation**: If modules fail, falls back to v2.7 static model
5. **Progressive Enhancement**: Can enable F-4.0 and F-5.0 independently

---

## 6. Implementation Plan

### Phase 0: Foundation (Week 1)

**Goal**: Prepare infrastructure for v3.0 modules

**Tasks**:
1. ✅ Create `docs/design/DESIGN-v3-smart-upgrade.md` (this document)
2. ⏳ Update `docs/project/PRD.md` with F-4.0 and F-5.0 specifications
3. ⏳ Update memory bank (activeContext.md, progress.md, productContext.md)
4. ⏳ Create `mvp2a-plugin/modules/` directory structure
5. ⏳ Design chrome.storage.sync schema for UserDB

**Deliverable**: Complete design documentation + updated PRD

### Phase 1: F-4.0 - UserDB.js Implementation (Week 2-3)

**Goal**: Implement personalized learning module

**Tasks**:

**1.1. Core Module** (3 days)
- [ ] Create `mvp1/user_db.js` for browser testing
- [ ] Implement `UserDB` class with localStorage backend
- [ ] Write unit tests (20+ tests)
  - Storage: load, save, persistence
  - Weights: get, set, update
  - Corrections: promote, demote, boundary cases

**1.2. Character Mode Integration** (2 days)
- [ ] Modify `core_logic.js`: Add `sortWithUserDB()` function
- [ ] Add learning detection: Track non-default selections
- [ ] Add feedback UI: "✓ Learned preference" toast
- [ ] Write integration tests (10+ tests)

**1.3. Sentence Mode Integration** (3 days)
- [ ] Modify `viterbi_module.js`: Add `userDB` parameter to `forwardPass()`
- [ ] Update scoring calculation: `baseScore + await userDB.getWeights(...)`
- [ ] Add correction detection in `core_logic_v11_ui.js`
- [ ] Write integration tests (15+ tests)

**1.4. Browser Testing** (2 days)
- [ ] Create test page: `mvp1/test-userdb.html`
- [ ] Manual test scenarios:
  - Learn in character mode → verify in sentence mode
  - Learn in sentence mode → verify in character mode
  - Cross-session persistence
- [ ] Performance testing: < 10ms overhead per query

**Deliverable**: Fully functional UserDB.js with 45+ passing tests

### Phase 2: F-5.0 - ContextEngine.js Implementation (Week 4)

**Goal**: Implement context-aware weighting

**Tasks**:

**2.1. Core Module** (2 days)
- [ ] Create `mvp1/context_engine.js`
- [ ] Implement `ContextEngine` class
- [ ] Define default context rules (10+ websites)
- [ ] Write unit tests (15+ tests)

**2.2. Message Chain Integration** (2 days)
- [ ] Modify `core_logic.js`: Pass `window.location.hostname` to queries
- [ ] Modify `viterbi_module.js`: Accept `contextWeights` parameter
- [ ] Update scoring: `bigramWt * bigramProb + unigramWt * unigramProb`
- [ ] Write integration tests (10+ tests)

**2.3. Custom Rules UI** (2 days)
- [ ] Add settings panel: "Context Rules"
- [ ] Allow users to customize weights per website
- [ ] Store custom rules in localStorage/chrome.storage
- [ ] Write UI tests (5+ tests)

**2.4. Browser Testing** (1 day)
- [ ] Test on GitHub (formal) vs PTT (casual)
- [ ] Verify weight adjustments affect predictions
- [ ] Benchmark: No performance degradation

**Deliverable**: Fully functional ContextEngine.js with 30+ passing tests

### Phase 3: MVP 1.0 v12 Integration (Week 5)

**Goal**: Integrate F-4.0 and F-5.0 into MVP 1.0 for testing

**Tasks**:

**3.1. Core Integration** (2 days)
- [ ] Update `index.html`: Add UserDB + ContextEngine scripts
- [ ] Update `core_logic.js`: Initialize both modules
- [ ] Update `viterbi_module.js`: Use both modules in scoring
- [ ] Add feature flags: Enable/disable F-4.0 and F-5.0 independently

**3.2. UI Enhancements** (2 days)
- [ ] Add "Learning" indicator when UserDB records correction
- [ ] Add "Context" badge showing current weights (e.g., "GitHub: 80/20")
- [ ] Add settings panel:
  - Toggle F-4.0 (Personalized Learning)
  - Toggle F-5.0 (Context-Aware)
  - View learned patterns
  - Clear learned data

**3.3. Testing & Documentation** (3 days)
- [ ] Write comprehensive integration tests (50+ tests)
- [ ] Update README.md with v12 features
- [ ] Create user guide: "How Learning Works"
- [ ] Create developer guide: "v3.0 Architecture"

**3.4. Version Bump** (1 day)
- [ ] Update version to 12.0.0 (major feature release)
- [ ] Update version.json and all meta tags
- [ ] Commit: "feat: MVP 1.0 v12 - Personalized Learning + Context-Aware Engine"

**Deliverable**: MVP 1.0 v12 with F-4.0 and F-5.0 fully integrated

### Phase 4: MVP 2a Chrome Extension Port (Week 6-8)

**Goal**: Port v12 features to Chrome Extension

**Tasks**:

**4.1. Module Migration** (3 days)
- [ ] Create `mvp2a-plugin/modules/UserDB.js`
- [ ] Migrate from localStorage to chrome.storage.sync
- [ ] Create `mvp2a-plugin/modules/ContextEngine.js`
- [ ] Update imports for Chrome Extension module system

**4.2. Background Script Updates** (3 days)
- [ ] Update `background.js`: Initialize UserDB + ContextEngine
- [ ] Add message handlers:
  - `getUserWeights(prevChar, currChar)`
  - `recordCorrection(prevChar, currChar, action)`
  - `getContextWeights(url)`
- [ ] Add chrome.storage listeners for sync events

**4.3. Content Script Updates** (3 days)
- [ ] Update `content.js`: Pass context (hostname) with every query
- [ ] Add learning detection: Track non-default selections
- [ ] Add correction detection in sentence mode
- [ ] Send learning events to background.js

**4.4. Extension Testing** (5 days)
- [ ] Test on Gmail, Notion, Google Docs
- [ ] Test cross-device sync (2 Chrome browsers)
- [ ] Performance testing: < 100ms end-to-end
- [ ] Privacy audit: Ensure no data leaks

**4.5. Chrome Web Store Preparation** (3 days)
- [ ] Update manifest.json version to 2.0.0
- [ ] Add privacy policy explaining learning features
- [ ] Create demo video showing learning in action
- [ ] Write release notes

**Deliverable**: MVP 2a v2.0 Chrome Extension ready for Chrome Web Store

---

## 7. Testing Strategy

### 7.1. Unit Tests (TDD Approach)

**UserDB.js** (25 tests):
- Storage operations: load, save, clear
- Weight operations: get, set, update
- Correction logic: promote, demote, boundaries
- Edge cases: Empty DB, invalid input, overflow

**ContextEngine.js** (15 tests):
- Rule matching: Exact, pattern, fallback
- Weight calculation: Valid ranges, edge cases
- Custom rules: Add, update, delete, persist

**Viterbi Integration** (20 tests):
- Scoring: baseScore + userBoost
- Context weights: bigram/unigram adjustment
- Combined: UserDB + ContextEngine working together

### 7.2. Integration Tests

**Character Mode** (10 tests):
- Learn preference → verify sorting
- Cross-session persistence
- Multiple corrections
- Context affects sorting

**Sentence Mode** (15 tests):
- Learn in sentence → affects path scoring
- Viterbi respects UserDB weights
- Context affects final prediction
- Combined: UserDB + Context in Viterbi

**Cross-Mode** (10 tests):
- Learn in character → affects sentence
- Learn in sentence → affects character
- Synergy: Both modes share same UserDB

### 7.3. Browser Testing Scenarios

**Scenario 1: Tie-breaking**
```
Setup:
  - Fresh UserDB (no learned data)
  - Type: 天 (ev) + c8
  - Expected: [1. 真, 2. 氣] (default order)

Action:
  - Select #2 (氣)
  - Verify: UserDB records {"天": {"氣": +5}}

Verify:
  - Type: 天 (ev) + c8 again
  - Expected: [1. 氣, 2. 真] (learned order)
  - ✓ Pass if氣 is #1
```

**Scenario 2: Context switching**
```
Setup:
  - Open test-context.html
  - Simulate: hostname = "github.com"

Action:
  - Type codes for "實作"
  - Expected: Context weights = {bigram: 0.8, unigram: 0.2}

Verify:
  - Change hostname to "ptt.cc"
  - Type same codes
  - Expected: Context weights = {bigram: 0.6, unigram: 0.4}
  - ✓ Pass if weights change automatically
```

### 7.4. Performance Benchmarks

**Targets**:
- UserDB.getWeights(): < 5ms (localStorage read)
- ContextEngine.getWeights(): < 1ms (map lookup)
- Character mode sorting: < 20ms total (including UserDB)
- Sentence mode prediction: < 500ms total (including UserDB + Context)

**Test Method**:
```javascript
console.time("UserDB.getWeights");
const weight = await userDB.getWeights("天", "氣");
console.timeEnd("UserDB.getWeights");
// Expected: < 5ms
```

---

## 8. Success Metrics

### 8.1. Quantitative Metrics

**Accuracy Improvement**:
- Baseline (v2.7): 94.4% (17/18 test phrases)
- Target (v3.0): 97% (18/18) after 10 learning iterations
- Measure: Use existing test phrases, simulate learning

**Learning Speed**:
- Metric: How many corrections needed to learn a preference?
- Target: 1-2 corrections for high-confidence learning
- Measure: Track convergence in UserDB weights

**Context Effectiveness**:
- Metric: Prediction accuracy delta between contexts
- Target: +3-5% accuracy improvement on domain-specific text
- Measure: GitHub corpus vs PTT corpus A/B testing

### 8.2. Qualitative Metrics

**User Experience**:
- [ ] Learning feels invisible (no extra steps required)
- [ ] Context adaptation feels natural (no manual switching)
- [ ] Feedback is clear ("✓ Learned: 天氣 > 天真")

**Developer Experience**:
- [ ] Code is modular and easy to understand
- [ ] Adding new context rules is trivial
- [ ] Testing is comprehensive and automated

### 8.3. Release Criteria

**MVP 1.0 v12 Release**:
- ✅ 100+ tests passing (unit + integration)
- ✅ Manual testing on 5+ real-world scenarios
- ✅ Documentation complete (README, user guide, dev guide)
- ✅ Performance benchmarks met

**MVP 2a v2.0 Release**:
- ✅ All v12 features working in Chrome Extension
- ✅ Cross-device sync verified
- ✅ Privacy policy approved
- ✅ Chrome Web Store guidelines met

---

## 9. Risks & Mitigations

### Risk 1: Performance Degradation

**Risk**: Adding UserDB lookups might slow down predictions

**Mitigation**:
- Use in-memory cache for UserDB (load once, query fast)
- Benchmark every integration point
- Set hard performance budget: < 10ms overhead
- Fallback: Disable learning if performance suffers

### Risk 2: Learning Interference

**Risk**: UserDB might over-learn edge cases (e.g., user mis-typed once)

**Mitigation**:
- Use confidence threshold: Only learn after 2+ corrections
- Implement decay: Old preferences gradually fade
- Allow manual reset: "Clear learned data" button
- Future: Implement LoRA-style adaptive learning rates

### Risk 3: Context Rule Conflicts

**Risk**: User's custom context rules might break predictions

**Mitigation**:
- Validate weight ranges: bigram + unigram = 1.0
- Provide presets: "Formal", "Casual", "Balanced"
- Allow reset to default: "Restore original rules"
- Test edge cases: extreme weights (0.9/0.1, 0.5/0.5)

### Risk 4: Storage Limits

**Risk**: chrome.storage.sync has 100KB limit, UserDB might exceed

**Mitigation**:
- Monitor storage usage: Show "Storage: 45KB / 100KB"
- Implement pruning: Remove low-confidence entries
- Compression: Use efficient serialization format
- Fallback: Use chrome.storage.local (no sync) if full

---

## 10. Future Enhancements (v3.1+)

### 10.1. Advanced Learning (LoRA-Inspired)

**Concept**: Implement true LoRA-style adaptive learning rates

**Features**:
- Learning rate decay: Strong corrections fade over time
- Confidence scoring: Track how often a preference is confirmed
- Adaptive thresholds: Learn faster for repeated patterns

### 10.2. Multi-Corpus Context

**Concept**: Use domain-specific N-gram models per context

**Features**:
- GitHub context loads code-specific N-grams
- PTT context loads chat-specific N-grams
- Lazy loading: Download on-demand, cache locally

### 10.3. Collaborative Learning

**Concept**: Share anonymized learning patterns across users

**Features**:
- Opt-in: "Help improve predictions for everyone"
- Privacy-preserving: Differential privacy techniques
- Community model: Blend user patterns into base model

### 10.4. Visual Learning Dashboard

**Concept**: Show users what the engine has learned

**Features**:
- "My Learned Patterns" page
- Visualization: Heatmap of bigram weights
- Manual editing: Adjust weights directly
- Export/Import: Share learned patterns

---

## Appendix A: Chrome Storage Schema

### UserDB Schema (chrome.storage.sync)

```json
{
  "userWeights": {
    "version": "1.0",
    "lastUpdated": "2025-11-12T10:30:00Z",
    "entries": {
      "天": {
        "氣": 10,
        "真": -5,
        "空": 2
      },
      "實": {
        "作": 8,
        "做": -3
      }
    },
    "metadata": {
      "totalCorrections": 25,
      "confidenceThreshold": 2
    }
  }
}
```

### ContextEngine Schema (chrome.storage.sync)

```json
{
  "contextRules": {
    "version": "1.0",
    "custom": {
      "mycompany.com": {
        "bigram": 0.75,
        "unigram": 0.25,
        "note": "Company internal docs"
      }
    },
    "presets": {
      "formal": { "bigram": 0.8, "unigram": 0.2 },
      "casual": { "bigram": 0.6, "unigram": 0.4 },
      "balanced": { "bigram": 0.7, "unigram": 0.3 }
    }
  }
}
```

---

## Appendix B: API Reference

### UserDB.js API

```typescript
class UserDB {
  constructor(storage: Storage)

  // Query
  async getWeights(prevChar: string, currChar: string): Promise<number>
  async getAllWeights(): Promise<Map<string, Map<string, number>>>

  // Update
  async recordCorrection(prevChar: string, currChar: string, action: 'promote' | 'demote'): Promise<void>
  async setWeight(prevChar: string, currChar: string, weight: number): Promise<void>

  // Management
  async load(): Promise<void>
  async save(): Promise<void>
  async clear(): Promise<void>
  async export(): Promise<string> // JSON string
  async import(data: string): Promise<void>

  // Metadata
  async getStats(): Promise<{totalEntries: number, totalCorrections: number}>
}
```

### ContextEngine.js API

```typescript
class ContextEngine {
  constructor()

  // Query
  getWeights(url: string): {bigram: number, unigram: number}
  getCurrentContext(): string // Returns current hostname

  // Customization
  async setCustomWeights(hostname: string, weights: {bigram: number, unigram: number}): Promise<void>
  async removeCustomWeights(hostname: string): Promise<void>
  async getAllRules(): Promise<Map<string, {bigram: number, unigram: number}>>

  // Presets
  getPreset(name: 'formal' | 'casual' | 'balanced'): {bigram: number, unigram: number}
  async applyPreset(hostname: string, preset: string): Promise<void>
}
```

---

## Appendix C: Testing Checklist

### F-4.0 UserDB Testing

**Unit Tests** (25):
- [ ] Storage: load() empty DB
- [ ] Storage: save() and load() roundtrip
- [ ] Storage: clear() removes all data
- [ ] Weights: getWeights() returns 0 for unknown bigram
- [ ] Weights: getWeights() returns correct weight for known bigram
- [ ] Weights: setWeight() updates correctly
- [ ] Correction: recordCorrection('promote') adds +5
- [ ] Correction: recordCorrection('demote') adds -2
- [ ] Correction: Multiple promotes accumulate
- [ ] Correction: Promote then demote cancels out
- [ ] Edge: Very long character strings
- [ ] Edge: Special characters (emoji, punctuation)
- [ ] Edge: Overflow protection (weight > 1000)
- [ ] Export: JSON format is valid
- [ ] Import: Restores exact state
- [ ] Stats: Count entries correctly
- [ ] Stats: Count corrections correctly
- [ ] Performance: getWeights() < 5ms
- [ ] Performance: save() < 50ms
- [ ] Concurrent: Multiple save() calls don't corrupt
- [ ] Validation: Reject invalid prevChar/currChar
- [ ] Validation: Reject invalid weights
- [ ] Validation: Reject invalid action
- [ ] Persistence: Survives page reload
- [ ] Isolation: Multiple UserDB instances independent

**Integration Tests** (10):
- [ ] Character mode: Learn preference, verify sorting
- [ ] Character mode: Cross-session persistence
- [ ] Sentence mode: Learn preference, verify path
- [ ] Sentence mode: Viterbi uses UserDB weights
- [ ] Cross-mode: Learn in char mode, affects sentence mode
- [ ] Cross-mode: Learn in sentence mode, affects char mode
- [ ] UI: Toast notification on learning
- [ ] UI: Settings panel shows learned patterns
- [ ] UI: Clear button removes all data
- [ ] Performance: No degradation in sorting/prediction

### F-5.0 ContextEngine Testing

**Unit Tests** (15):
- [ ] Rule matching: Exact hostname match
- [ ] Rule matching: Pattern match (*.github.io)
- [ ] Rule matching: Fallback to default
- [ ] Weights: Return correct weights for github.com
- [ ] Weights: Return correct weights for ptt.cc
- [ ] Weights: Return default for unknown site
- [ ] Custom: Set custom rule for new hostname
- [ ] Custom: Update existing rule
- [ ] Custom: Remove custom rule
- [ ] Presets: Get formal preset (0.8/0.2)
- [ ] Presets: Get casual preset (0.6/0.4)
- [ ] Presets: Apply preset to hostname
- [ ] Validation: Reject weights that don't sum to 1.0
- [ ] Export: getAllRules() returns all rules
- [ ] Performance: getWeights() < 1ms

**Integration Tests** (10):
- [ ] Character mode: Context affects sorting
- [ ] Character mode: Switch context, verify change
- [ ] Sentence mode: Context affects Viterbi scoring
- [ ] Sentence mode: Switch context, verify prediction change
- [ ] Content script: Passes correct hostname to background
- [ ] Background: Applies correct context weights
- [ ] UI: Context badge shows current weights
- [ ] UI: Settings panel lists all rules
- [ ] UI: Custom rule creation works
- [ ] Performance: No degradation with context

### Combined Testing (10):
- [ ] UserDB + ContextEngine work together
- [ ] Character mode: User learning + context adaptation
- [ ] Sentence mode: User learning + context adaptation
- [ ] Edge: UserDB very large + context switching (stress test)
- [ ] Edge: Multiple rapid context switches
- [ ] Edge: UserDB + ContextEngine both disabled (fallback)
- [ ] Privacy: No data leaked to external servers
- [ ] Security: No XSS vulnerabilities in stored data
- [ ] Cross-device: Sync works on 2 Chrome browsers
- [ ] Backward compat: v2.7 data migrates cleanly to v3.0

---

**End of Document**

**Next Steps**:
1. Review and approve this design document
2. Update PRD.md with F-4.0 and F-5.0 specifications
3. Update memory bank with v3.0 roadmap
4. Begin Phase 1: F-4.0 UserDB.js implementation
