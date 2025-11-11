#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
N-gram Quality Comparison Tool

This script compares prediction quality between original and pruned N-gram databases.
It tests with common Chinese phrases to validate the 80/20 rule: pruned model should
maintain 80-90% accuracy for everyday usage.

Usage:
    python compare_ngram_quality.py
    python compare_ngram_quality.py --original mvp1/ngram_db.json --pruned mvp1/ngram_pruned.json
"""

import json
import argparse
from typing import Dict, List, Tuple


def load_ngram_db(filepath: str) -> Dict:
    """Load N-gram database from JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_top_next_chars(ngram_db: Dict, char: str, top_n: int = 10) -> List[Tuple[str, float]]:
    """
    Get top N most likely next characters for a given character.

    Args:
        ngram_db: N-gram database
        char: Input character
        top_n: Number of top results to return

    Returns:
        List of (next_char, probability) tuples, sorted by probability descending
    """
    bigrams = ngram_db.get('bigrams', {})

    # Find all bigrams starting with this character
    candidates = []
    for bigram, prob in bigrams.items():
        if bigram.startswith(char) and len(bigram) == 2:
            next_char = bigram[1]
            candidates.append((next_char, prob))

    # Sort by probability (descending) and return top N
    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates[:top_n]


def compare_predictions(
    original_db: Dict,
    pruned_db: Dict,
    test_phrases: List[str],
    verbose: bool = False
) -> Tuple[int, int, int]:
    """
    Compare predictions between original and pruned databases.

    Args:
        original_db: Original N-gram database
        pruned_db: Pruned N-gram database
        test_phrases: List of test phrases (2+ characters)
        verbose: Print detailed comparison

    Returns:
        (matches, partial_matches, misses) counts
    """
    matches = 0
    partial_matches = 0
    misses = 0

    if verbose:
        print("\n" + "=" * 80)
        print("PREDICTION COMPARISON")
        print("=" * 80)

    for phrase in test_phrases:
        if len(phrase) < 2:
            continue

        # Test each character pair in the phrase
        for i in range(len(phrase) - 1):
            char1 = phrase[i]
            char2 = phrase[i + 1]  # Actual next character

            # Get predictions from both databases
            original_top = get_top_next_chars(original_db, char1, top_n=10)
            pruned_top = get_top_next_chars(pruned_db, char1, top_n=10)

            # Extract just the characters (without probabilities)
            original_chars = [c for c, _ in original_top]
            pruned_chars = [c for c, _ in pruned_top]

            # Check if actual next character is in predictions
            original_has = char2 in original_chars
            pruned_has = char2 in pruned_chars

            if original_has and pruned_has:
                # Both databases predict correctly
                matches += 1
                status = "✓ MATCH"
            elif not original_has and pruned_has:
                # Pruned is better (shouldn't happen often)
                matches += 1
                status = "✓ PRUNED BETTER"
            elif original_has and not pruned_has:
                # Pruned lost this prediction (this is the cost of pruning)
                # But check if it's in top 3 of original
                original_rank = original_chars.index(char2) if original_has else -1
                if original_rank < 3:
                    misses += 1
                    status = "✗ MISS (important)"
                else:
                    partial_matches += 1
                    status = "~ PARTIAL (low-freq)"
            else:
                # Neither predicted (rare character transition)
                partial_matches += 1
                status = "~ BOTH MISS (rare)"

            if verbose:
                print(f"\nPhrase: '{phrase}' | Testing: '{char1}' → '{char2}'")
                print(f"  Original top 5: {original_chars[:5]}")
                print(f"  Pruned top 5:   {pruned_chars[:5]}")
                print(f"  Status: {status}")

    return matches, partial_matches, misses


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Compare N-gram prediction quality'
    )

    parser.add_argument(
        '--original',
        default='mvp1/ngram_db.json',
        help='Original N-gram database'
    )

    parser.add_argument(
        '--pruned',
        default='mvp1/ngram_pruned.json',
        help='Pruned N-gram database'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Print detailed comparison'
    )

    args = parser.parse_args()

    print("Loading N-gram databases...")
    original_db = load_ngram_db(args.original)
    pruned_db = load_ngram_db(args.pruned)

    print(f"  ✓ Original: {args.original}")
    print(f"  ✓ Pruned: {args.pruned}")

    # Test phrases covering different scenarios
    test_phrases = [
        # Common daily phrases
        "我是學生",
        "你好嗎",
        "今天天氣",
        "明天見",
        "謝謝你",
        "對不起",
        "沒關係",
        "不客氣",
        "請問一下",
        "可以幫我",

        # Technical/written phrases
        "這個問題",
        "根據統計",
        "如果可以",
        "因為所以",
        "雖然但是",
        "首先其次",
        "總而言之",
        "舉例來說",

        # Sentence prediction scenarios (from rime-essay)
        "一個人",
        "可以說",
        "自己的",
        "時候就",
        "我們的",
        "什麼都",
        "有一些",
        "這些人",
        "那麼多",
        "非常好"
    ]

    print(f"\nTesting with {len(test_phrases)} phrases...")

    matches, partial, misses = compare_predictions(
        original_db,
        pruned_db,
        test_phrases,
        verbose=args.verbose
    )

    total = matches + partial + misses

    print("\n" + "=" * 80)
    print("RESULTS")
    print("=" * 80)
    print(f"Total predictions tested: {total}")
    print(f"✓ Perfect matches: {matches} ({matches/total*100:.1f}%)")
    print(f"~ Partial matches (low-freq): {partial} ({partial/total*100:.1f}%)")
    print(f"✗ Misses (important): {misses} ({misses/total*100:.1f}%)")
    print()

    # Calculate quality score
    quality_score = (matches + partial * 0.5) / total * 100

    print(f"Quality Score: {quality_score:.1f}%")
    print()

    if quality_score >= 80:
        print("✓ EXCELLENT: Pruned model maintains >80% quality!")
    elif quality_score >= 70:
        print("✓ GOOD: Pruned model maintains >70% quality")
    elif quality_score >= 60:
        print("~ OK: Pruned model maintains >60% quality (consider adjusting)")
    else:
        print("✗ POOR: Consider increasing topk or lowering threshold")

    print("=" * 80)


if __name__ == "__main__":
    main()
