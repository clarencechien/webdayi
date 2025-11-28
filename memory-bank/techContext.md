# Technical Context: WebDaYi
### Development Tools

| Tool | Purpose | Required |
|------|---------|----------|
| **Node.js** | Data pipeline (converter) | Yes (≥18) |
| **npm/pnpm** | Package management | Optional (for pipeline) |
| **Chrome DevTools** | Debugging | Yes |
| **VS Code** | Development | Recommended |
| **Git** | Version control | Yes |

### No Framework Philosophy

**Deliberate Decision**: Zero framework dependencies

**Reasoning**:
- Bundle size: ~10KB vs 100KB+ with frameworks
- Load time: Instant vs framework initialization
- Complexity: Direct DOM manipulation is sufficient
- Debugging: Chrome DevTools is enough
- Learning: Code is self-documenting

**Trade-off**: More boilerplate, but total transparency

## Development Environment Setup

### Prerequisites

```bash
# Check Node.js version
node --version  # Should be ≥18

# Check npm
npm --version

# Chrome browser
google-chrome --version  # Should be ≥88
```

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd webdayi

# No npm install needed for MVP 1 (static page)
# For converter (Phase 0):
cd converter
npm install js-yaml  # Only dependency
```

### Directory Structure

```
webdayi/
├── converter/              # Data pipeline
│   ├── convert.js         # v1: Basic converter (order-based freq)
│   ├── convert-v2.js      # v2: Enhanced converter (frequency-based) ✨
│   ├── convert-v2-lib.js  # v2: Library functions
│   ├── convert-v2.test.js # v2: TDD test suite (21 tests)
│   ├── DESIGN-v2.md       # v2: Design documentation
│   ├── README.md          # Converter documentation
│   ├── package.json       # (minimal dependencies)
│   ├── raw_data/
│   │   ├── dayi.dict.yaml # Rime source data (char→code)
│   │   └── freq.yaml      # Character frequency rankings (1-2000) ✅
│   └── test-data/
│       └── freq-sample.yaml # Test data for unit tests (20 chars)
├── mvp1/                  # Static webpage (validation)
│   ├── index.html         # UI structure
│   ├── core_logic.js      # Core engine
│   ├── style.css          # Styling
│   └── dayi_db.json       # Generated database
├── mvp2a-plugin/          # Chrome Extension
│   ├── manifest.json      # Extension config (V3)
│   ├── background.js      # Service Worker
│   ├── content.js         # Injected script
│   ├── core_logic_module.js  # Refactored from mvp1
│   ├── style.css          # Candidate UI styles
│   └── dayi_db.json       # Copied from mvp1
├── memory-bank/           # Documentation
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── systemPatterns.md
│   ├── techContext.md     # This file
│   ├── activeContext.md
│   └── progress.md
├── CLAUDE.md              # AI assistant guidance
├── PRD.md                 # Product requirements
└── README.md              # Project overview
```

## API Reference

### Prediction Engine (MVP 2.0)

#### Weighted Scoring Model
The engine uses a 3-layer weighted formula to rank candidates:
`Score = (w1 * StaticFreq) + (w2 * BigramProb) + (w3 * UserHabit)`

| Component | Weight | Source | Description |
|-----------|--------|--------|-------------|
| **Static Frequency** | 1.0 | `freq_map.json` | Baseline probability of the character in general usage. |
| **Bigram Probability** | 2.5 | `bigram_lite.json` | Context-aware boost based on the previous character. |
| **User Habit** | 10.0 | `localStorage` | Personalized boost for characters frequently selected by the user. |

#### Data Structures
*   **`freq_map.json`**: Key-Value map of `char -> frequency` (normalized).
*   **`bigram_lite.json`**: Map of `lastChar -> { nextChar: probability }`.
*   **`dayi_db.json`**: Full mapping including 4-code words (regenerated from CIN).

#### Extended Prediction (Prefix Search)
To support predicting full words (e.g., 4-code "何") from partial input (e.g., "i"), the engine performs a prefix search on the `dayi_db` keys.
*   **Optimization**: Limits results to top N matches to maintain performance.

#### Smart Compose (Continuous Prediction)
*   **Next Word Prediction**: Predicts the next character based on the last committed character using Bigram data, even when the input buffer is empty.
*   **Context Safety**: Prevents predictions after punctuation or at the start of a sentence to avoid visual distraction.
*   **Frequency Filtering**: Filters out rare words from predictions unless they are in the user's history.
*   **Ghost Text Timeout**: Automatically hides the ghost text after 3 seconds (configurable) to minimize visual distraction.
*   **Fade-out Animation**: Ghost text fades out smoothly (0.5s opacity transition) before being removed.
*   **Frequency Dominance**: Suppresses predictions if the "Exact Match" (what you typed) is significantly more frequent than the "Prediction" (what it suggests).
    *   Formula: `if (ExactFreq / PredictionFreq > DOMINANCE_RATIO) Suppress()`
    *   Threshold: **8.0** (Lowered from 10.0 to handle cases like "天" vs "衝" where ratio is ~9.2).
    *   Goal: Prevent visual noise when typing high-frequency characters (e.g., "明" shouldn't suggest "盟").
*   **Context Absolute Priority**: If a character matches the Bigram suggestion for the current context (checking the first char of buffer), it gets a massive score boost (VIP Score: 10000.0) to ensure it appears first.
    *   **Context Dominance**: If the Exact Match for the current buffer is a VIP word, all extensions are suppressed.
    *   Goal: Solve ordering issues where low-frequency correct predictions (e.g., "天" after "明") are ranked below high-frequency partial matches or extensions (e.g., "衝").

### Chrome Extension APIs Used

#### chrome.runtime (Message Passing)

```javascript
// Send message from content script
chrome.runtime.sendMessage(
  { type: "query", code: "4jp" },
  (response) => {
    // Handle response
  }
);

// Listen in background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Process request
  sendResponse(result);
  return true;  // Required for async
});
```

**Documentation**: https://developer.chrome.com/docs/extensions/reference/runtime/

#### chrome.storage (Future: MVP 2a+)

```javascript
// Save personal dictionary
chrome.storage.sync.set({ customDict: {...} });

// Load settings
chrome.storage.sync.get(['customDict'], (result) => {
  // Use result.customDict
});
```

**Limits**:
- Sync storage: 100KB total, 8KB per item
- Local storage: 5MB (or unlimited with permission)

**Documentation**: https://developer.chrome.com/docs/extensions/reference/storage/

#### chrome.scripting (Content Script Injection)

```javascript
// Inject content script programmatically
chrome.scripting.executeScript({
  target: { tabId: tab.id },
  files: ['content.js']
});
```

**Documentation**: https://developer.chrome.com/docs/extensions/reference/scripting/

### Web APIs Used

#### Tech Stack (MVP 2.0)
- **Frontend**: Vanilla HTML5, CSS3 (Variables), JavaScript (ES6+).
- **Data**: JSON files (`dayi_db.json`, `bigram_lite.json`).
- **Testing**:
    - **Unit**: `js/prediction.test.js` (Custom lightweight runner).
    - **Data Quality**: `js/data_quality.test.js` (Real-world verification).
    - **Integration**: `test_integration.html` (DOM-based tests).
- **Build Tools**: None required (Zero-build). Optional `scripts/build_bigram.js` (Node.js) for data generation.

#### Clipboard API

```javascript
// Copy to clipboard (MVP 1)
navigator.clipboard.writeText(outputBuffer.value);
```

**Permissions**: Required in manifest for extensions

#### Selection API

```javascript
// Get cursor position
const selection = window.getSelection();
const range = selection.getRangeAt(0);
const rect = range.getBoundingClientRect();
```

**Use Case**: Position candidate UI near cursor

#### execCommand (Deprecated but Still Works)

```javascript
// Insert text at cursor
document.execCommand('insertText', false, '易');
```

**Status**: Deprecated but no replacement yet
**Fallback**: Direct DOM manipulation for contentEditable

## Data Formats

### Source: Rime Dictionary (YAML)

```yaml
# dayi.dict.yaml
---
name: dayi
version: "2.0"
sort: by_weight
columns:
  - text    # The character
  - code    # The Dàyì code
  - weight  # Frequency/probability
...

易	4jp	80
義	4jp	70
大	a	100
```

**Location**: `converter/raw_data/dayi.dict.yaml`
**Source**: https://github.com/rime/rime-dayi

### Intermediate: Database JSON

```json
{
  "4jp": [
    { "char": "易", "freq": 80 },
    { "char": "義", "freq": 70 }
  ],
  "a": [
    { "char": "大", "freq": 100 }
  ]
}
```

**Location**:
- `mvp1/dayi_db.json`
- `mvp2a-plugin/dayi_db.json` (copy)

**Structure**:
- Key: Dàyì code (string)
- Value: Array of candidates
  - `char`: Character (string)
  - `freq`: Frequency (number, higher = more common)

**Size**: ~500KB - 2MB (depending on dictionary)

### Runtime: JavaScript Map

```javascript
const dayiMap = new Map();
// After loading JSON:
dayiMap.set("4jp", [
  { char: "易", freq: 80 },
  { char: "義", freq: 70 }
]);
```

**Memory**: 10-50MB in browser

## Browser Compatibility

### Target Browsers

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| **Chrome** | ≥88 | ✅ Primary | Full support |
| **Edge** | ≥88 | ✅ Compatible | Chromium-based |
| **Brave** | ≥1.20 | ✅ Compatible | Chromium-based |
| **Firefox** | - | 🔜 Future | Different extension API |
| **Safari** | - | ❌ Out of scope | Different ecosystem |

### Required Browser Features

- ✅ ES6+ JavaScript (const, arrow functions, Map, async/await)
- ✅ Fetch API
- ✅ Clipboard API
- ✅ Chrome Extension Manifest V3
- ✅ Service Workers
- ✅ Content Scripts with `capture: true`

## Performance Characteristics

### Memory Usage

| Component | Size | Notes |
|-----------|------|-------|
| dayi_db.json file | 500KB-2MB | Loaded once |
| Map in memory | 10-50MB | Depends on dictionary size |
| Content script | <1MB | Minimal footprint |
| Background script | 10-50MB | Holds the Map |

**Total**: ~20-100MB (acceptable for modern systems)

### CPU Usage

| Operation | Time | Frequency |
|-----------|------|-----------|
| Load database | 100-500ms | Once at startup |
| Query Map | <1ms | Per keystroke |
| Sort candidates | <1ms | Per query (usually <10 items) |
| Render UI | <10ms | Per query |
| Inject text | <5ms | Per selection |

**Total latency**: <20ms (well under 100ms target)

### Network Usage

| Resource | Size | When |
|----------|------|------|
| Extension bundle | ~500KB-2MB | Initial install |
| Database update | ~500KB-2MB | Manual update only |

**Note**: No runtime network requests (all offline)

## Technical Constraints

### Hard Constraints

1. **Manifest V3 Required**: Chrome Web Store policy (2024+)
2. **Content Security Policy**: No eval(), no inline scripts in extension pages
3. **Storage Limits**: chrome.storage.sync = 100KB (for personal dict)
4. **Same-Origin Policy**: Background script can't access page DOM

### Soft Constraints

1. **Bundle Size**: Keep under 5MB for fast installation
2. **Memory**: Target <100MB total (background + content)
3. **Latency**: <100ms for full interaction cycle
4. **Compatibility**: Support last 2 years of Chrome versions

### Known Limitations

1. **No Shadow DOM Access**: Content script can't access closed shadow roots
2. **No iframe Access**: Each iframe needs separate injection
3. **execCommand Deprecated**: May need refactor in future
4. **No Native IME Integration**: Can't hook into OS-level input

## Security Considerations

### Extension Permissions

**Requested**:
```json
{
  "permissions": [
    "storage",      // For personal dictionary (future)
    "scripting",    // For dynamic content script injection
    "activeTab"     // Access to current tab only
  ]
}
```

**NOT Requested**:
- ❌ `<all_urls>`: Too broad, security risk
- ❌ `tabs`: Don't need full tab API
- ❌ `history`: Not needed

### Content Security Policy

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**Implications**:
- No eval() or Function() constructor
- No inline scripts in HTML
- No external script loading

### Data Privacy

- ✅ All processing is local (no telemetry)
- ✅ No data sent to external servers
- ✅ Personal dictionary (future) stored in chrome.storage.sync (Google's encrypted sync)
- ✅ Open source (auditable)

## Dependencies

### Production Dependencies

**Zero** - Completely standalone

### Development Dependencies

| Package | Version | Purpose | Scope |
|---------|---------|---------|-------|
| js-yaml | ^4.1.0 | Parse Rime YAML | converter only |

```json
// converter/package.json
{
  "dependencies": {
    "js-yaml": "^4.1.0"
  }
}
```

**Why minimal**:
- Smaller attack surface
- Easier auditing
- No supply chain vulnerabilities
- Faster installation

## Build Process

### MVP 1: No Build Step

```bash
# Simply open in browser
file:///path/to/webdayi/mvp1/index.html
```

### MVP 2a: Manual Packaging

```bash
# 1. Ensure dayi_db.json exists
cd converter
node convert.js

# 2. Copy to plugin directory
cp ../mvp1/dayi_db.json ../mvp2a-plugin/

# 3. Load unpacked extension in Chrome
# chrome://extensions → Enable Developer Mode → Load Unpacked
# Select: /path/to/webdayi/mvp2a-plugin/
```

### Future: Automated Build (Optional)

```bash
# Could add later:
npm run build  # Minify, bundle, create .zip
npm run test   # Run automated tests
npm run deploy # Submit to Chrome Web Store
```

## Testing Tools

### Manual Testing

| Tool | Purpose | Setup |
|------|---------|-------|
| Chrome DevTools | Debug content script | F12 in any page |
| Extension DevTools | Debug background script | chrome://extensions → "Inspect views: background page" |
| Console Logging | Trace execution | console.log() everywhere |

### Test Pages

Create simple test HTML:

```html
<!-- test-input.html -->
<!DOCTYPE html>
<html>
<body>
  <h1>WebDaYi Test Page</h1>

  <!-- Simple textarea -->
  <textarea placeholder="Type here"></textarea>

  <!-- ContentEditable -->
  <div contenteditable="true" style="border: 1px solid black; padding: 10px;">
    Type here (contentEditable)
  </div>
</body>
</html>
```

### Debugging Techniques

```javascript
// In content.js
console.log('[WebDaYi Content]', 'Injected into:', window.location.href);

// In background.js
console.log('[WebDaYi Background]', 'Query:', code, 'Results:', results.length);

// Performance profiling
console.time('query');
const results = dayiMap.get(code);
console.timeEnd('query');  // Usually <1ms
```

## Deployment Process

### MVP 1: Static Hosting (Optional)

```bash
# Can host on GitHub Pages, Netlify, etc.
# Not required - file:// works fine
```

### MVP 2a: Chrome Web Store

1. **Prepare package**:
   ```bash
   cd mvp2a-plugin
   zip -r webdayi.zip .
   ```

2. **Developer account**:
   - One-time $5 fee
   - https://chrome.google.com/webstore/devconsole

3. **Submit**:
   - Upload .zip
   - Add screenshots, description
   - Review process: 1-3 days

4. **Update process**:
   - Increment version in manifest.json
   - Upload new .zip
   - Auto-updates to users within hours

## Version Control

### Git Workflow

```bash
# Feature branch
git checkout -b feature/data-pipeline

# Commit often
git commit -m "feat: implement YAML to JSON converter"

# Semantic versioning in manifest.json
{
  "version": "0.1.0"  // MVP 1
  "version": "0.2.0"  // MVP 2a
  "version": "1.0.0"  // Public release
}
```

### .gitignore

```
# Node modules (converter only)
converter/node_modules/

# Generated files (track in repo for simplicity)
# mvp1/dayi_db.json  # Actually, do track this
# mvp2a-plugin/dayi_db.json  # And this

# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
```

## Development Workflow

### Typical Development Session

```bash
# 1. Make changes to content.js or background.js
vim mvp2a-plugin/content.js

# 2. Reload extension
# Go to chrome://extensions
# Click reload icon for WebDaYi

# 3. Test on actual page
# Navigate to gmail.com
# Try typing

# 4. Check console for errors
# F12 → Console tab

# 5. Iterate quickly
# Edit → Reload → Test → Repeat
```

### Fast Iteration Tips

- Keep chrome://extensions pinned in a tab
- Use keyboard shortcut for reload: Ctrl+R on extensions page
- Keep DevTools open with "Preserve log" enabled
- Use `debugger;` statements for breakpoints

## Future Technical Considerations

### Potential Migrations

1. **TypeScript**: Add type safety (optional, adds build step)
2. **Web Components**: Isolate candidate UI better
3. **IndexedDB**: For larger personal dictionaries
4. **WebAssembly**: For ultra-fast sorting (overkill for MVP)

### Scalability Concerns

- Current architecture handles up to ~50K entries easily
- For 100K+ entries, consider:
  - Lazy loading
  - Chunked database
  - IndexedDB for persistence

### Cross-Browser Future

```javascript
// Abstraction layer for Firefox compatibility
const browser = chrome || browser;  // Firefox uses 'browser' namespace
```

**Differences**:
- Firefox: `browser.runtime` instead of `chrome.runtime`
- Firefox: Promises instead of callbacks
- Manifest: Minor V3 differences
