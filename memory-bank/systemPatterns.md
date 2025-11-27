# System Patterns: WebDayi

## Architecture Overview

WebDayi MVP 2.0 follows a **Client-Side Predictive Architecture**. It is designed to be a lightweight, zero-dependency web application that runs entirely in the browser.

### High-Level Architecture

```mermaid
graph TD
    User[User Input] --> |Key Events| App[app.js (Controller)]
    App --> |Update State| State[Global State]
    App --> |Render| UI[DOM Elements]
    
    subgraph Prediction Engine
        App --> |Query| Engine[prediction_engine.js]
        Engine --> |Lookup| FreqMap[Frequency Map (dayi_db)]
        Engine --> |Predict| BigramModel[Bigram Model (bigram_lite)]
    end
    
    Engine --> |Phantom Suggestion| App
    App --> |Display| PhantomUI[Phantom Text (Grey)]
    
    User --> |Spacebar| App
    App --> |Confirm| PhantomUI
```

## Core Components

### 1. UI Layer (`index.html`, CSS)
- **Card-Based Layout**: A clean, centered card design (restored from WebDayi Lite) for focus and readability.
- **Virtual Keyboard**: Visual feedback for key presses and layout reference.
- **Phantom Text**: A visual indicator (grey text) appended to the cursor for predictive suggestions.

### 2. Application Logic (`js/app.js`)
- **Controller**: Manages the application lifecycle, event listeners, and UI updates.
- **State Management**: Holds the current buffer, output, candidates, and phantom text state.
- **Smart Spacebar Logic**:
    - Intercepts the Space key.
    - If `state.phantomText` exists, confirms it.
    - Else, triggers standard candidate selection.

### 3. Prediction Engine (`js/prediction_engine.js`)
- **Responsibility**: Pure logic class for generating suggestions.
- **`predictPhantom(buffer)`**:
    - Uses `dayi_db.json`.
    - Returns the most frequent character for the current input buffer.
- **`getBigramSuggestion(lastChar, nextCode)`**:
    - Uses `bigram_lite.json`.
    - Returns the most likely next character based on the previously confirmed character and the current input.

### 4. Data Layer (`data/*.json`)
- **`dayi_db.json`**: The core Dayi character mapping (Code -> Char).
- **`bigram_lite.json`**: A lightweight bigram model (Char -> Next Char) for context-aware predictions.
- **`zhuyin_db.json`**: Support for Zhuyin input method.

## Design Patterns

### 1. Predictive Type-ahead ("Phantom Text")
- **Problem**: Reducing keystrokes for common patterns.
- **Solution**: Display a "ghost" suggestion that can be confirmed with a single key (Space).
- **Interaction**:
    - User types `b` `o` -> Selects `司`.
    - User types `i` -> Engine predicts `機` (based on `司` + `i`).
    - User presses Space -> `機` is confirmed.

### 2. Client-Side Data Loading
- **Pattern**: Fetch-and-Cache.
- **Implementation**: JSON files are fetched on `init()` and stored in memory.
- **Optimization**: Cache busting (`?v=timestamp`) is used during development to ensure fresh data.

### 3. Zero-Build Architecture
- **Philosophy**: No bundlers (Webpack/Vite) required for the core runtime.
- **Benefit**: Extremely simple deployment and debugging.
- **Structure**: ES Modules are used where appropriate, but the core app runs as a simple script inclusion.

## Directory Structure Mapping

- **`mvp2-predictive/`**: The current stable codebase.
- **`lite/`**: The previous stable PWA version.
- **`archive/`**: Legacy prototypes.
