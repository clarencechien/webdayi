# Session 10: MVP 3.0 v2 Smart Upgrade Planning

**Date**: 2025-11-12
**Duration**: ~2 hours
**Status**: ✅ Planning Phase Complete
**Branch**: claude/update-prd-v3-roadmap-011CV3aecnMvzQ7oqkMwjcUi

---

## 🎯 Session Objective

Plan and document the next major evolution of WebDaYi: **MVP 3.0 v2 Smart Upgrade**, which adds personalized learning and context-aware prediction capabilities.

---

## 📋 What Was Accomplished

### 1. Comprehensive Design Document
**File**: `docs/design/DESIGN-v3-smart-upgrade.md` (15,000+ lines)

**Contents**:
- Executive summary and problem statement
- F-4.0: Personalized N-gram Learning (User LoRA) - Complete design
- F-5.0: Context-Adaptive Weights - Complete design
- Architecture evolution diagrams (v2.7 → v3.0)
- 8-week implementation roadmap (4 phases)
- Testing strategy (100+ tests planned)
- Success metrics and release criteria
- API reference and testing checklist

### 2. PRD Updated to v1.4
**File**: `docs/project/PRD.md` (Updated)

**Changes**:
- Added Section 8: MVP 3.0 v2 Smart Upgrade PRD
- F-4.0: 5 functional requirements (F-4.1 to F-4.5)
- F-5.0: 5 functional requirements (F-5.1 to F-5.5)
- Architecture diagrams showing integration approach
- Success metrics and implementation schedule
- Future roadmap (MVP 3.1+)

### 3. Memory Bank Updates
**Files Updated**:
- ✅ `memory-bank/activeContext.md` - Session 10 added with full context
- ✅ `memory-bank/progress.md` - Phase 1.6 tracking, new milestone section
- ✅ `memory-bank/productContext.md` - MVP 3.0 v2 vision and features

---

## 🚀 Key Features Designed

### F-4.0: Personalized N-gram Learning (User LoRA)

**Concept**: User-side adaptation layer (LoRA) on top of static N-gram model

**Architecture**:
```
Final Score = Base Model Score + User LoRA Score
              (ngram_db.json)      (chrome.storage.sync)
              (static, shared)     (dynamic, personal)
```

**Solves**: Tie-breaking problem
- Example: "天氣" vs "天真" (similar N-gram scores)
- User selects "氣" once → System learns preference
- Next time: "氣" appears first automatically

**Cross-Mode Synergy**:
- Learn in character mode → affects sentence mode
- Learn in sentence mode → affects character mode
- Same UserDB shared by both modes!

**Implementation**:
- New module: `UserDB.js`
- Methods: `getWeights()`, `recordCorrection()`
- Storage: chrome.storage.sync (cloud-synced)
- Integration: Both character and sentence modes

### F-5.0: Context-Adaptive Weights

**Concept**: Dynamic adjustment of bigram/unigram weights based on website context

**Weights by Context**:
- GitHub (formal): {bigram: 0.8, unigram: 0.2} - trust structure
- PTT (casual): {bigram: 0.6, unigram: 0.4} - trust popularity
- Default: {bigram: 0.7, unigram: 0.3} - v2.5 golden ratio

**Solves**: Context blindness
- Example: "實作" (formal) vs "實做" (casual)
- On GitHub: "實作" wins (formal context)
- On PTT: Weights adjust, better balance

**Implementation**:
- New module: `ContextEngine.js`
- Methods: `getWeights(url)`, `setCustomWeights()`
- Auto-detection: Reads window.location.hostname
- Integration: Viterbi scoring formula uses context weights

---

## 📊 Architecture Evolution

### v2.7 Architecture (Current)
```
Content/UI → Viterbi.js → ngram_db.json (static)
```

### v3.0 Architecture (Target)
```
┌─────────────────────────────────────────┐
│  UI Layer (Character + Sentence Modes) │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  viterbi_module.js (Enhanced Scoring)   │
│  score = base + userBoost + contextWt   │
└─────┬──────────┬──────────────┬─────────┘
      │          │              │
      ▼          ▼              ▼
┌──────────┐ ┌────────────┐ ┌────────────┐
│ UserDB.js│ │ContextEngine│ │ngram_db.json│
│ (F-4.0)  │ │  (F-5.0)   │ │  (Static)  │
│ Personal │ │  Adaptive  │ │  Base      │
└────┬─────┘ └────────────┘ └────────────┘
     │
     ▼
┌──────────────┐
│chrome.storage│
│   .sync      │
│ (Cloud Sync) │
└──────────────┘
```

**Key Improvements**:
1. **Unified Scoring**: Both modes use same enhanced scoring function
2. **Modular Design**: UserDB and ContextEngine are independent, reusable
3. **Cloud Persistence**: User preferences sync across devices
4. **Graceful Degradation**: Falls back to v2.7 if modules fail
5. **Progressive Enhancement**: Can enable F-4.0 and F-5.0 independently

---

## 📅 Implementation Roadmap (8 Weeks)

### Phase 0: Foundation (Week 1) - ✅ CURRENT
- [x] Create DESIGN-v3-smart-upgrade.md
- [x] Update PRD.md to v1.4
- [x] Update memory bank files
- [ ] Create mvp2a-plugin/modules/ directory
- [ ] Design chrome.storage.sync schema

**Status**: 50% complete (documentation done, infrastructure next)

### Phase 1: F-4.0 - UserDB.js (Week 2-3)
- Core Module (3 days): UserDB class, unit tests (20+)
- Character Mode Integration (2 days): sortWithUserDB(), learning detection
- Sentence Mode Integration (3 days): Viterbi integration, correction detection
- Browser Testing (2 days): test-userdb.html, performance

**Deliverable**: Fully functional UserDB.js with 45+ passing tests

### Phase 2: F-5.0 - ContextEngine.js (Week 4)
- Core Module (2 days): ContextEngine class, unit tests (15+)
- Message Chain Integration (2 days): Pass context through queries
- Custom Rules UI (2 days): Settings panel
- Browser Testing (1 day): GitHub vs PTT verification

**Deliverable**: Fully functional ContextEngine.js with 30+ passing tests

### Phase 3: MVP 1.0 v12 Integration (Week 5)
- Core Integration (2 days): Initialize both modules
- UI Enhancements (2 days): Learning indicators, context badges
- Testing & Docs (3 days): 50+ integration tests, user guide
- Version Bump (1 day): Update to 12.0.0

**Deliverable**: MVP 1.0 v12 with F-4.0 and F-5.0 fully integrated

### Phase 4: MVP 2a v2.0 Extension (Week 6-8)
- Module Migration (3 days): Port to Chrome Extension
- Background Script Updates (3 days): Message handlers
- Content Script Updates (3 days): Pass context, detect learning
- Extension Testing (5 days): Gmail, Notion, Google Docs
- Chrome Web Store Prep (3 days): Privacy policy, demo video

**Deliverable**: MVP 2a v2.0 ready for Chrome Web Store

---

## 📈 Success Metrics

### Quantitative Targets
- **Accuracy Improvement**: 94.4% (v2.7) → 97% (v3.0) after 10 learning iterations
- **Learning Speed**: 1-2 corrections to learn a preference
- **Context Effect**: +3-5% accuracy on domain-specific text
- **Performance**: < 10ms overhead for UserDB/ContextEngine

### Qualitative Goals
- ✅ Learning feels invisible (no extra steps required)
- ✅ Context adaptation feels natural (no manual switching)
- ✅ Clear feedback ("✓ Learned: 天氣 > 天真")

### Release Criteria
- ✅ 100+ tests passing (unit + integration)
- ✅ 5+ real-world scenarios tested manually
- ✅ Complete documentation (README, user guide, dev guide)
- ✅ Performance benchmarks met

---

## 💡 Key Design Insights

### 1. LoRA-Inspired Approach
Borrowed from machine learning's LoRA (Low-Rank Adaptation):
- Keep base model frozen (ngram_db.json)
- Add lightweight adaptation layer (chrome.storage.sync)
- Final prediction = Base + Adapter

**Benefits**:
- Efficient: Only store user deltas, not full model
- Cloud-syncable: Personal weights are small (~100KB)
- Reversible: Can reset to base model anytime

### 2. Shared Modules Pattern
Both F-4.0 and F-5.0 are "shared services" that enhance both modes:
- Character mode: Uses modules for candidate sorting
- Sentence mode: Uses modules for Viterbi path scoring
- No code duplication, consistent behavior

### 3. Progressive Enhancement
Features can be enabled independently:
- F-4.0 only: Personalization without context
- F-5.0 only: Context without personalization
- Both: Full smart upgrade
- Neither: Falls back to v2.7 behavior

### 4. Context Rules Flexibility
Users can customize weights per website:
- Built-in rules for common sites (GitHub, PTT, Medium...)
- Custom rules for company intranets
- Presets: "Formal", "Casual", "Balanced"

---

## 🔬 Testing Strategy

### Unit Tests (70 tests)
- **UserDB.js** (25 tests): Storage, weights, corrections, edge cases
- **ContextEngine.js** (15 tests): Rule matching, weights, custom rules
- **Viterbi Integration** (20 tests): Scoring, context weights, combined
- **Edge Cases** (10 tests): Empty DB, invalid input, overflow

### Integration Tests (30 tests)
- **Character Mode** (10 tests): Learning, persistence, context
- **Sentence Mode** (10 tests): Viterbi integration, path scoring
- **Cross-Mode** (10 tests): Synergy, UserDB sharing, combined features

### Browser Testing
- **Scenario 1**: Tie-breaking (learn "天氣" > "天真")
- **Scenario 2**: Context switching (GitHub vs PTT)
- **Scenario 3**: Cross-mode synergy (learn in char, affects sentence)
- **Scenario 4**: Performance (< 10ms overhead)
- **Scenario 5**: Persistence (survives page reload)

---

## 📦 Deliverables Summary

### Documents Created
1. ✅ `docs/design/DESIGN-v3-smart-upgrade.md` (15,000+ lines)
2. ✅ `docs/project/PRD.md` (Updated to v1.4)
3. ✅ `docs/project/SESSION-10-SUMMARY.md` (This file)

### Memory Bank Updated
1. ✅ `memory-bank/activeContext.md` (Session 10 context)
2. ✅ `memory-bank/progress.md` (Phase 1.6 tracking)
3. ✅ `memory-bank/productContext.md` (MVP 3.0 v2 vision)

### Code Structure Planned
1. ⏳ `mvp2a-plugin/modules/UserDB.js` (Planned)
2. ⏳ `mvp2a-plugin/modules/ContextEngine.js` (Planned)
3. ⏳ `mvp1/user_db.js` (For browser testing)
4. ⏳ `mvp1/context_engine.js` (For browser testing)

---

## 🎯 Next Steps

### Immediate (Complete Phase 0)
1. [ ] Create mvp2a-plugin/modules/ directory structure
2. [ ] Design chrome.storage.sync schema (detailed spec)
3. [ ] Commit and push all documentation updates
4. [ ] Review and approve design with stakeholders

### Next Session (Begin Phase 1)
1. [ ] Create `mvp1/user_db.js` module
2. [ ] Write UserDB unit tests (TDD approach)
3. [ ] Implement UserDB class methods
4. [ ] Begin character mode integration

---

## 📝 Notes & Observations

### Why This Matters
- **v2.7 Achievement**: 94.4% accuracy is excellent, but static
- **Remaining Gap**: Cannot adapt to users or contexts
- **v3.0 Vision**: Close the 3% gap through intelligence, not brute force

### Design Philosophy
- **Simplicity**: Add intelligence without adding complexity
- **Transparency**: Users understand what engine learned
- **Control**: Users can view, edit, reset learned patterns
- **Privacy**: All data stays on device (or cloud-synced via Chrome)

### Risk Mitigation
- **Performance**: Hard budget of < 10ms overhead
- **Storage**: Pruning strategy if chrome.storage.sync fills up
- **Fallback**: Graceful degradation to v2.7 if modules fail
- **Testing**: 100+ automated tests before release

---

## 🙏 Acknowledgments

This design builds upon:
- **v2.7 Hybrid**: Proven 70/30 + Laplace smoothing foundation
- **LoRA Concept**: Efficient adaptation layer from ML research
- **User Feedback**: Tie-breaking and context issues identified in testing

---

**Session Status**: ✅ Planning Complete | Ready for Implementation
**Next Milestone**: Phase 1 - F-4.0 UserDB.js Implementation (Week 2-3)
**Target Release**: MVP 1.0 v12 (Week 5) → MVP 2a v2.0 (Week 8)

---

**End of Session 10 Summary**
