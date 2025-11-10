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
    metadata: Dict
) -> Dict:
    """
    Create the final ngram_db.json structure.

    Args:
        unigram_probs: Dictionary of unigram probabilities
        bigram_probs: Dictionary of bigram probabilities
        metadata: Metadata dictionary (total_chars, unique_chars, etc.)

    Returns:
        Complete N-gram database dictionary

    Examples:
        >>> generate_ngram_db(
        ...     {'的': 0.5, '一': 0.5},
        ...     {'的時': 0.8},
        ...     {'total_chars': 100, 'unique_chars': 2}
        ... )
        {
            'unigrams': {'的': 0.5, '一': 0.5},
            'bigrams': {'的時': 0.8},
            'metadata': {
                'total_chars': 100,
                'unique_chars': 2,
                'generated_at': '2025-11-10T...',
                'version': '1.0'
            }
        }
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
