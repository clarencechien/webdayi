#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Raw Text Corpus Processor (Session 9 - PTT-Corpus)

This module processes raw text corpora (PTT, Dcard, chat logs) with aggressive
cleaning to extract colloquial/chat language patterns for N-gram blended models.

Key Features:
- Streaming processing (memory-efficient for GB-scale files)
- Aggressive noise removal (URLs, metadata, English, special chars)
- Colloquial pattern preservation (好ㄉ, ㄎㄎ, internet slang)

Design Document: docs/design/DESIGN-ngram-blended.md
"""

import re
from collections import defaultdict
from typing import Dict, Tuple


def clean_ptt_text(text: str) -> str:
    """
    Clean PTT post text by removing noise while preserving colloquial patterns.

    Noise to remove:
    - PTT metadata markers (※ 發信站, ◆ From)
    - URLs (https://, http://)
    - Reply headers (Re: [標題])
    - English text (we only need Chinese N-grams)
    - Special characters (except basic punctuation)

    Patterns to preserve:
    - Chinese characters (我, 你, 他, 好, 的, etc.)
    - Basic punctuation (，。！？)
    - Colloquial markers (好ㄉ, ㄎㄎ, etc.)

    Args:
        text: Raw PTT post text

    Returns:
        Cleaned text with only Chinese characters and basic punctuation

    Examples:
        >>> clean_ptt_text("這真的太神啦 https://example.com 推推推")
        '這真的太神啦 推推推'

        >>> clean_ptt_text("※ 發信站: 批踢踢實業坊(ptt.cc)")
        ''

        >>> clean_ptt_text("Re: [問卦] 這是什麼意思")
        ' 這是什麼意思'

        >>> clean_ptt_text("XDDD 超派的啦 lol")
        ' 超派的啦 '

        >>> clean_ptt_text("好ㄉ 我知道了")
        '好ㄉ 我知道了'
    """
    # Remove PTT-specific metadata markers
    # ※ 發信站: 批踢踢實業坊(ptt.cc), 來自: 123.456.789.0
    text = re.sub(r"※ .*?(\n|$)", " ", text)

    # ◆ From: 123.456.789.0
    text = re.sub(r"◆ .*?(\n|$)", " ", text)

    # Remove URLs (http://, https://)
    text = re.sub(r"https?://\S+", " ", text)

    # Remove reply headers: Re: [標題]
    text = re.sub(r"Re: \[.*?\]", " ", text)

    # Remove email addresses
    text = re.sub(r"\S+@\S+", " ", text)

    # Keep only Chinese characters + basic punctuation
    # Range: \u4e00-\u9fa5 (CJK Unified Ideographs)
    # Keep: 。 ， ！ ？ 、 （ ） 「 」 『 』 【 】
    # Keep: ㄅㄆㄇㄈ (Bopomofo, for colloquial: 好ㄉ, ㄎㄎ)
    text = re.sub(r"[^\u4e00-\u9fa5\u3100-\u312f。，！？、（）「」『』【】\s]", " ", text)

    # Normalize whitespace (multiple spaces → single space)
    text = re.sub(r"\s+", " ", text)

    # Strip leading/trailing whitespace
    text = text.strip()

    return text


def process_corpus(
    corpus_file_path: str,
    verbose: bool = False,
    progress_interval: int = 10000
) -> Tuple[Dict[str, int], Dict[str, int]]:
    """
    Process raw text corpus (PTT, Dcard, chat logs) and extract N-gram counts.

    Memory-efficient streaming processing: reads file line-by-line without
    loading entire file into memory. Suitable for GB-scale corpora.

    Args:
        corpus_file_path: Path to raw text file (one post/message per line)
        verbose: Print progress messages
        progress_interval: Report progress every N lines (default: 10,000)

    Returns:
        Tuple of (unigram_counts, bigram_counts)
        - unigram_counts: Dict[str, int] - character → count
        - bigram_counts: Dict[str, int] - bigram string → count

    Raises:
        FileNotFoundError: If corpus file doesn't exist
        IOError: If file cannot be read

    Example:
        >>> uni, bi = process_corpus('ptt_corpus.txt', verbose=True)
        [PTT] Processing ptt_corpus.txt...
        [PTT] Processed 10,000 lines (125,432 chars)...
        [PTT] Processed 20,000 lines (251,823 chars)...
        ...
        [PTT] Complete!
        [PTT] Total lines: 100,543
        [PTT] Total chars: 12,543,234
        [PTT] Unique unigrams: 5,432
        [PTT] Unique bigrams: 123,456
        >>> len(uni)
        5432
        >>> len(bi)
        123456
    """
    if verbose:
        print(f"[PTT] Processing {corpus_file_path}...")

    unigram_counts = defaultdict(int)
    bigram_counts = defaultdict(int)

    line_count = 0
    total_chars = 0
    empty_lines = 0

    try:
        with open(corpus_file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line_count += 1

                # Progress reporting
                if verbose and line_count % progress_interval == 0:
                    print(f"[PTT] Processed {line_count:,} lines "
                          f"({total_chars:,} chars)...")

                # Clean noise from line
                cleaned = clean_ptt_text(line)

                # Skip empty lines (after cleaning)
                if len(cleaned) < 2:
                    empty_lines += 1
                    continue

                # Count N-grams
                for i in range(len(cleaned)):
                    char_A = cleaned[i]

                    # Skip whitespace in N-gram counting
                    if char_A.isspace():
                        continue

                    # Count unigram
                    unigram_counts[char_A] += 1
                    total_chars += 1

                    # Count bigram (if next char exists and not whitespace)
                    if i < len(cleaned) - 1:
                        char_B = cleaned[i + 1]

                        # Skip bigrams with whitespace
                        if not char_B.isspace():
                            bigram = char_A + char_B
                            bigram_counts[bigram] += 1

    except FileNotFoundError:
        raise FileNotFoundError(f"Corpus file not found: {corpus_file_path}")
    except IOError as e:
        raise IOError(f"Error reading corpus file: {e}")

    # Convert defaultdict to dict for JSON serialization
    unigram_dict = dict(unigram_counts)
    bigram_dict = dict(bigram_counts)

    if verbose:
        print(f"[PTT] Complete!")
        print(f"[PTT] Total lines: {line_count:,}")
        print(f"[PTT] Empty lines (after cleaning): {empty_lines:,}")
        print(f"[PTT] Total chars: {total_chars:,}")
        print(f"[PTT] Unique unigrams: {len(unigram_dict):,}")
        print(f"[PTT] Unique bigrams: {len(bigram_dict):,}")

    return unigram_dict, bigram_dict


def process_corpus_sample(
    corpus_file_path: str,
    max_lines: int = 1000,
    verbose: bool = False
) -> Tuple[Dict[str, int], Dict[str, int]]:
    """
    Process only the first N lines of a corpus (for testing/sampling).

    Useful for:
    - Testing pipeline with small data
    - Quick quality checks before full processing
    - Development and debugging

    Args:
        corpus_file_path: Path to raw text file
        max_lines: Maximum number of lines to process
        verbose: Print progress messages

    Returns:
        Tuple of (unigram_counts, bigram_counts)

    Example:
        >>> uni, bi = process_corpus_sample('ptt_corpus.txt', max_lines=100)
        >>> len(uni)  # Much smaller than full corpus
        1234
    """
    if verbose:
        print(f"[PTT Sample] Processing first {max_lines:,} lines of {corpus_file_path}...")

    unigram_counts = defaultdict(int)
    bigram_counts = defaultdict(int)

    line_count = 0
    total_chars = 0

    with open(corpus_file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line_count >= max_lines:
                break

            line_count += 1

            # Clean and count (same logic as full processing)
            cleaned = clean_ptt_text(line)

            if len(cleaned) < 2:
                continue

            for i in range(len(cleaned)):
                char_A = cleaned[i]

                if char_A.isspace():
                    continue

                unigram_counts[char_A] += 1
                total_chars += 1

                if i < len(cleaned) - 1:
                    char_B = cleaned[i + 1]
                    if not char_B.isspace():
                        bigram = char_A + char_B
                        bigram_counts[bigram] += 1

    unigram_dict = dict(unigram_counts)
    bigram_dict = dict(bigram_counts)

    if verbose:
        print(f"[PTT Sample] Processed {line_count:,} lines ({total_chars:,} chars)")
        print(f"[PTT Sample] Unique unigrams: {len(unigram_dict):,}")
        print(f"[PTT Sample] Unique bigrams: {len(bigram_dict):,}")

    return unigram_dict, bigram_dict


# Main entry point for testing
if __name__ == "__main__":
    print("PTT-Corpus Raw Text Processor (Session 9)")
    print("=" * 60)
    print()
    print("This module provides functions for processing raw text corpora:")
    print("  - clean_ptt_text(text): Remove noise, keep Chinese + colloquialisms")
    print("  - process_corpus(file): Full corpus processing (streaming)")
    print("  - process_corpus_sample(file, N): Process first N lines (testing)")
    print()
    print("Usage:")
    print("  from process_raw_text import process_corpus")
    print("  uni, bi = process_corpus('ptt_corpus.txt', verbose=True)")
    print()
    print("Design: docs/design/DESIGN-ngram-blended.md")
    print("=" * 60)
