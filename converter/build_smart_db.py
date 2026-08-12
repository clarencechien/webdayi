#!/usr/bin/env python3
"""Build WebDayi Smart (2-code) databases.

Sources:
  - McBopomofo phrase.occ (MIT, Taiwan-centric word occurrence counts)
    https://github.com/openvanilla/McBopomofo  Source/Data/phrase.occ
  - rime-essay essay.txt (secondary coverage, heavily discounted)
  - smart/data/dayi_db.json (Dayi code table, from rime-dayi)

Outputs:
  - smart/data/word_db.json   words (1-4 chars) keyed by Dayi 2-code-prefix
                              token sequence ("tok|tok|..."), value [[word, count], ...]
  - smart/data/char_bigram.json  char bigram conditional counts derived from
                              phrase.occ (within-phrase pairs weighted by occ)

Usage:
  python3 converter/build_smart_db.py [--occ PATH] [--essay PATH]
"""
import argparse
import json
import math
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CJK = re.compile(r'^[㐀-䶿一-鿿豈-﫿]+$')

MAX_WORD_LEN = 4
ESSAY_DISCOUNT = 0.005     # essay is mainland-biased; keep only as weak coverage fill, never above occ words
ESSAY_MIN_KEPT = 10        # discounted count floor for essay words (kills junk long-tail like 宿豫)
MIN_WORD_COUNT_BY_LEN = {1: 0, 2: 2, 3: 3, 4: 5}  # prune low-count long-tail words (size vs coverage)
MIN_BIGRAM_COUNT = 2      # prune noise bigrams


def load_dayi(path):
    with open(path, encoding='utf-8') as f:
        db = json.load(f)
    char_tokens = defaultdict(set)   # char -> set of tokens (2-code prefix, or 1-key code)
    char_longest = {}                # char -> longest full code (canonical typing for eval)
    for code, cands in db.items():
        tok = code if len(code) == 1 else code[:2]
        for c in cands:
            ch = c['char']
            char_tokens[ch].add(tok)
            if ch not in char_longest or len(code) > len(char_longest[ch]):
                char_longest[ch] = code
    return char_tokens, char_longest


def word_keys(word, char_tokens, cap=4):
    """All token-sequence keys for a word (chars may have multiple codes)."""
    keys = ['']
    for ch in word:
        toks = char_tokens.get(ch)
        if not toks:
            return []
        keys = [k + ('|' if k else '') + t for k in keys for t in sorted(toks)]
        if len(keys) > cap:
            keys = keys[:cap]
    return keys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--occ', default='/workspace/openvanilla/mcbopomofo/Source/Data/phrase.occ')
    ap.add_argument('--essay', default=os.path.join(ROOT, 'converter/raw_data/essay.txt'))
    ap.add_argument('--dayi', default=os.path.join(ROOT, 'smart/data/dayi_db.json'))
    ap.add_argument('--outdir', default=os.path.join(ROOT, 'smart/data'))
    args = ap.parse_args()

    char_tokens, char_longest = load_dayi(args.dayi)
    known = set(char_tokens)
    print(f'dayi chars: {len(known)}')

    counts = {}      # word -> count (float; essay contributions discounted)
    source = {}      # word -> 'occ' | 'essay'
    with open(args.occ, encoding='utf-8') as f:
        for line in f:
            parts = line.rstrip('\n').rsplit(' ', 1)
            if len(parts) != 2:
                continue
            w, n = parts[0], parts[1]
            if not n.isdigit() or not CJK.match(w) or len(w) > MAX_WORD_LEN:
                continue
            if not all(c in known for c in w):
                continue
            counts[w] = counts.get(w, 0) + int(n)
            source[w] = 'occ'
    n_occ = len(counts)
    print(f'phrase.occ words kept: {n_occ}')

    with open(args.essay, encoding='utf-8') as f:
        for line in f:
            parts = line.rstrip('\n').split('\t')
            if len(parts) != 2:
                continue
            w, n = parts[0], parts[1]
            try:
                n = int(n)
            except ValueError:
                continue
            if n <= 0 or not CJK.match(w) or len(w) > MAX_WORD_LEN:
                continue
            if w in counts or not all(c in known for c in w):
                continue
            v = n * ESSAY_DISCOUNT
            if v < ESSAY_MIN_KEPT:
                continue
            counts[w] = v
            source[w] = 'essay'
    print(f'essay gap-fill words added: {len(counts) - n_occ}')

    # Ensure every dayi char is typable as a single: floor count 1
    for ch in known:
        if ch not in counts:
            counts[ch] = 1
            source[ch] = 'floor'

    # word_db keyed by token sequence
    word_db = defaultdict(list)
    for w, n in counts.items():
        if n < MIN_WORD_COUNT_BY_LEN[len(w)]:
            continue
        for key in word_keys(w, char_tokens):
            word_db[key].append([w, round(n, 2)])
    for key in word_db:
        word_db[key].sort(key=lambda x: -x[1])

    total = sum(counts.values())
    out_words = {
        'meta': {
            'sources': 'McBopomofo phrase.occ (MIT) + rime-essay gap-fill (x%.2f) + floor' % ESSAY_DISCOUNT,
            'total_count': round(total, 2),
            'words': len(counts),
            'keys': len(word_db),
        },
        'words': word_db,
    }
    os.makedirs(args.outdir, exist_ok=True)
    p1 = os.path.join(args.outdir, 'word_db.json')
    with open(p1, 'w', encoding='utf-8') as f:
        json.dump(out_words, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{p1}: {os.path.getsize(p1) / 1e6:.1f} MB, {len(counts)} words, {len(word_db)} keys')

    # char bigram from phrase.occ phrases (within-phrase adjacent pairs, occ-weighted)
    bigram = defaultdict(float)
    first_totals = defaultdict(float)
    for w, n in counts.items():
        if source[w] == 'floor' or len(w) < 2:
            continue
        for i in range(len(w) - 1):
            bigram[w[i] + w[i + 1]] += n
            first_totals[w[i]] += n
    pruned = {bg: round(c, 2) for bg, c in bigram.items() if c >= MIN_BIGRAM_COUNT}
    out_bigram = {
        'meta': {'note': 'within-phrase char bigram counts from phrase.occ+essay gap-fill',
                 'pairs': len(pruned)},
        'first_totals': {ch: round(c, 2) for ch, c in first_totals.items()},
        'bigrams': pruned,
    }
    p2 = os.path.join(args.outdir, 'char_bigram.json')
    with open(p2, 'w', encoding='utf-8') as f:
        json.dump(out_bigram, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{p2}: {os.path.getsize(p2) / 1e6:.1f} MB, {len(pruned)} pairs')

    # sanity checks
    for probe in ['吃', '咋', '吃飯', '謝謝', '台北', '臺北']:
        print(f'  {probe}: count={counts.get(probe)} source={source.get(probe)}')


if __name__ == '__main__':
    sys.exit(main())
