# WebDayi MVP 2.0: Predictive Type-ahead

## Overview
MVP 2.0 introduces a **Predictive Engine** to WebDayi, enabling "Smart 2-Code" and "Smart 3-Code" typing. This allows users to type fewer keys to output common characters and bigrams.

## Key Features
- **Smart Spacebar**:
    - If a "Phantom" suggestion (grey text) is displayed, pressing **Space** confirms it immediately.
    - If no Phantom is displayed, Space selects the first candidate (standard behavior).
- **Phantom Text**:
    - **Frequency-based**: Suggests the most common character for the current input buffer (e.g., `i` -> `木`).
    - **Context-based (Bigram)**: Suggests the next likely character based on the previous character (e.g., `司` + `i` -> `機`).
- **Clean UI**: Based on the "WebDayi Lite" card design.

## Usage
1.  Open `index.html`.
2.  Type Dayi codes.
3.  Watch for grey "Phantom Text" appearing after your cursor.
4.  Press **Space** to confirm the phantom text.

## Technical Details
- **Engine**: `js/prediction_engine.js`
- **Data**: `data/bigram_lite.json` (Mock data for MVP)
- **Logic**: `js/app.js` handles the interaction between the engine and the UI.
- Bigram-based prediction (Current char + Next code).
- Smart Spacebar (Confirm prediction).
