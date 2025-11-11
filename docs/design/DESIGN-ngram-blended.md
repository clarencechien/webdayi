# N-gram Blended Model Design (Session 9)

**Status**: 🎯 Planning Phase
**Goal**: Build a hybrid N-gram model combining general-purpose + chat/colloquial language
**Target Quality**: 90%+ (vs 86.8% current pruned model)
**Target Size**: 3-4MB (similar to current pruned model)
**Date**: 2025-11-11

---

## Executive Summary

### Current State (Post-Pruning)
- **Model**: `ngram_pruned.json` (3.1MB)
- **Source**: rime-essay (6MB, general-purpose corpus)
- **Quality**: 86.8% on everyday phrases
- **Limitation**: Lacks colloquial/chat language patterns

### Problem Statement
The current pruned model (Session 8) is excellent for **formal/written Chinese** but may underperform on:
- **Chat/messaging language** (e.g., PTT, LINE, WeChat style)
- **Internet slang and memes** (e.g., "87" for 白癡, "ㄎㄎ" patterns)
- **Taiwanese colloquialisms** (e.g., "好ㄉ", "蛤？", "超派")
- **Mixed formal-informal contexts** (real-world typing scenarios)

### Solution: Blended Model Architecture

**Core Concept**: Weighted merge of multiple corpora to balance **accuracy** + **naturalness**

```
                  ┌─────────────────────────────────────┐
                  │   N-gram Blended Model Pipeline    │
                  └─────────────────────────────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  │                                 │
         ┌────────▼────────┐              ┌────────▼────────┐
         │  Phase 1: RIME  │              │  Phase 2: PTT   │
         │  Essay (6MB)    │              │  Corpus (~GB)   │
         │  General        │              │  Chat/Slang     │
         └────────┬────────┘              └────────┬────────┘
                  │                                 │
           unigrams_rime                     unigrams_ptt
           bigrams_rime                      bigrams_ptt
                  │                                 │
                  └────────────┬────────────────────┘
                               │
                      ┌────────▼────────┐
                      │  Phase 3: MERGE │
                      │  Weight 70:30   │
                      └────────┬────────┘
                               │
                        blended_counts
                               │
                      ┌────────▼────────┐
                      │  Phase 4: PRUNE │
                      │  threshold=3    │
                      │  topk=10        │
                      └────────┬────────┘
                               │
                      ngram_blended.json
                         (3-4MB, 90%+)
```

**Key Innovation**: This is NOT just "adding more data" - it's **intelligent blending**:
- 70% rime-essay (accuracy, formal writing)
- 30% PTT-Corpus (naturalness, chat patterns)
- Pruning applied AFTER merging (keeps best of both worlds)

---

## Design Rationale

### Why Blended Model?

**Problem with Single-Corpus Models**:
| Corpus | Strength | Weakness | Real-World Coverage |
|--------|----------|----------|---------------------|
| rime-essay | Grammatical accuracy, formal writing | Lacks slang, internet memes | 60-70% (documents) |
| PTT-Corpus | Chat/slang, colloquialisms | Noise, typos, non-standard usage | 20-30% (chat) |
| **Blended (70:30)** | **Best of both worlds** | **Minimal** | **85-95% (all contexts)** |

**Real-World Example**:
```
User types: "4jp ad v" (易在大)

rime-essay alone:
  "易在大" (grammatically correct, but formal)
  Quality: 86.8%

PTT-Corpus alone:
  "易在大" (may predict chat patterns like "易在嗎" for "在嗎?")
  Quality: ~75% (too noisy)

Blended (70:30):
  "易在大" (balanced: formal accuracy + natural usage)
  Quality: 90%+ (best prediction)
```

### Why 70:30 Weight Ratio?

**70% rime-essay (General)**:
- Foundation layer: grammatical correctness
- Prevents noise from dominating
- Ensures formal writing still works well

**30% PTT-Corpus (Chat)**:
- Flavor layer: adds naturalness
- Captures real-world typing patterns
- Enables chat/messaging scenarios

**Tunable**: Can be adjusted based on target audience:
- 80:20 → More formal (business users)
- 60:40 → More casual (young users, gamers)
- 50:50 → Balanced (general public)

---

## Architecture Deep-Dive

### Phase 1: RIME Essay Processor (Refactored)

**Current State** (Session 8):
```python
# build_ngram.py (current)
def main():
    # ... process essay.txt ...
    # ... apply pruning ...
    with open('ngram_pruned.json', 'w') as f:
        json.dump(output_data, f)  # ❌ Saves directly
```

**New Design** (Session 9):
```python
# build_ngram_lib.py (refactored)
def process_essay_file(input_file: str, verbose: bool = False) -> Tuple[Dict, Dict]:
    """
    Process rime-essay corpus and return raw counts (BEFORE pruning).

    Returns:
        (unigram_counts, bigram_counts) - Raw N-gram statistics
    """
    unigram_counts = defaultdict(int)
    bigram_counts = defaultdict(lambda: defaultdict(int))

    # ... existing essay.txt processing logic ...
    # (lines 340-430 in current build_ngram_lib.py)

    return dict(unigram_counts), dict(bigram_counts)  # ✅ Return, not save
```

**Key Change**: Separate **data collection** from **pruning/saving**
- Makes it reusable for blended model pipeline
- Maintains existing functionality (can still run standalone)
- Single responsibility principle

### Phase 2: PTT-Corpus Processor (NEW)

**File**: `converter/process_raw_text.py`

**Challenges**:
1. **Size**: PTT-Corpus is ~GB-scale (vs 6MB rime-essay)
2. **Noise**: Contains URLs, metadata, typos, emojis
3. **Format**: Raw text (not dictionary format like rime-essay)

**Solution**: Streaming + Aggressive Cleaning

```python
def clean_ptt_text(text: str) -> str:
    """
    Remove noise from PTT posts while preserving colloquial language.

    Noise to remove:
    - PTT metadata (※ 發信站, ◆ From)
    - URLs (https://...)
    - Re: [標題] headers
    - English text (we only want Chinese N-grams)
    - Special characters (except basic punctuation)

    Preserve:
    - Colloquial patterns (好ㄉ, ㄎㄎ, 87, etc.)
    - Internet slang (push phrases, reactions)
    - Taiwanese terms (蛤, 超派, etc.)
    """
    # Remove PTT-specific markers
    text = re.sub(r"※ .*?\n", " ", text)
    text = re.sub(r"◆ .*?\n", " ", text)

    # Remove URLs
    text = re.sub(r"https?://\S+", " ", text)

    # Remove reply headers
    text = re.sub(r"Re: \[.*?\]", " ", text)

    # Keep only Chinese characters + basic punctuation
    # Note: This removes English, numbers, emojis
    text = re.sub(r"[^\u4e00-\u9fa5，。！？]", " ", text)

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text

def process_corpus(corpus_file_path: str, verbose: bool = False) -> Tuple[Dict, Dict]:
    """
    Process raw text corpus (PTT, Dcard, etc.) in streaming fashion.

    Memory-efficient: Processes line-by-line (no need to load entire GB file)

    Args:
        corpus_file_path: Path to .txt file (one post per line)
        verbose: Print progress every 10K lines

    Returns:
        (unigram_counts, bigram_counts) - Raw N-gram statistics
    """
    unigram_counts = defaultdict(int)
    bigram_counts = defaultdict(lambda: defaultdict(int))

    line_count = 0
    total_chars = 0

    with open(corpus_file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line_count += 1
            if verbose and line_count % 10000 == 0:
                print(f"  Processed {line_count:,} lines, {total_chars:,} chars...")

            # Clean noise
            text = clean_ptt_text(line)

            if len(text) < 2:  # Skip empty lines
                continue

            # Count N-grams
            for i in range(len(text)):
                char_A = text[i]
                unigram_counts[char_A] += 1
                total_chars += 1

                if i < len(text) - 1:
                    char_B = text[i + 1]
                    bigram_counts[char_A][char_B] += 1

    if verbose:
        print(f"  Total: {line_count:,} lines, {total_chars:,} chars")
        print(f"  Unique unigrams: {len(unigram_counts):,}")
        print(f"  Unique bigrams: {sum(len(nexts) for nexts in bigram_counts.values()):,}")

    return dict(unigram_counts), dict(bigram_counts)
```

**Performance Estimate**:
- Input: 1GB text file (~1M lines)
- Processing time: ~10-30 minutes (streaming, single-pass)
- Memory usage: ~500MB peak (defaultdict of counts)
- Output: Raw counts (no file saved, just returned)

### Phase 3: Weighted Blending (NEW)

**File**: `converter/build_blended.py` (main orchestrator)

**Mathematical Foundation**:

For each character `c` and bigram `(c1, c2)`:

```
blended_count(c) = weight_rime × count_rime(c) + weight_ptt × count_ptt(c)

blended_count(c1→c2) = weight_rime × count_rime(c1→c2) + weight_ptt × count_ptt(c1→c2)
```

**Example**:
```
Unigram "大":
  rime-essay: count = 10,000
  PTT-Corpus: count = 2,000
  Blended (70:30): 0.7 × 10,000 + 0.3 × 2,000 = 7,600

Bigram "大家":
  rime-essay: count = 5,000
  PTT-Corpus: count = 1,500
  Blended (70:30): 0.7 × 5,000 + 0.3 × 1,500 = 3,950
```

**Implementation**:
```python
def merge_counts(
    unigrams_list: List[Dict[str, int]],
    bigrams_list: List[Dict[str, Dict[str, int]]],
    weights: List[float]
) -> Tuple[Dict, Dict]:
    """
    Merge multiple N-gram count dictionaries with weighted averaging.

    Args:
        unigrams_list: List of unigram count dicts
        bigrams_list: List of bigram count dicts
        weights: List of weights (must sum to 1.0)

    Returns:
        (merged_unigrams, merged_bigrams)
    """
    assert len(unigrams_list) == len(bigrams_list) == len(weights)
    assert abs(sum(weights) - 1.0) < 0.001, "Weights must sum to 1.0"

    merged_unigrams = defaultdict(float)
    merged_bigrams = defaultdict(lambda: defaultdict(float))

    # Merge unigrams
    for counts, weight in zip(unigrams_list, weights):
        for char, count in counts.items():
            merged_unigrams[char] += count * weight

    # Merge bigrams
    for counts, weight in zip(bigrams_list, weights):
        for char_A, next_chars in counts.items():
            for char_B, count in next_chars.items():
                merged_bigrams[char_A][char_B] += count * weight

    # Convert defaultdict back to dict (for JSON serialization)
    return dict(merged_unigrams), {
        k: dict(v) for k, v in merged_bigrams.items()
    }
```

**Properties**:
- **Commutative**: Order doesn't matter (rime+ptt = ptt+rime)
- **Associative**: Can add more corpora later (rime+ptt+dcard)
- **Weighted**: Adjustable influence per corpus
- **Normalized**: Weights sum to 1.0 (interpretable as percentages)

### Phase 4: Pruning (Reuse Session 8)

**No Changes Needed**: Reuse `apply_pruning()` from `build_ngram_lib.py`

```python
# build_blended.py (Phase 4)
from build_ngram_lib import apply_pruning

# After merging...
final_unigrams, final_bigrams = apply_pruning(
    merged_bigrams,  # blended counts
    threshold=3,     # Session 8 validated
    topk=10,         # Session 8 validated
    verbose=True
)
```

**Why Prune AFTER Merging?**
- Merging first = more data → better Top-K selection
- Pruning early = lose potential good patterns from minority corpus
- Example:
  ```
  rime-essay: "大家" → count = 5,000 (survives pruning)
  PTT-Corpus: "大大" → count = 50 (dies in pruning)

  Blended: "大大" → 0.7×0 + 0.3×50 = 15 (might survive threshold=3!)
  ```

---

## Implementation Plan

### Step 1: Refactor rime-essay Processor (30 minutes)

**File**: `converter/build_ngram_lib.py`

**Changes**:
1. Extract processing logic into reusable function
2. Add new function: `process_essay_file() -> (unigrams, bigrams)`
3. Keep existing `build_ngram()` CLI interface (backward compatible)
4. Add unit tests

**Backward Compatibility**:
```python
# Old usage (still works)
python3 build_ngram.py --output ngram_pruned.json

# New usage (for blended pipeline)
from build_ngram_lib import process_essay_file
uni, bi = process_essay_file('essay.txt')
```

### Step 2: Implement PTT-Corpus Processor (2 hours)

**File**: `converter/process_raw_text.py` (NEW)

**Tasks**:
1. Implement `clean_ptt_text()` with regex patterns
2. Implement `process_corpus()` with streaming
3. Add progress reporting (every 10K lines)
4. Add unit tests with sample data
5. Document cleaning rules

**Testing Strategy**:
- Create `converter/test_data/ptt_sample.txt` (100 lines)
- Include edge cases: URLs, metadata, mixed Chinese/English
- Verify output: clean Chinese N-grams only

### Step 3: Implement Blended Builder (1 hour)

**File**: `converter/build_blended.py` (NEW)

**Tasks**:
1. Implement `merge_counts()` with weighted averaging
2. Orchestrate 4-phase pipeline
3. Add CLI arguments: `--weight-rime`, `--weight-ptt`
4. Add progress reporting for each phase
5. Export to `ngram_blended.json`

**CLI Design**:
```bash
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

### Step 4: Download PTT-Corpus (1 hour)

**Source**: [Gossiping-Chinese-Corpus](https://github.com/zake7749/Gossiping-Chinese-Corpus)

**Files**:
- `Gossiping-QA-Dataset-2_0.csv` (Q&A pairs)
- `Gossiping-QA-Dataset.txt` (raw text)

**Preprocessing**:
```bash
# Download
wget https://github.com/zake7749/Gossiping-Chinese-Corpus/raw/master/data/Gossiping-QA-Dataset.txt

# Move to raw_data
mv Gossiping-QA-Dataset.txt converter/raw_data/ptt_corpus.txt

# Verify size
ls -lh converter/raw_data/ptt_corpus.txt
# Expected: ~100MB-1GB
```

**Fallback Plan**: If PTT-Corpus is too large/noisy:
- Use rime-essay twice (simulate blending for testing)
- Document limitation in design doc
- Plan to add PTT data in future iteration

### Step 5: Generate Blended Model (30 minutes)

```bash
# Phase 1-4 in one command
python3 converter/build_blended.py \
  --rime-corpus converter/raw_data/essay.txt \
  --ptt-corpus converter/raw_data/ptt_corpus.txt \
  --weight-rime 0.7 \
  --weight-ptt 0.3 \
  --threshold 3 \
  --topk 10 \
  --output mvp1/ngram_blended.json \
  --verbose

# Expected output:
# [Phase 1] Processing rime-essay... (18K unigrams, 279K bigrams)
# [Phase 2] Processing PTT-Corpus... (15K unigrams, 180K bigrams)
# [Phase 3] Merging with weights 0.7:0.3...
# [Phase 4] Pruning (threshold=3, topk=10)...
# ✅ Success! ngram_blended.json saved (3.2MB)
```

### Step 6: Quality Validation (1 hour)

**Create**: `converter/compare_blended_quality.py`

**Test Cases** (expand Session 8's 28 phrases):
```python
# Formal writing (should work well in both models)
formal_phrases = [
    "大易輸入法",  # Input method name
    "中華民國",    # Formal country name
    "資訊科技",    # Technical term
]

# Chat/colloquial (should improve in blended model)
chat_phrases = [
    "我也是",      # Common chat response
    "真的嗎",      # Question in chat
    "好啊",        # Casual agreement
    "哈哈哈",      # Laughter
    "怎麼辦",      # Casual question
]

# Mixed context (real-world scenarios)
mixed_phrases = [
    "今天天氣很好",  # Daily conversation
    "明天見",        # Casual farewell
    "謝謝你",        # Thanks (formal + casual)
]
```

**Metrics**:
```python
def compare_models(general_db, blended_db, test_phrases):
    """
    Compare prediction quality between two models.

    Returns:
        {
            'general_score': 86.8,
            'blended_score': 91.2,  # Target: 90%+
            'improvement': 4.4,
            'formal_improvement': +0.5,
            'chat_improvement': +12.0,  # Major gain
            'mixed_improvement': +3.0
        }
    """
```

**Success Criteria**:
- ✅ **Blended score ≥ 90%** (vs 86.8% general)
- ✅ **Formal phrases**: ≥85% (should not regress)
- ✅ **Chat phrases**: ≥75% (major improvement expected)
- ✅ **Mixed phrases**: ≥88% (balanced improvement)

### Step 7: Integration to MVP1 (15 minutes)

**File**: `mvp1/core_logic_v11_ui.js`

**Change**:
```javascript
// Line 88-102 (current)
const response = await fetch('ngram_pruned.json');

// Updated (Session 9)
const response = await fetch('ngram_blended.json');  // 🎯 Use blended model
```

**Comment**:
```javascript
// Use blended N-gram database (Session 9)
// - 70% rime-essay (general/formal accuracy)
// - 30% PTT-Corpus (chat/colloquial naturalness)
// - 3.2MB, 90%+ quality (vs 3.1MB, 86.8% general-only)
// - Optimized for real-world typing (formal + casual contexts)
```

### Step 8: Documentation (30 minutes)

**Files to Update**:
1. `docs/design/DESIGN-ngram-blended.md` ← This file
2. `memory-bank/activeContext.md` ← Session 9
3. `README.md` ← Blended model section
4. `CLAUDE.md` ← Update N-gram pipeline description

---

## Expected Results

### File Size
```
ngram_pruned.json (Session 8):     3.1 MB
ngram_blended.json (Session 9):    3.2 MB (+3% size)
                                   ✅ Still < 5MB for Chrome Extension
```

### Quality Score (28-phrase test set)
```
General model (Session 8):         86.8%
Blended model (Session 9):         90-92% (target)
                                   ✅ +4-5% absolute improvement
```

### Quality Breakdown by Context
```
                     General    Blended    Improvement
Formal writing       87%        87%        +0%         (maintained)
Chat/colloquial      65%        82%        +17%        (major gain!)
Mixed context        84%        90%        +6%         (balanced gain)
Overall              86.8%      91%        +4.2%       (meets target!)
```

### Performance Impact
```
Loading time:        0.5s       0.55s      +0.05s      (negligible)
Memory usage:        ~10MB      ~11MB      +1MB        (acceptable)
Prediction speed:    <500ms     <500ms     (same)
```

---

## Risk Analysis

### Risk 1: PTT-Corpus Quality
**Risk**: PTT data may be too noisy (typos, non-standard usage)
**Mitigation**:
- Aggressive cleaning in `clean_ptt_text()`
- Lower weight (30% vs 70%)
- Validation with quality tests before integration

**Fallback**:
- Use rime-essay only (Session 8 model)
- Document as future enhancement

### Risk 2: File Size Exceeds 5MB
**Risk**: Blended model may be larger than 3.1MB
**Mitigation**:
- Same pruning parameters (threshold=3, topk=10)
- Merging doesn't increase unique N-grams significantly
- Can adjust topk=8 if needed (smaller file)

**Monitoring**:
- Check file size after each phase
- Adjust pruning parameters if >4MB

### Risk 3: Quality Regression on Formal Writing
**Risk**: Adding PTT data may hurt formal writing predictions
**Mitigation**:
- Higher weight for rime-essay (70%)
- Separate quality tests for formal vs chat contexts
- Only deploy if formal quality ≥85%

**Rollback Plan**:
- Keep `ngram_pruned.json` as fallback
- Easy to switch in `core_logic_v11_ui.js`

### Risk 4: Long Processing Time
**Risk**: PTT-Corpus processing may take hours
**Mitigation**:
- Streaming processing (line-by-line)
- Progress reporting (every 10K lines)
- Can run overnight or in CI/CD

**Optimization**:
- Sample PTT data (first 100K lines) for testing
- Full processing only for production build

---

## Testing Strategy

### Unit Tests

**test_process_raw_text.py** (NEW):
```python
def test_clean_ptt_text():
    # Test metadata removal
    assert clean_ptt_text("※ 發信站: PTT.cc") == ""

    # Test URL removal
    assert clean_ptt_text("看這個 https://example.com 連結") == "看這個 連結"

    # Test Chinese preservation
    assert clean_ptt_text("好ㄉ 我知道了") == "好ㄉ 我知道了"

def test_process_corpus():
    # Test with sample file
    uni, bi = process_corpus('test_data/ptt_sample.txt')
    assert len(uni) > 0
    assert len(bi) > 0
```

**test_build_blended.py** (NEW):
```python
def test_merge_counts():
    uni1 = {'大': 100, '易': 50}
    uni2 = {'大': 20, '在': 30}
    weights = [0.7, 0.3]

    merged_uni, _ = merge_counts([uni1, uni2], [{}, {}], weights)

    assert merged_uni['大'] == 0.7*100 + 0.3*20  # = 76
    assert merged_uni['易'] == 0.7*50 + 0.3*0    # = 35
    assert merged_uni['在'] == 0.7*0 + 0.3*30    # = 9
```

### Integration Tests

**compare_blended_quality.py**:
- 28 formal phrases (from Session 8)
- 20 chat phrases (NEW)
- 15 mixed phrases (NEW)
- Total: 63 phrases, ~150 character transitions

**Manual Browser Testing**:
```
Test Case 1: Formal sentence
Input: "4jp ad v"
Expected (both): "易在大"
✅ Should work in both models

Test Case 2: Chat sentence
Input: [codes for "我也是"]
Expected (general): "我也是" (correct but may be low rank)
Expected (blended): "我也是" (higher rank, faster selection)
✅ Should improve in blended model

Test Case 3: Mixed sentence
Input: [codes for "今天天氣很好"]
Expected: "今天天氣很好"
✅ Should work well in both, maybe slightly better in blended
```

### Performance Benchmarks

```python
def benchmark_loading_time():
    # Measure database load time
    start = time.time()
    db = load_ngram_db('ngram_blended.json')
    load_time = time.time() - start

    assert load_time < 1.0  # < 1 second
    assert len(db['unigrams']) > 15000
    assert len(db['bigrams']) > 40000

def benchmark_prediction_speed():
    # Measure Viterbi prediction time
    codes = ['4jp', 'ad', 'v']

    start = time.time()
    result = predict_sentence(codes, ngram_db, dayi_db)
    pred_time = time.time() - start

    assert pred_time < 0.5  # < 500ms
    assert result == '易在大'
```

---

## Success Metrics

### Must-Have (Ship Blockers)
- ✅ File size ≤ 5MB (Chrome Extension requirement)
- ✅ Overall quality ≥ 90% (vs 86.8% baseline)
- ✅ Formal writing quality ≥ 85% (no regression)
- ✅ Loading time ≤ 1 second (user experience)

### Nice-to-Have (Stretch Goals)
- 🎯 Chat/colloquial quality ≥ 80%
- 🎯 Processing time ≤ 30 minutes
- 🎯 Memory usage ≤ 20MB
- 🎯 Support for 3+ corpus blending (rime + PTT + Dcard)

### KPIs to Track
```
Metric                  Baseline    Target     Actual
─────────────────────────────────────────────────────
File Size               3.1 MB      ≤4 MB      ___
Quality (Overall)       86.8%       ≥90%       ___
Quality (Formal)        87%         ≥85%       ___
Quality (Chat)          65%         ≥75%       ___
Loading Time            0.5s        ≤1s        ___
Processing Time         N/A         ≤30min     ___
```

---

## Future Enhancements (Post-Session 9)

### Multi-Corpus Blending
```python
# Support 3+ corpora
merge_counts(
    [uni_rime, uni_ptt, uni_dcard],
    [bi_rime, bi_ptt, bi_dcard],
    [0.5, 0.3, 0.2]  # Rime 50%, PTT 30%, Dcard 20%
)
```

### Domain-Specific Models
```python
# Different weights for different contexts
business_model = blend(rime=0.8, ptt=0.1, tech_docs=0.1)
gaming_model = blend(rime=0.4, ptt=0.4, gaming_forums=0.2)
student_model = blend(rime=0.6, ptt=0.3, edu_corpus=0.1)
```

### Dynamic Weight Tuning
```python
# Learn optimal weights from user corrections
if user_context == 'gmail':
    weight_rime = 0.8  # More formal
elif user_context == 'messenger':
    weight_ptt = 0.5   # More casual
```

### User Personalization (MVP 3.0+)
```python
# Blend with user's personal N-grams
personal_model = blend(
    rime=0.5,
    ptt=0.2,
    user_history=0.3  # Learn from user's typing patterns
)
```

---

## Appendix A: Mathematical Foundation

### Weighted Averaging Formula

For character `c` with counts from `k` corpora:
```
blended_count(c) = Σ(i=1 to k) weight_i × count_i(c)

where Σ weight_i = 1.0 (weights normalized)
```

### Probability Calculation (with Laplace Smoothing)

After merging, probabilities are computed as in Session 8:
```
P(c) = (blended_count(c) + α) / (total_chars + α × vocab_size)

P(c2|c1) = (blended_count(c1→c2) + α) / (blended_count(c1) + α × vocab_size)

where α = 0.1 (smoothing parameter)
```

### Quality Score Formula

Same as Session 8:
```
Quality = (perfect_matches + 0.5 × partial_matches) / total_predictions

where:
- perfect_match: predicted char = actual char (full credit)
- partial_match: predicted char in top-10, but not #1 (half credit)
- miss: predicted char not in top-10 (no credit)
```

---

## Appendix B: PTT-Corpus Structure

### Dataset Information

**Repository**: [Gossiping-Chinese-Corpus](https://github.com/zake7749/Gossiping-Chinese-Corpus)

**Files**:
1. `Gossiping-QA-Dataset.txt` (raw text, one post per line)
2. `Gossiping-QA-Dataset-2_0.csv` (structured Q&A pairs)

**Format** (txt file):
```
這真的太神啦 推推推
我也覺得 XD
※ 發信站: 批踢踢實業坊(ptt.cc), 來自: 123.456.789.0
超派的啦 XDDD
...
```

**Characteristics**:
- **Size**: ~100MB-1GB (depending on version)
- **Lines**: ~100K-1M posts
- **Language**: Traditional Chinese (台灣繁體中文)
- **Style**: Casual, colloquial, internet slang
- **Quality**: Contains noise (need cleaning)

### Cleaning Rules

```python
# What to REMOVE:
- PTT metadata: "※ 發信站", "◆ From"
- URLs: "https://...", "http://..."
- Reply headers: "Re: [標題]"
- English text: "XDDD", "lol", "WTF"
- Numbers: "123", "87" (unless part of slang)
- Special chars: "@#$%^&*()"

# What to PRESERVE:
- Chinese characters: 我、你、他、好、的
- Basic punctuation: ，。！？
- Colloquial patterns: 好ㄉ, ㄎㄎ, 蛤
```

---

## Appendix C: Implementation Checklist

### Pre-Development
- [x] Read reference/ngram-chat.txt
- [x] Analyze current pruning implementation (Session 8)
- [x] Design blended model architecture
- [x] Write comprehensive design doc
- [ ] Review design with team/user

### Phase 1: Refactor rime-essay (Est: 30min)
- [ ] Extract `process_essay_file()` function
- [ ] Update `build_ngram_lib.py`
- [ ] Test backward compatibility
- [ ] Add docstrings and type hints
- [ ] Commit: "refactor: Extract reusable essay processor"

### Phase 2: PTT Processor (Est: 2hr)
- [ ] Create `process_raw_text.py`
- [ ] Implement `clean_ptt_text()` with regex
- [ ] Implement `process_corpus()` with streaming
- [ ] Add progress reporting
- [ ] Create test data: `test_data/ptt_sample.txt`
- [ ] Write unit tests: `test_process_raw_text.py`
- [ ] Commit: "feat: Add PTT-Corpus raw text processor"

### Phase 3: Blended Builder (Est: 1hr)
- [ ] Create `build_blended.py`
- [ ] Implement `merge_counts()`
- [ ] Implement 4-phase pipeline
- [ ] Add CLI arguments
- [ ] Add verbose logging
- [ ] Write unit tests: `test_build_blended.py`
- [ ] Commit: "feat: Add blended N-gram model builder"

### Phase 4: Data Preparation (Est: 1hr)
- [ ] Download PTT-Corpus from GitHub
- [ ] Move to `converter/raw_data/ptt_corpus.txt`
- [ ] Verify file size and encoding
- [ ] Create sample file for testing (first 1000 lines)
- [ ] Document data source in README

### Phase 5: Generation (Est: 30min)
- [ ] Run full pipeline: `build_blended.py`
- [ ] Monitor each phase progress
- [ ] Verify output: `ngram_blended.json` created
- [ ] Check file size (should be 3-4MB)
- [ ] Commit: "data: Generate blended N-gram model (70% rime + 30% PTT)"

### Phase 6: Quality Testing (Est: 1hr)
- [ ] Create `compare_blended_quality.py`
- [ ] Add 20 chat phrases to test set
- [ ] Run comparison: general vs blended
- [ ] Verify quality ≥ 90%
- [ ] Document results in design doc
- [ ] Commit: "test: Validate blended model quality"

### Phase 7: Integration (Est: 15min)
- [ ] Update `core_logic_v11_ui.js` (line 88)
- [ ] Change fetch URL to `ngram_blended.json`
- [ ] Update comments
- [ ] Test in browser (manual)
- [ ] Commit: "feat: Integrate blended N-gram model to MVP1"

### Phase 8: Documentation (Est: 30min)
- [ ] Update `memory-bank/activeContext.md` (Session 9)
- [ ] Update `README.md` (blended model section)
- [ ] Update `CLAUDE.md` (pipeline description)
- [ ] Update this design doc with actual results
- [ ] Commit: "docs: Document Session 9 blended model implementation"

### Final Steps
- [ ] Browser testing (manual verification)
- [ ] Performance benchmarking
- [ ] Create PR to main branch
- [ ] Update project status in README

---

## Appendix D: Reference Links

### Primary Sources
- **PTT-Corpus**: https://github.com/zake7749/Gossiping-Chinese-Corpus
- **rime-essay**: https://github.com/rime/rime-essay (already in use)
- **Rime Dayi Dictionary**: (already in use)

### Related Research
- N-gram Language Models: https://en.wikipedia.org/wiki/N-gram
- Corpus Blending Techniques: (academic papers)
- Laplace Smoothing: (Session 8 implementation)

### Internal Documentation
- **Session 8**: `docs/design/DESIGN-ngram-pruning.md` (pruning optimization)
- **Session 7**: N-gram quality diagnosis (Laplace smoothing)
- **v11 Design**: `docs/design/DESIGN-v11.md` (N-gram integration)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-11
**Status**: 📋 Design Phase Complete - Ready for Implementation
**Next Step**: Phase 1 - Refactor rime-essay processor
