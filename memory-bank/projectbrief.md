# Project Brief: WebDaYi

## Project Name
**WebDaYi (網頁大易輸入法)** - A Web-First Input Method Engine for Dàyì Chinese Input

## Core Mission
Build a lightweight, transparent, and highly customizable browser-based Chinese input method (IME) for the Dàyì (大易) system that provides native-like typing experience without the complexity of traditional IME frameworks.

## The Problem
1. **Limited Modern Tools**: Dàyì input method users have few modern, accessible tools
2. **Complexity Overhead**: Existing powerful IMEs like Rime are feature-rich but come with complex configuration and heavyweight "all-in-one" architecture
3. **Customization Barriers**: High threshold for personalization and control over the input experience
4. **Browser-First Gap**: No seamless solution for users who primarily work in web applications (Gmail, Notion, Google Docs)

## The Solution
A **Web-First Input Method Engine** that:
- **Parasites** on Rime's open-source Dàyì dictionary data
- **Implements** a simple, modern core engine from scratch
- **Delivers** browser-native input experience via Chrome Extension
- **Enables** future enhancements (cloud sync, contextual learning, N-gram)

## Core Value Proposition
Replace complexity with transparency. Replace monolithic frameworks with modular simplicity. Replace opaque configuration with code you can understand and modify.

## Success Criteria
### MVP 1.0 (Core Engine Validation)
- ✅ 100% accurate code table lookup
- ✅ User can complete 100-character paragraph in 3 minutes via input-select-copy workflow
- ✅ Core algorithm (query/sort) validated in browser sandbox

### MVP 2a (Browser Plugin)
- ✅ In-place injection latency < 100ms
- ✅ Seamless operation in 3+ major web apps (Gmail, Notion, Google Docs)
- ✅ Zero configuration required for end users

## Target Users
### P0 (Primary)
Developer/power user who:
- Uses Dàyì input method
- Works primarily in browser-based applications
- Wants full control and transparency over their tools
- Values context-awareness and cloud sync capabilities

### P1 (Secondary)
Other Dàyì users whose primary work and communication happens in the browser

## Project Boundaries
### In Scope (MVP 1.0 & 2a)
- Static frequency-based sorting from Rime dictionary
- Browser extension (Chrome) implementation
- In-place text injection via DOM manipulation
- Minimal, zero-config user experience

### Out of Scope (MVP 1.0 & 2a)
- N-gram language models (planned for 2a+)
- Dynamic user dictionary (planned for 2a+)
- Electron desktop app (parallel track)
- Support for other input methods beyond Dàyì

## Key Architectural Decisions
1. **Web-First Philosophy**: JavaScript/HTML/CSS as primary implementation language
2. **Data Parasitism**: Leverage Rime's open-source dictionary rather than building from scratch
3. **Two-Phase Approach**:
   - Phase 1 (MVP 1): Validate core logic in static webpage
   - Phase 2 (MVP 2a): Wrap validated logic in browser extension
4. **Manifest V3**: Modern Chrome Extension architecture for security and performance

## Development Approach
- **Iterative validation**: Build static page first, then wrap in extension
- **Code reuse**: 100% reuse of core logic from MVP 1 → MVP 2a
- **Minimal dependencies**: Plain JavaScript, no heavy frameworks
- **Manual testing**: Sufficient for MVP phases

## Project Timeline
```
Phase 0: Data Pipeline (C.1-C.4)    ← Current Focus
  └─ Convert Rime YAML → dayi_db.json

Phase 1: MVP 1.0 (Core Engine)
  └─ Static webpage validation (F-1.1 → F-1.8)

Phase 2: MVP 2a (Browser Plugin)
  └─ Chrome Extension wrapper (F-2a.1 → F-2a.8)

Phase 3: MVP 2a+ (Future)
  └─ Cloud sync, context-awareness, N-gram
```

## Repository Structure
```
/converter/                 # Data pipeline (Rime → JSON)
/mvp1/                     # Static webpage (validation)
/mvp2a-plugin/             # Chrome Extension (production)
/memory-bank/              # Project documentation
CLAUDE.md                  # Claude Code guidance
PRD.md                     # Product requirements
```

## Key Resources
- **Source Data**: Rime's `dayi.dict.yaml` (Dàyì dictionary)
- **Output Format**: `dayi_db.json` (O(1) queryable JSON database)
- **PRD**: `/home/user/webdayi/PRD.md` (v1.1)
- **Tech Guide**: `/home/user/webdayi/CLAUDE.md`
