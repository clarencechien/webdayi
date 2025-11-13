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
    console.log('[v11 UI] Waiting for dayiMap to load... (retrying in 100ms)');
    setTimeout(initV11UI, 100);
    return;
  }

  console.log('[v11 UI] Initializing...');

  // ============================================
  // Global State for Sentence Mode Prediction Cycling (Session 10.11 Part 5)
  // ============================================

  let currentPredictions = []; // Top-N predictions from getTopNPredictions()
  let currentPredictionIndex = 0; // Which prediction is currently displayed (0-4)
  let originalPrediction = null; // First prediction (for learning detection)
  let editedPrediction = null; // User's final selection after edits
  let editCursorPosition = -1; // -1 = not editing, 0+ = editing at position

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
      // CRITICAL FIX: Use full ngram_db.json instead of pruned ngram_blended.json
      // Root cause: ngram_blended.json was over-pruned, missing critical bigrams like "何會"
      // Result: Algorithm selects wrong characters (儈 instead of 會) due to missing context
      //
      // Previous (wrong): ngram_blended.json
      //   - count(何會) = 0 (pruned away!)
      //   - Result: P(會|何) = P(儈|何) (no discrimination)
      //   - Prediction: "明天天氣如何儈放假嗎" (wrong at position 6)
      //
      // Current (correct): ngram_db.json
      //   - count(何會) = 1206 (preserved!)
      //   - Result: P(會|何) >> P(儈|何) (12061x ratio)
      //   - Prediction: "明天天真如何會放假嗎" (90% accuracy)
      //
      // Trade-off: File size increases from 1.64MB to ~16MB, but accuracy improves dramatically
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
      console.log(`[v11 UI] N-gram DB loaded (blended): ${stats.uniqueChars} unigrams, ${stats.uniqueBigrams} bigrams, ${(stats.totalChars / 1000000).toFixed(1)}M chars`);

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
    console.log('[updateBufferDisplay] Called');

    if (!bufferedCodesContainer) {
      console.warn('[updateBufferDisplay] bufferedCodesContainer not found!');
      return;
    }

    const buffer = getCodeBuffer();
    console.log(`[updateBufferDisplay] Buffer: [${buffer.join(', ')}], Length: ${buffer.length}`);

    if (buffer.length === 0) {
      bufferedCodesContainer.innerHTML = '<span class="text-sm text-slate-400 dark:text-slate-500 italic">尚無編碼 (No codes yet)</span>';
      console.log('[updateBufferDisplay] Display cleared (empty buffer)');
      // Disable prediction button when buffer is empty
      if (predictSentenceBtn && getInputMode() === 'sentence') {
        predictSentenceBtn.disabled = true;
      }
    } else {
      const html = buffer.map(code =>
        `<span class="buffered-code-badge">${code}</span>`
      ).join('');
      bufferedCodesContainer.innerHTML = html;
      console.log(`[updateBufferDisplay] Display updated: ${html}`);
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

  // Export to window for Space key handler in core_logic.js
  window.updateBufferDisplay = updateBufferDisplay;
  window.updateLivePreviewDisplay = updateLivePreviewDisplay;

  // 🆕 Session 10.11 Part 5: Trigger + Cycle Prediction with top-N
  // Export to window for = key handler in core_logic.js
  window.triggerPrediction = async function triggerPrediction() {
    // Case 1: No predictions yet - TRIGGER prediction
    if (currentPredictions.length === 0) {
      const buffer = getCodeBuffer();

      if (buffer.length === 0) {
        console.warn('[v11 UI] Buffer empty, cannot predict');
        return;
      }

      console.log(`[v11 UI] Triggering top-N predictions for: ${buffer.join(', ')}`);

      // Ensure N-gram DB is loaded
      const ngram = await loadNgramDatabase();
      if (!ngram) {
        alert('N-gram 資料庫未載入，無法預測');
        return;
      }

      // 🆕 Get top-5 predictions (Session 10.11 Part 5)
      if (typeof window.getTopNPredictions !== 'function') {
        console.error('[v11 UI] getTopNPredictions not found! Falling back to single prediction.');
        const result = await predictSentenceFromBuffer(buffer, dayiMap, ngram);
        if (result) {
          currentPredictions = [result];
          currentPredictionIndex = 0;
          originalPrediction = result.sentence;
        }
      } else {
        // Get top-5 predictions with UserDB support
        const userDB = (typeof window.userDB !== 'undefined' && window.userDBReady) ? window.userDB : null;
        currentPredictions = await window.getTopNPredictions(buffer, dayiMap, ngram, userDB, 5);
        currentPredictionIndex = 0;
        originalPrediction = currentPredictions[0]?.sentence || null;
      }

      if (currentPredictions.length === 0) {
        console.error('[v11 UI] No predictions generated');
        alert('預測失敗，請重試');
        return;
      }

      console.log(`[v11 UI] Generated ${currentPredictions.length} predictions`);
      console.log(`[v11 UI] Top prediction: "${currentPredictions[0].sentence}" (score: ${currentPredictions[0].score.toFixed(3)})`);

      // Display first prediction
      displayPredictionWithIndicator(currentPredictions[0], 0, currentPredictions.length);

      // Clear buffer and input (codes are now in prediction state)
      clearCodeBuffer();
      updateBufferDisplay();
      updateLivePreviewDisplay();
      if (inputBox) inputBox.value = '';

    // Case 2: Predictions exist - CYCLE to next prediction
    } else {
      console.log(`[v11 UI] Cycling predictions (current: ${currentPredictionIndex + 1}/${currentPredictions.length})`);

      // Increment index (with wrap-around)
      currentPredictionIndex = (currentPredictionIndex + 1) % currentPredictions.length;

      console.log(`[v11 UI] Showing prediction #${currentPredictionIndex + 1}: "${currentPredictions[currentPredictionIndex].sentence}"`);

      // Display new prediction
      displayPredictionWithIndicator(currentPredictions[currentPredictionIndex], currentPredictionIndex, currentPredictions.length);

      // Reset edited flag when cycling
      editedPrediction = null;
    }
  }

  /**
   * 🆕 Session 10.11 Part 5: Confirm prediction and apply learning
   * Called when user presses Enter in sentence mode
   */
  window.confirmPrediction = async function confirmPrediction() {
    if (currentPredictions.length === 0) {
      console.warn('[v11 UI] No predictions to confirm');
      return;
    }

    console.log('[v11 UI] Confirming prediction...');

    // 🆕 Phase 1.10.1: Get sentence from character spans
    const sentenceDisplay = document.getElementById('sentence-display');
    if (!sentenceDisplay) {
      console.error('[v11 UI] Sentence display element not found');
      return;
    }

    // Read final sentence from character spans
    const charSpans = sentenceDisplay.querySelectorAll('.char-span');
    const finalSentence = Array.from(charSpans).map(span => span.textContent).join('');
    console.log(`[v11 UI] Final sentence: "${finalSentence}" (from ${charSpans.length} character spans)`);
    console.log(`[v11 UI] Original prediction: "${originalPrediction}"`);

    // Detect learning (compare original vs final)
    if (originalPrediction && originalPrediction !== finalSentence) {
      console.log('[v11 UI] Prediction was modified, triggering learning...');

      // Convert strings to arrays for detectLearning
      const originalChars = originalPrediction.split('');
      const finalChars = finalSentence.split('');

      if (typeof window.detectLearning === 'function' && typeof window.applyLearning === 'function') {
        const learningData = window.detectLearning(originalChars, finalChars);

        if (learningData.length > 0 && window.userDB && window.userDBReady) {
          try {
            await window.applyLearning(learningData, window.userDB);
            console.log(`[v11 UI] Applied ${learningData.length} learning points`);

            // Show learning feedback
            if (typeof window.showLearningFeedback === 'function') {
              window.showLearningFeedback(learningData);
            }

            // Update stats
            if (typeof updateUserDBStats === 'function') {
              setTimeout(() => updateUserDBStats(), 100);
            }
          } catch (error) {
            console.error('[v11 UI] Learning failed:', error);
          }
        } else {
          console.log('[v11 UI] No learning data or UserDB not ready');
        }
      } else {
        console.warn('[v11 UI] Learning functions not available');
      }
    } else {
      console.log('[v11 UI] Prediction unchanged, no learning needed');
    }

    // Append to output buffer
    const outputBuffer = document.getElementById('output-buffer');
    if (outputBuffer) {
      outputBuffer.value += finalSentence;
      console.log('[v11 UI] Appended to output buffer');

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

    // Clear prediction state
    currentPredictions = [];
    currentPredictionIndex = 0;
    originalPrediction = null;
    editedPrediction = null;
    console.log('[v11 UI] Prediction state cleared');

    // Clear candidate area
    if (candidateArea) {
      candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 = 預測句子</div>';
    }

    // Focus back to input
    if (inputBox) {
      inputBox.focus();
    }

    console.log('[v11 UI] Confirmation complete!');
  }

  /**
   * Display sentence prediction with editable result
   * 🆕 Phase 1: Prediction is now editable for manual correction + learning
   */
  function displaySentencePrediction(result) {
    if (!candidateArea) return;

    const { sentence, score, chars } = result;
    const buffer = getCodeBuffer();

    const html = `
      <div class="sentence-prediction w-full">
        <div class="prediction-header">
          <span class="material-symbols-outlined">auto_awesome</span>
          <span>智慧預測結果 (Prediction)</span>
          <span class="text-xs ml-2 opacity-70">✏️ 可編輯 (Editable)</span>
        </div>
        <div
          id="prediction-result-text"
          class="predicted-sentence"
          contenteditable="true"
          spellcheck="false"
          style="cursor: text; border: 2px dashed transparent; padding: 8px; border-radius: 4px; transition: all 0.2s;"
          onfocus="this.style.borderColor='#4ec9b0'; this.style.background='rgba(78, 201, 176, 0.05)';"
          onblur="this.style.borderColor='transparent'; this.style.background='transparent';"
        >${sentence}</div>
        <div class="prediction-details">
          <div class="char-breakdown">
            ${chars.map((char, i) => `${char} (${buffer[i]})`).join(' → ')}
          </div>
          <div class="prediction-score">機率分數: ${score.toFixed(3)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            💡 提示：點擊預測結果可編輯，編輯後按 = 確認，系統將學習您的偏好
          </div>
        </div>
      </div>
    `;

    candidateArea.innerHTML = html;

    // Focus the editable prediction for immediate editing
    setTimeout(() => {
      const editableArea = document.getElementById('prediction-result-text');
      if (editableArea) {
        // Set cursor at end of text
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editableArea);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        console.log('[Phase 1] Prediction displayed and ready for editing');
      }
    }, 100);
  }

  /**
   * Display sentence prediction with cycling indicator (Session 10.11 Part 5)
   * 🆕 Phase 1.10: Uses character span architecture instead of contenteditable
   * Shows prediction number (e.g., "預測 2/5") and hint text
   *
   * @param {Object} prediction - Prediction object with {sentence, score, path}
   * @param {number} index - Current prediction index (0-based)
   * @param {number} total - Total number of predictions
   */
  function displayPredictionWithIndicator(prediction, index, total) {
    if (!candidateArea) return;

    const { sentence, score, path } = prediction;

    // 🆕 Phase 1.10.1: Build character spans with data attributes
    const charSpans = path.map((p, i) => {
      // Get all candidates for this position from dayiMap
      const candidates = dayiMap.get(p.code) || [];
      // 🐛 FIX Phase 1.10.2: Sort by frequency and limit to 6 candidates
      const sortedCandidates = sortCandidatesByFreq(candidates).slice(0, 6);
      const candidateChars = sortedCandidates.map(c => c.char);

      // Build data attributes
      const dataIndex = i;
      const dataCode = p.code;
      const dataCandidates = JSON.stringify(candidateChars);

      return `<span class="char-span" data-index="${dataIndex}" data-code="${dataCode}" data-candidates='${dataCandidates}'>${p.char}</span>`;
    }).join('');

    const html = `
      <div class="sentence-prediction w-full">
        <div class="prediction-header flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined">auto_awesome</span>
            <span>智慧預測結果</span>
            <span class="text-xs ml-2 opacity-70">✏️ 點擊字元可重選</span>
          </div>
          <div class="prediction-indicator text-sm font-bold px-3 py-1 rounded-full" style="background: rgba(78, 201, 176, 0.2); color: #4ec9b0;">
            預測 ${index + 1}/${total}
          </div>
        </div>
        <div
          id="sentence-display"
          class="sentence-display"
          tabindex="0"
          role="group"
          aria-label="預測句子"
        >${charSpans}</div>
        <div class="prediction-details">
          <div class="char-breakdown">
            ${path.map((p, i) => `${p.char} (${p.code})`).join(' → ')}
          </div>
          <div class="prediction-score">機率分數: ${score.toFixed(3)}</div>
          <div class="prediction-hint text-xs mt-2 p-2 rounded" style="background: rgba(78, 201, 176, 0.1); color: #4ec9b0;">
            <kbd>=</kbd> 切換預測 | <kbd>點擊字</kbd> 重選 | <kbd>Enter</kbd> 確認
          </div>
        </div>
      </div>
    `;

    candidateArea.innerHTML = html;

    // 🆕 Phase 1.10.1: Attach click handlers to character spans
    attachCharacterClickHandlers();

    // 🐛 FIX Phase 1.10.3: Auto-focus sentence display for immediate arrow key navigation
    const sentenceDisplay = document.getElementById('sentence-display');
    if (sentenceDisplay) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        sentenceDisplay.focus();
        console.log('[Phase 1.10.3] Auto-focused sentence display for arrow navigation');
      }, 50);
    }

    console.log(`[Phase 1.10.1] Prediction ${index + 1}/${total} displayed with ${path.length} clickable characters`);
  }

  /**
   * 🆕 Phase 1.10.1: Attach click event handlers to character spans
   * 🆕 Phase 1.10.2: Now opens candidate modal on click
   */
  function attachCharacterClickHandlers() {
    const charSpans = document.querySelectorAll('.char-span');

    charSpans.forEach((span, index) => {
      span.addEventListener('click', function() {
        const dataIndex = parseInt(this.dataset.index, 10);
        const dataCode = this.dataset.code;
        const dataCandidates = JSON.parse(this.dataset.candidates);

        console.log(`[Phase 1.10.2] Character clicked:`, {
          index: dataIndex,
          char: this.textContent,
          code: dataCode,
          candidates: dataCandidates
        });

        // 🆕 Phase 1.10.2: Show candidate modal
        showCandidateModal(dataIndex, dataCode, dataCandidates);
      });
    });

    console.log(`[Phase 1.10.2] Attached click handlers to ${charSpans.length} characters`);
  }

  /**
   * 🆕 Phase 1.10.2: Show candidate selection modal
   * @param {number} charIndex - Character position (0-based)
   * @param {string} code - Dayi code (e.g., "4jp")
   * @param {Array<string>} candidates - Array of candidate characters
   */
  window.showCandidateModal = function showCandidateModal(charIndex, code, candidates) {
    const modal = document.getElementById('candidate-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const candidatesGrid = document.getElementById('candidates-grid');

    if (!modal || !backdrop || !modalTitle || !candidatesGrid) {
      console.error('[Phase 1.10.2] Modal elements not found');
      return;
    }

    // Store current editing context
    window.currentEditingIndex = charIndex;

    // Update modal title
    modalTitle.textContent = `選擇字元 (位置 ${charIndex}: ${code})`;

    // Highlight the character being edited
    const charSpans = document.querySelectorAll('.char-span');
    charSpans.forEach((span, i) => {
      span.classList.toggle('editing', i === charIndex);
    });

    // Keyboard shortcut keys (6 candidates max: Space, ', [, ], -, \)
    const shortcutKeys = [' ', "'", '[', ']', '-', '\\'];
    const shortcutLabels = ['Space', "'", '[', ']', '-', '\\'];

    // Populate candidates grid
    candidatesGrid.innerHTML = candidates.map((char, i) => {
      const keyLabel = i < shortcutLabels.length ? shortcutLabels[i] : '';
      return `
        <button class="candidate-btn" data-index="${i}" data-char="${char}">
          <span class="candidate-char">${char}</span>
          ${keyLabel ? `<span class="candidate-key">${keyLabel}</span>` : ''}
        </button>
      `;
    }).join('');

    // Attach click handlers to candidate buttons
    const candidateButtons = candidatesGrid.querySelectorAll('.candidate-btn');
    candidateButtons.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        selectCandidate(charIndex, candidates[i]);
      });
    });

    // Show modal and backdrop
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');

    console.log(`[Phase 1.10.2] Modal shown for character ${charIndex} (${code}) with ${candidates.length} candidates`);
  }

  /**
   * 🆕 Phase 1.10.2: Close candidate selection modal
   */
  window.closeCandidateModal = function closeCandidateModal() {
    const modal = document.getElementById('candidate-modal');
    const backdrop = document.getElementById('modal-backdrop');

    if (modal) modal.classList.add('hidden');
    if (backdrop) backdrop.classList.add('hidden');

    // Remove editing highlight from all characters
    const charSpans = document.querySelectorAll('.char-span');
    charSpans.forEach(span => span.classList.remove('editing'));

    // Clear editing context
    window.currentEditingIndex = -1;

    console.log('[Phase 1.10.2] Modal closed');
  }

  /**
   * 🆕 Phase 1.10.2: Select a candidate character
   * 🆕 Phase 1.10.3: Added auto-advance to next character
   * @param {number} charIndex - Character position to update
   * @param {string} newChar - New character to replace with
   */
  window.selectCandidate = function selectCandidate(charIndex, newChar) {
    const charSpans = document.querySelectorAll('.char-span');

    if (charIndex < 0 || charIndex >= charSpans.length) {
      console.error(`[Phase 1.10.2] Invalid charIndex: ${charIndex}`);
      return;
    }

    const targetSpan = charSpans[charIndex];

    // Update character text
    const oldChar = targetSpan.textContent;
    targetSpan.textContent = newChar;

    // Mark as edited (for learning detection)
    targetSpan.dataset.edited = 'true';

    console.log(`[Phase 1.10.2] Character ${charIndex} updated: "${oldChar}" → "${newChar}"`);

    // Close modal
    closeCandidateModal();

    // 🆕 Phase 1.10.3: Auto-advance to next character
    if (charIndex + 1 < charSpans.length) {
      const nextSpan = charSpans[charIndex + 1];
      const nextCode = nextSpan.dataset.code;
      const nextCandidates = JSON.parse(nextSpan.dataset.candidates);

      // Small delay to allow modal close animation to complete
      setTimeout(() => {
        showCandidateModal(charIndex + 1, nextCode, nextCandidates);
        console.log(`[Phase 1.10.3] Auto-advanced to character ${charIndex + 1}`);
      }, 150);
    } else {
      // 🆕 Phase 1.10.4: Last character - show finish hint
      console.log(`[Phase 1.10.4] Last character selected, showing finish hint`);
      showFinishHint();
    }
  }

  /**
   * 🆕 Phase 1.10.4: Show finish hint after editing last character
   */
  window.showFinishHint = function showFinishHint() {
    const finishHint = document.getElementById('finish-hint');
    const sentenceDisplay = document.getElementById('sentence-display');

    // Show the finish hint
    if (finishHint) {
      finishHint.classList.remove('hidden');
      console.log('[Phase 1.10.4] Finish hint shown');
    }

    // Focus sentence display for Enter key
    if (sentenceDisplay) {
      setTimeout(() => {
        sentenceDisplay.focus();
        console.log('[Phase 1.10.4] Sentence display focused for Enter key');
      }, 50);
    }
  }

  /**
   * 🆕 Phase 1.10.4: Submit edited sentence to output buffer
   */
  window.submitEditedSentence = function submitEditedSentence() {
    const sentenceDisplay = document.getElementById('sentence-display');
    const outputBuffer = document.getElementById('output-buffer');
    const finishHint = document.getElementById('finish-hint');

    if (!sentenceDisplay) {
      console.error('[Phase 1.10.4] Sentence display not found');
      return;
    }

    // Extract final sentence from character spans
    const charSpans = sentenceDisplay.querySelectorAll('.char-span');
    if (charSpans.length === 0) {
      console.warn('[Phase 1.10.4] No characters to submit');
      return;
    }

    const finalSentence = Array.from(charSpans).map(span => span.textContent).join('');
    console.log(`[Phase 1.10.4] Submitting sentence: "${finalSentence}"`);

    // Append to output buffer
    if (outputBuffer) {
      outputBuffer.value += finalSentence;
      console.log('[Phase 1.10.4] Appended to output buffer');
    }

    // Hide finish hint
    if (finishHint) {
      finishHint.classList.add('hidden');
    }

    // Clear code buffer state
    clearCodeBuffer();

    // Clear candidate area
    if (candidateArea) {
      candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 = 預測句子</div>';
    }

    console.log('[Phase 1.10.4] Submit complete');
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

    // 🆕 Phase 1: Run Viterbi prediction (now async with UserDB)
    if (typeof predictSentenceFromBuffer === 'function') {
      const result = await predictSentenceFromBuffer(buffer, dayiMap, ngram);

      if (result) {
        console.log(`[Prediction] Result: "${result.sentence}" (score: ${result.score.toFixed(3)})`);

        // 🆕 Phase 1: Store prediction for learning detection
        window.lastPrediction = result.sentence;

        // Update prediction display ONLY (don't output yet)
        updatePredictionDisplay(result.sentence, result.score);
      } else {
        console.warn('[Prediction] No result from Viterbi');
      }
    }
  }

  /**
   * Confirm prediction and output to buffer
   * 🆕 Phase 1: Now includes learning workflow (detect + apply + feedback)
   * Called when = is pressed in sentence mode
   */
  window.confirmPrediction = async function confirmPrediction() {
    const predictionArea = document.getElementById('prediction-result-text');
    if (!predictionArea) {
      console.warn('[Confirm] Prediction area not found');
      return;
    }

    const finalSentence = predictionArea.textContent;

    if (finalSentence && finalSentence !== '(等待預測)') {
      console.log(`[Confirm] Outputting: "${finalSentence}"`);

      // 🆕 Phase 1: Learning Detection
      // Compare prediction with final output (for manual corrections)
      const originalPrediction = window.lastPrediction || finalSentence;

      if (originalPrediction !== finalSentence) {
        console.log(`[Learning] Detected correction: "${originalPrediction}" → "${finalSentence}"`);

        // Detect learning points
        if (typeof detectLearning === 'function') {
          const learningData = detectLearning(originalPrediction, finalSentence);

          if (learningData && learningData.length > 0) {
            console.log(`[Learning] Found ${learningData.length} learning points`, learningData);

            // Apply learning to UserDB
            if (window.userDB && window.userDBReady && typeof applyLearning === 'function') {
              try {
                await applyLearning(learningData, window.userDB);
                console.log('[Learning] Successfully applied learning to UserDB');

                // Show feedback to user
                if (typeof showLearningFeedback === 'function') {
                  showLearningFeedback(learningData);
                }

                // Update stats display
                if (typeof updateUserDBStats === 'function') {
                  setTimeout(() => updateUserDBStats(), 500);
                }
              } catch (error) {
                console.error('[Learning] Failed to apply learning:', error);
              }
            } else {
              console.warn('[Learning] UserDB not ready, skipping learning');
            }
          }
        }
      } else {
        console.log('[Learning] No correction detected (prediction accepted as-is)');
      }

      // Append to output
      const outputBuffer = document.getElementById('output-buffer');
      if (outputBuffer) {
        outputBuffer.value += finalSentence;

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

      // Clear input box and stored prediction
      if (inputBox) inputBox.value = '';
      window.lastPrediction = null;

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
        candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 = 預測句子</div>';
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
        candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 = 預測句子</div>';
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
        candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 = 預測句子</div>';
      }
      console.log('[v11 UI] Buffer cleared');
    });
  }

  // Prediction button (replaces = key for mobile)
  // NOTE: This triggers prediction + output (same as = key)
  if (predictSentenceBtn) {
    predictSentenceBtn.addEventListener('click', async () => {
      console.log('[v11 UI] Prediction button clicked');
      // Call triggerPrediction (same as = key)
      if (typeof window !== 'undefined' && typeof window.triggerPrediction === 'function') {
        await window.triggerPrediction();
      } else if (typeof triggerPrediction === 'function') {
        await triggerPrediction();
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

      // CRITICAL: Ignore = character (handled by keydown, not input)
      // If = appears in input, it means keydown didn't prevent it
      // This prevents "無效編碼: =" error
      if (value === '=' || value.includes('=')) {
        // Clear the input box to remove the = character
        originalInputBox.value = '';
        return; // Don't process as Dayi code
      }

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
                已加入編碼 "${value}"，繼續輸入或按 = 預測
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
              candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 = 預測句子</div>';
            }
          }, 1000);
        }
      }

      previousValue = originalInputBox.value;
    });

    // Enhanced keydown handler for v11
    // NOTE: Space and = keys are handled by core_logic.js
    // This handler only adds sentence-mode-specific features
    originalInputBox.addEventListener('keydown', async (e) => {
      if (getInputMode() !== 'sentence') {
        return; // Let original handler in core_logic.js handle it
      }

      const key = e.key;

      // = key: Trigger prediction (handled here to prevent default)
      // NOTE: Actual prediction logic is in core_logic.js, but we need
      // to prevent = from being added to input box
      if (key === '=') {
        e.preventDefault();
        // Let core_logic.js handler do the prediction
        return;
      }

      // Space key: DO NOT handle it here at all
      // Let it propagate to core_logic.js keydown handler
      // (If we return early, we need to check that core_logic.js handler runs first)

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
          candidateArea.innerHTML = '<div class="w-full text-center text-sm text-slate-400 py-4">輸入編碼後按 = 預測句子</div>';
        }
        console.log('[v11 UI] Buffer cleared via ESC');
      }
    });
  }

  // ============================================
  // 🆕 Phase 1.10.2: Modal Event Handlers
  // ============================================

  // Close button
  const closeModalBtn = document.getElementById('close-modal-btn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      closeCandidateModal();
    });
  }

  // Backdrop click
  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', () => {
      closeCandidateModal();
    });
  }

  // Keyboard shortcuts for modal
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('candidate-modal');
    const isModalVisible = modal && !modal.classList.contains('hidden');

    if (!isModalVisible) return;

    const key = e.key;

    // Escape key: Close modal
    if (key === 'Escape') {
      e.preventDefault();
      closeCandidateModal();
      return;
    }

    // Quick selection keys: Space, ', [, ], -, \
    const shortcutKeys = {
      ' ': 0,  // Space → candidate 0
      "'": 1,  // ' → candidate 1
      '[': 2,  // [ → candidate 2
      ']': 3,  // ] → candidate 3
      '-': 4,  // - → candidate 4
      '\\': 5  // \ → candidate 5
    };

    if (key in shortcutKeys) {
      e.preventDefault();
      const candidateIndex = shortcutKeys[key];

      // Get current editing context
      const charIndex = window.currentEditingIndex;
      if (charIndex === -1) {
        console.warn('[Phase 1.10.2] No character being edited');
        return;
      }

      // Get candidates from modal
      const candidatesGrid = document.getElementById('candidates-grid');
      const candidateButtons = candidatesGrid.querySelectorAll('.candidate-btn');

      if (candidateIndex < candidateButtons.length) {
        const selectedChar = candidateButtons[candidateIndex].dataset.char;
        selectCandidate(charIndex, selectedChar);
        console.log(`[Phase 1.10.2] Keyboard shortcut "${key}" → candidate ${candidateIndex}: ${selectedChar}`);
      } else {
        console.warn(`[Phase 1.10.2] No candidate at index ${candidateIndex}`);
      }
    }
  });

  // ============================================
  // 🆕 Phase 1.10.3: Arrow Key Navigation + Focus Management
  // ============================================

  // Track current focused character index (-1 = no focus)
  let currentFocusedIndex = -1;

  /**
   * 🆕 Phase 1.10.3: Set focus to a specific character
   * @param {number} index - Character index to focus (-1 to clear focus)
   */
  function setCharacterFocus(index) {
    const charSpans = document.querySelectorAll('.char-span');

    // Remove focus from all characters
    charSpans.forEach(span => span.classList.remove('focused'));

    // Set focus if valid index
    if (index >= 0 && index < charSpans.length) {
      charSpans[index].classList.add('focused');
      currentFocusedIndex = index;
      console.log(`[Phase 1.10.3] Focus set to character ${index}`);
    } else {
      currentFocusedIndex = -1;
      console.log(`[Phase 1.10.3] Focus cleared`);
    }
  }

  /**
   * 🆕 Phase 1.10.3: Navigate to previous character
   */
  function navigateToPreviousChar() {
    const charSpans = document.querySelectorAll('.char-span');

    if (charSpans.length === 0) return;

    // If no focus, focus last character
    if (currentFocusedIndex === -1) {
      setCharacterFocus(charSpans.length - 1);
      return;
    }

    // Move focus left (stop at 0)
    if (currentFocusedIndex > 0) {
      setCharacterFocus(currentFocusedIndex - 1);
    } else {
      console.log(`[Phase 1.10.3] Already at first character`);
    }
  }

  /**
   * 🆕 Phase 1.10.3: Navigate to next character
   */
  function navigateToNextChar() {
    const charSpans = document.querySelectorAll('.char-span');

    if (charSpans.length === 0) return;

    // If no focus, focus first character
    if (currentFocusedIndex === -1) {
      setCharacterFocus(0);
      return;
    }

    // Move focus right (stop at last)
    if (currentFocusedIndex < charSpans.length - 1) {
      setCharacterFocus(currentFocusedIndex + 1);
    } else {
      console.log(`[Phase 1.10.3] Already at last character`);
    }
  }

  /**
   * 🆕 Phase 1.10.3: Open modal for currently focused character
   */
  function openModalForFocusedChar() {
    if (currentFocusedIndex === -1) {
      console.warn(`[Phase 1.10.3] No character focused`);
      return;
    }

    const charSpans = document.querySelectorAll('.char-span');
    if (currentFocusedIndex < charSpans.length) {
      const span = charSpans[currentFocusedIndex];
      const code = span.dataset.code;
      const candidates = JSON.parse(span.dataset.candidates);

      showCandidateModal(currentFocusedIndex, code, candidates);
      console.log(`[Phase 1.10.3] Opened modal for focused character ${currentFocusedIndex}`);
    }
  }

  // Arrow key navigation + Space/Enter keys (only when modal is closed)
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('candidate-modal');
    const isModalVisible = modal && !modal.classList.contains('hidden');

    // Only allow arrow navigation when modal is closed
    if (isModalVisible) return;

    // Only handle keys when sentence display exists
    const charSpans = document.querySelectorAll('.char-span');
    if (charSpans.length === 0) return;

    const key = e.key;

    if (key === 'ArrowLeft') {
      e.preventDefault();
      navigateToPreviousChar();
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      navigateToNextChar();
    } else if (key === ' ') {
      // 🆕 Phase 1.10.4: Space key opens modal for focused character
      if (currentFocusedIndex !== -1) {
        e.preventDefault();
        openModalForFocusedChar();
      }
    } else if (key === 'Enter') {
      // 🆕 Phase 1.10.4: Enter key submits edited sentence (only when finish hint visible)
      const finishHint = document.getElementById('finish-hint');
      if (finishHint && !finishHint.classList.contains('hidden')) {
        e.preventDefault();
        submitEditedSentence();
      }
    }
  });

  // Export functions for testing
  window.setCharacterFocus = setCharacterFocus;
  window.navigateToPreviousChar = navigateToPreviousChar;
  window.navigateToNextChar = navigateToNextChar;
  window.openModalForFocusedChar = openModalForFocusedChar;

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
