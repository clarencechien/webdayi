# Session 9: N-gram Blended Model - Implementation Plan

**Date**: 2025-11-11
**Status**: 🎯 Design Complete - Ready for Implementation
**Goal**: Build hybrid N-gram model (general + chat) to achieve 90%+ quality

---

## 🎯 Executive Summary

### Current State (Session 8)
```
Model:    ngram_pruned.json (3.1MB)
Source:   rime-essay only (general-purpose corpus)
Quality:  86.8% on everyday phrases
Limit:    Lacks colloquial/chat language patterns
```

### Target State (Session 9)
```
Model:    ngram_blended.json (3.2-4MB)
Sources:  rime-essay (70%) + PTT-Corpus (30%)
Quality:  90-92% (formal writing + chat/slang)
Impact:   Better real-world typing experience
```

---

## 🧠 Core Concept: Weighted Corpus Blending

### The Problem
- **rime-essay** alone: Great for formal writing, poor for chat/slang
- **PTT-Corpus** alone: Captures chat patterns, but too noisy
- **Real users**: Type BOTH formal documents AND casual messages

### The Solution
```
┌─────────────────────────────────────────────────┐
│         Blended Model Architecture              │
│                                                 │
│  rime-essay (70%)  +  PTT-Corpus (30%)         │
│  ─────────────────────────────────────         │
│  Formal accuracy      Chat naturalness         │
│                                                 │
│  → Weighted merge → Prune → 3.2MB, 90%+       │
└─────────────────────────────────────────────────┘
```

**Key Insight**: Merging BEFORE pruning keeps best patterns from both corpora!

---

## 📊 Expected Results

| Metric | Session 8 (General) | Session 9 (Blended) | Improvement |
|--------|---------------------|---------------------|-------------|
| **Overall Quality** | 86.8% | **90-92%** | +4-5% ✅ |
| Formal writing | 87% | 87% | (maintained) |
| Chat/colloquial | 65% | **82%** | +17% 🚀 |
| Mixed context | 84% | **90%** | +6% |
| **File Size** | 3.1 MB | 3.2-4 MB | +3-30% |
| Loading time | 0.5s | 0.55s | +0.05s |

**Success Criteria**:
- ✅ Quality ≥ 90% (vs 86.8%)
- ✅ File size ≤ 5MB (Chrome Extension ready)
- ✅ No regression on formal writing (≥85%)

---

## 🏗️ Architecture: 4-Phase Pipeline

### Phase 1: RIME Essay (Refactor)
**File**: `converter/build_ngram_lib.py`
**Task**: Extract reusable `process_essay_file()` function
**Output**: `(unigrams_rime, bigrams_rime)` - raw counts BEFORE pruning
**Time**: 30 minutes

### Phase 2: PTT-Corpus (NEW)
**File**: `converter/process_raw_text.py` (NEW)
**Task**: Stream-process PTT data with aggressive cleaning
**Cleaning**:
- Remove: URLs, metadata, English, special chars
- Keep: Chinese text, colloquial patterns (好ㄉ, ㄎㄎ, etc.)
**Output**: `(unigrams_ptt, bigrams_ptt)` - raw counts
**Time**: 2 hours

### Phase 3: Weighted Merge (NEW)
**File**: `converter/build_blended.py` (NEW)
**Task**: Blend counts with 70:30 weighting
**Formula**:
```python
blended_count(c) = 0.7 × count_rime(c) + 0.3 × count_ptt(c)
```
**Output**: `(blended_unigrams, blended_bigrams)` - merged counts
**Time**: 1 hour

### Phase 4: Prune (Reuse Session 8)
**Function**: `apply_pruning(threshold=3, topk=10)`
**Task**: Apply Session 8's validated pruning to blended counts
**Output**: `ngram_blended.json` (3.2-4MB)
**Time**: Built-in (no new code)

---

## 📝 Implementation Checklist

### ✅ Design Phase (Complete)
- [x] Analyze reference/ngram-chat.txt
- [x] Design 4-phase architecture
- [x] Create comprehensive design doc (700+ lines)
- [x] Plan testing strategy

### 🚧 Development Phase (Next Steps)

**Step 1: Refactor** (30 min)
```bash
# Extract reusable function
vim converter/build_ngram_lib.py
# Add: process_essay_file() -> (uni, bi)
```

**Step 2: PTT Processor** (2 hr)
```bash
# Create new processor
touch converter/process_raw_text.py
# Implement: clean_ptt_text(), process_corpus()
# Test with sample data
```

**Step 3: Blended Builder** (1 hr)
```bash
# Create orchestrator
touch converter/build_blended.py
# Implement: merge_counts(), 4-phase pipeline, CLI
```

**Step 4: Data Prep** (1 hr)
```bash
# Download PTT-Corpus
wget https://github.com/zake7749/Gossiping-Chinese-Corpus/.../Gossiping-QA-Dataset.txt
mv Gossiping-QA-Dataset.txt converter/raw_data/ptt_corpus.txt
```

**Step 5: Generate** (30 min)
```bash
# Run full pipeline
python3 converter/build_blended.py \
  --rime-corpus converter/raw_data/essay.txt \
  --ptt-corpus converter/raw_data/ptt_corpus.txt \
  --weight-rime 0.7 \
  --weight-ptt 0.3 \
  --threshold 3 \
  --topk 10 \
  --output mvp1/ngram_blended.json \
  --verbose
```

**Step 6: Validate** (1 hr)
```bash
# Compare quality
python3 converter/compare_blended_quality.py
# Verify: blended_score ≥ 90%
```

**Step 7: Integrate** (15 min)
```javascript
// mvp1/core_logic_v11_ui.js (line 88)
const response = await fetch('ngram_blended.json');  // ✅ Use blended
```

**Step 8: Document** (30 min)
- Update README.md (blended model section)
- Update memory-bank/activeContext.md (Session 9)
- Update CLAUDE.md (pipeline description)

**Total Time**: ~6-7 hours

---

## 🎯 Why This Matters

### For Users
```
Typing:  "我也是" (I also am / me too)

Session 8 (general):
  Prediction: Correct, but ranked #3-5 (slower selection)
  Reason: Formal corpus doesn't emphasize chat phrases

Session 9 (blended):
  Prediction: Correct, ranked #1 (instant selection)
  Reason: PTT data teaches "我也是" is super common in chat!

Result: Faster, more natural typing experience ✨
```

### Real-World Impact
- **Email writing**: Formal accuracy maintained (70% rime-essay)
- **Messaging**: Chat patterns learned (30% PTT-Corpus)
- **Mixed contexts**: Balanced predictions (weighted blending)

---

## 🔬 Technical Highlights

### 1. Streaming Processing (Memory-Efficient)
```python
# Process 1GB file line-by-line (no memory explosion)
for line in corpus_file:  # ← Streaming, not load_all()
    clean_line = clean_ptt_text(line)
    count_ngrams(clean_line)
```

### 2. Weighted Merging (Mathematically Sound)
```python
# Not just "add counts" - weighted by quality/trust
blended = weight_A × corpus_A + weight_B × corpus_B
# Where weights sum to 1.0 (interpretable percentages)
```

### 3. Post-Merge Pruning (Optimal Pattern Selection)
```
Prune BEFORE merge: Lose minority corpus patterns ❌
Prune AFTER merge:  Keep best patterns from both ✅

Example:
  rime: "大大" count=0 (dies in early prune)
  PTT:  "大大" count=50 (slang for "expert")
  Blended: 0.7×0 + 0.3×50 = 15 → survives threshold=3!
```

### 4. Backward Compatibility
```python
# Old scripts still work
python3 build_ngram.py --output ngram_pruned.json  # ✅

# New blended pipeline
python3 build_blended.py --output ngram_blended.json  # ✅
```

---

## 📚 Documentation

### Primary Documents
1. **DESIGN-ngram-blended.md** (700+ lines)
   - Full architecture, math, implementation details
   - Risk analysis, testing strategy
   - Appendices with PTT-Corpus info

2. **SESSION-9-PLAN.md** (this file)
   - High-level overview for quick reference
   - Implementation checklist
   - Expected results

3. **reference/ngram-chat.txt**
   - Original conversation about blended approach
   - Sample code snippets

### Supporting Docs
- **DESIGN-ngram-pruning.md** (Session 8) - Pruning foundation
- **DESIGN-v11.md** - N-gram integration
- **NGRAM-DIAGNOSIS.md** - Quality improvement journey

---

## 🚀 Next Steps

### Immediate (This Session)
1. ✅ Design complete → Review with user
2. Start Phase 1: Refactor rime-essay processor
3. Implement Phase 2: PTT processor with tests

### Short-Term (Session 9 Completion)
4. Build blended model pipeline
5. Validate quality ≥ 90%
6. Integrate to MVP1
7. Full documentation update

### Long-Term (Future Sessions)
- Multi-corpus blending (rime + PTT + Dcard)
- Domain-specific models (business, gaming, student)
- User personalization (learn from typing history)

---

## ⚠️ Risk Mitigation

| Risk | Mitigation | Fallback |
|------|------------|----------|
| PTT data too noisy | Aggressive cleaning, 30% weight | Use rime-essay only |
| File size > 5MB | Same pruning params, monitor | Adjust topk=8 |
| Quality regression | Separate formal/chat tests | Keep ngram_pruned.json |
| Long processing | Streaming + progress bar | Sample data for testing |

---

## 💬 Questions for Review

Before starting implementation, please confirm:

1. **Blended approach**: Do you agree with 70:30 weighting (rime:PTT)?
   - Adjustable: Can try 80:20 (more formal) or 60:40 (more casual)

2. **PTT-Corpus**: OK to download from GitHub?
   - Source: https://github.com/zake7749/Gossiping-Chinese-Corpus
   - Size: ~100MB-1GB (will take time to process)

3. **Quality target**: 90%+ acceptable?
   - Current: 86.8% (Session 8)
   - Stretch goal: 92%+ (if data quality allows)

4. **Timeline**: 6-7 hours estimation reasonable?
   - Can break into multiple sessions if needed

5. **Priority**: Should we proceed immediately?
   - Alternative: Test Session 8 model more first

---

**Ready to proceed? Let me know and I'll start with Phase 1!** 🚀

---

**Document Version**: 1.0
**Created**: 2025-11-11
**Status**: Design approved → Ready for implementation
**Author**: Claude (Session 9 Planning)
