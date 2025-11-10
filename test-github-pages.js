#!/usr/bin/env node

/**
 * Test: GitHub Pages Deployment Validation
 *
 * This test ensures that GitHub Pages will correctly serve the WebDaYi application.
 *
 * Issue History:
 * - 2025-11-06: GitHub Pages was showing README.md instead of index.html
 * - Root cause: No index.html in root directory
 * - Solution: Created redirect index.html in root → mvp1/index.html
 *
 * This test prevents regression by validating:
 * 1. Root index.html exists
 * 2. Root index.html redirects to mvp1/index.html
 * 3. mvp1/index.html exists and is the main application
 * 4. Express Mode toggle exists in mvp1/index.html
 */

const fs = require('fs');
const path = require('path');

// Test utilities
let testCount = 0;
let passCount = 0;

function assert(condition, message) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`✓ Test ${testCount}: ${message}`);
  } else {
    console.error(`✗ Test ${testCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

function assertContains(content, substring, message) {
  assert(content.includes(substring), `${message} (should contain: "${substring}")`);
}

function assertFileExists(filepath, message) {
  assert(fs.existsSync(filepath), `${message} (file: ${filepath})`);
}

// Run tests
console.log('=== GitHub Pages Deployment Validation ===\n');

// Test 1: Root index.html exists
console.log('Test Group 1: Root Redirect Configuration');
const rootIndexPath = path.join(__dirname, 'index.html');
assertFileExists(rootIndexPath, 'Root index.html must exist for GitHub Pages');

// Test 2: Root index.html contains redirect
const rootIndexContent = fs.readFileSync(rootIndexPath, 'utf-8');
assertContains(
  rootIndexContent,
  'mvp1/index.html',
  'Root index.html must redirect to mvp1/index.html'
);

// Test 3: Root index.html has meta refresh fallback
assertContains(
  rootIndexContent,
  'meta http-equiv="refresh"',
  'Root index.html must have meta refresh fallback for JS-disabled browsers'
);

// Test 4: Root index.html has JavaScript redirect
assertContains(
  rootIndexContent,
  'window.location.href',
  'Root index.html must have JavaScript redirect for fast redirection'
);

// Test 5: Root index.html has manual fallback link
assertContains(
  rootIndexContent,
  '<a href="mvp1/index.html"',
  'Root index.html must have manual fallback link'
);

console.log('\nTest Group 2: MVP1 Application Validation');

// Test 6: mvp1/index.html exists
const mvp1IndexPath = path.join(__dirname, 'mvp1', 'index.html');
assertFileExists(mvp1IndexPath, 'mvp1/index.html must exist as main application');

// Test 7: mvp1/index.html is a complete HTML document
const mvp1IndexContent = fs.readFileSync(mvp1IndexPath, 'utf-8');
assertContains(
  mvp1IndexContent,
  '<!DOCTYPE html>',
  'mvp1/index.html must be a complete HTML document'
);

// Test 8: mvp1/index.html contains WebDaYi title
assertContains(
  mvp1IndexContent,
  'WebDaYi',
  'mvp1/index.html must contain WebDaYi title'
);

// Test 9: mvp1/index.html loads core_logic.js
assertContains(
  mvp1IndexContent,
  'core_logic.js',
  'mvp1/index.html must load core_logic.js'
);

console.log('\nTest Group 3: Express Mode Feature Validation (v5)');

// Test 10: Express Mode toggle button exists
assertContains(
  mvp1IndexContent,
  'id="mode-toggle-btn"',
  'mvp1/index.html must contain Express Mode toggle button (v5 feature)'
);

// Test 11: Express Mode toggle has proper class
assertContains(
  mvp1IndexContent,
  'class="mode-toggle"',
  'Express Mode toggle must have proper class for styling'
);

// Test 12: Express Mode toggle has proper label
assertContains(
  mvp1IndexContent,
  '專注模式',
  'Express Mode toggle must have Chinese label for "Express Mode"'
);

console.log('\nTest Group 4: Core UI Elements Validation');

// Test 13: Input box exists
assertContains(
  mvp1IndexContent,
  'id="input-box"',
  'mvp1/index.html must contain input box'
);

// Test 14: Candidate area exists
assertContains(
  mvp1IndexContent,
  'id="candidate-area"',
  'mvp1/index.html must contain candidate area'
);

// Test 15: Output buffer exists
assertContains(
  mvp1IndexContent,
  'id="output-buffer"',
  'mvp1/index.html must contain output buffer'
);

// Test 16: Copy button exists
assertContains(
  mvp1IndexContent,
  'id="copy-button"',
  'mvp1/index.html must contain copy button'
);

console.log('\nTest Group 5: Related Files Validation');

// Test 17: core_logic.js exists
const coreLogicPath = path.join(__dirname, 'mvp1', 'core_logic.js');
assertFileExists(coreLogicPath, 'mvp1/core_logic.js must exist');

// Test 18: style.css exists
const stylePath = path.join(__dirname, 'mvp1', 'style.css');
assertFileExists(stylePath, 'mvp1/style.css must exist');

// Test 19: dayi_db.json exists
const dbPath = path.join(__dirname, 'mvp1', 'dayi_db.json');
assertFileExists(dbPath, 'mvp1/dayi_db.json database must exist');

// Test 20: core_logic.js contains mode toggle handler
const coreLogicContent = fs.readFileSync(coreLogicPath, 'utf-8');
assertContains(
  coreLogicContent,
  'mode-toggle',
  'core_logic.js must contain mode toggle event handler'
);

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${testCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${testCount - passCount}`);

if (passCount === testCount) {
  console.log('\n✅ All GitHub Pages deployment tests passed!');
  console.log('\nGitHub Pages will now correctly:');
  console.log('  1. Load root index.html');
  console.log('  2. Redirect to mvp1/index.html');
  console.log('  3. Display the WebDaYi MVP1 application');
  console.log('  4. Show Express Mode toggle (v5 feature)');
  process.exit(0);
} else {
  console.error('\n❌ Some tests failed. Please fix the issues above.');
  process.exit(1);
}
