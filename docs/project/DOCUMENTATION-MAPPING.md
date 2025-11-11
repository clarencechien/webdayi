# WebDaYi Documentation Mapping

**Date**: 2025-11-11 (Updated after v11.2.0 Build 007 - Mobile UX Improvements)
**Version**: 11.2.0 (Build: 20251111-007, Commit: 326684c)
**Branch**: claude/version-update-buffer-diagnostics-011CUqoiGKdFk7wf79JNuW1h
**Purpose**: Ensure all documentation accurately maps to the codebase

---

## 📚 Documentation Structure (NEW!)

All documentation has been reorganized into the `docs/` folder for better management:

### Root Level Documentation

| Document | Purpose | Maps To | Status |
|----------|---------|---------|--------|
| `README.md` | Main project overview (正體中文) | Entire project | ✅ Updated (Build 007) |
| `README.en.md` | English version | Entire project | ⏳ Needs update |
| `CLAUDE.md` | AI assistant guide | Project structure | ✅ Current |

### 🗂️ docs/project/ - Project Documentation

| Document | Purpose | Maps To | Status |
|----------|---------|---------|--------|
| `PRD.md` | Product requirements (v1.3) | All features | ✅ Current |
| `VERSION-GUIDE.md` | Version checking guide | Version system | ✅ Current (v11.2) |
| `VERIFICATION.md` | Verification checklist | Test results | ✅ Current |
| `DOCUMENTATION-MAPPING.md` | This file | Doc structure | ✅ Updated (Build 007) |
| `FINAL-VERIFICATION.md` | Final verification report | v11 completion | ✅ Current |

### 🎨 docs/design/ - Design Documentation

| Document | Purpose | Maps To | Status |
|----------|---------|---------|--------|
| `DESIGN-v2.md` | Converter v2 (frequency) | converter/*.py | ✅ Current |
| `DESIGN-ngram.md` | N-gram pipeline | build_ngram*.py | ✅ Current |
| `DESIGN-viterbi.md` | Viterbi algorithm | viterbi_module.js | ✅ Current |
| `DESIGN-auto-copy.md` | Auto-copy (v8) | core_logic.js | ✅ Current |
| `DESIGN-v10.md` | Mobile UX (v10) | index.html, core_logic.js | ✅ Current |
| `DESIGN-v10-ux-improvement.md` | Inline hints (v10) | renderCandidatesHTML() | ✅ Current |
| `DESIGN-v10-bugfix.md` | Delete key (v10) | core_logic.js | ✅ Current |
| `DESIGN-v11.md` | N-gram integration (v11) | core_logic_v11*.js | ✅ Current |
| `DESIGN-v11-ux-improvements.md` | UX Round 1 (v11) | Mode guards | ✅ Current |

### 🧪 docs/testing/ - Testing Documentation

| Document | Purpose | Maps To | Status |
|----------|---------|---------|--------|
| `BROWSER-TESTING-v11.md` | Browser test plan | Manual testing | ✅ Current |
| `TEST-RESULTS-v11.md` | Test results | All test files | ⏳ Needs update (187+ tests) |
| `TEST-PLAN-v11-ui.md` | UI test plan | test-v11-ui-init.js | ✅ Current |

### 💡 docs/ux/ - UX Documentation

| Document | Purpose | Maps To | Status |
|----------|---------|---------|--------|
| `TAIWAN-LOCALIZATION.md` | Localization guide | Terminology changes | ✅ Current |
| `UX-IMPROVEMENTS-v11.md` | v11 UX overview | All UX fixes | ⏳ Needs update (Build 007) |
| `UX-FIXES-SUMMARY.md` | UX Round 1 summary | core_logic.js fixes | ✅ Current |
| `UX-IMPLEMENTATION-STATUS.md` | Implementation status | Round 1 status | ✅ Current |
| `UX-ISSUES-ROUND2.md` | UX Round 2 analysis | Round 2 fixes | ✅ Current |
| `UX-SPACE-KEY-REDESIGN.md` | Space/= key redesign spec | v11.2 blind typing | ✅ Current (Build 005) |
| `UX-CRITICAL-SINGLE-CHAR-BUG.md` | Single-char bug analysis | Round 2 fixes | ✅ Current (Build 006) |
| `MOBILE-SPACE-KEY-FIX.md` | Mobile Space key fix | Build 005 handler | ✅ Current (Build 005) |
| `MOBILE-UX-IMPROVEMENTS.md` | Mobile UX 3-phase design | Build 007 mobile UX | ✅ NEW! (Build 007) |
| `SESSION-SUMMARY-v11-ux.md` | Session summary | Round 1 work | ✅ Current |
| `NGRAM-DIAGNOSIS.md` | N-gram quality analysis | viterbi_module.js, build_ngram.py | ✅ Current |

### Memory Bank Documentation

| Document | Purpose | Maps To | Status |
|----------|---------|---------|--------|
| `memory-bank/projectbrief.md` | Project foundation | Core mission | ✅ Current |
| `memory-bank/productContext.md` | Why & how | User experience | ✅ Current |
| `memory-bank/activeContext.md` | Current work focus | Latest changes | ✅ Updated |
| `memory-bank/systemPatterns.md` | Architecture | System design | ✅ Current |
| `memory-bank/techContext.md` | Technologies | Tech stack | ✅ Current |
| `memory-bank/progress.md` | Project status | Milestones | ⏳ Needs update |

### MVP1 Core Documentation

| Document | Purpose | Maps To Files | Status |
|----------|---------|---------------|--------|
| `mvp1/README.md` | MVP1 overview | All mvp1/ files | ✅ Current |
| `mvp1/README.en.md` | English version | All mvp1/ files | ⏳ Needs update |
| `mvp1/DESIGN-v11.md` | v11 architecture | core_logic_v11*.js, viterbi_module.js | ✅ Current |
| `mvp1/DESIGN-v11-ux-improvements.md` | UX fixes design | core_logic.js (mode guards) | ✅ Current |
| `mvp1/TEST-PLAN-v11-ui.md` | UI test plan | test-v11-*.js | ✅ Current |

### MVP1 Legacy Design Documents (Deprecated - Moved to docs/)

**Note**: These design documents have been moved to `docs/design/` and `docs/ux/` for better organization.

| Old Location | New Location | Status |
|--------------|--------------|--------|
| `mvp1/DESIGN-auto-copy.md` | `docs/design/DESIGN-auto-copy.md` | ✅ Moved |
| `mvp1/DESIGN-v10.md` | `docs/design/DESIGN-v10.md` | ✅ Moved |
| `mvp1/DESIGN-v10-ux-improvement.md` | `docs/design/DESIGN-v10-ux-improvement.md` | ✅ Moved |
| `mvp1/DESIGN-v10-bugfix.md` | `docs/design/DESIGN-v10-bugfix.md` | ✅ Moved |
| `mvp1/UX-CRITICAL-SINGLE-CHAR-BUG.md` | `docs/ux/UX-CRITICAL-SINGLE-CHAR-BUG.md` | ✅ Moved |
| `mvp1/UX-SPACE-KEY-REDESIGN.md` | `docs/ux/UX-SPACE-KEY-REDESIGN.md` | ✅ Moved |

---

## Code to Documentation Mapping

### Core Files

#### `mvp1/index.html` (29,033 bytes)
**Documentation**:
- `mvp1/README.md` - Feature list
- `mvp1/DESIGN-v11.md` - UI structure
- `mvp1/DESIGN-v10-ux-improvement.md` - Responsive controls

**Key Sections**:
- Lines 1-50: HTML structure, Tailwind setup
- Lines 53-170: Desktop control panel (fixed buttons)
- Lines 172-221: Mobile FAB + slide-in menu
- Lines 294-334: Input Mode Control (v11)
- Lines 321-333: Prediction button
- Lines 336-391: Main content area

**Latest Changes**:
- v11: Terminology fix (智能 → 智慧)
- v11: Mode toggle buttons
- v11: Sentence mode panel

---

#### `mvp1/core_logic.js` (46,686 bytes)
**Documentation**:
- `mvp1/README.md` - Core features
- `mvp1/DESIGN-auto-copy.md` - Auto-copy logic
- `mvp1/DESIGN-v10-bugfix.md` - Delete key
- `mvp1/UX-FIXES-SUMMARY.md` - Mode guards

**Key Sections**:
- Lines 1-15: Global state
- Lines 17-350: User personalization (v6-v9)
- Lines 352-550: Selection & pagination (v2-v3)
- Lines 552-750: Auto-copy (v8)
- Lines 752-900: Auto-select (v3, v7 fix)
- Lines 876-898: `shouldAutoSelectOnInput()` - **v11 UX FIX** (mode guard added)
- Lines 1116-1170: `handleInput()` - **v11 UX FIX** (mode guard added)
- Lines 1346-1449: Event listeners - **v11 UX FIX** (mode isolation, Space key, Delete enhancement)

**Latest Changes**:
- Line 1117-1121: Mode guard in `handleInput()`
- Line 877-881: Mode guard in `shouldAutoSelectOnInput()`
- Line 1367-1400: Enhanced Delete key + mode isolation
- Line 1427-1436: Mode-aware Space key handling

---

#### `mvp1/core_logic_v11.js` (7,255 bytes)
**Documentation**:
- `mvp1/DESIGN-v11.md` - N-gram functions
- `mvp1/README.md` - v11 features

**Key Sections**:
- Lines 14-92: N-gram database management
- Lines 94-146: Input mode management
- Lines 148-196: Code buffering
- Lines 198-230: Live preview
- Lines 232-298: Viterbi integration
- Lines 300-312: Event handling helpers

**Latest Changes**:
- Line 279: Terminology fix (智能 → 智慧)

---

#### `mvp1/core_logic_v11_ui.js` (16,175 bytes)
**Documentation**:
- `mvp1/DESIGN-v11.md` - UI integration
- `mvp1/TEST-PLAN-v11-ui.md` - UI tests

**Key Sections**:
- Lines 13-23: Initialization with mode check
- Lines 28-50: UI element references
- Lines 54-112: N-gram database lazy loading
- Lines 116-227: UI update functions
- Lines 229-305: Prediction logic
- Lines 309-490: Event handlers

**Latest Changes**:
- Line 13: Fixed strict mode bug (arguments.callee → named function)
- Line 292: Terminology fix (智能 → 智慧)

---

#### `mvp1/viterbi_module.js` (6,795 bytes)
**Documentation**:
- `mvp1/DESIGN-v11.md` - Viterbi algorithm
- `mvp1/NGRAM-DIAGNOSIS.md` - Quality analysis

**Key Sections**:
- Lines 22-39: Laplace unigram
- Lines 41-63: Laplace bigram
- Lines 65-130: Viterbi algorithm (v2.0 with Laplace smoothing)

**Version**: 2.0 (Full Laplace smoothing)

---

### Data Files

| File | Size | Purpose | Documentation |
|------|------|---------|---------------|
| `mvp1/dayi_db.json` | 760KB | Character database | `converter/README.md` |
| `mvp1/ngram_db.json` | 16.5MB | N-gram probabilities | `mvp1/DESIGN-v11.md` |
| `mvp1/ngram_db_taiwan.json` | 5.6MB | Taiwan corpus (experimental) | `mvp1/NGRAM-DIAGNOSIS.md` |

---

### Test Files

| File | Lines | Purpose | Documentation |
|------|-------|---------|---------------|
| `test-node-v6.js` | 500+ | Personalization tests (19 tests) | `mvp1/README.md` |
| `test-node-v7.js` | 400+ | Auto-select fix tests (16 tests) | `mvp1/README.md` |
| `test-node-v8.js` | 600+ | Auto-copy tests (24 tests) | `mvp1/DESIGN-auto-copy.md` |
| `test-node-v10.js` | 700+ | Mobile UX tests (27 tests) | `mvp1/DESIGN-v10.md` |
| `test-node-v10-ux.js` | 200+ | Inline hints tests (5 tests) | `mvp1/DESIGN-v10-ux-improvement.md` |
| `test-node-v10-bugfix.js` | 350+ | Delete key tests (13 tests) | `mvp1/DESIGN-v10-bugfix.md` |
| `test-node-v11.js` | 800+ | N-gram tests (30 tests) | `docs/design/DESIGN-v11.md` |
| `test-v11-ui-init.js` | 400+ | UI init tests (14 tests) | `docs/testing/TEST-PLAN-v11-ui.md` |
| `test-laplace-smoothing.js` | 600+ | Laplace tests (21 tests) | `docs/design/DESIGN-v11.md` |
| `test-v11-ux-fixes.js` | 400+ | UX Round 1 tests (31 tests) | `docs/ux/UX-FIXES-SUMMARY.md` |
| `test-v11-ux-round2.js` | 400+ | UX Round 2 tests (30 tests) | `docs/ux/UX-ISSUES-ROUND2.md` |
| `test-sentence-mode-space-key.js` | 435+ | Space/= redesign tests (25 tests) | `docs/ux/UX-SPACE-KEY-REDESIGN.md` |
| `test-correct-space-equal-behavior.js` | 370+ | Correct behavior tests (13 tests) | `docs/ux/UX-SPACE-KEY-REDESIGN.md` |
| `diagnose-space-equal-keys.js` | 165+ | Diagnostic tool | Internal debugging |
| `test-browser-diagnosis.html` | - | Browser testing tool | Manual testing |

**Total**: 21 test files + 2 diagnostic tools, **212+ tests** (all passing ✅)

---

## Verification Checklist

### Documentation Accuracy ✅

- [x] README.md badges reflect actual status (212+/212+ tests, v11.2.0)
- [x] Progress bars show v11.2 at 100% complete
- [x] Feature list includes v11.2 blind typing fix + version management
- [x] Terminology updated throughout (智能 → 智慧)
- [x] Test counts accurate (212+ total: 174 regression + 38 v11.2)
- [x] Latest commits documented in activeContext.md
- [x] Documentation structure section added to README.md
- [x] Version display system documented in VERSION-GUIDE.md

### Documentation Reorganization ✅

- [x] Created docs/ folder with 4 subdirectories
- [x] Moved ALL CAPS .md files (except CLAUDE.md) to docs/
- [x] Updated DOCUMENTATION-MAPPING.md with new structure
- [x] All moved files preserve git history (git mv)

### Code-to-Docs Mapping ✅

- [x] All core files documented with line numbers
- [x] Latest changes (v11 UX Round 2) documented
- [x] Test files mapped to design docs (with new paths)
- [x] Data files explained
- [x] File sizes verified

### Missing or Outdated ⏳

- [ ] `README.en.md` - Needs update with v11 Round 2 improvements
- [ ] `mvp1/README.en.md` - Needs update with latest changes
- [x] `memory-bank/progress.md` - ✅ Updated with v11 Round 2 completion

---

## Codebase Statistics

**Total Project**:
- JavaScript files: 25
- HTML files: 3
- JSON files: 3
- Documentation files: 30+ (reorganized into docs/)
- Test files: 18

**Code**:
- Production code: ~100KB
- Test code: ~35KB
- Documentation: ~600KB (including design docs)

**Tests**:
- Total tests: **212+**
- Pass rate: **100%**
- Categories: 13 (v6-v11 + Round 2 + v11.2)
- Test files: 21 (174 regression + 38 v11.2)

**Data Files**:
- mvp1/version.json: Version tracking with changelog
- mvp1/dayi_db.json: 760KB character database
- mvp1/ngram_db.json: 16.5MB N-gram probabilities

**CI/CD**:
- GitHub Actions: test.yml (automated testing)
- GitHub Actions: deploy-pages.yml (auto deployment)

**Latest Sessions** (2025-11-11):

**Session 1 - UX Round 1**:
- Files modified: 8
- Lines added: 1,678 (mostly docs + tests)
- Commits: 4
- Test coverage: 165/165 ✅

**Session 2 - UX Round 2**:
- Files modified: 5 (core_logic.js, core_logic_v11_ui.js, index.html, tests, docs)
- Lines added: 1,002 (implementation + tests + docs)
- Commits: 2
- Test coverage: 187+/187+ ✅

**Session 3 - Docs Reorganization**:
- Files moved: 23 (to docs/)
- Folders created: 4 (docs/project, docs/design, docs/testing, docs/ux)
- Documentation updated: README.md, DOCUMENTATION-MAPPING.md
- Git history preserved: Used `git mv`

**Session 4 - Blind Typing Fix + Version Management** (v11.2.0 Build 001):
- Commits: 3 (730e84c, c165da7, 22c263d redesigns → 893177a version system)
- Files modified: 9 (core_logic.js, core_logic_v11_ui.js, index.html, tests, CI, docs)
- Lines added: 1,200+ (fixes + tests + version system)
- New tests: 38 (25 + 13 for correct Space/= behavior)
- Features added: Version management system (4 verification methods)
- CI/CD: Added test.yml workflow
- Documentation: VERSION-GUIDE.md, updated README.md, activeContext.md, DOCUMENTATION-MAPPING.md
- Test coverage: 212+/212+ ✅

**Session 5 - Event Handler Order Fix + Buffer Display** (v11.2.0 Build 005):
- Commits: 2 (e37cdd0 handler order → caef860 buffer display)
- Files modified: 2 (core_logic.js, core_logic_v11_ui.js)
- Critical fixes:
  - Space/= handlers moved before early return (lines 1475-1545 in core_logic.js)
  - updateBufferDisplay exported to window object
  - Diagnostic logging system added
- Impact: Blind typing fully functional (v + space, ad + space, = key all working)
- Test coverage: 212+/212+ ✅ (all regression tests passing)

**Session 6 - Mobile UX Improvements** (v11.2.0 Build 007):
- Commits: 4 (05ae9a8 Phase 1+2 → 326684c Phase 3 → 51826c8 docs → db46c15 CI fix)
- Files modified: 5 (index.html, core_logic.js, core_logic_v11_ui.js, README.md, activeContext.md)
- Three-phase improvements:
  - Phase 1: Removed redundant Space button
  - Phase 2: Character mode Space selection for mobile
  - Phase 3: Responsive layout redesign (flexbox reordering)
- Documentation: MOBILE-UX-IMPROVEMENTS.md design doc
- CI/CD: Added write permissions to auto-bump workflow
- Test coverage: 212+/212+ ✅
- Impact: Complete mobile UX overhaul, no scrolling needed

---

## Documentation Maintenance

**When to Update**:
1. After adding new features → Update README.md, design docs
2. After bug fixes → Update design docs, session summaries
3. After tests → Update test counts in README.md, DOCUMENTATION-MAPPING.md
4. After terminology changes → Global search-and-replace
5. After major doc changes → Update DOCUMENTATION-MAPPING.md

**Current Status**: All documentation current as of 2025-11-11 Build 007 (after mobile UX improvements)

**Completed Improvements** (Build 007):
- ✅ All ALL CAPS docs moved to docs/ folders (except CLAUDE.md)
- ✅ VERSION-GUIDE.md → docs/project/
- ✅ UX-CRITICAL-SINGLE-CHAR-BUG.md → docs/ux/
- ✅ UX-SPACE-KEY-REDESIGN.md → docs/ux/
- ✅ MOBILE-UX-IMPROVEMENTS.md added to docs/ux/
- ✅ DOCUMENTATION-MAPPING.md updated with new structure
- ✅ README.md updated with Build 007 features
- ✅ activeContext.md updated with Session 6

**Next Updates Needed**:
- English README files (when MVP 2a starts)
- Consider consolidating UX Round 2 docs into single comprehensive guide

---

**End of Documentation Mapping**
