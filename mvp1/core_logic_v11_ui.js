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

(function initV11UI() {
  'use strict';

  // Wait for DOM and dayiMap to be ready
  // FIX: Use named function instead of arguments.callee (strict mode compatible)
  if (typeof dayiMap === 'undefined' || !dayiMap) {
    console.error('[v11 UI] dayiMap not loaded yet, retrying...');
    setTimeout(initV11UI, 100);
    return;
  }

  console.log('[v11 UI] Initializing...');

  // ============================================
  // UI Element References
  // ============================================

  // Desktop control panel buttons
  const charModeBtn = document.getElementById('char-mode-btn');
  const sentenceModeBtn = document.getElementById('sentence-mode-btn');

  // Mobile FAB menu buttons
  const charModeBtnMobile = document.getElementById('char-mode-btn-mobile');
  const sentenceModeBtnMobile = document.getElementById('sentence-mode-btn-mobile');

  // v11 Sentence mode UI elements
  const sentenceModePanel = document.getElementById('sentence-mode-panel');
  const livePreviewContainer = document.getElementById('live-preview-container');
  const previewText = document.getElementById('preview-text');
  const bufferedCodesContainer = document.getElementById('buffered-codes');
  const clearBufferBtn = document.getElementById('clear-buffer-btn');
  const predictSentenceBtn = document.getElementById('predict-sentence-btn');

  // Other UI elements
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
    const buffer = getCodeBuffer();

    if (mode === 'character') {
      // Desktop control panel buttons
      if (charModeBtn) {
        charModeBtn.classList.add('active');
        charModeBtn.style.background = '#0fb8f0';
        charModeBtn.style.color = 'white';
      }
      if (sentenceModeBtn) {
        sentenceModeBtn.classList.remove('active');
        sentenceModeBtn.style.background = '';
        sentenceModeBtn.style.color = '';
      }

      // Mobile FAB menu buttons
      if (charModeBtnMobile) {
        charModeBtnMobile.classList.add('active');
        charModeBtnMobile.style.background = '#0fb8f0';
        charModeBtnMobile.style.color = 'white';
      }
      if (sentenceModeBtnMobile) {
        sentenceModeBtnMobile.classList.remove('active');
        sentenceModeBtnMobile.style.background = '';
        sentenceModeBtnMobile.style.color = '';
      }

      // Hide sentence mode panel in character mode
      if (sentenceModePanel) {
        sentenceModePanel.classList.add('hidden');
      }
    } else {
      // Desktop control panel buttons
      if (charModeBtn) {
        charModeBtn.classList.remove('active');
        charModeBtn.style.background = '';
        charModeBtn.style.color = '';
      }
      if (sentenceModeBtn) {
        sentenceModeBtn.classList.add('active');
        sentenceModeBtn.style.background = '#0fb8f0';
        sentenceModeBtn.style.color = 'white';
      }

      // Mobile FAB menu buttons
      if (charModeBtnMobile) {
        charModeBtnMobile.classList.remove('active');
        charModeBtnMobile.style.background = '';
        charModeBtnMobile.style.color = '';
      }
      if (sentenceModeBtnMobile) {
        sentenceModeBtnMobile.classList.add('active');
        sentenceModeBtnMobile.style.background = '#0fb8f0';
        sentenceModeBtnMobile.style.color = 'white';
      }

      // Show sentence mode panel
      if (sentenceModePanel) {
        sentenceModePanel.classList.remove('hidden');
      }

      // Enable/disable prediction button based on buffer
      if (predictSentenceBtn) {
        predictSentenceBtn.disabled = (buffer.length === 0);
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
      // Disable prediction button when buffer is empty
      if (predictSentenceBtn && getInputMode() === 'sentence') {
        predictSentenceBtn.disabled = true;
      }
    } else {
      bufferedCodesContainer.innerHTML = buffer.map(code =>
        `<span class="buffered-code-badge">${code}</span>`
      ).join('');
      // Enable prediction button when buffer has content
      if (predictSentenceBtn && getInputMode() === 'sentence') {
        predictSentenceBtn.disabled = false;
      }
    }
  }

  function updateLivePreviewDisplay() {
    if (!livePreviewContainer || !previewText) return;

    const buffer = getCodeBuffer();

    if (getInputMode() !== 'sentence' || buffer.length === 0) {
      livePreviewContainer.classList.add('hidden');
      return;
    }

    // Generate preview
    const preview = generateLivePreview(buffer, dayiMap, userModel);
    previewText.textContent = preview;
    livePreviewContainer.classList.remove('hidden');
  }

  async function triggerPrediction() {
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
      if (inputBox) inputBox.value = '';
    } else {
      console.error('[v11 UI] Prediction failed');
      alert('預測失敗，請重試');
    }
  }

  function displaySentencePrediction(result) {
    if (!candidateArea) return;

    const { sentence, score, chars } = result;
    const buffer = getCodeBuffer();

    const html = `
      <div class="sentence-prediction w-full">
        <div class="prediction-header">
          <span class="material-symbols-outlined">auto_awesome</span>
          <span>智慧預測結果 (Prediction)</span>
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
  // New Functions for Redesigned Space/= Keys
  // (See: UX-SPACE-KEY-REDESIGN.md)
  // ============================================

  /**
   * Trigger sentence prediction based on current code buffer
   * Called when Space is pressed in sentence mode
   * ONLY displays prediction - does NOT output (that's done by confirmPrediction)
   */
  window.triggerSentencePrediction = async function triggerSentencePrediction() {
    const buffer = getCodeBuffer();

    if (buffer.length === 0) {
      console.log('[Prediction] No codes in buffer');
      return;
    }

    console.log(`[Prediction] Triggering for buffer: ${buffer.join(', ')}`);

    // Ensure N-gram DB is loaded
    const ngram = await loadNgramDatabase();
    if (!ngram) {
      console.warn('[Prediction] N-gram DB not loaded');
      return;
    }

    // Run Viterbi prediction
    if (typeof predictSentenceFromBuffer === 'function') {
      const result = predictSentenceFromBuffer(buffer, dayiMap, ngram);

      if (result) {
        console.log(`[Prediction] Result: "${result.sentence}" (score: ${result.score.toFixed(3)})`);

        // Update prediction display ONLY (don't output yet)
        updatePredictionDisplay(result.sentence, result.score);
      } else {
        console.warn('[Prediction] No result from Viterbi');
      }
    }
  }

  /**
   * Confirm prediction and output to buffer
   * Called when = is pressed in sentence mode
   */
  window.confirmPrediction = function confirmPrediction() {
    const predictionArea = document.getElementById('prediction-result-text');
    if (!predictionArea) {
      console.warn('[Confirm] Prediction area not found');
      return;
    }

    const predictedSentence = predictionArea.textContent;

    if (predictedSentence && predictedSentence !== '(等待預測)') {
      console.log(`[Confirm] Outputting prediction: "${predictedSentence}"`);

      // Append to output
      const outputBuffer = document.getElementById('output-buffer');
      if (outputBuffer) {
        outputBuffer.value += predictedSentence;

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

      // Clear buffer and prediction
      clearCodeBuffer();
      updateBufferDisplay();
      updateLivePreviewDisplay();
      predictionArea.textContent = '(等待預測)';

      // Clear input box
      if (inputBox) inputBox.value = '';

      console.log('[Confirm] Prediction confirmed and output');
    } else {
      console.log('[Confirm] No prediction to confirm');
    }
  }

  // ============================================
  // Event Handlers
  // ============================================

  // Desktop control panel mode toggle buttons
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

  // Mobile mode toggle buttons
  if (charModeBtnMobile) {
    charModeBtnMobile.addEventListener('click', () => {
      setInputMode('character');
      updateModeUI();
      if (inputBox) inputBox.value = '';
      if (candidateArea) {
        candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">請輸入大易碼</div>';
      }
      console.log('[v11 UI] Switched to character mode (mobile)');
    });
  }

  if (sentenceModeBtnMobile) {
    sentenceModeBtnMobile.addEventListener('click', async () => {
      setInputMode('sentence');
      updateModeUI();
      if (inputBox) inputBox.value = '';
      if (candidateArea) {
        candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 Space 預測句子</div>';
      }

      // Lazy load N-gram DB
      await loadNgramDatabase();

      console.log('[v11 UI] Switched to sentence mode (mobile)');
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

  // Confirm prediction button (replaces = key for mobile)
  // NOTE: This button confirms and outputs prediction, not just triggers it
  if (predictSentenceBtn) {
    predictSentenceBtn.addEventListener('click', () => {
      console.log('[v11 UI] Confirm prediction button clicked');
      // Call the new confirmPrediction function
      if (typeof window !== 'undefined' && typeof window.confirmPrediction === 'function') {
        window.confirmPrediction();
      } else if (typeof confirmPrediction === 'function') {
        confirmPrediction();
      }
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

      // Sentence mode: Handle both single-char and 2-char codes
      const value = originalInputBox.value.toLowerCase();

      // NEW (Issue 1 fix): Handle single-char input - show candidates
      if (value.length === 1) {
        const candidates = dayiMap.get(value);
        if (candidates && candidates.length > 0) {
          // Sort by frequency
          const sorted = [...candidates].sort((a, b) => b.freq - a.freq);

          // Apply user preference if available
          const withUserPreference = userModel ?
            applyUserPreference(value, sorted, userModel) :
            sorted;

          // Update candidate area (reuse existing function from core_logic.js)
          if (typeof updateCandidateArea === 'function') {
            updateCandidateArea(withUserPreference, 0);
          }

          // Note: In sentence mode, single-char is NOT selected
          // Instead, it's added to buffer when Space is pressed
          // See: UX-SPACE-KEY-REDESIGN.md for full specification

          console.log(`[v11 UI] Single-char "${value}" showing ${sorted.length} candidates (live preview only)`);
        } else {
          // No candidates for this single char
          if (candidateArea) {
            candidateArea.innerHTML = `
              <div class="w-full text-center text-sm text-rose-500 py-4">
                無效編碼: ${value}
              </div>
            `;
          }
        }
        return; // Don't process further
      }

      // Existing: Handle 2-char input - buffer for prediction
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
        await triggerPrediction();
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

  console.log('[v11 UI] ===== Initialization Complete =====');
  console.log('[v11 UI] Mode:', getInputMode());
  console.log('[v11 UI] N-gram DB:', getNgramDb() ? 'loaded' : 'not loaded (lazy)');
  console.log('[v11 UI] Event Listeners Bound:');
  console.log('[v11 UI]   - Desktop buttons:', charModeBtn ? '✓' : '✗', sentenceModeBtn ? '✓' : '✗');
  console.log('[v11 UI]   - Mobile buttons:', charModeBtnMobile ? '✓' : '✗', sentenceModeBtnMobile ? '✓' : '✗');
  console.log('[v11 UI]   - Prediction button:', predictSentenceBtn ? '✓' : '✗');
  console.log('[v11 UI] =====================================');

})();
