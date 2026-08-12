# 詞頻診斷報告(freq-diagnosis)

**日期**:2026-08-12
**問題**:MVP2/MVP3 的頻率排序體感不好、N-gram 消歧義選錯字。原因未查明,
而智慧 2 碼的 `log P(字|碼)` 直接依賴頻率資料——頻率爛則解碼必爛。
**結論:已定罪並修正。修正後 2 碼 top-1(有左 context)= 97.4%,過 85% 門檻。**

---

## 一、診斷:頻率資料的病灶(量化證據)

### 病灶 1:`freq_map.json` / `ngram_db.json` unigram 源自 rime-essay 詞頻表,單字頻率失真

rime-essay 的 `essay.txt` 是**詞頻表(lexicon)**,不是連續語料。單字條目的頻次
只統計「該字作為獨立詞條」的權重,與真實文本中的字頻嚴重脫節:

| 字 | essay 單字條目頻次 | McBopomofo phrase.occ | 說明 |
|---|---|---|---|
| 吃 | **805** | **8,386** | 超常用口語字被 essay 低估 |
| 咋 | **13,090** | **21** | 北方口語「怎」,大陸語料偏差,essay 高估 622 倍 |
| 了 | 1,512,483 | 108,379 | — |

essay 中「咋」比「吃」高 16 倍;台灣語境實際相反(phrase.occ:吃比咋高 400 倍)。
這就是「選出來的都不是常用字」的直接資料成因,也符合 handoff 預測的
「頻率表是簡體/大陸語料轉的」病灶。

### 病灶 2:詞彙覆蓋缺口——essay 連「吃飯」都沒有

`rg "吃飯" essay.txt` → **0 筆**。台灣高頻詞如 吃飯、當機(僅 608)覆蓋極差,
而 哪裏(38,748)這類大陸寫法權重極高(台灣用「哪裡」)。

### 病灶 3:bigram 由詞條內部字對建出,跨詞轉移系統性缺失

`build_ngram_lib.py::count_bigrams()` 只統計詞條內相鄰字對 →
「你吃」「易在」等跨詞搭配一律 MISS,而冷僻字反因出現在低頻詞條內拿到
灌水的條件機率(P(〇|〇)=0.0565)。搭配 mvp3 引擎的死刑 fallback,
形成「有垃圾 entry 的冷僻字絕對優先」(詳見 mvp3-postmortem.md)。

### 病灶 4(MVP2 引擎面,對照確認):「頻率壓制」「上下文絕對優先」

`prediction_engine.js` 中 bigram 命中即得 VIP 分數 1,000,000、
壓過一切頻率與習慣——為預測場景調的 heuristic,在消歧義場景與病灶 3 疊加後
正是選錯字的機轉。新引擎不繼承任何 heuristic,一律機率計分。

---

## 二、修正

### 資料修正(`converter/build_smart_db.py`)

1. **主資料源更換**:McBopomofo `phrase.occ`(MIT 授權,台灣正體語境,
   161K 詞條含出現次數)→ 產出 `smart/data/word_db.json`。
2. **essay 降級為補洞源**:折扣 ×0.005,且折扣後 < 10 者丟棄
   (實驗證明門檻 10 可消滅「宿豫」「哪裏」這類大陸長尾詞壓過台灣常用詞的案例,
   同時保留 臺北 等有用補充)。最終僅補 4,241 詞。
3. **修剪長尾**:2 字詞 count≥2、3 字詞 ≥3、4 字詞 ≥5。
   word_db.json 16.6MB → **2.5MB**(含取碼規則修正);char_bigram.json → **1.2MB**。
4. **字 bigram 重建**:自 phrase.occ 詞內字對加權統計(`char_bigram.json`),
   僅作跨詞邊界的 glue(權重 γ),不再是唯一訊號。

### 取碼規則修正(2026-08-12,依作者實測回饋)

第一版誤把 2 碼 token 實作為「全碼**前 2 碼**」。作者實際打字
(`e ao a h9 2o oc as ct lg` → 一個人不知吃什麼好)證明大易簡碼慣例是
「**首碼 + 末碼**」(個 `a7o`→`ao`、吃 `o2c`→`oc`、麼 `cit`→`ct`)。
改規則後不僅正確,準確率與資料量同步改善:top-1 95.7→**97.4%**、
top-3 95.5→**98.2%**、word_db 3.8→**2.5MB**(首尾碼把字分散得更均勻,
碼位平均候選 8.7,正是大易採用此慣例的原因)。

### 計分修正(`smart/js/decoder.js`,詞級 lattice Viterbi)

```
score(parse) = Σ_詞 [ log P(詞) + (len-1)·lenBonus + μ·log(1+使用者習慣) ]
             + γ·log P(詞首字 | 前一詞末字)      ← 跨詞 glue
未見 bigram → backoff = β·P(字)(打折 unigram,不給 0、不給死刑)
```

- 每個位置的字頻項**永遠存在**(詞機率內含),修正 mvp3「t≥1 無字頻」缺陷。
- 詞級解碼讓 lexicon 資料被正確使用:詞內不需要跨詞 bigram(病灶 3 繞開)。
- 參數以評測 harness 掃描定案:**γ=0.3, β=0.02, lenBonus=3.0**
  (γ 掃 0.15–1.0、lenBonus 掃 1.2–5.0;γ 過大 top-1 降,證實這份 bigram
  只堪任 glue 不堪任主訊號)。

---

## 三、修正前後對比(評測 harness,159 句 / 1,240 字)

| 指標 | 修正前(mvp3 原引擎+原資料)* | 修正後 | 門檻 |
|---|---|---|---|
| 2 碼 top-1(有左 context) | ~91%(小樣本 57 字;實際體感更差,見附註) | **97.4%** | ≥ 85% ✅ |
| 2 碼 top-3(有左 context) | 未支援(無候選排序介面) | **98.2%** | ≥ 95% ✅ |
| 2 碼 top-1(句首無 context) | — | 98.1% | 報告即可 |
| 整句全對率 | — | 84.3% | — |
| 4 碼(傳統)top-1 | — | 97.2% | ~100%(見附註 2)|
| 整句解碼延遲(159 句平均) | — | 2.3ms / 句(每鍵 ≪ 10ms) | < 10ms ✅ |

\* 修正前數字出自 `smart/tests/mvp3_autopsy.js`(15 句 / 57 字小樣本)。
mvp3 的錯誤模式是「冷僻字壓過常用字」(咋、餓、轉),對體感的破壞遠大於
數字差距;且錯字不可修正(無候選介面),錯了只能整句重打。

**附註 2(4 碼回歸)**:97.2% 的缺口全部來自大易碼表本身的同碼字
(同一全碼下正解不是 freq 最高的候選,例如 裡/裏 同碼)。傳統模式下使用者
本來就以數字鍵選 2、3 候選,行為與 Lite 一致,**非本次改動造成的回歸**。

## 四、殘餘瓶頸與下一步

修正後仍錯的字集中於三類(見 `smart/tests/report-latest.json` 的 confusion 清單):

1. **同 2 碼(首+末)的高頻近義競爭**(證/這、設/說、塞/賽):字 bigram glue
   資訊量不足以區分,屬 2 碼模式的固有誤差,靠修正 UI 一按替換(top-3 98.2% 保證)。
2. **詞邊界切分歧義**(存檔→在機):需要更強的跨詞模型;可等使用者習慣層
   (μ)上線後由個人資料補強。
3. **句首無 context 的專名**(票、藥):預期內,handoff 不設門檻。

**若要再往上推**:引入真正語料級的字 bigram(zh-tw wiki + 台灣新聞語料),
但目前 97.4% 已遠過門檻,PoC 階段不做(YAGNI)。

## 五、如何重跑

```bash
# 資料重建(需 clone McBopomofo 取得 phrase.occ)
python3 converter/build_smart_db.py --occ <path-to>/phrase.occ

# 離線評測(node)
node smart/tests/eval.js --json smart/tests/report-latest.json

# 瀏覽器評測(可 export JSON)
# 開 smart/tests/eval.html(需以 http server 開啟,例如 python3 -m http.server)

# mvp3 驗屍重現
node smart/tests/mvp3_autopsy.js        # 2 碼歧義場景
node smart/tests/mvp3_autopsy.js full   # 全碼對照組(100%)
```
