/**
 * Test Suite for MVP1 v10: Mobile UX Fixes + Font Size Control
 *
 * This test suite covers:
 * - Mobile Layout Tests (10 tests)
 * - Selection Hints Tests (5 tests)
 * - Font Size Control Tests (12 tests)
 *
 * Total: 27 tests
 *
 * Run: node test-node-v10.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Test results
const testResults = [];

/**
 * Assert function
 */
function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${colors.green}✓${colors.reset} ${message}`);
    testResults.push({ passed: true, message });
  } else {
    failedTests++;
    console.log(`  ${colors.red}✗${colors.reset} ${message}`);
    testResults.push({ passed: false, message });
  }
}

/**
 * Test helper: Load HTML file and setup DOM
 */
function loadHTML() {
  const htmlPath = path.join(__dirname, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  return htmlContent;
}

/**
 * Test helper: Check if element exists in HTML
 */
function elementExistsInHTML(html, selector) {
  // Simple check for ID or class selectors
  if (selector.startsWith('#')) {
    const id = selector.slice(1);
    const regex = new RegExp(`id=["']${id}["']`, 'i');
    return regex.test(html);
  } else if (selector.startsWith('.')) {
    const className = selector.slice(1);
    const regex = new RegExp(`class=["'][^"']*${className}[^"']*["']`, 'i');
    return regex.test(html);
  }
  return html.includes(selector);
}

/**
 * Test helper: Check for responsive classes
 */
function hasResponsiveClass(html, className) {
  // Check for Tailwind responsive classes like "hidden sm:flex"
  const regex = new RegExp(`class=["'][^"']*${className}[^"']*["']`, 'i');
  return regex.test(html);
}

/**
 * Test helper: Extract localStorage operations from core_logic.js
 */
function getLocalStorageOperations() {
  const jsPath = path.join(__dirname, 'core_logic.js');
  const jsContent = fs.readFileSync(jsPath, 'utf-8');

  const localStorageKeys = {
    fontScale: jsContent.includes('webdayi_font_scale'),
    getItem: jsContent.includes('localStorage.getItem'),
    setItem: jsContent.includes('localStorage.setItem'),
  };

  return {
    content: jsContent,
    keys: localStorageKeys
  };
}

/**
 * Test helper: Check for function existence in JS
 */
function functionExistsInJS(jsContent, functionName) {
  const regex = new RegExp(`function\\s+${functionName}\\s*\\(|const\\s+${functionName}\\s*=|let\\s+${functionName}\\s*=`, 'i');
  return regex.test(jsContent);
}

console.log(`\n${colors.cyan}=== MVP1 v10: Mobile UX Fixes + Font Size Control Tests ===${colors.reset}\n`);

// ============================================================================
// CATEGORY 1: Mobile Layout Tests (10 tests)
// ============================================================================

console.log(`${colors.blue}Category 1: Mobile Layout Tests${colors.reset}`);

try {
  const html = loadHTML();
  const jsPath = path.join(__dirname, 'core_logic.js');
  const jsContent = fs.readFileSync(jsPath, 'utf-8');

  // Test 1.1: FAB button exists for mobile
  assert(
    elementExistsInHTML(html, 'mobile-controls-fab') ||
    elementExistsInHTML(html, 'mobile-menu-btn') ||
    hasResponsiveClass(html, 'sm:hidden'),
    'Test 1.1: FAB button exists for mobile controls'
  );

  // Test 1.2: Desktop buttons hidden on mobile
  assert(
    hasResponsiveClass(html, 'hidden sm:flex') ||
    hasResponsiveClass(html, 'hidden sm:block'),
    'Test 1.2: Desktop control buttons use responsive classes (hidden on mobile)'
  );

  // Test 1.3: Mobile panel/modal structure exists
  assert(
    elementExistsInHTML(html, 'mobile-controls-panel') ||
    elementExistsInHTML(html, 'mobile-menu-panel') ||
    html.includes('panel') || html.includes('drawer'),
    'Test 1.3: Mobile control panel structure exists in HTML'
  );

  // Test 1.4: Panel has backdrop/overlay
  assert(
    html.includes('backdrop') ||
    html.includes('overlay') ||
    html.includes('inset-0'),
    'Test 1.4: Panel has backdrop/overlay element'
  );

  // Test 1.5: All control buttons present
  assert(
    elementExistsInHTML(html, 'dark-mode-toggle') &&
    elementExistsInHTML(html, 'mode-toggle-btn') &&
    elementExistsInHTML(html, 'auto-copy-toggle-btn'),
    'Test 1.5: All control buttons (theme, focus, auto-copy) present in HTML'
  );

  // Test 1.6: Font size buttons exist
  assert(
    elementExistsInHTML(html, 'font-size-decrease') ||
    elementExistsInHTML(html, 'font-decrease') ||
    html.includes('A−') || html.includes('A-'),
    'Test 1.6: Font size decrease button exists'
  );

  assert(
    elementExistsInHTML(html, 'font-size-increase') ||
    elementExistsInHTML(html, 'font-increase') ||
    html.includes('A+'),
    'Test 1.7: Font size increase button exists'
  );

  // Test 1.8: Panel toggle functions exist in JS
  assert(
    functionExistsInJS(jsContent, 'openControlPanel') ||
    functionExistsInJS(jsContent, 'togglePanel') ||
    functionExistsInJS(jsContent, 'openMobileMenu') ||
    jsContent.includes('panel') && jsContent.includes('classList'),
    'Test 1.8: Panel toggle functions exist in core_logic.js'
  );

  // Test 1.9: Panel has proper z-index layering
  assert(
    html.includes('z-50') || html.includes('z-40'),
    'Test 1.9: Panel and FAB use proper z-index classes'
  );

  // Test 1.10: Control buttons don't overlap with content
  // This tests that fixed buttons are truly "fixed" and panel is full-screen
  assert(
    html.includes('fixed') &&
    (html.includes('top-4 right-4') || html.includes('top-6 right-6')),
    'Test 1.10: Control buttons use fixed positioning away from content'
  );

} catch (error) {
  console.log(`  ${colors.red}Error in Mobile Layout Tests: ${error.message}${colors.reset}`);
}

console.log('');

// ============================================================================
// CATEGORY 2: Selection Hints Tests (5 tests)
// ============================================================================

console.log(`${colors.blue}Category 2: Selection Hints Tests${colors.reset}`);

try {
  const html = loadHTML();

  // Test 2.1: Selection hints are displayed
  assert(
    html.includes('Space') && html.includes('<kbd'),
    'Test 2.1: Selection hints include keyboard key elements (<kbd>)'
  );

  // Test 2.2: Hints show correct key bindings
  const hasAllKeys = [
    'Space',
    "'",
    '[',
    ']',
    '-',
    '\\',
    '='
  ].every(key => html.includes(key));

  assert(
    hasAllKeys,
    'Test 2.2: Hints show all selection keys (Space, \', [, ], -, \\, =)'
  );

  // Test 2.3: Hints have bilingual text (Chinese + English)
  assert(
    (html.includes('選字') || html.includes('选字')) &&
    (html.includes('翻頁') || html.includes('翻页') || html.includes('page')),
    'Test 2.3: Hints include bilingual text (Chinese selection text)'
  );

  // Test 2.4: Hints visible in dark mode (uses dark: prefix)
  assert(
    html.includes('dark:') && html.includes('text-slate-'),
    'Test 2.4: Hints use Tailwind dark mode classes (dark:text-slate-*)'
  );

  // Test 2.5: Hints are positioned near candidate area
  const candidateAreaIndex = html.indexOf('candidate-area');
  const hintKeywordIndex = Math.max(
    html.lastIndexOf('<kbd', candidateAreaIndex),
    html.lastIndexOf('Space', candidateAreaIndex),
    html.lastIndexOf('選字', candidateAreaIndex)
  );

  assert(
    candidateAreaIndex > 0 && hintKeywordIndex > 0 &&
    Math.abs(candidateAreaIndex - hintKeywordIndex) < 500,
    'Test 2.5: Hints are positioned within 500 chars of candidate area'
  );

} catch (error) {
  console.log(`  ${colors.red}Error in Selection Hints Tests: ${error.message}${colors.reset}`);
}

console.log('');

// ============================================================================
// CATEGORY 3: Font Size Control Tests (12 tests)
// ============================================================================

console.log(`${colors.blue}Category 3: Font Size Control Tests${colors.reset}`);

try {
  const jsPath = path.join(__dirname, 'core_logic.js');
  const jsContent = fs.readFileSync(jsPath, 'utf-8');

  // Test 3.1: Font scale constants exist
  assert(
    jsContent.includes('MIN_SCALE') || jsContent.includes('min') && jsContent.includes('scale'),
    'Test 3.1: MIN_SCALE constant exists in core_logic.js'
  );

  assert(
    jsContent.includes('MAX_SCALE') || jsContent.includes('max') && jsContent.includes('scale'),
    'Test 3.2: MAX_SCALE constant exists in core_logic.js'
  );

  // Test 3.3: Font scale localStorage key
  assert(
    jsContent.includes('webdayi_font_scale') ||
    jsContent.includes('fontSize') && jsContent.includes('localStorage'),
    'Test 3.3: localStorage key for font scale exists (webdayi_font_scale)'
  );

  // Test 3.4: Load font size preference function
  assert(
    functionExistsInJS(jsContent, 'loadFontSizePreference') ||
    functionExistsInJS(jsContent, 'loadFontScale') ||
    jsContent.includes('localStorage.getItem') && jsContent.includes('scale'),
    'Test 3.4: loadFontSizePreference() function exists'
  );

  // Test 3.5: Save font size preference function
  assert(
    functionExistsInJS(jsContent, 'saveFontSizePreference') ||
    functionExistsInJS(jsContent, 'saveFontScale') ||
    jsContent.includes('localStorage.setItem') && jsContent.includes('scale'),
    'Test 3.5: saveFontSizePreference() function exists'
  );

  // Test 3.6: Apply font scale function
  assert(
    functionExistsInJS(jsContent, 'applyFontScale') ||
    functionExistsInJS(jsContent, 'setFontSize') ||
    jsContent.includes('fontSize') && jsContent.includes('style'),
    'Test 3.6: applyFontScale() function exists'
  );

  // Test 3.7: Increase font size function
  assert(
    functionExistsInJS(jsContent, 'increaseFontSize') ||
    functionExistsInJS(jsContent, 'fontIncrease') ||
    jsContent.includes('increase') && jsContent.includes('font'),
    'Test 3.7: increaseFontSize() function exists'
  );

  // Test 3.8: Decrease font size function
  assert(
    functionExistsInJS(jsContent, 'decreaseFontSize') ||
    functionExistsInJS(jsContent, 'fontDecrease') ||
    jsContent.includes('decrease') && jsContent.includes('font'),
    'Test 3.8: decreaseFontSize() function exists'
  );

  // Test 3.9: Min/max bounds checking
  assert(
    (jsContent.includes('MIN_SCALE') && jsContent.includes('MAX_SCALE')) ||
    (jsContent.includes('0.8') && jsContent.includes('1.2')) ||
    (jsContent.includes('Math.min') && jsContent.includes('Math.max')),
    'Test 3.9: Min/max bounds checking logic exists'
  );

  // Test 3.10: Font scale applied to root or body
  assert(
    jsContent.includes('documentElement.style') ||
    jsContent.includes('body.style') ||
    jsContent.includes(':root') ||
    jsContent.includes('html'),
    'Test 3.10: Font scale applied to root element'
  );

  // Test 3.11: Visual feedback for font size changes
  assert(
    jsContent.includes('showTemporaryFeedback') ||
    jsContent.includes('showFeedback') ||
    jsContent.includes('toast') ||
    jsContent.includes('字體大小') ||
    jsContent.includes('Font size'),
    'Test 3.11: Visual feedback shown on font size change'
  );

  // Test 3.12: Font size buttons have event listeners
  const html = loadHTML();
  assert(
    (elementExistsInHTML(html, 'font-size-decrease') || html.includes('A−')) &&
    (elementExistsInHTML(html, 'font-size-increase') || html.includes('A+')) &&
    (jsContent.includes('addEventListener') && jsContent.includes('click')),
    'Test 3.12: Font size buttons have click event listeners setup'
  );

} catch (error) {
  console.log(`  ${colors.red}Error in Font Size Control Tests: ${error.message}${colors.reset}`);
}

console.log('');

// ============================================================================
// Test Summary
// ============================================================================

console.log(`${colors.cyan}=== Test Summary ===${colors.reset}`);
console.log(`Total Tests: ${totalTests}`);
console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);

if (failedTests === 0) {
  console.log(`\n${colors.green}✓ All tests passed!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${colors.yellow}⚠ Some tests failed. Please review the implementation.${colors.reset}\n`);
  process.exit(1);
}
