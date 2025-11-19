# WebDayi Lite PWA

A lightweight, dependency-free Progressive Web App (PWA) for the Dayi input method.

## Features

- **Lightweight**: Pure HTML/CSS/JS, no build steps required.
- **Offline Capable**: Fully functional offline as a PWA.
- **Dayi 4 Support**: Standard Dayi 4 character set.
- **Smart Input**: Prefix-based candidate filtering.
- **Responsive Design**: Optimized for both mobile and desktop.
- **Advanced Features**:
    - **Focus Mode**: Hide distractions for immersive typing.
    - **Auto-Copy**: Automatically copy selected text.
    - **Theme Toggle**: Switch between Dark and Light modes.
    - **Font Size Adjustment**: Scale the UI to your preference.
    - **Virtual Keyboard Toggle**: Show/Hide the on-screen keyboard.

## Usage

1.  **Open**: Serve the `lite` directory with any static file server.
    ```bash
    python3 -m http.server 8085 --directory lite
    ```
2.  **Install**: Open in a browser and click "Install" (if supported) to add to your home screen.

## Development

- `index.html`: Main entry point.
- `app.js`: Application logic.
- `style.css`: Styling.
- `data/dayi4.cin`: Source dictionary (converted to JSON at runtime or pre-converted).
