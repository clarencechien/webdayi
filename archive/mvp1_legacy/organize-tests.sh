#!/bin/bash

# Move Node.js tests
mv test-v27-hybrid.js tests/node/ 2>/dev/null
mv test-v27-browser.js tests/node/ 2>/dev/null
mv test-v25-unigram.js tests/node/ 2>/dev/null
mv test-v25-vs-v26.js tests/node/ 2>/dev/null
mv test-v25-vs-v27-final.js tests/node/ 2>/dev/null
mv test-laplace-smoothing.js tests/node/ 2>/dev/null
mv test-v11-ui-init.js tests/node/ 2>/dev/null

# Move browser tests
mv test-browser-v27-version.html tests/browser/ 2>/dev/null
mv test-browser-version.html tests/browser/ 2>/dev/null
mv test-browser-diagnosis.html tests/browser/ 2>/dev/null
mv test-button-fix.html tests/browser/ 2>/dev/null

# Move diagnostic tools
mv diagnose-v27-hui-kui.js tests/diagnostic/ 2>/dev/null
mv diagnose-remaining-errors.js tests/diagnostic/ 2>/dev/null
mv diagnose-candidate-order.js tests/diagnostic/ 2>/dev/null
mv diagnose-chinese-text.js tests/diagnostic/ 2>/dev/null
mv diagnose-ngram.js tests/diagnostic/ 2>/dev/null
mv diagnose-simple.js tests/diagnostic/ 2>/dev/null
mv check-duplicates.js tests/diagnostic/ 2>/dev/null

# Move archived tests
mv test-node-v*.js tests/archived/ 2>/dev/null
mv test-viterbi-*.js tests/archived/ 2>/dev/null
mv test-v23-*.js tests/archived/ 2>/dev/null
mv test-*.html tests/archived/ 2>/dev/null
mv test-*.js tests/archived/ 2>/dev/null
mv diagnose-*.js tests/archived/ 2>/dev/null

echo "✓ Test files organized into tests/ directory"
echo ""
echo "Directory structure:"
tree tests/ -L 2 || find tests/ -maxdepth 2 -type f | sort
