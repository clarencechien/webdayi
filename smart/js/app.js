/**
 * WebDayi Smart — 智慧 2 碼 UI(與 Lite 對齊的 UX)
 *
 * 輸入行為:
 *   - 連續打碼,每 2 鍵 = 一個字,取碼 = 首碼 + 末碼(大易簡碼慣例,不用空白切碼)
 *   - 單碼字(一、大、火、車…):該鍵 + 空白
 *   - 緩衝區的字都是「暫定」(Viterbi 目前最佳路徑,虛線標示,會隨後續輸入回頭修正)
 *   - 候選列預設對準「剛打的字」;要改別的位置就點該字(或 ←/→ 移游標)
 *   - 選字鍵沿用大易/Lite 傳統配置:
 *       Space=第1個、'=第2、[=第3、]=第4、-=第5,`=` 換頁(一頁固定 5 個)
 *     (數字鍵是大易碼,不當選字鍵)
 *   - `  進入全碼逃生口:打全碼 1-4 鍵,同一組選字鍵選字並鎖定
 *   - 空白 = 斷字(結束目前這個字);連按兩下空白 = 送出(Enter 亦可)
 *   - 🌐 = 中(大易)/ 英數 切換;Alt 連按兩下 = 清除緩衝區;Ctrl 連按兩下 = Mini 模式
 *   - 送出後可自動複製(選單可關)
 */
(function () {
    'use strict';

    const DAYI_KEY = /^[a-z0-9,.;/]$/;
    const CTRL_DOUBLE_TAP_MS = 500;   // 連按兩下 Ctrl 切換 Mini 模式(與 Lite 相同)
    const ALT_DOUBLE_TAP_MS = 300;    // 連按兩下 Alt 清除緩衝區(與 Lite 相同)
    const SPACE_DOUBLE_TAP_MS = 400;  // 連按兩下空白 = 送出(空白單擊是斷字)
    // A′ 版面:一頁固定 5 個候選,每格都對應一個選字鍵(大易/Lite 傳統配置的前 5 個)
    const SELECT_KEYS = [' ', "'", '[', ']', '-'];
    const SELECT_LABELS = ['␣', "'", '[', ']', '-'];
    const PAGE_SIZE = SELECT_KEYS.length;

    const KEYBOARD_LAYOUT = [
        [
            { code: '1', label: '1', sub: '言' }, { code: '2', label: '2', sub: '牛' }, { code: '3', label: '3', sub: '目' },
            { code: '4', label: '4', sub: '四' }, { code: '5', label: '5', sub: '王' }, { code: '6', label: '6', sub: '車' },
            { code: '7', label: '7', sub: '田' }, { code: '8', label: '8', sub: '八' }, { code: '9', label: '9', sub: '足' },
            { code: '0', label: '0', sub: '金' }
        ],
        [
            { code: 'q', label: 'Q', sub: '石' }, { code: 'w', label: 'W', sub: '山' }, { code: 'e', label: 'E', sub: '一' },
            { code: 'r', label: 'R', sub: '工' }, { code: 't', label: 'T', sub: '糸' }, { code: 'y', label: 'Y', sub: '火' },
            { code: 'u', label: 'U', sub: '艸' }, { code: 'i', label: 'I', sub: '木' }, { code: 'o', label: 'O', sub: '口' },
            { code: 'p', label: 'P', sub: '耳' }
        ],
        [
            { code: 'a', label: 'A', sub: '人' }, { code: 's', label: 'S', sub: '革' }, { code: 'd', label: 'D', sub: '日' },
            { code: 'f', label: 'F', sub: '土' }, { code: 'g', label: 'G', sub: '手' }, { code: 'h', label: 'H', sub: '鳥' },
            { code: 'j', label: 'J', sub: '月' }, { code: 'k', label: 'K', sub: '立' }, { code: 'l', label: 'L', sub: '女' },
            { code: ';', label: ';', sub: '虫' }
        ],
        // 第 4、5 列沿用 Lite 的幾何:⇧ 的位置放「全碼逃生口」,🌐 維持中/英切換
        [
            { code: '`', label: '全碼', type: 'special', action: 'fullcode' },
            { code: 'z', label: 'Z', sub: '心' }, { code: 'x', label: 'X', sub: '水' }, { code: 'c', label: 'C', sub: '鹿' },
            { code: 'v', label: 'V', sub: '禾' }, { code: 'b', label: 'B', sub: '馬' }, { code: 'n', label: 'N', sub: '魚' },
            { code: 'm', label: 'M', sub: '雨' },
            { code: 'Backspace', label: '⌫', type: 'special', action: 'backspace' }
        ],
        [
            { code: 'Globe', label: '🌐', type: 'special', action: 'toggleIM' },
            { code: 'Space', label: 'Space', type: 'special', action: 'space', width: 'wide' },
            { code: ',', label: ',', sub: '力' },
            { code: '.', label: '.', sub: '舟' },
            { code: '/', label: '/', sub: '竹' }
        ]
    ];
    const KEY_SUB = {};
    KEYBOARD_LAYOUT.flat().forEach(k => { if (k.sub) KEY_SUB[k.code] = k.sub; });

    const state = {
        tokens: [],       // {keys} 待解碼 | {pinned, keys, fc?} 已鎖定
        pendingKey: null, // 2 碼中的第 1 鍵
        decoded: [],      // 目前最佳路徑
        lastWords: [],
        cursor: null,     // 明確選取的修正位置(null = 隱含指向最後一字)
        fc: null,         // 全碼模式 {keys}
        page: 0,
        isMini: false,
        im: 'dayi',              // 'dayi' | 'english'(地球鍵切換)
        lastCtrlPressTime: 0,
        lastAltPressTime: 0,
        lastSpacePressTime: 0,
        settings: { autoCopy: true, theme: null, keyboard: true, focusMode: false, fontScale: 1 },
    };

    let decoder = null;
    let dayiRaw = null;
    let history = null;
    const els = {};

    // ---------- 初始化 ----------
    async function init() {
        [
            'output-buffer', 'compose-area', 'candidate-bar', 'copy-btn', 'clear-btn', 'status-indicator',
            'latency', 'mode-chip', 'virtual-keyboard', 'menu-fab', 'menu-panel', 'toast',
            'font-size-display', 'mini-ui', 'mini-compose', 'mini-cands', 'mini-output',
            'mini-status', 'mini-page', 'history-count'
        ].forEach(id => { els[camel(id)] = document.getElementById(id); });

        loadSettings();
        renderKeyboard();
        setupListeners();
        applySettings();

        try {
            setStatus('載入資料庫中…');
            const [dayi, wordDb, charBigram] = await Promise.all([
                fetchJSON('data/dayi_db.json'),
                fetchJSON('data/word_db.json'),
                fetchJSON('data/char_bigram.json'),
            ]);
            dayiRaw = dayi;
            history = new UserHistory('webdayi_smart_history');
            decoder = new SmartDecoder(wordDb, charBigram, history);
            updateHistoryCount();
            setStatus(`就緒 · 詞庫 ${wordDb.meta.words.toLocaleString()} 詞`);
            render();
        } catch (e) {
            setStatus('資料載入失敗:' + e.message);
        }
    }

    const camel = id => id.replace(/-(\w)/g, (_, c) => c.toUpperCase());

    async function fetchJSON(url) {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`${url} HTTP ${r.status}`);
        return r.json();
    }

    function setStatus(msg) { els.statusIndicator.textContent = msg; }

    function toast(msg) {
        els.toast.textContent = msg;
        els.toast.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => els.toast.classList.remove('show'), 1500);
    }

    function haptic() { if (navigator.vibrate) navigator.vibrate(8); }

    // ---------- 設定 ----------
    function loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem('webdayi_smart_settings') || '{}');
            Object.assign(state.settings, saved);
        } catch (e) { /* 用預設值 */ }
        if (state.settings.theme === null || state.settings.theme === undefined) {
            state.settings.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
    }

    function saveSettings() {
        localStorage.setItem('webdayi_smart_settings', JSON.stringify(state.settings));
    }

    function applySettings() {
        const s = state.settings;
        document.documentElement.dataset.theme = s.theme;
        document.documentElement.style.setProperty('--font-scale', s.fontScale);
        els.fontSizeDisplay.textContent = Math.round(s.fontScale * 100) + '%';
        document.body.classList.toggle('focus-mode', s.focusMode);
        const kb = els.virtualKeyboard;
        kb.classList.toggle('hidden', !s.keyboard);
        setToggle('toggle-autocopy', s.autoCopy ? 'ON' : 'OFF');
        setToggle('toggle-theme', s.theme === 'dark' ? 'ON' : 'OFF');
        setToggle('toggle-keyboard', s.keyboard ? 'ON' : 'OFF');
        setToggle('toggle-focus', s.focusMode ? 'ON' : 'OFF');
        setToggle('toggle-mini', state.isMini ? 'ON' : 'OFF');
        saveSettings();
    }

    function setToggle(id, text) {
        const el = document.getElementById(id);
        if (el) el.querySelector('.toggle-status').textContent = text;
    }

    function updateHistoryCount() {
        if (history) els.historyCount.textContent = Object.keys(history.history || {}).length;
    }

    // ---------- 解碼 ----------
    function render() {
        if (!decoder) return;
        const t0 = performance.now();
        if (state.tokens.length === 0) {
            state.decoded = [];
            state.lastWords = [];
        } else {
            const input = state.tokens.map(t => t.pinned ? { pinned: t.pinned } : t.keys);
            const r = decoder.decode(input);
            if (!r.failed && r.chars.length === state.tokens.length) {
                state.decoded = r.chars;
                state.lastWords = r.words;
            } else {
                state.decoded = state.tokens.map((t, i) => {
                    if (t.pinned) return t.pinned;
                    const prev = i > 0 ? state.decoded[i - 1] : '';
                    const c = decoder.candidatesAt(t.keys, prev, 1);
                    return c.length ? c[0].char : '∅';
                });
                state.lastWords = [];
            }
        }
        els.latency.textContent = state.tokens.length ? `解碼 ${(performance.now() - t0).toFixed(1)}ms` : '';
        renderCompose();
        renderCandidates();
    }

    const keysLabel = keys => [...keys].map(k => KEY_SUB[k] || k).join('');

    /** 目前作用的位置:明確游標,否則隱含指向最後一個字 */
    function activeIndex() {
        if (state.cursor !== null) return state.cursor;
        return state.tokens.length ? state.tokens.length - 1 : null;
    }

    function renderCompose() {
        const build = (mini) => {
            const frag = document.createDocumentFragment();
            const act = activeIndex();
            state.tokens.forEach((t, i) => {
                const cell = document.createElement('div');
                cell.className = 'cell'
                    + (t.pinned ? ' pinned' : '')
                    + (state.cursor === i ? ' selected' : '')
                    + (t.fc ? ' fc-cell' : '');
                cell.innerHTML = `<span class="ch">${state.decoded[i] || '·'}</span><span class="keys">${keysLabel(t.keys)}</span>`;
                cell.addEventListener('click', () => selectCell(i));
                frag.appendChild(cell);
            });
            if (state.fc) {
                const cell = document.createElement('div');
                cell.className = 'cell pending fc-cell';
                const first = state.fc.keys ? (fcCandidates()[0] || {}).char : null;
                cell.innerHTML = `<span class="ch">${first || '全'}</span><span class="keys">${keysLabel(state.fc.keys) || '全碼'}</span>`;
                frag.appendChild(cell);
            } else if (state.pendingKey) {
                const cell = document.createElement('div');
                cell.className = 'cell pending';
                cell.innerHTML = `<span class="ch">·</span><span class="keys">${keysLabel(state.pendingKey)}</span>`;
                frag.appendChild(cell);
            }
            if (frag.childNodes.length) {
                const cur = document.createElement('span');
                cur.className = mini ? 'mini-cursor-inline' : 'compose-cursor';
                cur.textContent = '_';
                if (!mini) frag.appendChild(cur);
            }
            if (!mini && !frag.childNodes.length) {
                const hint = document.createElement('span');
                hint.className = 'compose-hint';
                hint.innerHTML = '連續打碼:每字 2 鍵 = <b>首碼+末碼</b>(單碼字打 1 鍵 + <code>空白</code> 斷字)。'
                    + '打錯按 <code>\'</code> <code>[</code> <code>]</code> 換字,<code>`</code> 打全碼,'
                    + '<b>空白連按兩下送出</b>。';
                frag.appendChild(hint);
            }
            return frag;
        };
        els.composeArea.replaceChildren(build(false));
        if (state.isMini) els.miniCompose.replaceChildren(build(true));
        // 讓最新的字保持在可視範圍
        els.composeArea.scrollLeft = els.composeArea.scrollWidth;
        if (state.isMini) els.miniCompose.scrollLeft = els.miniCompose.scrollWidth;
    }

    /** 目前候選列表(全碼模式 / 修正位置) */
    function currentCandidates() {
        if (state.fc) return fcCandidates();
        const i = activeIndex();
        if (i === null) return [];
        const t = state.tokens[i];
        if (t.fc) return (dayiRaw[t.keys] || []).map(c => ({ char: c.char }));
        const prev = i > 0 ? state.decoded[i - 1] : '';
        return decoder.candidatesAt(t.keys, prev, 60);
    }

    function renderCandidates() {
        const cands = currentCandidates();
        const totalPages = Math.max(1, Math.ceil(cands.length / PAGE_SIZE));
        if (state.page >= totalPages) state.page = 0;
        const start = state.page * PAGE_SIZE;
        const pageCands = cands.slice(start, start + PAGE_SIZE);

        const emptySlot = () => {
            const el = document.createElement('span');
            el.className = 'cand empty';
            el.textContent = '·';
            return el;
        };

        const build = (mini) => {
            const frag = document.createDocumentFragment();
            if (!cands.length) {
                // Mini(A′)保持 5 個空位,版面不塌;主 UI 給提示文字
                if (mini) for (let n = 0; n < PAGE_SIZE; n++) frag.appendChild(emptySlot());
                else {
                    const hint = document.createElement('span');
                    hint.className = 'cand-hint';
                    hint.textContent = state.fc ? '全碼模式:輸入 1-4 碼' : '打字後這裡會列出剛打那個字的候選';
                    frag.appendChild(hint);
                }
                return frag;
            }
            if (!mini) {
                const hint = document.createElement('span');
                hint.className = 'cand-hint';
                const i = activeIndex();
                hint.textContent = state.fc ? '全碼候選:' : `第 ${i + 1} 字:`;
                frag.appendChild(hint);
            }
            for (let idx = 0; idx < PAGE_SIZE; idx++) {
                const c = pageCands[idx];
                if (!c) {
                    if (mini) frag.appendChild(emptySlot());   // A′:候選格數固定
                    continue;
                }
                const el = document.createElement('span');
                el.className = 'cand';
                el.innerHTML = `<span class="num">${SELECT_LABELS[idx]}</span>${c.char}`;
                el.addEventListener('click', () => selectCandidate(idx));
                frag.appendChild(el);
            }
            // Mini 的頁碼在候選區外面的獨立 pill,不佔候選格
            if (!mini && totalPages > 1) {
                const pg = document.createElement('span');
                pg.className = 'cand-page';
                pg.textContent = `${state.page + 1}/${totalPages} (=)`;
                pg.addEventListener('click', nextPage);
                frag.appendChild(pg);
            }
            return frag;
        };
        els.candidateBar.replaceChildren(build(false));
        if (state.isMini) {
            els.miniCands.replaceChildren(build(true));
            els.miniPage.textContent = `${state.page + 1}/${totalPages}`;
        }
    }

    function fcCandidates() {
        if (!state.fc || !state.fc.keys) return [];
        const exact = (dayiRaw[state.fc.keys] || []).map(c => ({ char: c.char, freq: c.freq || 0 }));
        exact.sort((a, b) => b.freq - a.freq);
        return exact;
    }

    function nextPage() {
        const total = Math.ceil(currentCandidates().length / PAGE_SIZE);
        if (total > 1) { state.page = (state.page + 1) % total; renderCandidates(); }
    }

    // ---------- 輸入動作 ----------
    function handleDayiKey(k) {
        haptic();
        if (state.im === 'english') { appendEnglish(k); return; }
        if (state.fc) {
            if (state.fc.keys.length >= 4) return;
            state.fc.keys += k;
            state.page = 0;
            renderCompose();
            renderCandidates();
            return;
        }
        state.cursor = null;
        state.page = 0;
        if (state.pendingKey === null) {
            state.pendingKey = k;
            renderCompose();
        } else {
            const keys = state.pendingKey + k;
            state.pendingKey = null;
            state.tokens.push({ keys });
            render();
        }
    }

    /**
     * 空白鍵 = 斷字(結束目前這個字);連按兩下 = 送出。
     *  - 全碼模式:選第 1 個候選
     *  - 有待配對碼:當成單碼字送進緩衝區(這就是「斷字」)
     *  - 沒有待配對碼:第 1 下不動作(單純斷字),400ms 內第 2 下才送出
     */
    function handleSpace() {
        if (state.im === 'english') { appendEnglish(' '); return; }
        if (state.fc) { selectCandidate(0); return; }
        if (state.pendingKey !== null) {
            haptic();
            state.tokens.push({ keys: state.pendingKey });
            state.pendingKey = null;
            state.cursor = null;
            state.page = 0;
            state.lastSpacePressTime = 0;   // 斷字已發生,不算連按第 1 下
            render();
            return;
        }
        const now = Date.now();
        if (now - state.lastSpacePressTime < SPACE_DOUBLE_TAP_MS) {
            state.lastSpacePressTime = 0;
            commit();
            return;
        }
        state.lastSpacePressTime = now;
        if (state.tokens.length) toast('再按一次空白送出');
    }

    function handleBackspace() {
        haptic();
        if (state.im === 'english') { setOutput(getOutput().slice(0, -1)); return; }
        if (state.fc) {
            if (state.fc.keys.length > 0) state.fc.keys = state.fc.keys.slice(0, -1);
            else { state.fc = null; updateModeChip(); }
            state.page = 0;
            renderCompose();
            renderCandidates();
            return;
        }
        if (state.pendingKey !== null) { state.pendingKey = null; renderCompose(); return; }
        if (state.cursor !== null) { state.cursor = null; state.page = 0; render(); return; }
        state.tokens.pop();
        state.page = 0;
        render();
    }

    function toggleFullCode() {
        haptic();
        if (state.fc) {
            state.fc = null;
        } else {
            state.fc = { keys: state.pendingKey || '' };
            state.pendingKey = null;
            state.cursor = null;
        }
        state.page = 0;
        updateModeChip();
        renderCompose();
        renderCandidates();
    }

    function updateModeChip() {
        const fc = !!state.fc;
        const en = state.im === 'english';
        els.modeChip.textContent = en ? '英數 EN' : (fc ? '全碼逃生口' : '智慧 2 碼');
        els.modeChip.classList.toggle('fc', fc && !en);
        els.modeChip.classList.toggle('en', en);
        els.miniStatus.textContent = en ? 'EN' : (fc ? '全碼' : '易2');
    }

    /** 地球鍵:中(大易 2 碼)/ 英數 切換,與 Lite 相同 */
    function toggleIM() {
        haptic();
        state.im = state.im === 'english' ? 'dayi' : 'english';
        if (state.im === 'english') {
            state.pendingKey = null;
            state.fc = null;
            state.cursor = null;
        }
        updateModeChip();
        renderKeyboard();
        render();
        toast(state.im === 'english' ? '切換到英數' : '切換到大易(智慧 2 碼)');
    }

    /** 英數模式:直接把字元寫進輸出 */
    function appendEnglish(ch) {
        setOutput(getOutput() + ch);
    }

    function selectCandidate(idxOnPage) {
        const cands = currentCandidates();
        const abs = state.page * PAGE_SIZE + idxOnPage;
        if (!cands[abs]) return;
        haptic();
        const char = cands[abs].char;

        if (state.fc) {
            state.tokens.push({ pinned: char, keys: state.fc.keys, fc: true });
            state.fc = null;
            state.cursor = null;
            state.page = 0;
            updateModeChip();
            history.recordCommit(char);
            updateHistoryCount();
            render();
            return;
        }
        const i = activeIndex();
        if (i === null) return;
        const t = state.tokens[i];
        state.tokens[i] = { pinned: char, keys: t.keys, fc: t.fc };
        history.recordCommit(char);          // 修正選字是最強的個人訊號
        updateHistoryCount();
        state.cursor = null;
        state.page = 0;
        render();
    }

    /** 清除緩衝區;緩衝區已空時則清空輸出(Alt 連按兩下) */
    function clearBuffer() {
        haptic();
        if (state.tokens.length || state.pendingKey !== null || state.fc) {
            state.tokens = [];
            state.pendingKey = null;
            state.fc = null;
            state.cursor = null;
            state.page = 0;
            updateModeChip();
            render();
            toast('已清除緩衝區');
        } else if (getOutput()) {
            setOutput('');
            toast('已清空輸出');
        }
    }

    function selectCell(i) {
        state.cursor = state.cursor === i ? null : i;
        state.page = 0;
        renderCompose();
        renderCandidates();
    }

    function moveCursor(delta) {
        if (!state.tokens.length) return;
        const cur = activeIndex();
        state.cursor = Math.max(0, Math.min(state.tokens.length - 1, cur + delta));
        state.page = 0;
        renderCompose();
        renderCandidates();
    }

    function commit() {
        if (!state.decoded.length) return;
        haptic();
        const text = state.decoded.join('');
        setOutput(getOutput() + text);
        state.lastWords.forEach(w => history.recordCommit(w));
        state.decoded.forEach(c => history.recordCommit(c));
        updateHistoryCount();
        state.tokens = [];
        state.decoded = [];
        state.lastWords = [];
        state.cursor = null;
        state.page = 0;
        render();
        if (state.settings.autoCopy) copyOutput(true);
        else toast(`已送出「${text}」`);
    }

    const getOutput = () => els.outputBuffer.value;

    function setOutput(v) {
        els.outputBuffer.value = v;
        els.miniOutput.value = v;
        const target = state.isMini ? els.miniOutput : els.outputBuffer;
        target.scrollTop = target.scrollHeight;
    }

    async function copyOutput(silent) {
        const text = getOutput();
        if (!text) { if (!silent) toast('沒有可複製的內容'); return; }
        try {
            await navigator.clipboard.writeText(text);
        } catch (e) {
            const target = state.isMini ? els.miniOutput : els.outputBuffer;
            target.removeAttribute('readonly');
            target.select();
            document.execCommand('copy');
            target.setAttribute('readonly', '');
        }
        const target = state.isMini ? els.miniOutput : els.outputBuffer;
        target.style.animation = 'none';
        void target.offsetHeight;
        target.style.animation = 'flash-green .3s';
        toast(silent ? '已送出並複製 ✓' : '已複製到剪貼簿 ✓');
    }

    // ---------- 鍵盤 ----------
    function renderKeyboard() {
        const vk = els.virtualKeyboard;
        vk.replaceChildren();
        KEYBOARD_LAYOUT.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'vk-row';
            row.forEach(key => {
                const btn = document.createElement('div');
                const en = state.im === 'english';
                btn.className = 'vk-key' + (key.type === 'special' ? ' special' : '') + (key.width === 'wide' ? ' wide' : '');
                const sub = en ? null : key.sub;   // 英數模式只顯示字母,不顯示部首
                btn.innerHTML = sub
                    ? `<span>${key.label}</span><span class="sub">${sub}</span>`
                    : `<span>${key.label}</span>`;
                btn.addEventListener('click', () => {
                    if (key.action === 'backspace') handleBackspace();
                    else if (key.action === 'space') handleSpace();
                    else if (key.action === 'commit') commit();
                    else if (key.action === 'fullcode') toggleFullCode();
                    else if (key.action === 'toggleIM') toggleIM();
                    else handleDayiKey(key.code);
                });
                ['touchstart', 'mousedown'].forEach(ev =>
                    btn.addEventListener(ev, () => btn.classList.add('active-state'), { passive: true }));
                ['touchend', 'mouseup', 'mouseleave'].forEach(ev =>
                    btn.addEventListener(ev, () => setTimeout(() => btn.classList.remove('active-state'), 90)));
                rowEl.appendChild(btn);
            });
            vk.appendChild(rowEl);
        });
    }

    function setupListeners() {
        document.addEventListener('keydown', (e) => {
            // Alt 熱鍵(與 Lite 相同):單擊 = 送出並複製,連按兩下 = 清除緩衝區
            if (e.key === 'Alt') {
                const now = Date.now();
                if (now - state.lastAltPressTime < ALT_DOUBLE_TAP_MS) {
                    state.lastAltPressTime = 0;
                    clearBuffer();
                    return;   // 不 preventDefault,讓 Alt+Tab 正常
                }
                state.lastAltPressTime = now;
                if (state.decoded.length) commit();
                else if (getOutput()) copyOutput(false);
                return;
            }
            // Ctrl 熱鍵(與 Lite 相同):單擊 = 複製輸出,連按兩下 = 切換 Mini 模式
            if (e.key === 'Control') {
                const now = Date.now();
                if (now - state.lastCtrlPressTime < CTRL_DOUBLE_TAP_MS) {
                    state.lastCtrlPressTime = 0;
                    toggleMini();
                    return;
                }
                state.lastCtrlPressTime = now;
                if (getOutput()) copyOutput(false);
                return;
            }
            if (e.metaKey || e.ctrlKey || e.altKey || !decoder) return;
            const k = e.key;

            // 選字鍵(大易/Lite 傳統配置);Space 另有語意,在 handleSpace 分流
            const selIdx = SELECT_KEYS.indexOf(k);
            if (selIdx > 0) { e.preventDefault(); selectCandidate(selIdx); return; }
            if (k === '=') { e.preventDefault(); nextPage(); return; }
            if (k === ' ') { e.preventDefault(); handleSpace(); return; }
            if (k === 'Backspace') { e.preventDefault(); handleBackspace(); return; }
            if (k === 'Enter') { e.preventDefault(); commit(); return; }
            if (k === '`') { e.preventDefault(); toggleFullCode(); return; }
            if (k === 'ArrowLeft') { e.preventDefault(); moveCursor(-1); return; }
            if (k === 'ArrowRight') { e.preventDefault(); moveCursor(1); return; }
            if (k === 'Escape') {
                e.preventDefault();
                if (state.isMini) { toggleMini(); return; }
                state.cursor = null; state.page = 0; render();
                return;
            }
            const lower = k.toLowerCase();
            if (DAYI_KEY.test(lower)) { e.preventDefault(); handleDayiKey(lower); }
        });

        els.copyBtn.addEventListener('click', () => copyOutput(false));
        els.clearBtn.addEventListener('click', () => { setOutput(''); toast('已清空輸出'); });
        els.miniStatus.addEventListener('click', toggleIM);
        els.miniPage.addEventListener('click', nextPage);

        // FAB 選單
        els.menuFab.addEventListener('click', (e) => {
            e.stopPropagation();
            els.menuPanel.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!els.menuPanel.contains(e.target) && e.target !== els.menuFab) {
                els.menuPanel.classList.add('hidden');
            }
        });
        const menu = {
            'toggle-autocopy': () => { state.settings.autoCopy = !state.settings.autoCopy; },
            'toggle-theme': () => { state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark'; },
            'toggle-keyboard': () => { state.settings.keyboard = !state.settings.keyboard; },
            'toggle-focus': () => { state.settings.focusMode = !state.settings.focusMode; },
            'toggle-mini': () => { toggleMini(); },
        };
        Object.entries(menu).forEach(([id, fn]) => {
            document.getElementById(id).addEventListener('click', () => { fn(); applySettings(); });
        });
        document.getElementById('clear-history').addEventListener('click', () => {
            if (!history) return;
            history.clear();
            updateHistoryCount();
            toast('已清除選字習慣');
            render();
        });
        document.getElementById('font-decrease').addEventListener('click', (e) => {
            e.stopPropagation();
            state.settings.fontScale = Math.max(0.8, +(state.settings.fontScale - 0.1).toFixed(1));
            applySettings();
        });
        document.getElementById('font-increase').addEventListener('click', (e) => {
            e.stopPropagation();
            state.settings.fontScale = Math.min(1.6, +(state.settings.fontScale + 0.1).toFixed(1));
            applySettings();
        });
    }

    function toggleMini() {
        state.isMini = !state.isMini;
        document.body.classList.toggle('mini-mode', state.isMini);
        els.miniUi.classList.toggle('hidden', !state.isMini);
        els.menuPanel.classList.add('hidden');
        setToggle('toggle-mini', state.isMini ? 'ON' : 'OFF');
        setOutput(getOutput());
        render();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
