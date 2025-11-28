# Active Context: WebDaYi

**Last Updated**: 2025-11-27
**Current Version**: MVP 2.0 (Predictive Type-ahead)
**Branch**: `main`

---

## 📊 Current Status

### Phase: MVP 2.0 Development ✅ IN PROGRESS
**Status**: Core Engine Implemented, UI Restored, Verification Complete.
**Focus**: Implementing "Smart Compose" (Continuous Prediction) and refining "Smart 3-Code" logic.

**Key Achievements**:
- **Predictive Engine**: Implemented `PredictionEngine` with Frequency and Bigram models.
- **Smart Spacebar**: Confirms "Phantom Text" suggestions instantly.
- **UI Restoration**: Restored the clean "WebDayi Lite" card design.
- **Mini Mode Alignment**: Aligned Mini Mode UX with Lite version (correct keys and styling).
- **Phantom UX Refinement**: Integrated Phantom Text into the main candidate list (Index 0) to resolve key conflicts.
- **Mobile Web UI Consistency**: Unified Output Header buttons (Copy/Clear/Menu) and optimized layout for mobile (Icon-only, No FAB).
- **Focus Mode Fix**: Resolved keyboard cutoff issues by enforcing container width constraints.
- **Verification**: Confirmed "司機" (bo + i + Space) workflow.

---

## Current Focus
The current focus is on **Data Quality Verification**. We have established a rigorous testing framework (`data_quality.test.js`) and are iteratively refining the Bigram data to ensure high-quality predictions.
Currently working on **Fine-tuning remaining data failures** (e.g., "謝謝", "台北") by adjusting `bigram_lite.json` via `fix_bigrams.js`.

## Recent Changes
*   **Dual-Track Input Refactoring**:
    *   **Space Key**: Now strictly confirms **Exact Matches** (Blind Typing).
    *   **Tab Key**: Now confirms **Best Prediction** (Phantom Text).
    *   **UI Fix**: Added **Tab Key** to virtual keyboard and **[Tab] Hint** to phantom text display.
    *   **Visual Feedback**: Implemented Unified Feedback (Blue for Copy, Red for Clear).
    *   **Core Logic**: Refactored `PredictionEngine` to separate Exact Matches from Predictions.
*   **Data Quality Verification**:
    *   Created **Test Plan** (Logic vs. Data Quality) and **Test Data Set** (20+ cases).
    *   Implemented automated data quality testing (`js/data_quality.test.js`).
    *   Implemented data patching script (`scripts/fix_bigrams.js`) to fix missing bigrams and remove noise.
    *   Achieved **100% Pass Rate** (15/15) after fine-tuning logic and data.
*   **Smart Compose**:
    *   Implemented continuous next-word prediction (even with empty buffer).
    *   Added context safety (no prediction after punctuation).
    *   Implemented frequency filtering for cleaner suggestions.
    *   Added Ghost Text Timeout (3s auto-hide) with fade-out animation.
    *   Added UI toggles for Ghost Text behavior in both Web and Mini modes.
*   **MVP2 Implementation**:
    *   Implemented **Adaptive Predictive Engine** with 3-layer weighted scoring.
    *   Added **Extended Prediction** (prefix matching).
    *   Implemented **Smart Auto-Commit** with collision safety.
    *   Added **3/4 Code Toggle** and **Mini Mode Settings Menu**.
    *   Implemented **Adaptive Predictive Engine** with 3-layer weighted scoring (Static + Bigram + User Habit).
    *   Added **Extended Prediction** (prefix matching) to support predicting full words from partial codes.
    *   Implemented **Smart Auto-Commit** with collision safety (waits if multiple candidates exist).
    *   **Refined Auto-Commit Logic**:
        *   **3-Code Mode**: Auto-commits on unique match.
        *   **4-Code Mode**: Requires manual **Space** to commit (no auto-commit), preventing accidental commits during full-code typing.
    *   Added **3/4 Code Toggle** and **Mini Mode Settings Menu**.
    *   Reconfigured **Hotkeys** (Tap Ctrl for Mini Mode, Tap Alt for Copy).
    *   **Mini Mode Fixes**:
        *   Corrected layout (Output below Input).
        *   Fixed Menu Interaction (z-index/drag issues).
        *   **Robust Visual Feedback**: Implemented overlay-based feedback visible in PWA/Dark Mode.
    *   Regenerated `dayi_db.json` to ensure full coverage.

---

## 🔧 Latest Session: Dayi 4-Code Auto-Commit Refinement (2025-11-28)

We refined the auto-commit behavior based on user feedback to distinguish between 3-code and 4-code modes.
- **4-Code Mode**: Disabled auto-commit. Users must now press **Space** to confirm the character, even if it's a unique match. This prevents accidental commits when the user intends to type more codes or just wants to confirm visually.
- **3-Code Mode**: Retained auto-commit for unique matches to maintain speed.

## 🔧 Previous Session: Mini Mode & Visual Feedback Refinement (2025-11-27)

We focused on fixing the Mini Mode UI and ensuring visual feedback works reliably in PWA mode.
- **Layout**: Fixed the nesting error that broke the Mini Mode layout.
- **Menu**: Fixed the inline settings toolbar interaction (z-index).
- **Visual Feedback**: Implemented a **root-level overlay** to guarantee visibility in PWA/Dark Mode, and refined the aesthetics to be ultra-subtle (premium feel).

### Session Summary
This session established the **Predictive Engine** architecture (MVP 2.0). We moved away from the complex Viterbi approach to a lightweight, high-speed type-ahead system.

**Key Changes**:
1.  **Engine Logic**: Created `js/prediction_engine.js` to handle `predictPhantom` (frequency) and `getBigramSuggestion` (context).
2.  **Smart Spacebar**: Modified `app.js` to prioritize confirming Phantom Text over candidate selection when available.
3.  **UI Restoration**: Reverted `index.html` to the stable "Lite" design while keeping the new engine logic.
4.  **Mini Mode Fix**: Updated `app.js` to use correct selection keys and styling in Mini Mode, matching `lite`.
5.  **Phantom Integration**: Moved Phantom Text into the candidate list as the first item (Index 0), ensuring consistent UX and key mapping.
6.  **Cleanup**: Archived legacy `mvp1` code and updated documentation to reflect the new direction.

### Current Focus
- **Refining Prediction**: Expand `bigram_lite.json` with more data.
- **Smart 3-Code**: Implement logic for 3-code predictions.

---

## 📱 WebDayi Lite (Stable)

**Version**: 0.6.0
**Status**: Stable / Maintenance
**Features**:
- **PWA**: Single-instance, offline-ready.
- **Multi-IM**: Support for Dayi and Zhuyin.
- **Mini Mode**: Floating widget for desktop/mobile.

---

## 📂 Archived Context

### Legacy MVP 1.0 (Vue.js Prototype)
- **Status**: Archived in `archive/mvp1`.
- **Features**: Viterbi sentence prediction, heavy DOM manipulation.
- **Reason for Archive**: Too complex and heavy for the target lightweight experience.

### Legacy PWA Experiments
- **Status**: Archived in `archive/mvp1-pwa`.
- **Features**: Early PWA attempts with IndexedDB.
