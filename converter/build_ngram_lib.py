#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
N-gram Language Model Builder - Library Functions

This module provides testable library functions for building N-gram
language models from the rime-essay corpus.

Design Document: converter/DESIGN-ngram.md
"""

import os
import json
from datetime import datetime
from typing import List, Tuple, Dict, Optional


# ============================================================================
# Phase 1: Parsing
# ============================================================================

def parse_essay_txt(filepath: str) -> List[Tuple[str, int]]:
    """
    Parse essay.txt into (phrase, frequency) pairs.

    Args:
        filepath: Path to essay.txt file

    Returns:
        List of (phrase, frequency) tuples

    Raises:
        FileNotFoundError: If file doesn't exist
        ValueError: If file is empty or invalid
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Input file not found: {filepath}")

    if not os.path.isfile(filepath):
        raise ValueError(f"Input path is not a file: {filepath}")

    entries = []

    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            entry = parse_entry(line)
            if entry is not None:
                entries.append(entry)

    if len(entries) == 0:
        raise ValueError("No valid entries found in file")

    return entries


def parse_entry(line: str) -> Optional[Tuple[str, int]]:
    """
    Parse a single line from essay.txt.

    Format: phrase<TAB>frequency

    Args:
        line: Single line from essay.txt

    Returns:
        (phrase, frequency) tuple or None if invalid

    Examples:
        >>> parse_entry("的時候\\t8901")
        ('的時候', 8901)
        >>> parse_entry("invalid")
        None
        >>> parse_entry("零頻率\\t0")
        None
    """
    line = line.strip()

    if not line:
        return None

    parts = line.split('\t')
    if len(parts) != 2:
        return None

    phrase, freq_str = parts

    try:
        freq = int(freq_str)
    except ValueError:
        return None

    if freq <= 0:
        return None

    return (phrase, freq)


def parse_terra_pinyin_dict(filepath: str) -> List[Tuple[str, int]]:
    """
    Parse terra_pinyin.dict.yaml into (phrase, frequency) pairs.

    This format doesn't have explicit frequencies, so we assign weight=1 for all entries.
    This gives equal weight to dictionary entries, allowing N-gram to learn from
    Taiwan-localized vocabulary and phrases.

    Args:
        filepath: Path to terra_pinyin.dict.yaml file

    Returns:
        List of (phrase, frequency) tuples

    Raises:
        FileNotFoundError: If file doesn't exist
        ValueError: If file is empty or invalid

    Format:
        phrase<TAB>pinyin
        Example: "台灣\ttai2 wan1"
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Input file not found: {filepath}")

    if not os.path.isfile(filepath):
        raise ValueError(f"Input path is not a file: {filepath}")

    entries = []
    in_data_section = False

    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()

            # Skip empty lines
            if not line:
                continue

            # Skip comments
            if line.startswith('#'):
                continue

            # Detect end of YAML header (starts with "...")
            if line == '...':
                in_data_section = True
                continue

            # Skip YAML header
            if not in_data_section:
                continue

            # Parse data line: phrase<TAB>pinyin
            entry = parse_terra_pinyin_entry(line)
            if entry is not None:
                entries.append(entry)

    if len(entries) == 0:
        raise ValueError("No valid entries found in file")

    return entries


def parse_terra_pinyin_entry(line: str) -> Optional[Tuple[str, int]]:
    """
    Parse a single line from terra_pinyin.dict.yaml.

    Format: phrase<TAB>pinyin (no frequency)

    We assign frequency=1 for all entries since terra_pinyin doesn't provide
    explicit frequencies. This makes N-gram learn from phrase occurrence patterns.

    Args:
        line: Single line from terra_pinyin.dict.yaml

    Returns:
        (phrase, frequency) tuple or None if invalid

    Examples:
        >>> parse_terra_pinyin_entry("台灣\\ttai2 wan1")
        ('台灣', 1)
        >>> parse_terra_pinyin_entry("的\\tde5")
        ('的', 1)
        >>> parse_terra_pinyin_entry("invalid")
        None
    """
    if not line:
        return None

    parts = line.split('\t')
    if len(parts) < 2:  # Need at least phrase and pinyin
        return None

    phrase = parts[0].strip()
    # pinyin = parts[1].strip()  # We don't need pinyin for N-gram counting

    # Skip empty phrases
    if not phrase:
        return None

    # Assign frequency=1 for all entries (uniform weight)
    # This allows N-gram to learn from Taiwan-specific vocabulary
    return (phrase, 1)


# ============================================================================
# Phase 2: Unigram Counting
# ============================================================================

def count_unigrams(entries: List[Tuple[str, int]]) -> Dict[str, int]:
    """
    Count individual character frequencies from phrases.

    Args:
        entries: List of (phrase, frequency) pairs

    Returns:
        Dictionary mapping character to total count

    Examples:
        >>> count_unigrams([("的時候", 8901), ("一個", 3456)])
        {'的': 8901, '時': 8901, '候': 8901, '一': 3456, '個': 3456}
    """
    unigram_counts = {}

    for phrase, freq in entries:
        for char in phrase:
            if char not in unigram_counts:
                unigram_counts[char] = 0
            unigram_counts[char] += freq

    return unigram_counts


# ============================================================================
# Phase 3: Bigram Counting
# ============================================================================

def count_bigrams(entries: List[Tuple[str, int]]) -> Dict[str, int]:
    """
    Count character pair frequencies from phrases.

    Args:
        entries: List of (phrase, frequency) pairs

    Returns:
        Dictionary mapping bigram to total count

    Examples:
        >>> count_bigrams([("的時候", 8901), ("一個", 3456)])
        {'的時': 8901, '時候': 8901, '一個': 3456}
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


# ============================================================================
# Phase 4: Probability Calculation
# ============================================================================

def calculate_unigram_probabilities(unigram_counts: Dict[str, int]) -> Dict[str, float]:
    """
    Convert unigram counts to probabilities using MLE.

    P(char) = count(char) / total_chars

    Args:
        unigram_counts: Dictionary of character counts

    Returns:
        Dictionary of character probabilities

    Examples:
        >>> calculate_unigram_probabilities({'的': 100, '一': 50})
        {'的': 0.666667, '一': 0.333333}
    """
    total_chars = sum(unigram_counts.values())

    if total_chars == 0:
        return {}

    unigram_probs = {
        char: count / total_chars
        for char, count in unigram_counts.items()
    }

    return unigram_probs


def calculate_bigram_probabilities(
    bigram_counts: Dict[str, int],
    unigram_counts: Dict[str, int]
) -> Dict[str, float]:
    """
    Convert bigram counts to conditional probabilities with Laplace smoothing.

    P(char2 | char1) = (count(char1, char2) + 1) / (count(char1) + V)

    where V = vocabulary size (number of unique characters)

    Args:
        bigram_counts: Dictionary of bigram counts
        unigram_counts: Dictionary of character counts (for smoothing)

    Returns:
        Dictionary of bigram conditional probabilities

    Examples:
        >>> calculate_bigram_probabilities(
        ...     {'的時': 8901, '時候': 1523},
        ...     {'的': 8901, '時': 10424, '候': 1523}
        ... )
        {'的時': 0.749..., '時候': 0.128...}
    """
    V = len(unigram_counts)  # Vocabulary size

    bigram_probs = {}

    for bigram, count in bigram_counts.items():
        char1 = bigram[0]
        char1_count = unigram_counts.get(char1, 0)

        # Laplace smoothing: (count + 1) / (char1_count + V)
        prob = (count + 1) / (char1_count + V)
        bigram_probs[bigram] = prob

    return bigram_probs


# ============================================================================
# Phase 5: JSON Generation
# ============================================================================

def generate_ngram_db(
    unigram_probs: Dict[str, float],
    bigram_probs: Dict[str, float],
    unigram_counts: Dict[str, int],
    bigram_counts: Dict[str, int],
    metadata: Dict,
    smoothing_alpha: float = 0.1
) -> Dict:
    """
    Create the final ngram_db.json structure with Laplace smoothing parameters.

    Solution B: Adds raw counts and smoothing parameters for proper Laplace smoothing.

    Args:
        unigram_probs: Dictionary of unigram probabilities
        bigram_probs: Dictionary of bigram probabilities
        unigram_counts: Dictionary of unigram raw counts (for Laplace smoothing)
        bigram_counts: Dictionary of bigram raw counts (for Laplace smoothing)
        metadata: Metadata dictionary (total_chars, unique_chars, etc.)
        smoothing_alpha: Laplace smoothing parameter (default: 0.1)

    Returns:
        Complete N-gram database dictionary with smoothing parameters

    Examples:
        >>> generate_ngram_db(
        ...     {'的': 0.5, '一': 0.5},
        ...     {'的時': 0.8},
        ...     {'的': 100, '一': 100},
        ...     {'的時': 80},
        ...     {'total_chars': 200, 'unique_chars': 2},
        ...     0.1
        ... )
        {
            'unigrams': {'的': 0.5, '一': 0.5},
            'bigrams': {'的時': 0.8},
            'unigram_counts': {'的': 100, '一': 100},
            'bigram_counts': {'的時': 80},
            'smoothing_alpha': 0.1,
            'total_chars': 200,
            'vocab_size': 2,
            'metadata': {
                'total_chars': 200,
                'unique_chars': 2,
                'generated_at': '2025-11-10T...',
                'version': '2.0',
                'smoothing_method': 'laplace',
                'smoothing_alpha': 0.1
            }
        }
    """
    total_chars = sum(unigram_counts.values())
    vocab_size = len(unigram_counts)

    return {
        # Probabilities (for backward compatibility)
        "unigrams": unigram_probs,
        "bigrams": bigram_probs,

        # Raw counts (for Laplace smoothing in algorithm)
        "unigram_counts": unigram_counts,
        "bigram_counts": bigram_counts,

        # Laplace smoothing parameters
        "smoothing_alpha": smoothing_alpha,
        "total_chars": total_chars,
        "vocab_size": vocab_size,

        # Metadata
        "metadata": {
            **metadata,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "version": "2.0",  # Upgraded to v2.0 for Laplace smoothing support
            "smoothing_method": "laplace",
            "smoothing_alpha": smoothing_alpha
        }
    }


def write_ngram_db(ngram_db: Dict, output_path: str) -> None:
    """
    Write N-gram database to JSON file.

    Args:
        ngram_db: N-gram database dictionary
        output_path: Output file path

    Raises:
        IOError: If file cannot be written
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(ngram_db, f, ensure_ascii=False, indent=2)


# ============================================================================
# Validation
# ============================================================================

def validate_ngram_db(ngram_db: Dict) -> None:
    """
    Validate generated N-gram database.

    Checks:
    - Required keys exist (unigrams, bigrams, metadata)
    - Unigram probabilities sum to ~1.0
    - All probabilities are in (0, 1] range
    - Metadata contains required fields

    Args:
        ngram_db: N-gram database dictionary

    Raises:
        AssertionError: If validation fails
    """
    # Check structure
    assert "unigrams" in ngram_db, "Missing 'unigrams' key"
    assert "bigrams" in ngram_db, "Missing 'bigrams' key"
    assert "metadata" in ngram_db, "Missing 'metadata' key"

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
    assert "total_chars" in ngram_db["metadata"], "Missing metadata: total_chars"
    assert "unique_chars" in ngram_db["metadata"], "Missing metadata: unique_chars"
    assert ngram_db["metadata"]["unique_chars"] == len(ngram_db["unigrams"]), \
        "Metadata unique_chars doesn't match unigrams count"


# ============================================================================
# Phase 4: Pruning (N-gram Model Optimization)
# ============================================================================

def prune_bigrams_by_threshold(
    bigram_counts: Dict[str, int],
    threshold: int
) -> Dict[str, int]:
    """
    Prune bigrams with counts below threshold (Threshold Pruning).

    This removes low-frequency noise from the model. For example, if a bigram
    (A, B) appears only 1-2 times in a 6MB corpus, it's likely noise and not
    a meaningful language pattern.

    Args:
        bigram_counts: Dictionary of {(char1, char2): count}
        threshold: Minimum count to keep (e.g., 3)

    Returns:
        Pruned bigram_counts dictionary

    Example:
        >>> bigrams = {'我的': 100, '我馬': 2, '我是': 50}
        >>> prune_bigrams_by_threshold(bigrams, threshold=3)
        {'我的': 100, '我是': 50}  # '我馬' removed (count < 3)
    """
    if threshold <= 0:
        return bigram_counts.copy()

    pruned = {
        bigram: count
        for bigram, count in bigram_counts.items()
        if count >= threshold
    }

    return pruned


def prune_bigrams_by_topk(
    bigram_counts: Dict[str, int],
    topk: int
) -> Dict[str, int]:
    """
    Keep only top-K most frequent next characters for each character (Top-K Pruning).

    This is the most powerful compression technique. For each character A, we only
    keep the K most common characters that follow it. This implements the 80/20 rule:
    the top 10 next characters usually provide 90% of the prediction accuracy.

    Args:
        bigram_counts: Dictionary of {(char1, char2): count}
        topk: Number of top entries to keep per character (e.g., 10)

    Returns:
        Pruned bigram_counts dictionary

    Example:
        >>> bigrams = {
        ...     '我的': 100, '我是': 80, '我們': 60, '我在': 40,
        ...     '我有': 30, '我要': 20, '我說': 15, '我看': 10,
        ...     '我想': 8, '我去': 5, '我來': 3, '我馬': 1
        ... }
        >>> prune_bigrams_by_topk(bigrams, topk=10)
        # Returns top 10, removes '我來': 3, '我馬': 1
    """
    if topk <= 0:
        return {}

    # Group bigrams by first character
    char_to_nexts = {}
    for bigram, count in bigram_counts.items():
        if len(bigram) != 2:
            continue

        char1 = bigram[0]
        char2 = bigram[1]

        if char1 not in char_to_nexts:
            char_to_nexts[char1] = []

        char_to_nexts[char1].append((char2, count))

    # For each character, keep only top-K next characters
    pruned = {}
    for char1, nexts in char_to_nexts.items():
        # Sort by count (descending) and take top K
        sorted_nexts = sorted(nexts, key=lambda x: x[1], reverse=True)
        top_k_nexts = sorted_nexts[:topk]

        # Reconstruct bigram entries
        for char2, count in top_k_nexts:
            bigram = char1 + char2
            pruned[bigram] = count

    return pruned


def apply_pruning(
    bigram_counts: Dict[str, int],
    threshold: int = 3,
    topk: int = 10,
    verbose: bool = False
) -> Dict[str, int]:
    """
    Apply both threshold and top-K pruning to bigram counts.

    This is the main pruning function that combines both techniques:
    1. First apply threshold pruning (remove noise)
    2. Then apply top-K pruning (compress to top patterns)

    Args:
        bigram_counts: Dictionary of {(char1, char2): count}
        threshold: Minimum count to keep (default: 3)
        topk: Number of top entries per character (default: 10)
        verbose: Print pruning statistics

    Returns:
        Pruned bigram_counts dictionary

    Example:
        >>> bigrams = {...}  # 500K entries, 15MB
        >>> pruned = apply_pruning(bigrams, threshold=3, topk=10)
        >>> # Result: ~30K entries, ~500KB (90% reduction)
    """
    original_count = len(bigram_counts)

    if verbose:
        print(f"[Pruning] Original bigrams: {original_count:,}")

    # Step 1: Threshold pruning
    after_threshold = prune_bigrams_by_threshold(bigram_counts, threshold)
    threshold_count = len(after_threshold)

    if verbose:
        removed = original_count - threshold_count
        percent = (removed / original_count * 100) if original_count > 0 else 0
        print(f"[Pruning] After threshold (>={threshold}): {threshold_count:,} "
              f"(removed {removed:,}, {percent:.1f}%)")

    # Step 2: Top-K pruning
    after_topk = prune_bigrams_by_topk(after_threshold, topk)
    final_count = len(after_topk)

    if verbose:
        removed = threshold_count - final_count
        percent = (removed / threshold_count * 100) if threshold_count > 0 else 0
        print(f"[Pruning] After top-K (K={topk}): {final_count:,} "
              f"(removed {removed:,}, {percent:.1f}%)")

        total_removed = original_count - final_count
        total_percent = (total_removed / original_count * 100) if original_count > 0 else 0
        print(f"[Pruning] Total reduction: {total_removed:,} ({total_percent:.1f}%)")

    return after_topk


# ============================================================================
# Phase 6: High-Level Processing (Session 9 - For Blended Model)
# ============================================================================

def process_essay_file(
    input_file: str,
    verbose: bool = False
) -> Tuple[Dict[str, int], Dict[str, int]]:
    """
    Process rime-essay corpus file and return raw N-gram counts.

    This is a high-level function that orchestrates Phases 1-3 (parsing and counting)
    and returns raw counts BEFORE pruning and probability calculation.

    Designed for Session 9 blended model pipeline where multiple corpora need to be
    merged before pruning.

    Args:
        input_file: Path to essay.txt corpus file
        verbose: Print progress messages

    Returns:
        Tuple of (unigram_counts, bigram_counts)
        - unigram_counts: Dict[str, int] - character → count
        - bigram_counts: Dict[str, int] - bigram string → count

    Raises:
        FileNotFoundError: If input file doesn't exist
        ValueError: If file is empty or invalid

    Example:
        >>> uni, bi = process_essay_file('essay.txt', verbose=True)
        [Essay] Parsing essay.txt...
        [Essay] Parsed 442,252 entries
        [Essay] Counting unigrams...
        [Essay] Found 18,215 unique characters
        [Essay] Counting bigrams...
        [Essay] Found 279,220 unique bigrams
        >>> len(uni)
        18215
        >>> len(bi)
        279220
        >>> uni['的']
        191829476
        >>> bi['的時']
        8901
    """
    if verbose:
        print(f"[Essay] Parsing {input_file}...")

    # Phase 1: Parse entries
    entries = parse_essay_txt(input_file)

    if verbose:
        print(f"[Essay] Parsed {len(entries):,} entries")

    # Phase 2: Count unigrams
    if verbose:
        print(f"[Essay] Counting unigrams...")

    unigram_counts = count_unigrams(entries)

    if verbose:
        print(f"[Essay] Found {len(unigram_counts):,} unique characters")

    # Phase 3: Count bigrams
    if verbose:
        print(f"[Essay] Counting bigrams...")

    bigram_counts = count_bigrams(entries)

    if verbose:
        print(f"[Essay] Found {len(bigram_counts):,} unique bigrams")

    return unigram_counts, bigram_counts


# ============================================================================
# Utilities
# ============================================================================

def calculate_metadata(
    entries: List[Tuple[str, int]],
    unigram_counts: Dict[str, int],
    bigram_counts: Dict[str, int]
) -> Dict:
    """
    Calculate metadata for N-gram database.

    Args:
        entries: Original parsed entries
        unigram_counts: Unigram count dictionary
        bigram_counts: Bigram count dictionary

    Returns:
        Metadata dictionary
    """
    total_chars = sum(unigram_counts.values())
    unique_chars = len(unigram_counts)
    total_bigrams = sum(bigram_counts.values())
    unique_bigrams = len(bigram_counts)

    return {
        'total_chars': total_chars,
        'unique_chars': unique_chars,
        'total_bigrams': total_bigrams,
        'unique_bigrams': unique_bigrams,
        'source': 'rime-essay/essay.txt',
        'entries_parsed': len(entries)
    }
