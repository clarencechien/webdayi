# WebDayi (網頁大易輸入法)

> **語言 / Language**: [正體中文](README.md) | [English](README.en.md)

> 輕量、透明、網頁優先的大易輸入法引擎。

[![Status](https://img.shields.io/badge/status-MVP%202.0%20Beta-blue)]()
[![License](https://img.shields.io/badge/license-open%20source-green)]()

---

## 📖 概述

**WebDayi** 是一個現代化的網頁版大易輸入法實作。

**當前重點：MVP 2.0 (預測型輸入)**
我們已完成開發能夠顯著減少按鍵次數的預測引擎（"Adaptive Predictive Engine"）。
- **智慧空白鍵 (Smart Spacebar)**：使用空白鍵確認「幽靈文字 (Phantom)」建議。
- **Smart Compose**：連續預測下一個字，支援 Tab 鍵確認，具備智慧防呆與自動淡出功能。
- **預測優化**：包含「頻率壓制 (Frequency Dominance)」與「上下文絕對優先 (Context Absolute Priority)」，確保預測精準度。
- **預測引擎**：基於頻率、上下文 (Bigram) 和 **使用者習慣** 的智慧建議。
- **智慧輸入**：支援 3/4 碼切換、智慧自動上字 (Smart Auto-Commit) 和錯誤防呆 (Shake)。
- **輕量化**：純客戶端執行，無伺服器依賴。

---

## 🚀 快速開始

### MVP 2.0: 預測型輸入 (最新版本)
具備智慧空白鍵、預測功能和 Mini Mode 設定選單的最新版本。
1.  前往 `mvp2-predictive/` 目錄。
2.  在瀏覽器中打開 `index.html`。
3.  詳情請參閱 `mvp2-predictive/README.md`。
   
[https://clarencechien.github.io/webdayi/lite/index.html](https://clarencechien.github.io/webdayi/mvp2-predictive/index.html)

### WebDayi Lite (穩定版)
適用於手機和桌面的輕量級 PWA 版本。
1.  前往 `lite/` 目錄。
2.  打開 `index.html`。
   
[https://clarencechien.github.io/webdayi/lite/index.html](https://clarencechien.github.io/webdayi/lite/index.html)

### 舊版本
早期的原型 (MVP1, Vue.js) 已移動至 `archive/`。

---

## 🏗️ 目錄結構

webdayi/
├── mvp2-predictive/        # MVP 2.0 (當前開發重點)
│   ├── index.html          # 主應用程式
│   ├── js/                 # 應用程式邏輯
│   │   ├── app.js
│   │   └── prediction_engine.js
│   ├── tests/              # 測試與除錯工具
│   │   ├── debug_lab.html
│   │   ├── test.html
│   │   └── test_integration.html
│   ├── data/               # 資料檔案
│   │   ├── bigram_lite.json
│   │   ├── dayi_db.json
│   │   └── zhuyin_db.json
│   └── README.md           # MVP2 文件
│
├── lite/                   # WebDayi Lite (穩定版 PWA)
│   ├── index.html
│   └── app.js
│
├── scripts/                # 工具腳本
│   ├── analyze_cin.py
│   ├── find_lines.py
│   └── test-github-pages.js
│
├── archive/                # 舊版本存檔
│   ├── mvp1/               # 原始 Vue.js 原型
│   └── mvp1-pwa/           # 早期 PWA 實驗
│
└── memory-bank/            # 專案文件
    ├── activeContext.md    # 當前狀態
    ├── productContext.md   # 目標與願景
    ├── systemPatterns.md   # 系統架構
    └── techContext.md      # 技術堆疊
```

---

## 📚 文件

- **[activeContext.md](memory-bank/activeContext.md)**：當前開發狀態。
- **[productContext.md](memory-bank/productContext.md)**：專案目標與願景。
- **[systemPatterns.md](memory-bank/systemPatterns.md)**：架構與設計模式。
- **[techContext.md](memory-bank/techContext.md)**：技術堆疊。

---

## 🎯 路線圖

- ✅ **MVP 1.0**：Vue.js 原型 (已存檔)
- ✅ **WebDayi Lite**：輕量級 PWA (穩定版)
- 🚧 **MVP 2.0**：預測型輸入 (已完成)
    - ✅ 智慧空白鍵
    - ✅ 3層權重預測引擎 (頻率 + Bigram + 使用者習慣)
    - ✅ 擴充預測 (Prefix Search)
    - ✅ Smart 3/4 碼切換與自動上字 (3碼自動，4碼手動)
    - ✅ Smart Compose (連續預測 + Tab 確認 + 自動淡出)
    - ✅ 預測優化 (頻率壓制 + 上下文絕對優先)
    - ✅ Mini Mode 設定選單
    - [x] **PWA Mode Control**：Mobile 預設 Focus Mode，Laptop 預設 Mini Mode
    - [x] **Mini Mode Toggle**：Mini Mode 選單新增手動切換模式按鈕
    - [x] **Laptop Focus Mode**：桌面版 Focus Mode 介面優化（置中、限制寬度）
- [x] **Small Screen Optimization**：針對 iPhone SE 等小螢幕裝置優化版面配置
    - ✅ Mobile Web UI 一致性優化 (Unified Header, No FAB)
    - ✅ Focus Mode 鍵盤佈局修正
    - ✅ **資料品質驗證 (Data Quality Verification)**：建立自動化測試框架，達成 100% 通過率。

---

## 📄 授權

開源專案。歡迎貢獻！

### 致謝
- **Rime 輸入法**：資料來源 ([rime/rime-dayi](https://github.com/rime/rime-dayi))
- **大易輸入法**：由王贊傑先生發明。
