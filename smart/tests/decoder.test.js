/** SmartDecoder 單元測試:node smart/tests/decoder.test.js */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SmartDecoder = require(path.join(ROOT, 'smart/js/decoder.js'));
const { buildCharMaps } = require(path.join(__dirname, 'eval.js'));

const dayiRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'smart/data/dayi_db.json'), 'utf8'));
const wordDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'smart/data/word_db.json'), 'utf8'));
const charBigram = JSON.parse(fs.readFileSync(path.join(ROOT, 'smart/data/char_bigram.json'), 'utf8'));
const { charToToken } = buildCharMaps(dayiRaw);

let pass = 0, fail = 0;
function t(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}  ${detail || ''}`); }
}
const tokensOf = s => [...s].map(c => charToToken[c]);

const dec = new SmartDecoder(wordDb, charBigram);

// 基本解碼
let r = dec.decode(tokensOf('今天天氣很好'));
t('解碼 今天天氣很好', r.text === '今天天氣很好', r.text);
r = dec.decode(tokensOf('你吃飯了嗎'));
t('解碼 你吃飯了嗎(mvp3 曾錯為 你咋餓了嗎)', r.text === '你吃飯了嗎', r.text);
r = dec.decode(tokensOf('我要去台北'));
t('解碼 我要去台北(mvp3 曾錯為 台上)', r.text === '我要去台北', r.text);

// 單碼字(火 車 一 大 等 1 鍵字)
r = dec.decode(tokensOf('火車快要出發了'));
t('解碼含單碼字 火車快要出發了', r.text === '火車快要出發了', r.text);

// 單 token
r = dec.decode(tokensOf('好'));
t('單 token 解碼有輸出', r.chars.length === 1, JSON.stringify(r));

// pinned(全碼逃生口):把第 2 字固定為冷僻字,解碼不得改動它
const tk = tokensOf('你吃飯');
r = dec.decode([tk[0], { pinned: '喫' }, tk[2]]);
t('pinned 字保留', r.chars[1] === '喫', r.text);
t('pinned 前後仍解碼', r.chars.length === 3, r.text);

// candidatesAt:修正 UI 候選
const cands = dec.candidatesAt(charToToken['吃'], '你', 9);
t('candidatesAt 回傳候選', cands.length > 0);
t('candidatesAt 含正解 吃', cands.some(c => c.char === '吃'), JSON.stringify(cands.map(c => c.char)));
t('candidatesAt 吃 在 top-3', cands.slice(0, 3).some(c => c.char === '吃'), JSON.stringify(cands.slice(0, 3).map(c => c.char)));

// 空輸入
r = dec.decode([]);
t('空輸入不炸', r.text === '' || r.failed === true, JSON.stringify(r));

// 未知 token(碼表沒有的組合)→ failed,不炸
r = dec.decode(['!!']);
t('未知 token 回報 failed', r.failed === true, JSON.stringify(r));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
