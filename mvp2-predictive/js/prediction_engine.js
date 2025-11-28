/**
 * Prediction Engine for WebDayi MVP2
 * 支援：
 * 1. 補全 (Completion): 有輸入碼時，預測長詞 (如 i -> 想)
 * 2. 聯想 (Next Word): 無輸入碼時，預測下個字 (如 相 -> 信)
 * * Update: 加入「上下文安全機制」，避免在句首或標點後亂猜干擾視線。
 */

// 定義「停止預測」的字元集合（標點符號、空白、換行）
const STOP_CHARS = new Set([
    '，', '。', '？', '！', '：', '；', '、', '「', '」', '『', '』', '（', '）',
    ',', '.', '?', '!', ':', ';', ' ', '\n', '\t'
]);

// 頻率門檻：低於此值的字視為冷僻字
const FREQ_THRESHOLD = 0.00005;

class PredictionEngine {
    constructor(config = {}) {
        this.bigramData = config.bigramData || {};
        this.freqMap = config.freqMap || {};
        this.userHistory = config.userHistory || { getScore: () => 0 };
        this.dayiMap = {}; // Map<code, candidates[]>

        // 權重設定
        this.weights = {
            static: 2.0,   // 靜態頻率 (Boosted from 1.0 to 2.0)
            bigram: 2.5,   // 前字上下文
            user: 10.0     // 用戶習慣
        };

        // [新增] 頻率壓制門檻
        // 如果 (本字頻率 / 預測字頻率) > DOMINANCE_RATIO，則隱藏預測
        // 例如：明(0.18) / 盟(0.005) = 36 > 8 -> 隱藏 "盟"
        // Update: Lowered to 8.0 to handle "天"(0.0024) vs "衝"(0.00026) ratio ~9.2
        this.DOMINANCE_RATIO = 8.0;
    }

    setDayiMap(map) {
        this.dayiMap = map;
    }

    /**
     * 計算分數
     */
    calculateScore(char, lastChar, currentBuffer) {
        const staticFreq = this.freqMap[char] || 0;

        let bigramProb = 0;
        if (lastChar && this.bigramData[lastChar]) {
            // [Fix] Bigram Lookup: Use first char of buffer to find suggestion
            // e.g. buffer="ev", we check "e" -> "天"
            const firstChar = currentBuffer ? currentBuffer[0] : '';
            const suggestion = this.bigramData[lastChar][firstChar];

            if (suggestion === char) {
                // [Context Absolute Priority]
                // 如果完全命中 Bigram 建議，給予 VIP 分數 (1000000.0)
                // 確保它絕對排在第一位，壓過任何頻率或用戶習慣 (User Score * 10 could be high)
                return 1000000.0;
            }
        }

        const userHabit = this.userHistory.getScore(char);

        return (this.weights.static * staticFreq) +
            (this.weights.bigram * bigramProb) +
            (this.weights.user * userHabit);
    }

    /**
     * [Space 鍵用] 取得標準候選字列表
     * 邏輯：盲打優先 (Exact Match First)
     */
    getCandidates(buffer, lastChar) {
        // 1. 精確匹配 (本字)
        const rawCandidates = this.dayiMap[buffer];
        let candidates = [];

        if (rawCandidates) {
            const list = Array.isArray(rawCandidates) ? rawCandidates : [rawCandidates];
            candidates = list.map(c => ({
                char: typeof c === 'object' ? c.char : c,
                originalData: c,
                isExact: true
            }));
        }

        // 2. 延伸預測
        const extensions = this.getExtendedCandidates(buffer);
        candidates = [...candidates, ...extensions];

        // 3. 計算分數
        const scoredCandidates = candidates.map(c => ({
            ...c,
            score: this.calculateScore(c.char, lastChar, buffer)
        }));

        // 4. 排序：本字 > 分數
        scoredCandidates.sort((a, b) => {
            if (a.isExact && !b.isExact) return -1;
            if (!a.isExact && b.isExact) return 1;
            return b.score - a.score;
        });

        // 去重
        const seen = new Set();
        const uniqueCandidates = [];
        for (const c of scoredCandidates) {
            if (!seen.has(c.char)) {
                seen.add(c.char);
                uniqueCandidates.push(c);
            }
        }

        return uniqueCandidates;
    }

    /**
     * [Tab 鍵情境 1]：有輸入碼時的「補全」
     * 回傳最佳的延伸字 (排除本字)
     * Alias: getBestPrediction (for compatibility)
     */
    getBestCompletion(buffer, lastChar) {
        const extensions = this.getExtendedCandidates(buffer);
        if (extensions.length === 0) return null;

        const scored = extensions.map(c => ({
            ...c,
            score: this.calculateScore(c.char, lastChar, buffer)
        }));

        scored.sort((a, b) => b.score - a.score);

        // [新增] 簡單門檻：如果分數太低，代表只是隨便湊的字，不要干擾使用者
        if (scored.length > 0 && scored[0].score < 0.0001) return null;

        const bestExt = scored.length > 0 ? scored[0] : null;
        if (!bestExt) return null;

        // --- [新增] 頻率壓制檢查 (Dominance Check) ---
        // Exception: If bestExt is VIP (Score >= 1000000), bypass suppression
        if (bestExt.score >= 1000000.0) return bestExt;

        // 檢查當前的 buffer 是否已經對應到一個「強勢本字」
        const rawExact = this.dayiMap[buffer];
        if (rawExact) {
            const exactList = Array.isArray(rawExact) ? rawExact : [rawExact];

            // [Context Dominance]
            // 如果本字是 VIP 字 (符合 Bigram 建議)，則壓制所有延伸預測
            // 例如：明(last) + ev(buffer) -> 天(Exact, VIP) -> 壓制 衝(evdj)
            if (lastChar && this.bigramData[lastChar]) {
                const firstChar = buffer[0];
                const suggestion = this.bigramData[lastChar][firstChar];
                // 檢查 exactList 中是否有 VIP 字
                for (const item of exactList) {
                    const char = typeof item === 'object' ? item.char : item;
                    if (char === suggestion) {
                        // Exact Match IS the VIP word. Suppress extensions.
                        return null;
                    }
                }
            }

            // 找出本字中頻率最高的
            let maxExactFreq = 0;
            for (const item of exactList) {
                const char = typeof item === 'object' ? item.char : item;
                const freq = this.freqMap[char] || 0;
                if (freq > maxExactFreq) maxExactFreq = freq;
            }

            // 比較：如果 (本字頻率 / 預測頻率) 差距過大，則不顯示預測
            // 避免干擾：打 "明" (dj) 時顯示 "盟" (djv)
            const predFreq = this.freqMap[bestExt.char] || 0;
            if (predFreq > 0) {
                const ratio = maxExactFreq / predFreq;
                if (ratio > this.DOMINANCE_RATIO) {
                    // console.log(`Prediction suppressed: Exact '${exactList[0].char}'(${maxExactFreq}) dominates '${bestExt.char}'(${predFreq}) ratio=${ratio.toFixed(1)}`);
                    return null;
                }
            } else if (maxExactFreq > 0.01) {
                // 如果預測字頻率為 0 (極冷僻)，且本字稍微常用，直接壓制
                return null;
            }
        }

        return bestExt;
    }

    // Alias for backward compatibility if needed
    getBestPrediction(buffer, lastChar) {
        return this.getBestCompletion(buffer, lastChar);
    }

    /**
     * [Tab 鍵情境 2]：無輸入碼時的「聯想」
     * 根據上一個字預測下一個字
     * [Critical Update] 加入標點符號阻擋機制
     */
    predictNextChar(lastChar) {
        // 1. 安全檢查：如果沒有上個字，或是上個字是標點/換行，絕對不猜
        if (!lastChar || STOP_CHARS.has(lastChar)) {
            return null;
        }

        // 2. 資料檢查
        if (!this.bigramData[lastChar]) return null;

        const possibleNext = this.bigramData[lastChar]; // { "code": "char", ... }
        const nextCandidates = [];

        for (const code in possibleNext) {
            const char = possibleNext[code];
            const userScore = this.userHistory.getScore(char);
            const freqScore = this.freqMap[char] || 0;

            // Bigram 預測的基礎分數應該較高
            const totalScore = freqScore + (userScore * 10);

            nextCandidates.push({ char, code, score: totalScore });
        }

        if (nextCandidates.length === 0) return null;

        // 依分數排序
        nextCandidates.sort((a, b) => b.score - a.score);

        return nextCandidates[0]; // 回傳最高分的下個字
    }

    /**
     * 輔助：找出以 buffer 開頭的所有字
     * [Update] 加入頻率過濾 (Frequency Filtering)
     */
    getExtendedCandidates(buffer) {
        if (!buffer || buffer.length === 0) return [];
        const extensions = [];

        for (const key in this.dayiMap) {
            if (key.length > buffer.length && key.startsWith(buffer)) {
                const raw = this.dayiMap[key];
                const list = Array.isArray(raw) ? raw : [raw];
                for (const item of list) {
                    const char = typeof item === 'object' ? item.char : item;

                    // [新增] 頻率過濾
                    const staticFreq = this.freqMap[char] || 0;
                    const userScore = this.userHistory.getScore(char);

                    // 如果是冷僻字 (頻率低) 且 用戶沒用過 (userScore == 0)，則跳過
                    if (staticFreq < FREQ_THRESHOLD && userScore === 0) {
                        continue;
                    }

                    extensions.push({
                        char: char,
                        isExact: false,
                        code: key
                    });
                }
            }
        }
        return extensions;
    }
}

window.PredictionEngine = PredictionEngine;
