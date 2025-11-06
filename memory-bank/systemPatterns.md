# System Patterns: WebDaYi

## Architecture Overview

WebDaYi follows a **two-phase evolutionary architecture**:
1. **MVP 1**: Monolithic validation (single-page app)
2. **MVP 2a**: Distributed client (Chrome Extension with Service Worker)

### High-Level Architecture (MVP 2a Target)

```
┌─────────────────────────────────────────────────────────┐
│                     Web Page (gmail.com)                │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Injected Content Script                  │ │
│  │  ┌──────────────┐  ┌────────────────────────────┐ │ │
│  │  │ Event Listener│  │   Dynamic Candidate UI     │ │ │
│  │  │  (keydown)   │  │       <div> overlay        │ │ │
│  │  └──────┬───────┘  └───────────▲────────────────┘ │ │
│  │         │                      │                   │ │
│  │         │ intercept            │ render            │ │
│  │         ▼                      │                   │ │
│  │  ┌──────────────┐  ┌───────────┴────────────────┐ │ │
│  │  │ Input Buffer │  │   DOM Injection Logic      │ │ │
│  │  │  (4jp...)    │  │  execCommand('insertText') │ │ │
│  │  └──────┬───────┘  └────────────────────────────┘ │ │
│  └─────────┼────────────────────────────────────────┘ │
└────────────┼──────────────────────────────────────────┘
             │
             │ chrome.runtime.sendMessage()
             │ { type: "query", code: "4jp" }
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│              Background Service Worker                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Core Query Engine (refactored)             │ │
│  │  ┌──────────────┐  ┌────────────────────────────┐ │ │
│  │  │  dayi_db.json│  │   In-Memory Map            │ │ │
│  │  │  (loaded on  │─▶│   { "4jp": [...] }         │ │ │
│  │  │   startup)   │  │   O(1) lookup              │ │ │
│  │  └──────────────┘  └───────┬────────────────────┘ │ │
│  │                            │                       │ │
│  │                            ▼                       │ │
│  │                    ┌────────────────┐             │ │
│  │                    │  Sort by freq  │             │ │
│  │                    └───────┬────────┘             │ │
│  │                            │                       │ │
│  │                            ▼                       │ │
│  │                    return [ {char, freq}, ... ]   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Core Design Patterns

### 1. Data Pipeline Pattern: Offline Transformation

**Problem**: Rime's YAML format is not browser-optimized
**Solution**: One-time offline conversion to JSON

```
Input:  dayi.dict.yaml (YAML, complex structure)
         ↓
Process: converter/convert.js (Node.js script)
         ↓
Output:  dayi_db.json (JSON, O(1) queryable)
```

**Key Decision**: Pre-process complexity offline rather than runtime parsing

### 2. Query Engine Pattern: In-Memory Map

**Problem**: Need O(1) lookup performance
**Solution**: Load entire dictionary into JavaScript Map on startup

```javascript
// Conceptual structure
const dayiMap = new Map();
// After loading dayi_db.json:
dayiMap.set("4jp", [
  { char: "易", freq: 80 },
  { char: "義", freq: 70 }
]);

// Query is O(1)
const results = dayiMap.get("4jp");
```

**Trade-offs**:
- ✅ Ultra-fast lookups
- ✅ Simple implementation
- ❌ ~10-50MB RAM usage (acceptable for modern browsers)
- ❌ No partial matching (must know exact code)

### 3. Event Interception Pattern: PreventDefault + Custom Handling

**Problem**: Need to capture keystrokes before page sees them
**Solution**: High-priority event listener with preventDefault

```javascript
// In content.js
document.addEventListener('keydown', (e) => {
  if (isInInputMode && isDayiKey(e.key)) {
    e.preventDefault();        // Stop page from receiving key
    e.stopPropagation();       // Stop event bubbling
    codeBuffer += e.key;       // Add to our internal buffer
    queryAndDisplay(codeBuffer);
  }
}, { capture: true });  // Capture phase = highest priority
```

**Critical**: Must use `capture: true` to intercept before page handlers

### 4. Message Bridge Pattern: Content ↔ Background

**Problem**: Content script can't store large data; background has no DOM access
**Solution**: Message passing with request-response pattern

```javascript
// Content Script (has DOM, no data)
chrome.runtime.sendMessage(
  { type: "query", code: "4jp" },
  (response) => {
    renderCandidates(response);  // Use results to update UI
  }
);

// Background Script (has data, no DOM)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "query") {
    const results = queryEngine(request.code);
    sendResponse(results);
  }
  return true;  // Important: enables async response
});
```

### 5. Dynamic UI Pattern: Runtime DOM Injection

**Problem**: Need candidate UI that doesn't exist in original page
**Solution**: Programmatically create and position overlay

```javascript
// In content.js
function showCandidates(candidates) {
  const candidateDiv = document.createElement('div');
  candidateDiv.id = 'webdayi-candidates';
  candidateDiv.innerHTML = candidates.map((c, i) =>
    `${i+1}. ${c.char}`
  ).join(' ');

  // Position near cursor
  const pos = getCaretCoordinates();
  candidateDiv.style.position = 'absolute';
  candidateDiv.style.left = pos.x + 'px';
  candidateDiv.style.top = pos.y + 20 + 'px';

  document.body.appendChild(candidateDiv);
}
```

**Isolation**: Must use unique IDs and scoped CSS to avoid conflicts

### 6. Text Injection Pattern: execCommand vs Direct Manipulation

**Problem**: Need to insert text into focused element
**Solution**: Use document.execCommand for compatibility

```javascript
// Recommended approach (works with undo/redo)
document.execCommand('insertText', false, '易');

// Fallback for contentEditable
if (element.isContentEditable) {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode('易'));
}

// Fallback for textarea/input
if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
  const start = element.selectionStart;
  element.value =
    element.value.slice(0, start) +
    '易' +
    element.value.slice(start);
  element.selectionStart = element.selectionEnd = start + 1;
}
```

## Component Relationships

### MVP 1: Core Engine (Validation Phase)

```
index.html
  ├─ Input Box (#input-box)
  ├─ Candidate Area (#candidate-area)
  ├─ Output Buffer (#output-buffer)
  └─ Copy Button (#copy-button)
       ↓
core_logic.js
  ├─ loadDatabase()        → fetch dayi_db.json → Map
  ├─ handleInput()         → query Map → sort
  ├─ renderCandidates()    → update #candidate-area
  ├─ handleSelection()     → append to #output-buffer
  └─ handleCopy()          → clipboard API
```

**Data Flow**:
```
User types "4jp"
  → input event
  → handleInput("4jp")
  → dayiMap.get("4jp")
  → sort by freq
  → renderCandidates([...])
  → DOM update
  → User presses "1"
  → handleSelection(0)
  → append "易" to textarea
  → clear input
```

### MVP 2a: Browser Plugin (Production Phase)

```
manifest.json
  ├─ background.js (Service Worker)
  ├─ content.js (Injected script)
  └─ dayi_db.json (Resource)

background.js
  ├─ onInstalled → loadDatabase()
  ├─ Map<string, Candidate[]> (in-memory)
  └─ onMessage → queryEngine()

content.js
  ├─ detectInputField()
  ├─ interceptKeydown()
  ├─ sendQuery() → chrome.runtime.sendMessage
  ├─ createCandidateUI()
  ├─ handleSelection()
  └─ injectText() → execCommand
```

**Data Flow**:
```
User clicks in Gmail textarea
  → content.js detects focus
  → addEventListener(keydown)
  → User types "4"
  → e.preventDefault()
  → codeBuffer = "4"
  → User types "j"
  → codeBuffer = "4j"
  → User types "p"
  → codeBuffer = "4jp"
  → sendMessage({ type: "query", code: "4jp" })
  → background.js receives
  → dayiMap.get("4jp")
  → sort by freq
  → sendResponse([{ char: "易", freq: 80 }, ...])
  → content.js receives
  → createCandidateUI([...])
  → User presses "1"
  → execCommand('insertText', false, '易')
  → destroyCandidateUI()
  → codeBuffer = ""
```

## Key Technical Decisions

### Decision 1: Why JavaScript Map over Plain Object?

**Rationale**:
- `Map.get()` is guaranteed O(1)
- Supports any key type (future-proof)
- Better performance for frequent lookups
- Cleaner API

### Decision 2: Why Manifest V3 over V2?

**Rationale**:
- V2 is deprecated (sunset 2024)
- V3 required for Chrome Web Store
- Service Workers more resource-efficient than background pages
- Future-proof architecture

### Decision 3: Why Not Use Trie/Prefix Tree?

**Rationale**:
- Dàyì codes are short (1-4 characters)
- Full dictionary is small enough for RAM
- Map lookup is already optimal
- Simpler implementation = fewer bugs
- **Trade-off**: No autocomplete (acceptable for MVP)

### Decision 4: Why Frequency-Based Sorting Only?

**Rationale**:
- Validates core algorithm first
- N-gram adds complexity (defer to 2a+)
- Rime's frequencies are high quality
- **Future**: Easy to add contextual weights later

### Decision 5: Why Chrome-Only Initially?

**Rationale**:
- Firefox has different extension API (though similar)
- Edge/Brave use Chromium (free compatibility)
- Focus on one platform for MVP
- **Future**: Port to Firefox with minimal changes

## Anti-Patterns to Avoid

### ❌ Don't: Store State in Content Script
**Why**: Content scripts can be destroyed/reloaded
**Do Instead**: Store in background script or chrome.storage

### ❌ Don't: Modify Page's Existing DOM Extensively
**Why**: Conflicts with page's own JavaScript
**Do Instead**: Create isolated overlay with unique IDs

### ❌ Don't: Use Global Variables in Content Script
**Why**: Namespace pollution, conflicts with page
**Do Instead**: Use IIFE or modules

### ❌ Don't: Synchronous Operations in Background Script
**Why**: Blocks message handling
**Do Instead**: Use async/await or callbacks

### ❌ Don't: Hardcode UI Positioning
**Why**: Breaks on different page layouts
**Do Instead**: Calculate position relative to caret

## Testing Strategies

### Unit Testing Pattern (Future)
```javascript
// Test core query function in isolation
function testQueryEngine() {
  const db = { "4jp": [{ char: "易", freq: 80 }] };
  const map = new Map(Object.entries(db));
  const result = queryAndSort(map, "4jp");
  assert(result[0].char === "易");
}
```

### Integration Testing Pattern (Manual for MVP)
1. Load extension in Chrome
2. Navigate to test page (simple textarea)
3. Type known code (e.g., "4jp")
4. Verify candidate UI appears
5. Verify selection works
6. Verify text is injected

### Compatibility Testing Matrix
| Site | Input Type | Status |
|------|------------|--------|
| Gmail | contentEditable | ✅ Test |
| Google Docs | Custom editor | ⚠️ Complex |
| Notion | contentEditable | ✅ Test |
| Plain textarea | <textarea> | ✅ Test |
| GitHub | <textarea> | ✅ Test |

## Performance Patterns

### Lazy Loading (Future Optimization)
```javascript
// Instead of loading full DB:
// Load only common characters on startup
// Load full DB on first query
```

### Debouncing (Not Needed for MVP)
- Dàyì codes are short (max 4 chars)
- Query on every keystroke is fine
- No need to debounce

### Caching (Not Needed for MVP)
- Map is already in-memory cache
- No need for additional layer

## Security Patterns

### Content Security Policy
```json
// In manifest.json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### Permissions Minimalism
```json
// Only request what's needed
"permissions": ["storage", "scripting", "activeTab"]
// NOT "tabs", NOT "<all_urls>"
```

### Input Sanitization
```javascript
// Always validate user input
function isDayiKey(key) {
  return /^[a-z0-9;,./']$/.test(key);  // Whitelist only
}
```

## Extensibility Patterns (MVP 2a+)

### Plugin System (Future)
```javascript
// Allow users to add custom processors
const processors = [
  frequencySort,      // MVP
  ngramBoost,         // 2a+
  contextualWeight,   // 2a+
  personalHistory     // 2a+
];

function rankCandidates(candidates, context) {
  return processors.reduce(
    (acc, processor) => processor(acc, context),
    candidates
  );
}
```

### Configuration Pattern (Future)
```javascript
// Use chrome.storage.sync for cross-device settings
chrome.storage.sync.get(['customDict', 'contextMode'], (config) => {
  if (config.customDict) loadCustomDict(config.customDict);
  if (config.contextMode) enableContextMode();
});
```
