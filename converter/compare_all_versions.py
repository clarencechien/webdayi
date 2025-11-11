#!/usr/bin/env python3
"""
Comprehensive comparison of all blended model versions.

Compares all experimental versions to identify the optimal configuration:
- v1.0: threshold=3, topk=10 (over-optimized)
- v1.1: threshold=2, topk=40 (balanced, no smoothing)
- v1.1-smoothed: threshold=2, topk=40 (with Laplace smoothing - Action 1)
- v1.2-strict: threshold=2, topk=40, strict cleaning (Action 1 + Action 2)
- v1.3-formal: threshold=2, topk=40, strict cleaning, 80:20 ratio (Action 1 + Action 2 + Action 3)
"""

import json
import os
from typing import Dict, List, Tuple


def load_model(file_path: str) -> Dict:
    """Load N-gram model from JSON file."""
    if not os.path.exists(file_path):
        return None

    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_file_size_mb(file_path: str) -> float:
    """Get file size in MB."""
    if not os.path.exists(file_path):
        return 0.0
    return os.path.getsize(file_path) / (1024 * 1024)


def analyze_model(model: Dict, name: str) -> Dict:
    """Extract key statistics from model."""
    if model is None:
        return None

    stats = {
        'name': name,
        'unigrams': len(model.get('unigram_counts', {})),
        'bigrams': len(model.get('bigram_counts', {})),
        'has_smoothing': 'smoothing_alpha' in model,
        'smoothing_alpha': model.get('smoothing_alpha', None),
        'total_chars': model.get('total_chars', None),
        'vocab_size': model.get('vocab_size', None),
    }

    # Extract metadata
    metadata = model.get('metadata', {})
    stats['version'] = metadata.get('version', 'unknown')

    # Extract corpus weights
    corpora = metadata.get('source_corpora', [])
    if len(corpora) >= 2:
        stats['rime_weight'] = corpora[0].get('weight', 0)
        stats['ptt_weight'] = corpora[1].get('weight', 0)
    else:
        stats['rime_weight'] = None
        stats['ptt_weight'] = None

    # Extract pruning params
    pruning = metadata.get('pruning', {})
    stats['threshold'] = pruning.get('threshold', None)
    stats['topk'] = pruning.get('topk', None)

    return stats


def print_comparison_table(versions: List[Tuple[str, str, str]]):
    """Print comprehensive comparison table."""

    print("="*100)
    print("N-gram Blended Model - Complete Version Comparison")
    print("="*100)
    print()

    # Load all models
    models = []
    for file_path, name, description in versions:
        model = load_model(file_path)
        if model:
            stats = analyze_model(model, name)
            stats['file_path'] = file_path
            stats['description'] = description
            stats['file_size_mb'] = get_file_size_mb(file_path)
            models.append(stats)

    # Print summary table
    print("Summary Table:")
    print("-"*100)
    print(f"{'Version':<15} {'File Size':<12} {'Unigrams':<12} {'Bigrams':<12} {'Description':<45}")
    print("-"*100)

    for m in models:
        print(f"{m['name']:<15} {m['file_size_mb']:>9.2f} MB {m['unigrams']:>10,} {m['bigrams']:>10,}  {m['description']:<45}")

    print()
    print("="*100)
    print("Detailed Comparison:")
    print("="*100)
    print()

    # Print detailed comparison
    print(f"{'Metric':<25} " + " ".join([f"{m['name']:>15}" for m in models]))
    print("-"*100)

    # File size
    row = f"{'File Size (MB)':<25} "
    for m in models:
        row += f"{m['file_size_mb']:>15.2f}"
    print(row)

    # Unigrams
    row = f"{'Unigrams':<25} "
    for m in models:
        row += f"{m['unigrams']:>15,}"
    print(row)

    # Bigrams
    row = f"{'Bigrams':<25} "
    for m in models:
        row += f"{m['bigrams']:>15,}"
    print(row)

    # Weights
    row = f"{'Rime:PTT Ratio':<25} "
    for m in models:
        if m['rime_weight'] and m['ptt_weight']:
            ratio = f"{int(m['rime_weight']*100)}:{int(m['ptt_weight']*100)}"
            row += f"{ratio:>15}"
        else:
            row += f"{'N/A':>15}"
    print(row)

    # Threshold
    row = f"{'Pruning Threshold':<25} "
    for m in models:
        val = m['threshold'] if m['threshold'] is not None else 'N/A'
        row += f"{val:>15}"
    print(row)

    # Top-K
    row = f"{'Pruning Top-K':<25} "
    for m in models:
        val = m['topk'] if m['topk'] is not None else 'N/A'
        row += f"{val:>15}"
    print(row)

    # Smoothing
    row = f"{'Laplace Smoothing':<25} "
    for m in models:
        status = '✅ Yes' if m['has_smoothing'] else '❌ No'
        row += f"{status:>15}"
    print(row)

    # Smoothing alpha
    row = f"{'Smoothing Alpha':<25} "
    for m in models:
        if m['smoothing_alpha'] is not None:
            row += f"{m['smoothing_alpha']:>15.1f}"
        else:
            row += f"{'N/A':>15}"
    print(row)

    print()
    print("="*100)
    print("Feature Comparison:")
    print("="*100)
    print()

    # Feature matrix
    features = [
        ('Action 1: Laplace Smoothing', lambda m: m['has_smoothing']),
        ('Action 2: Strict Cleaning', lambda m: 'strict' in m['description'].lower()),
        ('Action 3: Formal Ratio (80:20)', lambda m: m.get('rime_weight') == 0.8),
    ]

    print(f"{'Feature':<35} " + " ".join([f"{m['name']:>15}" for m in models]))
    print("-"*100)

    for feature_name, feature_check in features:
        row = f"{feature_name:<35} "
        for m in models:
            has_feature = feature_check(m)
            symbol = '✅' if has_feature else '  '
            row += f"{symbol:>15}"
        print(row)

    print()
    print("="*100)
    print("Recommendations:")
    print("="*100)
    print()

    print("Version Selection Guide:")
    print()
    print("1. v1.0 (threshold=3, topk=10)")
    print("   ❌ NOT RECOMMENDED - Over-optimized for size, sacrificed quality")
    print("   Use case: None (superseded by all later versions)")
    print()

    print("2. v1.1 (threshold=2, topk=40, no smoothing)")
    print("   ⚠️ BASELINE - Good balance but missing critical smoothing")
    print("   Use case: Reference only (superseded by v1.1-smoothed)")
    print()

    print("3. v1.1-smoothed (threshold=2, topk=40, with smoothing)")
    print("   ✅ GOOD - Adds Laplace smoothing (+10-15% quality expected)")
    print("   Use case: General purpose without strict cleaning")
    print()

    print("4. v1.2-strict (threshold=2, topk=40, smoothing + strict cleaning)")
    print("   ✅✅ VERY GOOD - Removes 13.81% noise (+5-10% additional quality)")
    print("   Use case: Balanced formal + chat (70:30), clean data")
    print("   Expected quality: ~75% (+16% over v1.0)")
    print()

    print("5. v1.3-formal (threshold=2, topk=40, smoothing + strict + 80:20)")
    print("   ✅✅✅ BEST FOR FORMAL - More weight on formal writing")
    print("   Use case: Business emails, reports, academic writing")
    print("   Expected quality: ~78% formal, ~72% chat (trade-off)")
    print()

    print("="*100)
    print("Production Recommendations:")
    print("="*100)
    print()

    print("For MVP 2a (Chrome Extension) deployment:")
    print()
    print("  • General users (balanced): v1.2-strict (70:30)")
    print("    - Best overall balance")
    print("    - Good for both formal and chat contexts")
    print("    - File size: 1.64 MB (plenty of headroom)")
    print()
    print("  • Business/academic users: v1.3-formal (80:20)")
    print("    - Optimized for formal writing")
    print("    - Better for emails, reports, papers")
    print("    - Slightly smaller: 1.62 MB")
    print()
    print("  • NOT recommended: v1.0, v1.1, v1.1-smoothed")
    print("    - Missing critical optimizations")
    print("    - Lower quality than v1.2/v1.3")
    print()


def main():
    """Main comparison."""

    versions = [
        ('mvp1/ngram_blended_v1.1.json', 'v1.1', 'Baseline (70:30, no smoothing, lenient cleaning)'),
        ('mvp1/ngram_blended_v1.1_smoothed.json', 'v1.1-smoothed', 'Action 1: Laplace smoothing (70:30)'),
        ('mvp1/ngram_blended_v1.2_strict.json', 'v1.2-strict', 'Action 1+2: Smoothing + strict cleaning (70:30)'),
        ('mvp1/ngram_blended_v1.3_formal.json', 'v1.3-formal', 'Action 1+2+3: Smoothing + strict + formal (80:20)'),
    ]

    print_comparison_table(versions)

    print()
    print("="*100)
    print("Next Steps:")
    print("="*100)
    print()
    print("1. Browser testing:")
    print("   - Test all 4 versions with real Viterbi predictions")
    print("   - Measure actual quality improvement")
    print("   - Validate expected improvements (+16% for v1.2, +18% for v1.3)")
    print()
    print("2. Deployment decision:")
    print("   - Choose v1.2-strict OR v1.3-formal for production")
    print("   - Update ngram_blended.json to chosen version")
    print("   - Document decision in README and design docs")
    print()
    print("3. Documentation:")
    print("   - Update README.md with final results")
    print("   - Update memory-bank/activeContext.md")
    print("   - Update NGRAM-BLENDED-EXPERIMENTS.md")
    print()


if __name__ == '__main__':
    main()
