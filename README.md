# WebDaYi (網頁大易輸入法)

> **Language / 語言**: [English](README.en.md) | [正體中文](README.md)

> 輕量、透明、網頁優先的大易中文輸入法引擎

[![Status](https://img.shields.io/badge/status-Phase%201.10.4%20COMPLETE-brightgreen)]()
[![Version](https://img.shields.io/badge/version-0.5.0--build.011-blue)]()
[![Tests](https://img.shields.io/badge/tests-85%2F85%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-open%20source-green)]()

---

## 📖 概述

**WebDaYi** 是一個輕量、透明的**大易中文輸入法引擎**，採用純 JavaScript 實作，整合 N-gram 語言模型和 Viterbi 演算法，提供智慧句子預測功能。

**核心特色**:
- 🧠 **雙模式輸入**: 逐字模式 ↔ 整句模式（智慧預測）
- ✏️ **字元級編輯**: 點擊字元、方向鍵導航、Space 開啟候選、Enter 送出
- ⚡ **Viterbi 演算法**: 基於 rime-essay 語料庫 (717M 字元，94.4% 準確度)
- 📊 **Laplace 平滑**: 完整統計平滑處理
- 📱 **跨平台**: 完美支援桌面與手機，響應式設計
- 🎨 **現代 UI**: Tailwind CSS + 深色模式 + PWA 支援

---

## 🚀 立即試用

**[👉 線上展示 (GitHub Pages)](https://clarencechien.github.io/webdayi/mvp1-pwa/)**

在瀏覽器中直接體驗，無需安裝！

---

## 🎯 現況一覽

**最新版本**: v0.5.0 (Build: 20251113-011) - Phase 1.10.4 COMPLETE

### Phase 1.10: 字元級編輯系統 ✅
完整的智慧字元編輯工作流程，讓句子修正變得前所未有的簡單！

| 階段 | 功能 | 測試 | 狀態 |
|------|------|------|------|
| **Phase 1.10.1** | 字元架構 | 24 tests | ✅ |
| **Phase 1.10.2** | 候選選擇視窗 | 22 tests | ✅ |
| **Phase 1.10.3** | 自動前進 + 方向鍵 | 20 tests | ✅ |
| **Phase 1.10.4** | 完成編輯 + 送出 | 19 tests | ✅ |
| **總計** | 完整工作流程 | **85 tests** | ✅ |

### 完整工作流程
```
1️⃣ 輸入：4jp ad a → 按 =
2️⃣ 預測：易在大（立即可用方向鍵）
3️⃣ 編輯：→ → 移到「大」→ Space 開啟候選 → 選「移」
4️⃣ 完成：綠色提示「按 Enter 送出」
5️⃣ 送出：Enter → 「義在移」到輸出區
```

**鍵盤快捷鍵**:
- **← →**: 字元間導航
- **Space**: 開啟候選視窗
- **Enter**: 送出編輯結果
- **Space/'[]\\-**: 選擇候選字 #0-5（視窗內）
- **Escape**: 關閉視窗

---

## 📦 快速開始

### 給開發者
```bash
# 克隆專案
git clone https://github.com/clarencechien/webdayi.git
cd webdayi

# 測試 N-gram 演算法
cd mvp1-pwa
node ../mvp1/tests/node/test-v27-hybrid.js  # v2.7 Hybrid (94.4% 準確度)

# 啟動本地伺服器
python3 -m http.server 8000
# 或
npx http-server -p 8000

# 開啟瀏覽器
open http://localhost:8000
```

### 執行測試
```bash
# Phase 1.10 測試
open mvp1-pwa/tests/test-phase-1.10.2-candidate-modal.html
open mvp1-pwa/tests/test-phase-1.10.3-auto-advance-navigation.html
open mvp1-pwa/tests/test-phase-1.10.4-finish-and-submit.html

# 預期結果: 85/85 tests passing ✅
```

---

## 📚 文件

### 核心文件
| 文件 | 說明 |
|------|------|
| **[CLAUDE.md](CLAUDE.md)** | Claude Code 協作指南（專案說明） |
| **[PRD.md](docs/project/PRD.md)** | 產品需求文件 (v1.3) |
| **[activeContext.md](memory-bank/activeContext.md)** | 當前開發狀態與技術脈絡 |

### 實作與測試
| 文件 | 說明 |
|------|------|
| **[PHASE-1.10-SUMMARY.md](docs/PHASE-1.10-SUMMARY.md)** | Phase 1.10 完整實作總結 |
| **[PHASE-1.10-TEST-SUMMARY.md](docs/PHASE-1.10-TEST-SUMMARY.md)** | Phase 1.10 測試覆蓋報告 |
| **[SMART-ENGINE-JOURNEY.md](docs/SMART-ENGINE-JOURNEY.md)** | 智慧引擎演進歷程 (v2.1 → v2.7) |

### 設計與 UX
| 文件 | 說明 |
|------|------|
| **[PHASE-1.10-CHARACTER-EDITING-UI.md](docs/design/PHASE-1.10-CHARACTER-EDITING-UI.md)** | 字元編輯 UI 設計文件 |
| **[DESIGN-v11.md](docs/design/DESIGN-v11.md)** | v11 雙模式設計文件 |
| **[docs/ux/](docs/ux/)** | UX 改進與問題修復文件 |

---

## 🏗️ 專案結構

```
webdayi/
├── mvp1-pwa/                   # 主要應用程式 (PWA)
│   ├── index.html              # 主頁面
│   ├── js/                     # JavaScript 模組
│   │   ├── core_logic.js       # 核心邏輯 (v10)
│   │   ├── core_logic_v11.js   # v11 核心 (N-gram + 雙模式)
│   │   ├── core_logic_v11_ui.js # v11 UI 整合
│   │   ├── viterbi_module.js   # Viterbi 演算法
│   │   └── user_db_indexeddb.js # PWA 學習資料庫
│   ├── tests/                  # 測試檔案
│   │   ├── test-phase-1.10.2-candidate-modal.html
│   │   ├── test-phase-1.10.3-auto-advance-navigation.html
│   │   └── test-phase-1.10.4-finish-and-submit.html
│   ├── dayi_db.json            # 大易碼表 (O(1) 查詢)
│   └── ngram_db.json           # N-gram 資料庫 (279K bigrams)
│
├── converter/                  # 資料轉換工具
│   ├── convert.js              # YAML → JSON 轉換器
│   ├── build_ngram.py          # N-gram 資料庫建構
│   └── raw_data/               # 原始 Rime 資料
│
├── docs/                       # 文件
│   ├── project/                # 專案文件 (PRD, 驗證, 版本指南)
│   ├── design/                 # 設計文件 (v10, v11, N-gram)
│   ├── testing/                # 測試文件
│   └── ux/                     # UX 改進文件
│
├── memory-bank/                # 開發脈絡
│   ├── activeContext.md        # 當前狀態 (精簡版)
│   ├── archived-context.md     # 歷史記錄
│   ├── productContext.md       # 產品脈絡
│   ├── systemPatterns.md       # 系統模式
│   └── techContext.md          # 技術脈絡
│
├── CLAUDE.md                   # Claude Code 專案指南
└── README.md                   # 本文件
```

---

## 🛠️ 技術堆疊

- **前端**: Vanilla JavaScript (ES6+)
- **UI**: Tailwind CSS + Material Icons
- **演算法**: Viterbi + N-gram (Laplace Smoothing)
- **資料**: JSON (O(1) lookup) + IndexedDB (PWA)
- **測試**: 手動 + 瀏覽器 TDD 測試
- **部署**: GitHub Pages (靜態托管)

---

## 🎯 路線圖

### ✅ 已完成
- ✅ **MVP 1.0 v11.3**: 雙模式輸入 + N-gram 預測
- ✅ **Phase 1.10**: 完整字元級編輯系統 (85 tests)
- ✅ **v2.7 Hybrid**: 94.4% 準確度
- ✅ **PWA**: Progressive Web App + 學習功能

### 🚧 進行中
- 🚧 **Phase 2**: 生產優化與打磨

### 📋 規劃中
- 📋 **MVP 2a**: Chrome 擴充套件 (瀏覽器外掛)
- 📋 **MVP 3.0**: 更多智慧功能

---

## 📄 授權

本專案採用開源授權。歡迎貢獻！

### 致謝
- **Rime 輸入法**: 碼表資料來源 ([rime/rime-dayi](https://github.com/rime/rime-dayi))
- **rime-essay**: N-gram 訓練語料 ([rime/rime-essay](https://github.com/rime/rime-essay))
- **大易輸入法**: 王贊傑先生創造的優秀輸入法

---

## 📞 聯絡

有問題或建議？歡迎：
- 🐛 [提交 Issue](https://github.com/clarencechien/webdayi/issues)
- 💬 [參與討論](https://github.com/clarencechien/webdayi/discussions)

---

*最後更新: 2025-11-13 | Phase 1.10.4 COMPLETE*
