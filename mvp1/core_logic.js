/**
 * WebDaYi MVP1 - Core Logic
 *
 * This module contains all the core query and rendering logic
 * for the Dàyì input method engine.
 */

// Global state
let dayiMap = null;  // The in-memory Map of code -> candidates
let currentCode = '';  // Current input code buffer
let currentPage = 0;  // Current page index for pagination
let currentCandidates = [];  // Current candidates array (for pagination)
let currentInputMode = 'normal';  // Current input mode: 'normal' or 'express'
let userModel = null;  // User personalization model (Map of code -> char order)
let autoCopyEnabled = true;  // Auto-copy enabled state (v8 - MVP1.11) - default: true

// ============================================
// User Personalization Functions (v6 - MVP1.7, MVP1.8, MVP1.9)
// ============================================

/**
 * Get localStorage key for user model
 * @returns {string} - Storage key
 */
function getUserModelStorageKey() {
  return 'webDayi_UserModel';
}

/**
 * Create empty user model
 * @returns {Map} - Empty Map
 */
function createEmptyUserModel() {
  return new Map();
}

/**
 * Parse user model from localStorage JSON string (MVP1.7)
 * @param {string|null} jsonString - JSON string from localStorage
 * @returns {Map} - Parsed user model Map
 */
function parseUserModelFromStorage(jsonString) {
  if (!jsonString) {
    return createEmptyUserModel();
  }

  try {
    const obj = JSON.parse(jsonString);
    const model = new Map();

    for (const [code, charArray] of Object.entries(obj)) {
      if (Array.isArray(charArray)) {
        model.set(code, charArray);
      }
    }

    return model;
  } catch (error) {
    console.warn('[WebDaYi] Failed to parse user model:', error);
    return createEmptyUserModel();
  }
}

/**
 * Format user model to JSON string for storage (MVP1.8)
 * @param {Map} model - User model Map
 * @returns {string} - JSON string
 */
function formatUserModelForStorage(model) {
  const obj = {};

  for (const [code, charArray] of model.entries()) {
    obj[code] = charArray;
  }

  return JSON.stringify(obj);
}

/**
 * Reorder candidates by user selection (MVP1.8)
 * Move selected candidate to front
 * @param {Array} candidates - Array of {char, freq} objects
 * @param {number} selectedIndex - Index of selected candidate
 * @returns {Array} - Array of char strings in new order
 */
function reorderBySelection(candidates, selectedIndex) {
  if (selectedIndex < 0 || selectedIndex >= candidates.length) {
    return candidates.map(c => c.char);
  }

  const chars = candidates.map(c => c.char);
  const selectedChar = chars[selectedIndex];

  // Move selected char to front
  const newOrder = [selectedChar];

  for (let i = 0; i < chars.length; i++) {
    if (i !== selectedIndex) {
      newOrder.push(chars[i]);
    }
  }

  return newOrder;
}

/**
 * Apply user preference to candidates (MVP1.9)
 * Reorder candidates based on user model
 * @param {string} code - Input code
 * @param {Array} staticCandidates - Static candidates from database
 * @param {Map} userModel - User preference model
 * @returns {Array} - Reordered candidates
 */
function applyUserPreference(code, staticCandidates, userModel) {
  // If no user preference exists, return static order
  if (!userModel.has(code)) {
    return staticCandidates;
  }

  const userOrder = userModel.get(code);
  const staticMap = new Map();

  // Create a map of char -> candidate object for quick lookup
  for (const candidate of staticCandidates) {
    staticMap.set(candidate.char, candidate);
  }

  const reordered = [];

  // First, add candidates in user's preferred order
  for (const char of userOrder) {
    if (staticMap.has(char)) {
      reordered.push(staticMap.get(char));
      staticMap.delete(char); // Remove from map to avoid duplicates
    }
  }

  // Then, add remaining candidates (that weren't in user order)
  for (const candidate of staticCandidates) {
    if (staticMap.has(candidate.char)) {
      reordered.push(candidate);
    }
  }

  return reordered;
}

/**
 * Update user model after candidate selection (MVP1.8)
 * @param {string} code - Input code
 * @param {Array} candidates - Current candidates
 * @param {number} selectedIndex - Index of selected candidate
 * @param {Map} userModel - User model to update
 */
function updateUserModel(code, candidates, selectedIndex, userModel) {
  const newOrder = reorderBySelection(candidates, selectedIndex);
  userModel.set(code, newOrder);
}

/**
 * Load user model from localStorage (MVP1.7)
 * @returns {Map} - Loaded user model
 */
function loadUserModel() {
  if (typeof localStorage === 'undefined') {
    return createEmptyUserModel();
  }

  const key = getUserModelStorageKey();
  const jsonString = localStorage.getItem(key);
  return parseUserModelFromStorage(jsonString);
}

/**
 * Save user model to localStorage (MVP1.8)
 * @param {Map} model - User model to save
 */
function saveUserModel(model) {
  if (typeof localStorage === 'undefined') return;

  const key = getUserModelStorageKey();
  const jsonString = formatUserModelForStorage(model);
  localStorage.setItem(key, jsonString);
}

// ============================================
// Auto-Copy Functions (v8 - MVP1.11)
// ============================================

/**
 * Get localStorage key for auto-copy preference
 * @returns {string} - Storage key
 */
function getAutoCopyStorageKey() {
  return 'webDayi_AutoCopy';
}

/**
 * Load auto-copy preference from localStorage (MVP1.11)
 * Default: enabled (true) for seamless workflow
 * @returns {boolean} - Auto-copy enabled state
 */
function loadAutoCopyPreference() {
  // Handle Node.js test environment (no localStorage)
  if (typeof localStorage === 'undefined') {
    return true;  // Default: enabled
  }

  const key = getAutoCopyStorageKey();
  const stored = localStorage.getItem(key);

  // Default to enabled if no preference exists
  if (stored === null || stored === undefined) {
    return true;  // Default: enabled
  }

  return stored === 'true';
}

/**
 * Save auto-copy preference to localStorage (MVP1.11)
 * @param {boolean} enabled - Auto-copy enabled state
 */
function saveAutoCopyPreference(enabled) {
  // Handle Node.js test environment (no localStorage)
  if (typeof localStorage === 'undefined') return;

  const key = getAutoCopyStorageKey();
  localStorage.setItem(key, enabled.toString());
}

/**
 * Perform auto-copy to clipboard (MVP1.11)
 * Automatically copies output buffer after character selection
 * @param {string} text - Text to copy
 * @returns {boolean} - True if copy succeeded, false otherwise
 */
function performAutoCopy(text) {
  // Don't copy if auto-copy is disabled
  if (!autoCopyEnabled) {
    return false;
  }

  // Don't copy empty or null/undefined text
  if (!text || text.trim() === '') {
    return false;
  }

  // Use clipboard API directly (async, but we don't wait)
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('[WebDaYi] Auto-copied to clipboard:', text);
      }).catch((error) => {
        console.error('[WebDaYi] Auto-copy failed:', error);
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('[WebDaYi] Auto-copy failed:', error);
    return false;
  }
}

/**
 * Show visual feedback after auto-copy (MVP1.11)
 * Displays brief toast notification
 */
function showCopyFeedback() {
  // Handle Node.js test environment (no document)
  if (typeof document === 'undefined') return;

  const toast = document.getElementById('copy-toast');
  if (!toast) return;  // Gracefully handle missing element

  // Show toast
  toast.classList.remove('hidden');
  toast.classList.add('show');

  // Hide after 2 seconds
  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('show');
  }, 2000);
}

/**
 * Setup auto-copy toggle button (MVP1.11)
 * Initializes toggle button event handlers and UI state
 */
function setupAutoCopyToggle() {
  // Handle Node.js test environment (no document)
  if (typeof document === 'undefined') return;

  const toggleBtn = document.getElementById('auto-copy-toggle-btn');
  if (!toggleBtn) return;  // Gracefully handle missing element

  /**
   * Update toggle button UI state
   */
  function updateToggleUI() {
    if (autoCopyEnabled) {
      toggleBtn.textContent = '🔄 自動複製: 開啟';
      toggleBtn.classList.add('active');
      toggleBtn.setAttribute('aria-label', '關閉自動複製');
    } else {
      toggleBtn.textContent = '🔄 自動複製: 關閉';
      toggleBtn.classList.remove('active');
      toggleBtn.setAttribute('aria-label', '開啟自動複製');
    }
  }

  // Initialize UI
  updateToggleUI();

  // Toggle on click
  toggleBtn.addEventListener('click', () => {
    autoCopyEnabled = !autoCopyEnabled;
    saveAutoCopyPreference(autoCopyEnabled);
    updateToggleUI();

    // Show feedback
    const feedbackText = autoCopyEnabled ? '自動複製已開啟' : '自動複製已關閉';
    showTemporaryFeedback(feedbackText);
  });
}

/**
 * Show temporary feedback message (MVP1.11)
 * @param {string} message - Message to show
 */
function showTemporaryFeedback(message) {
  // Handle Node.js test environment (no document)
  if (typeof document === 'undefined') return;

  const toast = document.getElementById('copy-toast');
  if (!toast) return;

  const originalText = toast.textContent;
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('show');
    toast.textContent = originalText;  // Restore
  }, 2000);
}

// ============================================
// Input Mode Toggle Functions (v5)
// ============================================

/**
 * Get current input mode
 * @returns {string} - Current mode: 'normal' or 'express'
 */
function getInputMode() {
  return currentInputMode;
}

/**
 * Toggle between normal and express modes
 * @param {string} currentMode - Current mode
 * @returns {string} - New mode
 */
function toggleInputMode(currentMode) {
  return currentMode === 'normal' ? 'express' : 'normal';
}

/**
 * Validate if mode value is valid
 * @param {string} mode - Mode to validate
 * @returns {boolean} - True if valid
 */
function isValidInputMode(mode) {
  return mode === 'normal' || mode === 'express';
}

/**
 * Get localStorage key for input mode
 * @returns {string} - Storage key
 */
function getInputModeStorageKey() {
  return 'webdayi_input_mode';
}

/**
 * Format mode value for storage
 * @param {string} mode - Mode to format
 * @returns {string} - Formatted mode
 */
function formatModeForStorage(mode) {
  return mode;  // Already in correct format
}

/**
 * Parse mode value from storage
 * @param {string|null} value - Storage value
 * @returns {string} - Parsed mode (defaults to 'normal')
 */
function parseModeFromStorage(value) {
  if (!value || !isValidInputMode(value)) {
    return 'normal';
  }
  return value;
}

/**
 * Get body class for mode
 * @param {string} mode - Input mode
 * @returns {string} - CSS class ('express-mode' or '')
 */
function getBodyClassForMode(mode) {
  return mode === 'express' ? 'express-mode' : '';
}

/**
 * Check if class name indicates express mode
 * @param {string} className - Class name to check
 * @returns {boolean} - True if express mode
 */
function isExpressModeClass(className) {
  return className === 'express-mode';
}

/**
 * Get label for mode
 * @param {string} mode - Input mode
 * @returns {string} - Chinese label
 */
function getModeLabel(mode) {
  return mode === 'normal' ? '正常模式' : '專注模式';
}

/**
 * Get toggle button text
 * @param {string} currentMode - Current mode
 * @returns {string} - Button text (what it will switch TO)
 */
function getToggleButtonText(currentMode) {
  const nextMode = toggleInputMode(currentMode);
  return `切換至${getModeLabel(nextMode)}`;
}

/**
 * Apply input mode to UI
 * @param {string} mode - Mode to apply
 */
function applyInputMode(mode) {
  if (typeof document === 'undefined') return;

  const bodyClass = getBodyClassForMode(mode);

  if (bodyClass) {
    document.body.classList.add(bodyClass);
  } else {
    document.body.classList.remove('express-mode');
  }

  currentInputMode = mode;

  // Update toggle button text if it exists
  const toggleButton = document.getElementById('mode-toggle-btn');
  if (toggleButton) {
    toggleButton.textContent = getToggleButtonText(mode);
    toggleButton.setAttribute('aria-label', getToggleButtonText(mode));
  }
}

/**
 * Save input mode to localStorage
 * @param {string} mode - Mode to save
 */
function saveInputMode(mode) {
  if (typeof localStorage === 'undefined') return;

  const key = getInputModeStorageKey();
  const value = formatModeForStorage(mode);
  localStorage.setItem(key, value);
}

/**
 * Load input mode from localStorage
 * @returns {string} - Loaded mode (defaults to 'normal')
 */
function loadInputMode() {
  if (typeof localStorage === 'undefined') return 'normal';

  const key = getInputModeStorageKey();
  const value = localStorage.getItem(key);
  return parseModeFromStorage(value);
}

/**
 * Handle input mode toggle button click
 */
function handleModeToggle() {
  const newMode = toggleInputMode(currentInputMode);
  applyInputMode(newMode);
  saveInputMode(newMode);
}

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
 * Calculate total pages needed for candidates
 * @param {Array} candidates - Array of candidate objects
 * @returns {number} - Total number of pages needed
 */
function getTotalPages(candidates) {
  if (!candidates || candidates.length === 0) {
    return 0;
  }
  return Math.ceil(candidates.length / 6);
}

/**
 * Get candidates for a specific page
 * @param {Array} candidates - Array of candidate objects
 * @param {number} pageIndex - Page index (0-based)
 * @returns {Array} - Candidates for the specified page (max 6)
 */
function getCandidatesForPage(candidates, pageIndex) {
  if (!candidates || candidates.length === 0 || pageIndex < 0) {
    return [];
  }

  const startIndex = pageIndex * 6;
  const endIndex = startIndex + 6;

  return candidates.slice(startIndex, endIndex);
}

/**
 * Get next page index (with cycling)
 * @param {number} currentPage - Current page index
 * @param {number} totalPages - Total number of pages
 * @returns {number} - Next page index
 */
function getNextPage(currentPage, totalPages) {
  if (totalPages <= 1) {
    return 0;
  }
  return (currentPage + 1) % totalPages;
}

/**
 * Check if pagination is needed
 * @param {Array} candidates - Array of candidate objects
 * @returns {boolean} - True if more than 6 candidates
 */
function needsPagination(candidates) {
  return candidates && candidates.length > 6;
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
 * Check if auto-select should trigger based on input value change
 * This prevents auto-select on backspace (when value gets shorter)
 * @param {string} previousValue - Previous input value
 * @param {string} newValue - New input value
 * @returns {boolean} - True if should trigger auto-select
 */
function shouldAutoSelectOnInput(previousValue, newValue) {
  // Only trigger auto-select if value is getting longer (not backspace)
  if (newValue.length <= previousValue.length) {
    return false;
  }

  // Only trigger if going from 2 chars to 3+ chars
  if (previousValue.length !== 2) {
    return false;
  }

  // Get the new character that was added
  const newChar = newValue.charAt(newValue.length - 1);

  // Use existing shouldAutoSelect logic
  return shouldAutoSelect(previousValue, newChar);
}

/**
 * Delete last character from output text
 * @param {string} outputText - Current output buffer text
 * @returns {string} - Output text with last character removed
 */
function deleteLastCharFromOutput(outputText) {
  if (!outputText || outputText.length === 0) {
    return '';
  }
  return outputText.slice(0, -1);
}

/**
 * Check if backspace should delete from output buffer
 * @param {string} inputValue - Current input code value
 * @param {string} outputValue - Current output buffer value
 * @returns {boolean} - True if should delete from output
 */
function shouldDeleteFromOutput(inputValue, outputValue) {
  // Only delete from output if:
  // 1. Input is empty
  // 2. Output has content to delete
  return inputValue.length === 0 && outputValue.length > 0;
}

/**
 * Check if auto-select should be triggered
 * Auto-select happens when user types a 3rd character (after 2-char code)
 * @param {string} currentCode - Current code in input box
 * @param {string} newChar - The new character being typed
 * @returns {boolean} - True if auto-select should trigger
 */
function shouldAutoSelect(currentCode, newChar) {
  // Auto-select when going from 2 chars to 3rd char
  if (currentCode.length !== 2) {
    return false;
  }

  // Don't auto-select if the new char is a selection key
  if (getSelectionIndexFromKey(newChar) !== -1) {
    return false;
  }

  // Don't auto-select if the new char is pagination key
  if (newChar === '=') {
    return false;
  }

  // Auto-select if it's a valid input character
  return isValidInputChar(newChar);
}

/**
 * Split code for auto-select scenario
 * @param {string} currentCode - Current code (e.g., "ab")
 * @param {string} newChar - The new character (e.g., "c")
 * @returns {Object} - { currentCode: "ab", newCode: "c" }
 */
function splitCodeForAutoSelect(currentCode, newChar) {
  return {
    currentCode: currentCode,
    newCode: newChar
  };
}

/**
 * Perform auto-select of first candidate
 * @param {string} code - The code to query
 * @param {Map} map - The database map
 * @param {Map} userModel - Optional user preference model
 * @returns {Object} - { success: boolean, selectedChar: string }
 */
function performAutoSelect(code, map, userModel = null) {
  const candidates = queryCandidates(map, code);
  const sorted = sortCandidatesByFreq(candidates);

  // Apply user preference if available (MVP1.9 bug fix)
  const withUserPreference = userModel ?
    applyUserPreference(code, sorted, userModel) :
    sorted;

  if (withUserPreference.length > 0) {
    return {
      success: true,
      selectedChar: withUserPreference[0].char
    };
  }

  return {
    success: false,
    selectedChar: ''
  };
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
 * Render candidates as HTML string (with pagination support)
 * @param {Array} candidates - Array of { char, freq } objects
 * @param {number} pageIndex - Current page index
 * @param {number} totalPages - Total pages
 * @returns {string} - HTML string with new selection keys
 */
function renderCandidatesHTML(candidates, pageIndex = 0, totalPages = 1) {
  if (!candidates || candidates.length === 0) {
    return '';
  }

  // Get candidates for current page (max 6)
  const pageCandidates = getCandidatesForPage(candidates, pageIndex);

  const candidatesHtml = pageCandidates
    .map((candidate, index) => {
      const keyLabel = getSelectionKeyLabel(index);
      const displayKey = index === 0 ? '<kbd>Space</kbd>' : `<kbd>${keyLabel}</kbd>`;
      return `<div class="candidate-item clickable" data-index="${index}" role="button" tabindex="0" aria-label="選擇 ${candidate.char}">
        <span class="candidate-key">${displayKey}</span>
        <span class="candidate-char">${candidate.char}</span>
      </div>`;
    })
    .join('');

  // Add pagination controls if needed
  if (totalPages > 1) {
    const prevDisabled = pageIndex === 0 ? 'disabled' : '';
    const nextDisabled = pageIndex === totalPages - 1 ? 'disabled' : '';

    const pageControls = `<div class="page-controls">
      <button class="page-btn prev-page" ${prevDisabled} aria-label="上一頁">◀ 上一頁</button>
      <span class="page-indicator">第 ${pageIndex + 1}/${totalPages} 頁</span>
      <button class="page-btn next-page" ${nextDisabled} aria-label="下一頁">下一頁 ▶</button>
    </div>`;
    return candidatesHtml + pageControls;
  }

  return candidatesHtml;
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
 * @param {string} previousValue - Previous input value (for auto-select detection)
 */
function handleInput(value, previousValue = '') {
  const newCode = value.trim().toLowerCase();

  // Check for auto-select (2 chars → 3rd char)
  // This now properly checks that value is getting LONGER (not backspace)
  if (previousValue && shouldAutoSelectOnInput(previousValue, newCode)) {
    // Auto-select first candidate from previous code (with user preference - MVP1.9 bug fix)
    const result = performAutoSelect(previousValue, dayiMap, userModel);
    if (result.success) {
      appendToOutputBuffer(result.selectedChar);

      // Auto-copy after auto-select (MVP1.11 - v8)
      if (autoCopyEnabled) {
        const outputBuffer = document.getElementById('output-buffer');
        if (outputBuffer && performAutoCopy(outputBuffer.value)) {
          showCopyFeedback();
        }
      }

      // Update input to show only the new character
      const inputBox = document.getElementById('input-box');
      if (inputBox) {
        inputBox.value = newCode.substring(previousValue.length);
        // Recursively handle the new code
        handleInput(inputBox.value, '');
        return;
      }
    }
  }

  currentCode = newCode;

  if (!currentCode) {
    currentCandidates = [];
    currentPage = 0;
    updateCandidateArea([]);
    return;
  }

  // Query and sort
  const candidates = queryCandidates(dayiMap, currentCode);
  const sorted = sortCandidatesByFreq(candidates);

  // Apply user preference (MVP1.9)
  const withUserPreference = userModel ?
    applyUserPreference(currentCode, sorted, userModel) :
    sorted;

  // Store candidates and reset page
  currentCandidates = withUserPreference;
  currentPage = 0;

  // Update UI with pagination
  updateCandidateArea(withUserPreference, currentPage);
}

/**
 * Update the candidate area with new candidates (with pagination)
 * @param {Array} candidates - Sorted candidates array
 * @param {number} pageIndex - Current page index
 */
function updateCandidateArea(candidates, pageIndex = 0) {
  const candidateArea = document.getElementById('candidate-area');
  if (!candidateArea) return;

  if (candidates.length === 0) {
    candidateArea.innerHTML = '<div class="no-candidates">沒有候選字</div>';
  } else {
    const totalPages = getTotalPages(candidates);
    candidateArea.innerHTML = renderCandidatesHTML(candidates, pageIndex, totalPages);
  }
}

/**
 * Handle candidate selection (with pagination support)
 * @param {number} index - The selected index (0-5)
 */
function handleSelection(index) {
  if (!currentCode || currentCandidates.length === 0) return;

  // Get candidates for current page
  const pageCandidates = getCandidatesForPage(currentCandidates, currentPage);

  if (index >= 0 && index < pageCandidates.length) {
    const selected = pageCandidates[index];
    appendToOutputBuffer(selected.char);

    // Update user model with selection (MVP1.8)
    if (userModel && currentCandidates) {
      const actualIndex = currentPage * 6 + index; // Convert page index to actual index
      updateUserModel(currentCode, currentCandidates, actualIndex, userModel);
      saveUserModel(userModel);
      console.log(`[WebDaYi] User preference saved for code: ${currentCode}`);
    }

    clearInputBox();

    // Auto-copy after selection (MVP1.11 - v8)
    if (autoCopyEnabled) {
      const outputBuffer = document.getElementById('output-buffer');
      if (outputBuffer && performAutoCopy(outputBuffer.value)) {
        showCopyFeedback();
      }
    }
  }
}

/**
 * Handle pagination (cycle to next page)
 */
function handlePagination() {
  if (!currentCode || currentCandidates.length === 0) return;

  const totalPages = getTotalPages(currentCandidates);
  if (totalPages <= 1) return;

  // Cycle to next page
  currentPage = getNextPage(currentPage, totalPages);

  // Update UI
  updateCandidateArea(currentCandidates, currentPage);
}

/**
 * Navigate to previous page
 */
function handlePreviousPage() {
  if (!currentCode || currentCandidates.length === 0) return;

  const totalPages = getTotalPages(currentCandidates);
  if (totalPages <= 1 || currentPage === 0) return;

  currentPage--;
  updateCandidateArea(currentCandidates, currentPage);
}

/**
 * Navigate to next page
 */
function handleNextPage() {
  if (!currentCode || currentCandidates.length === 0) return;

  const totalPages = getTotalPages(currentCandidates);
  if (totalPages <= 1 || currentPage >= totalPages - 1) return;

  currentPage++;
  updateCandidateArea(currentCandidates, currentPage);
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
 * Clear the input box and reset state
 */
function clearInputBox() {
  const inputBox = document.getElementById('input-box');
  if (!inputBox) return;

  inputBox.value = '';
  currentCode = '';
  currentCandidates = [];
  currentPage = 0;
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

    // Load user model (MVP1.7)
    userModel = loadUserModel();
    console.log(`[WebDaYi] User model loaded: ${userModel.size} preferences`);

    // Set up event listeners
    const inputBox = document.getElementById('input-box');
    if (inputBox) {
      let previousValue = '';

      inputBox.addEventListener('input', (e) => {
        handleInput(e.target.value, previousValue);
        previousValue = e.target.value.trim().toLowerCase();
      });

      // Handle selection keys (Space, ', [, ], -, \), pagination (=), and backspace
      inputBox.addEventListener('keydown', (e) => {
        const key = e.key;

        // Handle backspace key for output buffer deletion
        if (key === 'Backspace') {
          const outputBuffer = document.getElementById('output-buffer');
          const inputValue = inputBox.value.trim().toLowerCase();

          // If input is empty and output has content, delete from output
          if (shouldDeleteFromOutput(inputValue, outputBuffer ? outputBuffer.value : '')) {
            e.preventDefault();
            if (outputBuffer) {
              outputBuffer.value = deleteLastCharFromOutput(outputBuffer.value);
            }
            return;
          }
          // Otherwise, let default backspace work on input
          // (It will naturally delete from input box)
          return;
        }

        // Handle pagination key (=)
        if (key === '=' && currentCode) {
          e.preventDefault();
          handlePagination();
          return;
        }

        // Handle selection keys
        const selectionIndex = getSelectionIndexFromKey(key);
        if (selectionIndex !== -1 && currentCode) {
          e.preventDefault();
          handleSelection(selectionIndex);
          previousValue = '';  // Reset after selection
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

    // Set up clear button (MVP1.11 - v8)
    const clearButton = document.getElementById('clear-button');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        const outputBuffer = document.getElementById('output-buffer');
        if (outputBuffer) {
          outputBuffer.value = '';
          showTemporaryFeedback('已清除');
        }
      });
    }

    // Set up candidate area click handlers (event delegation)
    const candidateArea = document.getElementById('candidate-area');
    if (candidateArea) {
      candidateArea.addEventListener('click', (e) => {
        // Handle candidate item click
        const candidateItem = e.target.closest('.candidate-item');
        if (candidateItem && candidateItem.dataset.index) {
          const index = parseInt(candidateItem.dataset.index, 10);
          handleSelection(index);
          return;
        }

        // Handle previous page button
        if (e.target.closest('.prev-page')) {
          handlePreviousPage();
          return;
        }

        // Handle next page button
        if (e.target.closest('.next-page')) {
          handleNextPage();
          return;
        }
      });

      // Add keyboard support for candidate items (accessibility)
      candidateArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const candidateItem = e.target.closest('.candidate-item');
          if (candidateItem && candidateItem.dataset.index) {
            e.preventDefault();
            const index = parseInt(candidateItem.dataset.index, 10);
            handleSelection(index);
          }
        }
      });
    }

    // Set up input mode toggle
    const modeToggleBtn = document.getElementById('mode-toggle-btn');
    if (modeToggleBtn) {
      modeToggleBtn.addEventListener('click', handleModeToggle);

      // Load saved mode from localStorage
      const savedMode = loadInputMode();
      applyInputMode(savedMode);

      console.log(`[WebDaYi] Input mode loaded: ${savedMode}`);
    }

    // Set up auto-copy toggle (MVP1.11 - v8)
    autoCopyEnabled = loadAutoCopyPreference();
    setupAutoCopyToggle();
    console.log(`[WebDaYi] Auto-copy loaded: ${autoCopyEnabled ? 'enabled' : 'disabled'}`);

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
