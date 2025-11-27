# System Patterns: WebDaYi

**Last Updated**: 2025-11-27
**Current Version**: MVP 2.0 (Predictive Type-ahead)

---

## 🏗️ Architecture: Client-Side Predictive Engine

WebDaYi MVP 2.0 shifts from a complex Viterbi algorithm to a lightweight, high-speed **Predictive Type-ahead** architecture.

### Core Flow

```mermaid
graph TD
    User[User Input] -->|Keystroke| App[app.js]
    App -->|Buffer| Engine[PredictionEngine]
    
    subgraph Prediction Logic
        Engine -->|Lookup| FreqMap[Frequency Map (dayi_db.json)]
        Engine -->|Context| Bigram[Bigram Model (bigram_lite.json)]
        FreqMap -->|Candidate| Engine
        Bigram -->|Suggestion| Engine
    end
    
    Engine -->|Phantom Text| App
    App -->|Render| UI[UI Layer]
    UI -->|Feedback| User
```

### Key Components

1.  **UI Layer (`index.html` + `app.js`)**
    *   **Responsibility**: Rendering, Input Handling, State Management.
    *   **Pattern**: Zero-Build (Vanilla JS + CSS Variables).
    *   **Mini Mode**: Floating overlay for unobtrusive input.

2.  **Application Logic (`app.js`)**
    *   **State**: `buffer`, `output`, `candidates`, `phantomText`.
    *   **Event Loop**: `keydown` -> `handleInput` -> `updateComposition` -> `renderCandidates`.

3.  **Prediction Engine (`js/prediction_engine.js`)**
    *   **Responsibility**: Pure logic for generating suggestions.
    *   **Methods**:
        *   `predictPhantom(buffer)`: Returns highest frequency char for current buffer.
        *   `getBigramSuggestion(lastChar, nextCode)`: Returns context-aware suggestion.

4.  **Data Layer (`data/*.json`)**
    *   **`dayi_db.json`**: Core mapping (Code -> Candidates).
    *   **`bigram_lite.json`**: Lightweight bigram model (Char + Code -> Next Char).

---

## 🧩 Design Patterns

### 1. Predictive Type-ahead ("Smart 2-Code")
*   **Concept**: Predict the full character before the user finishes typing the code.
*   **Mechanism**:
    *   **Phantom Text**: A "ghost" suggestion displayed immediately.
    *   **Smart Spacebar**: Pressing `Space` confirms the Phantom Text if available.
    *   **Integrated Candidate**: Phantom Text is inserted as the **first candidate (Index 0)**. This resolves key conflicts (Space naturally selects it) and ensures consistent UX across Web and Mini modes.

### 2. Client-Side Data Loading
*   **Pattern**: Fetch-and-Cache.
*   **Implementation**: `fetch('data/dayi_db.json')` on init.
*   **Optimization**: Browser cache handles subsequent loads. No IndexedDB complexity needed for read-only data.

### 3. Zero-Build Architecture
*   **Philosophy**: "View Source" is the source code.
*   **Benefit**: Maximum transparency, easy to debug, no build step friction.
*   **Structure**: ES Modules (optional) or simple script tags.

---

## 📂 Directory Structure Mapping

```
webdayi/
├── mvp2-predictive/        # MVP 2.0 (Current Focus)
│   ├── js/                 # Logic (app.js, prediction_engine.js)
│   ├── data/               # JSON Data (dayi_db, bigram_lite)
│   └── index.html          # UI Entry Point
│
├── lite/                   # WebDayi Lite (Stable PWA)
│   └── (Similar structure, no prediction engine)
│
└── archive/                # Legacy Code
    ├── mvp1/               # Vue.js Prototype
    └── mvp1-pwa/           # Early PWA
```
