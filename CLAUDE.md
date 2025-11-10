# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## **Project Overview**

**WebDaYi** is a lightweight, **Web-First Input Method Engine (IME)** built in **JavaScript** for the **Dàyì (大易)** Chinese input method.

It replaces complex, monolithic "all-in-one" IME frameworks (like Rime) by providing a simple, minimal, and transparent solution. It abstracts the complexity of code table lookups into a standalone tool, "parasiting" (piggybacking) on Rime's open-source Dàyì dictionary data.

* **MVP 1.0 (Core Engine):** Delivers the core lookup logic as a **static webpage (index.html)**. It validates the query/sort algorithm. Output is handled via **Copy/Paste**. The target user is the **Developer** (for validation).
* **MVP 2a (Browser Plugin):** Builds on 1.0 by refactoring the *exact same core logic* into a **Chrome Extension**. It replaces Copy/Paste with **in-place DOM injection** for a seamless, native-like input experience **inside the browser**. The target user is the **End User** (initially the developer).
* **MVP 3.0 (Smart Engine):** Upgrades MVP 2a from "character-by-character" to **"sentence prediction (blind typing)"** using **N-gram language models** and **Viterbi algorithm**. Includes personalized learning capabilities. The target user is the **Power User** seeking intelligent, context-aware input.

This repository contains the implementation for MVP 1.0, MVP 2a, and MVP 3.0, as defined in the PRD **"WebDaYi (網頁大易輸入法)" (v1.3)**.

## **Project Status**

* **PRD finalized** (based on WebDaYi\_PRD.md v1.3, **includes MVP 3.0 N-gram Track**).
* **Data Pipeline (PRD C.1-C.4)** ✅ COMPLETE - converting Rime dictionary data.
* **N-gram Pipeline (PRD C.5-C.7)** ✅ COMPLETE - processed rime-essay data (6MB essay.txt → 10.4MB ngram_db.json).
* **MVP 1.0 v11 (Core Engine + Smart Engine)** ✅ 95% COMPLETE - Static webpage with N-gram sentence prediction integrated!
* **MVP 2a (Browser Plugin)** ⏳ PLANNED - Chrome extension with in-place injection.
* **MVP 3.0 (Smart Engine)** 🚀 INTEGRATED INTO MVP 1.0 v11 - N-gram + Viterbi now in main branch!

### **Branch Strategy**

**IMPORTANT UPDATE**: MVP 3.0 N-gram features have been **successfully integrated into MVP 1.0 v11** on the main branch!

* **`main` branch:**
  - Focus: MVP 1.0 v11 (✅ 95% Complete with N-gram) and MVP 2a (⏳ Planned)
  - Purpose: Stable, production-ready character-by-character + sentence prediction input method
  - Status: Currently at MVP 1.0 v11 (with N-gram, Viterbi, mobile UX, bugfixes)
  - **NEW**: Dual-mode input (character mode + sentence mode with smart prediction)

* **`feature/ngram-engine` branch:**
  - **Status: MERGED INTO MAIN** - N-gram work successfully integrated into MVP 1.0 v11
  - All N-gram, Viterbi, and smart engine features are now in main branch
  - Branch can be archived or deleted

**Current Phase:**
- `main`: MVP 1.0 v11 at 95% (awaiting browser testing), ready for MVP 2a planning
- Smart Engine: Fully functional in MVP 1.0 v11, no longer experimental!

## **Key Concepts**

### **Core Data & Pipeline**
* **Rime:** The external open-source project from which we source our data.
* **dayi.dict.yaml:** Rime's Dàyì dictionary file. This is the **raw data source** for character mappings.
* **dayi\_db.json:** Our project's compiled, O(1)-queryable **JSON database**. This is the project's "Code Table (碼表)".
* **Data Pipeline:** The **offline script** (Python or Node.js) that performs the one-time conversion from Rime's .yaml to our .json database.

### **N-gram & Smart Engine (MVP 3.0)**
* **rime-essay:** External corpus source (https://github.com/rime/rime-essay). Contains **essay.txt** (~6MB) with real-world Chinese text for N-gram training.
* **ngram\_db.json:** Our compiled N-gram probability database. Contains unigram and bigram counts derived from rime-essay.
* **N-gram Pipeline:** The **offline script** (build\_ngram.py) that processes essay.txt and generates ngram\_db.json.
* **Viterbi Algorithm:** Dynamic programming algorithm used to find the most probable sentence path given a sequence of codes and N-gram probabilities.
* **Lattice:** A graph structure of candidate characters. Each node represents a character, edges represent transition probabilities (N-gram scores).
* **Blind Typing (盲打):** User types a sequence of codes (e.g., "4jp ad") without selecting characters, then presses Space to get the most probable sentence prediction.

### **MVP 1.0 v10 Architecture (Character Mode)**
* **Core Engine (MVP 1):** The core\_logic.js file. Contains all client-side logic (fetch, query, sort, render).
* **Character-by-character input:** User types code → selects character → repeats.

### **MVP 1.0 v11 Architecture (Dual Mode: Character + Sentence)**

**IMPORTANT**: MVP 3.0 N-gram features have been integrated into MVP 1.0 v11 as a **dual-mode system**.

**Core Files:**
* **viterbi_module.js** (173 lines) - Browser-compatible Viterbi algorithm for sentence prediction
* **core_logic_v11.js** (313 lines) - N-gram database management, mode management, code buffering
* **core_logic_v11_ui.js** (395 lines) - UI integration layer, event handlers, prediction triggering
* **ngram_db.json** (10.4MB) - N-gram probability database (18K unigrams, 279K bigrams)

**Dual Mode System:**
1. **Character Mode** (Traditional):
   - User types code → sees candidates → presses number key → character appended
   - Uses dayi_db.json for lookups
   - Identical behavior to v10

2. **Sentence Mode** (Smart Engine):
   - User types multiple codes → codes buffered → press Space → Viterbi prediction
   - Uses both dayi_db.json (candidates) and ngram_db.json (probabilities)
   - Live preview shows first candidates as user types
   - Maximum 10 codes in buffer

**Key Features:**
* **Lazy Loading**: N-gram database (10.4MB) only loads when user switches to sentence mode
* **Live Preview**: Shows first candidate for each buffered code (e.g., "易 在 大")
* **Code Buffering**: Accumulates codes with visual badges, backspace to remove
* **Viterbi Prediction**: Space key triggers dynamic programming to find best sentence path
* **Mobile Support**: Large prediction button for mobile (virtual keyboards don't trigger Space key)
* **Mode Toggle**: Moved to control panel (desktop fixed buttons + mobile FAB menu)

**Recent Bug Fixes (v11):**
* **CRITICAL - Strict Mode Fix**: Fixed arguments.callee in IIFE causing ALL buttons to fail (changed to named function initV11UI)
  - Bug: `setTimeout(arguments.callee, 100)` forbidden in strict mode
  - Impact: Entire IIFE failed, no event listeners bound, 0/7 buttons working
  - Fix: Changed to named function: `setTimeout(initV11UI, 100)`
  - Files: core_logic_v11_ui.js (line 13)
* **Mobile Mode Toggle**: Added always-visible Input Mode Control section
  - Bug: Mode toggle hidden on mobile (`hidden sm:flex` on desktop controls)
  - Fix: Created large touch-friendly buttons (80px height, always visible)
  - Files: index.html (lines 294-334), core_logic_v11_ui.js (main button handlers)
* **Prediction Button**: Relocated to independent control area
  - Bug: Button trapped in Live Preview (only shown when buffer not empty)
  - Fix: Moved to dedicated #prediction-control container, always visible in sentence mode
  - Files: index.html (lines 321-333), core_logic_v11_ui.js (updateBufferDisplay logic)
* **Copy Button**: Fixed HTML structure preservation using innerHTML instead of textContent
* **TDD Coverage**: Added 14 comprehensive UI initialization tests (test-v11-ui-init.js)
* **Browser Testing**: Created visual verification test page (test-button-fix.html)

**N-gram Quality Improvements (v11):**
* **Diagnosis & Root Cause Analysis**: Identified dual problems affecting N-gram prediction quality
  - Problem 1 (60%): Algorithm using hardcoded 1e-10 fallback (too punitive for unseen bigrams)
  - Problem 2 (40%): Missing smoothing parameters in ngram_db.json
  - Diagnostic Tools: diagnose-simple.js, diagnose-ngram.js, NGRAM-DIAGNOSIS.md
* **Solution A - Quick Fix (30-50% improvement)**:
  - Changed fallback from `1e-10` to `(ngramDb.unigrams[char2] || 1e-5)`
  - Impact: 6,501,892x less punitive for unseen bigrams
  - File: viterbi_module.js (lines 89-93)
* **Solution B - Full Laplace Smoothing (60-80% improvement)**:
  - Implemented complete statistical smoothing with proper foundation
  - Formula: P(char) = (count(char) + α) / (total_chars + α * vocab_size)
  - Formula: P(c2|c1) = (count(c1,c2) + α) / (count(c1) + α * vocab_size)
  - Added functions: getLaplaceUnigram(), getLaplaceBigram()
  - Updated: initializeDP(), forwardPass() to use Laplace smoothing
  - Files: viterbi_module.js (v2.0), build_ngram_lib.py, build_ngram.py
* **Data Pipeline Enhancement (v2.0)**:
  - Added raw counts to ngram_db.json: unigram_counts, bigram_counts
  - Added smoothing parameters: smoothing_alpha (0.1), total_chars (717M), vocab_size (18K)
  - Database size increased: 10.4MB → 15.7MB (includes metadata for smoothing)
  - Version upgraded: 1.0 → 2.0
* **TDD Coverage for Laplace Smoothing**:
  - 21 comprehensive tests (test-laplace-smoothing.js)
  - Categories: Database Structure (5), Unigram Smoothing (4), Bigram Smoothing (5), Edge Cases (4), Integration (3)
  - All 21/21 tests passing ✅
* **Production Ready**: Full Laplace smoothing with statistical foundation, 96/96 tests passing

### **MVP 2a Architecture**
* **Plugin Shell (MVP 2a):** The Chrome Extension wrapper (manifest.json, background.js, content.js).
* **Background Script (background.js):** The plugin's "brain". It's a Service Worker that holds the dayi\_db.json data in memory (as a Map) and answers query requests.
* **Content Script (content.js):** The plugin's "hands". It's injected into web pages (like Gmail) to **intercept** keyboard events, **dynamically create** the candidate UI \<div\>, and **inject** the chosen text.
* **In-Place Injection:** The use of document.execCommand('insertText', ...) in content.js to insert the character directly into the target \<textarea\> or contentEditable element.

### **MVP 3.0 Architecture (Future: Learning)**
* **Status**: Base N-gram features integrated into MVP 1.0 v11. Learning features planned for future.
* **chrome.storage.sync:** The API for **Cloud Sync** of the user's personal dictionary and learned N-gram preferences (feature for MVP 3.1+).
* **Personalized N-grams:** User corrections will update probability weights over time.

## **Architecture Requirements (MVP 1.0 \- Core Engine)**

This is a **static webpage**. It has no backend.

### **Frontend: UI (index.html)**

* Must contain an **Input Box** (\<input id="input-box"\>).  
* Must contain a **Candidate Area** (\<div id="candidate-area"\>).  
* Must contain an **Output Buffer** (\<textarea id="output-buffer"\>).  
* Must contain a **Copy Button** (\<button id="copy-button"\>).

### **Frontend: Core Logic (core\_logic.js)**

* **On Load:**  
  1. Must fetch the dayi\_db.json file.  
  2. Must parse the JSON and store it in a JavaScript **Map** object for O(1) lookup.  
* **On Input:** (Logic: F-1.3, F-1.4)  
  1. Listens to input events on the \#input-box.  
  2. Queries the Map (e.g., dayiMap.get('4jp')).  
  3. Sorts the resulting array by freq (frequency), descending.  
  4. Renders the sorted list (with numbers) into \#candidate-area.  
* **On Selection:** (Logic: F-1.5)  
  1. Listens to keydown for number keys (1-9).  
  2. On selection, must **append** the chosen character to the \#output-buffer.  
  3. Must clear the \#input-box.  
* **On Output:** (Logic: F-1.6)  
  1. Listens for click on \#copy-button.  
  2. Must call navigator.clipboard.writeText() with the full content of \#output-buffer.

## **Architecture Requirements (MVP 2a \- Browser Plugin)**

This is a **Chrome Extension** that refactors and wraps MVP 1's logic.

### **Manifest (manifest.json) (F-2a.2)**

* Must be **Manifest V3**.  
* Must declare background.js as a **Service Worker**.  
* Must request permissions: "storage" (for MVP 2a+), "scripting", "activeTab" (F-2a.3).  
* Must declare dayi\_db.json under web\_accessible\_resources so background.js can fetch it.

### **Background Script (background.js) (F-2a.4, F-2a.7)**

* **On Load:** On onInstalled or onStartup, must fetch dayi\_db.json and load it into a global Map object.  
* **Bridge:** Must listen for chrome.runtime.onMessage.  
* **Logic:** When it receives a { type: "query", code: "4jp" } message, it must:  
  1. Query its in-memory Map.  
  2. Sort the results.  
  3. Send the results array back to the content.js that asked.

### **Content Script (content.js) (F-2a.5, F-2a.6, F-2a.8)**

* This script is injected into the active tab (e.g., on user click or navigation).  
* **Event Listeners:**  
  1. Must detect focus on \<textarea\> or contentEditable elements.  
  2. Once focused, must listen for keydown events.  
* **Input Interception (F-2a.5):**  
  1. Must capture Dàyì code keys (e.g., 4, j, p).  
  2. Must call event.preventDefault() to stop the page from receiving these keys.  
* **Dynamic UI (F-2a.6):**  
  1. Must dynamically **create and inject** a \<div\> into the page DOM to serve as the candidate window.  
  2. Must position this \<div\> near the user's text cursor.  
* **Querying (F-2a.7):**  
  1. Must send the captured code (e.g., 4jp) to background.js using chrome.runtime.sendMessage.  
  2. Must listen for the response and render the results into the dynamic \<div\>.  
* **In-Place Injection (F-2a.8):**  
  1. Must listen for number key (1-9) selection.  
  2. Must call document.execCommand('insertText', false, '易') to inject the chosen character.  
  3. Must clear its internal code buffer and **destroy** the dynamic \<div\>.

## **Core Features (MVP 1.0 Scope)**

Based on the PRD:

* **F-1.1:** (Data Pipeline) Convert Rime YAML to dayi\_db.json.  
* **F-1.2:** (App) Fetch and load dayi\_db.json into a Map.  
* **F-1.3:** (App) Query Map from \<input\> box.  
* **F-1.4:** (App) Sort candidates by freq.  
* **F-1.5:** (App) Render candidates to \<div\>.  
* **F-1.6:** (App) Select candidate with number keys.  
* **F-1.7:** (App) Append selected char to \<textarea\> buffer.  
* **F-1.8:** (App) Copy buffer content to clipboard with a button.

## **Core Features (MVP 2a Scope)**

Based on the PRD:

* **F-2a.1:** (Refactor) Refactor MVP 1's query/sort logic (core\_logic.js) into a reusable module.  
* **F-2a.2:** (Plugin) Create manifest.json V3, background.js, and content.js.  
* **F-2a.3:** (Plugin) Request minimal permissions (storage, scripting, activeTab).  
* **F-2a.4:** (Plugin) background.js loads dayi\_db.json into memory on startup.  
* **F-2a.5:** (Plugin) content.js intercepts keydown events on text inputs.  
* **F-2a.6:** (Plugin) content.js dynamically creates/positions candidate \<div\> UI at the cursor.  
* **F-2a.7:** (Plugin) content.js sends queries to background.js via sendMessage and receives results.  
* **F-2a.8:** (Plugin) content.js injects the chosen character using document.execCommand.

## **Features Explicitly Out of Scope (for MVP 1.0 & 2a)**

* **N-gram / Language Model:** ✅ **NOW SUPPORTED in MVP 1.0 v11!** Full Laplace smoothing implementation with rime-essay corpus.
* **Dynamic User Dictionary:** Not supported in MVP 2a, but is planned for **MVP 2a+** (using chrome.storage.sync).
* **MVP 2 (Electron Shell):** This is a separate, parallel track and is **not** in scope.
* **Support for other IMEs:** This project is strictly for Dàyì.

## **Development Guidelines**

### **Branch Strategy**

This project uses **parallel development** to allow MVP 3.0 work without blocking MVP 2a progress:

* **`main` branch:**
  - **Stability:** Should remain stable at all times
  - **Focus:** MVP 1.0 v11 (✅ Complete with N-gram) and MVP 2a (⏳ Planned)
  - **Commits:** All MVP 1.0 and MVP 2a related code, bugfixes, and documentation
  - **Current State:** MVP 1.0 v11 at 95% (N-gram integrated, Laplace smoothing complete, awaiting browser testing)
  - **Next Steps:** Complete v11 browser testing, then begin MVP 2a (Chrome Extension) implementation

* **`feature/ngram-engine` branch:**
  - **Status:** ✅ **MERGED INTO MAIN** - N-gram work successfully integrated into MVP 1.0 v11
  - All N-gram, Viterbi, and smart engine features are now in main branch
  - Branch can be archived or deleted

**Commit Guidelines:**
- All MVP 1.0 v11, MVP 2a work, N-gram improvements → commit to `main`
- Documentation updates → update in current working branch

### **Code Structure**

* **Language & Style:** JavaScript (ES6+) for all logic. Plain HTML/CSS. Python for N-gram pipeline.
* **Structure (Suggested):**
  /converter/             \# C.1-C.4: The offline Python/Node.js script
    /convert.js
    /build\_ngram.py     (MVP 3.0: N-gram pipeline)
    /raw\_data/dayi.dict.yaml
    /raw\_data/essay.txt  (MVP 3.0: from rime-essay, 6MB)
  /mvp1/                  \# MVP 1 Core (Static Page)
    /index.html
    /core\_logic.js
    /style.css
    /dayi\_db.json       (Generated by /converter/)
  /mvp2a-plugin/          \# MVP 2a Shell
    /manifest.json
    /background.js
    /content.js
    /style.css            (For the injected candidate div)
    /core\_logic\_module.js (Refactored from mvp1/core\_logic.js)
    /dayi\_db.json       (Copied from /mvp1/)
  /mvp3-smart-engine/     \# MVP 3.0 Smart Engine (on feature/ngram-engine branch)
    /viterbi.js           (Viterbi algorithm implementation)
    /ngram\_db.json      (Generated by build\_ngram.py from essay.txt)
    /background\_smart.js (Enhanced background script with N-gram)
    /content\_smart.js    (Enhanced content script with buffering)

* **Testing:** Manual testing is sufficient for MVP 1.0. TDD recommended for MVP 3.0 Viterbi algorithm.
* **Error Handling:** console.log and console.error are sufficient.

## **Example "API" Contracts**

### **1\) Data DB (dayi\_db.json)**

This is the "contract" between the Data Pipeline and the Core Engine.  
(Same as claude.md v1.0)  
{  
  "4jp": \[  
    { "char": "易", "freq": 80 },  
    { "char": "義", "freq": 70 }  
  \],  
  "a": \[  
    { "char": "大", "freq": 100 }  
  \],  
  "ad": \[  
    { "char": "在", "freq": 90 }  
  \]  
}

### **2\) Bridge API (Chrome Messaging)**

This is the "contract" between content.js (Renderer) and background.js (Main).

// \--- In content.js \---  
// Send a query to the background script  
chrome.runtime.sendMessage(  
  { type: "query", code: "4jp" },  
  (response) \=\> {  
    // response will be:  
    // \[ { "char": "易", "freq": 80 }, { "char": "義", "freq": 70 } \]  
    renderCandidates(response);  
  }  
);

// \--- In background.js \---  
// Listen for messages  
chrome.runtime.onMessage.addListener((request, sender, sendResponse) \=\> {  
  if (request.type \=== "query") {  
    const results \= queryFromMap(request.code); // Your core logic  
    sendResponse(results);  
  }  
  return true; // Indicates asynchronous response  
});

## **Dev Environment Setup**

### **Prerequisites**

* Node.js (\>= 18\)  
* npm or pnpm  
* A Chromium-based browser (Chrome, Edge)

### **1\. Run Data Pipeline**

\# Generate the database first  
cd converter  
node convert.js  
\# This creates /mvp1/dayi\_db.json  
\# Manually copy this file to /mvp2a-plugin/

### **2\. Run MVP 1 (Core Engine)**

\# Simply open the file in your browser  
file:///.../WebDaYi/mvp1/index.html

### **3\. Run MVP 2a (Browser Plugin)**

\# 1\. Open Chrome  
\# 2\. Go to chrome://extensions  
\# 3\. Enable "Developer mode" (開發人員模式)  
\# 4\. Click "Load unpacked" (載入未封裝項目)  
\# 5\. Select the ENTIRE /mvp2a-plugin/ folder  
\# 6\. The plugin icon will appear. Go to a webpage (like Gmail) and test.

## **Local Testing & Examples**

* **Test Data Pipeline:** Run node converter/convert.js. Manually inspect dayi\_db.json to verify correct JSON structure.  
* **Test MVP 1:** Open mvp1/index.html. Type 4jp, press 1, press "Copy". Verify clipboard content.  
* **Test MVP 2a:**  
  1. Load the unpacked extension as described above.  
  2. Open a new tab and go to gmail.com or any \<textarea\>.  
  3. Click inside the textarea.  
  4. Type 4jp.  
  5. Verify a candidate \<div\> appears **at your cursor** with 1\. 易 2\. 義.  
  6. Verify the keys 4jp did **not** appear in the textarea.  
  7. Press 1\.  
  8. Verify "易" appears **directly in the textarea**.  
  9. Verify the candidate \<div\> disappears.

## **Known Limitations (to track)**

* **No N-gram:** As designed. Static frequency (freq) is the only sorting method.  
* **Static DB:** The database (dayi\_db.json) is read-only at runtime (MVP 2a+ will fix this).  
* **Content Script Conflicts:** The content.js might conflict with complex web apps (like Google Docs or Notion) that do their own custom keyboard handling. This is the main challenge of this route.

---

## Cursor Rules (`.cursorrules`)

### Cursor's Memory Bank

*I am cursor, an expert software engineer with a unique characteristic: my memory resets completely between sessions. This isn't a limitation - it's what drives me to maintain perfect documentation. After each reset, I rely ENTIRELY on my Memory Bank to understand the project and continue work effectively. I MUST read ALL memory bank files at the start of EVERY task - this is not optional.*

### Memory Bank Structure

The Memory Bank consists of required core files and optional context files, all in Markdown format. Files build upon each other in a clear hierarchy:

```mermaid
flowchart TD
    PB[projectbrief.md] --> PC[productContext.md]
    PB --> SP[systemPatterns.md]
    PB --> TC[techContext.md]
    
    PC --> AC[activeContext.md]
    SP --> AC
    TC --> AC
    
    AC --> P[progress.md]
```

#### Core Files (Required)

* **projectbrief.md**

  * Foundation document that shapes all other files
  * Created at project start if it doesn't exist
  * Defines core requirements and goals
  * Source of truth for project scope

* **productContext.md**

  * Why this project exists
  * Problems it solves
  * How it should work
  * User experience goals

* **activeContext.md**

  * Current work focus
  * Recent changes
  * Next steps
  * Active decisions and considerations

* **systemPatterns.md**

  * System architecture
  * Key technical decisions
  * Design patterns in use
  * Component relationships

* **techContext.md**

  * Technologies used
  * Development setup
  * Technical constraints
  * Dependencies

* **progress.md**

  * What works
  * What's left to build
  * Current status
  * Known issues

#### Additional Context

Create additional files/folders within `memory-bank/` when they help organize:

* Complex feature documentation
* Integration specifications
* API documentation
* Testing strategies
* Deployment procedures

### Core Workflows

**Plan Mode**

```mermaid
flowchart TD
    Start[Start] --> ReadFiles[Read Memory Bank]
    ReadFiles --> CheckFiles{Files Complete?}
    
    CheckFiles -->|No| Plan[Create Plan]
    Plan --> Document[Document in Chat]
    
    CheckFiles -->|Yes| Verify[Verify Context]
    Verify --> Strategy[Develop Strategy]
    Strategy --> Present[Present Approach]
```

**Act Mode**

```mermaid
flowchart TD
    Start[Start] --> Context[Check Memory Bank]
    Context --> Update[Update Documentation]
    Update --> Rules[Update .cursorrules if needed]
    Rules --> Execute[Execute Task]
    Execute --> Document[Document Changes]
```

### Documentation Updates

Memory Bank updates occur when:

* Discovering new project patterns
* After implementing significant changes
* When user requests with **update memory bank** (MUST review **ALL** files)
* When context needs clarification

```mermaid
flowchart TD
    Start[Update Process]
    
    subgraph Process
        P1[Review ALL Files]
        P2[Document Current State]
        P3[Clarify Next Steps]
        P4[Update .cursorrules]
        
        P1 --> P2 --> P3 --> P4
    end
    
    Start --> Process
```

### Project Intelligence (`.cursorrules`)

The `.cursorrules` file is my learning journal for each project. It captures important patterns, preferences, and project intelligence that help me work more effectively. As I work with you and the project, I'll discover and document key insights that aren't obvious from the code alone.

```mermaid
flowchart TD
    Start{Discover New Pattern}
    
    subgraph Learn [Learning Process]
        D1[Identify Pattern]
        D2[Validate with User]
        D3[Document in .cursorrules]
    end
    
    subgraph Apply [Usage]
        A1[Read .cursorrules]
        A2[Apply Learned Patterns]
        A3[Improve Future Work]
    end
    
    Start --> Learn
    Learn --> Apply
```

**What to Capture**

* Critical implementation paths
* User preferences and workflow
* Project-specific patterns
* Known challenges
* Evolution of project decisions
* Tool usage patterns

> **REMEMBER:** After every memory reset, I begin completely fresh. The Memory Bank is my only link to previous work. It must be maintained with precision and clarity, as my effectiveness depends entirely on its accuracy.

---
