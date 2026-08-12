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
| **空白 = 斷字** | 有待配對碼時:當成**單碼字**(一、大、火、車…84 個部首字)結束該字。沒有待配對碼時第 1 下不動作 —— 空白是斷字鍵,不是送出鍵 |
| **選字 / 修正** | 候選列**預設對準剛打的那個字**,直接按選字鍵即可換掉,不必先點。要改前面的字就點該字(或 ←/→ 移游標)。替換後該字鎖定(綠線),右側以新 context 重跑 Viterbi |
| **選字鍵**(大易/Lite 傳統配置) | `空白`=第 1、`'`=第 2、`[`=第 3、`]`=第 4、`-`=第 5、`\`=第 6、`=`=換頁。**數字鍵是大易碼,不當選字鍵** |
| **全碼逃生口** | <code>`</code> 進入全碼模式:打全碼 1–4 鍵,用同一組選字鍵選字並鎖定。專有名詞與冷僻字用這裡 |
| 退格 | 依序取消:全碼鍵 → 待配對鍵 → 游標 → 最後一個字 |
| **送出** | **連按兩下空白**(400ms 內),或 `Enter`,或單擊 `Alt`。送出後**自動複製**到剪貼簿(選單可關)。手機版因此不需要獨立的送出鍵 |
| **中 / 英切換** | 鍵盤上的 🌐 地球鍵(位置與 Lite 相同)。英數模式下按鍵直接輸出字母 |

### UI 功能(與 Lite 對齊)

| 功能 | 說明 |
|---|---|
| **Mini 模式** | IME 式兩列:第 1 列=待配對碼+緩衝區+候選(整條可拖曳視窗,支援桌面 PWA 的 window-controls-overlay),第 2 列=輸出;**不放虛擬鍵盤**,與 Lite 相同。**連按兩下 `Ctrl` 切換**或 `Esc` 離開;右上角標籤點一下切中/英 |
| **版面穩定** | Mini 的左半邊(碼+暫定字)是**固定寬度**坑位,候選列永遠從同一個位置開始,不會被輸入推著跑;碼區與待配對格也各有固定寬度 |
| **呼吸游標** | 緩衝區尾端有 Lite 的 `_` 閃爍游標(1.2s),主 UI 與 Mini 都有 |
| **`Ctrl` 熱鍵** | 單擊 = 複製輸出到剪貼簿;500ms 內連按兩下 = 切換 Mini 模式(Lite 同規格) |
| **`Alt` 熱鍵** | 單擊 = 送出並複製;300ms 內連按兩下 = **清除緩衝區**(緩衝區已空時清空輸出)。Alt+Tab 不受影響 |
| **專注模式** | 隱藏頁首與狀態列,只留輸入相關區塊 |
| **送出後自動複製** | 預設開啟,送出即進剪貼簿並閃綠回饋(等同 Lite 的 Auto Copy) |
| 虛擬鍵盤 | **與 Lite 相同的幾何與鍵位**:滿版、貼底、按鍵撐滿整列(高 48px,桌面 56px)。⇧ 的位置放「全碼」,🌐 維持中/英切換。上半部內容區自行捲動,鍵盤永遠固定在下方 |
| **PWA** | 比照 Lite:`manifest.json`(standalone、window-controls-overlay)、本地 icon、iOS meta,可「加入主畫面」當獨立 App 用 |
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
├── manifest.json       # PWA(比照 Lite)
├── icon.svg / icon-192.png / icon-512.png / favicon.ico
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
    ├── freq-diagnosis.md   # 詞頻診斷與修正報告
    └── mini-mockups.html   # Mini 條四款版面提案(A/B 比較頁,可直接開)
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

## Mini 條版面 A/B(進行中)

`docs/mini-mockups.html` 用**同一段真實輸入**(句子「預設值不知要設定」,候選取自實際 decoder)
同步演示四款 Mini 條版面,可切換寬/窄視窗、逐鍵播放,比較「視線距離、版面抖動、
窄視窗先犧牲什麼」:

| | 提案 | 一句話 |
|---|---|---|
| **A** | 現況:格子 + 有框候選 | 每字一格、可點可看碼,但讀不成句、候選佔位大 |
| **B** | 右靠齊、候選去框 | 最新的字永遠貼著分隔線,視線不用來回;同寬度多放 2–3 個候選 |
| **C** | Inline composition | 暫定字寫在輸出行(底線標未定),上列整條給候選,最接近系統 IME |
| **D** | 聚焦:只留正在打的字 | 寬度需求最低,但看不到整句,失去「後面改前面」的回饋 |

建議:**B 當對照組、C 當實驗組**實測;D 留給極窄視窗自動降級,A 保留為基準線。
頁面上按「選這款」會把選擇寫進 `localStorage.webdayi_smart_mini_variant`,決定後照它實作。

## 下一步(PoC 驗證後)

- [ ] Mini 條版面依 A/B 結果定案(B / C)
- [ ] 頁內「傳統(4 碼)/ 智慧(2 碼)」模式切換(傳統模式重用 Lite 引擎)
- [ ] 使用者習慣層權重調校(μ)與個人詞庫匯出
- [ ] 語料級字 bigram(zh-tw 語料)再推準確率
