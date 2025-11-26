# WebDayi Lite PWA

A lightweight, dependency-free Progressive Web App (PWA) for the Dayi input method.

## Features

- **Lightweight**: Pure HTML/CSS/JS, no build steps required.
- **Offline Capable**: Fully funct- **Virtual Keyboard**:
  - Optimized 5-row layout.
  - **English Mode**: Toggle via Shift key (Virtual & Physical).
  - **Haptic Feedback**: Vibration on key press.
  - **Smart Input**: Prioritizes valid code extension over candidate selection.
  - **Responsive**: Full-width layout on mobile devices.
  - **Shortcuts**:
    - **Shift**: Toggle English Mode.
    - **Control**: Copy output to clipboard.
    - **Alt**: (In Mini Mode) Commit & Copy.
- **Mini Mode**: Distraction-free suspended window for "Alt+Tab" workflow.
- **PWA Support**: Installable on Android/iOS/Desktop with scalable SVG icons.
- **Offline Capable**: Works without internet connection.
- **Customizable**:
  - **Themes**: Light / Dark.
  - **Font Size**: Adjustable scaling.
  - **Focus Mode**: Distraction-free typing.
  - **Auto-Copy**: Automatically copy text upon selection.ed text.
    - **Theme Toggle**: Switch between Dark and Light modes.
    - **Font Size Adjustment**: Scale the UI to your preference.
    - **Virtual Keyboard Toggle**: Show/Hide the on-screen keyboard.

## Usage

1.  **Open**: Serve the `lite` directory with any static file server.
    ```bash
    python3 -m http.server 8085 --directory lite
    ```

## Mini Mode (PWA Only)
When installed as a PWA on desktop, WebDayi Lite automatically launches in **Mini Mode**:
- **Extreme Minimalism**: A frameless, transparent window that blends into your desktop.
- **Terminal Style**: Features a blinking cursor `_` and zero UI clutter.
- **Hotkeys**:
    - **`Ctrl` (Double-Tap)**: Toggle between Mini Mode and Normal Mode (PWA only).
    - **`Alt` (Tap)**: Auto-commits first candidate and copies text to clipboard.
    - **`Alt` (Double-Tap)**: Instantly clears all text.
    - **`Shift`**: Toggles between Chinese and English input modes.
    - **`Esc` / `Delete`**: Alternative keys to clear text.
- **Window Controls**: Supports `window-controls-overlay` for a native, integrated feel.

## Installation
1. Open in Chrome/Edge.
2. Click the "Install" icon in the address bar.
3. **Important**: In the install dialog, ensure "Allow this app to run on startup" or similar system integration settings are checked if available (optional).
4. Once installed, launch the app to enter Mini Mode.

## Development

- `index.html`: Main entry point.
- `app.js`: Application logic.
- `style.css`: Styling.
- `data/dayi4.cin`: Source dictionary (CIN format, 18,635 entries).
- `dayi_db.json`: Compiled database (generated from dayi4.cin, 16,918 codes).

### Regenerating the Database

If you modify `data/dayi4.cin`, regenerate the database:

```bash
cd /path/to/webdayi
node converter/convert_cin.js
```

This will read `lite/data/dayi4.cin` and output to `lite/dayi_db.json`.

**Cache Buster**: After regenerating, update the version in `index.html`:
```javascript
const response = await fetch('dayi_db.json?v=XX');  // Increment XX
```

### Recent Updates (2025-11-26)

- ✅ Fixed converter output path (was `lite/data/dayi_db.json`, now `lite/dayi_db.json`)
- ✅ Merged character priority updates from feat/adjust-char-weights:
  - `71` → 界 (prioritized)
  - `2n` → 制 (prioritized)
  - `2mn` → 觕 (moved from 2n)
- ✅ Cache buster updated to v=32
