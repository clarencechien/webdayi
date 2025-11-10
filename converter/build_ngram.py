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
    count_unigrams,
    count_bigrams,
    calculate_unigram_probabilities,
    calculate_bigram_probabilities,
    generate_ngram_db,
    write_ngram_db,
    validate_ngram_db,
    calculate_metadata
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

    print("Building N-gram database from rime-essay...")
    print("=" * 70)

    total_steps = 5 if not args.dry_run else 4

    # ========================================================================
    # Step 1: Parse essay.txt
    # ========================================================================
    print_step(1, total_steps, "Parsing essay.txt")

    try:
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
    # Step 4: Calculate probabilities
    # ========================================================================
    print_step(4, total_steps, "Calculating probabilities")

    unigram_probs = calculate_unigram_probabilities(unigram_counts)
    bigram_probs = calculate_bigram_probabilities(bigram_counts, unigram_counts)

    print_success(f"Unigram probabilities: {format_number(len(unigram_probs))}")
    print_success(f"Bigram probabilities: {format_number(len(bigram_probs))}")
    print_success("Smoothing: Laplace (α=1)")

    # Validate probabilities sum to 1.0
    unigram_sum = sum(unigram_probs.values())
    if abs(unigram_sum - 1.0) > 0.01:
        print(f"  ⚠ Warning: Unigram probabilities sum to {unigram_sum}, expected 1.0")

    # ========================================================================
    # Step 5: Write ngram_db.json (skip if dry-run)
    # ========================================================================
    if args.dry_run:
        print("\n✓ Dry run complete! Validation successful.")
        print("  (No output file written)")
    else:
        print_step(5, total_steps, "Writing ngram_db.json")

        # Calculate metadata
        metadata = calculate_metadata(entries, unigram_counts, bigram_counts)

        # Generate N-gram database
        ngram_db = generate_ngram_db(unigram_probs, bigram_probs, metadata)

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
