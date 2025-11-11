#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
N-gram Language Model Builder - Command-Line Tool

This script builds an N-gram language model from the rime-essay corpus
and generates ngram_db.json for use in the WebDaYi smart engine.

Usage:
    python build_ngram.py
    python build_ngram.py --input custom_essay.txt --output custom_ngram.json
    python build_ngram.py --dry-run --verbose

Design Document: converter/DESIGN-ngram.md
"""

import argparse
import sys
import os
from typing import Dict
from build_ngram_lib import (
    parse_essay_txt,
    parse_terra_pinyin_dict,
    count_unigrams,
    count_bigrams,
    calculate_unigram_probabilities,
    calculate_bigram_probabilities,
    generate_ngram_db,
    write_ngram_db,
    validate_ngram_db,
    calculate_metadata,
    apply_pruning  # NEW: for N-gram pruning
)


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Build N-gram language model from rime-essay corpus',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Build with default paths
  python build_ngram.py

  # Custom input/output
  python build_ngram.py --input data/essay.txt --output output/ngram.json

  # Dry run (validation only)
  python build_ngram.py --dry-run

  # Verbose output
  python build_ngram.py --verbose
        """
    )

    parser.add_argument(
        '--input',
        default='converter/raw_data/essay.txt',
        help='Input essay.txt file path (default: converter/raw_data/essay.txt)'
    )

    parser.add_argument(
        '--output',
        default='mvp3-smart-engine/ngram_db.json',
        help='Output ngram_db.json file path (default: mvp3-smart-engine/ngram_db.json)'
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

    parser.add_argument(
        '--format',
        choices=['essay', 'terra_pinyin'],
        default='essay',
        help='Input file format (default: essay). Use "terra_pinyin" for Rime dict.yaml format'
    )

    # Pruning parameters (N-gram optimization)
    parser.add_argument(
        '--enable-pruning',
        action='store_true',
        help='Enable N-gram pruning for smaller database size'
    )

    parser.add_argument(
        '--threshold',
        type=int,
        default=3,
        help='Threshold pruning: minimum bigram count to keep (default: 3)'
    )

    parser.add_argument(
        '--topk',
        type=int,
        default=10,
        help='Top-K pruning: keep top K next characters per character (default: 10)'
    )

    return parser.parse_args()


def format_number(n: int) -> str:
    """Format number with comma separators."""
    return f"{n:,}"


def print_step(step_num: int, total_steps: int, description: str):
    """Print step header."""
    print(f"\n[{step_num}/{total_steps}] {description}...")


def print_success(message: str):
    """Print success message."""
    print(f"  ✓ {message}")


def main():
    """Main entry point."""
    args = parse_args()

    # Display appropriate title based on format
    if args.format == 'terra_pinyin':
        print("Building N-gram database from terra_pinyin.dict.yaml (Taiwan localized)...")
        format_name = "terra_pinyin.dict.yaml"
    else:
        print("Building N-gram database from rime-essay...")
        format_name = "essay.txt"

    print("=" * 70)

    # Calculate total steps (add 1 if pruning is enabled)
    base_steps = 5 if not args.dry_run else 4
    total_steps = base_steps + (1 if args.enable_pruning else 0)

    if args.enable_pruning:
        print(f"Pruning enabled: threshold={args.threshold}, top-K={args.topk}")

    # ========================================================================
    # Step 1: Parse input file
    # ========================================================================
    print_step(1, total_steps, f"Parsing {format_name}")

    try:
        if args.format == 'terra_pinyin':
            entries = parse_terra_pinyin_dict(args.input)
        else:
            entries = parse_essay_txt(args.input)

        print_success(f"Parsed {format_number(len(entries))} entries")
        print_success(f"Total phrases: {format_number(len(entries))}")

        if args.verbose:
            print(f"  Sample entries:")
            for i, (phrase, freq) in enumerate(entries[:5]):
                print(f"    {i+1}. \"{phrase}\" (freq: {format_number(freq)})")

    except FileNotFoundError as e:
        print(f"  ✗ Error: {e}")
        sys.exit(1)
    except ValueError as e:
        print(f"  ✗ Error: {e}")
        sys.exit(1)

    # ========================================================================
    # Step 2: Count unigrams
    # ========================================================================
    print_step(2, total_steps, "Counting unigrams")

    unigram_counts = count_unigrams(entries)
    total_chars = sum(unigram_counts.values())
    unique_chars = len(unigram_counts)

    print_success(f"Unique characters: {format_number(unique_chars)}")
    print_success(f"Total character occurrences: {format_number(total_chars)}")

    if args.verbose:
        # Show top 10 most frequent characters
        sorted_chars = sorted(unigram_counts.items(), key=lambda x: x[1], reverse=True)
        print(f"  Top 10 characters:")
        for i, (char, count) in enumerate(sorted_chars[:10]):
            prob = count / total_chars * 100
            print(f"    {i+1}. '{char}': {format_number(count)} ({prob:.2f}%)")

    # ========================================================================
    # Step 3: Count bigrams
    # ========================================================================
    print_step(3, total_steps, "Counting bigrams")

    bigram_counts = count_bigrams(entries)
    total_bigrams_count = sum(bigram_counts.values())
    unique_bigrams = len(bigram_counts)

    print_success(f"Unique bigrams: {format_number(unique_bigrams)}")
    print_success(f"Total bigram occurrences: {format_number(total_bigrams_count)}")

    if args.verbose:
        # Show top 10 most frequent bigrams
        sorted_bigrams = sorted(bigram_counts.items(), key=lambda x: x[1], reverse=True)
        print(f"  Top 10 bigrams:")
        for i, (bigram, count) in enumerate(sorted_bigrams[:10]):
            prob = count / total_bigrams_count * 100
            print(f"    {i+1}. '{bigram}': {format_number(count)} ({prob:.2f}%)")

    # ========================================================================
    # Step 3.5: Apply pruning (if enabled)
    # ========================================================================
    if args.enable_pruning:
        current_step = 4 if not args.dry_run else 3
        print_step(current_step, total_steps, "Applying N-gram pruning")

        original_count = len(bigram_counts)
        bigram_counts = apply_pruning(
            bigram_counts,
            threshold=args.threshold,
            topk=args.topk,
            verbose=True
        )
        pruned_count = len(bigram_counts)

        reduction = original_count - pruned_count
        reduction_percent = (reduction / original_count * 100) if original_count > 0 else 0

        print_success(f"Pruned bigrams: {format_number(pruned_count)} "
                      f"(reduced {format_number(reduction)}, {reduction_percent:.1f}%)")

        # Recalculate statistics with pruned data
        total_bigrams_count = sum(bigram_counts.values())

    # ========================================================================
    # Step 4/5: Calculate probabilities
    # ========================================================================
    prob_step = 5 if args.enable_pruning and not args.dry_run else 4
    if args.dry_run and args.enable_pruning:
        prob_step = 4
    elif args.dry_run:
        prob_step = 3

    print_step(prob_step, total_steps, "Calculating probabilities")

    unigram_probs = calculate_unigram_probabilities(unigram_counts)
    bigram_probs = calculate_bigram_probabilities(bigram_counts, unigram_counts)

    print_success(f"Unigram probabilities: {format_number(len(unigram_probs))}")
    print_success(f"Bigram probabilities: {format_number(len(bigram_probs))}")
    print_success("Smoothing: Laplace (α=0.1) - Solution B")

    # Validate probabilities sum to 1.0
    unigram_sum = sum(unigram_probs.values())
    if abs(unigram_sum - 1.0) > 0.01:
        print(f"  ⚠ Warning: Unigram probabilities sum to {unigram_sum}, expected 1.0")

    # ========================================================================
    # Step 5/6: Write ngram_db.json (skip if dry-run)
    # ========================================================================
    if args.dry_run:
        print("\n✓ Dry run complete! Validation successful.")
        print("  (No output file written)")
    else:
        write_step = 6 if args.enable_pruning else 5
        print_step(write_step, total_steps, "Writing ngram_db.json")

        # Calculate metadata
        metadata = calculate_metadata(entries, unigram_counts, bigram_counts)

        # Generate N-gram database (Solution B: with counts and smoothing params)
        smoothing_alpha = 0.1  # Laplace smoothing parameter
        ngram_db = generate_ngram_db(
            unigram_probs,
            bigram_probs,
            unigram_counts,  # NEW: for Laplace smoothing
            bigram_counts,   # NEW: for Laplace smoothing
            metadata,
            smoothing_alpha  # NEW: smoothing parameter
        )

        # Validate before writing
        try:
            validate_ngram_db(ngram_db)
        except AssertionError as e:
            print(f"  ✗ Validation failed: {e}")
            sys.exit(1)

        # Write to file
        try:
            write_ngram_db(ngram_db, args.output)

            # Get file size
            file_size = os.path.getsize(args.output)
            file_size_mb = file_size / (1024 * 1024)

            print_success(f"Output size: {file_size_mb:.1f} MB")
            print_success(f"File: {args.output}")

        except IOError as e:
            print(f"  ✗ Error writing file: {e}")
            sys.exit(1)

    # ========================================================================
    # Summary
    # ========================================================================
    print("\n" + "=" * 70)
    print("✓ N-gram database built successfully!")
    print("=" * 70)
    print("\nStatistics:")
    print(f"  - Vocabulary size: {format_number(unique_chars)} chars")
    print(f"  - Unique bigrams: {format_number(unique_bigrams)}")
    print(f"  - Entries parsed: {format_number(len(entries))}")
    print(f"  - Total characters: {format_number(total_chars)}")

    # Calculate coverage (simple estimation)
    unigram_coverage = (unique_chars / total_chars) * 100
    bigram_coverage = (unique_bigrams / total_bigrams_count) * 100
    print(f"  - Unigram diversity: {unigram_coverage:.2f}%")
    print(f"  - Bigram diversity: {bigram_coverage:.2f}%")

    if not args.dry_run:
        print(f"\nOutput: {args.output}")
        print("Ready for use in MVP 3.0 Viterbi algorithm!")

    print("=" * 70)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✗ Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
