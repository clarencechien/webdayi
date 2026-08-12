/**
 * WebDayi Smart — 智慧 2 碼解碼引擎
 *
 * 輸入:token 序列。每個 token 代表一個字:
 *   - 一般字:全碼的「首碼 + 末碼」(大易簡碼慣例,如 吃 o2c → "oc")
 *   - 單碼字:該字的 1 鍵全碼(如 "y" = 火;UI 上以「鍵 + 空白」輸入)
 *   - 全碼逃生口:UI 直接把已確定的字以 pinned 傳入(不參與解碼)
 *
 * 解碼:詞級 lattice 上的 Viterbi。
 *   詞來源 word_db.json(McBopomofo phrase.occ 為主,essay 補洞,見
 *   converter/build_smart_db.py)。狀態 = (token 位置, 末字),
 *   分數 = Σ log P(詞) + γ·log P(詞首字|前字)(字 bigram,backoff 到打折 unigram)
 *          + μ·使用者習慣 + 詞長獎勵。
 *
 * 無任何 DOM 依賴;node 與瀏覽器皆可用(UMD)。
 */
(function (global, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else global.SmartDecoder = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULTS = {
    gamma: 0.3,        // 跨詞字 bigram glue 權重(harness 掃描定案,見 freq-diagnosis.md)
    beta: 0.02,        // 未見 bigram 的 backoff 折扣(打折 unigram,非死刑)
    mu: 2.0,           // 使用者習慣權重(log 域加分)
    lenBonus: 3.0,     // 每多一字的詞長獎勵(抵銷長詞 key 稀釋;harness 掃描定案)
    maxWordLen: 4,
    topN: 9,
  };

  class SmartDecoder {
    /**
     * @param {Object} wordDb    smart/data/word_db.json 內容
     * @param {Object} charBigram smart/data/char_bigram.json 內容
     * @param {Object} [userHistory] 具 getScore(char) 的物件(可選)
     * @param {Object} [opts]    權重覆寫
     */
    constructor(wordDb, charBigram, userHistory, opts) {
      this.opts = Object.assign({}, DEFAULTS, opts || {});
      this.words = wordDb.words;            // key "tok|tok" -> [[word, count]...]
      this.totalCount = wordDb.meta.total_count;
      this.logTotal = Math.log(this.totalCount);
      this.bigrams = charBigram.bigrams;    // "ab" -> count
      this.firstTotals = charBigram.first_totals; // "a" -> Σ count
      this.user = userHistory || { getScore: () => 0 };

      // 單字 unigram(供 backoff 與候選排序):word_db 的 1 字詞
      this.uniLog = {};
      for (const key in this.words) {
        if (key.indexOf('|') !== -1) continue;
        for (const [w, c] of this.words[key]) {
          if (w.length === 1) {
            const lp = Math.log(c) - this.logTotal;
            if (!(w in this.uniLog) || lp > this.uniLog[w]) this.uniLog[w] = lp;
          }
        }
      }
      this.FLOOR = Math.log(0.01) - this.logTotal;
    }

    logUni(ch) {
      return (ch in this.uniLog) ? this.uniLog[ch] : this.FLOOR;
    }

    /** log P(b|a),未見時 backoff 到 β·unigram(b) */
    logBigram(a, b) {
      const c = this.bigrams[a + b];
      if (c !== undefined) {
        const t = this.firstTotals[a];
        if (t) return Math.log(c / t);
      }
      return Math.log(this.opts.beta) + this.logUni(b);
    }

    logWord(count) {
      return Math.log(count) - this.logTotal;
    }

    /**
     * 解碼 token 序列。
     * @param {Array} tokens 元素為 string(待解碼 token)或 {pinned: '字'}(已定字)
     * @returns {{text: string, chars: string[], words: string[], pinnedMask: boolean[]}}
     */
    decode(tokens) {
      const n = tokens.length;
      const { gamma, mu, lenBonus, maxWordLen } = this.opts;
      // dp[i]: Map lastChar -> {s, from, word}
      const dp = new Array(n + 1);
      for (let i = 0; i <= n; i++) dp[i] = new Map();
      dp[0].set('', { s: 0, from: -1, word: '' });

      for (let i = 0; i < n; i++) {
        if (dp[i].size === 0) continue;
        // pinned:固定接上,不計分(視為使用者已確認)
        if (typeof tokens[i] === 'object' && tokens[i].pinned) {
          const ch = tokens[i].pinned;
          for (const [pc, st] of dp[i]) {
            const s = st.s + (pc ? gamma * this.logBigram(pc, ch) : 0);
            const cur = dp[i + 1].get(ch);
            if (!cur || s > cur.s) dp[i + 1].set(ch, { s, from: i, word: ch, prevChar: pc });
          }
          continue;
        }
        for (let L = 1; L <= maxWordLen && i + L <= n; L++) {
          let key = '';
          let ok = true;
          for (let j = i; j < i + L; j++) {
            if (typeof tokens[j] !== 'string') { ok = false; break; }
            key += (j > i ? '|' : '') + tokens[j];
          }
          if (!ok) break; // 跨過 pinned 的詞不成立
          const entries = this.words[key];
          if (!entries) continue;
          for (const [w, c] of entries) {
            const base = this.logWord(c) + (w.length - 1) * lenBonus +
              mu * Math.log(1 + this.user.getScore(w));
            const first = w[0], last = w[w.length - 1];
            for (const [pc, st] of dp[i]) {
              const s = st.s + base + (pc ? gamma * this.logBigram(pc, first) : 0);
              const cur = dp[i + L].get(last);
              if (!cur || s > cur.s || (s === cur.s && cur.word.length < w.length)) {
                dp[i + L].set(last, { s, from: i, word: w, prevChar: pc });
              }
            }
          }
        }
      }

      // 回溯:狀態記錄了 (from 位置, prevChar),沿鏈走回起點
      if (dp[n].size === 0) return { text: '', chars: [], words: [], failed: true };
      let best = null;
      for (const [, st] of dp[n]) if (!best || st.s > best.s) best = st;
      const words = [];
      let st = best;
      while (st && st.from >= 0) {
        words.unshift(st.word);
        st = dp[st.from].get(st.prevChar);
      }
      const text = words.join('');
      return { text, chars: [...text], words, score: best.s };
    }

    /**
     * 修正 UI / top-k 指標用:token 在左字 prevChar 下的排序候選。
     * 排序分數 = max(單字 unigram, 該 token 開頭詞的攤提分) + γ·bigram + μ·習慣
     */
    candidatesAt(token, prevChar, topN) {
      const { gamma, mu } = this.opts;
      const seen = new Map();
      const singles = this.words[token] || [];
      for (const [w, c] of singles) {
        if (w.length !== 1) continue;
        const s = this.logWord(c);
        if (!seen.has(w) || seen.get(w) < s) seen.set(w, s);
      }
      const out = [];
      for (const [ch, base] of seen) {
        let s = base + mu * Math.log(1 + this.user.getScore(ch));
        if (prevChar) s += gamma * this.logBigram(prevChar, ch);
        out.push({ char: ch, score: s });
      }
      out.sort((a, b) => b.score - a.score);
      return out.slice(0, topN || this.opts.topN);
    }
  }

  return SmartDecoder;
});
