# Active Context: WebDaYi

**Last Updated**: 2025-11-27
**Current Version**: MVP 2.0 (Predictive Type-ahead)
**Branch**: `main`

---

## 📊 Current Status

### Phase: MVP 2.0 Development ✅ IN PROGRESS
**Status**: Core Engine Implemented, UI Restored, Verification Complete.
**Focus**: Expanding prediction data and refining "Smart 3-Code" logic.

**Key Achievements**:
- **Predictive Engine**: Implemented `PredictionEngine` with Frequency and Bigram models.
- **Smart Spacebar**: Confirms "Phantom Text" suggestions instantly.
- **UI Restoration**: Restored the clean "WebDayi Lite" card design.
- **Verification**: Confirmed "司機" (bo + i + Space) workflow.

---

## 🔧 Latest Session: MVP 2.0 Implementation (2025-11-27)

### Session Summary
This session established the **Predictive Engine** architecture (MVP 2.0). We moved away from the complex Viterbi approach to a lightweight, high-speed type-ahead system.

**Key Changes**:
1.  **Engine Logic**: Created `js/prediction_engine.js` to handle `predictPhantom` (frequency) and `getBigramSuggestion` (context).
2.  **Smart Spacebar**: Modified `app.js` to prioritize confirming Phantom Text over candidate selection when available.
3.  **UI Restoration**: Reverted `index.html` to the stable "Lite" design while keeping the new engine logic.
4.  **Cleanup**: Archived legacy `mvp1` code and updated documentation to reflect the new direction.

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
