/**
 * Viterbi v2.6 Alternative Implementation
 *
 * User-provided cleaner implementation with:
 * - 60/40 weighting (more conservative, trusts unigram more)
 * - Backoff mechanism with 0.4 penalty for unseen bigrams
 * - OOP design with ES6 class
 *
 * This is a Node.js version for testing. Browser version will be created if this performs better.
 */

// 權重設定 (可調整)
// 0.6 代表我們 60% 相信前後文關係，40% 相信字本身的常用度
const BIGRAM_WEIGHT = 0.6;
const UNIGRAM_WEIGHT = 1 - BIGRAM_WEIGHT;

// 極小機率 (避免 Log(0) 變成 -Infinity)
const MIN_PROB = 1e-10;

class Viterbi {
    constructor(ngramData) {
        this.unigramCounts = ngramData.unigram_counts;
        this.bigramCounts = ngramData.bigram_counts;

        // 計算總字數 (用於計算 Unigram 機率)
        this.totalUnigrams = Object.values(this.unigramCounts).reduce((a, b) => a + b, 0);
    }

    /**
     * 取得單字機率 P(A)
     */
    getUnigramProb(char) {
        const count = this.unigramCounts[char] || 0;
        // 平滑化：如果沒見過，給一個極小值，而不是 0
        return (count + 1) / (this.totalUnigrams + 10000); // +1 Smoothing
    }

    /**
     * 取得轉移機率 P(B|A)
     * 這裡使用簡單的平滑化
     */
    getBigramProb(prevChar, currChar) {
        const prevNode = this.bigramCounts[prevChar];

        // 如果前一個字完全沒在 Bigram 表出現過 (冷門字)
        // 我們就完全依賴 currChar 的 Unigram 機率 (Backoff)
        if (!prevNode) {
            return this.getUnigramProb(currChar);
        }

        const bigramCount = prevNode[currChar];

        if (bigramCount) {
            // 如果有這個組合，計算條件機率
            // P(B|A) = Count(A,B) / Count(A)
            // 這裡簡化計算，分母用 Unigram Count 估算
            const prevCount = this.unigramCounts[prevChar] || 1;
            return bigramCount / prevCount;
        } else {
            // 【關鍵 Backoff】
            // 如果沒見過 ("何", "會") 這個組合，不要回傳 0
            // 而是回傳 "會" 的單字機率 * 懲罰係數 (0.4)
            // 這讓 "如何會" (雖然沒見過) 的分數 遠高於 "如何儈"
            return this.getUnigramProb(currChar) * 0.4;
        }
    }

    /**
     * 計算最佳路徑
     * @param {Array<Array<Object>>} lattice - 候選字格狀圖 [[{char:'明',...}], [{char:'天',...}]]
     */
    calculateBestPath(lattice) {
        if (!lattice || lattice.length === 0) return "";

        // DP 表：儲存到達每個節點的最大分數
        // path[i][j] = { score: number, prevNodeIndex: number }
        let dp = [];

        // --- 1. 初始化第一層 (T=0) ---
        dp[0] = [];
        for (let i = 0; i < lattice[0].length; i++) {
            const node = lattice[0][i];
            const prob = this.getUnigramProb(node.char);
            dp[0][i] = {
                score: Math.log(prob), // 第一個字只看 Unigram
                prevNodeIndex: -1
            };
        }

        // --- 2. 遞推 (Recursion) ---
        for (let t = 1; t < lattice.length; t++) {
            dp[t] = [];
            const currNodes = lattice[t];
            const prevNodes = lattice[t - 1];

            for (let currIdx = 0; currIdx < currNodes.length; currIdx++) {
                const currChar = currNodes[currIdx].char;

                let maxScore = -Infinity;
                let bestPrevIdx = -1;

                // 窮舉前一層的所有節點，找出連到這裡分數最高的
                for (let prevIdx = 0; prevIdx < prevNodes.length; prevIdx++) {
                    const prevChar = prevNodes[prevIdx].char;
                    const prevScore = dp[t - 1][prevIdx].score;

                    // --- 【關鍵修正區】 ---

                    // 1. Bigram 分數 (前後關係)
                    const bigramProb = Math.max(this.getBigramProb(prevChar, currChar), MIN_PROB);
                    const bigramScore = Math.log(bigramProb);

                    // 2. Unigram 分數 (自身熱度)
                    const unigramProb = Math.max(this.getUnigramProb(currChar), MIN_PROB);
                    const unigramScore = Math.log(unigramProb);

                    // 3. 混合加權分數
                    // Score = 0.6 * 關係分 + 0.4 * 熱度分
                    const transitionScore = (BIGRAM_WEIGHT * bigramScore) + (UNIGRAM_WEIGHT * unigramScore);

                    const totalScore = prevScore + transitionScore;

                    if (totalScore > maxScore) {
                        maxScore = totalScore;
                        bestPrevIdx = prevIdx;
                    }
                }

                dp[t][currIdx] = {
                    score: maxScore,
                    prevNodeIndex: bestPrevIdx
                };
            }
        }

        // --- 3. 回溯 (Backtracking) ---
        // 找出最後一層分數最高的節點
        let lastLayer = dp[dp.length - 1];
        let maxEndScore = -Infinity;
        let bestEndIdx = -1;

        for (let i = 0; i < lastLayer.length; i++) {
            if (lastLayer[i].score > maxEndScore) {
                maxEndScore = lastLayer[i].score;
                bestEndIdx = i;
            }
        }

        // 倒推路徑
        let path = [];
        let currIdx = bestEndIdx;
        for (let t = dp.length - 1; t >= 0; t--) {
            const char = lattice[t][currIdx].char;
            path.unshift(char);
            currIdx = dp[t][currIdx].prevNodeIndex;
        }

        return path.join("");
    }
}

// Node.js wrapper function to match existing API
function viterbi_v26(codes, dayiDb, ngramDb) {
    // Build lattice
    const lattice = [];
    for (const code of codes) {
        const candidates = dayiDb.get(code);
        if (!candidates || candidates.length === 0) {
            throw new Error(`No candidates found for code: ${code}`);
        }
        lattice.push(candidates);
    }

    // Create Viterbi instance and run
    const vit = new Viterbi(ngramDb);
    const sentence = vit.calculateBestPath(lattice);

    // Calculate final score for compatibility
    let totalScore = 0;
    const chars = sentence.split('');

    for (let i = 0; i < chars.length; i++) {
        if (i === 0) {
            const prob = vit.getUnigramProb(chars[i]);
            totalScore += Math.log(Math.max(prob, MIN_PROB));
        } else {
            const bigramProb = vit.getBigramProb(chars[i-1], chars[i]);
            const unigramProb = vit.getUnigramProb(chars[i]);
            const transScore = (BIGRAM_WEIGHT * Math.log(Math.max(bigramProb, MIN_PROB))) +
                              (UNIGRAM_WEIGHT * Math.log(Math.max(unigramProb, MIN_PROB)));
            totalScore += transScore;
        }
    }

    return {
        sentence: sentence,
        chars: chars,
        score: totalScore
    };
}

module.exports = { Viterbi, viterbi_v26 };
