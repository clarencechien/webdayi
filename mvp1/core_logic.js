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
 * Get selection index from key press
 * Maps selection keys to candidate indices
 * @param {string} key - The pressed key
 * @returns {number} - Candidate index (0-5) or -1 if not a selection key
 */
function getSelectionIndexFromKey(key) {
  const selectionKeys = {
    ' ': 0,   // Space = 1st candidate
    "'": 1,   // Apostrophe = 2nd candidate
    '[': 2,   // Left bracket = 3rd candidate
    ']': 3,   // Right bracket = 4th candidate
    '-': 4,   // Dash = 5th candidate
    '\\': 5   // Backslash = 6th candidate
  };

  return selectionKeys[key] !== undefined ? selectionKeys[key] : -1;
}

/**
 * Check if a character is valid for Dayi input
 * @param {string} char - The character to check
 * @returns {boolean} - True if valid input character
 */
function isValidInputChar(char) {
  if (!char || char.length !== 1) return false;

  // Selection keys are NOT input characters
  if (getSelectionIndexFromKey(char) !== -1) {
    return false;
  }

  // Allow: a-z, 0-9, and common punctuation used in Dayi
  // Based on the dictionary, valid chars include: a-z, 0-9, , . / ; and others
  const validPattern = /^[a-z0-9,.\\/;'`=\[\]\-]$/i;
  return validPattern.test(char);
}

/**
 * Get selection key label for display
 * @param {number} index - Candidate index (0-based)
 * @returns {string} - Display label for the selection key
 */
function getSelectionKeyLabel(index) {
  const labels = [
    'Space',  // 0: 1st candidate
    "'",      // 1: 2nd candidate
    '[',      // 2: 3rd candidate
    ']',      // 3: 4th candidate
    '-',      // 4: 5th candidate
    '\\'      // 5: 6th candidate
  ];
  return labels[index] || '';
}

/**
 * Render candidates as HTML string
 * @param {Array} candidates - Array of { char, freq } objects
 * @returns {string} - HTML string with new selection keys
 */
function renderCandidatesHTML(candidates) {
  if (!candidates || candidates.length === 0) {
    return '';
  }

  // Limit to 6 candidates (matching our selection keys)
  const limited = candidates.slice(0, 6);

  return limited
    .map((candidate, index) => {
      const keyLabel = getSelectionKeyLabel(index);
      const displayKey = index === 0 ? '<kbd>Space</kbd>' : `<kbd>${keyLabel}</kbd>`;
      return `<div class="candidate-item">
        <span class="candidate-key">${displayKey}</span>
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
 * Handle candidate selection
 * @param {number} index - The selected index (0-5)
 */
function handleSelection(index) {
  if (!currentCode) return;

  const candidates = queryCandidates(dayiMap, currentCode);
  const sorted = sortCandidatesByFreq(candidates);

  if (index >= 0 && index < sorted.length && index < 6) {
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

      // Handle selection keys (Space, ', [, ], -, \)
      inputBox.addEventListener('keydown', (e) => {
        const key = e.key;
        const selectionIndex = getSelectionIndexFromKey(key);

        // If it's a selection key and we have candidates
        if (selectionIndex !== -1 && currentCode) {
          e.preventDefault();
          handleSelection(selectionIndex);
        }
        // Note: 0-9 and other chars will naturally go into the input
        // because they're not prevented
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
