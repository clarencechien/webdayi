# WebDayi Smart — 智慧 2 碼(PoC)

**狀態**:PoC v0.1.0(開發中)
**網址**:`https://clarencechien.github.io/webdayi/smart/`
**定位**:每個字只打**前 2 碼**,由語言模型解碼消歧義。與 `/lite/`(傳統 4 碼穩定版)並存,互不影響。

---

## 為什麼是 2 碼(而不是 Smart Compose)

MVP2 Smart Compose 做的是「預測未知」:從前一個字猜使用者還沒表達的下一個字,
中文 bigram 條件熵 4–5 bits,top-1 天生只有一兩成,已封存(`archive/mvp2-predictive/`)。

智慧 2 碼是「**解碼已知**」:使用者已經按了 2 碼,候選被壓到平均約 8 個,
收斂到 1 個只需 ~3 bits——同一份語言模型資料,消歧義綽綽有餘。
理論與驗屍見 `docs/mvp3-postmortem.md`、`docs/freq-diagnosis.md`。

## 輸入行為

| 操作 | 行為 |
|---|---|
| 連續打碼 | 每 **2 鍵 = 一個字**,不用空白切碼。緩衝區即時顯示 Viterbi 目前最佳句(虛線=暫定,會隨後續輸入回頭修正,這是預期行為) |
| **單碼字**(一、大、火、車…84 個部首字) | 打該鍵 + **空白**(維持每字固定節奏) |
| **修正** | 點緩衝區的字(或 ←/→ 移游標)→ 候選列出 → **數字鍵 1–9 替換**。替換後該字鎖定(綠線),右側以新 context 重跑 Viterbi |
| 解除鎖定 | 點鎖定字 → 候選列的「↺ 解除鎖定」 |
| **全碼逃生口** | <code>`</code> 進入全碼模式:打全碼 1–4 鍵,**空白**選第 1 候選(`' [ ] - \ =` 選 2–7)。專有名詞與冷僻字用這裡 |
| 退格 | 依序取消:全碼鍵 → 待配對鍵 → 游標 → 最後一個字 |
| **送出** | Enter(或「送出」鈕)把緩衝區附加到輸出區;**Copy** 鈕交付剪貼簿(與 Lite 相同) |

## 架構

```
smart/
├── index.html          # UI(單頁,無 build step)
├── js/
│   ├── decoder.js      # 詞級 lattice Viterbi(UMD,node/browser 通用)
│   ├── app.js          # UI 狀態機與事件
│   └── user_history.js # 使用者習慣層(localStorage,抽自 mvp2)
├── data/
│   ├── dayi_db.json    # 大易碼表(rime-dayi;全碼模式用)
│   ├── word_db.json    # 詞庫 3.8MB(McBopomofo phrase.occ 為主,essay 補洞)
│   └── char_bigram.json# 字 bigram 1.2MB(跨詞 glue)
├── tests/
│   ├── eval.js / eval.html / testset.json  # 評測 harness(node CLI + 瀏覽器,可 export JSON)
│   ├── decoder.test.js # 引擎單元測試
│   └── mvp3_autopsy.js # mvp3 驗屍重現腳本
└── docs/
    ├── mvp3-postmortem.md  # MVP3 驗屍報告
    └── freq-diagnosis.md   # 詞頻診斷與修正報告
```

**計分**(詳見 `docs/freq-diagnosis.md`):

```
score = Σ_詞 [ log P(詞) + 詞長獎勵 + μ·log(1+使用者習慣) ] + γ·log P(詞首字|前字)
未見 bigram → backoff 到打折 unigram(β),永不判死刑
```

## 評測結果(159 句 / 1,240 字,harness 可重跑)

| 指標 | 結果 | 門檻 |
|---|---|---|
| 2 碼 top-1(有左 context) | **95.7%** | ≥ 85% ✅ |
| 2 碼 top-3(有左 context) | **95.5%** | ≥ 95% ✅ |
| 句首(無 context)top-1 | 97.5% | 報告即可 |
| 4 碼(傳統)top-1 | 97.2%* | ~100% |
| 每鍵處理延遲(真瀏覽器實測) | ~1ms | < 10ms ✅ |

\* 缺口全部來自大易碼表固有同碼字(與 Lite 行為相同),非回歸。

```bash
node smart/tests/eval.js              # 離線評測
node smart/tests/decoder.test.js      # 單元測試
# 瀏覽器:以 http server 開 smart/tests/eval.html,可 export JSON
```

## 與 Lite 的關係

- Lite 是穩定版,URL、UI、行為完全不動。
- Smart 是獨立目錄、獨立頁面;純 client-side、無 build step,push 即部署。
- 資料庫約 5MB(gzip 後 ~1.5MB),首次載入後由瀏覽器快取。

## 下一步(PoC 驗證後)

- [ ] 頁內「傳統(4 碼)/ 智慧(2 碼)」模式切換(傳統模式重用 Lite 引擎)
- [ ] 使用者習慣層權重調校(μ)與個人詞庫匯出
- [ ] 語料級字 bigram(zh-tw 語料)再推準確率
