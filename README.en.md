# WebDayi (網頁大易輸入法)

> **Language / 語言**: [English](README.en.md) | [正體中文](README.md)

> Lightweight, Transparent, Web-First Dayi Input Method Engine.

[![Status](https://img.shields.io/badge/status-MVP%202.0%20Beta-blue)]()
[![License](https://img.shields.io/badge/license-open%20source-green)]()

---

## 📖 Overview

**WebDayi** is a modern implementation of the Dayi input method for the web.

**Current Focus: MVP 2.0 (Predictive Type-ahead)**
We are currently developing a predictive engine ("Smart 2-Code") to significantly reduce keystrokes.
- **Smart Spacebar**: Confirm "Phantom" suggestions with Space.
- **Smart Compose**: Continuous next-word prediction with Tab confirmation, smart safety checks, and auto-fade.
- **Prediction Refinements**: Includes **Frequency Dominance** and **Context Absolute Priority** for higher accuracy.
- **Predictive Engine**: Intelligent suggestions based on Frequency, Context (Bigram), and **User Habit**.
- **Smart Input**: Supports 3/4 code toggling, Smart Auto-Commit, and Error Shake.
- **Lightweight**: Pure client-side, no server dependencies.

---

## 🚀 Quick Start

### MVP 2.0: Predictive Type-ahead (Current)
The latest version with Smart Spacebar and predictive features.
1.  Navigate to `mvp2-predictive/`.
2.  Open `index.html` in your browser.
3.  See `mvp2-predictive/README.md` for details.

### WebDayi Lite (Stable)
The lightweight, PWA-ready version for mobile and desktop.
1.  Navigate to `lite/`.
2.  Open `index.html`.

### Legacy Versions
Older prototypes (MVP1, Vue.js) are moved to `archive/`.

---

## 🏗️ Directory Structure

```
webdayi/
├── mvp2-predictive/        # MVP 2.0 (Current Focus)
│   ├── index.html          # Main Application
│   ├── js/                 # Application Logic
│   │   ├── app.js
│   │   └── prediction_engine.js
│   ├── tests/              # Test Scripts
│   │   ├── data_quality.test.js
│   │   └── prediction.test.js
│   ├── data/               # Data Files
│   │   ├── bigram_lite.json
│   │   ├── dayi_db.json
│   │   └── zhuyin_db.json
│   └── README.md           # MVP2 Documentation
│
├── lite/                   # WebDayi Lite (Stable PWA)
│   ├── index.html
│   └── app.js
│
├── archive/                # Legacy Versions
│   ├── mvp1/               # Original Vue.js Prototype
│   └── mvp1-pwa/           # Early PWA Experiments
│
└── memory-bank/            # Project Documentation
    ├── activeContext.md    # Current Status
    ├── productContext.md   # Goals & Vision
    ├── systemPatterns.md   # Architecture
    └── techContext.md      # Tech Stack
```

---

## 📚 Documentation

- **[activeContext.md](memory-bank/activeContext.md)**: Current development status.
- **[productContext.md](memory-bank/productContext.md)**: Project goals and vision.
- **[systemPatterns.md](memory-bank/systemPatterns.md)**: Architecture and design patterns.
- **[techContext.md](memory-bank/techContext.md)**: Technology stack.

---

## 🎯 Roadmap

- ✅ **MVP 1.0**: Vue.js Prototype (Archived)
- ✅ **WebDayi Lite**: Lightweight PWA (Stable)
- 🚧 **MVP 2.0**: Predictive Type-ahead (Completed)
    - ✅ Smart Spacebar
    - ✅ 3-Layer Weighted Prediction Engine (Frequency + Bigram + User Habit)
    - ✅ Extended Prediction (Prefix Search)
    - ✅ Smart 3/4 Code Toggle & Auto-Commit (Auto for 3-code, Manual for 4-code)
    - ✅ Smart 3/4 Code Toggle & Auto-Commit (Auto for 3-code, Manual for 4-code)
    - ✅ Smart Compose (Continuous Prediction + Tab Confirm + Auto-Fade)
    - ✅ Prediction Refinements (Frequency Dominance + Context Absolute Priority)
    - ✅ Mini Mode Settings Menu
    - ✅ **PWA Mode Control**: Mobile defaults to Focus Mode, Laptop defaults to Mini Mode
    - ✅ Mobile Web UI Consistency (Unified Header, No FAB)
    - ✅ Focus Mode Layout Fix
    - ✅ **Data Quality Verification**: Automated testing framework with 100% pass rate.

---

## 📄 License

Open Source. Contributions welcome!

### Acknowledgements
- **Rime Input Method**: Data source ([rime/rime-dayi](https://github.com/rime/rime-dayi))
- **Dayi Input Method**: Created by Mr. Wang Zan-jie.
