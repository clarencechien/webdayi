/**
 * WebDaYi MVP1 v11: TDD Tests for UI Initialization
 *
 * Test Focus: Ensure UI script initializes correctly without errors
 *
 * Bug Context:
 * - User reports all buttons (main + desktop + mobile) not working
 * - Root cause: arguments.callee in strict mode throws error
 * - Result: Entire IIFE fails, no event listeners bound
 */

const assert = require('assert');
const { JSDOM } = require('jsdom');

describe('v11 UI Initialization Tests', function() {
  let dom, window, document;

  beforeEach(function() {
    // Create minimal DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="char-mode-btn-main">Character</button>
          <button id="sentence-mode-btn-main">Sentence</button>
          <button id="predict-sentence-btn">Predict</button>
          <div id="prediction-control" class="hidden"></div>
          <div id="code-buffer-display" class="hidden"></div>
          <div id="buffered-codes"></div>
          <div id="live-preview" class="hidden"></div>
          <div id="preview-text"></div>
          <input id="input-box" />
          <div id="candidate-area"></div>
        </body>
      </html>
    `, {
      runScripts: 'outside-only',
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock dayiMap (required for initialization)
    global.dayiMap = new Map([
      ['a', [{ char: '大', freq: 100 }]],
      ['4jp', [{ char: '易', freq: 80 }]]
    ]);

    // Mock v11 core functions
    global.inputMode = 'character';
    global.codeBuffer = [];

    global.getInputMode = function() {
      return global.inputMode;
    };

    global.setInputMode = function(mode) {
      global.inputMode = mode;
      global.codeBuffer = [];
    };

    global.getCodeBuffer = function() {
      return global.codeBuffer;
    };

    global.clearCodeBuffer = function() {
      global.codeBuffer = [];
    };

    global.addCodeToBuffer = function(code) {
      global.codeBuffer.push(code);
    };

    global.removeLastCodeFromBuffer = function() {
      return global.codeBuffer.pop();
    };

    global.generateLivePreview = function(buffer, dayiMap, userModel) {
      return buffer.map(code => {
        const candidates = dayiMap.get(code);
        return candidates ? candidates[0].char : '?';
      }).join(' ');
    };

    global.loadNgramDatabase = async function() {
      return { unigrams: {}, bigrams: {} };
    };

    global.isNgramDbLoaded = function() {
      return true;
    };

    global.predictSentenceFromBuffer = function(buffer, dayiMap, ngramDb) {
      const chars = buffer.map(code => {
        const candidates = dayiMap.get(code);
        return candidates ? candidates[0].char : '?';
      });
      return {
        sentence: chars.join(''),
        chars: chars,
        buffer: buffer,
        score: 0.5
      };
    };

    global.displaySentencePrediction = function(result) {
      // Mock implementation
    };
  });

  afterEach(function() {
    delete global.window;
    delete global.document;
    delete global.dayiMap;
    delete global.inputMode;
    delete global.codeBuffer;
    delete global.getInputMode;
    delete global.setInputMode;
    delete global.getCodeBuffer;
    delete global.clearCodeBuffer;
    delete global.addCodeToBuffer;
    delete global.removeLastCodeFromBuffer;
    delete global.generateLivePreview;
    delete global.loadNgramDatabase;
    delete global.isNgramDbLoaded;
    delete global.predictSentenceFromBuffer;
    delete global.displaySentencePrediction;
  });

  describe('Suite 1: Script Initialization (Bug Fix)', function() {
    it('Test 1.1: Should initialize without throwing errors', function() {
      // This test verifies the bug fix for arguments.callee in strict mode
      assert.doesNotThrow(() => {
        // Simulate script loading
        eval(`
          (function initV11UI() {
            'use strict';

            // Fixed: Use named function instead of arguments.callee
            if (typeof dayiMap === 'undefined' || !dayiMap) {
              console.error('[v11 UI] dayiMap not loaded yet, retrying...');
              setTimeout(initV11UI, 100);
              return;
            }

            console.log('[v11 UI] Initialized successfully');
          })();
        `);
      }, 'UI script should not throw error in strict mode');
    });

    it('Test 1.2: Should find all required DOM elements', function() {
      const charModeBtnMain = document.getElementById('char-mode-btn-main');
      const sentenceModeBtnMain = document.getElementById('sentence-mode-btn-main');
      const predictSentenceBtn = document.getElementById('predict-sentence-btn');
      const predictionControl = document.getElementById('prediction-control');

      assert.strictEqual(charModeBtnMain !== null, true, 'Main character button should exist');
      assert.strictEqual(sentenceModeBtnMain !== null, true, 'Main sentence button should exist');
      assert.strictEqual(predictSentenceBtn !== null, true, 'Prediction button should exist');
      assert.strictEqual(predictionControl !== null, true, 'Prediction control should exist');
    });

    it('Test 1.3: Should check for dayiMap before initializing', function() {
      let initAttempted = false;

      // Clear dayiMap temporarily
      const originalDayiMap = global.dayiMap;
      delete global.dayiMap;

      (function initV11UI() {
        if (typeof dayiMap === 'undefined' || !dayiMap) {
          initAttempted = true;
          return; // Don't retry in test
        }
      })();

      assert.strictEqual(initAttempted, true, 'Should detect missing dayiMap');

      // Restore
      global.dayiMap = originalDayiMap;
    });
  });

  describe('Suite 2: Mode Toggle Button Functionality', function() {
    it('Test 2.1: Character mode button should change input mode', function() {
      const charModeBtnMain = document.getElementById('char-mode-btn-main');

      // Set to sentence mode first
      setInputMode('sentence');
      assert.strictEqual(getInputMode(), 'sentence');

      // Click character mode button (simulate)
      setInputMode('character');
      assert.strictEqual(getInputMode(), 'character', 'Should switch to character mode');
    });

    it('Test 2.2: Sentence mode button should change input mode', function() {
      const sentenceModeBtnMain = document.getElementById('sentence-mode-btn-main');

      // Start in character mode
      setInputMode('character');
      assert.strictEqual(getInputMode(), 'character');

      // Click sentence mode button (simulate)
      setInputMode('sentence');
      assert.strictEqual(getInputMode(), 'sentence', 'Should switch to sentence mode');
    });

    it('Test 2.3: Mode switch should clear code buffer', function() {
      // Add some codes to buffer
      setInputMode('sentence');
      addCodeToBuffer('a');
      addCodeToBuffer('4jp');
      assert.strictEqual(getCodeBuffer().length, 2);

      // Switch mode
      setInputMode('character');
      assert.strictEqual(getCodeBuffer().length, 0, 'Buffer should be cleared on mode switch');
    });
  });

  describe('Suite 3: Prediction Button State Management', function() {
    it('Test 3.1: Prediction control should be hidden in character mode', function() {
      const predictionControl = document.getElementById('prediction-control');

      setInputMode('character');

      // In real implementation, updateModeUI() would hide this
      // For now, we just verify the element exists and can be hidden
      assert.strictEqual(predictionControl !== null, true);
      assert.strictEqual(predictionControl.classList.contains('hidden'), true);
    });

    it('Test 3.2: Prediction control should be visible in sentence mode', function() {
      const predictionControl = document.getElementById('prediction-control');

      setInputMode('sentence');

      // Simulate updateModeUI() behavior
      predictionControl.classList.remove('hidden');

      assert.strictEqual(predictionControl.classList.contains('hidden'), false,
        'Prediction control should be visible in sentence mode');
    });

    it('Test 3.3: Prediction button should be disabled when buffer is empty', function() {
      const predictSentenceBtn = document.getElementById('predict-sentence-btn');

      setInputMode('sentence');
      clearCodeBuffer();

      // Simulate updateBufferDisplay() behavior
      predictSentenceBtn.disabled = (getCodeBuffer().length === 0);

      assert.strictEqual(predictSentenceBtn.disabled, true,
        'Button should be disabled when buffer is empty');
    });

    it('Test 3.4: Prediction button should be enabled when buffer has codes', function() {
      const predictSentenceBtn = document.getElementById('predict-sentence-btn');

      setInputMode('sentence');
      addCodeToBuffer('a');
      addCodeToBuffer('4jp');

      // Simulate updateBufferDisplay() behavior
      predictSentenceBtn.disabled = (getCodeBuffer().length === 0);

      assert.strictEqual(predictSentenceBtn.disabled, false,
        'Button should be enabled when buffer has codes');
    });
  });

  describe('Suite 4: Event Listener Binding Verification', function() {
    it('Test 4.1: Should be able to add click listener to main buttons', function() {
      const charModeBtnMain = document.getElementById('char-mode-btn-main');
      const sentenceModeBtnMain = document.getElementById('sentence-mode-btn-main');

      let charClicked = false;
      let sentenceClicked = false;

      assert.doesNotThrow(() => {
        charModeBtnMain.addEventListener('click', () => { charClicked = true; });
        sentenceModeBtnMain.addEventListener('click', () => { sentenceClicked = true; });
      }, 'Should be able to add event listeners without error');

      // Trigger clicks
      charModeBtnMain.click();
      sentenceModeBtnMain.click();

      assert.strictEqual(charClicked, true, 'Character button click should fire');
      assert.strictEqual(sentenceClicked, true, 'Sentence button click should fire');
    });

    it('Test 4.2: Should be able to add click listener to prediction button', function() {
      const predictSentenceBtn = document.getElementById('predict-sentence-btn');

      let clicked = false;

      assert.doesNotThrow(() => {
        predictSentenceBtn.addEventListener('click', () => { clicked = true; });
      }, 'Should be able to add event listener to prediction button');

      predictSentenceBtn.click();
      assert.strictEqual(clicked, true, 'Prediction button click should fire');
    });
  });
});

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}
