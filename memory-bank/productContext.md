# Product Context: WebDaYi

## Why This Project Exists

### The Pain Point
Modern knowledge workers increasingly live in the browser. Tools like Gmail, Google Docs, Notion, and countless web applications have become the primary workspace. Yet for Dàyì (大易) Chinese input method users, the typing experience remains fragmented:

1. **System IMEs are opaque**: Traditional OS-level IMEs are black boxes you can't customize or understand
2. **Rime is powerful but heavy**: Configuring Rime feels like learning a new programming language
3. **No browser-native solution**: Existing IMEs operate at OS level, missing browser-specific optimization opportunities
4. **No cloud sync**: Personal dictionaries and preferences don't follow you across devices

### The Vision
What if your input method was as transparent as your favorite developer tool? What if it lived where you actually type—in the browser? What if it learned from your context and synced seamlessly?

WebDaYi answers these questions.

## Problems It Solves

### For Power Users
- **Transparency**: Every line of code is readable and modifiable
- **Control**: No hidden configurations or mysterious behaviors
- **Customization**: Built to be extended and personalized
- **Understanding**: Know exactly how your input method makes decisions

### For Browser-First Workers
- **Native Integration**: Works seamlessly in Gmail, Google Docs, Notion
- **Low Latency**: Sub-100ms response time for instant feedback
- **Zero Context Switching**: No need to switch between different IME modes
- **Future Context Awareness**: Can learn from which website you're on (github.com vs email)

### Technical Pain Points Solved
1. **Complexity Barrier**: No need to learn YAML schemas or complex config files
2. **Setup Friction**: Works out of box, no installation beyond browser extension
3. **Data Portability**: Dictionary data in simple, readable JSON format
4. **Development Speed**: Web technologies enable rapid iteration and debugging

## How It Should Work

### User Experience Flow

#### MVP 1.0: Validation Phase
```
User types "4jp" in input box
  ↓
Candidates appear instantly: 1. 易 2. 義
  ↓
User presses "1"
  ↓
"易" appears in output buffer
  ↓
User clicks "Copy" when done
  ↓
Paste into actual application
```

**Goal**: Validate that core algorithm works perfectly. Output via clipboard is acceptable for validation.

#### MVP 2a: Production Phase
```
User clicks in Gmail compose area
  ↓
Extension activates (invisible to user)
  ↓
User types "4jp"
  ↓
Characters DON'T appear, but candidate UI shows: 1. 易 2. 義
  ↓
User presses "1"
  ↓
"易" appears directly in Gmail
  ↓
Candidate UI disappears
  ↓
User continues typing naturally
```

**Goal**: Indistinguishable from native OS input method. Zero friction.

### Core Interaction Patterns

#### The Input Loop
1. **Listen**: Detect when user is in an editable field
2. **Intercept**: Capture Dàyì code keys before page sees them
3. **Query**: Look up candidates in pre-loaded dictionary
4. **Display**: Show sorted candidates near cursor
5. **Inject**: Insert selected character directly into DOM
6. **Clear**: Reset state and hide UI

#### The Sorting Logic
- Primary: **Frequency** (from Rime dictionary)
- Future: **Context** (what website you're on)
- Future: **Personal history** (what you choose most often)
- Future: **N-gram** (what makes sense in current sentence)

### Performance Expectations

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Initial Load | < 2s | Extension should feel instant on browser start |
| Query Response | < 50ms | Human perception of "instant" |
| Full Interaction | < 100ms | From keypress to character appearing |
| Memory Usage | < 50MB | Dictionary must be RAM-efficient |

### User Experience Principles

1. **Invisible When Right**: If it works perfectly, user shouldn't notice it's there
2. **Obvious When Wrong**: Clear feedback if something breaks
3. **Zero Configuration**: Should work immediately after installation
4. **Predictable Behavior**: Same input always produces same candidate order (until learning kicks in)
5. **Non-Intrusive UI**: Candidate window should feel like part of the page, not an overlay

## User Journey

### Discovery
> "I want a better Dàyì input experience in my browser"

### Setup (MVP 2a)
1. Install extension from Chrome Web Store
2. Click extension icon (optional: see welcome page)
3. Start typing in any web app

**Time to first value**: < 1 minute

### Daily Use
- User opens Gmail
- Starts composing email
- Types naturally using Dàyì codes
- Characters appear in real-time
- No thinking about "which IME is active"

### Advanced Use (Future: MVP 2a+)
- Extension learns user's common phrases
- Adapts suggestions based on website context
- Syncs personal dictionary across Chrome devices
- Allows manual dictionary editing via extension options

## Success Metrics

### Quantitative
- **Accuracy**: 100% match with Rime dictionary lookups
- **Speed**: < 100ms end-to-end latency
- **Coverage**: Works in 3+ major web applications
- **Reliability**: Zero crashes in 1-hour typing session

### Qualitative
- **Transparency**: Developer can read and understand all code in < 2 hours
- **Modifiability**: Power user can add custom feature in < 1 day
- **Learnability**: New user can understand architecture from README in < 30 minutes

### User Validation
> "This feels like typing on macOS with native IME, but I actually understand how it works"

## Non-Goals (What This Is NOT)

- ❌ A replacement for all use cases of Rime (system-wide is still valuable)
- ❌ A framework for multiple input methods (laser-focused on Dàyì)
- ❌ An AI-powered smart typing assistant (frequency-based is sufficient for MVP)
- ❌ A desktop application (web-first philosophy)

## Future Product Evolution

### MVP 2a+ Features
1. **Cloud Sync**: Personal dictionary via `chrome.storage.sync`
2. **Context Awareness**: Different candidate weights for github.com vs gmail.com
3. **N-gram Learning**: "的時候" should rank higher when "的" was just typed
4. **Manual Dictionary**: UI to add custom mappings

### Potential Beyond Browser
- Firefox extension (similar architecture)
- Mobile PWA (for web-based typing on phones)
- API mode (let other apps use WebDaYi as service)

## Competitive Landscape

| Solution | Pros | Cons | WebDaYi's Advantage |
|----------|------|------|---------------------|
| **Rime** | Powerful, flexible | Complex config | Simpler, browser-optimized |
| **OS IME** | System-wide | Opaque, limited | Transparent, customizable |
| **Google IME** | Works everywhere | Privacy concerns, no Dàyì | Open source, Dàyì native |
| **Nothing** | No setup | Poor UX | Dramatically better experience |

## Core Product Philosophy

> **Parasite on data, innovate on experience**

We don't rebuild the Dàyì dictionary. We leverage Rime's excellent open-source work. Our innovation is in:
- Making it **accessible** (web-first)
- Making it **transparent** (readable code)
- Making it **extensible** (future learning features)
- Making it **seamless** (browser-native experience)
