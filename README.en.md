# WebDaYi (網頁大易輸入法)

> **Language / 語言**: [English](README.en.md) | [正體中文](README.md)

> A lightweight, transparent, Web-First Input Method Engine for Dàyì (大易) Chinese Input

[![Status](https://img.shields.io/badge/status-MVP%201%20v9%20Complete%20%2B%20Modern%20UI-brightgreen)]()
[![Phase](https://img.shields.io/badge/phase-MVP%201.0%20v9-blue)]()
[![Tests](https://img.shields.io/badge/tests-59%2F59%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-open%20source-green)]()

## 🎉 Live Demo

**[Try WebDaYi MVP1 v9 Now →](https://clarencechien.github.io/webdayi/)** (GitHub Pages)

Experience the core Dàyì input engine with modern design and advanced features:
- 🎨 **Modern UI** *(v9 NEW!)*: Brand new Tailwind CSS design with rounded cards!
- 🌗 **Dark Mode** *(v9 NEW!)*: Toggle dark/light theme, auto-saves preference!
- ✨ **Material Icons** *(v9 NEW!)*: Professional icon system for unified visuals!
- 📐 **New Layout** *(v9 NEW!)*: Output on top, Input below - more intuitive!
- 📱 **Enhanced RWD** *(v9 NEW!)*: Perfect for mobile/tablet/desktop!
- ✨ **Auto-Copy** *(v8)*: Automatically copies to clipboard, no manual clicking!
- 🗑️ **Clear Button** *(v8)*: One-click to clear output buffer!
- 🔄 **Auto-Copy Toggle**: Can enable/disable auto-copy anytime
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

**Current Phase**: ✅ MVP 1.0 v9 Complete!
**Completion**: ~55% (Phase 0 & MVP 1 v9 done, MVP 2a next)

```
┌──────────────────────────────────────────────────────────┐
│ Phase 0: Data Pipeline        [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│ Phase 1: MVP 1.0 v9           [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Selection Keys Fix       [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Pagination               [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Auto-select              [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Smart Backspace          [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Input Mode Toggle        [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ User Personalization     [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Touch-Friendly UX        [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Auto-Copy                [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Clear Button             [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✅    │
│   ├─ Tailwind CSS             [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🎨✅  │
│   ├─ Dark Mode                [▓▓▓▓▓▓▓▓▓▓▓▓] 100% 🌗✅  │
│   └─ Modern UI Redesign       [▓▓▓▓▓▓▓▓▓▓▓▓] 100% ✨✅  │
│ Phase 2: MVP 2a               [░░░░░░░░░░░░]   0% ⏳    │
└──────────────────────────────────────────────────────────┘
```

**Latest Achievement**: MVP 1.0 v9 with modern UI redesign (59/59 tests passing)
- 🎨 **Tailwind CSS**: Industry-standard utility-first CSS framework
- 🌗 **Dark Mode**: System detection + manual toggle, auto-saves preference
- ✨ **Material Icons**: Professional icons replacing emoji
- 📐 **New Layout**: Output on top, Input below - more intuitive
- 📱 **Enhanced RWD**: Perfect for mobile/tablet/desktop (max-w-3xl)
- 🎨 **Modern Design**: Card-based, rounded corners, shadows, smooth transitions
- ✨ **Auto-Copy (v8)**: Seamless workflow, copies after selection
- 🗑️ **Clear Button (v8)**: One-click buffer cleanup
- ✅ **Frequency Converter v2**: Smart sorting using Taiwan MOE data
**Next Milestone**: Begin MVP 2a (Browser Plugin) implementation

## 💡 Core Feature: Frequency-Based Smart Sorting

WebDaYi uses real-world character frequency data instead of arbitrary ordering:

### 🎯 Converter v2: Frequency-Based Ranking System

Our **enhanced data pipeline** integrates Taiwan Ministry of Education's 2000 most common Traditional Chinese characters:

- **Real Data Source**: Taiwan MOE high-frequency character rankings (教育部)
- **Smart Sorting**: Candidates sorted by actual usage frequency
- **Test Verified**: 21 automated tests ensure correctness
- **Backward Compatible**: Falls back to basic version when frequency data unavailable

**Example**: For code `4jp`:
```json
{
  "4jp": [
    { "char": "易", "freq": 9992 },  // Rank 9 (very high frequency)
    { "char": "義", "freq": 9544 },  // Rank ~500 (high frequency)
    { "char": "蜴", "freq": 1000 }   // Not ranked (default)
  ]
}
```

This ensures the most commonly used characters appear first, making input faster and more intuitive.

**Technical Details**:
- Linear mapping: Rank 1 → Frequency 10000, Rank 2000 → Frequency 8000
- Unranked characters default frequency: 1000
- Developed with TDD (Test-Driven Development)

## Quick Start

### Try It Now (Live Demo)

**[Launch WebDaYi MVP1 v9 →](https://clarencechien.github.io/webdayi/)**

No installation required! Just open the link and start typing:
- **NEW (v9)**: 🎨 Enjoy the modern Tailwind CSS design with card-based layout!
- **NEW (v9)**: 🌗 Toggle dark/light mode with top-right button (preference auto-saved)!
- **NEW (v9)**: ✨ Professional Material Icons for unified visual experience!
- **NEW (v9)**: 📐 New layout: Output on top, Input below - more intuitive!
- **NEW (v9)**: 📱 Enhanced responsive design perfect for mobile/tablet/desktop!
- Try `v` → 大, 夫, 禾
- Try `a` → 人, 入
- Try `ux` → 61 candidates, press `=` or use buttons to page through
- Press `Space` (1st), `'` (2nd), `[` (3rd), `]` (4th), `-` (5th), `\` (6th) to select
- **Or click** candidates directly to select (touch-friendly!)
- Type 2 chars then continue → auto-selects first candidate!
- Press `Backspace` to undo (deletes input, then output buffer)
- Toggle to Focus Mode (top-right) for minimal UI
- Select a non-default candidate → **IME learns your preference and uses it in auto-select!** [Bug Fixed ✅]
- **v7**: Use ◀ **上一頁** / **下一頁** ▶ buttons for easy paging on mobile/tablet!
- **v8**: **Auto-copies to clipboard** after selection, no manual clicking needed! (toggleable on/off)
- **v8**: Use "Clear" button to clear output buffer with one click

### For Developers

```bash
# Clone repository
git clone https://github.com/clarencechien/webdayi.git
cd webdayi

# Run tests (all 59 tests should pass)
cd mvp1
node test-node-v6.js  # User personalization tests (19/19)
node test-node-v7.js  # Auto-select bug fix tests (16/16)
node test-node-v8.js  # Auto-copy & clear button tests (24/24)

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
├── converter/                   # Phase 0: Data Pipeline
│   ├── convert.js              # YAML → JSON converter (basic version)
│   ├── convert-v2.js           # Enhanced converter (frequency-based ranking) ✅
│   ├── convert-v2-lib.js       # Converter library functions
│   ├── convert-v2.test.js      # Converter test suite (21 tests)
│   ├── DESIGN-v2.md            # Converter v2 design documentation
│   ├── README.md               # Converter documentation
│   ├── raw_data/
│   │   ├── dayi.dict.yaml      # Rime Dàyì dictionary source
│   │   └── freq.yaml           # Character frequency data (2000 chars, Taiwan MOE)
│   └── test-data/
│       └── freq-sample.yaml    # Test frequency data (20 char sample)
├── mvp1/                       # Phase 1: Static Webpage
│   ├── index.html              # Main user interface
│   ├── core_logic.js           # Core query engine (v8)
│   ├── style.css               # Stylesheet
│   ├── dayi_db.json            # Generated database (frequency-sorted)
│   ├── README.md               # MVP1 documentation (Traditional Chinese)
│   ├── README.en.md            # MVP1 documentation (English)
│   ├── DESIGN-auto-copy.md     # Auto-copy feature design document (v8)
│   ├── test.html               # Browser test runner
│   ├── test-node.js            # Node.js test runner (v1)
│   ├── test-node-v2.js         # Selection keys tests (v2)
│   ├── test-node-v3.js         # Pagination & auto-select tests (v3)
│   ├── test-node-v4.js         # Smart backspace tests (v4)
│   ├── test-node-v5.js         # Input mode toggle tests (v5)
│   ├── test-node-v6.js         # User personalization tests (19 tests)
│   ├── test-node-v7.js         # Auto-select bug fix tests (16 tests)
│   └── test-node-v8.js         # Auto-copy & clear button tests (24 tests)
├── mvp2a-plugin/               # Phase 2: Browser Extension (Planned)
│   ├── manifest.json           # Chrome Extension config
│   ├── background.js           # Service Worker
│   └── content.js              # DOM injection
└── memory-bank/                # Project Documentation
    ├── projectbrief.md         # Project brief
    ├── productContext.md       # Product context
    ├── systemPatterns.md       # System patterns
    ├── techContext.md          # Tech context
    ├── activeContext.md        # Active context
    └── progress.md             # Progress tracking
```

## Features

### MVP 1.0 v9: Core Engine + Modern UI ✅ COMPLETE

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

**Advanced Features (v8):**
- ✅ **Auto-Copy to Clipboard**: Seamless output workflow
  - **MVP1.11**: Automatically copies to clipboard after selection
  - Works for all selection methods (quick keys, click, auto-select)
  - Visual feedback: "✓ 已複製" toast notification
  - Toggleable control: "🔄 自動複製" button in top-right
  - Preference saved to localStorage (persists across sessions)
  - Supports desktop and mobile (modern Clipboard API)
  - Design philosophy: Copy after every selection for predictable behavior
- ✅ **Clear Buffer Button**: Quick reset
  - **MVP1.12**: One-click to clear output buffer
  - Located next to "Copy" button for easy access
  - Touch-optimized (44px minimum touch target)
  - Responsive layout (stacks vertically on mobile)
  - Provides temporary visual feedback

**Advanced Features (v9):**
- ✅ **Tailwind CSS Integration**: Modern utility-first CSS framework
  - **F-9.1**: Industry-standard Tailwind CSS v3 via CDN
  - Utility-first approach for rapid styling and maintainability
  - Consistent design tokens (colors, spacing, border radius)
  - Responsive breakpoints (sm:, md:, dark:) for all devices
  - Smooth transitions and hover states
  - Card-based design with rounded corners and shadows
- ✅ **Dark Mode Support**: Professional theme switching
  - **F-9.2**: Toggle between dark and light themes
  - System preference detection (prefers-color-scheme)
  - Manual toggle button in top-right corner
  - Preference saved to localStorage (persists across sessions)
  - Smooth 200ms color transitions
  - Complete dark mode coverage for all UI elements
- ✅ **Material Symbols Icons**: Professional icon system
  - **F-9.3**: Google's Material Symbols Outlined font
  - Consistent, professional icon design
  - Replaces emoji with scalable vector icons
  - Better visual hierarchy and clarity
  - Icons for dark mode, focus mode, auto-copy, copy, clear, navigation
- ✅ **New Layout**: Optimized information architecture
  - **F-9.4**: Output section on top, Input section below
  - More intuitive flow (see results first, then input)
  - Fixed control buttons in top-right corner (always accessible)
  - Better use of screen real estate
  - Mockup-inspired modern design
- ✅ **Enhanced Responsive Design**: Perfect for all devices
  - **F-9.5**: Mobile-first responsive design with Tailwind breakpoints
  - Max width 3xl (768px) for optimal readability
  - Button labels hidden on mobile (hidden sm:inline)
  - Flex layouts that adapt to screen size
  - Touch-optimized spacing and sizing
  - Vertical stacking on mobile, horizontal on desktop
  - Perfect balance of information density across devices

**Target User**: Developer (for validation) & Power Users
**Output Method**: Auto-copy to clipboard + manual copy/clear
**Test Coverage**: 59/59 tests passing with TDD (19 personalization + 16 bug fix + 24 auto-copy tests)
**Design System**: Tailwind CSS v3 + Material Symbols + Dark Mode

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

**Test Coverage**: ✅ 80/80 tests passing (with TDD)

```bash
# Converter tests (21 tests)
cd converter
node convert-v2.test.js
# ✓ Frequency parsing (3 tests)
# ✓ Frequency calculation (5 tests)
# ✓ Dayi dictionary parsing (3 tests)
# ✓ Candidate enrichment (3 tests)
# ✓ Integration tests (3 tests)
# ✓ Edge cases (4 tests)

# MVP1 tests (59 tests)
cd mvp1
node test-node-v6.js  # User personalization (19 tests)
node test-node-v7.js  # Auto-select bug fix (16 tests)
node test-node-v8.js  # Auto-copy & clear button (24 tests)

# Browser manual testing
open mvp1/index.html
# Or run test suite:
open mvp1/test.html

# Test extension (Phase 2 - Planned)
# chrome://extensions → Developer Mode → Load Unpacked
```

**Test Details**:
- **Phase 0 (Converter)**: 21 automated tests covering frequency parsing, calculation, and database building
- **Phase 1 (MVP1)**: 59 automated tests covering personalization, auto-select, bug fixes, auto-copy, and clear functionality
- **Total**: 80 tests with 100% pass rate

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
| ✅ Phase 0: Data Pipeline (v1) | 2025-11-06 | Done |
| ✅ Phase 0: Enhanced Converter (v2, frequency-based) | 2025-11-06 | Done |
| ✅ MVP 1.0 v1: Core Engine | 2025-11-06 | Done |
| ✅ MVP 1.0 v2: Selection Keys Fix | 2025-11-06 | Done |
| ✅ MVP 1.0 v3: Pagination & Auto-select | 2025-11-06 | Done |
| ✅ MVP 1.0 v4: Smart Backspace UX | 2025-11-06 | Done |
| ✅ MVP 1.0 v5: Input Mode Toggle | 2025-11-06 | Done |
| ✅ MVP 1.0 v6: User Personalization | 2025-11-06 | Done |
| ✅ MVP 1.0 v7: Touch-Friendly UX + Bug Fix | 2025-11-06 | Done |
| ✅ MVP 1.0 v8: Auto-Copy + Clear Button | 2025-11-10 | Done |
| ✅ MVP 1.0 v9: Modern UI Redesign (Tailwind + Dark Mode) | 2025-11-10 | Done |
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

**Last Updated**: 2025-11-10
**Status**: MVP 1.0 v9 Complete (Modern UI with Tailwind CSS + Dark Mode)
**Version**: 1.0.9-alpha (MVP1 v9 with modern UI redesign, all v8 features preserved)
