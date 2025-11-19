/**
 * WebDayi Lite - App Logic
 */

// State
const state = {
    db: {},
    buffer: '', // Current input code (e.g., 'x', 'xo')
    candidates: [], // Current candidates
    output: '', // Committed text
    page: 0,
    pageSize: 10
};

// DOM Elements
const els = {
    status: document.getElementById('status-indicator'),
    buffer: document.getElementById('composition-buffer'),
    candidates: document.getElementById('candidate-bar'),
    currentCode: document.getElementById('current-code'),
    keyboard: document.getElementById('virtual-keyboard')
};

// Keyboard Layout (Dayi 4)
// Row 1: Q W E R T Y U I O P
// Row 2: A S D F G H J K L ;
// Row 3: Z X C V B N M , . /
const KEYBOARD_LAYOUT = [
    [
        { code: 'q', label: 'Q', sub: '言' },
        { code: 'w', label: 'W', sub: '山' },
        { code: 'e', label: 'E', sub: '一' },
        { code: 'r', label: 'R', sub: '工' },
        { code: 't', label: 'T', sub: '糸' },
        { code: 'y', label: 'Y', sub: '火' },
        { code: 'u', label: 'U', sub: '艸' },
        { code: 'i', label: 'I', sub: '木' },
        { code: 'o', label: 'O', sub: '口' },
        { code: 'p', label: 'P', sub: '耳' }
    ],
    [
        { code: 'a', label: 'A', sub: '人' },
        { code: 's', label: 'S', sub: '革' },
        { code: 'd', label: 'D', sub: '日' },
        { code: 'f', label: 'F', sub: '土' },
        { code: 'g', label: 'G', sub: '手' },
        { code: 'h', label: 'H', sub: '鳥' },
        { code: 'j', label: 'J', sub: '月' },
        { code: 'k', label: 'K', sub: '立' },
        { code: 'l', label: 'L', sub: '女' },
        { code: ';', label: ';', sub: '虫' }
    ],
    [
        { code: 'z', label: 'Z', sub: '心' },
        { code: 'x', label: 'X', sub: '水' },
        { code: 'c', label: 'C', sub: '鹿' },
        { code: 'v', label: 'V', sub: '禾' },
        { code: 'b', label: 'B', sub: '馬' },
        { code: 'n', label: 'N', sub: '魚' },
        { code: 'm', label: 'M', sub: '雨' },
        { code: ',', label: ',', sub: '力' },
        { code: '.', label: '.', sub: '舟' },
        { code: '/', label: '/', sub: '竹' }
    ]
];

// Initialization
async function init() {
    renderKeyboard();
    setupEventListeners();
    await loadDatabase();
}

// Load Data
async function loadDatabase() {
    try {
        els.status.textContent = 'Loading Data...';
        const response = await fetch('data/dayi_db.json');
        if (!response.ok) throw new Error('Failed to load database');
        state.db = await response.json();
        els.status.textContent = 'Ready';
        els.status.style.color = 'lightgreen';
    } catch (error) {
        console.error(error);
        els.status.textContent = 'Error Loading Data';
        els.status.style.color = 'red';
    }
}

// Render Keyboard
function renderKeyboard() {
    const container = els.keyboard;
    container.innerHTML = '';

    KEYBOARD_LAYOUT.forEach(row => {
        row.forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'key';
            btn.dataset.code = key.code;
            btn.innerHTML = `
                <span>${key.label}</span>
                <span class="key-sub">${key.sub}</span>
            `;
            btn.addEventListener('click', () => handleInput(key.code));
            container.appendChild(btn);
        });
    });

    // Add special keys row
    const specialRow = document.createElement('div');
    specialRow.style.gridColumn = '1 / -1';
    specialRow.style.display = 'flex';
    specialRow.style.gap = '4px';

    const backspace = createSpecialKey('⌫', 'Backspace', () => handleBackspace());
    const space = createSpecialKey('Space', 'Space', () => handleSpace(), true);
    const enter = createSpecialKey('↵', 'Enter', () => handleEnter());

    specialRow.appendChild(backspace);
    specialRow.appendChild(space);
    specialRow.appendChild(enter);

    container.appendChild(specialRow);
}

function createSpecialKey(label, code, action, isSpace = false) {
    const btn = document.createElement('button');
    btn.className = `key key-special ${isSpace ? 'key-space' : ''}`;
    btn.style.flex = isSpace ? '2' : '1';
    btn.textContent = label;
    btn.addEventListener('click', action);
    return btn;
}

// Event Listeners
function setupEventListeners() {
    // Physical Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        if (e.key === 'Backspace') {
            handleBackspace();
            e.preventDefault();
        } else if (e.key === 'Enter') {
            handleEnter();
            e.preventDefault();
        } else if (e.key === ' ') {
            handleSpace();
            e.preventDefault();
        } else if (e.key.length === 1) {
            // Handle alphanumeric keys and punctuation that are in our layout
            const key = e.key.toLowerCase();
            const validKeys = KEYBOARD_LAYOUT.flat().map(k => k.code);
            if (validKeys.includes(key) || (key >= '0' && key <= '9')) {
                handleInput(key);
                e.preventDefault();
            }
        }
    });
}

// Input Handling
function handleInput(key) {
    // If it's a number selection
    if (key >= '0' && key <= '9') {
        const index = key === '0' ? 9 : parseInt(key) - 1;
        selectCandidate(index);
        return;
    }

    // Add to buffer
    if (state.buffer.length < 4) {
        state.buffer += key;
        updateComposition();
    }
}

function handleBackspace() {
    if (state.buffer.length > 0) {
        state.buffer = state.buffer.slice(0, -1);
        updateComposition();
    } else if (state.output.length > 0) {
        state.output = state.output.slice(0, -1);
        updateOutput();
    }
}

function handleSpace() {
    if (state.candidates.length > 0) {
        // Select first candidate
        selectCandidate(0);
    } else {
        state.output += ' ';
        updateOutput();
    }
}

function handleEnter() {
    if (state.buffer.length > 0) {
        // Commit raw buffer
        state.output += state.buffer;
        state.buffer = '';
        updateComposition();
        updateOutput();
    } else {
        state.output += '\n';
        updateOutput();
    }
}

// Logic
function updateComposition() {
    els.currentCode.textContent = state.buffer;

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
            els.candidates.textContent = 'No candidates';
        }
        return;
    }

    state.candidates.slice(0, 10).forEach((cand, index) => {
        const div = document.createElement('div');
        div.className = 'candidate-item';
        div.innerHTML = `<span class="candidate-index">${(index + 1) % 10}</span>${cand.char}`;
        div.addEventListener('click', () => selectCandidate(index));
        els.candidates.appendChild(div);
    });
}

function selectCandidate(index) {
    if (index >= 0 && index < state.candidates.length) {
        const char = state.candidates[index].char;
        state.output += char;
        state.buffer = '';
        updateComposition();
        updateOutput();
    }
}

function updateOutput() {
    els.buffer.textContent = state.output;
}

// Start
init();
