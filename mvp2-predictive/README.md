# WebDayi MVP 2.0: Predictive Type-ahead

**Current Status**: 🚧 In Progress (Beta)

MVP 2.0 introduces a **Predictive Engine** designed to reduce keystrokes by predicting the intended character before the full code is typed.

---

## 🌟 Key Features

### 1. Adaptive Prediction Engine
*   **3-Layer Weighted Scoring**: Combines Static Frequency, Bigram Context, and **User Habit** to predict the most likely character.
*   **Extended Prediction**: Predicts full words (e.g., 4-code "何") even when you've only typed the first code (e.g., "i"), based on prefix matching.
*   **Smart Spacebar**: The top prediction is always the first candidate. Press **Space** to commit it immediately.
*   **Smart Compose**: Predicts the next word continuously (even with empty buffer). Press **Tab** to accept.
    *   **Context Safety**: No predictions after punctuation.
    *   **Ghost Text**: Auto-fades out after 3 seconds (configurable) to reduce visual noise.
19: *   **Frequency Dominance**: Automatically suppresses low-quality predictions if the exact match you typed is significantly more frequent (e.g., typing "明" won't suggest "盟").
20: *   **Context Absolute Priority**: Ensures that contextually correct words (e.g., "天" after "明") always appear first, even if other candidates have higher static frequency.

### 2. Smart Input Logic
*   **3/4 Code Toggle**: Switch between 3-code (Express) and 4-code (Standard) modes via the Menu.
*   **Smart Auto-Commit**:
    *   **3-Code Mode**: Auto-commits immediately on unique match for speed.
    *   **4-Code Mode**: Requires manual **Space** to commit (no auto-commit), preventing accidental commits.
    *   **Collision Safety**: If there are multiple candidates, it always waits for selection.
*   **Error Feedback**: Invalid keys trigger a "shake" animation instead of auto-committing, preventing typos from ruining your flow.

### 3. Mini Mode & Settings
*   **Toggle**: Tap `Ctrl` (Single Press) to toggle Mini Mode.
*   **Mini Menu**: Click the status icon (e.g., "易") in Mini Mode to access:
    *   **Input Method**: Dayi / Zhuyin / Eng.
    *   **Max Codes**: 3-code / 4-code toggle.
    *   **Font Size**: A- / A+.

### 4. Bigram Context Awareness
*   **Smart Prediction**: The engine looks at the *last committed character* to predict the next one.
*   **Example**: Typing `bo` (司) -> `i` (機) is predicted because "司機" is a common bigram.

### 5. Mobile Web Optimization
*   **Consistent UI**: Unified "Copy", "Clear", and "Menu" buttons in the Output Header for both Focus and Non-Focus modes.
*   **Clean Layout**: Icon-only buttons on mobile to save space.
*   **Focus Mode**: Optimized layout to prevent keyboard cutoff and ensure a distraction-free typing experience.
*   **No FAB**: Removed floating action button on mobile for a cleaner interface.

---

## ⌨️ Hotkeys

| Key | Action |
| :--- | :--- |
| **Ctrl (Tap)** | Toggle **Mini Mode** (Press & Release) |
| **Alt (Tap)** | **Copy** Output (Subtle Blue Flash) |
| **Alt (Double)** | **Clear All** (Subtle Red Flash) |
| **Left Shift** | Toggle English / Chinese |
| **Right Shift** | Toggle Dayi / Zhuyin |
| **Space** | Select 1st Candidate / Input Space |
| **Tab** | Accept **Smart Compose** Prediction |
| **Enter** | Commit Buffer / Input Enter |
| **Esc** | Clear Buffer / Clear Output |


---

## 🛠️ Technical Architecture

*   **Engine**: `js/prediction_engine.js` (Pure Logic)
*   **Data**:
    *   `dayi_db.json`: Core Dayi mapping.
    *   `bigram_lite.json`: Lightweight bigram model for context prediction.
*   **UI**: Zero-Build, Vanilla JS + CSS Variables.

## 🧪 Data Quality Assurance

We maintain a rigorous testing framework to ensure prediction accuracy.

*   **Automated Testing**: `js/data_quality.test.js` runs a suite of real-world test cases (e.g., "台北", "謝謝", "因為").
*   **Data Patching**: `scripts/fix_bigrams.js` allows for iterative refinement of Bigram data.
*   **Current Status**: **100% Pass Rate** (15/15) on the core test set.
*   **Verification**:
    ```bash
    node js/data_quality.test.js
    ```

---

## 🚀 How to Run

1.  Open `index.html` in your browser.
2.  Start typing!
    *   Try `dj` -> "明" (Frequency Prediction)
    *   Try `bo` + `i` -> "司機" (Context Prediction)
