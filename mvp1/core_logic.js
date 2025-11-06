/**
 * WebDaYi MVP1 - Core Logic
 *
 * This module contains all the core query and rendering logic
 * for the Dàyì input method engine.
 */

// Global state
let dayiMap = null;  // The in-memory Map of code -> candidates
let currentCode = '';  // Current input code buffer

/**
 * Create a Map from the database object for O(1) lookups
 * @param {Object} dbObject - The parsed JSON database
 * @returns {Map} - Map with code as key and candidates array as value
 */
function createDatabaseMap(dbObject) {
  const map = new Map();
  for (const [code, candidates] of Object.entries(dbObject)) {
    map.set(code, candidates);
  }
  return map;
}

/**
 * Query candidates for a given code
 * @param {Map} map - The database Map
 * @param {string} code - The Dàyì code to query
 * @returns {Array} - Array of candidate objects { char, freq }
 */
function queryCandidates(map, code) {
  if (!code || !map) {
    return [];
  }
  return map.get(code) || [];
}

/**
 * Sort candidates by frequency (descending)
 * @param {Array} candidates - Array of { char, freq } objects
 * @returns {Array} - Sorted array (new copy)
 */
function sortCandidatesByFreq(candidates) {
  if (!candidates || candidates.length === 0) {
    return [];
  }
  // Create a copy to avoid mutating original
  return [...candidates].sort((a, b) => b.freq - a.freq);
}

/**
 * Render candidates as HTML string
 * @param {Array} candidates - Array of { char, freq } objects
 * @returns {string} - HTML string with numbered candidates
 */
function renderCandidatesHTML(candidates) {
  if (!candidates || candidates.length === 0) {
    return '';
  }

  // Limit to 9 candidates (1-9 keys)
  const limited = candidates.slice(0, 9);

  return limited
    .map((candidate, index) => {
      const number = index + 1;
      return `<div class="candidate-item">
        <span class="candidate-number">${number}.</span>
        <span class="candidate-char">${candidate.char}</span>
      </div>`;
    })
    .join('');
}

/**
 * Load the database from JSON file
 * @returns {Promise<void>}
 */
async function loadDatabase() {
  try {
    console.log('[WebDaYi] Loading database...');
    const response = await fetch('dayi_db.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const dbObject = await response.json();
    dayiMap = createDatabaseMap(dbObject);

    console.log(`[WebDaYi] Database loaded: ${dayiMap.size} codes`);
    return dayiMap;
  } catch (error) {
    console.error('[WebDaYi] Failed to load database:', error);
    throw error;
  }
}

/**
 * Handle input changes in the input box
 * @param {string} value - The current input value
 */
function handleInput(value) {
  currentCode = value.trim().toLowerCase();

  if (!currentCode) {
    updateCandidateArea([]);
    return;
  }

  // Query and sort
  const candidates = queryCandidates(dayiMap, currentCode);
  const sorted = sortCandidatesByFreq(candidates);

  // Update UI
  updateCandidateArea(sorted);
}

/**
 * Update the candidate area with new candidates
 * @param {Array} candidates - Sorted candidates array
 */
function updateCandidateArea(candidates) {
  const candidateArea = document.getElementById('candidate-area');
  if (!candidateArea) return;

  if (candidates.length === 0) {
    candidateArea.innerHTML = '<div class="no-candidates">沒有候選字</div>';
  } else {
    candidateArea.innerHTML = renderCandidatesHTML(candidates);
  }
}

/**
 * Handle number key selection (1-9)
 * @param {number} index - The selected index (0-8)
 */
function handleSelection(index) {
  if (!currentCode) return;

  const candidates = queryCandidates(dayiMap, currentCode);
  const sorted = sortCandidatesByFreq(candidates);

  if (index >= 0 && index < sorted.length && index < 9) {
    const selected = sorted[index];
    appendToOutputBuffer(selected.char);
    clearInputBox();
  }
}

/**
 * Append a character to the output buffer
 * @param {string} char - The character to append
 */
function appendToOutputBuffer(char) {
  const outputBuffer = document.getElementById('output-buffer');
  if (!outputBuffer) return;

  outputBuffer.value += char;
  // Auto-focus back to input for continued typing
  const inputBox = document.getElementById('input-box');
  if (inputBox) {
    inputBox.focus();
  }
}

/**
 * Clear the input box
 */
function clearInputBox() {
  const inputBox = document.getElementById('input-box');
  if (!inputBox) return;

  inputBox.value = '';
  currentCode = '';
  updateCandidateArea([]);
}

/**
 * Copy output buffer to clipboard
 */
async function copyToClipboard() {
  const outputBuffer = document.getElementById('output-buffer');
  if (!outputBuffer) return;

  const text = outputBuffer.value;
  if (!text) {
    alert('輸出緩衝區是空的');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    console.log('[WebDaYi] Copied to clipboard:', text);

    // Visual feedback
    const copyButton = document.getElementById('copy-button');
    if (copyButton) {
      const originalText = copyButton.textContent;
      copyButton.textContent = '已複製！';
      copyButton.style.background = '#4caf50';
      setTimeout(() => {
        copyButton.textContent = originalText;
        copyButton.style.background = '';
      }, 1500);
    }
  } catch (error) {
    console.error('[WebDaYi] Failed to copy:', error);
    alert('複製失敗：' + error.message);
  }
}

/**
 * Initialize the application
 */
async function initialize() {
  try {
    // Load database
    await loadDatabase();

    // Set up event listeners
    const inputBox = document.getElementById('input-box');
    if (inputBox) {
      inputBox.addEventListener('input', (e) => {
        handleInput(e.target.value);
      });

      // Handle number key selections
      inputBox.addEventListener('keydown', (e) => {
        const key = e.key;
        if (key >= '1' && key <= '9') {
          e.preventDefault();
          const index = parseInt(key) - 1;
          handleSelection(index);
        }
      });

      // Auto-focus input box
      inputBox.focus();
    }

    // Set up copy button
    const copyButton = document.getElementById('copy-button');
    if (copyButton) {
      copyButton.addEventListener('click', copyToClipboard);
    }

    console.log('[WebDaYi] Initialized successfully');
  } catch (error) {
    console.error('[WebDaYi] Initialization failed:', error);
    alert('初始化失敗：' + error.message);
  }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM already loaded (e.g., in test environment)
    // Don't auto-initialize to allow tests to run
  }
}
