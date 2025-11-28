# Progress Tracker: WebDaYi

**Last Updated**: 2025-11-27
**Current Version**: MVP 2.0 (Predictive Type-ahead)
**Status**: In Progress

---

## 🚀 Active Phases

### MVP 2.0: Predictive Type-ahead (Completed)
- [x] **Setup**
  - [x] Create `mvp2-predictive` folder
  - [x] Define `DEV_INSTRUCTIONS.md`
- [x] **Core Logic Implementation**
  - [x] `PredictionEngine` class (Weighted Scoring: Static + Bigram + User Habit)
  - [x] Extended Prediction (Prefix Search for 4-code words)
  - [x] Integration: `app.js` + `PredictionEngine`
  - [x] Smart Spacebar Interaction (Phantom Text confirmation)
- [x] **UX Refinement**
  - [x] **Mini Mode Alignment**: Align `mvp2` Mini Mode with `lite` (styling, keys).
  - [x] **Phantom UX**: Integrate Phantom suggestion as 1st candidate (Index 0).
  - [x] **Smart Auto-Commit**: Collision-safe auto-commit logic.
  - [x] **Auto-Commit Refinement**: Disabled auto-commit for 4-code mode (manual Space required).
  - [x] **Mini Mode Settings**: Menu for IM, Max Codes, Font Size.
  - [x] **Hotkeys**: Reconfigured for better usability.
- [x] **Data Expansion**
  - [x] Generate `freq_map.json` from corpus
  - [x] Regenerate `dayi_db.json` for full coverage
- [x] **Mobile Web UI Consistency**
  - [x] **Unified Header**: Consistent Copy/Clear/Menu buttons in Output Header.
  - [x] **Mobile Optimization**: Icon-only buttons and FAB removal on mobile.
  - [x] **Mobile Optimization**: Icon-only buttons and FAB removal on mobile.
  - [x] **Focus Mode Fix**: Resolved keyboard cutoff issue.
- [x] **Data Quality Verification**
  - [x] **Test Plan**: Logic vs. Data Quality strategy.
  - [x] **Automated Testing**: `data_quality.test.js` (Real-world cases).
  - [x] **Data Patching**: `fix_bigrams.js` for iterative improvement.
  - [x] **Validation**: Achieved 100% pass rate (15/15) on core test set.
- [x] **Project Structure Cleanup**
  - [x] **Tests**: Moved to `tests/` directory.
  - [x] **Scripts**: Organized into `scripts/` and `archive/scripts/`.
  - [x] **Documentation**: Updated all READMEs and Memory Bank.

### Phase 6: Refactoring - Dual-Track Input (Completed)
- [x] **Core Logic Refactoring**
  - [x] `getCandidates`: Prioritize Exact Matches (Blind Typing).
  - [x] `getBestPrediction`: Find best non-exact match (Phantom).
  - [x] TDD Verification: `tests/prediction_refactor.test.js`.
- [x] **Interaction & UI**
  - [x] **Visual Feedback**: Blue (Copy) / Red (Clear) flash.
  - [x] **Tab Key**: Confirm Phantom Text.
  - [x] **Space Key**: Confirm Exact Match.
  - [x] **Alt Key**: Single (Copy) / Double (Clear).

### WebDayi Lite (Stable)
- [x] **Core Features**
  - [x] PWA Structure (Manifest, Service Worker)
  - [x] Character-by-character Input
  - [x] Virtual Keyboard (Responsive)
  - [x] Mini Mode (Floating Widget)
  - [x] **Enhancements**
    - [x] Zhuyin Support
    - [x] Split Shift Key
    - [x] Ctrl Double-Click Toggle
    - [x] **Visual Feedback Refinement**: Ultra-subtle overlay for premium UX.

---

## 📂 Archived Phases

### MVP 1.0 (Legacy)
- [x] **Core Engine**: Viterbi Algorithm
- [x] **UI**: Vue.js Prototype
- **Status**: Archived in `archive/mvp1`

### MVP 1.0 PWA (Legacy)
- [x] **PWA Features**: IndexedDB, Offline Support
- **Status**: Archived in `archive/mvp1-pwa`

---

## 📅 Milestones

- **2025-11-28**: Project Structure & Documentation Cleanup.
- **2025-11-28**: Data Quality Verification (100% Pass Rate).
- **2025-11-28**: Refined Dayi 4-Code Auto-Commit Behavior.
- **2025-11-27**: MVP 2.0 UX Refinement (Mini Mode & Phantom Integration).
- **2025-11-27**: MVP 2.0 Initialization & Core Logic Complete.
- **2025-11-26**: WebDayi Lite 0.6.0 Released.
- **2025-11-06**: Project Kickoff.
r