# Active Context: WebDaYi

**Last Updated**: 2026-08-12
**Current Focus**: WebDayi Smart(智慧 2 碼 PoC)
**Branch**: `claude/new-feature-handoff-91rr1n`

---

## 📊 Current Status

### 產品現況
- **WebDayi Lite**(`/lite/`):唯一穩定版,傳統 4 碼 PWA。**不動它**——任何改動
  都不准影響 `https://clarencechien.github.io/webdayi/lite/index.html` 的行為與 URL。
- **WebDayi Smart**(`/smart/`):本次新做的智慧 2 碼 PoC(連碼 2 碼 → Viterbi 解碼
  → 修正 UI → 全碼逃生口)。
- **MVP2(Smart Compose)**:已封存至 `archive/mvp2-predictive/`。
  死因:預測「未知」的結構性問題(bigram 條件熵 4–5 bits,top-1 天生一兩成)。
- **MVP3(N-gram Smart Engine)**:已封存至 `archive/mvp3-smart-engine/`。
  驗屍完成,死因 (b):方向是解碼(正確)但資料品質不足
  ——bigram 由 rime-essay 詞頻表建出、跨詞轉移系統性缺失,
  疊加計分缺陷(t≥1 無字頻項、未見 bigram 死刑罰分)。
  證據見 `smart/docs/mvp3-postmortem.md`,可用 `node smart/tests/mvp3_autopsy.js` 重跑。

### Phase 0(Repo 收尾)✅ 完成
- mvp3 驗屍報告完成(死因 b,附錯字重現與分項分數證據)。
- 可重用資產抽出至 `/smart/`:`data/dayi_db.json`(含真實字頻)、
  `data/ngram_pruned.json`(unigram+bigram 基線)、`data/freq_map.json`、
  `data/bigram_lite.json`(預測型格式,僅參考)、`js/user_history.js`(使用者習慣層)。
- `mvp2-predictive/`、`mvp3-smart-engine/`、`issue/`、`reference/` 移入 `archive/`,
  各附封存說明。`converter/` 保留(Phase 2 資料重建需要)。
- 根 `index.html` 跳轉修正(原指向已封存的 mvp1 → 改指 lite)。
- 根 README 更新反映現況。

### Phase 2(提前執行)✅ 完成 — 離線過門檻
- 診斷(`smart/docs/freq-diagnosis.md`):essay.txt 是詞頻表非語料,
  單字頻率反轉台灣用字(吃 805 vs 咋 13,090)、缺常用詞(吃飯 0 筆)、
  bigram 只有詞內轉移。
- 修正:資料重建自 **McBopomofo phrase.occ**(MIT,台灣語境)
  → `smart/data/word_db.json`(3.8MB)+ `char_bigram.json`(1.2MB),
  essay 降級為重折扣補洞(×0.005、門檻 10)。
  離線建置腳本:`converter/build_smart_db.py`(需 clone McBopomofo)。
- 新引擎 `smart/js/decoder.js`:詞級 lattice Viterbi,每位置都有頻率項,
  未見 bigram backoff 到打折 unigram;支援 pinned(逃生口)與候選排序(修正 UI)。
  參數 harness 掃描定案:γ=0.3、β=0.02、lenBonus=3.0。
- 評測(159 句/1,240 字):**top-1 有 context 97.4%**(門檻 85)、
  **top-3 98.2%**(門檻 95)、句首 98.1%、整句解碼 2.3ms。取碼規則=首碼+末碼(大易簡碼慣例,依作者實際打法修正,原「前 2 碼」為誤)。
  4 碼回歸 97.2%,缺口全為碼表固有同碼字(與 Lite 相同),非回歸。

### UX 對齊 Lite(v0.2.0,依作者回饋)✅
- **選字鍵改回大易/Lite 傳統配置**:空白=1、`'`=2、`[`=3、`]`=4、`-`=5、`\`=6、`=`換頁;
  數字鍵一律是大易碼。候選列預設對準「剛打的字」,不必先點就能換字。
- **Mini 模式**(IME 兩列:緩衝區+候選 / 輸出;**連按兩下 Ctrl 切換**、單擊 Ctrl 複製,
  與 Lite 同規格)、**專注模式**、
  **送出後自動複製**(預設 ON,閃綠回饋)、虛擬鍵盤收合、深色模式、字級調整、
  清除選字習慣;設定存 localStorage。
- **鍵盤幾何比照 Lite**:滿版、貼底、按鍵撐滿整列(48/56px),
  上半部內容自行捲動;⇧ 位置=全碼,🌐 位置=⏎ 送出。
- **PWA 比照 Lite**:manifest.json(standalone)+ 本地 icon + iOS meta,可加入主畫面。
- 手機版首屏(390×664)不需捲動即可見緩衝區+候選+鍵盤。
- 圖示改純 unicode,移除 Google Fonts 相依(離線可用)。
- **Mini 條採用 A′ 版面**(經 `smart/docs/mini-mockups.html` 的 A/B 比較定案):
  候選區固定 5 格、位置不動、每格都有選字鍵(`空白 ' [ ] -`),分隔線右推,
  左區(句子含碼標)拿走其餘全部寬度,`=` 換頁並顯示頁碼。
  主 UI 一頁同樣 5 個,選字鍵映射兩邊一致。
- 真瀏覽器測試擴充到 60 項(含剪貼簿、Mini、A′ 固定格數與換頁、設定持久化、手機版面),全綠。

### Phase 1(/smart/ UI)✅ PoC 完成
- `smart/index.html` + `smart/js/app.js`:連碼 2 碼、單碼字=鍵+空白、
  暫定字虛線顯示、點字/方向鍵+數字鍵修正(替換即鎖定並重跑 Viterbi)、
  `` ` `` 全碼逃生口(選字鍵沿用 Lite 慣例:空白 + ' [ ] - \ =)、
  Enter 送出 + Copy 交付、虛擬鍵盤(觸控展開)、深淺色主題。
- 真瀏覽器煙霧測試 15/15 通過(Playwright + chromium),每鍵處理 ~1ms。

### 文件
- `smart/docs/how-it-works.html`:技術說明頁(給人看的)——資訊理論框架
  (2 碼撞碼 8.7 個 → 需補 3.1 bits;bigram 供 4–5 bits,所以解碼夠、預測不夠)、
  三張資料表(碼表 / 詞的 unigram / 字的 bigram)、詞級 lattice + Viterbi、
  backoff 與詞長獎勵、個人化權重、評測數字與殘餘誤差。附兩張手寫 SVG 圖。
- `smart/docs/mini-mockups.html`:Mini 條版面 A/B(已定案 A′)。

### 下一步
1. GitHub Pages 部署後實際試打,收集體感回饋。
2. 頁內「傳統(4 碼)/ 智慧(2 碼)」模式切換(傳統模式重用 Lite 引擎)。
3. 使用者習慣層權重(μ)調校;需要時再引語料級字 bigram。

### 驗收門檻(handoff)
| 指標 | 門檻 |
|---|---|
| 2 碼 + 有左 context,top-1 | ≥ 85% |
| 2 碼 + 有左 context,top-3 | ≥ 95% |
| 句首字(無 context)top-1 | 報告即可 |
| 4 碼(傳統)top-1 | ~100%(回歸) |
| 每鍵解碼延遲 | < 10ms 桌面 / < 30ms 手機 |

### 工程約束
- 純前端、無 server、無 build step,GitHub Pages push 即部署。
- 不修 Smart Compose、不動 Lite、不做 Chrome extension、
  不引入 LLM 進解碼迴圈(LLM 只用於離線資料整備與測試句生成)。
