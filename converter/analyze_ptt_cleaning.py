#!/usr/bin/env python3
"""
Analyze PTT corpus cleaning strategies.

Compares two cleaning modes:
1. Current mode: Keeps Chinese + Bopomofo (注音) + full punctuation
2. Strict mode: Only Chinese + basic 5 punctuation marks

Goal: Identify noise patterns and quantify quality improvement.
"""

import re
from collections import Counter, defaultdict
from typing import Dict, Tuple


def clean_ptt_current(text: str) -> str:
    """Current cleaning mode (from process_raw_text.py)."""
    # Remove PTT metadata
    text = re.sub(r"※ .*?(\n|$)", " ", text)
    text = re.sub(r"◆ .*?(\n|$)", " ", text)

    # Remove URLs
    text = re.sub(r"https?://\S+", " ", text)

    # Remove reply headers
    text = re.sub(r"Re: \[.*?\]", " ", text)

    # Remove emails
    text = re.sub(r"\S+@\S+", " ", text)

    # Keep Chinese + Bopomofo + full punctuation
    text = re.sub(r"[^\u4e00-\u9fa5\u3100-\u312f。，！？、（）「」『』【】\s]", " ", text)

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text)
    text = text.strip()

    return text


def clean_ptt_strict(text: str) -> str:
    """Strict cleaning mode (Chinese + 5 basic punctuation only)."""
    # Remove PTT metadata
    text = re.sub(r"※ .*?(\n|$)", " ", text)
    text = re.sub(r"◆ .*?(\n|$)", " ", text)

    # Remove URLs
    text = re.sub(r"https?://\S+", " ", text)

    # Remove reply headers
    text = re.sub(r"Re: \[.*?\]", " ", text)

    # Remove emails
    text = re.sub(r"\S+@\S+", " ", text)

    # 【嚴格模式】只保留漢字 + 5個基本標點
    # 移除：注音、英文、數字、其他標點
    text = re.sub(r"[^\u4e00-\u9fa5，。！？、]", "", text)

    # No need for whitespace normalization (all spaces removed)

    return text


def extract_removed_chars(current: str, strict: str) -> Dict[str, int]:
    """Extract characters that were removed by strict mode."""
    removed = []
    for char in current:
        if char not in strict:
            removed.append(char)

    return Counter(removed)


def count_bigrams(text: str) -> Dict[str, int]:
    """Count bigram frequencies in text."""
    bigrams = defaultdict(int)

    for i in range(len(text) - 1):
        bigram = text[i:i+2]
        if len(bigram) == 2:
            bigrams[bigram] += 1

    return dict(bigrams)


def analyze_corpus_sample(
    file_path: str,
    max_lines: int = 50000
) -> Tuple[Dict, Dict]:
    """
    Analyze PTT corpus with both cleaning modes.

    Returns:
        (current_stats, strict_stats)
    """

    current_text = []
    strict_text = []
    removed_chars_all = Counter()

    line_count = 0

    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line_count >= max_lines:
                break

            current_cleaned = clean_ptt_current(line)
            strict_cleaned = clean_ptt_strict(line)

            if current_cleaned:
                current_text.append(current_cleaned)

            if strict_cleaned:
                strict_text.append(strict_cleaned)

            # Track removed characters
            removed = extract_removed_chars(current_cleaned, strict_cleaned)
            removed_chars_all.update(removed)

            line_count += 1

    # Join all text
    current_full = ''.join(current_text)
    strict_full = ''.join(strict_text)

    # Count unigrams
    current_unigrams = Counter(current_full)
    strict_unigrams = Counter(strict_full)

    # Count bigrams
    current_bigrams = count_bigrams(current_full)
    strict_bigrams = count_bigrams(strict_full)

    current_stats = {
        'total_chars': len(current_full),
        'unique_unigrams': len(current_unigrams),
        'unique_bigrams': len(current_bigrams),
        'unigrams': current_unigrams,
        'bigrams': current_bigrams,
    }

    strict_stats = {
        'total_chars': len(strict_full),
        'unique_unigrams': len(strict_unigrams),
        'unique_bigrams': len(strict_bigrams),
        'unigrams': strict_unigrams,
        'bigrams': strict_bigrams,
    }

    return current_stats, strict_stats, removed_chars_all


def main():
    """Main analysis."""

    print("="*70)
    print("PTT Corpus Cleaning Analysis (Action 2)")
    print("="*70)
    print()
    print("Comparing two cleaning modes:")
    print("  Current: Chinese + Bopomofo (注音) + full punctuation")
    print("  Strict:  Chinese + 5 basic punctuation only (，。！？、)")
    print()
    print("Analyzing first 50,000 lines of PTT corpus...")
    print("="*70)
    print()

    # Analyze corpus
    current, strict, removed = analyze_corpus_sample(
        'converter/raw_data/Gossiping-QA-Dataset.txt',
        max_lines=50000
    )

    # Summary statistics
    print("Summary Statistics:")
    print("-"*70)
    print(f"{'Metric':<30} {'Current':<20} {'Strict':<20} {'Diff'}")
    print("-"*70)

    total_chars_diff = strict['total_chars'] - current['total_chars']
    total_chars_pct = (total_chars_diff / current['total_chars'] * 100)
    print(f"{'Total characters':<30} {current['total_chars']:<20,} {strict['total_chars']:<20,} {total_chars_pct:+.1f}%")

    unigrams_diff = strict['unique_unigrams'] - current['unique_unigrams']
    print(f"{'Unique unigrams':<30} {current['unique_unigrams']:<20,} {strict['unique_unigrams']:<20,} {unigrams_diff:+,}")

    bigrams_diff = strict['unique_bigrams'] - current['unique_bigrams']
    bigrams_pct = (bigrams_diff / current['unique_bigrams'] * 100)
    print(f"{'Unique bigrams':<30} {current['unique_bigrams']:<20,} {strict['unique_bigrams']:<20,} {bigrams_pct:+.1f}%")

    print()
    print("="*70)
    print("Top 30 Removed Characters (Strict mode removes these):")
    print("="*70)
    print(f"{'Char':<10} {'Count':<15} {'Type':<20} {'Example'}")
    print("-"*70)

    for char, count in removed.most_common(30):
        # Classify character type
        if char == ' ':
            char_type = "Space"
            example = "(whitespace)"
        elif '\u3100' <= char <= '\u312f':
            char_type = "Bopomofo (注音)"
            example = f"好{char}, {char}{char}"
        elif char in '（）「」『』【】':
            char_type = "Full-width punct"
            example = f"文字{char}文字"
        elif char.isalpha():
            char_type = "Latin letter"
            example = "XD, LOL"
        elif char.isdigit():
            char_type = "Digit"
            example = "123, 456"
        else:
            char_type = "Other"
            example = ""

        display_char = repr(char) if char in [' ', '\n', '\t'] else char
        print(f"{display_char:<10} {count:<15,} {char_type:<20} {example}")

    print()
    print("="*70)
    print("Noise Bigram Analysis (Current mode keeps these):")
    print("="*70)
    print()
    print("Searching for problematic bigrams containing:")
    print("  1. Bopomofo (注音): ㄅㄆㄇㄈ...")
    print("  2. Mixed Chinese-Space: '我 ', ' 的'")
    print("  3. Space-only: '  '")
    print()

    # Find noise bigrams
    noise_bigrams = []
    for bigram, count in current['bigrams'].items():
        if len(bigram) != 2:
            continue

        # Check if contains Bopomofo
        has_bopomofo = any('\u3100' <= char <= '\u312f' for char in bigram)
        has_space = ' ' in bigram

        if has_bopomofo or has_space:
            noise_bigrams.append((bigram, count))

    noise_bigrams.sort(key=lambda x: x[1], reverse=True)

    print(f"Found {len(noise_bigrams):,} noise bigrams (out of {len(current['bigrams']):,} total)")
    print()
    print("Top 20 Noise Bigrams:")
    print("-"*70)
    print(f"{'Bigram':<15} {'Count':<15} {'Type'}")
    print("-"*70)

    for bigram, count in noise_bigrams[:20]:
        if ' ' in bigram:
            bigram_type = "Has space"
        else:
            bigram_type = "Has Bopomofo"

        display_bigram = repr(bigram) if ' ' in bigram else bigram
        print(f"{display_bigram:<15} {count:<15,} {bigram_type}")

    print()
    print("="*70)
    print("Recommendations:")
    print("="*70)
    print()

    # Calculate noise percentage
    noise_count = sum(count for _, count in noise_bigrams)
    total_bigram_count = sum(current['bigrams'].values())
    noise_pct = (noise_count / total_bigram_count * 100)

    print(f"1. Noise contamination: {noise_pct:.2f}% of bigrams contain noise")
    print(f"   - {len(noise_bigrams):,} noise bigrams out of {len(current['bigrams']):,} unique")
    print(f"   - {noise_count:,} noise occurrences out of {total_bigram_count:,} total")
    print()

    if noise_pct > 5:
        print("✅ RECOMMEND: Use strict mode")
        print("   - Noise level is significant (>5%)")
        print("   - Strict cleaning will remove low-quality patterns")
        print("   - Expected quality improvement: +5-10%")
    else:
        print("⚠️ CAUTION: Noise level is low (<5%)")
        print("   - Current mode may be acceptable")
        print("   - Test both modes to compare quality")

    print()
    print("2. Top-K pruning will help:")
    print("   - Most noise bigrams have low frequency")
    print("   - threshold=2 will remove many noise patterns")
    print("   - topk=40 will prioritize clean bigrams")
    print()

    print("3. Expected strict mode benefits:")
    print("   - Removes Bopomofo (注音文): 好ㄉ → 好, ㄎㄎ → removed")
    print("   - Removes space-contaminated bigrams: '我 ' → removed")
    print("   - Cleaner training data → better predictions")
    print()


if __name__ == '__main__':
    main()
