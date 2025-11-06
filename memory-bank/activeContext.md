# Active Context: WebDaYi

**Last Updated**: 2025-11-06
**Current Phase**: Phase 0 - Data Pipeline Setup
**Next Milestone**: MVP 1.0 - Core Engine Validation

## Current Work Focus

### Immediate Priority: Data Pipeline (Phase 0)

We are at the **very beginning** of the implementation. The first technical task is to build the data conversion pipeline that will transform Rime's YAML dictionary into our JSON database format.

**Why this is first**:
- Both MVP 1 and MVP 2a depend on `dayi_db.json`
- Can't validate core logic without data
- One-time setup that unblocks everything else

**Current status**:
- ✅ PRD finalized (PRD.md v1.1)
- ✅ Technical architecture documented (CLAUDE.md)
- ✅ Memory Bank initialized (projectbrief, productContext, systemPatterns, techContext)
- 🔄 **IN PROGRESS**: Setting up converter directory structure
- ⏳ **NEXT**: Implement YAML → JSON converter script

## Recent Changes

### 2025-11-06: Project Initialization
- Created comprehensive PRD (PRD.md)
- Created technical guide for AI assistant (CLAUDE.md)
- Initialized git repository
- Created Memory Bank documentation structure
- Added `dayi2dict.yaml` (Rime source data)

### Documentation Established
All foundational documentation is now in place:
- Project goals and scope clearly defined
- Architecture patterns documented
- Technology choices explained
- Development workflow established

## Next Steps

### Phase 0: Data Pipeline (Current)

#### Step 1: Create Converter Structure ⏳
```bash
mkdir -p converter/raw_data
# Place dayi.dict.yaml in converter/raw_data/
```

**Status**: Setting up directory structure
**Blocker**: None
**ETA**: Immediate (today)

#### Step 2: Implement Converter Script 📋
**File**: `converter/convert.js`

**Requirements**:
1. Read `raw_data/dayi.dict.yaml`
2. Parse YAML format
3. Transform to JSON structure:
   ```json
   {
     "code": [
       { "char": "字", "freq": 80 },
       ...
     ]
   }
   ```
4. Write to `../mvp1/dayi_db.json`

**Approach**:
- Use Node.js with `js-yaml` package
- Skip YAML header/metadata (lines starting with `---`, `...`)
- Parse data lines: `字\tcode\tfreq`
- Group by code, collect all characters with frequencies
- Sort candidates by frequency (descending) during conversion

**Status**: Not started
**Blocker**: None (clear requirements)
**ETA**: 2-4 hours of development

#### Step 3: Validate Converter Output ✅
**Tests to perform**:
1. Check JSON is valid (parse without errors)
2. Verify structure matches spec
3. Spot-check known mappings (e.g., "a" → "大")
4. Confirm frequencies are preserved
5. Verify sorting (highest freq first)

**Status**: Pending converter completion
**Blocker**: Step 2 not complete
**ETA**: 30 minutes after Step 2

### Phase 1: MVP 1.0 - Core Engine (Next)

Once `dayi_db.json` exists, we proceed to MVP 1.

#### Step 4: Create MVP 1 Structure 📋
```bash
mkdir -p mvp1
cd mvp1
touch index.html core_logic.js style.css
# dayi_db.json already created by converter
```

#### Step 5: Implement Static Webpage 📋
**Files to create**:

1. **index.html**: UI structure
   - Input box for typing Dàyì codes
   - Candidate area for displaying results
   - Output buffer (textarea) for composed text
   - Copy button

2. **core_logic.js**: Core engine
   - `loadDatabase()`: Fetch and parse `dayi_db.json` into Map
   - `handleInput()`: Listen to input events, query Map
   - `sortCandidates()`: Sort by frequency
   - `renderCandidates()`: Update DOM with results
   - `handleSelection()`: Respond to number keys (1-9)
   - `handleCopy()`: Copy buffer to clipboard

3. **style.css**: Basic styling
   - Clean, minimal interface
   - Clear visual hierarchy
   - Readable candidate list

**Status**: Not started
**Blocker**: Need dayi_db.json from Step 2
**ETA**: 4-6 hours of development

#### Step 6: Manual Testing & Validation ✅
**Test cases**:
1. Type "4jp" → See "易", "義" candidates
2. Type "a" → See "大"
3. Press "1" → "易" appears in output buffer
4. Type multiple characters → All appear in buffer
5. Click "Copy" → Clipboard contains full buffer text

**Success criteria**:
- 100% accuracy compared to Rime dictionary
- Can compose 100-character paragraph in <3 minutes
- No errors in browser console

**Status**: Pending Step 5 completion
**Blocker**: MVP 1 implementation not complete
**ETA**: 1 hour of testing

### Phase 2: MVP 2a - Browser Plugin (Future)

Not starting until MVP 1 is fully validated.

**Planned steps**:
1. Create `mvp2a-plugin/` directory structure
2. Write `manifest.json` (Manifest V3)
3. Refactor `core_logic.js` into reusable module
4. Implement `background.js` (Service Worker)
5. Implement `content.js` (DOM injection)
6. Test in Gmail, Google Docs, Notion
7. Package and prepare for Chrome Web Store

**Status**: Not started (correctly sequenced)
**Blocker**: MVP 1 validation required first
**ETA**: After MVP 1 complete (~1-2 weeks)

## Active Decisions & Considerations

### Decision 1: Converter Language (Node.js vs Python)

**Options**:
1. **Node.js** with `js-yaml`
   - Pro: Same language as main project (JavaScript)
   - Pro: No context switching for developer
   - Pro: Can share code patterns if needed
   - Con: One extra dependency

2. **Python** with `PyYAML`
   - Pro: Often better for data processing scripts
   - Pro: Might be more familiar for some developers
   - Con: Different ecosystem from main project

**Recommendation**: **Node.js**
**Rationale**: Consistency with project language, simpler mental model
**Status**: ✅ Decided (use Node.js)

### Decision 2: Where to Place dayi.dict.yaml?

**Current state**: File exists as `dayi2dict.yaml` in root directory

**Options**:
1. Keep in root (current)
2. Move to `converter/raw_data/`
3. Fetch from Rime GitHub on-demand

**Recommendation**: **Move to `converter/raw_data/`**
**Rationale**:
- Cleaner project structure
- Clear separation: raw data vs processed data
- Follows documented architecture in CLAUDE.md
- Easy to update source data in future

**Status**: ⏳ Should be done in Step 1
**Action**: `mv dayi2dict.yaml converter/raw_data/dayi.dict.yaml`

### Decision 3: Error Handling Strategy for Converter

**Question**: How robust should converter error handling be?

**Context**: This is a one-time script, not production code

**Approach**:
- ✅ Validate file exists before reading
- ✅ Catch YAML parse errors with clear messages
- ✅ Warn if unexpected format encountered
- ✅ Validate JSON output is valid
- ❌ Don't need extensive input sanitization (trusted source)
- ❌ Don't need retry logic (manual re-run is fine)

**Status**: ✅ Decided (pragmatic error handling)

### Decision 4: MVP 1 UI Design Complexity

**Question**: How polished should MVP 1 interface be?

**Context**: MVP 1 is primarily for developer validation

**Approach**:
- ✅ Functional and clear
- ✅ Readable fonts and spacing
- ✅ Obvious what each element does
- ❌ Don't spend time on aesthetics
- ❌ Don't need responsive design
- ❌ Don't need animations

**Rationale**:
- Goal is to validate logic, not impress users
- Will not be shown to end users
- Time better spent on MVP 2a polish

**Status**: ✅ Decided (minimal but functional)

### Consideration 5: Testing Strategy for MVP 1

**Question**: Should we write automated tests?

**Analysis**:
- Pro: Catch regressions
- Pro: Document expected behavior
- Con: Setup overhead (test framework, etc.)
- Con: MVP is throwaway validation code
- Con: Visual/interactive testing needed anyway

**Decision**: **Manual testing only for MVP 1**
**Rationale**:
- Automated tests add complexity without enough benefit
- Core logic will be tested again in MVP 2a
- Can add tests later if needed

**Status**: ✅ Decided (defer automated testing)

## Known Issues & Blockers

### Current Blockers

**None** - We have clear path forward

### Potential Future Blockers

1. **Rime Dictionary Format Changes**
   - **Risk**: Low (format is stable)
   - **Mitigation**: Document expected format, add validation
   - **Impact**: Would only affect converter (one-time fix)

2. **Browser API Deprecations**
   - **Risk**: Medium (`document.execCommand` already deprecated)
   - **Mitigation**: Use with fallbacks, monitor Chrome updates
   - **Impact**: May need refactor in future (not MVP blocker)

3. **Chrome Web Store Review**
   - **Risk**: Medium (manual review can reject)
   - **Mitigation**: Follow all guidelines, clear description
   - **Impact**: Would delay public release (not MVP blocker)

### Technical Debt Tracking

**Intentional Debt** (will address in MVP 2a+):
- No N-gram support
- No personal dictionary
- No cloud sync
- No context awareness

**Unintentional Debt** (monitor):
- None yet (project just starting)

## Environment & Setup Status

### Development Environment
- ✅ Git repository initialized
- ✅ Project structure defined
- ✅ Documentation complete
- ⏳ Converter directory to be created
- ⏳ MVP 1 directory to be created
- ❌ MVP 2a directory not needed yet

### Dependencies
- ✅ Node.js available (required for converter)
- ⏳ `js-yaml` to be installed in converter/
- ✅ Chrome browser available (for testing)

### Data Assets
- ✅ Source dictionary available (`dayi2dict.yaml`)
- ⏳ Processed database to be generated (`dayi_db.json`)

## Context for Next Session

**If returning to this project after break**, start here:

1. **Read this file first** to understand current state
2. **Check Phase 0 progress** (data pipeline)
3. **If converter exists**: Verify `dayi_db.json` is generated
4. **If converter doesn't exist**: Start with Step 2 above
5. **Don't skip to MVP 1** until converter is validated

**Key files to check**:
- `converter/convert.js` - Does it exist?
- `mvp1/dayi_db.json` - Does it exist? Is it valid JSON?
- Browser console when opening `mvp1/index.html` - Any errors?

**Quick health check**:
```bash
# Should succeed if Phase 0 complete
cd converter
node convert.js  # Should create ../mvp1/dayi_db.json

# Should succeed if MVP 1 started
cd ../mvp1
file index.html core_logic.js  # Should exist
```

## Communication Notes

**For AI Assistant (Claude)**:
- Always read Memory Bank before starting work
- This file (`activeContext.md`) is most frequently updated
- When in doubt about priorities, refer to "Next Steps" section
- Don't skip phases (pipeline → MVP 1 → MVP 2a)
- Ask clarifying questions rather than guessing implementation details

**For Human Developer**:
- This document should be updated after each major milestone
- Keep "Next Steps" section current (move completed → done, add new steps)
- Update "Recent Changes" with date stamps
- Use "Active Decisions" to document why choices were made
