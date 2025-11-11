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
let languageMode = 'chinese';  // Language mode: 'chinese' | 'english' (Issue 3 - English mixed input)

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
 * Show visual feedback after auto-copy (MVP1.11) - Updated for Tailwind CSS
 * Displays brief toast notification
 */
function showCopyFeedback() {
  // Handle Node.js test environment (no document)
  if (typeof document === 'undefined') return;

  const toast = document.getElementById('copy-toast');
  if (!toast) return;  // Gracefully handle missing element

  // Show toast (Tailwind CSS)
  toast.classList.remove('hidden');
  toast.classList.add('flex');

  // Hide after 2 seconds
  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('flex');
  }, 2000);
}

/**
 * Setup auto-copy toggle button (MVP1.11) - Updated for Tailwind CSS
 * Initializes toggle button event handlers and UI state
 */
function setupAutoCopyToggle() {
  // Handle Node.js test environment (no document)
  if (typeof document === 'undefined') return;

  const toggleBtn = document.getElementById('auto-copy-toggle-btn');
  if (!toggleBtn) return;  // Gracefully handle missing element

  /**
   * Update toggle button UI state (Tailwind CSS classes)
   */
  function updateToggleUI() {
    const label = toggleBtn.querySelector('.auto-copy-label');

    if (autoCopyEnabled) {
      // Active state: primary color with filled background
      toggleBtn.classList.remove('bg-white', 'dark:bg-slate-800', 'border-slate-200', 'dark:border-slate-700', 'text-slate-700', 'dark:text-slate-300');
      toggleBtn.classList.add('bg-primary', 'border-primary', 'text-white');
      if (label) label.textContent = 'Auto ✓';
      toggleBtn.setAttribute('aria-label', '關閉自動複製');
    } else {
      // Inactive state: white background with border
      toggleBtn.classList.remove('bg-primary', 'border-primary', 'text-white');
      toggleBtn.classList.add('bg-white', 'dark:bg-slate-800', 'border-slate-200', 'dark:border-slate-700', 'text-slate-700', 'dark:text-slate-300');
      if (label) label.textContent = 'Auto';
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

// ============================================================================
// Font Size Control (MVP1 v10)
// ============================================================================

// Font scale constants
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.2;
const SCALE_STEP = 0.1;
let currentFontScale = 1.0;

/**
 * Load font size preference from localStorage
 */
function loadFontSizePreference() {
  if (typeof localStorage === 'undefined') return;

  const saved = localStorage.getItem('webdayi_font_scale');
  if (saved) {
    currentFontScale = parseFloat(saved);
    applyFontScale(currentFontScale);
  }
}

/**
 * Save font size preference to localStorage
 * @param {number} scale - Font scale value
 */
function saveFontSizePreference(scale) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('webdayi_font_scale', scale.toString());
}

/**
 * Apply font scale to document root
 * @param {number} scale - Font scale value (0.8 to 1.2)
 */
function applyFontScale(scale) {
  if (typeof document === 'undefined') return;

  // Apply to root element
  document.documentElement.style.fontSize = `${scale * 100}%`;
  currentFontScale = scale;

  // Update mobile display
  const mobileDisplay = document.getElementById('font-scale-display-mobile');
  if (mobileDisplay) {
    mobileDisplay.textContent = `${Math.round(scale * 100)}%`;
  }
}

/**
 * Increase font size
 */
function increaseFontSize() {
  if (currentFontScale < MAX_SCALE) {
    const newScale = Math.min(currentFontScale + SCALE_STEP, MAX_SCALE);
    applyFontScale(newScale);
    saveFontSizePreference(newScale);
    showTemporaryFeedback(`字體大小: ${Math.round(newScale * 100)}%`);
  }
}

/**
 * Decrease font size
 */
function decreaseFontSize() {
  if (currentFontScale > MIN_SCALE) {
    const newScale = Math.max(currentFontScale - SCALE_STEP, MIN_SCALE);
    applyFontScale(newScale);
    saveFontSizePreference(newScale);
    showTemporaryFeedback(`字體大小: ${Math.round(newScale * 100)}%`);
  }
}

/**
 * Setup font size control buttons
 */
function setupFontSizeControl() {
  if (typeof document === 'undefined') return;

  // Load saved preference
  loadFontSizePreference();

  // Desktop buttons
  const decreaseBtn = document.getElementById('font-size-decrease-btn');
  const increaseBtn = document.getElementById('font-size-increase-btn');

  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', decreaseFontSize);
  }

  if (increaseBtn) {
    increaseBtn.addEventListener('click', increaseFontSize);
  }

  // Mobile buttons
  const decreaseBtnMobile = document.getElementById('font-size-decrease-btn-mobile');
  const increaseBtnMobile = document.getElementById('font-size-increase-btn-mobile');

  if (decreaseBtnMobile) {
    decreaseBtnMobile.addEventListener('click', decreaseFontSize);
  }

  if (increaseBtnMobile) {
    increaseBtnMobile.addEventListener('click', increaseFontSize);
  }
}

// ============================================================================
// Mobile Control Panel (MVP1 v10)
// ============================================================================

/**
 * Open mobile control panel
 */
function openMobilePanel() {
  if (typeof document === 'undefined') return;

  const panel = document.getElementById('mobile-controls-panel');
  if (panel) {
    panel.classList.remove('hidden');
  }
}

/**
 * Close mobile control panel
 */
function closeMobilePanel() {
  if (typeof document === 'undefined') return;

  const panel = document.getElementById('mobile-controls-panel');
  if (panel) {
    panel.classList.add('hidden');
  }
}

/**
 * Setup mobile control panel
 */
function setupMobileControlPanel() {
  if (typeof document === 'undefined') return;

  // FAB button
  const fab = document.getElementById('mobile-controls-fab');
  if (fab) {
    fab.addEventListener('click', openMobilePanel);
  }

  // Mobile control buttons - sync with desktop
  const darkModeToggleMobile = document.getElementById('dark-mode-toggle-mobile');
  if (darkModeToggleMobile) {
    darkModeToggleMobile.addEventListener('click', () => {
      // Trigger desktop button click
      const desktopBtn = document.getElementById('dark-mode-toggle');
      if (desktopBtn) desktopBtn.click();
    });
  }

  const modeToggleMobile = document.getElementById('mode-toggle-btn-mobile');
  if (modeToggleMobile) {
    modeToggleMobile.addEventListener('click', () => {
      // Trigger desktop button click
      const desktopBtn = document.getElementById('mode-toggle-btn');
      if (desktopBtn) desktopBtn.click();
      // Update mobile label
      const label = document.getElementById('mode-label-mobile');
      if (label) {
        setTimeout(() => {
          label.textContent = currentInputMode === 'express' ? '一般模式 (Normal Mode)' : '專注模式 (Focus Mode)';
        }, 100);
      }
    });
  }

  const autoCopyToggleMobile = document.getElementById('auto-copy-toggle-btn-mobile');
  if (autoCopyToggleMobile) {
    autoCopyToggleMobile.addEventListener('click', () => {
      // Trigger desktop button click
      const desktopBtn = document.getElementById('auto-copy-toggle-btn');
      if (desktopBtn) desktopBtn.click();
      // Update mobile label
      const label = autoCopyToggleMobile.querySelector('.auto-copy-label-mobile');
      if (label) {
        setTimeout(() => {
          label.textContent = autoCopyEnabled ? '自動複製 ✓ (Auto-Copy ✓)' : '自動複製 (Auto-Copy)';
        }, 100);
      }
    });
  }
}

/**
 * Show temporary feedback message (MVP1.11)
 * Preserves HTML structure (icon + text) - v10 bugfix
 * @param {string} message - Message to show
 */
function showTemporaryFeedback(message) {
  // Handle Node.js test environment (no document)
  if (typeof document === 'undefined') return;

  const toast = document.getElementById('copy-toast');
  if (!toast) return;

  // Find the text span (second span element) to preserve HTML structure
  const textSpan = toast.querySelector('div > span:last-child');

  if (!textSpan) {
    // Fallback: if structure doesn't exist, use plain text (backward compatibility)
    const originalText = toast.textContent;
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('flex');

    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('flex');
      toast.textContent = originalText;
    }, 2000);
    return;
  }

  // Update only the text span, preserving HTML structure (icon remains)
  const originalText = textSpan.textContent;
  textSpan.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('flex');

  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('flex');
    textSpan.textContent = originalText;  // Restore original text
  }, 2000);
}

/**
 * Update language mode indicator visibility
 * @param {string} mode - 'chinese' or 'english'
 */
function updateLanguageModeIndicator(mode) {
  // Handle Node.js test environment (no document)
  if (typeof document === 'undefined') return;

  const indicator = document.getElementById('language-mode-indicator');
  if (!indicator) return;

  if (mode === 'english') {
    indicator.classList.remove('hidden');
    indicator.classList.add('flex');
  } else {
    indicator.classList.add('hidden');
    indicator.classList.remove('flex');
  }
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
 * Apply input mode to UI (updated for Tailwind CSS)
 * @param {string} mode - Mode to apply
 */
function applyInputMode(mode) {
  if (typeof document === 'undefined') return;

  currentInputMode = mode;

  // Hide/show elements for express mode (using new element IDs)
  const elementsToHide = [
    'app-header',
    'instructions-section',
    'debug-section',
    'app-footer'
  ];

  elementsToHide.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (mode === 'express') {
        element.classList.add('hidden');
      } else {
        element.classList.remove('hidden');
      }
    }
  });

  // Update toggle button text if it exists
  const toggleButton = document.getElementById('mode-toggle-btn');
  if (toggleButton) {
    const label = toggleButton.querySelector('span:not(.material-symbols-outlined)');
    if (label) {
      label.textContent = mode === 'normal' ? 'Focus' : 'Normal';
    }
    const icon = toggleButton.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = mode === 'normal' ? 'center_focus_strong' : 'fullscreen_exit';
    }
    toggleButton.setAttribute('aria-label', mode === 'normal' ? '切換至專注模式' : '切換至正常模式');
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
  // CRITICAL FIX (v11 UX): Disable auto-select in sentence mode
  // Sentence mode buffers codes instead of auto-selecting
  if (typeof isSentenceMode === 'function' && isSentenceMode()) {
    return false;
  }

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
 * @returns {string} - HTML string with new selection keys (Tailwind CSS)
 */
function renderCandidatesHTML(candidates, pageIndex = 0, totalPages = 1) {
  if (!candidates || candidates.length === 0) {
    return '';
  }

  // Selection key hints for first 6 candidates
  const SELECTION_KEY_HINTS = {
    0: 'Space',
    1: "'",
    2: '[',
    3: ']',
    4: '-',
    5: '\\'
  };

  // Get candidates for current page (max 6)
  const pageCandidates = getCandidatesForPage(candidates, pageIndex);

  const candidatesHtml = pageCandidates
    .map((candidate, index) => {
      // Use Tailwind CSS classes for modern styling
      const highlightClass = index === 0 ?
        'bg-primary text-white ring-2 ring-primary' :
        'bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700';

      // Get key hint for first 6 candidates
      const keyHint = SELECTION_KEY_HINTS[index];
      const keyHintHtml = keyHint ?
        `<kbd class="ml-1.5 px-1.5 py-0.5 text-xs font-mono bg-white/20 dark:bg-black/20 rounded">${keyHint}</kbd>` :
        '';

      return `<button class="candidate-item flex h-9 shrink-0 cursor-pointer items-center justify-center gap-x-1 rounded-md px-3 transition-all ${highlightClass}"
                      data-index="${index}"
                      role="button"
                      tabindex="0"
                      aria-label="選擇 ${candidate.char}，按 ${keyHint || (index + 1)}">
        <p class="text-sm font-medium">${index + 1}. ${candidate.char}</p>
        ${keyHintHtml}
      </button>`;
    })
    .join('');

  // Add pagination controls if needed
  if (totalPages > 1) {
    const prevDisabled = pageIndex === 0;
    const nextDisabled = pageIndex === totalPages - 1;

    const prevClass = prevDisabled ?
      'opacity-40 cursor-not-allowed' :
      'cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/30';
    const nextClass = nextDisabled ?
      'opacity-40 cursor-not-allowed' :
      'cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/30';

    const pageControls = `<div class="w-full mt-3 flex items-center justify-center gap-3 p-3 bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-lg">
      <button class="flex h-9 items-center gap-2 px-4 rounded-md bg-white dark:bg-slate-800 text-sm font-medium text-primary transition-all prev-page ${prevClass}"
              ${prevDisabled ? 'disabled' : ''}
              aria-label="上一頁">
        <span class="material-symbols-outlined text-base">chevron_left</span>
        <span>上一頁</span>
      </button>
      <span class="text-sm font-medium text-slate-700 dark:text-slate-300">第 ${pageIndex + 1}/${totalPages} 頁 <kbd class="ml-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">=</kbd> 換頁</span>
      <button class="flex h-9 items-center gap-2 px-4 rounded-md bg-white dark:bg-slate-800 text-sm font-medium text-primary transition-all next-page ${nextClass}"
              ${nextDisabled ? 'disabled' : ''}
              aria-label="下一頁">
        <span>下一頁</span>
        <span class="material-symbols-outlined text-base">chevron_right</span>
      </button>
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
  // CRITICAL FIX (v11 UX): Skip in sentence mode to prevent interference
  // Sentence mode has its own input handler in core_logic_v11_ui.js
  if (typeof isSentenceMode === 'function' && isSentenceMode()) {
    return;  // Let v11 handler manage sentence mode
  }

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
    candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">沒有候選字</div>';
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
      const originalHTML = copyButton.innerHTML;
      copyButton.innerHTML = '<span class="material-symbols-outlined text-base">check_circle</span><span>已複製！</span>';
      copyButton.style.background = '#4caf50';
      setTimeout(() => {
        copyButton.innerHTML = originalHTML;
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
        // NEW (Issue 3): English mode - direct output
        if (languageMode === 'english') {
          const outputBuffer = document.getElementById('output-buffer');
          if (outputBuffer && e.target.value) {
            outputBuffer.value += e.target.value;

            // Auto-copy if enabled
            if (autoCopyEnabled && performAutoCopy(outputBuffer.value)) {
              showCopyFeedback();
            }
          }
          inputBox.value = ''; // Clear input after appending
          return; // Skip all Chinese logic
        }

        // Chinese mode: Normal processing
        handleInput(e.target.value, previousValue);
        previousValue = e.target.value.trim().toLowerCase();
      });

      // Mobile space key fix: Flag to prevent duplicate handling
      let spaceHandledByKeydown = false;

      // Handle selection keys (Space, ', [, ], -, \), pagination (=), backspace, and delete
      inputBox.addEventListener('keydown', (e) => {
        const key = e.key;

        // Check if in sentence mode (v11 UX fix)
        const isInSentenceMode = (typeof isSentenceMode === 'function' && isSentenceMode());

        // NEW (Issue 3): Handle Shift key for language mode toggle
        if (key === 'Shift') {
          e.preventDefault();

          // Toggle language mode
          languageMode = (languageMode === 'chinese' ? 'english' : 'chinese');

          // Update UI indicator
          updateLanguageModeIndicator(languageMode);

          console.log(`[Language Mode] Switched to: ${languageMode}`);
          return;
        }

        // Handle Delete key for clearing all areas (v11 UX enhancement)
        if (key === 'Delete') {
          e.preventDefault();

          // Clear output buffer
          const outputBuffer = document.getElementById('output-buffer');
          if (outputBuffer) {
            outputBuffer.value = '';
          }

          // Clear candidate area
          const candidateArea = document.getElementById('candidate-area');
          if (candidateArea) {
            candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">已清除所有內容</div>';
          }

          // Clear sentence mode buffer if in sentence mode
          if (isInSentenceMode) {
            if (typeof clearCodeBuffer === 'function') clearCodeBuffer();
            if (typeof updateBufferDisplay === 'function') updateBufferDisplay();
            if (typeof updateLivePreviewDisplay === 'function') updateLivePreviewDisplay();
          }

          showTemporaryFeedback('已清除所有區域');
          return;
        }

        // CRITICAL: Handle = and Space keys BEFORE the sentence mode early return
        // Otherwise these handlers will never execute in sentence mode!

        // Handle backspace key for output buffer deletion (character mode only)
        if (key === 'Backspace') {
          // In sentence mode, let v11_ui.js handle Backspace (removes from code buffer)
          if (isInSentenceMode) {
            return;  // Don't handle Backspace in sentence mode
          }

          // Character mode: Handle output buffer deletion
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

        // Handle = key (REDESIGNED - UX-SPACE-KEY-REDESIGN.md)
        // = key behavior:
        // - Sentence mode: Confirm prediction and output
        // - Character mode: Pagination (unchanged)
        if (key === '=') {
          console.log(`[= Handler] Running - Sentence mode: ${isInSentenceMode}`);
          e.preventDefault();

          if (isInSentenceMode) {
            // NEW: Trigger prediction + output (ONE step!)
            // NOTE: Function is defined as window.triggerPrediction in core_logic_v11_ui.js
            console.log(`[= Handler] Calling triggerPrediction, window.triggerPrediction exists: ${typeof window !== 'undefined' && typeof window.triggerPrediction === 'function'}`);
            if (typeof window !== 'undefined' && typeof window.triggerPrediction === 'function') {
              window.triggerPrediction();
            } else if (typeof triggerPrediction === 'function') {
              // Fallback for Node.js tests (but async, so won't work perfectly)
              triggerPrediction();
            } else {
              console.error('[= Handler] triggerPrediction function not found!');
            }
          } else {
            // Character mode: Pagination (unchanged)
            console.log('[= Handler] Character mode - pagination');
            if (currentCode) {
              handlePagination();
            }
          }
          return;
        }

        // Handle Space key (REDESIGNED - UX-SPACE-KEY-REDESIGN.md)
        // Space key behavior:
        // - Sentence mode: Add code to buffer + trigger prediction (NEVER select!)
        // - Character mode: Select first candidate (unchanged)
        if (key === ' ') {
          console.log(`[Space Handler] Running - Sentence mode: ${isInSentenceMode}, Input: "${inputBox.value}"`);
          e.preventDefault();

          // Mobile fix: Set flag to prevent duplicate handling in input event
          spaceHandledByKeydown = true;
          setTimeout(() => {
            spaceHandledByKeydown = false;
          }, 100);

          if (isInSentenceMode) {
            const inputValue = inputBox.value.trim();
            console.log(`[Space Handler] Input value: "${inputValue}", Length: ${inputValue.length}`);

            if (inputValue.length > 0) {
              // Add code to buffer (works for both single and double char)
              if (typeof addToCodeBuffer === 'function') {
                const added = addToCodeBuffer(inputValue, dayiMap);
                console.log(`[Space Handler] addToCodeBuffer returned: ${added}`);

                if (added) {
                  // Clear input
                  clearInputBox();

                  // Update buffer display (NO prediction!)
                  // NOTE: Space should ONLY buffer, = key triggers prediction
                  if (typeof window !== 'undefined' && typeof window.updateBufferDisplay === 'function') {
                    console.log('[Space Handler] Calling updateBufferDisplay...');
                    window.updateBufferDisplay();
                  } else {
                    console.warn('[Space Handler] updateBufferDisplay not found!');
                  }
                  if (typeof window !== 'undefined' && typeof window.updateLivePreviewDisplay === 'function') {
                    console.log('[Space Handler] Calling updateLivePreviewDisplay...');
                    window.updateLivePreviewDisplay();
                  } else {
                    console.warn('[Space Handler] updateLivePreviewDisplay not found!');
                  }
                  console.log('[Space Handler] Code added to buffer successfully');
                } else {
                  console.warn('[Space Handler] addToCodeBuffer failed - invalid code?');
                }
              }
            } else {
              console.log('[Space Handler] Input empty, ignoring');
            }
            return;
          }

          // Character mode: Select first candidate (unchanged)
          if (currentCode && currentCandidates.length > 0) {
            handleSelection(0);  // Select first candidate
            previousValue = '';  // Reset after selection
          }
          return;
        }

        // Skip remaining character mode logic if in sentence mode
        // (Space, =, Delete, Shift, Backspace are handled above for both modes)
        if (isInSentenceMode) {
          return;  // Let v11 handlers manage other sentence mode interactions
        }

        // === CHARACTER MODE LOGIC BELOW ===

        // Handle selection keys (', [, ], -, \)
        // Note: Space is handled separately above
        const selectionIndex = getSelectionIndexFromKey(key);
        if (selectionIndex !== -1) {
          e.preventDefault();

          // Character mode: Selection
          if (currentCode) {
            handleSelection(selectionIndex);
            previousValue = '';  // Reset after selection
          }
        }
        // Note: 0-9 and other chars will naturally go into the input
        // because they're not prevented
      });

      // Mobile space key fix: Handle space insertion via input event
      // This catches cases where virtual keyboards insert space without triggering keydown
      inputBox.addEventListener('input', (e) => {
        // Skip if already handled by keydown (desktop/physical keyboard)
        if (spaceHandledByKeydown) {
          console.log('[Mobile Space] Skipping - already handled by keydown');
          return;
        }

        // Check if in sentence mode
        const isInSentenceMode = (typeof isSentenceMode === 'function' && isSentenceMode());
        if (!isInSentenceMode) return;

        // Check if in English mode
        if (languageMode === 'english') return;

        const value = inputBox.value;

        // Check if space was inserted at the end (mobile virtual keyboard behavior)
        if (value.endsWith(' ')) {
          console.log('[Mobile Space] Detected space insertion:', value);

          const codeWithoutSpace = value.trim();

          if (codeWithoutSpace.length > 0) {
            // Valid code, add to buffer
            console.log('[Mobile Space] Attempting to buffer code:', codeWithoutSpace);

            if (typeof addToCodeBuffer === 'function') {
              const added = addToCodeBuffer(codeWithoutSpace, dayiMap);

              if (added) {
                // Clear input
                clearInputBox();

                // Update buffer display
                if (typeof window !== 'undefined' && typeof window.updateBufferDisplay === 'function') {
                  console.log('[Mobile Space] Calling updateBufferDisplay...');
                  window.updateBufferDisplay();
                } else {
                  console.warn('[Mobile Space] updateBufferDisplay not found!');
                }
                if (typeof window !== 'undefined' && typeof window.updateLivePreviewDisplay === 'function') {
                  console.log('[Mobile Space] Calling updateLivePreviewDisplay...');
                  window.updateLivePreviewDisplay();
                } else {
                  console.warn('[Mobile Space] updateLivePreviewDisplay not found!');
                }

                console.log('[Mobile Space] Code buffered successfully:', codeWithoutSpace);
              } else {
                console.warn('[Mobile Space] addToCodeBuffer failed - invalid code?');
                // Leave the space in so user sees "v " as invalid code (current behavior)
              }
            }
          } else {
            // Just remove the space if input was empty
            console.log('[Mobile Space] Empty input, removing space');
            inputBox.value = codeWithoutSpace;
          }
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

    // Set up font size control (MVP1 v10)
    setupFontSizeControl();
    console.log(`[WebDaYi] Font size control initialized: ${Math.round(currentFontScale * 100)}%`);

    // Set up mobile control panel (MVP1 v10)
    setupMobileControlPanel();
    console.log('[WebDaYi] Mobile control panel initialized');

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
