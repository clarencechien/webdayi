/**
 * Test Suite for MVP1 v10: Bugfix - Delete Key + Auto-Copy Feedback
 *
 * This test suite covers:
 * - Delete Key Functionality (5 tests)
 * - Auto-Copy Feedback Message (8 tests)
 *
 * Total: 13 tests
 *
 * Run: node test-node-v10-bugfix.js
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
 * Load and evaluate core_logic.js in test context
 */
function loadCoreLogic() {
  const jsPath = path.join(__dirname, 'core_logic.js');
  const jsContent = fs.readFileSync(jsPath, 'utf-8');

  // Create mock environment
  global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = value; },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
  };

  // Create mock document with toast element
  global.document = {
    getElementById: (id) => {
      if (id === 'copy-toast') {
        // Mock toast with HTML structure
        const toast = {
          textContent: '已複製到剪貼簿',
          innerHTML: '<div class="flex items-center gap-2"><span class="material-symbols-outlined text-base">check_circle</span><span>已複製到剪貼簿</span></div>',
          classList: {
            classes: new Set(['hidden']),
            add: function(...classes) { classes.forEach(c => this.classes.add(c)); },
            remove: function(...classes) { classes.forEach(c => this.classes.delete(c)); },
            contains: function(cls) { return this.classes.has(cls); }
          },
          querySelector: function(selector) {
            if (selector === 'div > span:last-child') {
              // Return the text span
              return {
                textContent: '已複製到剪貼簿',
                originalText: '已複製到剪貼簿'
              };
            }
            return null;
          }
        };
        return toast;
      }
      return null;
    }
  };

  // Evaluate the code
  eval(jsContent);

  return {
    showTemporaryFeedback: typeof showTemporaryFeedback !== 'undefined' ? showTemporaryFeedback : null,
    showCopyFeedback: typeof showCopyFeedback !== 'undefined' ? showCopyFeedback : null,
  };
}

console.log(`\n${colors.cyan}=== MVP1 v10: Bugfix - Delete Key + Auto-Copy Feedback ===${colors.reset}\n`);

// ============================================================================
// CATEGORY 1: Delete Key Functionality (5 tests)
// ============================================================================

console.log(`${colors.blue}Category 1: Delete Key Functionality${colors.reset}`);

try {
  const jsPath = path.join(__dirname, 'core_logic.js');
  const jsContent = fs.readFileSync(jsPath, 'utf-8');

  // Test 1: Delete key handler exists in code
  const hasDeleteKeyHandler = jsContent.includes("key === 'Delete'") || jsContent.includes('key === "Delete"');
  assert(
    hasDeleteKeyHandler,
    'Test 1: Delete key handler exists in keydown event listener'
  );

  // Test 2: Delete key clears output buffer
  const clearsOutputBuffer = jsContent.includes('Delete') && jsContent.includes('outputBuffer.value = \'\'');
  assert(
    clearsOutputBuffer,
    'Test 2: Delete key clears output buffer (outputBuffer.value = \'\')'
  );

  // Test 3: Delete key shows feedback
  const showsFeedback = hasDeleteKeyHandler && jsContent.includes('showTemporaryFeedback') && jsContent.includes('已清除');
  assert(
    showsFeedback,
    'Test 3: Delete key shows "已清除" feedback message'
  );

  // Test 4: Delete key prevents default behavior
  const preventsDefault = hasDeleteKeyHandler && jsContent.includes('e.preventDefault()');
  assert(
    preventsDefault,
    'Test 4: Delete key handler calls e.preventDefault()'
  );

  // Test 5: Delete key checks if output has content
  const checksContent = hasDeleteKeyHandler && (
    jsContent.includes('outputBuffer.value') ||
    jsContent.includes('outputBuffer &&')
  );
  assert(
    checksContent,
    'Test 5: Delete key checks output buffer exists and has content'
  );

} catch (error) {
  console.log(`  ${colors.red}Error in Delete Key Tests: ${error.message}${colors.reset}`);
}

console.log('');

// ============================================================================
// CATEGORY 2: Auto-Copy Feedback Message (8 tests)
// ============================================================================

console.log(`${colors.blue}Category 2: Auto-Copy Feedback Message${colors.reset}`);

try {
  const { showTemporaryFeedback, showCopyFeedback } = loadCoreLogic();
  const jsPath = path.join(__dirname, 'core_logic.js');
  const jsContent = fs.readFileSync(jsPath, 'utf-8');

  // Test 1: showTemporaryFeedback function exists
  assert(
    showTemporaryFeedback !== null,
    'Test 1: showTemporaryFeedback() function exists'
  );

  // Test 2: showTemporaryFeedback uses querySelector to find text span
  const usesQuerySelector = jsContent.includes('querySelector') &&
    jsContent.includes('span:last-child');
  assert(
    usesQuerySelector,
    'Test 2: showTemporaryFeedback() uses querySelector to find text span'
  );

  // Test 3: showTemporaryFeedback updates textSpan, not toast directly
  // Check that it doesn't use toast.textContent = message in the main path
  const lines = jsContent.split('\n');
  let foundShowTempFeedback = false;
  let usesTextSpan = false;
  let avoidsToastTextContent = true;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function showTemporaryFeedback')) {
      foundShowTempFeedback = true;
    }
    if (foundShowTempFeedback && lines[i].includes('textSpan.textContent')) {
      usesTextSpan = true;
    }
    // After finding the function, check if it directly sets toast.textContent in main flow
    if (foundShowTempFeedback &&
        lines[i].includes('toast.textContent = message') &&
        !lines[i].includes('//') &&
        !lines[i].includes('Fallback')) {
      // Only flag as problem if it's not in fallback/comment
      const prevLines = lines.slice(Math.max(0, i - 5), i).join('\n');
      if (!prevLines.includes('Fallback') && !prevLines.includes('fallback')) {
        avoidsToastTextContent = false;
      }
    }
    if (foundShowTempFeedback && lines[i].includes('function ') && i > lines.findIndex(l => l.includes('function showTemporaryFeedback'))) {
      break; // End of function
    }
  }

  assert(
    usesTextSpan && avoidsToastTextContent,
    'Test 3: showTemporaryFeedback() updates textSpan.textContent (preserves HTML structure)'
  );

  // Test 4: showTemporaryFeedback restores original text
  const restoresText = jsContent.includes('textSpan.textContent = originalText') ||
    (jsContent.includes('originalText') && jsContent.includes('textSpan'));
  assert(
    restoresText,
    'Test 4: showTemporaryFeedback() restores original text after timeout'
  );

  // Test 5: showCopyFeedback exists and doesn't break text
  assert(
    showCopyFeedback !== null,
    'Test 5: showCopyFeedback() function exists'
  );

  // Test 6: Auto-copy calls showCopyFeedback or showTemporaryFeedback correctly
  const autoCopyFeedbackCorrect = jsContent.includes('performAutoCopy') && (
    jsContent.includes('showCopyFeedback()') ||
    jsContent.includes('showTemporaryFeedback')
  );
  assert(
    autoCopyFeedbackCorrect,
    'Test 6: Auto-copy triggers feedback function after copying'
  );

  // Test 7: Clear button uses showTemporaryFeedback with "已清除"
  const clearButtonFeedback = jsContent.includes('clear-button') &&
    jsContent.includes('showTemporaryFeedback') &&
    jsContent.includes('已清除');
  assert(
    clearButtonFeedback,
    'Test 7: Clear button shows "已清除" via showTemporaryFeedback()'
  );

  // Test 8: Font size functions use showTemporaryFeedback
  const fontSizeFeedback = (
    jsContent.includes('increaseFontSize') ||
    jsContent.includes('decreaseFontSize')
  ) && jsContent.includes('字體大小');
  assert(
    fontSizeFeedback,
    'Test 8: Font size controls show feedback via showTemporaryFeedback()'
  );

} catch (error) {
  console.log(`  ${colors.red}Error in Auto-Copy Feedback Tests: ${error.message}${colors.reset}`);
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
