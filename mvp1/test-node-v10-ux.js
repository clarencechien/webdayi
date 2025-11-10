/**
 * Test Suite for MVP1 v10: UX Improvement - Inline Selection Key Hints
 *
 * This test suite covers:
 * - Candidate rendering with inline key hints (5 tests)
 *
 * Total: 5 tests
 *
 * Run: node test-node-v10-ux.js
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

  // Evaluate the code
  eval(jsContent);

  return {
    renderCandidatesHTML: typeof renderCandidatesHTML !== 'undefined' ? renderCandidatesHTML : null,
  };
}

console.log(`\n${colors.cyan}=== MVP1 v10: UX Improvement - Inline Selection Key Hints ===${colors.reset}\n`);

// ============================================================================
// CATEGORY: Candidate Rendering with Inline Key Hints (5 tests)
// ============================================================================

console.log(`${colors.blue}Category: Candidate Rendering with Inline Key Hints${colors.reset}`);

try {
  const { renderCandidatesHTML } = loadCoreLogic();

  if (!renderCandidatesHTML) {
    throw new Error('renderCandidatesHTML function not found');
  }

  // Test data
  const testCandidates = [
    { char: '保', freq: 100 },
    { char: '條', freq: 90 },
    { char: '集', freq: 80 },
    { char: '休', freq: 70 },
    { char: '餘', freq: 60 },
    { char: '傑', freq: 50 },
    { char: '體', freq: 40 },
    { char: '修', freq: 30 }
  ];

  // Test 1: First candidate includes "Space" key hint
  const html1 = renderCandidatesHTML(testCandidates.slice(0, 1));
  assert(
    html1.includes('Space') && html1.includes('保'),
    'Test 1: First candidate includes "Space" key hint inline'
  );

  // Test 2: Second candidate includes "\'" key hint
  const html2 = renderCandidatesHTML(testCandidates.slice(0, 2));
  assert(
    html2.includes("'") && html2.includes('條'),
    'Test 2: Second candidate includes "\'" key hint inline'
  );

  // Test 3: First 6 candidates all have key hints
  const html6 = renderCandidatesHTML(testCandidates.slice(0, 6));
  const hasAllKeys = [
    'Space',  // 1st
    "'",      // 2nd
    '[',      // 3rd
    ']',      // 4th
    '-',      // 5th
    '\\'      // 6th (escaped)
  ].every(key => html6.includes(key));

  assert(
    hasAllKeys,
    'Test 3: First 6 candidates all have their respective key hints (Space, \', [, ], -, \\)'
  );

  // Test 4: Candidates beyond 6th don't show key hints
  // With 8 candidates, getCandidatesForPage returns first 6 on page 0
  // So we test that the first page has 6 kbd tags, and 7th/8th candidates need page 2
  const html8page0 = renderCandidatesHTML(testCandidates, 0, 2);

  // Count occurrences of <kbd> tags on first page
  const kbdCount = (html8page0.match(/<kbd/g) || []).length;

  // Should have 6 <kbd> tags for candidates + 1 for pagination "=" key = 7 total
  const hasCorrectKbdCount = kbdCount === 7;

  // First page should NOT contain 7th and 8th candidates
  const doesNotHave7th8th = !html8page0.includes('體') && !html8page0.includes('修');

  // But first 6 candidates should be there
  const hasFirst6 = html8page0.includes('保') && html8page0.includes('傑');

  assert(
    hasCorrectKbdCount && doesNotHave7th8th && hasFirst6,
    'Test 4: First 6 candidates show key hints, 7th/8th candidates on page 2 (pagination works correctly)'
  );

  // Test 5: Key hints use <kbd> tags with proper styling
  const html5 = renderCandidatesHTML(testCandidates.slice(0, 1));
  const hasKbdTag = html5.includes('<kbd') && html5.includes('</kbd>');
  const hasStyleClasses = html5.includes('font-mono') || html5.includes('rounded');

  assert(
    hasKbdTag && hasStyleClasses,
    'Test 5: Key hints use <kbd> tags with proper Tailwind styling classes'
  );

} catch (error) {
  console.log(`  ${colors.red}Error in Candidate Rendering Tests: ${error.message}${colors.reset}`);
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
