# N-gram Pipeline Design Document

**Version**: 1.0
**Date**: 2025-11-10
**Component**: build_ngram.py - N-gram Database Builder
**Status**: Design Phase

---

## 1. Overview

### Purpose

Build an N-gram language model from the rime-essay corpus (essay.txt) to enable sentence-level prediction in WebDaYi MVP 3.0.

### Input

- **File**: `converter/raw_data/essay.txt` (~5.7MB)
- **Format**: TSV (tab-separated values)
  ```
  word/phrase<TAB>frequency

  Example:
  的時候	8901
  一個	3456
  大家	2134
  ```
- **Lines**: 442,717 entries
- **Content**: Chinese words/phrases with usage frequencies

### Output

- **File**: `mvp3-smart-engine/ngram_db.json` (~6-8MB)
- **Format**: JSON with unigram and bigram probabilities
- **Structure**:
  ```json
  {
    "unigrams": {
      "的": 0.0623,
      "一": 0.0312,
      ...
    },
    "bigrams": {
      "的時": 0.0045,
      "時候": 0.0089,
      ...
    },
    "metadata": {
      "total_chars": 6234567,
      "unique_chars": 4523,
      "total_bigrams": 1234567,
      "unique_bigrams": 234567,
      "source": "rime-essay/essay.txt",
      "generated_at": "2025-11-10T12:00:00Z",
      "version": "1.0"
    }
  }
  ```

---

## 2. Data Processing Algorithm

### Phase 1: Parse essay.txt

```python
def parse_essay_txt(filepath):
    """
    Parse essay.txt into (phrase, frequency) pairs.

    Returns:
        List[Tuple[str, int]]: [(phrase, freq), ...]
    """
    entries = []

    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            parts = line.split('\t')
            if len(parts) != 2:
                continue

            phrase, freq_str = parts

            try:
                freq = int(freq_str)
            except ValueError:
                continue

            if freq > 0:  # Only include phrases with positive frequency
                entries.append((phrase, freq))

    return entries
```

### Phase 2: Count Unigrams (Characters)

```python
def count_unigrams(entries):
    """
    Count individual character frequencies from phrases.

    Args:
        entries: List[Tuple[str, int]] - (phrase, freq) pairs

    Returns:
        Dict[str, int]: {char: total_count, ...}
    """
    unigram_counts = {}

    for phrase, freq in entries:
        for char in phrase:
            if char not in unigram_counts:
                unigram_counts[char] = 0
            unigram_counts[char] += freq

    return unigram_counts
```

**Example**:
```
Input: [("的時候", 8901), ("一個", 3456)]
Process:
  - "的時候" (freq=8901): 的+8901, 時+8901, 候+8901
  - "一個" (freq=3456): 一+3456, 個+3456
Output: {"的": 8901, "時": 8901, "候": 8901, "一": 3456, "個": 3456}
```

### Phase 3: Count Bigrams (Character Pairs)

```python
def count_bigrams(entries):
    """
    Count character pair frequencies from phrases.

    Args:
        entries: List[Tuple[str, int]] - (phrase, freq) pairs

    Returns:
        Dict[str, int]: {bigram: total_count, ...}
    """
    bigram_counts = {}

    for phrase, freq in entries:
        # Extract all bigrams from phrase
        for i in range(len(phrase) - 1):
            bigram = phrase[i:i+2]  # Two consecutive characters

            if bigram not in bigram_counts:
                bigram_counts[bigram] = 0
            bigram_counts[bigram] += freq

    return bigram_counts
```

**Example**:
```
Input: [("的時候", 8901), ("一個", 3456)]
Process:
  - "的時候" (freq=8901): 的時+8901, 時候+8901
  - "一個" (freq=3456): 一個+3456
Output: {"的時": 8901, "時候": 8901, "一個": 3456}
```

### Phase 4: Calculate Probabilities

```python
def calculate_unigram_probabilities(unigram_counts):
    """
    Convert counts to probabilities using MLE (Maximum Likelihood Estimation).

    P(char) = count(char) / total_chars

    Returns:
        Dict[str, float]: {char: probability, ...}
    """
    total_chars = sum(unigram_counts.values())

    unigram_probs = {
        char: count / total_chars
        for char, count in unigram_counts.items()
    }

    return unigram_probs

def calculate_bigram_probabilities(bigram_counts, unigram_counts):
    """
    Convert counts to conditional probabilities with Laplace smoothing.

    P(char2 | char1) = (count(char1, char2) + 1) / (count(char1) + V)

    where V = vocabulary size (number of unique characters)

    Returns:
        Dict[str, float]: {bigram: probability, ...}
    """
    V = len(unigram_counts)  # Vocabulary size

    bigram_probs = {}

    for bigram, count in bigram_counts.items():
        char1 = bigram[0]
        char1_count = unigram_counts.get(char1, 0)

        # Laplace smoothing
        prob = (count + 1) / (char1_count + V)
        bigram_probs[bigram] = prob

    return bigram_probs
```

**Why Laplace Smoothing?**
- Handles unseen bigrams (not in training data)
- Prevents zero probabilities (which would break Viterbi)
- Adds +1 to numerator, +V to denominator
- Small impact on frequent bigrams, significant for rare/unseen

### Phase 5: Generate JSON

```python
import json
from datetime import datetime

def generate_ngram_db(unigram_probs, bigram_probs, metadata):
    """
    Create the final ngram_db.json structure.

    Returns:
        dict: Complete N-gram database
    """
    return {
        "unigrams": unigram_probs,
        "bigrams": bigram_probs,
        "metadata": {
            **metadata,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "version": "1.0"
        }
    }

def write_ngram_db(ngram_db, output_path):
    """
    Write N-gram database to JSON file.
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(ngram_db, f, ensure_ascii=False, indent=2)
```

---

## 3. Command-Line Interface

### Usage

```bash
# Basic usage
python converter/build_ngram.py

# With custom input/output
python converter/build_ngram.py \
  --input converter/raw_data/essay.txt \
  --output mvp3-smart-engine/ngram_db.json

# Dry run (validation only)
python converter/build_ngram.py --dry-run

# Verbose output
python converter/build_ngram.py --verbose
```

### Arguments

```python
import argparse

def parse_args():
    parser = argparse.ArgumentParser(
        description='Build N-gram language model from rime-essay corpus'
    )

    parser.add_argument(
        '--input',
        default='converter/raw_data/essay.txt',
        help='Input essay.txt file path'
    )

    parser.add_argument(
        '--output',
        default='mvp3-smart-engine/ngram_db.json',
        help='Output ngram_db.json file path'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Parse and validate without writing output'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Print detailed progress information'
    )

    return parser.parse_args()
```

### Output Format

```
Building N-gram database from rime-essay...

[1/5] Parsing essay.txt...
  ✓ Parsed 442,717 entries
  ✓ Total phrases: 442,717
  ✓ Skipped invalid: 0

[2/5] Counting unigrams...
  ✓ Unique characters: 4,523
  ✓ Total character occurrences: 6,234,567

[3/5] Counting bigrams...
  ✓ Unique bigrams: 234,567
  ✓ Total bigram occurrences: 5,791,850

[4/5] Calculating probabilities...
  ✓ Unigram probabilities: 4,523
  ✓ Bigram probabilities: 234,567
  ✓ Smoothing: Laplace (α=1)

[5/5] Writing ngram_db.json...
  ✓ Output size: 6.8 MB
  ✓ File: mvp3-smart-engine/ngram_db.json

✓ N-gram database built successfully!

Statistics:
  - Vocabulary size: 4,523 chars
  - Unigram coverage: 99.2%
  - Bigram coverage: 87.4%
  - Top 10 chars: 的 (6.23%), 一 (3.12%), 是 (2.87%), ...
```

---

## 4. Test-Driven Development (TDD)

### Test File Structure

```
converter/
├── build_ngram.py          # Main implementation
├── build_ngram_lib.py      # Testable library functions
├── build_ngram.test.py     # Test suite
└── test-data/
    └── essay-sample.txt    # Small test data (20 lines)
```

### Test Categories

#### Category 1: Parsing (5 tests)
```python
def test_parse_valid_entries():
    """Test parsing valid TSV entries."""

def test_parse_skip_invalid_freq():
    """Test skipping entries with non-numeric frequency."""

def test_parse_skip_zero_freq():
    """Test skipping entries with zero frequency."""

def test_parse_handle_empty_lines():
    """Test handling empty lines gracefully."""

def test_parse_unicode_support():
    """Test correct handling of Chinese characters."""
```

#### Category 2: Unigram Counting (4 tests)
```python
def test_count_unigrams_basic():
    """Test basic unigram counting."""

def test_count_unigrams_accumulate():
    """Test frequency accumulation across phrases."""

def test_count_unigrams_empty():
    """Test empty input."""

def test_count_unigrams_single_char_phrases():
    """Test phrases with single character."""
```

#### Category 3: Bigram Counting (5 tests)
```python
def test_count_bigrams_basic():
    """Test basic bigram extraction."""

def test_count_bigrams_accumulate():
    """Test frequency accumulation."""

def test_count_bigrams_single_char():
    """Test phrases too short for bigrams."""

def test_count_bigrams_long_phrase():
    """Test extracting all bigrams from long phrase."""

def test_count_bigrams_overlap():
    """Test overlapping bigrams (e.g., 'abc' → 'ab', 'bc')."""
```

#### Category 4: Probability Calculation (6 tests)
```python
def test_unigram_probabilities_sum_to_one():
    """Test that all unigram probabilities sum to 1.0."""

def test_unigram_probabilities_range():
    """Test probabilities are in (0, 1] range."""

def test_bigram_probabilities_laplace_smoothing():
    """Test Laplace smoothing is applied."""

def test_bigram_probabilities_unseen():
    """Test unseen bigrams get non-zero probability."""

def test_bigram_probabilities_conditional():
    """Test P(char2|char1) calculation."""

def test_probabilities_on_known_data():
    """Test probabilities match expected values on sample data."""
```

#### Category 5: JSON Generation (3 tests)
```python
def test_json_structure():
    """Test JSON has required keys (unigrams, bigrams, metadata)."""

def test_json_serialization():
    """Test JSON can be serialized and deserialized."""

def test_json_metadata():
    """Test metadata contains expected fields."""
```

#### Category 6: Integration (2 tests)
```python
def test_end_to_end_small_corpus():
    """Test full pipeline on small test data."""

def test_end_to_end_real_corpus():
    """Test full pipeline on essay.txt (slow test)."""
```

**Total**: 25 comprehensive tests

---

## 5. Performance Considerations

### Memory Optimization

**Problem**: Loading 442K entries into memory may use significant RAM.

**Solution**: Stream processing for very large files (not needed for 5.7MB).

### Speed Optimization

**Estimated Runtime**:
- Parsing: ~2-3 seconds
- Unigram counting: ~1-2 seconds
- Bigram counting: ~2-3 seconds
- Probability calculation: ~1 second
- JSON writing: ~1-2 seconds

**Total**: ~7-11 seconds (acceptable for offline processing)

### Output Size Optimization

**Strategies**:
1. **Precision**: Limit probabilities to 6 decimal places
2. **Pruning**: Remove very low-probability bigrams (< 1e-8)
3. **Compression**: gzip the JSON file (50-70% size reduction)

```python
# Precision limiting
prob = round(count / total, 6)

# Pruning
if prob < 1e-8:
    continue  # Skip very unlikely bigrams

# Compression (for Chrome extension)
import gzip
with gzip.open('ngram_db.json.gz', 'wt', encoding='utf-8') as f:
    json.dump(ngram_db, f)
```

---

## 6. Error Handling

### Input Validation

```python
def validate_input(filepath):
    """Validate essay.txt exists and is readable."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Input file not found: {filepath}")

    if not os.path.isfile(filepath):
        raise ValueError(f"Input path is not a file: {filepath}")

    # Check if file is readable and has content
    with open(filepath, 'r', encoding='utf-8') as f:
        first_line = f.readline()
        if not first_line:
            raise ValueError("Input file is empty")
```

### Malformed Data Handling

```python
def parse_entry(line):
    """
    Parse single line with error handling.

    Returns:
        Optional[Tuple[str, int]]: (phrase, freq) or None if invalid
    """
    try:
        parts = line.split('\t')
        if len(parts) != 2:
            return None

        phrase, freq_str = parts
        freq = int(freq_str)

        if freq <= 0:
            return None

        return (phrase, freq)

    except Exception:
        return None  # Silently skip malformed lines
```

### Division by Zero Protection

```python
def safe_divide(numerator, denominator):
    """Prevent division by zero."""
    if denominator == 0:
        return 0.0
    return numerator / denominator
```

---

## 7. Output Validation

### Sanity Checks

```python
def validate_ngram_db(ngram_db):
    """
    Validate generated N-gram database.

    Raises:
        AssertionError: If validation fails
    """
    # Check structure
    assert "unigrams" in ngram_db
    assert "bigrams" in ngram_db
    assert "metadata" in ngram_db

    # Check probabilities sum to ~1.0
    unigram_sum = sum(ngram_db["unigrams"].values())
    assert 0.99 <= unigram_sum <= 1.01, \
        f"Unigram probabilities sum to {unigram_sum}, expected ~1.0"

    # Check probability ranges
    for char, prob in ngram_db["unigrams"].items():
        assert 0 < prob <= 1, f"Invalid unigram probability for '{char}': {prob}"

    for bigram, prob in ngram_db["bigrams"].items():
        assert 0 < prob <= 1, f"Invalid bigram probability for '{bigram}': {prob}"

    # Check metadata
    assert "total_chars" in ngram_db["metadata"]
    assert "unique_chars" in ngram_db["metadata"]
    assert ngram_db["metadata"]["unique_chars"] == len(ngram_db["unigrams"])
```

---

## 8. Example Usage in Viterbi

```javascript
// Load N-gram database
const ngramDb = JSON.parse(await readFile('ngram_db.json'));

// Get unigram probability
function getUnigramProb(char) {
  return ngramDb.unigrams[char] || 1e-10;  // Default for unseen
}

// Get bigram probability
function getBigramProb(char1, char2) {
  const bigram = char1 + char2;
  return ngramDb.bigrams[bigram] || 1e-10;  // Default for unseen
}

// Viterbi usage
for (const candidate of lattice[t]) {
  if (t === 0) {
    // First position: unigram
    dp[t][candidate.char] = Math.log(getUnigramProb(candidate.char));
  } else {
    // Subsequent: bigram
    for (const prevChar in dp[t-1]) {
      const prob = getBigramProb(prevChar, candidate.char);
      const score = dp[t-1][prevChar] + Math.log(prob);
      // ... max logic
    }
  }
}
```

---

## 9. Success Criteria

### Functional

- ✅ Correctly parses all 442,717 entries from essay.txt
- ✅ Generates valid JSON with unigrams and bigrams
- ✅ All 25 tests pass
- ✅ Unigram probabilities sum to 1.0 (±0.01)
- ✅ No zero probabilities (Laplace smoothing works)

### Performance

- ✅ Processing time < 15 seconds
- ✅ Output size < 10 MB (uncompressed)
- ✅ Memory usage < 500 MB during processing

### Quality

- ✅ Top 10 characters match expected Chinese frequency (的, 一, 是, ...)
- ✅ Bigrams include common sequences (的時, 時候, 一個, ...)
- ✅ Coverage: >95% of common characters, >80% of common bigrams

---

## 10. Future Enhancements (MVP 3.1+)

### Trigram Support

```json
{
  "trigrams": {
    "的時候": 0.0089,
    ...
  }
}
```

### Context-Aware Models

Different N-gram models for different domains:
- Technical writing
- Casual conversation
- News articles

### Adaptive Learning

User-specific N-gram adjustments based on typing history.

---

**Status**: Design Complete ✓
**Next**: Implement TDD test suite (25 tests)
