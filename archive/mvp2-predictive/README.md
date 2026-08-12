# WebDayi MVP 2.0: Predictive Type-ahead

> ## 📦 已封存(Archived, 2026-08-12)
>
> **為什麼收**:MVP2(Smart Compose)的失敗是結構性的,不是 bug。它做的是「預測未知」——
> 從前一個字猜使用者*還沒表達*的下一個字。中文字元 bigram 條件熵約 4–5 bits,等效於
> 給定前文後仍有十幾到三十幾個合理選擇,top-1 命中率天生只有一兩成;再加上
> 「看建議 → 判斷 → 決定按不按 Tab」的認知中斷成本,體驗必然是負的。
> 為了救體感而加的「頻率壓制」「上下文絕對優先」heuristic 治標不治本,
> 且被證實在消歧義(解碼)場景反而有害(見 `/smart/docs/mvp3-postmortem.md`)。
>
> **學到什麼**:同一份 bigram 資料,拿來「解碼已知」(使用者已按下的碼)綽綽有餘,
> 拿來「預測未知」遠遠不夠。後續方向改為智慧 2 碼解碼,見 `/smart/`。
>
> **可重用資產已抽出**至 `/smart/`:碼表 `data/dayi_db.json`、`data/ngram_pruned.json`、
> `data/freq_map.json`、使用者習慣層 `js/user_history.js`。
> 本目錄其餘內容僅供考古,不再維護、不再部署。

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
*   **PWA Mode Control**: Automatically defaults to **Focus Mode** on Mobile and **Mini Mode** on Laptop/Desktop.
*   **Mini Mode Toggle**: Manual "Switch Mode" button available in the Mini Mode toolbar.
*   **Laptop Focus Mode**: Polished UI for desktop users with centered layout and optimal reading width.
*   **Small Screen Optimization**: Optimized layout for devices with limited screen height (e.g., iPhone SE) to prevent vertical scrolling.
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

*   **Automated Testing**: `tests/test.html` runs the prediction engine test suite.
*   **Integration Testing**: `tests/test_integration.html` verifies UI interactions.
*   **Debug Lab**: `tests/debug_lab.html` for manual testing and visualization.
*   **Data Patching**: `../scripts/analyze_cin.py` helps analyze CIN files for data improvements.
*   **Verification**:
    Open `tests/test.html` in your browser.

---

## 🚀 How to Run

1.  Open `index.html` in your browser.
2.  Start typing!
    *   Try `dj` -> "明" (Frequency Prediction)
    *   Try `bo` + `i` -> "司機" (Context Prediction)
