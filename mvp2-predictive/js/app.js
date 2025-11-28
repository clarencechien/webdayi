// Global State
const state = {
    buffer: '',
    output: '',
    // Pagination
    page: 0,
    pageSize: 8, // Limit to 8 items as requested
    candidates: [],
    dbs: { dayi: {}, zhuyin: {} },
    prefixes: { dayi: new Set(), zhuyin: new Set() },
    db: {}, // Current DB
    validPrefixes: new Set(), // Current Prefixes
    currentIM: 'dayi', // 'dayi', 'zhuyin', 'english'
    lastChineseIM: 'dayi', // Remember last used Chinese IM
    lastAltPressTime: 0,
    lastCtrlPressTime: 0,
    shiftKeyUsed: false,
    isMiniMode: false,
    settings: {},
    predictionEngine: null,
    userHistory: null,
    phantomText: null,
    lastConfirmedChar: null
};

// DOM Elements
const els = {
    composition: document.getElementById('composition-buffer'),
    candidates: document.getElementById('candidate-bar'),
    status: document.getElementById('status-indicator'),
    output: document.getElementById('output-buffer'),
    keyboard: document.getElementById('virtual-keyboard'),
    copyBtn: document.getElementById('copy-btn'),
    clearBtn: document.getElementById('clear-btn'),
    miniModeBtn: document.getElementById('btn-mini-mode'),
    miniImStatus: document.getElementById('mini-im-status'),
    miniUi: document.getElementById('mini-ui'),
    miniOutput: document.getElementById('mini-output'),
    miniComposition: document.getElementById('mini-composition'),
    miniCandidates: document.getElementById('mini-candidates')
};

// Keyboard Layout (Dayi 4)
const KEYBOARD_LAYOUT = [
    // Row 0: Numbers
    [
        { label: '1', sub: '言', code: '1' }, { label: '2', sub: '牛', code: '2' }, { label: '3', sub: '目', code: '3' },
        { label: '4', sub: '四', code: '4' }, { label: '5', sub: '王', code: '5' }, { label: '6', sub: '車', code: '6' },
        { label: '7', sub: '田', code: '7' }, { label: '8', sub: '八', code: '8' }, { label: '9', sub: '足', code: '9' },
        { label: '0', sub: '金', code: '0' }
    ],
    // Row 1: Q-P
    [
        { label: 'Q', sub: '石', code: 'q' }, { label: 'W', sub: '山', code: 'w' }, { label: 'E', sub: '一', code: 'e' },
        { label: 'R', sub: '工', code: 'r' }, { label: 'T', sub: '糸', code: 't' }, { label: 'Y', sub: '火', code: 'y' },
        { label: 'U', sub: '艸', code: 'u' }, { label: 'I', sub: '木', code: 'i' }, { label: 'O', sub: '口', code: 'o' },
        { label: 'P', sub: '耳', code: 'p' }
    ],
    // Row 2: A-L
    [
        { label: 'A', sub: '人', code: 'a' }, { label: 'S', sub: '革', code: 's' }, { label: 'D', sub: '日', code: 'd' },
        { label: 'F', sub: '土', code: 'f' }, { label: 'G', sub: '手', code: 'g' }, { label: 'H', sub: '鳥', code: 'h' },
        { label: 'J', sub: '月', code: 'j' }, { label: 'K', sub: '立', code: 'k' }, { label: 'L', sub: '女', code: 'l' },
        { label: ';', sub: '虫', code: ';' }
    ],
    // Row 3: Bottom (Z-M, Comma, Dot, Slash)
    [
        { label: '', icon: 'arrow_upward', code: 'ShiftLeft' }, // Icon only
        { label: 'Z', sub: '心', code: 'z' }, { label: 'X', sub: '水', code: 'x' }, { label: 'C', sub: '鹿', code: 'c' },
        { label: 'V', sub: '禾', code: 'v' }, { label: 'B', sub: '馬', code: 'b' }, { label: 'N', sub: '魚', code: 'n' },
        { label: 'M', sub: '雨', code: 'm' },
        { label: '', icon: 'backspace', code: 'Backspace' } // Icon only
    ],
    // Row 4: Space Row (Globe, Tab, Space, Punctuation)
    [
        { label: '', icon: 'language', code: 'SwitchIM' }, // Icon only
        { label: 'Tab', code: 'Tab' },
        { label: 'Space', code: 'Space' },
        { label: ',', sub: '力', code: ',' }, { label: '.', sub: '舟', code: '.' }, { label: '/', sub: '竹', code: '/' }
    ]
];

// Zhuyin Mapping (Standard Daqian)
const ZHUYIN_MAPPING = {
    '1': 'ㄅ', '2': 'ㄉ', '3': 'ˇ', '4': 'ˋ', '5': 'ㄓ', '6': 'ˊ', '7': '˙', '8': 'ㄚ', '9': 'ㄞ', '0': 'ㄢ',
    'q': 'ㄆ', 'w': 'ㄊ', 'e': 'ㄍ', 'r': 'ㄐ', 't': 'ㄔ', 'y': 'ㄗ', 'u': 'ㄧ', 'i': 'ㄛ', 'o': 'ㄟ', 'p': 'ㄣ',
    'a': 'ㄇ', 's': 'ㄋ', 'd': 'ㄎ', 'f': 'ㄑ', 'g': 'ㄕ', 'h': 'ㄘ', 'j': 'ㄨ', 'k': 'ㄜ', 'l': 'ㄠ', ';': 'ㄤ',
    'z': 'ㄈ', 'x': 'ㄌ', 'c': 'ㄏ', 'v': 'ㄒ', 'b': 'ㄖ', 'n': 'ㄙ', 'm': 'ㄩ',
    ',': 'ㄝ', '.': 'ㄡ', '/': 'ㄥ', '-': 'ㄦ'
};

// Initialization
async function init() {
    initTheme(); // Load settings first
    setupEventListeners();
    renderKeyboard();
    setupMenuListeners();
    await loadDatabase();

    // Mobile: Auto-open keyboard AND Default to Focus Mode
    if (window.innerWidth <= 768) {
        // Default to Focus Mode
        state.settings.focusMode = true;
        applySettings();

        const keyboard = document.getElementById('virtual-keyboard');
        if (keyboard) {
            keyboard.classList.remove('hidden');
            // Adjust main container margin if needed
            const mainContainer = document.querySelector('.app-container');
            if (mainContainer) mainContainer.style.marginBottom = 'var(--keyboard-height)';
        }
    }
}

// Theme & Settings Logic
function initTheme() {
    const isLargeScreen = window.innerWidth >= 768;
    const defaults = {
        focusMode: false,
        autoCopy: false,
        theme: 'dark',
        fontScale: 1.0,
        showKeyboard: !isLargeScreen,
        maxCodeLength: 4 // Default to 4-code mode
    };

    const savedSettings = localStorage.getItem('webdayi-lite-settings');
    if (savedSettings) {
        state.settings = { ...defaults, ...JSON.parse(savedSettings) };
    } else {
        state.settings = defaults;
    }

    applySettings();
}

function applySettings() {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    updateToggleStatus('toggle-theme', state.settings.theme === 'dark' ? 'ON' : 'OFF');

    if (state.settings.focusMode) {
        document.body.classList.add('focus-mode');
        updateToggleStatus('toggle-focus', 'ON');
    } else {
        document.body.classList.remove('focus-mode');
        updateToggleStatus('toggle-focus', 'OFF');
    }

    updateToggleStatus('toggle-autocopy', state.settings.autoCopy ? 'ON' : 'OFF');

    if (state.settings.showKeyboard) {
        document.body.classList.remove('hide-keyboard');
        updateToggleStatus('toggle-keyboard', 'ON');
    } else {
        document.body.classList.add('hide-keyboard');
        updateToggleStatus('toggle-keyboard', 'OFF');
    }

    document.documentElement.style.setProperty('--font-scale', state.settings.fontScale);
    const fontDisplay = document.getElementById('font-size-display');
    if (fontDisplay) {
        fontDisplay.textContent = `${Math.round(state.settings.fontScale * 100)}% `;
    }

    updateToggleStatus('toggle-code-len', state.settings.maxCodeLength === 4 ? '4碼' : '3碼');

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

    els.menuPanel = panel;
    els.menuOverlay = document.getElementById('menu-overlay');
    els.headerMenuBtn = document.getElementById('header-menu-trigger'); // New Header Menu
    const headerThemeBtn = document.getElementById('toggle-theme-header');
    const focusMenuBtn = document.getElementById('focus-menu-trigger'); // New Focus Menu

    if (fab && panel) {
        fab.addEventListener('click', () => {
            panel.classList.toggle('hidden');
        });

        // Header Menu Trigger
        if (els.headerMenuBtn) {
            els.headerMenuBtn.addEventListener('click', () => {
                panel.classList.toggle('hidden');
            });
        }

        // Focus Menu Trigger
        if (focusMenuBtn) {
            focusMenuBtn.addEventListener('click', () => {
                panel.classList.toggle('hidden');
            });
        }

        // Header Theme Toggle
        if (headerThemeBtn) {
            headerThemeBtn.addEventListener('click', () => {
                state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
                applySettings();
            });
        }

        document.addEventListener('click', (e) => {
            // Check if click is outside panel AND outside triggers (FAB + Header Btn + Focus Btn)
            const isOutside = !panel.contains(e.target) &&
                !fab.contains(e.target) &&
                (!els.headerMenuBtn || !els.headerMenuBtn.contains(e.target)) &&
                (!focusMenuBtn || !focusMenuBtn.contains(e.target));

            if (isOutside) {
                panel.classList.add('hidden');
            }
        });

        document.getElementById('toggle-im').addEventListener('click', () => {
            toggleInputMethod();
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

        document.getElementById('toggle-mini').addEventListener('click', () => {
            toggleMiniMode();
        });

        document.getElementById('toggle-code-len').addEventListener('click', () => {
            state.settings.maxCodeLength = state.settings.maxCodeLength === 4 ? 3 : 4;
            applySettings();
            showToast(`Switched to ${state.settings.maxCodeLength} -Code Mode`);
        });

        document.getElementById('font-decrease').addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.settings.fontScale > 0.5) {
                state.settings.fontScale -= 0.1;
                applySettings();
            }
        });

        document.getElementById('font-increase').addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.settings.fontScale < 2.0) {
                state.settings.fontScale += 0.1;
                applySettings();
            }
        });
    }
}

function buildPrefixes(db) {
    const prefixes = new Set();
    Object.keys(db).forEach(key => {
        for (let i = 1; i <= key.length; i++) {
            prefixes.add(key.substring(0, i));
        }
    });
    return prefixes;
}

async function loadDatabase() {
    try {
        els.status.textContent = 'Loading Data...';

        const ts = Date.now();
        const dayiResp = await fetch(`data/dayi_db.json?v=${ts}`);
        state.dbs.dayi = await dayiResp.json();
        state.prefixes.dayi = buildPrefixes(state.dbs.dayi);

        const zhuyinResp = await fetch(`data/zhuyin_db.json?v=${ts}`);
        state.dbs.zhuyin = await zhuyinResp.json();
        state.prefixes.zhuyin = buildPrefixes(state.dbs.zhuyin);

        const bigramResp = await fetch(`data/bigram_lite.json?v=${ts}`);
        const bigramData = await bigramResp.json();

        const freqResp = await fetch(`data/freq_map.json?v=${ts}`);
        const freqMap = await freqResp.json();

        state.userHistory = new UserHistory();

        state.predictionEngine = new PredictionEngine({
            bigramData: bigramData,
            freqMap: freqMap,
            userHistory: state.userHistory
        });
        state.predictionEngine.setDayiMap(state.dbs.dayi);

        state.db = state.dbs.dayi;
        state.validPrefixes = state.prefixes.dayi;

        updateStatus();
        console.log('Data loaded. Dayi codes:', Object.keys(state.dbs.dayi).length);
    } catch (e) {
        console.error('Failed to load data:', e);
        els.candidates.innerHTML = '<div class="placeholder" style="color:var(--danger)">Data Load Error</div>';
        els.status.textContent = 'Error Loading Data';
        els.status.style.color = 'var(--danger)';
    }
}

function renderKeyboard() {
    const container = els.keyboard;
    container.innerHTML = '';

    KEYBOARD_LAYOUT.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';

        if (rowIndex === 3) {
            rowDiv.classList.add('row-trapezoid');
        }

        row.forEach(key => {
            // Create Button
            const btn = document.createElement('button');

            // Determine Class
            if (key.code === 'Space') {
                btn.className = 'key key-special key-space';
                btn.style.flex = '2'; // Space takes 2 units
            } else if (key.code === 'Tab') {
                btn.className = 'key key-special key-tab-bottom';
                btn.style.flex = '1'; // Tab takes 1 unit
            } else if (key.code === 'SwitchIM') {
                btn.className = 'key key-special';
                btn.style.flex = '0 0 48px'; // Fixed width for Globe
            } else if (key.code === 'ShiftLeft' || key.code === 'Backspace') {
                btn.className = 'key key-special';
                btn.style.flex = '0 0 56px'; // Fixed width for modifiers
                if (key.code === 'ShiftLeft') btn.id = 'key-shift';
            } else {
                btn.className = 'key';
                btn.style.flex = '1'; // Standard keys grow evenly
                btn.dataset.code = key.code;
            }

            // Set Content (Icon or Label)
            if (key.icon) {
                btn.innerHTML = `<span class="material-symbols-outlined">${key.icon}</span>`;
            } else {
                // For standard keys, we might have sub-labels
                if (!key.icon && (key.code.length === 1 || key.code === 'Space' || key.code === 'Tab')) {
                    let mainLabel = key.label;
                    let subLabel = '';

                    if (state.currentIM === 'english') {
                        subLabel = '';
                    } else if (state.currentIM === 'zhuyin') {
                        subLabel = ZHUYIN_MAPPING[key.code] || '';
                    } else {
                        subLabel = key.sub || '';
                    }

                    if (key.code === 'Space' || key.code === 'Tab') {
                        btn.textContent = mainLabel;
                    } else {
                        btn.innerHTML = `
                            <div class="key-main">${mainLabel}</div>
                            <div class="key-sub">${subLabel}</div>
                        `;
                    }
                } else {
                    btn.textContent = key.label;
                }
            }

            // Add Event Listeners
            if (key.code === 'SwitchIM') {
                btn.addEventListener('click', () => {
                    if (state.currentIM === 'dayi') switchToIM('zhuyin');
                    else if (state.currentIM === 'zhuyin') switchToIM('english');
                    else switchToIM('dayi');
                });
            } else if (key.code === 'ShiftLeft') {
                btn.addEventListener('click', toggleInputMethod); // Shift toggles IM in this logic? Or shift state? 
                // Wait, Shift usually toggles English/Chinese in PC, but here it might be Shift modifier?
                // The original code had action: 'toggleInputMethod' for Shift.
                btn.addEventListener('click', toggleInputMethod);
            } else if (key.code === 'Backspace') {
                btn.addEventListener('click', handleBackspace);
            } else if (key.code === 'Space') {
                btn.addEventListener('click', handleSpace);
            } else if (key.code === 'Tab') {
                btn.addEventListener('click', handleTab);
            } else {
                // Standard Key
                btn.addEventListener('click', (e) => {
                    handleInput(key.code); // Changed from handleKeyInput to handleInput to match existing functions
                    // Visual feedback
                    const ripple = document.createElement('div');
                    ripple.className = 'ripple';
                    btn.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 600);
                });
            }

            // Touch States
            btn.addEventListener('touchstart', () => btn.classList.add('active-state'), { passive: true });
            btn.addEventListener('touchend', () => setTimeout(() => btn.classList.remove('active-state'), 100));
            btn.addEventListener('mousedown', () => btn.classList.add('active-state'));
            btn.addEventListener('mouseup', () => setTimeout(() => btn.classList.remove('active-state'), 100));
            btn.addEventListener('mouseleave', () => btn.classList.remove('active-state'));

            rowDiv.appendChild(btn);
        });

        container.appendChild(rowDiv);
    });
}

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.repeat) return;

        if (e.key === 'Tab') {
            e.preventDefault();
            if (state.phantomText) {
                // Confirm Phantom Text (Smart Adopt)
                state.output += state.phantomText;

                // Record user habit for the phantom text
                if (state.userHistory) {
                    state.userHistory.recordCommit(state.phantomText);
                }

                state.buffer = '';
                state.candidates = [];
                state.phantomText = null;
                updateComposition();
                renderCandidates();
                updateOutput();
                triggerHaptic();
            }
            return;
        }

        if (e.key === 'Alt') {
            const now = Date.now();
            if (now - state.lastAltPressTime < 300) {
                clearAll();
                triggerVisualFeedback('clear');
                state.lastAltPressTime = 0;
                return;
            }
            state.lastAltPressTime = now;

            // Single Alt: Copy Output
            if (state.output) {
                navigator.clipboard.writeText(state.output).then(() => {
                    triggerVisualFeedback('copy');
                }).catch(err => console.error('Auto-copy failed', err));
            }
            return;
        }

        if (e.ctrlKey || e.altKey || e.metaKey) {
            // Track modifier usage to prevent "Tap" action if used as a modifier
            if (e.ctrlKey) state.ctrlKeyUsed = true;
            return;
        }

        if (state.candidates.length > 0 || state.phantomText) {
            const selectionKeys = ["'", '[', ']', '-', '\\', '='];
            if (state.candidates.length > 0) {
                selectionKeys.push('7', '8', '9', '0');
            }

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
        } else if (e.key === 'Escape' || e.key === 'Delete') {
            if (state.output.length > 0 && state.buffer.length === 0) {
                state.output = '';
                updateOutput();
                triggerVisualFeedback('clear');
                triggerHaptic();
            } else if (state.buffer.length > 0) {
                // Escape clears buffer
                state.buffer = '';
                state.candidates = [];
                state.page = 0;
                updateComposition();
                renderCandidates();
            }
            e.preventDefault();
        } else if (e.key === 'Shift') {
            state.shiftKeyUsed = false;
        } else if (e.key === 'Control') {
            state.ctrlKeyUsed = false;
        } else if (e.key.length === 1) {
            if (e.shiftKey) state.shiftKeyUsed = true;
            if (e.ctrlKey) state.ctrlKeyUsed = true;
            const key = e.key.toLowerCase();
            handleInput(key);
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            if (!state.shiftKeyUsed) {
                if (e.code === 'ShiftLeft') {
                    toggleEnglishChinese();
                } else if (e.code === 'ShiftRight') {
                    toggleDayiZhuyin();
                }
            }
        } else if (e.key === 'Control') {
            if (!state.ctrlKeyUsed) {
                toggleMiniMode();
            }
        }
    });

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

    els.clearBtn.addEventListener('click', clearAll);

    window.addEventListener('focus', () => {
        if (state.isMiniMode && els.miniOutput) {
            setTimeout(() => els.miniOutput.focus(), 50);
        }
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log("PWA Mode Detected - Initializing Mini Mode");
        setTimeout(() => {
            if (!state.isMiniMode) {
                toggleMiniMode();
            }
        }, 100);
    }

    setupMiniMenuListeners();
}

function setupMiniMenuListeners() {
    const miniStatus = document.getElementById('mini-im-status');
    const toolbar = document.getElementById('mini-settings-toolbar');
    const candidates = document.getElementById('mini-candidates');
    const closeBtn = document.getElementById('mini-tool-close');

    if (miniStatus && toolbar && candidates) {
        // Toggle Toolbar
        miniStatus.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = toolbar.classList.contains('hidden');
            if (isHidden) {
                toolbar.classList.remove('hidden');
                candidates.classList.add('hidden');
                updateMiniMenuUI();
            } else {
                toolbar.classList.add('hidden');
                candidates.classList.remove('hidden');
            }
        });

        // Close Toolbar
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toolbar.classList.add('hidden');
                candidates.classList.remove('hidden');
            });
        }

        // IM Switch
        document.getElementById('mini-tool-im')?.addEventListener('click', () => {
            toggleInputMethod();
            updateMiniMenuUI();
        });

        // Code Length Switch
        document.getElementById('mini-tool-code')?.addEventListener('click', () => {
            state.settings.maxCodeLength = state.settings.maxCodeLength === 4 ? 3 : 4;
            applySettings();
            updateMiniMenuUI();
            showToast(`Switched to ${state.settings.maxCodeLength} -Code Mode`);
        });

        // Font Size
        document.getElementById('mini-tool-font-dec')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.settings.fontScale > 0.5) {
                state.settings.fontScale -= 0.1;
                applySettings();
            }
        });

        document.getElementById('mini-tool-font-inc')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.settings.fontScale < 2.0) {
                state.settings.fontScale += 0.1;
                applySettings();
            }
        });
    }
}

function updateMiniMenuUI() {
    const imBtn = document.getElementById('mini-tool-im');
    const codeBtn = document.getElementById('mini-tool-code');

    if (imBtn) {
        imBtn.textContent = state.currentIM === 'dayi' ? 'Dayi' : (state.currentIM === 'zhuyin' ? 'Zhuyin' : 'Eng');
    }

    if (codeBtn) {
        codeBtn.textContent = `${state.settings.maxCodeLength} 碼`;
        if (state.settings.maxCodeLength === 4) {
            codeBtn.style.borderColor = 'var(--primary)';
            codeBtn.style.color = 'var(--primary)';
        } else {
            codeBtn.style.borderColor = 'var(--border-color)';
            codeBtn.style.color = 'var(--text-main)';
        }
    }
}

/**
 * Trigger visual feedback for actions (Copy/Clear)
 * @param {string} type - 'copy' (success/blue) or 'clear' (danger/red)
 */
function triggerVisualFeedback(type) {
    // Check if Mini UI is visible (fallback if state.isMiniMode is out of sync in PWA)
    const isMiniVisible = els.miniUi && (
        state.isMiniMode ||
        getComputedStyle(els.miniUi).display !== 'none' ||
        els.miniUi.offsetParent !== null
    );

    console.log(`Visual Feedback: type = ${type}, isMini = ${isMiniVisible} (state = ${state.isMiniMode})`); // DEBUG

    const isCopy = type === 'copy';

    // CSS Variables
    const colorVar = isCopy ? 'var(--primary)' : 'var(--danger)';
    const message = isCopy ? '已複製' : '已清除';

    if (isMiniVisible && els.miniUi) {
        // Mini Mode: Feedback Overlay
        const overlay = document.getElementById('mini-feedback-overlay');

        if (overlay) {
            // Premium UX: Ultra-subtle feedback
            // 1. Reset transition for instant "on"
            overlay.style.transition = 'none';

            // 2. Apply styles (Fine 1px border + Very soft minimal glow)
            // Inset border 1px + 4px blur for just a hint of glow
            overlay.style.setProperty('box-shadow', `inset 0 0 0 1px ${colorVar}, inset 0 0 4px ${colorVar} `, 'important');
            overlay.style.setProperty('background-color', isCopy ? 'rgba(0, 255, 0, 0.04)' : 'rgba(255, 0, 0, 0.04)', 'important');

            // 3. Force reflow to ensure transition applies
            overlay.offsetHeight;

            // 4. Fade out smoothly
            setTimeout(() => {
                overlay.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                overlay.style.removeProperty('box-shadow');
                overlay.style.removeProperty('background-color');
            }, 50);
        } else {
            console.warn('Feedback overlay not found!');
        }
    } else {
        // Web Mode: Toast + Input Flash
        showToast(message);
        if (els.output) {
            els.output.style.transition = 'background-color 0.15s';
            els.output.style.backgroundColor = isCopy ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)';
            setTimeout(() => els.output.style.backgroundColor = '', 200);
        }
    }
}

function clearAll() {
    state.buffer = '';
    state.candidates = [];
    state.output = '';
    state.page = 0;
    state.phantomText = null;
    updateComposition();
    renderCandidates();
    updateOutput();
    triggerHaptic();
    if (document.hasFocus()) {
        if (state.isMiniMode && els.miniOutput) {
            els.miniOutput.focus();
        } else if (!state.isMiniMode && els.output.offsetParent !== null) {
            els.output.focus();
        }
    }
}

function toggleMiniMode() {
    console.log('Toggling Mini Mode. Current:', state.isMiniMode);
    state.isMiniMode = !state.isMiniMode;
    updateToggleStatus('toggle-mini', state.isMiniMode ? 'ON' : 'OFF');
    const isMini = state.isMiniMode;

    document.body.classList.toggle('mini-mode', isMini);
    document.documentElement.classList.toggle('mini-mode', isMini);

    if (els.miniUi) {
        els.miniUi.classList.toggle('hidden', !isMini);

        if (isMini) {
            els.miniOutput.value = state.output;
            updateComposition();
            setTimeout(() => els.miniOutput.focus(), 50);
        } else {
            els.output.value = state.output;
        }
    }
    console.log('New State:', isMini);
}

function toggleEnglishChinese() {
    triggerHaptic();
    if (state.currentIM === 'english') {
        switchToIM(state.lastChineseIM);
    } else {
        switchToIM('english');
    }
}

function toggleDayiZhuyin() {
    triggerHaptic();
    let targetIM;
    if (state.currentIM === 'dayi') {
        targetIM = 'zhuyin';
    } else if (state.currentIM === 'zhuyin') {
        targetIM = 'dayi';
    } else {
        targetIM = (state.lastChineseIM === 'dayi') ? 'zhuyin' : 'dayi';
    }
    state.lastChineseIM = targetIM;
    switchToIM(targetIM);
}

function switchToIM(im) {
    state.currentIM = im;

    if (im === 'dayi') {
        state.db = state.dbs.dayi;
        state.validPrefixes = state.prefixes.dayi;
        showToast('Switched to Dayi');
    } else if (im === 'zhuyin') {
        state.db = state.dbs.zhuyin;
        state.validPrefixes = state.prefixes.zhuyin;
        showToast('Switched to Zhuyin');
    } else {
        showToast('Switched to English');
    }

    updateStatus();
    updateMenuToggle();
    renderKeyboard();

    state.buffer = '';
    updateComposition();
    state.candidates = [];
    renderCandidates();

    const shiftBtn = document.getElementById('key-shift');
    if (shiftBtn) {
        if (state.currentIM === 'english') {
            shiftBtn.classList.add('active');
        } else {
            shiftBtn.classList.remove('active');
        }
    }
}

function toggleInputMethod() {
    toggleEnglishChinese();
}

function updateStatus() {
    let text = 'Ready';
    let miniText = '易';

    if (state.currentIM === 'dayi') {
        text = 'Ready (Dayi)';
        miniText = '易';
    } else if (state.currentIM === 'zhuyin') {
        text = 'Ready (Zhuyin)';
        miniText = '注';
    } else {
        text = 'Ready (English)';
        miniText = 'Eng';
    }

    if (state.currentIM === 'dayi') {
        text += ` [${state.settings.maxCodeLength}碼]`;
    }

    els.status.textContent = text;
    if (els.miniImStatus) els.miniImStatus.textContent = miniText;

    updateMiniMenuUI();
}

function updateMenuToggle() {
    const menuStatus = document.querySelector('#toggle-im .toggle-status');
    if (menuStatus) {
        menuStatus.textContent = state.currentIM.toUpperCase();
    }
}

function handleInput(key) {
    triggerHaptic();
    if (state.currentIM === 'english') {
        state.output += key;
        updateOutput();
        return;
    }

    const lowerKey = key.toLowerCase();
    const validKeys = /^[a-z0-9,./;'\[\]\-\\ =]$/;
    if (!validKeys.test(lowerKey)) return;

    if (state.candidates.length > 0) {
        const nextBuffer = state.buffer + lowerKey;
        const isInput = state.buffer.length < state.settings.maxCodeLength && state.validPrefixes.has(nextBuffer);

        if (isInput) {
            // Valid continuation
        } else {
            const selectionMap = {
                ' ': 0, "'": 1, '[': 2, ']': 3, '-': 4, '\\': 5,
                '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
                '6': 5, '7': 6, '8': 7, '9': 8, '0': 9
            };

            if (lowerKey === '=') {
                nextPage();
                return;
            }

            if (lowerKey in selectionMap) {
                selectCandidate(selectionMap[lowerKey]);
                return;
            }

            // Invalid key and not a selection key -> Do nothing (or error feedback)
            // Do NOT auto-commit the first candidate, as it confuses the user (e.g., typing 'j' for 'aej' commits 'ae').
            const composition = els.composition;
            if (composition) {
                composition.style.animation = 'none';
                composition.offsetHeight; // Trigger reflow
                composition.style.animation = 'shake 0.3s';
            }
            return;
        }
    }

    if (state.buffer.length >= state.settings.maxCodeLength) {
        return;
    }

    state.buffer += lowerKey;
    updateComposition();

    // Auto-commit if we reached max length
    if (state.buffer.length === state.settings.maxCodeLength) {
        // Only auto-commit if NOT in 4-code mode (User Request: Max 4 requires manual Space)
        if (state.settings.maxCodeLength !== 4 && state.candidates.length === 1) {
            // Only auto-commit if there is no ambiguity (single candidate)
            selectCandidate(0);
        }
        // If multiple candidates OR Max 4 mode, stay and let user select (Space or Keys)
    }
}

function handleBackspace() {
    triggerHaptic();
    if (state.buffer.length > 0) {
        state.buffer = state.buffer.slice(0, -1);
        state.page = 0;
        updateComposition();
    } else if (state.output.length > 0) {
        state.output = state.output.slice(0, -1);
        updateOutput();
    }
}

function handleTab() {
    if (state.phantomText) {
        // Confirm Phantom Text (Smart Adopt)
        state.output += state.phantomText;

        // Record user habit
        if (state.userHistory) {
            state.userHistory.recordCommit(state.phantomText);
        }

        state.buffer = '';
        state.candidates = [];
        state.phantomText = null;
        updateComposition();
        renderCandidates();
        updateOutput();
        triggerHaptic();
    }
}

function handleSpace() {
    triggerHaptic();

    if (state.candidates.length > 0) {
        // Select the first candidate (which might be the phantom/predicted one)
        selectCandidate(state.page * state.pageSize + 0);
    } else {
        if (state.buffer.length === 0) {
            state.output += ' ';
            updateOutput();
        }
    }
}

function confirmPhantom() {
    if (!state.phantomText) return;

    state.output += state.phantomText;
    state.buffer = '';
    state.page = 0;
    state.phantomText = null;
    updateComposition();
    updateOutput();

    if (state.settings.autoCopy) {
        navigator.clipboard.writeText(state.output).catch(err => console.error('Auto-copy failed', err));
    }
}

function handleEnter() {
    triggerHaptic();
    if (state.buffer.length > 0) {
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

function updateComposition() {
    state.page = 0;
    state.phantomText = null; // Reset phantom text state

    if (state.buffer.length === 0) {
        els.composition.textContent = '';
        if (els.miniComposition) els.miniComposition.textContent = '';
        state.candidates = [];
        renderCandidates();
        return;
    }

    if (state.currentIM === 'dayi' && state.predictionEngine) {
        const lastChar = state.output.slice(-1);

        // 1. Get Candidates (Prioritize Exact Matches)
        // The engine now sorts Exact Matches to the top
        const candidates = state.predictionEngine.getCandidates(state.buffer, lastChar);
        state.candidates = candidates;

        // 2. Get Best Prediction (Phantom Text)
        // This is for the Tab key "Smart Adopt"
        const bestPrediction = state.predictionEngine.getBestPrediction(state.buffer, lastChar);

        // 3. Set Phantom Text
        // Condition: Has prediction AND prediction is NOT the top candidate (avoid redundancy)
        if (bestPrediction &&
            state.candidates.length > 0 &&
            bestPrediction.char !== state.candidates[0].char) {
            state.phantomText = bestPrediction.char;
        } else {
            state.phantomText = null;
        }
    } else {
        // Fallback for Zhuyin or other IMs
        let candidates = state.db[state.buffer] || [];
        if (candidates.length > 0 && typeof candidates[0] === 'string') {
            candidates = candidates.map(c => ({ char: c }));
        }
        state.candidates = candidates;
    }

    // 4. Render Composition (Buffer + Phantom)
    let html = state.buffer;
    if (state.phantomText) {
        html += `<span class="phantom-text-display">${state.phantomText}<span style="font-size:0.8em; opacity:0.7;">[Tab]</span></span>`;
    }

    els.composition.innerHTML = html;
    if (els.miniComposition) els.miniComposition.innerHTML = html;

    renderCandidates();
}

function renderCandidates() {
    els.candidates.innerHTML = '';
    if (els.miniCandidates) els.miniCandidates.innerHTML = '';



    if (state.candidates.length === 0) {
        if (state.buffer.length > 0 && !state.phantomText) {
            els.candidates.innerHTML = '<div class="placeholder">無候選字</div>';
            if (els.miniCandidates) els.miniCandidates.innerHTML = '<span class="placeholder">無候選字</span>';
        } else if (state.buffer.length === 0) {
            els.candidates.innerHTML = '<div class="placeholder">請輸入大易碼...</div>';
            if (els.miniCandidates) els.miniCandidates.innerHTML = '<span class="mini-cursor">_</span>';
        }
        return;
    }

    const start = state.page * state.pageSize;
    const end = start + state.pageSize;
    const pageCandidates = state.candidates.slice(start, end);

    pageCandidates.forEach((cand, index) => {
        const selectionKeys = ['Space', "'", '[', ']', '-', '\\', '7', '8', '9', '0'];
        const key = selectionKeys[index];

        const item = document.createElement('div');
        item.className = 'candidate-item';
        if (cand.isPhantom) {
            item.classList.add('phantom-candidate');
            item.style.borderColor = 'var(--primary)';
            item.style.backgroundColor = 'rgba(15, 184, 240, 0.05)';
        }

        item.innerHTML = `
            <span class="candidate-index" ${cand.isPhantom ? 'style="color:var(--primary)"' : ''}>${key}</span>
            <span class="candidate-char">${cand.char}</span>
        `;
        item.addEventListener('click', () => selectCandidate(index));
        els.candidates.appendChild(item);

        if (els.miniCandidates) {
            const miniItem = document.createElement('span');
            miniItem.className = 'mini-candidate-item';
            if (cand.isPhantom) {
                miniItem.style.color = 'var(--primary)';
                miniItem.style.fontWeight = 'bold';
            }
            miniItem.innerHTML = `<span class="mini-candidate-key">${key}</span>${cand.char}`;
            miniItem.addEventListener('click', () => selectCandidate(index));
            els.miniCandidates.appendChild(miniItem);
        }
    });

    if (state.candidates.length > state.pageSize) {
        const totalPages = Math.ceil(state.candidates.length / state.pageSize);
        const pagination = document.createElement('div');
        pagination.className = 'pagination-info';
        pagination.textContent = `${state.page + 1} / ${totalPages}`;
        els.candidates.appendChild(pagination);
    }
}

function selectCandidate(index) {
    const realIndex = state.page * state.pageSize + index;
    if (realIndex >= state.candidates.length) return;

    const char = state.candidates[realIndex].char;

    // Record user habit
    if (state.userHistory) {
        state.userHistory.recordCommit(char);
    }

    state.output += char;
    state.buffer = '';
    state.candidates = [];
    state.page = 0;
    state.phantomText = null;

    updateOutput();
    updateComposition();
    renderCandidates();

    if (state.settings.autoCopy) {
        navigator.clipboard.writeText(state.output).catch(err => console.error('Auto-copy failed', err));
    }
}

function nextPage() {
    const totalPages = Math.ceil(state.candidates.length / state.pageSize);
    if (state.page < totalPages - 1) {
        state.page++;
        renderCandidates();
    } else {
        state.page = 0;
        renderCandidates();
    }
}

function updateOutput() {
    els.output.value = state.output;
    if (els.miniOutput) els.miniOutput.value = state.output;
    els.output.scrollTop = els.output.scrollHeight;
}

function showToast(message = 'Copied') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 1500);
    }, 10);
}

function triggerHaptic() {
    if (navigator.vibrate) {
        navigator.vibrate(5);
    }
}

// Start
init();
