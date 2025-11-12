/**
 * Viterbi v2.7 - Best Hybrid Implementation
 *
 * 混合方案 (Best Strategy):
 * - 代碼結構: 採用 v2.6 的 OOP 寫法 (清晰、參數化)
 * - 核心參數: 採用 v2.5 的 70/30 權重 (已驗證最佳)
 * - 平滑演算法: 採用 v2.5 的 Laplace Smoothing (更穩健)
 *
 * This combines the best of both worlds:
 * - v2.6's clean OOP design and adjustable parameters
 * - v2.5's proven 70/30 weighting (90% accuracy)
 * - v2.5's rigorous Laplace smoothing
 */

// 採用 v2.5 的黃金比例
const BIGRAM_WEIGHT = 0.7;   // 70% 相信前後文關係
const UNIGRAM_WEIGHT = 0.3;  // 30% 相信字本身的常用度

// 極小機率 (避免 Log(0) 變成 -Infinity)
const MIN_PROB = 1e-10;

class Viterbi {
    constructor(ngramData) {
        this.unigramCounts = ngramData.unigram_counts;
        this.bigramCounts = ngramData.bigram_counts;

        // v2.5 Laplace smoothing 參數
        this.smoothingAlpha = ngramData.smoothing_alpha || 0.1;
        this.totalChars = ngramData.total_chars;
        this.vocabSize = ngramData.vocab_size;

        // 備用：計算總字數 (用於簡單平滑)
        this.totalUnigrams = Object.values(this.unigramCounts).reduce((a, b) => a + b, 0);
    }

    /**
     * 取得單字機率 P(A) - 使用 v2.5 的 Laplace Smoothing
     *
     * Formula: P(char) = (count(char) + alpha) / (total_chars + alpha * vocab_size)
     */
    getUnigramProb(char) {
        const count = this.unigramCounts[char] || 0;

        // v2.5 的完整 Laplace smoothing
        if (this.totalChars && this.vocabSize) {
            return (count + this.smoothingAlpha) /
                   (this.totalChars + this.smoothingAlpha * this.vocabSize);
        }

        // 備用：簡單 +1 smoothing
        return (count + 1) / (this.totalUnigrams + 10000);
    }

    /**
     * 取得轉移機率 P(B|A) - 使用 v2.5 的 Laplace Smoothing
     *
     * Formula: P(c2|c1) = (count(c1,c2) + alpha) / (count(c1) + alpha * vocab_size)
     */
    getBigramProb(prevChar, currChar) {
        // FIXED: bigram_counts is stored as flat "大家" keys, not nested objects
        const bigram = prevChar + currChar;
        const bigramCount = this.bigramCounts[bigram] || 0;
        const unigramCount = this.unigramCounts[prevChar] || 0;

        // v2.5 完整 Laplace smoothing (same as v2.5)
        return (bigramCount + this.smoothingAlpha) /
               (unigramCount + this.smoothingAlpha * this.vocabSize);
    }

    /**
     * 計算最佳路徑 - v2.6 的清晰 OOP 架構
     * @param {Array<Array<Object>>} lattice - 候選字格狀圖 [[{char:'明',...}], [{char:'天',...}]]
     */
    calculateBestPath(lattice) {
        if (!lattice || lattice.length === 0) return "";

        // DP 表：儲存到達每個節點的最大分數
        let dp = [];

        // --- 1. 初始化第一層 (T=0) ---
        dp[0] = [];
        for (let i = 0; i < lattice[0].length; i++) {
            const node = lattice[0][i];
            const prob = this.getUnigramProb(node.char);
            dp[0][i] = {
                score: Math.log(Math.max(prob, MIN_PROB)),
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

                    // --- v2.7 核心：70/30 加權 + Laplace Smoothing ---

                    // 1. Bigram 分數 (前後關係) - 使用 Laplace smoothing
                    const bigramProb = this.getBigramProb(prevChar, currChar);
                    const bigramScore = Math.log(Math.max(bigramProb, MIN_PROB));

                    // 2. Unigram 分數 (自身熱度) - 使用 Laplace smoothing
                    const unigramProb = this.getUnigramProb(currChar);
                    const unigramScore = Math.log(Math.max(unigramProb, MIN_PROB));

                    // 3. 混合加權分數 - v2.5 的黃金比例 70/30
                    const transitionScore = (BIGRAM_WEIGHT * bigramScore) +
                                          (UNIGRAM_WEIGHT * unigramScore);

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
function viterbi_v27(codes, dayiDb, ngramDb) {
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

module.exports = { Viterbi, viterbi_v27 };
