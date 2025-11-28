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
            const suggestion = this.bigramData[lastChar][currentBuffer];
            if (suggestion === char) bigramProb = 1.0;
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

        return scored.length > 0 ? scored[0] : null;
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
