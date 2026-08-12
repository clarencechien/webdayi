/**
 * mvp3 驗屍腳本:重現封存的 MVP3 Smart Engine 選字錯誤,列印分項分數。
 * 報告:/smart/docs/mvp3-postmortem.md
 *
 * 用法:node smart/tests/mvp3_autopsy.js        # 2 碼前綴場景(歧義,重現錯誤)
 *       node smart/tests/mvp3_autopsy.js full  # 全碼場景(對照組,應 100%)
 */
const fs = require('fs');
const path = require('path');
const REPO = path.join(__dirname, '..', '..');
const { viterbi } = require(path.join(REPO, 'archive/mvp3-smart-engine/viterbi.js'));

const dayiRaw = JSON.parse(fs.readFileSync(path.join(REPO, 'smart/data/dayi_db.json'), 'utf8'));
const ngramDb = JSON.parse(fs.readFileSync(path.join(REPO, 'archive/mvp3-smart-engine/ngram_db.json'), 'utf8'));

const fullCodeMode = process.argv[2] === 'full';

// 反查表:字 -> 全碼(最長碼)
const charToCode = {};
for (const [code, cands] of Object.entries(dayiRaw)) {
  for (const c of cands) {
    if (!charToCode[c.char] || code.length > charToCode[c.char].length) charToCode[c.char] = code;
  }
}

// 2 碼前綴索引:prefix2 -> [{char, freq}...]
const prefixIndex = new Map();
for (const [code, cands] of Object.entries(dayiRaw)) {
  if (code.length < 2) continue;
  const p = code.slice(0, 2);
  if (!prefixIndex.has(p)) prefixIndex.set(p, new Map());
  const m = prefixIndex.get(p);
  for (const c of cands) {
    if (!m.has(c.char) || m.get(c.char) < (c.freq || 0)) m.set(c.char, c.freq || 0);
  }
}
const prefixDb = new Map();
for (const [p, m] of prefixIndex) {
  prefixDb.set(p, [...m.entries()].map(([char, freq]) => ({ char, freq })));
}

const fullDb = new Map(Object.entries(dayiRaw));

if (!fullCodeMode) {
  const sizes = [...prefixDb.values()].map(v => v.length).sort((a, b) => a - b);
  const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  console.log(`2 碼前綴碼位: ${prefixDb.size},平均候選 ${avg.toFixed(1)},中位數 ${sizes[Math.floor(sizes.length / 2)]},最大 ${sizes[sizes.length - 1]}\n`);
}

const sentences = [
  '今天天氣很好', '我們明天見面', '謝謝大家', '請問現在幾點', '我要去台北',
  '這是一個測試', '你吃飯了嗎', '老師說明天考試', '公司開會時間', '希望一切順利',
  '中文輸入方法', '電腦程式設計', '下班回家休息', '生日快樂', '不好意思'
];

let total = 0, wrong = 0;
const errorCases = [];
for (const sent of sentences) {
  const chars = [...sent];
  const full = chars.map(c => charToCode[c]);
  if (full.some(c => !c || (!fullCodeMode && c.length < 2))) { console.log(`SKIP ${sent}(碼表缺字或碼長不足)`); continue; }
  const codes = fullCodeMode ? full : full.map(c => c.slice(0, 2));
  const db = fullCodeMode ? fullDb : prefixDb;
  let result;
  try { result = viterbi(codes, db, ngramDb); }
  catch (e) { console.log(`ERROR ${sent}: ${e.message}`); continue; }
  total += chars.length;
  const predicted = [...result.sentence];
  const errs = [];
  chars.forEach((c, i) => { if (predicted[i] !== c) { wrong++; errs.push(i); } });
  console.log(`${sent}  →  ${result.sentence}  ${errs.length ? '✗ 錯' + errs.length + '字' : '✓'}`);
  errs.forEach(i => errorCases.push({ sent, codes, chars, predicted, pos: i }));
}
console.log(`\n${fullCodeMode ? '全碼(對照組)' : '2 碼場景(mvp3 原始 scoring)'}字準確率: ${(100 * (total - wrong) / total).toFixed(1)}% (${total - wrong}/${total})\n`);

if (!fullCodeMode && errorCases.length) {
  console.log('====== 錯字案例分項分數(前 10)======');
  for (const ec of errorCases.slice(0, 10)) {
    const { sent, codes, chars, predicted, pos } = ec;
    const cands = prefixDb.get(codes[pos]);
    const prevPred = pos > 0 ? predicted[pos - 1] : null;
    console.log(`\n句「${sent}」位置 ${pos}:應為「${chars[pos]}」選了「${predicted[pos]}」(碼 ${codes[pos]},前字暫定「${prevPred || '無(句首)'}」)`);
    const rows = cands.map(cand => {
      const uni = ngramDb.unigrams[cand.char];
      const bg = prevPred ? ngramDb.bigrams[prevPred + cand.char] : undefined;
      const engineScore = pos === 0 ? Math.log(uni || 1e-10) : Math.log(bg || 1e-10);
      return { char: cand.char, uni, bg, engineScore };
    }).sort((a, b) => b.engineScore - a.engineScore).slice(0, 8);
    for (const r of rows) {
      const mark = r.char === chars[pos] ? '★正解' : (r.char === predicted[pos] ? '←引擎選了' : '');
      console.log(`  ${r.char}  unigram=${r.uni === undefined ? 'MISS' : r.uni.toExponential(2)}  bigram=${r.bg === undefined ? (prevPred ? 'MISS→1e-10' : 'n/a') : r.bg.toExponential(2)}  引擎分=${r.engineScore.toFixed(2)}  ${mark}`);
    }
  }
}
