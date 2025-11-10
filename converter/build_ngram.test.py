#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
N-gram Language Model Builder - TDD Test Suite

This test suite follows Test-Driven Development (TDD) approach.
All tests are written BEFORE implementation.

Total Tests: 25
Categories:
  1. Parsing (5 tests)
  2. Unigram Counting (4 tests)
  3. Bigram Counting (5 tests)
  4. Probability Calculation (6 tests)
  5. JSON Generation (3 tests)
  6. Integration (2 tests)

Design Document: converter/DESIGN-ngram.md
"""

import unittest
import os
import json
import tempfile
from build_ngram_lib import (
    parse_essay_txt,
    parse_entry,
    count_unigrams,
    count_bigrams,
    calculate_unigram_probabilities,
    calculate_bigram_probabilities,
    generate_ngram_db,
    write_ngram_db,
    validate_ngram_db,
    calculate_metadata
)


# ============================================================================
# Category 1: Parsing (5 tests)
# ============================================================================

class TestParsing(unittest.TestCase):
    """Test parsing of essay.txt file."""

    def test_parse_valid_entries(self):
        """Test parsing valid TSV entries."""
        # Given: Valid TSV content
        content = "的時候\t8901\n一個\t3456\n大家\t2134\n"

        # When: Parse content
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            entries = parse_essay_txt(temp_path)

            # Then: Should parse all entries correctly
            self.assertEqual(len(entries), 3)
            self.assertEqual(entries[0], ('的時候', 8901))
            self.assertEqual(entries[1], ('一個', 3456))
            self.assertEqual(entries[2], ('大家', 2134))
        finally:
            os.unlink(temp_path)

    def test_parse_skip_invalid_freq(self):
        """Test skipping entries with non-numeric frequency."""
        # Given: Content with invalid frequency
        content = "的時候\t8901\n無效\tinvalid\n一個\t3456\n"

        # When: Parse content
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            entries = parse_essay_txt(temp_path)

            # Then: Should skip invalid entry
            self.assertEqual(len(entries), 2)
            self.assertEqual(entries[0], ('的時候', 8901))
            self.assertEqual(entries[1], ('一個', 3456))
        finally:
            os.unlink(temp_path)

    def test_parse_skip_zero_freq(self):
        """Test skipping entries with zero frequency."""
        # Given: Content with zero frequency
        content = "的時候\t8901\n零頻率\t0\n一個\t3456\n"

        # When: Parse content
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            entries = parse_essay_txt(temp_path)

            # Then: Should skip zero frequency entry
            self.assertEqual(len(entries), 2)
            self.assertEqual(entries[0], ('的時候', 8901))
            self.assertEqual(entries[1], ('一個', 3456))
        finally:
            os.unlink(temp_path)

    def test_parse_handle_empty_lines(self):
        """Test handling empty lines gracefully."""
        # Given: Content with empty lines
        content = "的時候\t8901\n\n一個\t3456\n\n\n大家\t2134\n"

        # When: Parse content
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            entries = parse_essay_txt(temp_path)

            # Then: Should skip empty lines
            self.assertEqual(len(entries), 3)
        finally:
            os.unlink(temp_path)

    def test_parse_unicode_support(self):
        """Test correct handling of Chinese characters."""
        # Given: Content with various Chinese characters
        content = "繁體中文\t100\n简体中文\t200\n混合text\t50\n"

        # When: Parse content
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            entries = parse_essay_txt(temp_path)

            # Then: Should handle Unicode correctly
            self.assertEqual(len(entries), 3)
            self.assertEqual(entries[0][0], '繁體中文')
            self.assertEqual(entries[1][0], '简体中文')
            self.assertEqual(entries[2][0], '混合text')
        finally:
            os.unlink(temp_path)


# ============================================================================
# Category 2: Unigram Counting (4 tests)
# ============================================================================

class TestUnigramCounting(unittest.TestCase):
    """Test unigram (character) frequency counting."""

    def test_count_unigrams_basic(self):
        """Test basic unigram counting."""
        # Given: Simple entries
        entries = [("的時候", 10), ("一個", 5)]

        # When: Count unigrams
        counts = count_unigrams(entries)

        # Then: Should count each character with phrase frequency
        self.assertEqual(counts['的'], 10)
        self.assertEqual(counts['時'], 10)
        self.assertEqual(counts['候'], 10)
        self.assertEqual(counts['一'], 5)
        self.assertEqual(counts['個'], 5)

    def test_count_unigrams_accumulate(self):
        """Test frequency accumulation across phrases."""
        # Given: Entries with repeated characters
        entries = [("大家", 100), ("大人", 50), ("家人", 30)]

        # When: Count unigrams
        counts = count_unigrams(entries)

        # Then: Should accumulate frequencies
        self.assertEqual(counts['大'], 150)  # 100 + 50
        self.assertEqual(counts['家'], 130)  # 100 + 30
        self.assertEqual(counts['人'], 80)   # 50 + 30

    def test_count_unigrams_empty(self):
        """Test empty input."""
        # Given: Empty entries
        entries = []

        # When: Count unigrams
        counts = count_unigrams(entries)

        # Then: Should return empty dictionary
        self.assertEqual(counts, {})

    def test_count_unigrams_single_char_phrases(self):
        """Test phrases with single character."""
        # Given: Single-character phrases
        entries = [("的", 1000), ("一", 500), ("是", 300)]

        # When: Count unigrams
        counts = count_unigrams(entries)

        # Then: Should count correctly
        self.assertEqual(counts['的'], 1000)
        self.assertEqual(counts['一'], 500)
        self.assertEqual(counts['是'], 300)


# ============================================================================
# Category 3: Bigram Counting (5 tests)
# ============================================================================

class TestBigramCounting(unittest.TestCase):
    """Test bigram (character pair) frequency counting."""

    def test_count_bigrams_basic(self):
        """Test basic bigram extraction."""
        # Given: Simple entries
        entries = [("的時候", 10), ("一個", 5)]

        # When: Count bigrams
        counts = count_bigrams(entries)

        # Then: Should extract all bigrams
        self.assertEqual(counts['的時'], 10)
        self.assertEqual(counts['時候'], 10)
        self.assertEqual(counts['一個'], 5)

    def test_count_bigrams_accumulate(self):
        """Test frequency accumulation."""
        # Given: Entries with repeated bigrams
        entries = [("的時候", 100), ("時候到", 50)]

        # When: Count bigrams
        counts = count_bigrams(entries)

        # Then: Should accumulate frequencies
        self.assertEqual(counts['的時'], 100)
        self.assertEqual(counts['時候'], 150)  # 100 + 50
        self.assertEqual(counts['候到'], 50)

    def test_count_bigrams_single_char(self):
        """Test phrases too short for bigrams."""
        # Given: Single-character phrases
        entries = [("的", 100), ("一", 50)]

        # When: Count bigrams
        counts = count_bigrams(entries)

        # Then: Should return empty dictionary (no bigrams possible)
        self.assertEqual(counts, {})

    def test_count_bigrams_long_phrase(self):
        """Test extracting all bigrams from long phrase."""
        # Given: Long phrase
        entries = [("一二三四五", 10)]

        # When: Count bigrams
        counts = count_bigrams(entries)

        # Then: Should extract all consecutive pairs
        self.assertEqual(len(counts), 4)  # 4 bigrams from 5 chars
        self.assertEqual(counts['一二'], 10)
        self.assertEqual(counts['二三'], 10)
        self.assertEqual(counts['三四'], 10)
        self.assertEqual(counts['四五'], 10)

    def test_count_bigrams_overlap(self):
        """Test overlapping bigrams."""
        # Given: Phrase "abc" which produces "ab" and "bc"
        entries = [("的時候", 100)]

        # When: Count bigrams
        counts = count_bigrams(entries)

        # Then: Should extract overlapping bigrams
        self.assertEqual(len(counts), 2)  # "的時" and "時候"
        self.assertIn('的時', counts)
        self.assertIn('時候', counts)


# ============================================================================
# Category 4: Probability Calculation (6 tests)
# ============================================================================

class TestProbabilityCalculation(unittest.TestCase):
    """Test probability calculation from counts."""

    def test_unigram_probabilities_sum_to_one(self):
        """Test that all unigram probabilities sum to 1.0."""
        # Given: Unigram counts
        counts = {'的': 100, '一': 50, '是': 30}

        # When: Calculate probabilities
        probs = calculate_unigram_probabilities(counts)

        # Then: Should sum to 1.0 (within floating point tolerance)
        total = sum(probs.values())
        self.assertAlmostEqual(total, 1.0, places=6)

    def test_unigram_probabilities_range(self):
        """Test probabilities are in (0, 1] range."""
        # Given: Unigram counts
        counts = {'的': 100, '一': 50, '是': 30}

        # When: Calculate probabilities
        probs = calculate_unigram_probabilities(counts)

        # Then: All probabilities should be in (0, 1]
        for char, prob in probs.items():
            self.assertGreater(prob, 0.0)
            self.assertLessEqual(prob, 1.0)

    def test_bigram_probabilities_laplace_smoothing(self):
        """Test Laplace smoothing is applied."""
        # Given: Simple bigram and unigram counts
        bigram_counts = {'的時': 100}
        unigram_counts = {'的': 100, '時': 100, '候': 50}

        # When: Calculate probabilities
        probs = calculate_bigram_probabilities(bigram_counts, unigram_counts)

        # Then: Should apply Laplace smoothing
        # P('的時') = (100 + 1) / (100 + 3) = 101/103 ≈ 0.9806
        self.assertAlmostEqual(probs['的時'], 101/103, places=4)

    def test_bigram_probabilities_unseen(self):
        """Test unseen bigrams get non-zero probability."""
        # Given: Counts with unseen bigram
        bigram_counts = {'的時': 0}  # Unseen (count = 0)
        unigram_counts = {'的': 100, '時': 50}

        # When: Calculate probabilities
        probs = calculate_bigram_probabilities(bigram_counts, unigram_counts)

        # Then: Unseen bigram should have non-zero probability
        # P('的時') = (0 + 1) / (100 + 2) = 1/102 ≈ 0.0098
        self.assertGreater(probs['的時'], 0.0)
        self.assertAlmostEqual(probs['的時'], 1/102, places=4)

    def test_bigram_probabilities_conditional(self):
        """Test P(char2|char1) calculation."""
        # Given: Counts representing P(時|的) and P(候|的)
        bigram_counts = {'的時': 80, '的候': 20}
        unigram_counts = {'的': 100, '時': 80, '候': 20}

        # When: Calculate probabilities
        probs = calculate_bigram_probabilities(bigram_counts, unigram_counts)

        # Then: P(時|的) should be higher than P(候|的)
        # P(時|的) = (80 + 1) / (100 + 3) = 81/103
        # P(候|的) = (20 + 1) / (100 + 3) = 21/103
        self.assertGreater(probs['的時'], probs['的候'])

    def test_probabilities_on_known_data(self):
        """Test probabilities match expected values on sample data."""
        # Given: Known sample data
        unigram_counts = {'的': 200, '一': 100}

        # When: Calculate probabilities
        probs = calculate_unigram_probabilities(unigram_counts)

        # Then: Should match expected values
        self.assertAlmostEqual(probs['的'], 2/3, places=6)
        self.assertAlmostEqual(probs['一'], 1/3, places=6)


# ============================================================================
# Category 5: JSON Generation (3 tests)
# ============================================================================

class TestJSONGeneration(unittest.TestCase):
    """Test JSON database generation."""

    def test_json_structure(self):
        """Test JSON has required keys."""
        # Given: Sample probabilities and metadata
        unigram_probs = {'的': 0.5, '一': 0.5}
        bigram_probs = {'的時': 0.8}
        metadata = {'total_chars': 100, 'unique_chars': 2}

        # When: Generate N-gram database
        ngram_db = generate_ngram_db(unigram_probs, bigram_probs, metadata)

        # Then: Should have required keys
        self.assertIn('unigrams', ngram_db)
        self.assertIn('bigrams', ngram_db)
        self.assertIn('metadata', ngram_db)

    def test_json_serialization(self):
        """Test JSON can be serialized and deserialized."""
        # Given: Sample N-gram database
        ngram_db = {
            'unigrams': {'的': 0.5, '一': 0.5},
            'bigrams': {'的時': 0.8},
            'metadata': {'total_chars': 100}
        }

        # When: Serialize and deserialize
        json_str = json.dumps(ngram_db, ensure_ascii=False)
        reconstructed = json.loads(json_str)

        # Then: Should match original
        self.assertEqual(reconstructed['unigrams'], ngram_db['unigrams'])
        self.assertEqual(reconstructed['bigrams'], ngram_db['bigrams'])

    def test_json_metadata(self):
        """Test metadata contains expected fields."""
        # Given: Sample data
        unigram_probs = {'的': 0.5}
        bigram_probs = {'的時': 0.8}
        metadata = {'total_chars': 100, 'unique_chars': 1}

        # When: Generate N-gram database
        ngram_db = generate_ngram_db(unigram_probs, bigram_probs, metadata)

        # Then: Metadata should have required fields
        self.assertIn('total_chars', ngram_db['metadata'])
        self.assertIn('unique_chars', ngram_db['metadata'])
        self.assertIn('generated_at', ngram_db['metadata'])
        self.assertIn('version', ngram_db['metadata'])


# ============================================================================
# Category 6: Integration (2 tests)
# ============================================================================

class TestIntegration(unittest.TestCase):
    """Test end-to-end integration."""

    def test_end_to_end_small_corpus(self):
        """Test full pipeline on small test data."""
        # Given: Small test corpus
        test_data_path = 'test-data/essay-sample.txt'

        if not os.path.exists(test_data_path):
            self.skipTest(f"Test data not found: {test_data_path}")

        # When: Run full pipeline
        entries = parse_essay_txt(test_data_path)
        unigram_counts = count_unigrams(entries)
        bigram_counts = count_bigrams(entries)
        unigram_probs = calculate_unigram_probabilities(unigram_counts)
        bigram_probs = calculate_bigram_probabilities(bigram_counts, unigram_counts)
        metadata = calculate_metadata(entries, unigram_counts, bigram_counts)
        ngram_db = generate_ngram_db(unigram_probs, bigram_probs, metadata)

        # Then: Should produce valid N-gram database
        self.assertIn('unigrams', ngram_db)
        self.assertIn('bigrams', ngram_db)
        self.assertGreater(len(ngram_db['unigrams']), 0)

        # Validate probabilities
        unigram_sum = sum(ngram_db['unigrams'].values())
        self.assertAlmostEqual(unigram_sum, 1.0, places=2)

    def test_end_to_end_file_write(self):
        """Test writing N-gram database to file."""
        # Given: Sample N-gram database
        ngram_db = {
            'unigrams': {'的': 0.5, '一': 0.5},
            'bigrams': {'的時': 0.8},
            'metadata': {'total_chars': 100, 'unique_chars': 2}
        }

        # When: Write to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name

        try:
            write_ngram_db(ngram_db, temp_path)

            # Then: File should be readable and contain correct data
            with open(temp_path, 'r', encoding='utf-8') as f:
                loaded = json.load(f)

            self.assertEqual(loaded['unigrams'], ngram_db['unigrams'])
            self.assertEqual(loaded['bigrams'], ngram_db['bigrams'])
        finally:
            os.unlink(temp_path)


# ============================================================================
# Test Runner
# ============================================================================

def run_tests():
    """Run all tests and display results."""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test categories
    suite.addTests(loader.loadTestsFromTestCase(TestParsing))
    suite.addTests(loader.loadTestsFromTestCase(TestUnigramCounting))
    suite.addTests(loader.loadTestsFromTestCase(TestBigramCounting))
    suite.addTests(loader.loadTestsFromTestCase(TestProbabilityCalculation))
    suite.addTests(loader.loadTestsFromTestCase(TestJSONGeneration))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))

    # Run tests with verbose output
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Summary
    print("\n" + "=" * 70)
    print(f"Total Tests: {result.testsRun}")
    print(f"Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failed: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("=" * 70)

    return result.wasSuccessful()


if __name__ == '__main__':
    import sys
    success = run_tests()
    sys.exit(0 if success else 1)
