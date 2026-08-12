/**
 * WebDayi Smart — 智慧 2 碼 UI(PoC)
 *
 * 輸入行為:
 *   - 連續打碼,每 2 鍵 = 一個字,取碼 = 首碼 + 末碼(大易簡碼慣例,不用空白切碼;
 *     完整 token 之後的空白是 no-op,不會造成錯位)
 *   - 單碼字(一、大、火、車…84 個):打該鍵 + 空白
 *   - ` (backtick):全碼逃生口——接下來這個字打全碼(1-4 鍵),數字/空白選字後鎖定
 *   - 緩衝區的字都是「暫定」(Viterbi 目前最佳路徑,會隨後續輸入跳動;虛線標示)
 *   - 點暫定字(或 ←/→ 移游標)列出該位置候選,按數字鍵替換 → 該字鎖定(綠線),
 *     其餘位置用新 context 重跑 Viterbi
 *   - Enter:送出緩衝區到輸出;Copy 交付(維持 Lite 的交付方式)
 */
(function () {
    'use strict';

    const DAYI_KEY = /^[a-z0-9,.;/]$/;

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
        [
            { code: '`', label: '全', type: 'special', action: 'fullcode' },
            { code: 'z', label: 'Z', sub: '心' }, { code: 'x', label: 'X', sub: '水' }, { code: 'c', label: 'C', sub: '鹿' },
            { code: 'v', label: 'V', sub: '禾' }, { code: 'b', label: 'B', sub: '馬' }, { code: 'n', label: 'N', sub: '魚' },
            { code: 'm', label: 'M', sub: '雨' },
            { code: 'Backspace', label: '⌫', type: 'special', action: 'backspace' }
        ],
        [
            { code: 'Enter', label: '送出', type: 'special', action: 'commit' },
            { code: 'Space', label: '空白(單碼字)', type: 'special', action: 'space', width: 'wide' },
            { code: ',', label: ',', sub: '力' },
            { code: '.', label: '.', sub: '舟' },
            { code: '/', label: '/', sub: '竹' }
        ]
    ];
    const KEY_SUB = {};
    KEYBOARD_LAYOUT.flat().forEach(k => { if (k.sub) KEY_SUB[k.code] = k.sub; });

    const state = {
        tokens: [],       // {keys} 待解碼 | {pinned, keys, fc?} 鎖定
        pendingKey: null, // 2 碼的第 1 鍵
        decoded: [],      // 目前最佳路徑的字
        lastWords: [],
        cursor: null,     // 修正游標
        fc: null,         // 全碼模式 {keys, cands}
    };

    let decoder = null;
    let dayiRaw = null;
    let history = null;

    const $ = id => document.getElementById(id);
    const els = {};

    // ---------- 初始化 ----------
    async function init() {
        ['output-buffer', 'compose-area', 'candidate-bar', 'commit-btn', 'buf-backspace-btn',
         'copy-btn', 'clear-btn', 'status-indicator', 'latency', 'mode-chip', 'virtual-keyboard',
         'vk-toggle', 'vk-card', 'toast', 'theme-toggle'].forEach(id => {
            els[id.replace(/-(\w)/g, (_, c) => c.toUpperCase())] = $(id);
        });
        initTheme();
        renderKeyboard();
        setupListeners();
        try {
            setStatus('載入資料庫中…(首次約 5MB,之後有快取)');
            const [dayi, wordDb, charBigram] = await Promise.all([
                fetchJSON('data/dayi_db.json'),
                fetchJSON('data/word_db.json'),
                fetchJSON('data/char_bigram.json'),
            ]);
            dayiRaw = dayi;
            history = new UserHistory('webdayi_smart_history');
            decoder = new SmartDecoder(wordDb, charBigram, history);
            setStatus(`就緒:詞庫 ${wordDb.meta.words.toLocaleString()} 詞(McBopomofo+essay)`);
        } catch (e) {
            setStatus('資料載入失敗:' + e.message);
        }
    }

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
        toast._t = setTimeout(() => els.toast.classList.remove('show'), 1600);
    }

    function initTheme() {
        const saved = localStorage.getItem('webdayi_smart_theme');
        if (saved) document.documentElement.dataset.theme = saved;
        else if (matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'dark';
        els.themeToggle.addEventListener('click', () => {
            const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = cur;
            localStorage.setItem('webdayi_smart_theme', cur);
        });
    }

    // ---------- 解碼與渲染 ----------
    function decodeAndRender() {
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
                // 有 token 查無候選:退化為逐位置解碼,無候選處顯示 ∅
                state.decoded = state.tokens.map((t, i) => {
                    if (t.pinned) return t.pinned;
                    const prev = i > 0 ? state.decoded[i - 1] : '';
                    const c = decoder.candidatesAt(t.keys, prev, 1);
                    return c.length ? c[0].char : '∅';
                });
                state.lastWords = [];
            }
        }
        els.latency.textContent = `解碼 ${(performance.now() - t0).toFixed(1)}ms`;
        renderCompose();
        renderCandidates();
        els.commitBtn.disabled = state.tokens.length === 0 && !state.pendingKey && !state.fc;
    }

    function keysLabel(keys) {
        return [...keys].map(k => KEY_SUB[k] || k).join('');
    }

    function renderCompose() {
        const area = els.composeArea;
        area.innerHTML = '';
        if (state.tokens.length === 0 && !state.pendingKey && !state.fc) {
            area.innerHTML = '<span class="compose-hint">連續打碼:每字 2 鍵 = <b>首碼+末碼</b>(單碼字打 1 鍵 + 空白)。<code>`</code> = 全碼逃生口,Enter = 送出</span>';
            return;
        }
        state.tokens.forEach((t, i) => {
            const cell = document.createElement('div');
            cell.className = 'cell' + (t.pinned ? ' pinned' : '') + (state.cursor === i ? ' selected' : '') + (t.fc ? ' fc-cell' : '');
            cell.innerHTML = `<span class="ch">${state.decoded[i] || '·'}</span><span class="keys">${keysLabel(t.keys)}</span>`;
            cell.addEventListener('click', () => selectCell(i));
            area.appendChild(cell);
        });
        if (state.fc) {
            const cell = document.createElement('div');
            cell.className = 'cell pending fc-cell';
            cell.innerHTML = `<span class="ch">${state.fc.cands.length ? state.fc.cands[0].char : '全'}</span><span class="keys">${keysLabel(state.fc.keys) || '打全碼…'}</span>`;
            area.appendChild(cell);
        } else if (state.pendingKey) {
            const cell = document.createElement('div');
            cell.className = 'cell pending';
            cell.innerHTML = `<span class="ch">·</span><span class="keys">${keysLabel(state.pendingKey)}</span>`;
            area.appendChild(cell);
        }
    }

    function renderCandidates() {
        const bar = els.candidateBar;
        bar.innerHTML = '';
        let cands = [];
        let hint = '';
        if (state.fc) {
            cands = fcCandidates();
            hint = state.fc.keys ? `全碼「${state.fc.keys}」候選(空白選 1;' [ ] - \\ = 選 2-7;或點選)` : '全碼模式:輸入 1-4 碼';
        } else if (state.cursor !== null) {
            const t = state.tokens[state.cursor];
            const prev = state.cursor > 0 ? state.decoded[state.cursor - 1] : '';
            if (t.fc) {
                cands = (dayiRaw[t.keys] || []).map(c => ({ char: c.char }));
            } else {
                cands = decoder.candidatesAt(t.keys, prev, 9);
            }
            hint = `位置 ${state.cursor + 1} 候選(數字鍵替換並鎖定,Esc 取消)`;
        } else {
            bar.innerHTML = '<span class="cand-hint">點選緩衝區的字即可列出該位置候選(按數字鍵替換)</span>';
            return;
        }
        const hintEl = document.createElement('span');
        hintEl.className = 'cand-hint';
        hintEl.textContent = hint;
        bar.appendChild(hintEl);
        const fcSelLabels = ['␣', "'", '[', ']', '-', '\\', '=', '', ''];
        cands.slice(0, 9).forEach((c, i) => {
            const el = document.createElement('span');
            el.className = 'cand';
            const num = state.fc ? (fcSelLabels[i] || '') : String(i + 1);
            el.innerHTML = `<span class="num">${num}</span>${c.char}`;
            el.addEventListener('click', () => selectCandidate(i));
            bar.appendChild(el);
        });
        if (state.cursor !== null && state.tokens[state.cursor].pinned && !state.tokens[state.cursor].fc) {
            const un = document.createElement('span');
            un.className = 'cand';
            un.innerHTML = '<span class="num">↺</span>解除鎖定';
            un.addEventListener('click', unpinAtCursor);
            bar.appendChild(un);
        }
    }

    function fcCandidates() {
        if (!state.fc.keys) return [];
        const exact = (dayiRaw[state.fc.keys] || []).map(c => ({ char: c.char, freq: c.freq || 0 }));
        exact.sort((a, b) => b.freq - a.freq);
        return exact;
    }

    // ---------- 動作 ----------
    function pushToken(keys) {
        state.tokens.push({ keys });
        state.cursor = null;
        decodeAndRender();
    }

    function handleDayiKey(k) {
        if (state.fc) {
            if (state.fc.keys.length >= 4) { toast('全碼最多 4 鍵'); return; }
            state.fc.keys += k;
            state.fc.cands = fcCandidates();
            renderCompose();
            renderCandidates();
            return;
        }
        state.cursor = null;
        if (state.pendingKey === null) {
            state.pendingKey = k;
            renderCompose();
            renderCandidates();
        } else {
            const keys = state.pendingKey + k;
            state.pendingKey = null;
            pushToken(keys);
        }
    }

    function handleSpace() {
        if (state.fc) { selectCandidate(0); return; }
        if (state.pendingKey !== null) {
            const keys = state.pendingKey;   // 單碼字:1 鍵 + 空白
            state.pendingKey = null;
            pushToken(keys);
        }
    }

    function handleBackspace() {
        if (state.fc) {
            if (state.fc.keys.length > 0) {
                state.fc.keys = state.fc.keys.slice(0, -1);
                state.fc.cands = fcCandidates();
            } else {
                state.fc = null;
                updateModeChip();
            }
            renderCompose();
            renderCandidates();
            return;
        }
        if (state.pendingKey !== null) { state.pendingKey = null; renderCompose(); return; }
        if (state.cursor !== null) { state.cursor = null; renderCompose(); renderCandidates(); return; }
        state.tokens.pop();
        decodeAndRender();
    }

    function toggleFullCode() {
        if (state.fc) {
            state.fc = null;
        } else {
            state.fc = { keys: state.pendingKey || '', cands: [] };
            state.pendingKey = null;
            state.cursor = null;
            if (state.fc.keys) state.fc.cands = fcCandidates();
        }
        updateModeChip();
        renderCompose();
        renderCandidates();
    }

    function updateModeChip() {
        if (state.fc) {
            els.modeChip.textContent = '全碼逃生口';
            els.modeChip.classList.add('fc');
        } else {
            els.modeChip.textContent = '智慧 2 碼';
            els.modeChip.classList.remove('fc');
        }
    }

    function selectCandidate(i) {
        if (state.fc) {
            const cands = fcCandidates();
            if (!cands[i]) { if (state.fc.keys) toast('無此候選'); return; }
            state.tokens.push({ pinned: cands[i].char, keys: state.fc.keys, fc: true });
            state.fc = null;
            updateModeChip();
            decodeAndRender();
            return;
        }
        if (state.cursor === null) return;
        const t = state.tokens[state.cursor];
        const prev = state.cursor > 0 ? state.decoded[state.cursor - 1] : '';
        const cands = t.fc ? (dayiRaw[t.keys] || []).map(c => ({ char: c.char })) : decoder.candidatesAt(t.keys, prev, 9);
        if (!cands[i]) return;
        state.tokens[state.cursor] = { pinned: cands[i].char, keys: t.keys, fc: t.fc };
        history.recordCommit(cands[i].char);   // 修正選字是最強的個人訊號
        state.cursor = null;
        decodeAndRender();
    }

    function unpinAtCursor() {
        const t = state.tokens[state.cursor];
        state.tokens[state.cursor] = { keys: t.keys };
        state.cursor = null;
        decodeAndRender();
    }

    function selectCell(i) {
        state.cursor = state.cursor === i ? null : i;
        renderCompose();
        renderCandidates();
    }

    function moveCursor(delta) {
        if (state.tokens.length === 0) return;
        if (state.cursor === null) state.cursor = delta > 0 ? 0 : state.tokens.length - 1;
        else state.cursor = Math.max(0, Math.min(state.tokens.length - 1, state.cursor + delta));
        renderCompose();
        renderCandidates();
    }

    function commit() {
        if (state.decoded.length === 0) return;
        const text = state.decoded.join('');
        els.outputBuffer.value += text;
        // 學習:整詞 + 單字都記(修正過的字已在 selectCandidate 記過)
        state.lastWords.forEach(w => history.recordCommit(w));
        state.decoded.forEach(c => history.recordCommit(c));
        state.tokens = [];
        state.decoded = [];
        state.lastWords = [];
        state.cursor = null;
        decodeAndRender();
        toast(`已送出「${text}」`);
    }

    // ---------- 鍵盤 ----------
    function renderKeyboard() {
        const vk = els.virtualKeyboard;
        KEYBOARD_LAYOUT.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'vk-row';
            row.forEach(key => {
                const btn = document.createElement('div');
                btn.className = 'vk-key' + (key.type === 'special' ? ' special' : '') + (key.width === 'wide' ? ' wide' : '');
                btn.innerHTML = key.sub ? `<span>${key.label}</span><span class="sub">${key.sub}</span>` : `<span>${key.label}</span>`;
                btn.addEventListener('click', () => {
                    if (key.action === 'backspace') handleBackspace();
                    else if (key.action === 'space') handleSpace();
                    else if (key.action === 'commit') commit();
                    else if (key.action === 'fullcode') toggleFullCode();
                    else handleDayiKey(key.code);
                });
                rowEl.appendChild(btn);
            });
            vk.appendChild(rowEl);
        });
        els.vkToggle.addEventListener('click', () => {
            const kb = els.virtualKeyboard;
            const hidden = kb.classList.toggle('hidden');
            els.vkToggle.textContent = hidden ? '展開鍵盤 ▴' : '收合鍵盤 ▾';
        });
        // 桌面預設收合(有實體鍵盤),觸控裝置展開
        if (!('ontouchstart' in window)) {
            els.virtualKeyboard.classList.add('hidden');
            els.vkToggle.textContent = '展開鍵盤 ▴';
        }
    }

    function setupListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (!decoder) return;
            const k = e.key;
            // 修正游標下數字鍵 = 替換候選(此時不在打碼)
            if (/^[1-9]$/.test(k) && state.cursor !== null) {
                e.preventDefault();
                selectCandidate(parseInt(k, 10) - 1);
                return;
            }
            // 全碼模式:數字是大易碼(1=言 2=牛…),選字用 Lite 慣例的選字鍵
            if (state.fc && state.fc.keys) {
                const sel = ["'", '[', ']', '-', '\\', '='].indexOf(k);
                if (sel !== -1) { e.preventDefault(); selectCandidate(sel + 1); return; }
            }
            if (k === ' ') { e.preventDefault(); handleSpace(); return; }
            if (k === 'Backspace') { e.preventDefault(); handleBackspace(); return; }
            if (k === 'Enter') { e.preventDefault(); commit(); return; }
            if (k === '`') { e.preventDefault(); toggleFullCode(); return; }
            if (k === 'ArrowLeft') { e.preventDefault(); moveCursor(-1); return; }
            if (k === 'ArrowRight') { e.preventDefault(); moveCursor(1); return; }
            if (k === 'Escape') { state.cursor = null; renderCompose(); renderCandidates(); return; }
            const lower = k.toLowerCase();
            if (DAYI_KEY.test(lower)) { e.preventDefault(); handleDayiKey(lower); }
        });

        els.commitBtn.addEventListener('click', commit);
        els.bufBackspaceBtn.addEventListener('click', handleBackspace);
        els.copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(els.outputBuffer.value);
                toast('已複製到剪貼簿');
            } catch (e) {
                els.outputBuffer.select();
                document.execCommand('copy');
                toast('已複製(fallback)');
            }
        });
        els.clearBtn.addEventListener('click', () => {
            els.outputBuffer.value = '';
            toast('已清空輸出');
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
