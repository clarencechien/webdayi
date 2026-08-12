# WebDayi Smart — 智慧 2 碼(PoC)

**狀態**:PoC v0.2.0(開發中,UX 已與 Lite 對齊)
**網址**:`https://clarencechien.github.io/webdayi/smart/`
**定位**:每個字只打 **2 碼(首碼+末碼)**,由語言模型解碼消歧義。與 `/lite/`(傳統 4 碼穩定版)並存,互不影響。

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
| 連續打碼 | 每 **2 鍵 = 一個字**,取碼 = **首碼 + 末碼**(大易簡碼慣例,如 吃 `o2c` → `oc`),不用空白切碼。緩衝區即時顯示 Viterbi 目前最佳句(虛線=暫定,會隨後續輸入回頭修正,這是預期行為) |
| **單碼字**(一、大、火、車…84 個部首字) | 打該鍵 + **空白**(維持每字固定節奏)。完整 token 之後多打的空白會被忽略(no-op),不會錯位 |
| **選字 / 修正** | 候選列**預設對準剛打的那個字**,直接按選字鍵即可換掉,不必先點。要改前面的字就點該字(或 ←/→ 移游標)。替換後該字鎖定(綠線),右側以新 context 重跑 Viterbi |
| **選字鍵**(大易/Lite 傳統配置) | `空白`=第 1、`'`=第 2、`[`=第 3、`]`=第 4、`-`=第 5、`\`=第 6、`=`=換頁。**數字鍵是大易碼,不當選字鍵** |
| **全碼逃生口** | <code>`</code> 進入全碼模式:打全碼 1–4 鍵,用同一組選字鍵選字並鎖定。專有名詞與冷僻字用這裡 |
| 退格 | 依序取消:全碼鍵 → 待配對鍵 → 游標 → 最後一個字 |
| **送出** | `Enter`,或無待配對碼時按 `空白`(Lite 的空白確認肌肉記憶)。送出後**自動複製**到剪貼簿(選單可關) |

### UI 功能(與 Lite 對齊)

| 功能 | 說明 |
|---|---|
| **Mini 模式** | IME 式兩列:第 1 列=緩衝區+候選,第 2 列=輸出。適合小視窗/PWA 常駐。**連按兩下 `Ctrl` 切換**(與 Lite 相同),或 `Esc` / 點右上「易2」離開 |
| **`Ctrl` 熱鍵** | 單擊 = 複製輸出到剪貼簿;500ms 內連按兩下 = 切換 Mini 模式(Lite 同規格) |
| **專注模式** | 隱藏頁首與狀態列,只留輸入相關區塊 |
| **送出後自動複製** | 預設開啟,送出即進剪貼簿並閃綠回饋(等同 Lite 的 Auto Copy) |
| 虛擬鍵盤 | 部首標示的大易鍵盤,可收合;手機首屏不需捲動即可看到緩衝區+候選+鍵盤 |
| 深色模式 / 字級 | 跟隨系統,可手動切換;字級 80–160% |
| 清除選字習慣 | 一鍵清掉個人化權重(見下節) |

所有設定存在 `localStorage`,重載後保留。圖示用純 unicode,**不依賴外部字型**(離線可用)。

## 選字會「學起來」:使用者習慣權重

修正選字(以及送出)會記進個人習慣層(`localStorage`),解碼與候選排序都會加上
`μ·log(1 + 該字被你選過的次數)`(μ=2.0)。所以**同一個碼你手動改過幾次之後,
那個字就會自己跳出來**——這是刻意設計的個人化,不是 bug。

- 對數成長,不會無限膨脹;詞級解碼下不影響既有詞彙的判斷
  (例:把「查」選熟了,`本來`、`根本`、`日本人` 仍正確)。
- 想重設:選單 →「清除選字習慣」。

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
│   ├── word_db.json    # 詞庫 2.5MB(McBopomofo phrase.occ 為主,essay 補洞)
│   └── char_bigram.json# 字 bigram 1.2MB(跨詞 glue)
├── tests/
│   ├── eval.js / eval.html / testset.json  # 評測 harness(node CLI + 瀏覽器,可 export JSON)
│   ├── decoder.test.js # 引擎單元測試
│   ├── ui_smoke.js     # 真瀏覽器 UI 煙霧測試(Playwright)
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
| 2 碼 top-1(有左 context) | **97.4%** | ≥ 85% ✅ |
| 2 碼 top-3(有左 context) | **98.2%** | ≥ 95% ✅ |
| 句首(無 context)top-1 | 98.1% | 報告即可 |
| 4 碼(傳統)top-1 | 97.2%* | ~100% |
| 每鍵處理延遲(真瀏覽器實測) | ~1ms | < 10ms ✅ |

\* 缺口全部來自大易碼表固有同碼字(與 Lite 行為相同),非回歸。

```bash
node smart/tests/eval.js              # 離線評測(準確率)
node smart/tests/decoder.test.js      # 引擎單元測試(12 項)
node smart/tests/ui_smoke.js          # 真瀏覽器 UI 煙霧測試(30 項;需 npm i playwright)
# 瀏覽器:以 http server 開 smart/tests/eval.html,可 export JSON
```

## 與 Lite 的關係

- Lite 是穩定版,URL、UI、行為完全不動。
- Smart 是獨立目錄、獨立頁面;純 client-side、無 build step,push 即部署。
- 資料庫約 5MB(word_db 2.5MB + char_bigram 1.2MB + 碼表 1.5MB;gzip 後更小),
  首次載入後由瀏覽器快取。

## 下一步(PoC 驗證後)

- [ ] 頁內「傳統(4 碼)/ 智慧(2 碼)」模式切換(傳統模式重用 Lite 引擎)
- [ ] 使用者習慣層權重調校(μ)與個人詞庫匯出
- [ ] 語料級字 bigram(zh-tw 語料)再推準確率
