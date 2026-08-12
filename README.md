# WebDayi (網頁大易輸入法)

> **語言 / Language**: [正體中文](README.md) | [English](README.en.md)

> 輕量、透明、網頁優先的大易輸入法引擎。

[![Status](https://img.shields.io/badge/status-Lite%20stable%20%2B%20Smart%20PoC-blue)]()
[![License](https://img.shields.io/badge/license-open%20source-green)]()

---

## 📖 概述

**WebDayi** 是一個現代化的網頁版大易輸入法實作。純客戶端執行、無伺服器、無 build step,
push 即部署於 GitHub Pages。

**產品現況**:

- ✅ **WebDayi Lite**(`/lite/`):**唯一穩定版**。傳統 4 碼逐字輸入的輕量 PWA。
- 🚧 **WebDayi Smart**(`/smart/`):**開發中(v0.2.0)**。智慧 2 碼輸入——每字只打
  2 碼(首碼+末碼),詞級 Viterbi 解碼整句,錯字一鍵替換,附全碼逃生口;
  UX 與 Lite 對齊(傳統選字鍵、Mini 模式、Ctrl/Alt 熱鍵、PWA)。
  離線評測 top-1 **97.4%**。技術說明見
  [`smart/docs/how-it-works.html`](smart/docs/how-it-works.html)。
- 📦 **MVP2(Smart Compose 預測型輸入)**:已封存至 `archive/mvp2-predictive/`,
  封存原因見其 README(預測方向的結構性問題)。
- 📦 **MVP3(N-gram Smart Engine)**:已封存至 `archive/mvp3-smart-engine/`,
  驗屍報告見 [`smart/docs/mvp3-postmortem.md`](smart/docs/mvp3-postmortem.md)。

---

## 🚀 快速開始

### WebDayi Lite(穩定版)
適用於手機和桌面的輕量級 PWA 版本。

👉 **[https://clarencechien.github.io/webdayi/lite/index.html](https://clarencechien.github.io/webdayi/lite/index.html)**

### WebDayi Smart(智慧 2 碼,開發中)
每個字只打 2 碼(首碼+末碼),由語言模型解碼消歧義;錯字按選字鍵一下替換,冷僻字有全碼逃生口。

👉 `https://clarencechien.github.io/webdayi/smart/`

想知道它怎麼運作(unigram / bigram / Viterbi,大學生看得懂的版本):
👉 `https://clarencechien.github.io/webdayi/smart/docs/how-it-works.html`

---

## 🏗️ 目錄結構

```
webdayi/
├── lite/                   # WebDayi Lite(穩定版 PWA)— 不動它
│   ├── index.html
│   └── dayi_db.json
│
├── smart/                  # WebDayi Smart(智慧 2 碼 PoC,開發中)
│   ├── index.html          # 主頁面(以 Lite codebase 為起點)
│   ├── js/                 # 解碼引擎與 UI 邏輯
│   ├── data/               # 碼表 + 語言模型資料(抽自 mvp2/mvp3 可重用資產)
│   ├── tests/              # 評測 harness、引擎單元測試、UI 煙霧測試、驗屍腳本
│   └── docs/               # how-it-works.html(技術說明)、驗屍與診斷報告、UI mockup
│
├── converter/              # 離線資料管線(碼表轉換、n-gram 建置)
│
├── scripts/                # 工具腳本
│
├── archive/                # 舊版本封存(僅供考古,不再維護)
│   ├── mvp1_legacy/        # MVP1 Viterbi 版
│   ├── mvp1_pwa_legacy/    # 早期 PWA 實驗
│   ├── mvp2-predictive/    # MVP2 Smart Compose(封存說明見其 README)
│   ├── mvp3-smart-engine/  # MVP3 N-gram 引擎(驗屍報告見 smart/docs/)
│   ├── issue/              # 歷史 issue 截圖
│   └── reference/          # 歷史參考資料
│
└── memory-bank/            # 專案文件
    ├── activeContext.md    # 當前狀態
    ├── productContext.md   # 目標與願景
    ├── systemPatterns.md   # 系統架構
    └── techContext.md      # 技術堆疊
```

---

## 📚 文件

- **[activeContext.md](memory-bank/activeContext.md)**:當前開發狀態。
- **[smart/docs/mvp3-postmortem.md](smart/docs/mvp3-postmortem.md)**:MVP3 驗屍報告(為什麼收、學到什麼)。
- **[productContext.md](memory-bank/productContext.md)**:專案目標與願景。
- **[systemPatterns.md](memory-bank/systemPatterns.md)**:架構與設計模式。
- **[techContext.md](memory-bank/techContext.md)**:技術堆疊。

---

## 🎯 路線圖

- 📦 **MVP 1.0**(Vue.js 原型 / Viterbi 版):已封存
- ✅ **WebDayi Lite**:輕量級 PWA(穩定版)
- 📦 **MVP 2.0(預測型輸入 / Smart Compose)**:**已封存**
  —— 預測「未知的下一個字」條件熵太高(4–5 bits),top-1 命中率天生一兩成,
  認知中斷成本為負體驗,屬結構性問題。詳見
  [封存說明](archive/mvp2-predictive/README.md)。
- 📦 **MVP 3.0(N-gram Smart Engine)**:**已封存**
  —— 方向(解碼)正確,但 bigram 資料由詞頻表建出、跨詞轉移缺失,加上計分缺陷。
  詳見 [驗屍報告](smart/docs/mvp3-postmortem.md)。
- 🚧 **WebDayi Smart(智慧 2 碼)**:v0.2.0,實測回饋中
  - 理論:2 碼把候選壓到 ~8 個(收斂只需 ~3 bits),bigram 供 4–5 bits
    ——同一份資料,消歧義綽綽有餘、預測遠遠不夠。
  - [x] 評測 harness + 詞頻診斷(2 碼 top-1 **97.4%**,門檻 85% ✅;
    資料重建自 McBopomofo phrase.occ,見 [freq-diagnosis](smart/docs/freq-diagnosis.md))
  - [x] 連碼 2 碼 Viterbi 解碼引擎(詞級 lattice,`smart/js/decoder.js`)
  - [x] 修正 UI(點選替換 + 重跑解碼)+ 全碼逃生口(`` ` ``)
  - [x] UX 對齊 Lite:傳統選字鍵(一頁 5 個 + `=` 換頁)、Mini 模式(A′ 版面)、
    Ctrl/Alt 熱鍵、送出後自動複製、滿版貼底鍵盤、PWA
  - [x] [技術說明頁](smart/docs/how-it-works.html):資訊理論框架、資料來源、Viterbi 解碼
  - [ ] 傳統(4 碼)/ 智慧(2 碼)模式切換

---

## 📄 授權

開源專案。歡迎貢獻!

### 致謝
- **Rime 輸入法**:資料來源 ([rime/rime-dayi](https://github.com/rime/rime-dayi)、[rime/rime-essay](https://github.com/rime/rime-essay))
- **大易輸入法**:由王贊傑先生發明。
