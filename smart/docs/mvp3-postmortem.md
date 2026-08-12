# MVP3 Smart Engine 驗屍報告(Postmortem)

**日期**:2026-08-12
**對象**:`/mvp3-smart-engine/`(viterbi.js v1.0 + ngram_db.json v1.0),封存前驗屍
**症狀(作者實際使用)**:選字穩定選錯,而且選出來的都不是常用字
**結論:死因 (b) — 方向是解碼(正確),但資料品質不足,並疊加計分公式缺陷**

---

## 一、分類判定

Handoff 三分類:(a) 方向仍是預測 / (b) 方向是解碼但資料品質不足 / (c) 引擎資料堪用但 UX 死掉。

- **不是 (a)**:mvp3 的 Viterbi 是對「使用者已按下的碼序列」解碼(盲打 → Space → 整句),
  方向正確。本 handoff 的解碼理論不受影響。
- **是 (b),為主因**:bigram 資料由 **rime-essay 的詞頻表(lexicon)** 建出,不是連續語料,
  跨詞轉移系統性缺失;unigram(字頻)同源,口語常用字被系統性低估。
- **疊加計分缺陷(引擎面)**:t≥1 位置**完全沒有字頻項**,且未見 bigram 給死刑罰分
  (flat 1e-10),等效於 MVP2「上下文絕對優先」的結構性重現——這正是症狀的直接機轉。
- **(c) 也部分成立但非主因**:mvp3 從無修正 UI 與全碼逃生口,但就算 UX 完美,
  上述資料+計分問題也會讓它死。

**依 handoff 指示,死因 (b) ⇒ Phase 2 的診斷與資料修正提前到 Phase 1 之前:
先用評測 harness 離線驗證通過 85% 門檻,才開始寫新引擎與 UI。**

---

## 二、證據

### 證據 1:t≥1 位置沒有字頻項,未見 bigram 拿死刑罰分(頭號機轉)

程式位置:`mvp3-smart-engine/viterbi.js` `forwardPass()`(封存後為
`archive/mvp3-smart-engine/viterbi.js:80`):

```js
const bigramProb = ngramDb.bigrams[bigram] || 1e-10;   // 未見 → log(1e-10) ≈ -23
const prob = dp[t-1][prevChar] + Math.log(bigramProb); // 式子裡沒有 unigram/字頻
```

- 只有位置 0 用 unigram(`initializeDP`);之後每個位置**只看 bigram**。
- 未見 bigram 全部拿同一個 -23 分:
  - 若某冷僻候選恰好有 bigram entry(哪怕機率很小),它**絕對壓過**所有無 entry 的常用字
    ——「上下文絕對優先」的結構性等價物,與 handoff 頭號嫌犯的預測完全吻合。
  - 若所有候選都沒有 entry,**全部同分**,選字由物件遍歷順序決定,連字頻排序都沒有
    (嫌犯 3:頻率項不存在)。
- 正解應為 backoff 到打折的 unigram,而非 0 也非死刑(嫌犯 2 成立)。

### 證據 2:實測重現(2 碼前綴 lattice,模擬歧義場景)

驗屍腳本以 `mvp2-predictive/data/dayi_db.json` 建 2 碼前綴索引
(1,550 個碼位,平均 9.3 個候選),用 mvp3 原版 viterbi 解碼 15 句台灣常用句。
節錄兩個定罪案例(引擎分 = mvp3 實際使用的唯一項):

**案例 A:「你吃飯了嗎」→ 引擎輸出「你咋餓了嗎」**(位置 1,碼 `o2`,前字「你」)

| 候選 | unigram | bigram(你→候選) | 引擎分 |  |
|---|---|---|---|---|
| 咋 | 4.31e-5 | **3.12e-4(有 entry)** | **-8.07** | ← 引擎選了 |
| 吃 | 4.88e-6 | MISS → 1e-10 | -23.03 | ★ 正解 |

「你咋」在詞頻表裡有(源自詞條內字對),「你吃」是跨詞搭配、詞表沒有 →
**有垃圾 bigram entry 的冷僻字絕對優先壓過無 entry 的常用字**。

**案例 B:「我要去台北」→ 引擎輸出「我要去台上」**(位置 4,碼 `9e`,前字「台」)

所有候選(上/北/卡/蹤/踐/…)bigram 全 MISS → 全部同分 -23.03 →
選了遍歷順序第一個「上」。字頻(北 6.9e-4 vs 趶 3.3e-7)完全沒有進入式子。

### 證據 3:bigram 資料源是詞頻表,不是語料(資料面根因)

程式位置:`converter/build_ngram_lib.py` `count_bigrams()`(約 237–262 行):

```python
for phrase, freq in entries:          # entries 來自 essay.txt「詞\t頻次」
    for i in range(len(phrase) - 1):
        bigram = phrase[i:i+2]        # 只取「詞條內部」相鄰字對
        bigram_counts[bigram] += freq
```

- `essay.txt` 是 rime-essay 的**詞頻表**(376,195 個詞條),不是連續文本。
- 因此 bigram 只涵蓋詞內轉移:「時候」「我們」有;**「你吃」「易在」這類跨詞轉移一律缺失**。
- 冷僻字若出現在低頻詞條中,其條件機率 P(c2|c1) 反而因分母小而被灌高
  (如「〇〇」= 0.0565)。
- 對「預測下一個詞」這種 lexicon 可以;對「逐字解碼」的消歧義,跨詞轉移是主戰場,
  這份 bigram 天生不合用。

### 證據 4:unigram(字頻)同源,口語常用字被系統性低估

`ngram_db.json` 的 unigrams 與 `mvp2-predictive/data/freq_map.json` 逐字相同
(均由 essay.txt 詞頻加權統計而來)。抽查:

| 字 | essay unigram | 對照感受 |
|---|---|---|
| 吃 | 4.88e-6 | 極常用口語字,卻低於「咋」(4.31e-5)近 10 倍 |
| 咋 | 4.31e-5 | 冷僻(台灣語境),卻高於「吃」 |

詞頻表偏書面/詞彙型統計,單字口語用字(吃、喝、你…的口語搭配)權重失真。
這就是 Phase 2「詞頻不好用」體感的量化證據。

### 對照組:無歧義時引擎正確(排除 Viterbi 實作本身寫錯)

同一顆引擎用**全碼(4 碼)**解同 15 句 → **100%(83/83)**。
全碼幾乎唯一候選、無消歧義需求,證明 DP/backtrack 機械部分無 bug;
死因在計分公式與資料,不在演算法骨架。

### 附註:血緣澄清

`archive/mvp1_legacy/viterbi_module.js`(v2.7 Hybrid)已引入 70/30 unigram/bigram
加權 + Laplace smoothing,部分修掉證據 1 的計分缺陷;但它餵的仍是同一份
lexicon-based ngram_db,案例 A 類錯誤(垃圾 bigram entry 壓過常用搭配)依然成立
——Laplace 只把未見 pair 的罰分變均勻,救不了「見到的 pair 本身是偏的」。
此為死因 (b) 的最終定性:**换公式救不了,要修資料。**

---

## 三、對後續工序的影響

1. **先建評測 harness(`/smart/tests/`),離線驗證資料 + 計分通過 top-1 ≥ 85%,
   才准開始寫 /smart/ 的新引擎與 UI**(handoff 死因 b 的指定路徑)。
2. 新計分公式基線:`log P(字)`(unigram)+ `λ·log P(字ᵢ|字ᵢ₋₁)`,
   未見 bigram **backoff 到打折的 unigram**,不給 0、不給死刑。
3. 資料修正候選方向(Phase 2 評測決定):
   - 以現有 lexicon 正確的用法使用它:**詞級 lattice 解碼**(詞內不需要跨詞 bigram),
     跨詞邊界才用字 bigram/unigram;
   - 或重建語料級字 bigram(台灣正體語料;McBopomofo / libchewing 資料源候補)。
4. 可重用資產(已抽出至 `/smart/data/`):碼表 `dayi_db.json`、
   `ngram_pruned.json`(unigram+bigram,重建前的基線)、使用者習慣層
   (`user_history.js` 邏輯)。`bigram_lite.json` 為預測型格式(char→首碼→char),
   不適用 Viterbi 計分,僅留作參考。

**驗屍腳本**:見 `/smart/tests/`(由驗屍用腳本整理而來,可重跑上述數字)。
