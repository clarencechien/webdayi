# WebDaYi (網頁大易輸入法)

> **Language / 語言**: [English](README.en.md) | [正體中文](README.md)

> 輕量、透明、網頁優先的大易中文輸入法引擎

[![Status](https://img.shields.io/badge/status-MVP%201%20v11.3-brightgreen)]()
[![Version](https://img.shields.io/badge/version-11.3.5-blue)]()
[![Tests](https://img.shields.io/badge/tests-212%2B%2F212%2B%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-open%20source-green)]()

---

## 📖 TL;DR

**WebDaYi** 是一個輕量、透明的**大易中文輸入法引擎**，採用純 JavaScript 實作，整合 N-gram 語言模型和 Viterbi 演算法，提供智慧句子預測功能。取代複雜的輸入法框架，為網頁應用程式提供原生級的輸入體驗。

### 🎯 現況一覽

- **版本**: v11.3.5 (Build: 20251112-009)
- **狀態**: ✅ MVP 1.0 完成！智慧引擎生產就緒
- **準確度**: 94.4% (v2.7 Hybrid: OOP + 70/30 + Laplace)
- **測試**: 212+ 測試全數通過
- **資料庫**: 16MB 完整 N-gram (279K bigrams, 90% 準確度)

### 🚀 立即試用

**[👉 線上展示 (GitHub Pages)](https://clarencechien.github.io/webdayi/)**

**核心功能**:
- 🧠 **雙模式輸入**: 逐字模式 ↔ 整句模式（智慧預測）
- ⚡ **Viterbi 演算法**: 基於 rime-essay 語料庫 (717M 字元)
- 📊 **Laplace 平滑**: 完整統計平滑處理
- 👁️ **即時預覽**: 盲打更有信心
- 📱 **手機優化**: 完美支援觸控與虛擬鍵盤
- 🎨 **現代 UI**: Tailwind CSS + 深色模式

### 📦 快速開始

```bash
# 給開發者
git clone https://github.com/clarencechien/webdayi.git
cd webdayi/mvp1
node tests/node/test-v27-hybrid.js  # 測試 v2.7 (94.4% 準確度)
open index.html  # 或使用 python3 -m http.server 8000
```

### 📚 重點文件

| 文件 | 說明 |
|------|------|
| [SMART-ENGINE-JOURNEY.md](docs/SMART-ENGINE-JOURNEY.md) | 智慧引擎完整技術演進 (v2.1 → v2.7) |
| [PRD.md](docs/project/PRD.md) | 產品需求文件 (v1.3) |
| [activeContext.md](memory-bank/activeContext.md) | 當前開發狀態與技術脈絡 |

### 🏆 最新成就 (v11.3.5)

- ✅ **v2.7 Hybrid 演算法**: OOP 架構 + v2.5 的 70/30 權重 + Laplace 平滑
- ✅ **94.4% 準確度**: 測試案例 17/18 正確 (明天天氣如何**會**放假嗎)
- ✅ **完整資料庫**: 切換至 ngram_db.json (16MB, 279K bigrams)
- ✅ **測試重組**: 47 個測試檔案組織至結構化資料夾
- ✅ **完整文件**: 18KB 技術旅程文件 + 測試說明

---

## 🎉 完整功能展示

**[立即試用 WebDaYi MVP1 v11.3 →](https://clarencechien.github.io/webdayi/)** (GitHub Pages)

在瀏覽器中體驗核心大易輸入引擎，具備現代化設計與進階功能：

### 🆕 PWA 最新更新 (2025-11-13)

**Session 10.11 Part 5 + Bug Fixes**:
- 🎯 **Top-N 預測循環** *(NEW!)*：按 = 鍵可循環查看 5 個最佳預測結果！
- ⌨️ **Enter 確認** *(NEW!)*：按 Enter 確認句子並自動學習修改記錄！
- 📱 **手機匯出修復** *(FIXED!)*：支援 Web Share API，iOS/Android 原生分享體驗！
- 🔇 **Console 清理** *(FIXED!)*：移除無用的錯誤訊息，載入過程更乾淨！
- 🖼️ **圖示目錄** *(NEW!)*：新增 icons 資料夾，包含 SVG 模板和生成指南！
- ⚙️ **PWA 警告修復** *(FIXED!)*：manifest.json shortcuts、deprecated meta tags 全部修正！
- 🧪 **TDD 覆蓋** *(NEW!)*：29 個句子模式 UX 測試，涵蓋所有預測循環情境！

### 🚀 v11.3.5 最新特色 (2025-11-12)

- ✅ **v2.7 Hybrid 演算法**：完美結合 v2.6 OOP 架構與 v2.5 的 70/30 權重
- ✅ **94.4% 準確度**：智慧句子預測達到新高峰
- ✅ **完整資料庫**：ngram_db.json (16MB, 279K bigrams) 提供完整語言模型覆蓋
- ✅ **Laplace 平滑**：統計正規化處理，處理未見 bigrams
- ✅ **測試結構化**：47 個測試檔案重組至 tests/node、tests/browser、tests/diagnostic、tests/archived
- ✅ **完整文件**：SMART-ENGINE-JOURNEY.md (18KB) 記錄完整技術演進

### 🎨 v11.2 介面與體驗
- 📱 **手機 UX 優化** *(v11.2 Build 007 NEW!)*：三階段全面改善手機輸入體驗！
  - 移除冗餘 Space 按鈕（輸入事件處理器已完全支援）
  - 逐字模式 Space 鍵選字（手機虛擬鍵盤完全支援）
  - 響應式版面重排（手機版優化元素順序，減少滾動）
- ✨ **版本管理系統** *(v11.2)*：Console 顯示版本、Build、Commit，永遠知道測試的版本！
- 🔧 **事件處理器修復** *(v11.2 Build 005 CRITICAL!)*：Space/= 處理器執行順序修正，緩衝區顯示正常運作！
- 🎯 **盲打完整修復** *(v11.2 VERIFIED!)*：Space 鍵緩衝、= 鍵預測、UI 即時更新，真正的盲打工作流！
- 🎯 **UX Round 2 完成** *(v11 Latest!)*：修復 3 個新關鍵問題，212+ 個測試全數通過！
- 💬 **英文混打模式** *(v11 NEW Round 2!)*：按 Shift 切換中英文輸入，完美混合輸入！
- 🗑️ **Delete 鍵驗證** *(v11 Round 2!)*：確認刪除鍵正確清除所有區域（輸出+預測+緩衝）！
- 🇹🇼 **台灣在地化** *(v11 Round 1)*：智能 → 智慧，使用正確台灣術語！
- 🐛 **重複字元修復** *(v11 CRITICAL Round 1)*：修復「dj ev」產生「天明天」而非「明天」的問題！
- ⌨️ **Space 鍵優化** *(v11 UX Round 1)*：逐字模式下「v + Space」正確選取「大」！
- 🗑️ **Delete 鍵增強** *(v11 UX Round 1)*：一鍵清除輸出+候選+緩衝區所有內容！
- 📊 **Laplace 平滑法** *(v11 Solution B!)*：統計正規化處理，預測品質提升 60-80%！
- 🔬 **完整 TDD 覆蓋** *(v11 NEW!)*：187+ 個測試（含 61 個 UX 測試），全數通過！
- 🧠 **N-gram 智慧預測** *(v11 NEW!)*：整句模式一次輸入多個編碼，按 Space 預測最佳句子！
- 👁️ **即時預覽** *(v11 NEW!)*：輸入時即時顯示首選字，盲打更有信心！
- 📦 **N-gram 資料庫優化** *(v11 Pruning!)*：80/20 法則智慧壓縮，16MB → 3.1MB (80.6%)，品質保持 86.8%！
- ⚡ **Viterbi 演算法** *(v11 NEW!)*：基於真實語料庫（rime-essay）的機率預測！
- 🎯 **雙模式輸入** *(v11 NEW!)*：逐字模式 ↔ 整句模式，自由切換！
- 🔥 **嚴重錯誤修復** *(v11 CRITICAL!)*：修復 strict mode 錯誤，所有按鈕現在都能工作！
- 📱 **手機模式切換** *(v11 Bugfix)*：永遠可見的大按鈕，手機/桌面都能輕鬆切換！
- 🎨 **預測按鈕優化** *(v11 Bugfix)*：獨立顯示區域，不再隱藏在預覽中！
- 🐛 **複製按鈕修正** *(v11 Bugfix)*：圖標結構正確保留，顯示「已複製」回饋！
- ⌨️ **Delete 鍵清除** *(v10 Bugfix)*：按 Delete 鍵快速清空輸出區！
- ✅ **正確的回饋訊息** *(v10 Bugfix)*：自動複製顯示「已複製到剪貼簿」，不再搞混！
- 💡 **內嵌按鍵提示** *(v10 NEW!)*：候選字直接顯示按鍵，學習更快速！
- 📱 **手機最佳化** *(v10 NEW!)*：響應式控制面板，手機上不再重疊！
- 🔤 **字體大小控制** *(v10 NEW!)*：A−/A+ 按鈕調整 80%-120%，適應各種裝置！
- 🎨 **現代 UI** *(v9)*：全新 Tailwind CSS 設計，圓潤卡片風格！
- 🌗 **深色模式** *(v9)*：一鍵切換深色/淺色主題，自動儲存偏好！
- ✨ **Material Icons** *(v9)*：專業圖標系統，視覺更統一！
- 📐 **新版面配置** *(v9)*：輸出在上、輸入在下，更符合直覺！
- 📱 **增強 RWD** *(v9)*：完美適應手機/平板/桌面！
- ✨ **自動複製** *(v8)*：選字後自動複製到剪貼簿，無需手動點擊！
- 🗑️ **清除按鈕** *(v8)*：一鍵清空輸出緩衝區！
- 🔄 **自動複製切換**：可隨時開啟/關閉自動複製功能
- 🚀 **自動選字**：輸入2碼 + 第3碼 = 自動選取第一候選字（加速打字！）
- 📄 **翻頁功能**：當候選字超過60個時，按 `=` 鍵循環翻頁
- ⌨️ **智慧選字**：使用 Space/' /[/]/- /\ 選取候選字（0-9 現在是字碼的一部分！）
- ⌫ **智慧倒退**：先刪除輸入，再刪除輸出緩衝區（自然的復原流程！）
- 🎯 **專注模式**：切換至極簡介面（隱藏干擾，專注輸入！）
- 🧠 **使用者個人化**：輸入法會學習您的偏好！(MVP1.7-1.9) **[Bug 已修復！]**
- 📱 **觸控友善**：點擊選字 + 上下頁按鈕！(MVP1.10)

## 專案概述

**WebDaYi** 以簡單、現代的 JavaScript 解決方案取代複雜、龐大的輸入法框架。不需要與設定檔搏鬥，您將獲得一個透明的輸入法：

- 🎯 **開箱即用**：無需任何設定
- 🪶 **輕量級**：純 JavaScript，無笨重框架
- 🔍 **透明**：每一行程式碼都可讀且可修改
- 🌐 **瀏覽器優先**：為 Gmail、Google Docs、Notion 等網頁應用程式最佳化
- 🔄 **智慧**：採用 Rime 優秀的大易字典資料

## 專案狀態

**目前階段**：✅ MVP 1.0 v11.3.5 完成！（v2.7 Hybrid + 完整資料庫 + 文件完整）
**當前版本**：11.3.5 (Build: 20251112-009, Commit: 752397f)
**完成度**：~99%（Phase 0、MVP 1 v11.3 100% 完成，準備進入 MVP 2a）
**生產狀態**：✅ 智慧引擎生產就緒！(94.4% 準確度)

### 如何確認版本

打開 WebDaYi 後，按 **F12** 開啟 DevTools Console，會自動顯示：
```
🚀 WebDaYi MVP 1.0
Version: 11.3.5
Build: 20251112-009
Commit: 752397f
Release: v2.7 Hybrid (OOP + 70/30 + Laplace) + Full ngram_db.json
```

或輸入：`window.WEBDAYI_VERSION`

詳見：[docs/project/VERSION-GUIDE.md](docs/project/VERSION-GUIDE.md)

```
┌──────────────────────────────────────────────────────────┐
│ Phase 0: 資料處理管線       [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│ Phase 1: MVP 1.0 v10       [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 選字鍵修正             [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 翻頁功能               [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 自動選字               [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 智慧倒退               [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 輸入模式切換           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 使用者個人化           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 觸控友善 UX            [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 自動複製               [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 清除按鈕               [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Tailwind CSS          [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🎨✅  │
│   ├─ 深色模式               [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🌗✅  │
│   ├─ 現代 UI 重新設計       [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✨✅  │
│   ├─ 手機 UX 修復           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 📱✅  │
│   ├─ 字體大小控制           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🔤✅  │
│   ├─ 內嵌按鍵提示 UX        [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 💡✅  │
│   └─ Delete 鍵 + 回饋修正   [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🐛✅  │
│ Phase 1.5: MVP 1.0 v11     [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🚀✅  │
│   ├─ N-gram 核心整合        [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🧠✅  │
│   ├─ Viterbi 演算法         [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ⚡✅  │
│   ├─ 編碼緩衝系統           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 即時預覽               [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 👁️✅  │
│   ├─ UI/UX 整合             [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🎨✅  │
│   ├─ 事件處理器整合         [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ⚡✅  │
│   ├─ TDD 測試 (30 tests)    [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 複製按鈕回饋修正       [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🐛✅  │
│   ├─ 手機模式切換修正       [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 📱✅  │
│   ├─ 預測按鈕獨立顯示       [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🎨✅  │
│   ├─ Strict Mode 嚴重修復   [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🔥✅  │
│   ├─ UI Init TDD (14 tests) [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ N-gram 品質診斷        [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🔬✅  │
│   ├─ Quick Fix (演算法)     [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ⚡✅  │
│   ├─ Solution B (Laplace)   [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 📊✅  │
│   ├─ Laplace TDD (21 tests) [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ UX 改善 (4 issues)     [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🎯✅  │
│   ├─ 在地化 (智能→智慧)     [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🇹🇼✅  │
│   ├─ 重複字元修復           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🐛✅  │
│   ├─ Space 鍵優化           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ⌨️✅  │
│   ├─ Delete 鍵增強          [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🗑️✅  │
│   ├─ 盲打修復 (Space/=)     [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🔧✅  │
│   ├─ 版本管理系統           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✨✅  │
│   ├─ CI/CD 測試自動化       [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🤖✅  │
│   ├─ 事件處理器順序修復     [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🔥✅  │
│   ├─ 緩衝區顯示修復         [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🎯✅  │
│   └─ TDD 測試 (212+ tests)  [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ UX Round 1 TDD (31)    [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ UX Round 2 - 整句單碼  [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🔥✅  │
│   ├─ UX Round 2 - 英文混打  [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 💬✅  │
│   ├─ UX Round 2 - 刪除驗證  [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ UX Round 2 TDD (30)    [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ 手機 UX Phase 1 (按鈕)  [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🗑️✅  │
│   ├─ 手機 UX Phase 2 (Space) [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ⌨️✅  │
│   └─ 手機 UX Phase 3 (版面)  [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 📱✅  │
│ Phase 1.9: PWA 增強 (v0.5) [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🎉✅  │
│   ├─ Top-N 預測循環         [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🎯✅  │
│   ├─ Enter 確認 + 學習      [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ⌨️✅  │
│   ├─ TDD 測試 (29 tests)    [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🧪✅  │
│   ├─ 手機匯出修復 (Web Share) [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 📱✅  │
│   ├─ Console 清理           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🔇✅  │
│   ├─ 圖示目錄建立           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🖼️✅  │
│   └─ PWA 警告修復           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ⚙️✅  │
│ Phase 2: MVP 2a            [░░░░░░░░░░░░]   0% 📋    │
└──────────────────────────────────────────────────────────┘
```

**最新成就**：🎉 PWA Phase 1.9 完成（Session 10.11 Part 5 + Bug Fixes）

**PWA v0.5 Build 006 - Session 10.11 Part 5 完成** (2025-11-13) - **Top-N 預測循環 + Bug 修復**:
- 🎯 **Top-N 預測循環**：= 鍵可循環查看 5 個最佳預測結果
- ⌨️ **Enter 確認學習**：按 Enter 確認句子並自動學習修改記錄
- 🧪 **29 個 TDD 測試**：涵蓋所有預測循環、確認、編輯情境
- 📱 **手機匯出修復**：支援 Web Share API，iOS/Android 原生分享體驗
- 🔇 **Console 清理**：移除無用的錯誤訊息，載入過程更乾淨
- 🖼️ **圖示目錄**：新增 icons 資料夾，包含 SVG 模板和生成指南
- ⚙️ **PWA 警告修復**：manifest.json shortcuts、deprecated meta tags 全部修正
- 📝 **4 個 Commits**：2f11992 (backend), d739999 (UI), 7527fdf (bugs), 0982722 (docs)

**v11.3.5 Build 009 智慧引擎完成** (2025-11-12) - **v2.7 Hybrid + 完整文件**:
- 🧠 **v2.7 Hybrid 演算法**：完美結合 OOP 架構、70/30 權重、Laplace 平滑
- 📊 **94.4% 準確度**：測試案例 17/18 正確（明天天氣如何**會**放假嗎）
- 💾 **完整資料庫**：切換至 ngram_db.json (16MB, 279K bigrams, 完整語言模型覆蓋)
- 🔧 **根因修復**：診斷並修復資料庫問題（儈 vs 會 選字錯誤）
- 📁 **測試重組**：47 個測試檔案組織至結構化資料夾 (tests/node、tests/browser、tests/diagnostic、tests/archived)
- 📚 **完整文件**：SMART-ENGINE-JOURNEY.md (18KB) 記錄完整 v2.1→v2.7 技術演進
- ✅ **生產就緒**：智慧引擎達到生產品質標準

**v11.2 Build 007 手機 UX 優化** (2025-11-11) - **三階段全面改善**:
- 📱 **Phase 1: 移除冗餘 Space 按鈕**：
  - 根本原因：輸入事件處理器（Layer 2）已完全支援手機虛擬鍵盤 Space 鍵
  - 解決方案：移除 Space 按鈕（Layer 3 fallback），精簡 UI
  - 影響：整句模式下更簡潔的介面，無功能損失
  - Commit: 05ae9a8
- ⌨️ **Phase 2: 逐字模式 Space 鍵選字**：
  - 根本原因：逐字模式下手機 Space 鍵無法選取首選字（如「v + Space」無法選「大」）
  - 解決方案：擴展輸入事件處理器支援逐字模式，偵測 Space → 查詢候選字 → 自動選取第一個
  - 影響：手機逐字模式現在完全支援 Space 鍵選字！
  - Commit: 05ae9a8
- 📐 **Phase 3: 響應式版面重排**：
  - 根本原因：虛擬鍵盤佔據 50% 畫面，整句模式面板在底部，需要不斷上下滾動
  - 解決方案：使用 CSS flexbox `order` 屬性重新排列元素
    - 手機順序：輸出 → 輸入 → 候選字 → 整句面板（所有重要元素在鍵盤上方可見）
    - 桌面順序：保持原樣（輸出 → 整句面板 → 輸入 → 候選字）
  - 緊湊設計：手機版減少 padding、縮小文字、水平排版
  - 影響：手機輸入體驗大幅提升，無需滾動即可看到所有關鍵資訊！
  - Commit: 326684c
- 📖 **完整設計文件**：docs/ux/MOBILE-UX-IMPROVEMENTS.md（完整問題分析與解決方案）

**v11.2 Build 005 修復** (2025-11-11) - **CRITICAL 事件處理器修復**:
- 🔥 **事件處理器執行順序修復 (CRITICAL)**：Space/= 處理器現在正確執行
  - 根本原因：`if (isInSentenceMode) { return; }` 早期返回阻擋了 Space/= 處理器
  - 解決方案：將 Space 和 = 處理器移到早期返回**之前** (core_logic.js:1475-1545)
  - 影響：v + space、ad + space、= 鍵現在完全運作！
  - Commit: e37cdd0
- 🎯 **緩衝區顯示修復 (CRITICAL)**：UI 現在正確即時更新
  - 根本原因：`updateBufferDisplay` 未匯出到 window 物件，跨模組無法呼叫
  - 解決方案：匯出到 `window.updateBufferDisplay` + 更新檢查邏輯
  - 影響：v + space 後緩衝區徽章立即顯示，不再需要輸入第二碼才顯示
  - Commit: caef860
- 📊 **診斷日誌系統**：新增完整執行追蹤日誌
  - Space 處理器：`[Space Handler] Running`, `[Space Handler] Calling updateBufferDisplay...`
  - = 處理器：`[= Handler] Running`, `[= Handler] Calling triggerPrediction...`
  - 緩衝區更新：`[updateBufferDisplay] Called`, `[updateBufferDisplay] Buffer: [...]`
- ✅ **使用者驗證**：GitHub Pages 部署測試確認所有功能運作

**v11 UX Round 2 修復** (2025-11-11):
- 🔥 **整句單碼修復 (CRITICAL)**：修復整句模式下單碼 "v" + Space 無反應的阻斷性問題
  - 根本原因：整句模式輸入處理器只處理 2 字元碼，單字元完全被忽略
  - 解決方案：新增單字元候選顯示邏輯 (core_logic_v11_ui.js:410-438)
  - 影響：使用者終於可以在整句模式下使用單碼輸入！
- 💬 **英文混打模式 (NEW FEATURE)**：按 Shift 切換中英文輸入
  - 實作：languageMode 狀態 + Shift 切換 + 視覺指示器
  - 英文模式直接輸出文字，不經過中文處理邏輯
  - 支援英數字、空格、標點符號混合輸入
- ✅ **Delete 鍵驗證**：確認刪除鍵正確清除所有區域（輸出+候選+預測+緩衝）
- 🧪 **測試覆蓋**：187+ 個測試（157 回歸測試 + 30 新 Round 2 測試）全數通過

**v11 UX Round 1 修復** (2025-11-11):
- 🇹🇼 **台灣在地化**：智能 → 智慧，使用正確台灣術語
- 🐛 **重複字元修復 (CRITICAL)**：修復「dj ev」產生「天明天」而非「明天」的問題
  - 根本原因：逐字模式處理器干擾整句模式
  - 解決方案：新增模式隔離防護（mode guards）
- ⌨️ **Space 鍵優化**：逐字模式下「v + Space」正確選取「大」
  - 桌面：實體鍵盤 Space 鍵完美運作
  - 手機：預測按鈕可用（虛擬鍵盤限制）
- 🗑️ **Delete 鍵增強**：一鍵清除輸出+候選+緩衝區所有內容
- 🧪 **測試覆蓋**：31 個 UX Round 1 測試全數通過

**v11 N-gram 智慧引擎**:
- 📊 **Laplace 平滑法 (Solution B)**：完整統計平滑實作，預測品質提升 60-80%
- 🔬 **N-gram 品質診斷**：發現雙重問題：演算法 (60%) + 資料 (40%)
- 📈 **兩階段優化**：Quick Fix (30-50%) → Solution B (60-80%) 改善
- 💾 **資料庫 v2.0**：新增 smoothing_alpha、total_chars、vocab_size 參數（15.7MB）
- 🧠 **N-gram 語言模型**：整合 rime-essay 語料庫（18K unigrams, 279K bigrams）
- ⚡ **Viterbi 演算法 v2.0**：動態規劃 + 完整 Laplace 平滑，速度 <500ms
- 🎯 **雙模式輸入**：逐字模式（傳統）↔ 整句模式（智慧預測）自由切換
- 👁️ **即時預覽**：顯示首選字，盲打更有信心（如「易 在 大」）
- 📦 **編碼緩衝**：可累積最多 10 個編碼，按 Space 一次預測完整句子
- ⌫ **智慧清除**：Backspace 移除最後一碼 / ESC 清空緩衝區
- 🎨 **現代 UI**：漸層卡片、動畫徽章、載入指示器
- 📦 **N-gram 資料庫優化 (Pruning)** *(Session 8)*：智慧壓縮技術，完美平衡大小與品質
  - **80/20 法則**：保留 15% 的 bigrams 提供 87% 的預測準確度
  - **兩階段剪枝**：門檻過濾（threshold=3）+ Top-K 壓縮（topk=10）
  - **檔案大小**：16MB → 3.1MB（80.6% 縮減）
  - **Bigrams**：279K → 42K（84.9% 縮減）
  - **品質分數**：86.8%（超越 80% 目標！）
  - **載入速度**：2-3s → 0.5s（5 倍快！）
  - **記憶體使用**：~50MB → ~10MB（5 倍少！）
  - **Chrome Extension 就緒**：< 5MB 需求達成 ✅

- 🎭 **N-gram 混合模型 (Blended Model)** *(Session 9 ✅ 完全優化)*：完整三階段優化，突破 60% 品質天花板
  - **🎯 Action 1 - Laplace 平滑**：修復致命缺陷，處理未見 bigrams
    - 問題：資料庫缺少平滑參數 → Viterbi 遇 log(0) = -∞ 斷路
    - 解決：加入 smoothing_alpha=0.1, total_chars, vocab_size
    - 效果：未見組合 P(大易) = 0 → 3.26e-8，預期 +10-15% 品質
  - **🧹 Action 2 - 嚴格清洗**：移除 13.81% PTT 語料噪音
    - 問題：187,395 個噪音 bigrams（空格 92K, 注音 1.5K, 全形標點 1K）
    - 解決：嚴格模式僅保留漢字 + 5 個基本標點（，。！？、）
    - 效果：100% 乾淨資料，預期 +5-10% 品質
  - **⚖️ Action 3 - 權重調整**：提供 70:30 vs 80:20 選擇
    - v1.2-strict (70:30)：平衡版，適合一般使用者
    - v1.3-formal (80:20)：正式版，適合商業/學術用途
  - **📊 最終結果**：
    - **檔案大小**：1.64MB (v1.2-strict)
    - **資料統計**：18,381 unigrams, 116,812 bigrams
    - **預期品質**：**~75%** (+16% over v1.0, 突破 60% 天花板！)
    - **版本比較**：v1.1 (59.3%) → v1.1-smoothed (~69%) → **v1.2-strict (~75%)**
  - **🚀 生產部署**：v1.2-strict 已部署為預設（`mvp1/ngram_blended.json`）
  - **📦 完整實驗報告**：`docs/design/NGRAM-BLENDED-EXPERIMENTS.md` (2.0 版)

**下個里程碑**：開始 MVP 2a（Chrome 瀏覽器外掛）實作（需要針對擴充套件優化資料庫大小）

## 📚 文件結構

專案文件已組織到 `docs/` 資料夾中，以便更好地管理（Build 007 完全重組）：

### 🗂️ docs/project/ - 專案文件
- **PRD.md** - 產品需求文件 (Product Requirements Document v1.3)
- **VERSION-GUIDE.md** - 版本檢查指南 (v11.2 NEW!)
- **VERIFICATION.md** - 驗證測試清單
- **DOCUMENTATION-MAPPING.md** - 文件對應指南 (Build 007 更新)
- **FINAL-VERIFICATION.md** - 最終驗證報告

### 🎨 docs/design/ - 設計文件
- **SMART-ENGINE-JOURNEY.md** - 智慧引擎完整技術演進 (v2.1→v2.7, 18KB) ✨ **NEW!**
- **DESIGN-v2.md** - 轉換器 v2 設計（頻率排序系統）
- **DESIGN-ngram.md** - N-gram 資料管線設計
- **DESIGN-viterbi.md** - Viterbi 演算法設計
- **DESIGN-auto-copy.md** - 自動複製功能設計 (v8)
- **DESIGN-v10.md** - 手機 UX 修復設計 (v10)
- **DESIGN-v10-ux-improvement.md** - 內嵌提示 UX 設計 (v10)
- **DESIGN-v10-bugfix.md** - Delete 鍵 + 回饋修正設計 (v10)
- **DESIGN-v11.md** - N-gram 整合設計 (v11)
- **DESIGN-v11-ux-improvements.md** - v11 UX 改善設計
- **DESIGN-ngram-pruning.md** - N-gram 剪枝優化設計 (v11 Session 8)
- **DESIGN-ngram-blended.md** - N-gram 混合模型設計 (v11 Session 9)

### 🧪 docs/testing/ - 測試文件
- **BROWSER-TESTING-v11.md** - 瀏覽器測試計畫
- **BROWSER-TESTING-SESSION9.md** - Session 9 混合模型測試 (NEW!)
- **TEST-RESULTS-v11.md** - 測試結果報告
- **TEST-PLAN-v11-ui.md** - UI 整合測試計畫

### 💡 docs/ux/ - UX 文件
- **TAIWAN-LOCALIZATION.md** - 台灣在地化指南
- **UX-IMPROVEMENTS-v11.md** - v11 UX 改善總覽
- **UX-FIXES-SUMMARY.md** - UX Round 1 修復摘要
- **UX-IMPLEMENTATION-STATUS.md** - UX 實作狀態
- **UX-ISSUES-ROUND2.md** - UX Round 2 問題分析
- **UX-SPACE-KEY-REDESIGN.md** - Space/= 鍵重新設計 (Build 005)
- **UX-CRITICAL-SINGLE-CHAR-BUG.md** - 單字元 bug 分析 (Build 006)
- **MOBILE-SPACE-KEY-FIX.md** - 手機 Space 鍵修復 (Build 005)
- **MOBILE-UX-IMPROVEMENTS.md** - 手機 UX 三階段設計 (Build 007 NEW!)
- **SESSION-SUMMARY-v11-ux.md** - v11 UX 工作階段摘要
- **NGRAM-DIAGNOSIS.md** - N-gram 品質診斷報告

### 📖 其他重要文件
- **CLAUDE.md** (根目錄) - AI 助手專案指南
- **README.md** (根目錄) - 本文件
- **memory-bank/** - 專案記憶庫（activeContext, progress, systemPatterns 等）

**完整文件映射**：參見 [docs/project/DOCUMENTATION-MAPPING.md](docs/project/DOCUMENTATION-MAPPING.md)

## 💡 核心特色：頻率導向的智慧排序

WebDaYi 使用真實世界的字元使用頻率資料，而非任意排序：

### 🎯 轉換器 v2：頻率排序系統

我們的**增強資料管線**整合了台灣教育部的 2000 個最常用正體中文字資料：

- **真實資料來源**：台灣教育部高頻字排名（教育部）
- **智慧排序**：候選字依實際使用頻率排序
- **測試驗證**：21 個自動化測試確保正確性
- **向下相容**：沒有頻率資料時退回基礎版本

**範例**：對於字碼 `4jp`：
```json
{
  "4jp": [
    { "char": "易", "freq": 9992 },  // 排名 9（超高頻）
    { "char": "義", "freq": 9544 },  // 排名 ~500（高頻）
    { "char": "蜴", "freq": 1000 }   // 不在排名中（預設）
  ]
}
```

這確保最常用的字元優先出現，使輸入更快速、更直覺。

**技術細節**：
- 線性映射：排名 1 → 頻率 10000，排名 2000 → 頻率 8000
- 未排名字元預設頻率：1000
- 採用 TDD（測試驅動開發）開發

## 快速開始

### 立即試用（線上展示）

**[啟動 WebDaYi MVP1 v9 →](https://clarencechien.github.io/webdayi/)**

無需安裝！只要開啟連結並開始輸入：

**🎨 新 UI 特色 (v9)**：
- 🌗 **切換深色模式**：點擊右上角「Dark/Light」按鈕，自動儲存偏好
- 🎯 **專注模式**：點擊「Focus」按鈕隱藏說明和頁腳，專注輸入
- 📐 **現代版面**：輸出區在上方，輸入區在下方，更直覺的操作流程
- ✨ **Material Icons**：所有按鈕和狀態都使用專業圖標

**⌨️ 基本操作**：
- 試試 `v` → 大, 夫, 禾
- 試試 `a` → 人, 入
- 試試 `ux` → 61 個候選字，按 `=` 或使用按鈕翻頁
- 按 `Space`（第1個）、`'`（第2個）、`[`（第3個）、`]`（第4個）、`-`（第5個）、`\`（第6個）選字
- **或直接點擊**候選字選取（觸控友善！）

**🚀 進階功能**：
- 輸入 2 碼後繼續 → 自動選取第一候選字！
- 按 `Backspace` 復原（刪除輸入，然後是輸出緩衝區）
- 選取非預設候選字 → **輸入法會學習您的偏好並在自動選字時使用！**
- **v8 功能**：選字後**自動複製到剪貼簿**（可用右上角「Auto」按鈕切換）
- **v8 功能**：使用「Clear」按鈕一鍵清空輸出緩衝區
- **v7 功能**：使用 ◀ **上一頁** / **下一頁** ▶ 按鈕在手機/平板上輕鬆翻頁

### 給開發者

```bash
# 複製儲存庫
git clone https://github.com/clarencechien/webdayi.git
cd webdayi

# 執行測試（全部 75 個測試應通過）
cd mvp1

# v10 測試套件（45 個測試）
node test-node-v10.js          # 手機 UX + 字體控制 (27/27)
node test-node-v10-ux.js       # 內嵌提示 UX (5/5)
node test-node-v10-bugfix.js   # Delete 鍵 + 回饋修正 (13/13)

# v11 測試套件（30 個測試）🚀 NEW!
node test-node-v11.js          # N-gram 智能預測 (30/30)

# 在瀏覽器中本地開啟（含 v11 N-gram 功能）
open index.html
# 或使用本地伺服器（推薦，用於測試 N-gram 載入）：
python3 -m http.server 8000
# 造訪：http://localhost:8000

# 測試 v11 N-gram 功能：
# 1. 點擊「整句模式」按鈕
# 2. 輸入 4jp → ad → v
# 3. 按 Space 鍵
# 4. 觀察 Viterbi 預測：「易在大」！

# 資料處理管線：重新產生資料庫（如有需要）
cd ../converter
node convert-v2.js  # 使用頻率資料建立 mvp1/dayi_db.json（推薦）
# 或使用 node convert.js（基礎版本）
```

### 未來功能（MVP 2a - 瀏覽器擴充套件）

當 MVP 2a 完成時：
1. 從 Chrome 線上應用程式商店安裝擴充套件
2. 在任何網頁應用程式（Gmail、Docs 等）開始輸入
3. 原生輸入體驗！

## 文件

### 核心文件

| 文件 | 用途 | 受眾 |
|----------|---------|----------|
| [PRD.md](PRD.md) | 產品需求與規格 | 產品、工程 |
| [CLAUDE.md](CLAUDE.md) | AI 助手技術指南 | AI、工程 |

### Memory Bank（詳細文件）

`memory-bank/` 目錄包含完整的專案文件：

| 檔案 | 說明 |
|------|-------------|
| [projectbrief.md](memory-bank/projectbrief.md) | 使命、目標、範圍與架構 |
| [productContext.md](memory-bank/productContext.md) | 為何存在、解決的問題、UX 願景 |
| [systemPatterns.md](memory-bank/systemPatterns.md) | 架構、設計模式、技術決策 |
| [techContext.md](memory-bank/techContext.md) | 技術堆疊、設定、API、相依性 |
| [activeContext.md](memory-bank/activeContext.md) | 目前工作、下一步、活躍決策 |
| [progress.md](memory-bank/progress.md) | 狀態追蹤器、里程碑、完成率 |

**💡 專案新手？** 從 [projectbrief.md](memory-bank/projectbrief.md) 開始，然後是 [activeContext.md](memory-bank/activeContext.md)

## 架構

### 大架構圖

```
┌─────────────────────────────────────────────────────────┐
│  Rime 字典（YAML）                                      │
│  dayi.dict.yaml                                         │
└─────────────┬───────────────────────────────────────────┘
              │
              │ Phase 0：離線轉換
              ▼
┌─────────────────────────────────────────────────────────┐
│  WebDaYi 資料庫（JSON）                                 │
│  dayi_db.json - O(1) 可查詢                             │
└─────────┬───────────────────────────┬───────────────────┘
          │                           │
          │ Phase 1                   │ Phase 2
          ▼                           ▼
┌───────────────────────┐   ┌───────────────────────────┐
│  靜態網頁             │   │  Chrome 擴充套件          │
│  （驗證）             │   │  （正式版）               │
│                       │   │                           │
│  • 輸入框             │   │  • 背景腳本               │
│  • 候選字顯示         │   │  • 內容腳本               │
│  • 剪貼簿輸出         │   │  • 即時注入               │
└───────────────────────┘   └───────────────────────────┘
```

### 專案結構

```
webdayi/
├── 📄 根目錄文件
│   ├── CLAUDE.md                    # AI 助手專案指南
│   ├── README.md                    # 主要專案概述（正體中文）
│   ├── README.en.md                 # 英文版本
│   └── index.html                   # 重定向到 mvp1/（用於 GitHub Pages）
│
├── 📚 docs/                         # 組織化文件（Build 007 NEW!）
│   ├── project/                     # 專案層級文件
│   │   ├── PRD.md                   # 產品需求 (v1.3)
│   │   ├── VERSION-GUIDE.md         # 版本檢查指南
│   │   ├── VERIFICATION.md          # 驗證檢查清單
│   │   ├── DOCUMENTATION-MAPPING.md # 文件結構映射
│   │   └── FINAL-VERIFICATION.md    # 最終驗證報告
│   ├── design/                      # 設計規格
│   │   ├── DESIGN-v2.md             # 轉換器 v2（頻率）
│   │   ├── DESIGN-ngram.md          # N-gram 管線
│   │   ├── DESIGN-viterbi.md        # Viterbi 演算法
│   │   ├── DESIGN-auto-copy.md      # 自動複製 (v8)
│   │   ├── DESIGN-v10*.md           # v10 功能（3 個檔案）
│   │   ├── DESIGN-v11.md            # N-gram 整合 (v11)
│   │   └── DESIGN-v11-ux-improvements.md # UX 修復
│   ├── testing/                     # 測試文件
│   │   ├── BROWSER-TESTING-v11.md   # 瀏覽器測試計畫
│   │   ├── TEST-RESULTS-v11.md      # 測試結果
│   │   └── TEST-PLAN-v11-ui.md      # UI 測試計畫
│   └── ux/                          # UX 文件
│       ├── TAIWAN-LOCALIZATION.md   # 台灣在地化
│       ├── UX-IMPROVEMENTS-v11.md   # v11 UX 概述
│       ├── UX-FIXES-SUMMARY.md      # UX Round 1
│       ├── UX-ISSUES-ROUND2.md      # UX Round 2
│       ├── UX-SPACE-KEY-REDESIGN.md # Space/= 鍵重新設計
│       ├── UX-CRITICAL-SINGLE-CHAR-BUG.md # 單字元 bug
│       ├── MOBILE-SPACE-KEY-FIX.md  # 手機 Space 鍵修復
│       ├── MOBILE-UX-IMPROVEMENTS.md # 手機 UX 三階段 ✅ NEW!
│       ├── SESSION-SUMMARY-v11-ux.md # 工作階段摘要
│       └── NGRAM-DIAGNOSIS.md       # N-gram 品質分析
│
├── 🧠 memory-bank/                  # AI 助手專案記憶
│   ├── projectbrief.md              # 專案簡介
│   ├── productContext.md            # 產品脈絡
│   ├── activeContext.md             # 活躍脈絡（Session 10 更新）
│   ├── systemPatterns.md            # 系統模式
│   ├── techContext.md               # 技術脈絡
│   └── progress.md                  # 進度追蹤
│
├── 📊 data/                         # 資料管理 ✨ NEW!
│   ├── README.md                    # Data Pipeline 完整文件 (v2.0)
│   └── archive/                     # 歸檔資料庫
│       ├── README.md                # 歸檔說明與版本演進
│       ├── ngram_blended_experiments/  # Session 9 混合模型 (6 files, 19MB)
│       └── ngram_alternatives/      # 替代版本 (1 file, 5.4MB)
│
├── 🔄 converter/                    # Phase 0：資料處理管線
│   ├── convert.js                   # 基礎 YAML → JSON
│   ├── convert-v2.js                # 頻率增強轉換器
│   ├── convert-v2-lib.js            # 轉換器函式
│   ├── convert-v2.test.js           # 21 個測試
│   ├── build_ngram.py               # N-gram 資料庫建構器 (含剪枝) ✅
│   ├── build_ngram_lib.py           # N-gram 函式庫 (Phase 4: Pruning)
│   ├── compare_ngram_quality.py     # N-gram 品質 A/B 測試工具 ✅
│   └── README.md                    # 轉換器文件
│
├── 🚀 mvp1/                         # MVP 1.0 核心引擎 (v11.3.5 Build 009)
│   ├── index.html                   # 主要 UI（手機 UX 優化）✅
│   ├── version.json                 # 版本追蹤 + 變更日誌
│   ├── core_logic.js                # v8 邏輯 (46KB)
│   ├── core_logic_v11.js            # N-gram 函式 (7KB)
│   ├── core_logic_v11_ui.js         # UI 整合 (16KB)
│   ├── viterbi_module.js            # Viterbi v2.7 Hybrid (OOP + 70/30 + Laplace, 7KB)
│   ├── dayi_db.json                 # 字元資料庫 (743KB) ✅ 生產
│   ├── ngram_db.json                # N-gram 機率 (16MB, 279K bigrams) ✅ 生產使用
│   ├── ngram_pruned.json            # N-gram 機率 (3.2MB, 42K bigrams) ⏳ MVP 2a 預備
│   ├── README.md / README.en.md     # MVP1 文件
│   ├── organize-tests.sh            # 測試重組腳本 ✨ NEW!
│   └── tests/                       # 結構化測試 ✨ NEW!
│       ├── node/                    # Node.js 自動化測試 (10 個檔案)
│       ├── browser/                 # 瀏覽器測試頁面 (4 個檔案)
│       ├── diagnostic/              # 診斷工具 (7 個檔案)
│       ├── archived/                # 歷史測試 (26 個檔案)
│       └── README.md                # 測試結構說明
│
├── 📦 mvp3-smart-engine/            # 舊版 N-gram 實驗
│   └── (已被 viterbi_module.js 取代)
│
├── 📖 reference/                    # 參考資料
│   └── issue234.md
│
└── ⚙️ .github/workflows/            # CI/CD
    ├── test.yml                     # 自動化測試
    ├── deploy-pages.yml             # GitHub Pages 部署
    └── auto-bump-build.yml          # 自動版本號碼（Build 007 修復）✅
```

## 功能

### MVP 1.0 v9：核心引擎 + 現代 UI ✅ 完成

**基本功能：**
- ✅ 將大易字典載入記憶體（Map 資料結構，1,584 個字碼）
- ✅ 依字碼查詢候選字（例如：「4jp」→「易」、「義」）
- ✅ 依頻率排序（最常用的優先）
- ✅ 使用智慧鍵選字（Space/' /[/]/- /\）
  - **重要**：0-9 現在是字碼的一部分（例如：t0、t1），**不是**選字鍵
- ✅ 複製組合文字至剪貼簿

**進階功能（v3）：**
- ✅ **翻頁系統**：使用 `=` 鍵循環翻頁
  - 處理超過 60 個候選字的字碼（例如：ux：61 個候選字 → 11 頁）
  - 視覺指示器：「第 1/3 頁 = 換頁」
  - 最後一頁後循環回第一頁
- ✅ **第 3 字元自動選字**：加速打字
  - 輸入 2 碼 → 第 3 碼 → 第一候選字自動選取
  - 新字元成為新的輸入字碼
  - 不會在選字/翻頁鍵上觸發

**進階功能（v4）：**
- ✅ **智慧倒退**：專業輸入法風格的復原行為
  - 輸入有 2 碼時倒退 → 1 碼（**不會**觸發自動選字）
  - 輸入有 1 碼時倒退 → 空輸入
  - 輸入為空時倒退 → 從輸出緩衝區刪除最後一個字元
  - 連續倒退 → 持續從輸出刪除直到清空
  - 提供自然的修正與復原流程

**進階功能（v5）：**
- ✅ **輸入模式切換**：在一般與專注模式之間切換
  - 一般模式：完整 UI，含說明與品牌
  - 專注模式：極簡 UI（僅輸入/候選字/輸出）
  - 切換按鈕始終可見（右上角）
  - 偏好設定儲存至 localStorage（跨工作階段保留）
  - 專注模式的視覺指示器

**進階功能（v6）：**
- ✅ **使用者個人化**：輸入法學習您的字元偏好
  - **MVP1.7**：頁面載入時從 localStorage 載入個人記錄
  - **MVP1.8**：選取非預設候選字時儲存個人偏好
  - **MVP1.9**：在候選字排序中優先使用者偏好
  - 範例：字碼 `4jp` 偏好「義」而非「易」→「義」下次出現在第一位
  - 偏好設定跨工作階段保留
  - 與翻頁和自動選字無縫整合
  - 專業的自適應輸入法行為
  - **🐛 Bug 已修復**：自動選字現在正確使用使用者偏好（先前使用預設順序）

**進階功能（v7）：**
- ✅ **觸控友善 UX**：為手機和平板最佳化的互動
  - **MVP1.10**：點擊選取候選字 + 上下頁按鈕
  - 點擊任何候選字項目即可選取（無需鍵盤）
  - 視覺化 ◀ **上一頁** / **下一頁** ▶ 按鈕，方便翻頁
  - 觸控最佳化按鈕大小（最小 44px 觸控目標）
  - 懸停和活動狀態，提供清晰的視覺回饋
  - 維持鍵盤無障礙功能（可在聚焦項目上使用 Enter/Space）
  - 完美適合觸控裝置和軌跡板使用者

**進階功能（v8）：**
- ✅ **自動複製到剪貼簿**：無縫的輸出工作流程
  - **MVP1.11**：選字後自動複製到剪貼簿
  - 適用於所有選字方法（快速鍵、點擊、自動選字）
  - 視覺回饋：「✓ 已複製」提示訊息
  - 可切換控制：右上角的「🔄 自動複製」按鈕
  - 偏好設定儲存至 localStorage（跨工作階段保留）
  - 支援桌面和行動裝置（現代 Clipboard API）
  - 設計理念：每次選字後立即複製，提供可預測的行為
- ✅ **清除緩衝區按鈕**：快速重置
  - **MVP1.12**：一鍵清空輸出緩衝區
  - 位於「複製」按鈕旁邊，易於存取
  - 觸控最佳化（44px 最小觸控目標）
  - 響應式佈局（行動裝置垂直堆疊）
  - 提供暫時性的視覺回饋

**進階功能（v9）：**
- ✅ **Tailwind CSS 整合**：現代化設計系統
  - 採用業界標準的 utility-first CSS 框架
  - 完全響應式，支援所有裝置尺寸
  - 一致的設計 token（顏色、間距、圓角）
  - 取代傳統 CSS，維護更容易
- ✅ **深色模式支援**：保護眼睛的夜間模式
  - 一鍵切換深色/淺色主題
  - 自動偵測系統偏好（`prefers-color-scheme`）
  - 偏好設定儲存至 localStorage
  - 平滑的 200ms 顏色過渡動畫
  - 所有元素都有深色版本樣式
- ✅ **Material Symbols 圖標**：專業視覺系統
  - Google 的 Material Symbols Outlined 字型
  - 取代 emoji，視覺更統一專業
  - 完整支援深色模式
  - 所有按鈕和狀態都有對應圖標
- ✅ **新版面配置**：更直覺的操作流程
  - 輸出區域在上方（優先顯示結果）
  - 輸入區域在下方（符合由下而上的操作習慣）
  - 卡片式設計，圓角和陰影效果
  - 置中對齊，最大寬度 3xl（768px）
- ✅ **增強的響應式設計（RWD）**：完美支援所有裝置
  - **手機 (<640px)**：按鈕僅顯示圖標，節省空間
  - **平板 (640px-1024px)**：響應式 padding 和間距
  - **桌面 (>1024px)**：完整佈局，包含按鈕文字
  - 所有觸控目標至少 44px（iOS 和 Material Design 標準）
- ✅ **現代視覺設計**：美觀且專業
  - 主色調：`#0fb8f0`（cyan/turquoise）
  - Space Grotesk 字型（現代幾何 sans-serif）
  - 平滑的過渡動畫（200-300ms）
  - Hover 和 active 狀態的視覺回饋
  - 漸層和陰影增加視覺深度

**目標使用者**：開發者（用於驗證）與進階使用者
**輸出方法**：自動複製到剪貼簿 + 手動複製/清除
**測試涵蓋率**：59/59 測試通過，採用 TDD（19 個個人化 + 16 個 bug 修復 + 24 個自動複製測試）
**UI 技術**：Tailwind CSS v3 + Material Symbols + Space Grotesk 字型

### MVP 2a：瀏覽器外掛（規劃中）

- ✅ Chrome 擴充套件（Manifest V3）
- ✅ 攔截網頁中的按鍵
- ✅ 在游標位置動態顯示候選字 UI
- ✅ 即時文字注入（無需複製/貼上）
- ✅ 適用於 Gmail、Google Docs、Notion

**目標使用者**：終端使用者
**輸出方法**：原生打字體驗

### 未來：MVP 2a+（路線圖）

- 🔮 雲端同步（透過 chrome.storage.sync 同步個人字典）
- 🔮 情境感知（針對 github.com 與 gmail.com 提供不同建議）
- 🔮 N-gram 學習（智慧詞組完成）
- 🔮 手動字典編輯

## 技術堆疊

- **語言**：JavaScript（ES6+）
- **執行環境**：Chrome 88+
- **擴充套件**：Manifest V3
- **資料**：JSON（來自 Rime YAML）
- **相依性**：零（正式版）、js-yaml（開發版）

**理念**：無框架，最大透明度

## 開發

### 先決條件

- Node.js ≥ 18
- Chrome 瀏覽器 ≥ 88
- JavaScript 基礎知識

### 目前階段：資料處理管線

```bash
# 1. 設定轉換器
mkdir -p converter/raw_data
mv dayi2dict.yaml converter/raw_data/dayi.dict.yaml

# 2. 安裝相依性
cd converter
npm install js-yaml

# 3. 執行轉換器（待實作）
node convert.js

# 4. 驗證輸出
cat ../mvp1/dayi_db.json | jq '."4jp"'
# 預期：[{"char":"易","freq":80}, ...]
```

### 測試

**測試涵蓋率**：✅ 80/80 測試通過（採用 TDD）

```bash
# 轉換器測試（21 個測試）
cd converter
node convert-v2.test.js
# ✓ 頻率解析（3 個測試）
# ✓ 頻率計算（5 個測試）
# ✓ 大易字典解析（3 個測試）
# ✓ 候選字豐富化（3 個測試）
# ✓ 整合測試（3 個測試）
# ✓ 邊界測試（4 個測試）

# MVP1 測試（59 個測試）
cd mvp1
node test-node-v6.js  # 使用者個人化（19 個測試）
node test-node-v7.js  # 自動選字 bug 修復（16 個測試）
node test-node-v8.js  # 自動複製與清除按鈕（24 個測試）

# 瀏覽器手動測試
open mvp1/index.html
# 或執行測試套件：
open mvp1/test.html

# 測試擴充套件（Phase 2 - 規劃中）
# chrome://extensions → 開發人員模式 → 載入未封裝項目
```

**測試詳情**：
- **Phase 0（轉換器）**：21 個自動化測試，涵蓋頻率解析、計算與資料庫建立
- **Phase 1（MVP1）**：59 個自動化測試，涵蓋個人化、自動選字、bug 修復、自動複製與清除功能
- **總計**：80 個測試，100% 通過率

## 貢獻

**目前狀態**：個人開發專案（學習/驗證階段）

一旦 MVP 2a 驗證完成，歡迎貢獻：
- Firefox 擴充套件移植
- 額外語言模型
- UI/UX 改進
- 文件

## 路線圖

| 里程碑 | 目標日期 | 狀態 |
|-----------|-------------|--------|
| ✅ 專案初始化 | 2025-11-06 | 完成 |
| ✅ Phase 0：資料處理管線（v1） | 2025-11-06 | 完成 |
| ✅ Phase 0：增強轉換器（v2，頻率排序） | 2025-11-06 | 完成 |
| ✅ MVP 1.0 v1：核心引擎 | 2025-11-06 | 完成 |
| ✅ MVP 1.0 v2：選字鍵修正 | 2025-11-06 | 完成 |
| ✅ MVP 1.0 v3：翻頁與自動選字 | 2025-11-06 | 完成 |
| ✅ MVP 1.0 v4：智慧倒退 UX | 2025-11-06 | 完成 |
| ✅ MVP 1.0 v5：輸入模式切換 | 2025-11-06 | 完成 |
| ✅ MVP 1.0 v6：使用者個人化 | 2025-11-06 | 完成 |
| ✅ MVP 1.0 v7：觸控友善 UX + Bug 修復 | 2025-11-06 | 完成 |
| ✅ MVP 1.0 v8：自動複製 + 清除按鈕 | 2025-11-10 | 完成 |
| ✅ MVP 1.0 v9：Tailwind CSS + 深色模式 | 2025-11-10 | 完成 |
| ✅ MVP 1.0 v10：手機 UX + 字體控制 + 錯誤修正 | 2025-11-10 | 完成 |
| ✅ MVP 1.0 v11：N-gram 智能預測（核心 + UI） | 2025-11-10 | 完成 |
| ✅ MVP 1.0 v11.2：事件處理器 + 緩衝區修復 + 手機 UX | 2025-11-11 | 完成 |
| ✅ MVP 1.0 v11.3.5：v2.7 Hybrid + 完整資料庫 + 文件 | 2025-11-12 | 完成 |
| 📋 MVP 3.0：N-gram 資料管線 + Viterbi | 2025-11-10 | 已整合至 v11 |
| ⏳ MVP 2a：瀏覽器外掛（資料庫優化） | 2025-11-20 | 規劃中 |
| ⏳ 公開發布（Chrome 線上應用程式商店） | 2025-11-25 | 規劃中 |
| 📋 MVP 2a+：進階功能 | 2025-12-15 | 未來 |

## 理念

> **寄生於資料，創新於體驗**

我們不重建大易字典——我們採用 Rime 優秀的開源成果。我們的創新在於：

- **可及性**：網頁優先，在您打字的地方運作
- **透明度**：可讀、可修改的程式碼
- **可擴展性**：易於新增學習功能
- **無縫性**：瀏覽器原生體驗

## 授權

開源（授權待定 - 目前為開發階段）

## 致謝

- **Rime 專案**：高品質大易字典資料來源（dayi.dict.yaml）
- **Rime Essay**：正體中文語料庫（essay.txt，442K 條目，用於 N-gram 訓練）
- **大易輸入法**：經典中文輸入系統
- **開源社群**：靈感與工具

## 聯絡

- **問題回報**：[GitHub Issues](../../issues)（公開時）
- **討論**：[GitHub Discussions](../../discussions)（公開時）

---

**最後更新**：2025-11-12
**狀態**：✅ MVP 1.0 v11.3.5 完成（v2.7 Hybrid + 完整資料庫 + 文件完整 - 智慧引擎生產就緒！）
**版本**：1.0.11.3.5-build009（MVP1 v11.3 with v2.7 Hybrid Algorithm + Full N-gram Database + 94.4% Accuracy）
**資料來源**：Rime Dàyì Dictionary + Rime Essay Corpus (rime-essay/essay.txt, 717M chars)
**演算法**：Viterbi v2.7 Hybrid (OOP + 70/30 Weighting + Laplace Smoothing)
