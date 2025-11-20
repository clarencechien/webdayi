/**
 * WebDayi Lite - App Logic
 */

// State
const state = {
    db: {},
    prefixes: new Set(), // Valid code prefixes
    buffer: '', // Current input code (e.g., 'x', 'xo')
    candidates: [], // Current candidates
    output: '', // Committed text
    page: 0,
    pageSize: 10,
    isEnglishMode: false // English input mode
};

// DOM Elements
const els = {
    status: document.getElementById('status-indicator'),
    composition: document.getElementById('composition-buffer'),
    candidates: document.getElementById('candidate-bar'),
    output: document.getElementById('output-buffer'),
    keyboard: document.getElementById('virtual-keyboard'),
    copyBtn: document.getElementById('copy-btn'),
    clearBtn: document.getElementById('clear-btn')
};

// Keyboard Layout (Dayi 4)
const KEYBOARD_LAYOUT = [
    [
        { code: '1', label: '1', sub: '言' }, { code: '2', label: '2', sub: '牛' }, { code: '3', label: '3', sub: '目' },
        { code: '4', label: '4', sub: '四' }, { code: '5', label: '5', sub: '王' }, { code: '6', label: '6', sub: '車' },
        { code: '7', label: '7', sub: '田' }, { code: '8', label: '8', sub: '八' }, { code: '9', label: '9', sub: '足' },
        { code: '0', label: '0', sub: '金' }
    ],
    [
        { code: 'q', label: 'Q', sub: '石' }, { code: 'w', label: 'W', sub: '山' }, { code: 'e', label: 'E', sub: '一' },
        { code: 'r', label: 'R', sub: '工' }, { code: 't', label: 'T', sub: '糸' }, { code: 'y', label: 'Y', sub: '火' },
        { code: 'u', label: 'U', sub: '艸' }, { code: 'i', label: 'I', sub: '木' }, { code: 'o', label: 'O', sub: '口' },
        { code: 'p', label: 'P', sub: '耳' }
    ],
    [
        { code: 'a', label: 'A', sub: '人' }, { code: 's', label: 'S', sub: '革' }, { code: 'd', label: 'D', sub: '日' },
        { code: 'f', label: 'F', sub: '土' }, { code: 'g', label: 'G', sub: '手' }, { code: 'h', label: 'H', sub: '鳥' },
        { code: 'j', label: 'J', sub: '月' }, { code: 'k', label: 'K', sub: '立' }, { code: 'l', label: 'L', sub: '女' },
        { code: ';', label: ';', sub: '虫' }
    ],
    [
        { code: 'Shift', label: '⇧', type: 'special', action: 'toggleEnglish' },
        { code: 'z', label: 'Z', sub: '心' }, { code: 'x', label: 'X', sub: '水' }, { code: 'c', label: 'C', sub: '鹿' },
        { code: 'v', label: 'V', sub: '禾' }, { code: 'b', label: 'B', sub: '馬' }, { code: 'n', label: 'N', sub: '魚' },
        { code: 'm', label: 'M', sub: '雨' },
        { code: 'Backspace', label: '⌫', type: 'special', action: 'backspace' }
    ],
    [
        { code: 'Space', label: 'Space', type: 'special', action: 'space', width: 'wide' },
        { code: ',', label: ',', sub: '力' },
        { code: '.', label: '.', sub: '舟' },
        { code: '/', label: '/', sub: '竹' }
    ]
];

// Initialization
async function init() {
    initTheme(); // Load settings first
    setupEventListeners();
    renderKeyboard();
    setupMenuListeners();
    await loadDatabase();
}

// Theme & Settings Logic
function initTheme() {
    // Default keyboard state: Hidden on larger screens (laptops/desktops), Visible on mobile
    const isLargeScreen = window.innerWidth >= 768;

    const defaults = {
        focusMode: false,
        autoCopy: false,
        theme: 'dark',
        fontScale: 1.0,
        showKeyboard: !isLargeScreen
    };

    // Load settings
    const savedSettings = localStorage.getItem('webdayi-lite-settings');
    if (savedSettings) {
        // Merge defaults with saved settings to ensure new keys exist
        state.settings = { ...defaults, ...JSON.parse(savedSettings) };
    } else {
        state.settings = defaults;
    }

    applySettings();
}

function applySettings() {
    // Theme
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    updateToggleStatus('toggle-theme', state.settings.theme === 'dark' ? 'ON' : 'OFF');

    // Focus Mode
    if (state.settings.focusMode) {
        document.body.classList.add('focus-mode');
        updateToggleStatus('toggle-focus', 'ON');
    } else {
        document.body.classList.remove('focus-mode');
        updateToggleStatus('toggle-focus', 'OFF');
    }

    // Auto Copy
    updateToggleStatus('toggle-autocopy', state.settings.autoCopy ? 'ON' : 'OFF');

    // Virtual Keyboard
    if (state.settings.showKeyboard) {
        document.body.classList.remove('hide-keyboard');
        updateToggleStatus('toggle-keyboard', 'ON');
    } else {
        document.body.classList.add('hide-keyboard');
        updateToggleStatus('toggle-keyboard', 'OFF');
    }

    // Font Scale
    document.documentElement.style.setProperty('--font-scale', state.settings.fontScale);
    const fontDisplay = document.getElementById('font-size-display');
    if (fontDisplay) {
        fontDisplay.textContent = `${Math.round(state.settings.fontScale * 100)}%`;
    }

    saveSettings();
}

function updateToggleStatus(id, status) {
    const el = document.getElementById(id);
    if (el) {
        const statusEl = el.querySelector('.toggle-status');
        if (statusEl) statusEl.textContent = status;
        if (status === 'ON') el.classList.add('active');
        else el.classList.remove('active');
    }
}

function saveSettings() {
    localStorage.setItem('webdayi-lite-settings', JSON.stringify(state.settings));
}

function setupMenuListeners() {
    const fab = document.getElementById('menu-fab');
    const panel = document.getElementById('menu-panel');

    if (fab && panel) {
        fab.addEventListener('click', () => {
            panel.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !fab.contains(e.target)) {
                panel.classList.add('hidden');
            }
        });

        document.getElementById('toggle-focus').addEventListener('click', () => {
            state.settings.focusMode = !state.settings.focusMode;
            applySettings();
        });

        document.getElementById('toggle-autocopy').addEventListener('click', () => {
            state.settings.autoCopy = !state.settings.autoCopy;
            applySettings();
        });

        document.getElementById('toggle-theme').addEventListener('click', () => {
            state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
            applySettings();
        });

        document.getElementById('toggle-keyboard').addEventListener('click', () => {
            state.settings.showKeyboard = !state.settings.showKeyboard;
            applySettings();
        });

        // Font Size
        document.getElementById('font-decrease').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent menu close
            if (state.settings.fontScale > 0.5) {
                state.settings.fontScale -= 0.1;
                applySettings();
            }
        });

        document.getElementById('font-increase').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent menu close
            if (state.settings.fontScale < 2.0) {
                state.settings.fontScale += 0.1;
                applySettings();
            }
        });
    }
}

// Load Data
async function loadDatabase() {
    try {
        els.status.textContent = 'Loading Data...';
        const response = await fetch('data/dayi_db.json');
        if (!response.ok) throw new Error('Failed to load database');
        state.db = await response.json();

        // Build prefix set
        els.status.textContent = 'Building Index...';
        const keys = Object.keys(state.db);
        keys.forEach(key => {
            for (let i = 1; i <= key.length; i++) {
                state.prefixes.add(key.substring(0, i));
            }
        });

        els.status.textContent = 'Ready';
        els.status.style.color = 'var(--primary)';
    } catch (error) {
        console.error(error);
        els.status.textContent = 'Error Loading Data';
        els.status.style.color = 'var(--danger)';
    }
}

// Virtual Keyboard Rendering
function renderKeyboard() {
    const container = els.keyboard;
    container.innerHTML = '';

    KEYBOARD_LAYOUT.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';

        // Trapezoid effect for Row 3 (z-row)
        if (rowIndex === 3) {
            rowDiv.classList.add('row-trapezoid');
        }

        row.forEach(key => {
            let btn;
            if (key.type === 'special') {
                btn = document.createElement('button');
                btn.className = `key key-special ${key.width === 'wide' ? 'key-space' : ''}`;
                if (key.code === 'Shift') btn.id = 'key-shift';
                btn.textContent = key.label;

                if (key.action === 'toggleEnglish') {
                    btn.addEventListener('click', toggleEnglishMode);
                } else if (key.action === 'backspace') {
                    btn.addEventListener('click', handleBackspace);
                } else if (key.action === 'space') {
                    btn.addEventListener('click', handleSpace);
                }
            } else {
                btn = document.createElement('button');
                btn.className = 'key';
                btn.dataset.code = key.code;
                btn.innerHTML = `
                    <span>${key.label}</span>
                    <span class="key-sub">${key.sub}</span>
                `;
                btn.addEventListener('click', () => handleInput(key.code));
            }
            rowDiv.appendChild(btn);
        });
        container.appendChild(rowDiv);
    });
}

function createSpecialKey(label, code, action, isSpace = false) {
    const btn = document.createElement('button');
    btn.className = `key key-special ${isSpace ? 'key-space' : ''}`;
    btn.textContent = label;
    btn.addEventListener('click', action);
    return btn;
}

// Event Listeners
function setupEventListeners() {
    // Physical Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // If candidates are present, intercept selection keys
        if (state.candidates.length > 0) {
            const selectionKeys = [' ', "'", '[', ']', '-', '\\', '='];
            if (selectionKeys.includes(e.key)) {
                handleInput(e.key);
                e.preventDefault();
                return;
            }
        }

        if (e.key === 'Backspace') {
            handleBackspace();
            e.preventDefault();
        } else if (e.key === 'Enter') {
            handleEnter();
            e.preventDefault();
        } else if (e.key === ' ') {
            handleSpace();
            e.preventDefault();
        } else if (e.key === 'Shift') {
            toggleEnglishMode();
            // Don't prevent default for Shift, it might be needed for other things, 
            // but here we just want the toggle action. 
            // Actually, preventing default on Shift is usually fine in this context 
            // unless we are typing a capital letter.
            // Wait, if user holds Shift to type Capital, we don't want to toggle mode on every key repeat?
            // The request is "press shift to toggle". Usually this means "press and release shift alone".
            // But for simplicity, let's just toggle on down.
            // However, if they are typing "A" (Shift+a), we don't want to toggle mode.
            // Standard IME behavior: Shift toggles mode.
            // Let's try just toggling.
        } else if (e.key.length === 1) {
            const key = e.key.toLowerCase();
            // Allow all keys to pass to handleInput, it will filter valid ones
            handleInput(key);
            e.preventDefault();
        }
    });

    // Copy Button
    els.copyBtn.addEventListener('click', () => {
        if (state.output) {
            navigator.clipboard.writeText(state.output).then(() => {
                const originalText = els.copyBtn.innerHTML;
                els.copyBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Copied';
                setTimeout(() => {
                    els.copyBtn.innerHTML = originalText;
                }, 2000);
            });
        }
    });

    // Clear Button
    els.clearBtn.addEventListener('click', () => {
        state.output = '';
        state.buffer = '';
        updateOutput();
        updateComposition();
    });
}

// English Mode Toggle
function toggleEnglishMode() {
    triggerHaptic();
    state.isEnglishMode = !state.isEnglishMode;
    const shiftBtn = document.getElementById('key-shift');
    if (shiftBtn) {
        if (state.isEnglishMode) {
            shiftBtn.classList.add('active');
        } else {
            shiftBtn.classList.remove('active');
        }
    }

    // Clear buffer when switching modes
    state.buffer = '';
    updateComposition();
    state.candidates = [];
    renderCandidates();
}

// Input Handling
function handleInput(key) {
    triggerHaptic();
    // English Mode Logic
    if (state.isEnglishMode) {
        state.output += key;
        updateOutput();
        return;
    }

    // Normal Dayi Logic
    // Check if key is valid Dayi character (a-z, 0-9, etc.) OR a selection key
    // We allow all keys defined in the layout plus standard keyboard inputs
    // Added: ' [ ] - \ (selection keys) and Space
    const validKeys = /^[a-z0-9,./;'\[\]\-\\ ]$/;
    if (!validKeys.test(key)) return;

    // If we have candidates, number keys select candidates
    if (state.candidates.length > 0) {
        // ... (existing candidate selection logic)
        // But wait, number keys are also Dayi roots.
        // Standard Dayi: If candidates are open, numbers select.
        // If buffer is empty, numbers are roots.
        // Logic below handles this via state.candidates check
    }

    // ... rest of handleInput

    // 1. Candidate Selection (if candidates exist)
    if (state.candidates.length > 0) {
        // Check if it extends the current code (Priority: Input > Selection)
        const nextBuffer = state.buffer + key;
        // Only treat as input if it forms a valid prefix AND we haven't reached limit
        // Exception: Space is always selection/commit, never input (unless defined in DB?)
        // In Dayi, Space is not a root.
        const isInput = state.buffer.length < 4 && state.prefixes.has(nextBuffer);

        if (isInput) {
            // Valid continuation, let it fall through to append to buffer
        } else {
            // Map selection keys
            const selectionMap = {
                ' ': 0, "'": 1, '[': 2, ']': 3, '-': 4, '\\': 5,
                '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
                '6': 5, '7': 6, '8': 7, '9': 8, '0': 9
            };

            if (key in selectionMap) {
                selectCandidate(selectionMap[key]);
                return;
            }

            // Not a valid continuation AND not a selection key
            // Commit first candidate, then process key
            selectCandidate(0);
            // Fall through to process key as new input
        }
    }

    // 2. Buffer Limit (Dayi max 4 codes)
    if (state.buffer.length >= 4) {
        return; // Ignore input if buffer full
    }

    // 3. Append to buffer
    state.buffer += key;
    updateComposition();

    // 4. Check for candidates
    // lookupCandidates() is handled by updateComposition()
}


function nextPage() {
    const totalPages = Math.ceil(state.candidates.length / state.pageSize);
    if (totalPages > 1) {
        state.page = (state.page + 1) % totalPages;
        renderCandidates();
    }
}

function handleBackspace() {
    triggerHaptic();
    if (state.buffer.length > 0) {
        state.buffer = state.buffer.slice(0, -1);
        state.page = 0; // Reset page on edit
        updateComposition();
    } else if (state.output.length > 0) {
        state.output = state.output.slice(0, -1);
        updateOutput();
    }
}

function handleSpace() {
    triggerHaptic();
    if (state.candidates.length > 0) {
        selectCandidate(state.page * state.pageSize + 0); // Select first candidate
    } else {
        // If buffer empty, add space? Or ignore?
        // Standard: if buffer empty, add space
        if (state.buffer.length === 0) {
            state.output += ' ';
            updateOutput();
        }
    }
}

function handleEnter() {
    triggerHaptic();
    if (state.buffer.length > 0) {
        // Commit buffer as is (if needed, or just clear)
        // Standard behavior: clear buffer
        state.buffer = '';
        state.candidates = [];
        state.page = 0;
        updateComposition();
        renderCandidates();
    } else {
        state.output += '\n';
        updateOutput();
    }
}

// Logic
function updateComposition() {
    els.composition.textContent = state.buffer;
    state.page = 0; // Reset page on new input

    if (state.buffer.length === 0) {
        state.candidates = [];
        renderCandidates();
        return;
    }

    // Query DB
    const candidates = state.db[state.buffer] || [];
    state.candidates = candidates;
    renderCandidates();
}

function renderCandidates() {
    els.candidates.innerHTML = '';

    if (state.candidates.length === 0) {
        if (state.buffer.length > 0) {
            els.candidates.innerHTML = '<div class="placeholder">No candidates</div>';
        } else {
            els.candidates.innerHTML = '<div class="placeholder">請輸入大易碼...</div>';
        }
        return;
    }

    const start = state.page * state.pageSize;
    const end = start + state.pageSize;
    const pageCandidates = state.candidates.slice(start, end);

    // Selection keys mapping for display
    const selectionKeys = ['Space', "'", '[', ']', '-', '\\', '7', '8', '9', '0'];

    pageCandidates.forEach((cand, index) => {
        const div = document.createElement('div');
        div.className = 'candidate-item';

        // Get display key
        let displayKey = '';
        if (index < selectionKeys.length) {
            displayKey = selectionKeys[index];
        } else {
            displayKey = (index + 1) % 10; // Fallback
        }

        // Special handling for Space symbol if desired, or just text
        if (displayKey === 'Space') displayKey = '␣';

        div.innerHTML = `
            <span class="candidate-index">${displayKey}</span>
            <span class="candidate-char">${cand.char}</span>
        `;
        div.addEventListener('click', () => selectCandidate(start + index));
        els.candidates.appendChild(div);
    });

    // Add pagination indicator if needed
    if (state.candidates.length > state.pageSize) {
        const pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        pageInfo.style.width = '100%';
        pageInfo.style.textAlign = 'center';
        pageInfo.style.fontSize = '0.8rem';
        pageInfo.style.color = 'var(--text-muted)';
        pageInfo.style.marginTop = '4px';
        pageInfo.textContent = `${state.page + 1}/${Math.ceil(state.candidates.length / state.pageSize)} (Press = for next)`;
        els.candidates.appendChild(pageInfo);
    }
}

function selectCandidate(index) {
    // Adjust index for pagination if selecting by number key (0-9)
    // But wait, selectCandidate is called with absolute index from click
    // OR relative index from number keys?
    // Let's standardize: selectCandidate takes ABSOLUTE index in state.candidates

    // If coming from number key (0-9), it refers to the CURRENT PAGE
    // We need to handle that in handleInput or here.
    // Let's handle it in handleInput/callers to pass absolute index?
    // No, easier to handle "selection by visible slot" logic.

    // Actually, the previous logic passed 0-9.
    // If we are on page 1, index 0 is actually start + 0.

    // Let's refactor selectCandidate to take "visible index" and convert?
    // Or just pass absolute index.

    // In handleInput:
    // const index = key === '0' ? 9 : parseInt(key) - 1;
    // This is 0-9 relative to page.
    // So: selectCandidate(state.page * state.pageSize + index)

    // But wait, the selection keys (Space, ', etc) map to 0, 1, 2... relative to page.

    // So let's update selectCandidate to accept absolute index, 
    // and update call sites to calculate it.

    if (index >= 0 && index < state.candidates.length) {
        triggerHaptic();
        const char = state.candidates[index].char;
        state.output += char;
        state.buffer = '';
        state.page = 0;
        updateComposition();
        updateOutput();

        // Auto Copy
        if (state.settings && state.settings.autoCopy) {
            navigator.clipboard.writeText(state.output).then(() => {
                showToast();
            }).catch(err => console.error('Copy failed', err));
        }
    }
}

function showToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 1500);
    }
}

function updateOutput() {
    els.output.value = state.output;
    els.output.scrollTop = els.output.scrollHeight;
}

// Haptic Feedback
function triggerHaptic() {
    // Only on mobile/touch devices usually, but navigator.vibrate works if hardware supports it
    if (navigator.vibrate) {
        navigator.vibrate(10); // Light vibration
    }
}

// Start
init();
