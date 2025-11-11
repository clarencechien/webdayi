#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Blended N-gram Model Quality Comparison (Session 9)

Compare prediction quality between rime-only (pruned) and blended models
across three categories: formal writing, chat/colloquial, and mixed context.

Design Document: docs/design/DESIGN-ngram-blended.md
"""

import json
import sys
from typing import Dict, List, Tuple


# ============================================================================
# Test Phrases by Category
# ============================================================================

# Formal Writing (should maintain 87% quality)
FORMAL_PHRASES = [
    "中華民國",      # Country name
    "資訊科技",      # Technical term
    "經濟發展",      # Economic term
    "教育部",        # Government agency
    "大易輸入法",    # Input method name
    "台灣大學",      # University name
    "國際關係",      # International relations
    "環境保護",      # Environmental protection
    "文化交流",      # Cultural exchange
    "科學研究",      # Scientific research
    "政府機關",      # Government institution
    "社會福利",      # Social welfare
    "人工智慧",      # Artificial intelligence
    "電子商務",      # E-commerce
    "網路安全",      # Cyber security
]

# Chat/Colloquial (should improve from 65% → 82%)
CHAT_PHRASES = [
    "我也是",        # Me too
    "真的嗎",        # Really?
    "好啊",          # OK/Sure
    "哈哈哈",        # Haha
    "怎麼辦",        # What to do
    "不知道",        # Don't know
    "沒關係",        # No problem
    "太好了",        # Great!
    "對不起",        # Sorry
    "謝謝你",        # Thank you
    "再見",          # Goodbye
    "早安",          # Good morning
    "晚安",          # Good night
    "加油",          # Keep it up
    "沒問題",        # No problem
    "這樣啊",        # Oh I see
    "原來如此",      # I see
    "有道理",        # Makes sense
    "聽不懂",        # Don't understand
    "什麼意思",      # What does it mean
]

# Mixed Context (real-world scenarios)
MIXED_PHRASES = [
    "今天天氣很好",  # Today's weather is nice
    "明天見",        # See you tomorrow
    "吃飯了嗎",      # Have you eaten?
    "在哪裡",        # Where are you?
    "做什麼",        # What are you doing?
    "有時間嗎",      # Do you have time?
    "工作順利",      # Work going well
    "休息一下",      # Take a break
    "注意安全",      # Be careful
    "保重身體",      # Take care of yourself
    "聯絡方式",      # Contact info
    "電話號碼",      # Phone number
    "地址在哪",      # Where's the address
    "怎麼去",        # How to get there
    "多少錢",        # How much
]


# ============================================================================
# N-gram Database Loading
# ============================================================================

def load_ngram_db(filepath: str) -> Dict:
    """Load N-gram database from JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_top_next_chars(
    db: Dict,
    char: str,
    top_n: int = 10
) -> List[Tuple[str, float]]:
    """
    Get top N most likely next characters for a given character.

    Args:
        db: N-gram database
        char: Current character
        top_n: Number of top predictions to return

    Returns:
        List of (next_char, score) tuples sorted by score descending
    """
    bigram_counts = db.get('bigram_counts', {})

    # Find all bigrams starting with char
    candidates = []
    for bigram, count in bigram_counts.items():
        if len(bigram) >= 2 and bigram[0] == char:
            next_char = bigram[1]
            candidates.append((next_char, count))

    # Sort by count descending
    candidates.sort(key=lambda x: x[1], reverse=True)

    return candidates[:top_n]


# ============================================================================
# Quality Comparison
# ============================================================================

def compare_phrase_predictions(
    phrase: str,
    rime_db: Dict,
    blended_db: Dict,
    verbose: bool = False
) -> Tuple[int, int, int, int]:
    """
    Compare predictions for a single phrase between two models.

    Returns:
        (rime_matches, rime_partial, blended_matches, blended_partial)
    """
    rime_matches = 0
    rime_partial = 0
    blended_matches = 0
    blended_partial = 0

    if len(phrase) < 2:
        return 0, 0, 0, 0

    if verbose:
        print(f"\nPhrase: {phrase}")

    for i in range(len(phrase) - 1):
        char1 = phrase[i]
        char2_actual = phrase[i + 1]  # Actual next character

        # Get predictions from both models
        # Changed from top_n=10 to top_n=40 to match v1.1/v1.2 topk parameter
        rime_top = get_top_next_chars(rime_db, char1, top_n=40)
        blended_top = get_top_next_chars(blended_db, char1, top_n=40)

        rime_chars = [c for c, _ in rime_top]
        blended_chars = [c for c, _ in blended_top]

        # Check if actual next character is predicted
        rime_has = char2_actual in rime_chars
        blended_has = char2_actual in blended_chars

        if verbose:
            rime_rank = rime_chars.index(char2_actual) + 1 if rime_has else "X"
            blended_rank = blended_chars.index(char2_actual) + 1 if blended_has else "X"
            print(f"  {char1} → {char2_actual}: Rime={rime_rank}, Blended={blended_rank}")

        # Score matches
        if rime_has:
            rime_rank = rime_chars.index(char2_actual)
            if rime_rank == 0:  # Perfect match (#1)
                rime_matches += 1
            else:  # Partial match (in top 10 but not #1)
                rime_partial += 1

        if blended_has:
            blended_rank = blended_chars.index(char2_actual)
            if blended_rank == 0:  # Perfect match (#1)
                blended_matches += 1
            else:  # Partial match (in top 10 but not #1)
                blended_partial += 1

    return rime_matches, rime_partial, blended_matches, blended_partial


def compare_category(
    category_name: str,
    phrases: List[str],
    rime_db: Dict,
    blended_db: Dict,
    verbose: bool = False
) -> Dict:
    """
    Compare quality for a category of phrases.

    Returns:
        Dictionary with quality scores
    """
    total_transitions = 0
    rime_matches = 0
    rime_partial = 0
    blended_matches = 0
    blended_partial = 0

    print(f"\n{'='*70}")
    print(f"Category: {category_name}")
    print(f"{'='*70}")

    for phrase in phrases:
        transitions = len(phrase) - 1
        if transitions < 1:
            continue

        r_m, r_p, b_m, b_p = compare_phrase_predictions(
            phrase, rime_db, blended_db, verbose=verbose
        )

        rime_matches += r_m
        rime_partial += r_p
        blended_matches += b_m
        blended_partial += b_p
        total_transitions += transitions

    # Calculate quality scores
    # Quality = (perfect_matches + 0.5 * partial_matches) / total_predictions
    rime_quality = (rime_matches + 0.5 * rime_partial) / total_transitions * 100
    blended_quality = (blended_matches + 0.5 * blended_partial) / total_transitions * 100
    improvement = blended_quality - rime_quality

    # Print results
    print(f"\nResults:")
    print(f"  Total predictions: {total_transitions}")
    print(f"  Rime-only model:")
    print(f"    Perfect matches: {rime_matches} ({rime_matches/total_transitions*100:.1f}%)")
    print(f"    Partial matches: {rime_partial} ({rime_partial/total_transitions*100:.1f}%)")
    print(f"    Quality score: {rime_quality:.1f}%")
    print(f"  Blended model:")
    print(f"    Perfect matches: {blended_matches} ({blended_matches/total_transitions*100:.1f}%)")
    print(f"    Partial matches: {blended_partial} ({blended_partial/total_transitions*100:.1f}%)")
    print(f"    Quality score: {blended_quality:.1f}%")
    print(f"  Improvement: {improvement:+.1f}%")

    return {
        'category': category_name,
        'total_transitions': total_transitions,
        'rime_quality': rime_quality,
        'blended_quality': blended_quality,
        'improvement': improvement,
        'rime_matches': rime_matches,
        'rime_partial': rime_partial,
        'blended_matches': blended_matches,
        'blended_partial': blended_partial
    }


# ============================================================================
# Main
# ============================================================================

def main():
    """Main entry point."""
    if len(sys.argv) < 3:
        print("Usage: python3 compare_blended_quality.py <rime_db.json> <blended_db.json>")
        print()
        print("Example:")
        print("  python3 compare_blended_quality.py \\")
        print("    mvp1/ngram_pruned.json \\")
        print("    mvp1/ngram_blended.json")
        sys.exit(1)

    rime_path = sys.argv[1]
    blended_path = sys.argv[2]

    verbose = '--verbose' in sys.argv

    print("="*70)
    print("N-gram Blended Model Quality Comparison (Session 9)")
    print("="*70)
    print(f"Rime-only model: {rime_path}")
    print(f"Blended model:   {blended_path}")
    print("="*70)

    # Load databases
    print("\nLoading databases...")
    rime_db = load_ngram_db(rime_path)
    blended_db = load_ngram_db(blended_path)

    print(f"Rime-only: {len(rime_db.get('unigram_counts', {})):,} unigrams, "
          f"{len(rime_db.get('bigram_counts', {})):,} bigrams")
    print(f"Blended:   {len(blended_db.get('unigram_counts', {})):,} unigrams, "
          f"{len(blended_db.get('bigram_counts', {})):,} bigrams")

    # Compare categories
    results = []

    results.append(compare_category(
        "Formal Writing",
        FORMAL_PHRASES,
        rime_db,
        blended_db,
        verbose=verbose
    ))

    results.append(compare_category(
        "Chat/Colloquial",
        CHAT_PHRASES,
        rime_db,
        blended_db,
        verbose=verbose
    ))

    results.append(compare_category(
        "Mixed Context",
        MIXED_PHRASES,
        rime_db,
        blended_db,
        verbose=verbose
    ))

    # Overall summary
    print(f"\n{'='*70}")
    print("Overall Summary")
    print(f"{'='*70}")

    total_predictions = sum(r['total_transitions'] for r in results)

    # Weighted average by number of predictions
    rime_weighted = sum(r['rime_quality'] * r['total_transitions'] for r in results) / total_predictions
    blended_weighted = sum(r['blended_quality'] * r['total_transitions'] for r in results) / total_predictions
    overall_improvement = blended_weighted - rime_weighted

    print(f"\nTest Phrases: {len(FORMAL_PHRASES) + len(CHAT_PHRASES) + len(MIXED_PHRASES)}")
    print(f"Total Predictions: {total_predictions}")
    print()
    print(f"{'Category':<20} {'Rime':<10} {'Blended':<10} {'Improvement':<12}")
    print("-" * 70)
    for r in results:
        print(f"{r['category']:<20} {r['rime_quality']:>6.1f}%   "
              f"{r['blended_quality']:>6.1f}%   {r['improvement']:>+6.1f}%")
    print("-" * 70)
    print(f"{'Overall (weighted)':<20} {rime_weighted:>6.1f}%   "
          f"{blended_weighted:>6.1f}%   {overall_improvement:>+6.1f}%")
    print()

    # Success criteria check
    print("Success Criteria:")
    print(f"  ✓ Overall quality ≥ 90%: {blended_weighted:.1f}% "
          f"{'✅ PASS' if blended_weighted >= 90 else '❌ FAIL'}")
    print(f"  ✓ Formal writing ≥ 85%: {results[0]['blended_quality']:.1f}% "
          f"{'✅ PASS' if results[0]['blended_quality'] >= 85 else '❌ FAIL'}")
    print(f"  ✓ No regression in formal: {results[0]['improvement']:+.1f}% "
          f"{'✅ PASS' if results[0]['improvement'] >= -2 else '❌ FAIL'}")
    print(f"  ✓ Chat improvement ≥ +10%: {results[1]['improvement']:+.1f}% "
          f"{'✅ PASS' if results[1]['improvement'] >= 10 else '❌ FAIL'}")

    print()
    print("="*70)
    if blended_weighted >= 90:
        print("🎉 SUCCESS! Blended model achieves 90%+ quality target!")
    else:
        print(f"⚠️  Target not met. Blended quality: {blended_weighted:.1f}% (target: 90%)")
    print("="*70)


if __name__ == "__main__":
    main()
