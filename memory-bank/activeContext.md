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

### 下一步(依 handoff,死因 b ⇒ Phase 2 提前)
1. **評測 harness**(`/smart/tests/`):100–200 句台灣正體句子,
   量 2 碼 top-1 / top-3(分有/無左 context),瀏覽器可跑、可 export JSON。
2. **詞頻診斷與資料/計分修正**:離線通過 2 碼 top-1 ≥ 85% 門檻,
   寫 `smart/docs/freq-diagnosis.md`。已知修正方向:
   - 計分基線:`log P(字)` + `λ·log P(字ᵢ|字ᵢ₋₁)`,未見 bigram backoff 到打折 unigram;
   - 資料:lexicon 的正確用法是詞級 lattice(詞內不需跨詞 bigram),
     或重建語料級字 bigram(台灣正體語源)。
3. **`/smart/` UI**(85% 門檻通過後):連碼 2 碼、緩衝區暫定字、
   點選/數字鍵修正 + 重跑 Viterbi、全碼逃生口、copy 交付。

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
