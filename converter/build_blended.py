#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
N-gram Blended Model Builder (Session 9)

This script builds a hybrid N-gram model by intelligently blending multiple
corpora with weighted averaging to achieve better real-world quality.

Architecture:
- Phase 1: Process rime-essay (general/formal corpus)
- Phase 2: Process PTT-Corpus (chat/colloquial corpus)
- Phase 3: Weighted merge (70% rime + 30% PTT by default)
- Phase 4: Apply pruning (threshold=3, topk=10 from Session 8)

Design Document: docs/design/DESIGN-ngram-blended.md
"""

import argparse
import json
import os
import sys
from collections import defaultdict
from typing import Dict, List, Tuple

# Import processors
from build_ngram_lib import process_essay_file, apply_pruning
from process_raw_text import process_corpus


def merge_counts(
    unigrams_list: List[Dict[str, int]],
    bigrams_list: List[Dict[str, int]],
    weights: List[float],
    verbose: bool = False
) -> Tuple[Dict[str, float], Dict[str, float]]:
    """
    Merge multiple N-gram count dictionaries with weighted averaging.

    Mathematical foundation:
        blended_count(c) = Σ(weight_i × count_i(c))

    where weights sum to 1.0 (normalized percentages).

    Args:
        unigrams_list: List of unigram count dicts from different corpora
        bigrams_list: List of bigram count dicts from different corpora
        weights: List of weights (must sum to 1.0)
        verbose: Print merge statistics

    Returns:
        Tuple of (merged_unigrams, merged_bigrams)
        Note: Returns floats to preserve weighted averages

    Raises:
        AssertionError: If weights don't sum to 1.0 or list lengths don't match

    Example:
        >>> uni1 = {'大': 100, '易': 50}
        >>> uni2 = {'大': 20, '在': 30}
        >>> merged_uni, _ = merge_counts([uni1, uni2], [{}, {}], [0.7, 0.3])
        >>> merged_uni['大']
        76.0  # = 0.7*100 + 0.3*20
        >>> merged_uni['易']
        35.0  # = 0.7*50 + 0.3*0
        >>> merged_uni['在']
        9.0   # = 0.7*0 + 0.3*30
    """
    # Validation
    assert len(unigrams_list) == len(bigrams_list) == len(weights), \
        "List lengths must match"
    assert abs(sum(weights) - 1.0) < 0.001, \
        f"Weights must sum to 1.0, got {sum(weights)}"

    if verbose:
        print(f"[Merge] Blending {len(unigrams_list)} corpora with weights {weights}")

    # Merge unigrams
    merged_unigrams = defaultdict(float)

    for corpus_counts, weight in zip(unigrams_list, weights):
        for char, count in corpus_counts.items():
            merged_unigrams[char] += count * weight

    # Merge bigrams
    merged_bigrams = defaultdict(float)

    for corpus_counts, weight in zip(bigrams_list, weights):
        for bigram, count in corpus_counts.items():
            merged_bigrams[bigram] += count * weight

    # Convert defaultdict to regular dict
    merged_unigrams_dict = dict(merged_unigrams)
    merged_bigrams_dict = dict(merged_bigrams)

    if verbose:
        print(f"[Merge] Merged unigrams: {len(merged_unigrams_dict):,}")
        print(f"[Merge] Merged bigrams: {len(merged_bigrams_dict):,}")

    return merged_unigrams_dict, merged_bigrams_dict


def convert_to_int_counts(float_counts: Dict[str, float]) -> Dict[str, int]:
    """
    Convert weighted float counts to integer counts for pruning.

    Rounds to nearest integer, preserving relative frequencies.

    Args:
        float_counts: Dictionary with float counts from weighted merge

    Returns:
        Dictionary with integer counts

    Example:
        >>> convert_to_int_counts({'大': 76.5, '易': 35.2, '在': 9.0})
        {'大': 77, '易': 35, '在': 9}
    """
    return {key: round(value) for key, value in float_counts.items()}


def build_blended_model(
    rime_corpus_path: str,
    ptt_corpus_path: str,
    weight_rime: float = 0.7,
    weight_ptt: float = 0.3,
    pruning_threshold: int = 2,
    pruning_topk: int = 40,
    output_file: str = 'ngram_blended.json',
    verbose: bool = False
) -> Dict:
    """
    Build blended N-gram model by merging multiple corpora.

    4-Phase Pipeline:
    1. Process rime-essay (general/formal)
    2. Process PTT-Corpus (chat/colloquial)
    3. Weighted merge (default: 70% rime + 30% PTT)
    4. Apply pruning (threshold=2, topk=40) - v1.1 balanced params

    Args:
        rime_corpus_path: Path to rime-essay essay.txt
        ptt_corpus_path: Path to PTT-Corpus raw text file
        weight_rime: Weight for rime-essay (default: 0.7)
        weight_ptt: Weight for PTT-Corpus (default: 0.3)
        pruning_threshold: Minimum bigram count to keep (default: 2)
        pruning_topk: Top K next characters per character (default: 40)
        output_file: Output JSON file path
        verbose: Print detailed progress

    Returns:
        Complete N-gram database dictionary

    Example:
        >>> db = build_blended_model(
        ...     'converter/raw_data/essay.txt',
        ...     'converter/raw_data/ptt_corpus.txt',
        ...     weight_rime=0.7,
        ...     weight_ptt=0.3,
        ...     verbose=True
        ... )
        [Phase 1/4] Processing rime-essay...
        [Essay] Parsing essay.txt...
        [Essay] Found 18,215 unique characters
        [Essay] Found 279,220 unique bigrams
        [Phase 2/4] Processing PTT-Corpus...
        [PTT] Processing ptt_corpus.txt...
        [PTT] Unique unigrams: 15,123
        [PTT] Unique bigrams: 180,456
        [Phase 3/4] Merging with weights [0.7, 0.3]...
        [Merge] Merged unigrams: 18,543
        [Merge] Merged bigrams: 315,678
        [Phase 4/4] Applying pruning...
        [Pruning] After threshold: 210,456
        [Pruning] After top-K: 105,234
        ✅ Success! ngram_blended.json saved (4.5MB)
    """
    if verbose:
        print("=" * 70)
        print("N-gram Blended Model Builder (Session 9)")
        print("=" * 70)
        print(f"Rime corpus:  {rime_corpus_path}")
        print(f"PTT corpus:   {ptt_corpus_path}")
        print(f"Weights:      rime={weight_rime:.1%}, PTT={weight_ptt:.1%}")
        print(f"Pruning:      threshold={pruning_threshold}, topk={pruning_topk}")
        print(f"Output:       {output_file}")
        print("=" * 70)
        print()

    # Phase 1: Process rime-essay
    if verbose:
        print(f"[Phase 1/4] Processing rime-essay...")

    uni_rime, bi_rime = process_essay_file(rime_corpus_path, verbose=verbose)

    if verbose:
        print()

    # Phase 2: Process PTT-Corpus
    if verbose:
        print(f"[Phase 2/4] Processing PTT-Corpus...")

    uni_ptt, bi_ptt = process_corpus(ptt_corpus_path, verbose=verbose)

    if verbose:
        print()

    # Phase 3: Weighted merge
    if verbose:
        print(f"[Phase 3/4] Merging with weights [{weight_rime}, {weight_ptt}]...")

    merged_uni, merged_bi = merge_counts(
        [uni_rime, uni_ptt],
        [bi_rime, bi_ptt],
        [weight_rime, weight_ptt],
        verbose=verbose
    )

    if verbose:
        print()

    # Phase 4: Apply pruning
    if verbose:
        print(f"[Phase 4/4] Applying pruning (threshold={pruning_threshold}, topk={pruning_topk})...")

    # Convert float counts to integers for pruning
    merged_bi_int = convert_to_int_counts(merged_bi)

    # Apply pruning (reuse Session 8 logic)
    pruned_bigrams = apply_pruning(
        merged_bi_int,
        threshold=pruning_threshold,
        topk=pruning_topk,
        verbose=verbose
    )

    # Convert merged unigrams to integers (unigrams don't need pruning)
    merged_uni_int = convert_to_int_counts(merged_uni)

    # Build output structure (simplified - counts only, no probabilities)
    output_data = {
        "unigram_counts": merged_uni_int,
        "bigram_counts": pruned_bigrams,
        "metadata": {
            "version": "1.0-blended",
            "source_corpora": [
                {"name": "rime-essay", "weight": weight_rime},
                {"name": "PTT-Corpus", "weight": weight_ptt}
            ],
            "pruning": {
                "threshold": pruning_threshold,
                "topk": pruning_topk
            },
            "statistics": {
                "unique_unigrams": len(merged_uni_int),
                "unique_bigrams": len(pruned_bigrams),
                "total_unigram_count": sum(merged_uni_int.values()),
                "total_bigram_count": sum(pruned_bigrams.values())
            }
        }
    }

    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, separators=(',', ':'))

    file_size_mb = os.path.getsize(output_file) / (1024 * 1024)

    if verbose:
        print()
        print("=" * 70)
        print(f"✅ Success! Blended N-gram model saved to {output_file}")
        print(f"   File size: {file_size_mb:.2f} MB")
        print(f"   Unigrams: {len(merged_uni_int):,}")
        print(f"   Bigrams: {len(pruned_bigrams):,}")
        print("=" * 70)

    return output_data


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Build blended N-gram model from multiple corpora',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Basic usage with default weights (70% rime, 30% PTT)
  python3 build_blended.py \\
    --rime-corpus converter/raw_data/essay.txt \\
    --ptt-corpus converter/raw_data/ptt_corpus.txt \\
    --output mvp1/ngram_blended.json

  # Custom weights (80% rime, 20% PTT for more formal)
  python3 build_blended.py \\
    --rime-corpus converter/raw_data/essay.txt \\
    --ptt-corpus converter/raw_data/ptt_corpus.txt \\
    --weight-rime 0.8 \\
    --weight-ptt 0.2 \\
    --output mvp1/ngram_blended_formal.json

  # Tighter pruning for smaller file
  python3 build_blended.py \\
    --rime-corpus converter/raw_data/essay.txt \\
    --ptt-corpus converter/raw_data/ptt_corpus.txt \\
    --threshold 5 \\
    --topk 8 \\
    --output mvp1/ngram_blended_small.json
        '''
    )

    parser.add_argument(
        '--rime-corpus',
        required=True,
        help='Path to rime-essay corpus file (essay.txt)'
    )

    parser.add_argument(
        '--ptt-corpus',
        required=True,
        help='Path to PTT-Corpus raw text file'
    )

    parser.add_argument(
        '--weight-rime',
        type=float,
        default=0.7,
        help='Weight for rime-essay corpus (default: 0.7)'
    )

    parser.add_argument(
        '--weight-ptt',
        type=float,
        default=0.3,
        help='Weight for PTT-Corpus (default: 0.3)'
    )

    parser.add_argument(
        '--threshold',
        type=int,
        default=2,
        help='Pruning threshold: minimum bigram count (default: 2, was 3 in v1.0)'
    )

    parser.add_argument(
        '--topk',
        type=int,
        default=40,
        help='Pruning top-K: keep top K next characters per character (default: 40, was 10 in v1.0)'
    )

    parser.add_argument(
        '--output',
        default='ngram_blended.json',
        help='Output JSON file path (default: ngram_blended.json)'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Print detailed progress messages'
    )

    args = parser.parse_args()

    # Validate weights sum to 1.0
    total_weight = args.weight_rime + args.weight_ptt
    if abs(total_weight - 1.0) > 0.001:
        print(f"Error: Weights must sum to 1.0, got {total_weight}", file=sys.stderr)
        print(f"       (rime={args.weight_rime}, ptt={args.weight_ptt})", file=sys.stderr)
        sys.exit(1)

    # Validate input files exist
    if not os.path.exists(args.rime_corpus):
        print(f"Error: Rime corpus file not found: {args.rime_corpus}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(args.ptt_corpus):
        print(f"Error: PTT corpus file not found: {args.ptt_corpus}", file=sys.stderr)
        sys.exit(1)

    # Build blended model
    try:
        build_blended_model(
            rime_corpus_path=args.rime_corpus,
            ptt_corpus_path=args.ptt_corpus,
            weight_rime=args.weight_rime,
            weight_ptt=args.weight_ptt,
            pruning_threshold=args.threshold,
            pruning_topk=args.topk,
            output_file=args.output,
            verbose=args.verbose
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
