# WebDayi MVP 2.0: Predictive Type-ahead

**Current Status**: 🚧 In Progress (Beta)

MVP 2.0 introduces a **Predictive Engine** designed to reduce keystrokes by predicting the intended character before the full code is typed.

---

## 🌟 Key Features

### 1. Smart Spacebar (Phantom Text)
*   **What it is**: As you type, the engine predicts the most likely character (based on frequency or context) and displays it as a "Phantom" suggestion.
*   **How to use**:
    *   The Phantom suggestion appears as the **first candidate** (Index 0).
    *   Press **Space** to confirm it immediately.
    *   If you want a different character, continue typing or select another candidate.

### 2. Integrated Candidate UX
*   **Unified Experience**: The Phantom suggestion is integrated directly into the candidate list.
*   **Key Conflict Resolved**: Since it occupies the first slot, it naturally uses the **Space** key for selection, avoiding conflicts with other selection keys.

### 3. Mini Mode
*   **Toggle**: Press `Ctrl` twice (Double-Click) or use the menu.
*   **Design**: A floating, unobtrusive widget perfect for overlaying on other content.
*   **UX**: Fully aligned with the main view, supporting Smart Spacebar and all selection keys.

### 4. Bigram Context Awareness
*   **Smart Prediction**: The engine looks at the *last committed character* to predict the next one.
*   **Example**: Typing `bo` (司) -> `i` (機) is predicted because "司機" is a common bigram.

---

## 🛠️ Technical Architecture

*   **Engine**: `js/prediction_engine.js` (Pure Logic)
*   **Data**:
    *   `dayi_db.json`: Core Dayi mapping.
    *   `bigram_lite.json`: Lightweight bigram model for context prediction.
*   **UI**: Zero-Build, Vanilla JS + CSS Variables.

---

## 🚀 How to Run

1.  Open `index.html` in your browser.
2.  Start typing!
    *   Try `dj` -> "明" (Frequency Prediction)
    *   Try `bo` + `i` -> "司機" (Context Prediction)
