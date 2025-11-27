// Global State
const state = {
    buffer: '',
    output: '',
    candidates: [],
    page: 0,
    pageSize: 10,
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
        { code: 'Shift', label: '⇧', type: 'special', action: 'toggleInputMethod' },
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
}

// Theme & Settings Logic
function initTheme() {
    const isLargeScreen = window.innerWidth >= 768;
    const defaults = {
        focusMode: false,
        autoCopy: false,
        theme: 'dark',
        fontScale: 1.0,
        showKeyboard: !isLargeScreen
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

        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !fab.contains(e.target)) {
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

        state.predictionEngine = new PredictionEngine(bigramData);
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
            if (rowIndex === 4 && key.code === 'Space') {
                const globeBtn = document.createElement('button');
                globeBtn.className = 'key key-special';
                globeBtn.innerHTML = '<span class="material-symbols-outlined">language</span>';
                globeBtn.addEventListener('click', () => {
                    if (state.currentIM === 'dayi') {
                        switchToIM('zhuyin');
                    } else if (state.currentIM === 'zhuyin') {
                        switchToIM('english');
                    } else {
                        switchToIM('dayi');
                    }
                });

                globeBtn.addEventListener('touchstart', () => globeBtn.classList.add('active-state'), { passive: true });
                globeBtn.addEventListener('touchend', () => setTimeout(() => globeBtn.classList.remove('active-state'), 100));
                globeBtn.addEventListener('mousedown', () => globeBtn.classList.add('active-state'));
                globeBtn.addEventListener('mouseup', () => setTimeout(() => globeBtn.classList.remove('active-state'), 100));
                globeBtn.addEventListener('mouseleave', () => globeBtn.classList.remove('active-state'));

                rowDiv.appendChild(globeBtn);
            }

            let btn;
            if (key.type === 'special') {
                btn = document.createElement('button');
                btn.className = `key key-special ${key.width === 'wide' ? 'key-space' : ''}`;
                if (key.code === 'Shift') btn.id = 'key-shift';

                btn.textContent = key.label;

                if (key.action === 'toggleInputMethod') {
                    btn.addEventListener('click', toggleInputMethod);
                } else if (key.action === 'backspace') {
                    btn.addEventListener('click', handleBackspace);
                } else if (key.action === 'space') {
                    btn.addEventListener('click', handleSpace);
                }
            } else {
                btn = document.createElement('button');
                btn.className = 'key';
                btn.dataset.code = key.code;

                let mainLabel = key.label;
                let subLabel = '';

                if (state.currentIM === 'english') {
                    subLabel = '';
                } else if (state.currentIM === 'zhuyin') {
                    subLabel = ZHUYIN_MAPPING[key.code] || '';
                } else {
                    subLabel = key.sub || '';
                }

                btn.innerHTML = `
                    <span>${mainLabel}</span>
                    <span class="key-sub">${subLabel}</span>
                `;
                btn.addEventListener('click', () => handleInput(key.code));
            }

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

        if (e.key === 'Alt') {
            const now = Date.now();
            if (now - state.lastAltPressTime < 300) {
                clearAll();
                state.lastAltPressTime = 0;
                if (!state.isMiniMode) showToast('已清除');
                else {
                    if (els.miniUi) {
                        const card = els.miniUi.querySelector('.mini-card');
                        if (card) {
                            card.style.borderColor = 'var(--danger)';
                            setTimeout(() => card.style.borderColor = 'var(--border-color)', 300);
                        }
                    }
                }
                return;
            }
            state.lastAltPressTime = now;

            if (state.candidates.length > 0) {
                selectCandidate(state.page * state.pageSize + 0);
            }

            if (state.output) {
                navigator.clipboard.writeText(state.output).then(() => {
                    const target = state.isMiniMode ? els.miniOutput : els.output;
                    if (target) {
                        target.style.animation = 'none';
                        target.offsetHeight;
                        target.style.animation = 'flash-green 0.3s';
                    }

                    if (state.isMiniMode && els.miniUi) {
                        const card = els.miniUi.querySelector('.mini-card');
                        if (card) {
                            card.style.borderColor = 'var(--primary)';
                            setTimeout(() => card.style.borderColor = 'var(--border-color)', 300);
                        }
                    }

                    if (!state.isMiniMode) {
                        showToast('已複製');
                    }
                }).catch(err => console.error('Auto-copy failed', err));
            }
            return;
        }

        if (e.ctrlKey || e.altKey || e.metaKey) {
            if (e.key === 'Control') {
                const now = Date.now();
                if (now - state.lastCtrlPressTime < 500) {
                    toggleMiniMode();
                    state.lastCtrlPressTime = 0;
                    return;
                }
                state.lastCtrlPressTime = now;

                if (state.output) {
                    navigator.clipboard.writeText(state.output).then(() => {
                        showToast();
                    }).catch(err => {
                        console.warn('Clipboard API failed, trying fallback', err);
                        els.output.select();
                        try {
                            const successful = document.execCommand('copy');
                            if (successful) showToast();
                            else console.error('Fallback copy failed');
                        } catch (err) {
                            console.error('Fallback copy error', err);
                        }
                        window.getSelection().removeAllRanges();
                    });
                }
            }
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
        } else if (e.key === 'Escape') {
            if (state.buffer.length > 0) {
                state.buffer = '';
                state.candidates = [];
                state.page = 0;
                updateComposition();
                renderCandidates();
            } else if (state.output.length > 0) {
                state.output = '';
                updateOutput();
                triggerHaptic();
            }
            e.preventDefault();
        } else if (e.key === 'Delete') {
            if (state.output.length > 0) {
                state.output = '';
                updateOutput();
                triggerHaptic();
            }
            e.preventDefault();
        } else if (e.key === 'Shift') {
            state.shiftKeyUsed = false;
        } else if (e.key.length === 1) {
            if (e.shiftKey) state.shiftKeyUsed = true;
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
}

function clearAll() {
    state.output = '';
    state.buffer = '';
    state.candidates = [];
    state.page = 0;
    updateOutput();
    updateComposition();
    renderCandidates();

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

    els.status.textContent = text;
    if (els.miniImStatus) els.miniImStatus.textContent = miniText;
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
        const isInput = state.buffer.length < 4 && state.validPrefixes.has(nextBuffer);

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

            selectCandidate(0);
        }
    }

    if (state.buffer.length >= 4) {
        return;
    }

    state.buffer += lowerKey;
    updateComposition();
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

function handleSpace() {
    triggerHaptic();

    if (state.phantomText) {
        confirmPhantom();
        return;
    }

    if (state.candidates.length > 0) {
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
    els.composition.textContent = state.buffer;
    if (els.miniComposition) els.miniComposition.textContent = state.buffer;

    state.page = 0;

    state.phantomText = null;
    if (state.currentIM === 'dayi' && state.predictionEngine) {
        if (state.buffer.length > 0) {
            const lastChar = state.output.slice(-1);
            if (lastChar) {
                state.phantomText = state.predictionEngine.getBigramSuggestion(lastChar, state.buffer);
            }

            if (!state.phantomText) {
                state.phantomText = state.predictionEngine.predictPhantom(state.buffer);
            }
        }
    }

    if (state.buffer.length === 0) {
        state.candidates = [];
        renderCandidates();
        return;
    }

    let candidates = state.db[state.buffer] || [];

    if (candidates.length > 0 && typeof candidates[0] === 'string') {
        candidates = candidates.map(c => ({ char: c }));
    }

    state.candidates = candidates;

    if (state.phantomText) {
        // Remove phantom from candidates if it exists (to avoid duplicates)
        state.candidates = state.candidates.filter(c => c.char !== state.phantomText);
        // Insert at the beginning
        state.candidates.unshift({ char: state.phantomText, isPhantom: true });
        // Clear phantomText so it's not rendered separately
        state.phantomText = null;
    }

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
