/**
 * WebDayi Smart 評測 harness(node 版;瀏覽器版見 eval.html,共用本檔邏輯)
 *
 * 指標(handoff 驗收門檻):
 *   - 2 碼 + 有左 context top-1 ≥ 85%
 *   - 2 碼 + 有左 context top-3 ≥ 95%(修正 UI 一按就中)
 *   - 句首(無 context)top-1:報告即可
 *   - 4 碼(傳統)top-1 ~100%(回歸)
 *   - 每鍵解碼延遲 < 10ms(桌面)
 *
 * 用法:node smart/tests/eval.js [--json out.json] [--gamma 0.3] [--beta 0.02] [--lenBonus 1.2]
 */
(function (global, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else global.SmartEval = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** 建立 char → canonical token(最長全碼的前 2 鍵;單碼字 = 該鍵)與全碼表 */
  function buildCharMaps(dayiRaw) {
    const charToFull = {};
    for (const code in dayiRaw) {
      for (const c of dayiRaw[code]) {
        const ch = c.char;
        if (!charToFull[ch] || code.length > charToFull[ch].length) charToFull[ch] = code;
      }
    }
    const charToToken = {};
    for (const ch in charToFull) {
      const code = charToFull[ch];
      charToToken[ch] = code.length === 1 ? code : code.slice(0, 2);
    }
    return { charToFull, charToToken };
  }

  const isCJK = ch => /[㐀-䶿一-鿿豈-﫿]/.test(ch);

  /**
   * 跑完整評測。
   * @returns {Object} report(可 JSON 序列化)
   */
  function runEval(SmartDecoder, data, opts) {
    const { dayiRaw, wordDb, charBigram, testset } = data;
    const decoder = new SmartDecoder(wordDb, charBigram, null, opts);
    const { charToFull, charToToken } = buildCharMaps(dayiRaw);

    const groups = { conversation: testset.conversation, news: testset.news };
    const rep = {
      opts: decoder.opts,
      totals: {
        chars: 0,
        top1AllOk: 0,
        ctx: { total: 0, top1: 0, top3: 0 },       // 有左 context(位置 ≥1)
        head: { total: 0, top1: 0 },                // 句首(無 context)
        sentences: 0, sentencesAllOk: 0,
        skipped: [],
      },
      fullCode: { total: 0, top1: 0 },              // 4 碼回歸
      latency: { decodes: 0, totalMs: 0, maxMs: 0 },
      errors: [],                                    // confusion 清單
      sentences: [],
    };

    for (const gname in groups) {
      for (const sent of groups[gname]) {
        const chars = [...sent].filter(isCJK);
        const tokens = chars.map(c => charToToken[c]);
        if (tokens.some(t => !t)) {
          rep.totals.skipped.push({ sent, reason: 'char not in dayi table' });
          continue;
        }
        const t0 = Date.now();
        const result = decoder.decode(tokens);
        const ms = Date.now() - t0;
        rep.latency.decodes++;
        rep.latency.totalMs += ms;
        if (ms > rep.latency.maxMs) rep.latency.maxMs = ms;

        const out = result.chars;
        if (result.failed || out.length !== chars.length) {
          rep.totals.skipped.push({ sent, reason: 'decode failed' });
          continue;
        }
        rep.totals.sentences++;
        let allOk = true;
        const sentErrs = [];
        chars.forEach((truth, i) => {
          rep.totals.chars++;
          const hit = out[i] === truth;
          if (hit) rep.totals.top1AllOk++;
          else {
            allOk = false;
            sentErrs.push({ pos: i, truth, got: out[i], token: tokens[i] });
          }
          if (i === 0) {
            rep.totals.head.total++;
            if (hit) rep.totals.head.top1++;
          } else {
            rep.totals.ctx.total++;
            if (hit) rep.totals.ctx.top1++;
            // top-3:左 context 固定為正解前字(修正 UI 情境)
            const cands = decoder.candidatesAt(tokens[i], chars[i - 1], 3);
            if (cands.some(c => c.char === truth)) rep.totals.ctx.top3++;
          }
        });
        if (allOk) rep.totals.sentencesAllOk++;
        else rep.errors.push({ sent, group: gname, errs: sentErrs, got: result.text });
        rep.sentences.push({ sent, got: result.text, ok: allOk, group: gname });

        // 4 碼回歸:全碼查表取 freq 最高候選(傳統模式邏輯)
        chars.forEach(truth => {
          const code = charToFull[truth];
          const cands = dayiRaw[code];
          if (!cands || !cands.length) return;
          rep.fullCode.total++;
          const best = cands.reduce((a, b) => ((b.freq || 0) > (a.freq || 0) ? b : a));
          if (best.char === truth) rep.fullCode.top1++;
        });
      }
    }

    const t = rep.totals;
    rep.summary = {
      'top1 全部': pct(t.top1AllOk, t.chars),
      'top1 有左context (門檻85%)': pct(t.ctx.top1, t.ctx.total),
      'top3 有左context (門檻95%)': pct(t.ctx.top3, t.ctx.total),
      'top1 句首無context (僅報告)': pct(t.head.top1, t.head.total),
      '整句全對率': pct(t.sentencesAllOk, t.sentences),
      '4碼回歸 top1 (門檻~100%)': pct(rep.fullCode.top1, rep.fullCode.total),
      '平均整句解碼 ms': rep.latency.decodes ? +(rep.latency.totalMs / rep.latency.decodes).toFixed(2) : 0,
      '最大整句解碼 ms': rep.latency.maxMs,
      '句數': t.sentences,
      '字數': t.chars,
      'skipped': t.skipped.length,
    };
    return rep;
  }

  function pct(a, b) { return b ? +(100 * a / b).toFixed(1) : null; }

  return { runEval, buildCharMaps, isCJK };
});

// ---- node CLI ----
if (typeof module !== 'undefined' && require.main === module) {
  const fs = require('fs');
  const path = require('path');
  const ROOT = path.join(__dirname, '..', '..');
  const SmartDecoder = require(path.join(ROOT, 'smart/js/decoder.js'));
  const { runEval } = module.exports;

  const args = process.argv.slice(2);
  const opts = {};
  let jsonOut = null;
  let wordDbPath = path.join(ROOT, 'smart/data/word_db.json');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') jsonOut = args[++i];
    else if (args[i] === '--wordDb') wordDbPath = args[++i];
    else if (args[i].startsWith('--')) opts[args[i].slice(2)] = parseFloat(args[++i]);
  }

  const data = {
    dayiRaw: JSON.parse(fs.readFileSync(path.join(ROOT, 'smart/data/dayi_db.json'), 'utf8')),
    wordDb: JSON.parse(fs.readFileSync(wordDbPath, 'utf8')),
    charBigram: JSON.parse(fs.readFileSync(path.join(ROOT, 'smart/data/char_bigram.json'), 'utf8')),
    testset: JSON.parse(fs.readFileSync(path.join(__dirname, 'testset.json'), 'utf8')),
  };
  const rep = runEval(SmartDecoder, data, opts);
  console.log('===== WebDayi Smart 評測結果 =====');
  for (const k in rep.summary) console.log(`  ${k}: ${rep.summary[k]}`);
  console.log('\n----- 錯誤句(前 15)-----');
  for (const e of rep.errors.slice(0, 15)) {
    console.log(`  ${e.sent} → ${e.got}   ${e.errs.map(x => `[${x.pos}]${x.truth}→${x.got}`).join(' ')}`);
  }
  if (rep.totals.skipped.length) {
    console.log('\n----- skipped -----');
    for (const s of rep.totals.skipped) console.log(`  ${s.sent}: ${s.reason}`);
  }
  if (jsonOut) {
    fs.writeFileSync(jsonOut, JSON.stringify(rep, null, 1));
    console.log(`\nreport written to ${jsonOut}`);
  }
}
