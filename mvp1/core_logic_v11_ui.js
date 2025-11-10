/**
 * WebDaYi MVP1 v11: UI Integration for N-gram Sentence Prediction
 *
 * This module connects the v11 UI elements to the core v11 functions.
 * It handles event listeners, UI updates, and N-gram database loading.
 *
 * Dependencies:
 * - core_logic.js (existing v10 functions)
 * - core_logic_v11.js (v11 core functions)
 * - viterbi_module.js (Viterbi algorithm)
 */

(function() {
  'use strict';

  // Wait for DOM and dayiMap to be ready
  if (typeof dayiMap === 'undefined' || !dayiMap) {
    console.error('[v11 UI] dayiMap not loaded yet, retrying...');
    setTimeout(arguments.callee, 100);
    return;
  }

  console.log('[v11 UI] Initializing...');

  // ============================================
  // UI Element References
  // ============================================

  const charModeBtn = document.getElementById('char-mode-btn');
  const sentenceModeBtn = document.getElementById('sentence-mode-btn');
  const modeDescription = document.getElementById('mode-description');
  const codeBufferDisplay = document.getElementById('code-buffer-display');
  const bufferedCodesContainer = document.getElementById('buffered-codes');
  const clearBufferBtn = document.getElementById('clear-buffer-btn');
  const livePreview = document.getElementById('live-preview');
  const previewText = document.getElementById('preview-text');
  const ngramLoadingOverlay = document.getElementById('ngram-loading');
  const inputBox = document.getElementById('input-box');
  const candidateArea = document.getElementById('candidate-area');

  // ============================================
  // N-gram Database Lazy Loading
  // ============================================

  function showLoadingIndicator() {
    if (ngramLoadingOverlay) {
      ngramLoadingOverlay.classList.remove('hidden');
    }
  }

  function hideLoadingIndicator() {
    if (ngramLoadingOverlay) {
      ngramLoadingOverlay.classList.add('hidden');
    }
  }

  async function loadNgramDatabase() {
    if (getNgramDb()) {
      return getNgramDb(); // Already loaded
    }

    if (isNgramDbLoading()) {
      // Wait for existing load
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!isNgramDbLoading()) {
            clearInterval(interval);
            resolve(getNgramDb());
          }
        }, 100);
      });
    }

    setNgramDbLoading(true);
    showLoadingIndicator();

    try {
      const response = await fetch('ngram_db.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      if (!validateNgramDb(data)) {
        throw new Error('Invalid N-gram database structure');
      }

      setNgramDb(data);
      const stats = getNgramDbStats();
      console.log(`[v11 UI] N-gram DB loaded: ${stats.uniqueChars} unigrams, ${stats.uniqueBigrams} bigrams`);

    } catch (error) {
      console.error('[v11 UI] Failed to load N-gram database:', error);
      alert('N-gram 資料庫載入失敗: ' + error.message);
      setNgramDb(null);
    } finally {
      hideLoadingIndicator();
      setNgramDbLoading(false);
    }

    return getNgramDb();
  }

  // ============================================
  // UI Update Functions
  // ============================================

  function updateModeUI() {
    const mode = getInputMode();

    if (mode === 'character') {
      charModeBtn.classList.add('active');
      sentenceModeBtn.classList.remove('active');
      if (modeDescription) {
        modeDescription.textContent = '逐字模式: 每輸入一個編碼即選字 (Character-by-character input)';
      }
      if (codeBufferDisplay) {
        codeBufferDisplay.classList.add('hidden');
      }
      if (livePreview) {
        livePreview.classList.add('hidden');
      }
    } else {
      charModeBtn.classList.remove('active');
      sentenceModeBtn.classList.add('active');
      if (modeDescription) {
        modeDescription.textContent = '整句模式: 輸入多個編碼，按 Space 預測句子 (Sentence prediction mode)';
      }
      if (codeBufferDisplay) {
        codeBufferDisplay.classList.remove('hidden');
      }
    }

    updateBufferDisplay();
    updateLivePreviewDisplay();
  }

  function updateBufferDisplay() {
    if (!bufferedCodesContainer) return;

    const buffer = getCodeBuffer();

    if (buffer.length === 0) {
      bufferedCodesContainer.innerHTML = '<span class="text-sm text-slate-400 dark:text-slate-500 italic">尚無編碼 (No codes yet)</span>';
    } else {
      bufferedCodesContainer.innerHTML = buffer.map(code =>
        `<span class="buffered-code-badge">${code}</span>`
      ).join('');
    }
  }

  function updateLivePreviewDisplay() {
    if (!livePreview || !previewText) return;

    const buffer = getCodeBuffer();

    if (getInputMode() !== 'sentence' || buffer.length === 0) {
      livePreview.classList.add('hidden');
      return;
    }

    // Generate preview
    const preview = generateLivePreview(buffer, dayiMap, userModel);
    previewText.textContent = preview;
    livePreview.classList.remove('hidden');
  }

  function displaySentencePrediction(result) {
    if (!candidateArea) return;

    const { sentence, score, chars } = result;
    const buffer = getCodeBuffer();

    const html = `
      <div class="sentence-prediction w-full">
        <div class="prediction-header">
          <span class="material-symbols-outlined">auto_awesome</span>
          <span>智能預測結果 (Prediction)</span>
        </div>
        <div class="predicted-sentence">${sentence}</div>
        <div class="prediction-details">
          <div class="char-breakdown">
            ${chars.map((char, i) => `${char} (${buffer[i]})`).join(' → ')}
          </div>
          <div class="prediction-score">機率分數: ${score.toFixed(3)}</div>
        </div>
      </div>
    `;

    candidateArea.innerHTML = html;
  }

  // ============================================
  // Event Handlers
  // ============================================

  // Mode toggle buttons
  if (charModeBtn) {
    charModeBtn.addEventListener('click', () => {
      setInputMode('character');
      updateModeUI();
      if (inputBox) inputBox.value = '';
      if (candidateArea) {
        candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">請輸入大易碼</div>';
      }
      console.log('[v11 UI] Switched to character mode');
    });
  }

  if (sentenceModeBtn) {
    sentenceModeBtn.addEventListener('click', async () => {
      setInputMode('sentence');
      updateModeUI();
      if (inputBox) inputBox.value = '';
      if (candidateArea) {
        candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 Space 預測句子</div>';
      }

      // Lazy load N-gram DB
      await loadNgramDatabase();

      console.log('[v11 UI] Switched to sentence mode');
    });
  }

  // Clear buffer button
  if (clearBufferBtn) {
    clearBufferBtn.addEventListener('click', () => {
      clearCodeBuffer();
      updateBufferDisplay();
      updateLivePreviewDisplay();
      if (inputBox) inputBox.value = '';
      if (candidateArea) {
        candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 Space 預測句子</div>';
      }
      console.log('[v11 UI] Buffer cleared');
    });
  }

  // ============================================
  // Enhanced Input Handling (v11)
  // ============================================

  // Store original input handler
  const originalInputBox = inputBox;
  if (originalInputBox) {
    // Intercept input events for sentence mode
    let previousValue = '';

    originalInputBox.addEventListener('input', (e) => {
      if (getInputMode() !== 'sentence') {
        previousValue = originalInputBox.value;
        return; // Let original handler in core_logic.js handle it
      }

      // Sentence mode: buffer 2-char codes
      const value = originalInputBox.value.toLowerCase();

      if (value.length === 2) {
        const added = addToCodeBuffer(value, dayiMap);
        if (added) {
          console.log(`[v11 UI] Added code to buffer: ${value}`);
          originalInputBox.value = '';
          updateBufferDisplay();
          updateLivePreviewDisplay();

          // Show hint in candidate area
          if (candidateArea) {
            candidateArea.innerHTML = `
              <div class="w-full text-center text-sm text-slate-500 dark:text-slate-400 py-4">
                已加入編碼 "${value}"，繼續輸入或按 Space 預測
              </div>
            `;
          }
        } else {
          console.warn(`[v11 UI] Invalid code: ${value}`);
          if (candidateArea) {
            candidateArea.innerHTML = `
              <div class="w-full text-center text-sm text-rose-500 py-4">
                無效編碼: ${value}
              </div>
            `;
          }
          setTimeout(() => {
            originalInputBox.value = '';
            if (candidateArea) {
              candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 Space 預測句子</div>';
            }
          }, 1000);
        }
      }

      previousValue = originalInputBox.value;
    });

    // Enhanced keydown handler for v11
    originalInputBox.addEventListener('keydown', async (e) => {
      if (getInputMode() !== 'sentence') {
        return; // Let original handler in core_logic.js handle it
      }

      const key = e.key;

      // Space: Trigger prediction
      if (key === ' ') {
        e.preventDefault();
        const buffer = getCodeBuffer();

        if (buffer.length === 0) {
          console.warn('[v11 UI] Buffer empty, cannot predict');
          return;
        }

        console.log(`[v11 UI] Predicting sentence for: ${buffer.join(', ')}`);

        // Ensure N-gram DB is loaded
        const ngram = await loadNgramDatabase();
        if (!ngram) {
          alert('N-gram 資料庫未載入，無法預測');
          return;
        }

        // Run Viterbi prediction
        const result = predictSentenceFromBuffer(buffer, dayiMap, ngram);

        if (result) {
          console.log(`[v11 UI] Prediction: "${result.sentence}" (score: ${result.score.toFixed(3)})`);

          // Display prediction
          displaySentencePrediction(result);

          // Append to output buffer
          const outputBuffer = document.getElementById('output-buffer');
          if (outputBuffer) {
            outputBuffer.value += result.sentence;

            // Auto-copy if enabled
            if (typeof autoCopyEnabled !== 'undefined' && autoCopyEnabled) {
              if (typeof performAutoCopy === 'function') {
                performAutoCopy(outputBuffer.value);
              }
              if (typeof showCopyFeedback === 'function') {
                showCopyFeedback();
              }
            }
          }

          // Clear buffer and input
          clearCodeBuffer();
          updateBufferDisplay();
          updateLivePreviewDisplay();
          originalInputBox.value = '';
        } else {
          console.error('[v11 UI] Prediction failed');
          alert('預測失敗，請重試');
        }
      }

      // Backspace on empty input: Remove last code from buffer
      if (key === 'Backspace' && originalInputBox.value === '') {
        e.preventDefault();
        removeLastCodeFromBuffer();
        updateBufferDisplay();
        updateLivePreviewDisplay();
        console.log('[v11 UI] Removed last code from buffer');
      }

      // ESC: Clear buffer
      if (key === 'Escape') {
        e.preventDefault();
        clearCodeBuffer();
        updateBufferDisplay();
        updateLivePreviewDisplay();
        originalInputBox.value = '';
        if (candidateArea) {
          candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 Space 預測句子</div>';
        }
        console.log('[v11 UI] Buffer cleared via ESC');
      }
    });
  }

  // ============================================
  // Initialization
  // ============================================

  // Initialize UI
  updateModeUI();

  console.log('[v11 UI] Initialized successfully');
  console.log('[v11 UI] Mode:', getInputMode());
  console.log('[v11 UI] N-gram DB:', getNgramDb() ? 'loaded' : 'not loaded (lazy)');

})();
