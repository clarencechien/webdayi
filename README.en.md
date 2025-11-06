# WebDaYi (網頁大易輸入法)

> **Language / 語言**: [English](README.en.md) | [正體中文](README.md)

> A lightweight, transparent, Web-First Input Method Engine for Dàyì (大易) Chinese Input

[![Status](https://img.shields.io/badge/status-MVP%201%20v7%20Complete%20%2B%20Bug%20Fix-brightgreen)]()
[![Phase](https://img.shields.io/badge/phase-MVP%201.0%20v7-blue)]()
[![Tests](https://img.shields.io/badge/tests-35%2F35%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-open%20source-green)]()

## 🎉 Live Demo

**[Try WebDaYi MVP1 v7 Now →](https://clarencechien.github.io/webdayi/)** (GitHub Pages)

Experience the core Dàyì input engine in your browser with advanced features:
- 🚀 **Auto-select**: Type 2 chars + 3rd char = auto-select first candidate (speeds up typing!)
- 📄 **Pagination**: Press `=` to cycle through pages when there are 60+ candidates
- ⌨️ **Smart Selection**: Use Space/' /[/]/- /\ to select candidates (0-9 are now part of codes!)
- ⌫ **Smart Backspace**: Deletes input first, then output buffer (natural undo flow!)
- 🎯 **Express Mode**: Toggle to minimal UI (hide distractions, focus on input!)
- 🧠 **User Personalization**: IME learns your preferences! (MVP1.7-1.9) **[Bug Fixed!]**
- 📱 **Touch-Friendly**: Click to select + prev/next page buttons! (MVP1.10)

## Overview

**WebDaYi** replaces complex, monolithic IME frameworks with a simple, modern solution built in JavaScript. Instead of wrestling with configuration files, you get a transparent input method that:

- 🎯 **Just Works**: Zero configuration required
- 🪶 **Lightweight**: Pure JavaScript, no heavy frameworks
- 🔍 **Transparent**: Every line of code is readable and modifiable
- 🌐 **Browser-First**: Optimized for Gmail, Google Docs, Notion, and other web apps
- 🔄 **Smart**: Leverages Rime's excellent Dàyì dictionary data

## Project Status

**Current Phase**: ✅ MVP 1.0 v7 Complete!
**Completion**: ~48% (Phase 0 & MVP 1 v7 done, MVP 2a next)

```
┌──────────────────────────────────────────────────────────┐
│ Phase 0: Data Pipeline        [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│ Phase 1: MVP 1.0 v7           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Selection Keys Fix       [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Pagination               [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Auto-select              [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Smart Backspace          [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Input Mode Toggle        [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ User Personalization     [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   └─ Touch-Friendly UX        [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│ Phase 2: MVP 2a               [░░░░░░░░░░░░]   0% ⏳    │
└──────────────────────────────────────────────────────────┘
```

**Latest Achievement**: MVP 1.0 v7 with touch-friendly UX + critical bug fix (35/35 tests passing)
- ✅ Touch-friendly UX implemented (MVP1.10)
- 🐛 Fixed: Auto-select now respects user preferences (MVP1.9 bug fix)
**Next Milestone**: Begin MVP 2a (Browser Plugin) implementation

## Quick Start

### Try It Now (Live Demo)

**[Launch WebDaYi MVP1 v7 →](https://clarencechien.github.io/webdayi/)**

No installation required! Just open the link and start typing:
- Try `v` → 大, 夫, 禾
- Try `a` → 人, 入
- Try `ux` → 61 candidates, press `=` or use buttons to page through
- Press `Space` (1st), `'` (2nd), `[` (3rd), `]` (4th), `-` (5th), `\` (6th) to select
- **Or click** candidates directly to select (touch-friendly!)
- Type 2 chars then continue → auto-selects first candidate!
- Press `Backspace` to undo (deletes input, then output buffer)
- Toggle to Express Mode (top-right) for minimal UI
- Select a non-default candidate → **IME learns your preference and uses it in auto-select!** [Bug Fixed ✅]
- **New**: Use ◀ **上一頁** / **下一頁** ▶ buttons for easy paging on mobile/tablet!
- Click "Copy" when done

### For Developers

```bash
# Clone repository
git clone https://github.com/clarencechien/webdayi.git
cd webdayi

# Run tests (all 35 tests should pass)
cd mvp1
node test-node-v6.js  # User personalization tests (19/19)
node test-node-v7.js  # Auto-select bug fix tests (16/16)

# Open locally in browser
open index.html
# Or use a local server:
python3 -m http.server 8000
# Visit: http://localhost:8000

# Data Pipeline: Regenerate database (if needed)
cd ../converter
node convert-v2.js  # Creates mvp1/dayi_db.json with frequency data (recommended)
# Or use: node convert.js (basic version)
```

### For Future (MVP 2a - Browser Extension)

When MVP 2a is complete:
1. Install extension from Chrome Web Store
2. Start typing in any web app (Gmail, Docs, etc.)
3. Native input experience!

## Documentation

### Core Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| [PRD.md](PRD.md) | Product requirements and specifications | Product, Engineering |
| [CLAUDE.md](CLAUDE.md) | Technical guide for AI assistants | AI, Engineering |

### Memory Bank (Detailed Documentation)

The `memory-bank/` directory contains comprehensive project documentation:

| File | Description |
|------|-------------|
| [projectbrief.md](memory-bank/projectbrief.md) | Mission, goals, scope, and architecture |
| [productContext.md](memory-bank/productContext.md) | Why this exists, problems solved, UX vision |
| [systemPatterns.md](memory-bank/systemPatterns.md) | Architecture, design patterns, technical decisions |
| [techContext.md](memory-bank/techContext.md) | Tech stack, setup, APIs, dependencies |
| [activeContext.md](memory-bank/activeContext.md) | Current work, next steps, active decisions |
| [progress.md](memory-bank/progress.md) | Status tracker, milestones, completion rates |

**💡 New to the project?** Start with [projectbrief.md](memory-bank/projectbrief.md), then [activeContext.md](memory-bank/activeContext.md)

## Architecture

### The Big Picture

```
┌─────────────────────────────────────────────────────────┐
│  Rime Dictionary (YAML)                                 │
│  dayi.dict.yaml                                         │
└─────────────┬───────────────────────────────────────────┘
              │
              │ Phase 0: Offline Conversion
              ▼
┌─────────────────────────────────────────────────────────┐
│  WebDaYi Database (JSON)                                │
│  dayi_db.json - O(1) queryable                          │
└─────────┬───────────────────────────┬───────────────────┘
          │                           │
          │ Phase 1                   │ Phase 2
          ▼                           ▼
┌───────────────────────┐   ┌───────────────────────────┐
│  Static Webpage       │   │  Chrome Extension         │
│  (Validation)         │   │  (Production)             │
│                       │   │                           │
│  • Input box          │   │  • Background script      │
│  • Candidate display  │   │  • Content script         │
│  • Clipboard output   │   │  • In-place injection     │
└───────────────────────┘   └───────────────────────────┘
```

### Project Structure

```
webdayi/
├── converter/              # Phase 0: Data pipeline
│   ├── convert.js         # YAML → JSON converter
│   └── raw_data/
│       └── dayi.dict.yaml # Rime source
├── mvp1/                  # Phase 1: Static webpage
│   ├── index.html
│   ├── core_logic.js      # Core query engine
│   └── dayi_db.json       # Generated database
├── mvp2a-plugin/          # Phase 2: Browser extension
│   ├── manifest.json      # Chrome Extension config
│   ├── background.js      # Service Worker
│   └── content.js         # DOM injection
└── memory-bank/           # Project documentation
    └── *.md               # Comprehensive docs
```

## Features

### MVP 1.0 v6: Core Engine ✅ COMPLETE

**Basic Features:**
- ✅ Load Dàyì dictionary into memory (Map data structure, 1,584 codes)
- ✅ Query candidates by code (e.g., "4jp" → "易", "義")
- ✅ Sort by frequency (most common first)
- ✅ Select with smart keys (Space/' /[/]/- /\)
  - **Important**: 0-9 are now part of codes (e.g., t0, t1), NOT selection keys
- ✅ Copy composed text to clipboard

**Advanced Features (v3):**
- ✅ **Pagination System**: Cycle through pages with `=` key
  - Handles codes with 60+ candidates (e.g., ux: 61 candidates → 11 pages)
  - Visual indicator: "第 1/3 頁 = 換頁"
  - Cycles back to first page after last
- ✅ **Auto-select on 3rd Character**: Speeds up typing
  - Type 2 chars → 3rd char → first candidate auto-selected
  - New character becomes new input code
  - Does not trigger on selection/pagination keys

**Advanced Features (v4):**
- ✅ **Smart Backspace**: Professional IME-style undo behavior
  - Backspace on input with 2 chars → 1 char (does NOT trigger auto-select)
  - Backspace on input with 1 char → empty input
  - Backspace on empty input → deletes last char from output buffer
  - Continuous backspace → keeps deleting from output until empty
  - Provides natural correction and undo flow

**Advanced Features (v5):**
- ✅ **Input Mode Toggle**: Switch between normal and express modes
  - Normal mode: Full UI with instructions and branding
  - Express mode: Minimal UI (only input/candidates/output)
  - Toggle button always visible (top-right corner)
  - Preference saved to localStorage (persists across sessions)
  - Visual indicator in express mode

**Advanced Features (v6):**
- ✅ **User Personalization**: IME learns your character preferences
  - **MVP1.7**: Load personal records from localStorage on page load
  - **MVP1.8**: Save personal preference when selecting non-default candidates
  - **MVP1.9**: Prioritize user preferences in candidate ordering
  - Example: Prefer "義" over "易" for code `4jp` → "義" appears first next time
  - Preferences persist across sessions
  - Works seamlessly with pagination and auto-select
  - Professional adaptive IME behavior
  - **🐛 Bug Fixed**: Auto-select now correctly uses user preferences (was using default order)

**Advanced Features (v7):**
- ✅ **Touch-Friendly UX**: Mobile and tablet optimized interactions
  - **MVP1.10**: Click to select candidates + prev/next page buttons
  - Click any candidate item to select (no keyboard required)
  - Visual ◀ **上一頁** / **下一頁** ▶ buttons for easy pagination
  - Touch-optimized button sizes (minimum 44px touch targets)
  - Hover and active states for clear visual feedback
  - Keyboard accessibility maintained (can use Enter/Space on focused items)
  - Perfect for touch devices and trackpad users

**Target User**: Developer (for validation) & Power Users
**Output Method**: Copy/Paste
**Test Coverage**: 35/35 tests passing with TDD (19 personalization + 16 bug fix tests)

### MVP 2a: Browser Plugin (Planned)

- ✅ Chrome Extension (Manifest V3)
- ✅ Intercept keystrokes in web pages
- ✅ Dynamic candidate UI at cursor position
- ✅ In-place text injection (no copy/paste needed)
- ✅ Works in Gmail, Google Docs, Notion

**Target User**: End user
**Output Method**: Native typing experience

### Future: MVP 2a+ (Roadmap)

- 🔮 Cloud sync (personal dictionary via chrome.storage.sync)
- 🔮 Context awareness (different suggestions for github.com vs gmail.com)
- 🔮 N-gram learning (smart phrase completion)
- 🔮 Manual dictionary editing

## Technology Stack

- **Language**: JavaScript (ES6+)
- **Runtime**: Chrome 88+
- **Extension**: Manifest V3
- **Data**: JSON (from Rime YAML)
- **Dependencies**: Zero (production), js-yaml (dev)

**Philosophy**: No frameworks, maximum transparency

## Development

### Prerequisites

- Node.js ≥ 18
- Chrome browser ≥ 88
- Basic understanding of JavaScript

### Current Phase: Data Pipeline

```bash
# 1. Setup converter
mkdir -p converter/raw_data
mv dayi2dict.yaml converter/raw_data/dayi.dict.yaml

# 2. Install dependency
cd converter
npm install js-yaml

# 3. Run converter (to be implemented)
node convert.js

# 4. Verify output
cat ../mvp1/dayi_db.json | jq '."4jp"'
# Expected: [{"char":"易","freq":80}, ...]
```

### Testing

**Current**: Manual testing only
**Future**: Automated tests for regression prevention

```bash
# Test static page (Phase 1)
open mvp1/index.html

# Test extension (Phase 2)
# chrome://extensions → Developer Mode → Load Unpacked
```

## Contributing

**Current Status**: Solo development project (learning/validation phase)

Once MVP 2a is validated, contributions welcome for:
- Firefox extension port
- Additional language models
- UI/UX improvements
- Documentation

## Roadmap

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| ✅ Project Initialized | 2025-11-06 | Done |
| ✅ Phase 0: Data Pipeline | 2025-11-06 | Done |
| ✅ MVP 1.0: Core Engine | 2025-11-06 | Done |
| ✅ MVP 1.0 v2: Selection Keys Fix | 2025-11-06 | Done |
| ✅ MVP 1.0 v3: Pagination & Auto-select | 2025-11-06 | Done |
| ✅ MVP 1.0 v4: Smart Backspace UX | 2025-11-06 | Done |
| ⏳ MVP 2a: Browser Plugin | 2025-11-20 | Planned |
| ⏳ Public Release (Chrome Web Store) | 2025-11-25 | Planned |
| 📋 MVP 2a+: Advanced Features | 2025-12-15 | Future |

## Philosophy

> **Parasite on data, innovate on experience**

We don't rebuild the Dàyì dictionary—we leverage Rime's excellent open-source work. Our innovation is in:

- **Accessibility**: Web-first, works where you type
- **Transparency**: Readable, modifiable code
- **Extensibility**: Easy to add learning features
- **Seamlessness**: Browser-native experience

## License

Open source (license TBD - currently development phase)

## Acknowledgments

- **Rime Project**: Source of high-quality Dàyì dictionary data
- **Dàyì Input Method**: Classic Chinese input system
- **Open Source Community**: Inspiration and tools

## Contact

- **Issues**: [GitHub Issues](../../issues) (when public)
- **Discussions**: [GitHub Discussions](../../discussions) (when public)

---

**Last Updated**: 2025-11-06
**Status**: MVP 1.0 v4 Complete
**Version**: 1.0.4-alpha (MVP1 v4 with smart backspace UX)
