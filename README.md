# WebDaYi (網頁大易輸入法)

> A lightweight, transparent, Web-First Input Method Engine for Dàyì (大易) Chinese Input

[![Status](https://img.shields.io/badge/status-in%20development-yellow)]()
[![Phase](https://img.shields.io/badge/phase-0%3A%20data%20pipeline-blue)]()
[![License](https://img.shields.io/badge/license-open%20source-green)]()

## Overview

**WebDaYi** replaces complex, monolithic IME frameworks with a simple, modern solution built in JavaScript. Instead of wrestling with configuration files, you get a transparent input method that:

- 🎯 **Just Works**: Zero configuration required
- 🪶 **Lightweight**: Pure JavaScript, no heavy frameworks
- 🔍 **Transparent**: Every line of code is readable and modifiable
- 🌐 **Browser-First**: Optimized for Gmail, Google Docs, Notion, and other web apps
- 🔄 **Smart**: Leverages Rime's excellent Dàyì dictionary data

## Project Status

**Current Phase**: Phase 0 - Data Pipeline Setup
**Completion**: ~5% (Planning complete, implementation starting)

```
┌──────────────────────────────────────────────────────────┐
│ Phase 0: Data Pipeline        [▓▓░░░░░░░░░░] 15%  🔄    │
│ Phase 1: MVP 1.0              [░░░░░░░░░░░░]  0%  ⏳    │
│ Phase 2: MVP 2a               [░░░░░░░░░░░░]  0%  ⏳    │
└──────────────────────────────────────────────────────────┘
```

**Next Milestone**: Complete data converter (converts Rime YAML → JSON)

## Quick Start

### For Users (Future)

*Not yet ready for end users - still in development*

When MVP 2a is complete:
1. Install extension from Chrome Web Store
2. Start typing in any web app
3. That's it!

### For Developers (Current)

```bash
# Clone repository
git clone <repository-url>
cd webdayi

# Phase 0: Generate database (in progress)
cd converter
npm install js-yaml
node convert.js  # Creates mvp1/dayi_db.json

# Phase 1: Test core engine (not ready)
# Open mvp1/index.html in browser

# Phase 2: Load browser extension (not ready)
# chrome://extensions → Load Unpacked → mvp2a-plugin/
```

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

### MVP 1.0: Core Engine (In Progress)

- ✅ Load Dàyì dictionary into memory (Map data structure)
- ✅ Query candidates by code (e.g., "4jp" → "易", "義")
- ✅ Sort by frequency (most common first)
- ✅ Select with number keys (1-9)
- ✅ Copy composed text to clipboard

**Target User**: Developer (for validation)
**Output Method**: Copy/Paste

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
| 🔄 Phase 0: Data Pipeline | 2025-11-07 | In Progress |
| ⏳ MVP 1.0: Core Engine | 2025-11-10 | Planned |
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
**Status**: Active Development
**Version**: 0.0.1-alpha