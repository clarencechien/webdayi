/**
 * Prediction Engine for WebDayi MVP2
 * Handles Phantom Text, Bigram Predictions, and Dynamic Re-ranking
 */

class PredictionEngine {
    constructor(config = {}) {
        this.bigramData = config.bigramData || {};
        this.freqMap = config.freqMap || {};
        this.userHistory = config.userHistory || { getScore: () => 0 };
        this.dayiMap = {}; // Map<code, candidates[]>

        // Weighted Scoring Model
        this.weights = {
            static: 1.0,   // Baseline (Unigram)
            bigram: 2.5,   // Context (Bigram)
            user: 10.0     // Personalization (User History)
        };
    }

    setDayiMap(map) {
        this.dayiMap = map;
    }

    /**
     * Calculate the prediction score for a candidate character.
     * Formula: Score = (w1 * StaticFreq) + (w2 * BigramProb) + (w3 * UserHabit)
     * 
     * @param {string} char - The candidate character
     * @param {string} lastChar - The last committed character (for context)
     * @param {string} currentBuffer - The current input buffer (code)
     * @returns {number} - The calculated score
     */
    calculateScore(char, lastChar, currentBuffer) {
        // 1. Static Frequency (from freq_map.json)
        const staticFreq = this.freqMap[char] || 0;

        // 2. Bigram Probability (from bigram_lite.json)
        // Check if bigramData[lastChar][currentBuffer] suggests this char
        let bigramProb = 0;
        if (lastChar && this.bigramData[lastChar]) {
            const suggestion = this.bigramData[lastChar][currentBuffer];
            // If the bigram model explicitly suggests this char for this code, give it high probability
            if (suggestion === char) {
                bigramProb = 1.0;
            }
        }

        // 3. User Habit (from UserHistory)
        // We use the raw count from history. 
        // Since w3 is 10.0, even a single usage (1 * 10) will likely outweigh static freq (usually < 0.1).
        const userHabit = this.userHistory.getScore(char);

        // Weighted Sum
        const score = (this.weights.static * staticFreq) +
            (this.weights.bigram * bigramProb) +
            (this.weights.user * userHabit);

        return score;
    }

    /**
     * Get sorted candidates for a given code buffer.
     * Applies Dynamic Re-ranking based on scores.
     * Includes "Extended Candidates" (words starting with the buffer code).
     * 
     * @param {string} buffer - Current input buffer
     * @param {string} lastChar - Last committed character
     * @returns {Array} - Sorted list of candidates [{char, score}, ...]
     */
    getCandidates(buffer, lastChar) {
        // 1. Exact Matches
        const rawCandidates = this.dayiMap[buffer];
        let candidates = [];

        if (rawCandidates) {
            const list = Array.isArray(rawCandidates) ? rawCandidates : [rawCandidates];
            candidates = list.map(c => ({
                char: typeof c === 'object' ? c.char : c,
                originalData: c,
                isExact: true // Mark as exact match
            }));
        }

        // 2. Extended Matches (Predictive)
        const extensions = this.getExtendedCandidates(buffer);
        candidates = [...candidates, ...extensions];

        // 3. Score Everything
        const scoredCandidates = candidates.map(c => {
            const score = this.calculateScore(c.char, lastChar, buffer);
            return {
                ...c,
                score: score
            };
        });

        // 4. Sort: Exact Matches First, then by Score
        scoredCandidates.sort((a, b) => {
            // Priority A: Exact Match always comes first
            if (a.isExact && !b.isExact) return -1;
            if (!a.isExact && b.isExact) return 1;

            // Priority B: Score descending
            return b.score - a.score;
        });

        // Deduplicate (keep highest priority/score version)
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
     * Find candidates from keys that start with the buffer.
     * @param {string} buffer 
     * @returns {Array}
     */
    getExtendedCandidates(buffer) {
        if (!buffer || buffer.length === 0) return [];

        const extensions = [];
        const MAX_EXTENSIONS = 20; // Limit to avoid flooding
        let count = 0;

        // Optimization: In a real app with 30k keys, we might want a Trie.
        // For now, simple iteration. 
        // We can optimize by caching keys or using a pre-computed index.

        for (const key in this.dayiMap) {
            if (key.length > buffer.length && key.startsWith(buffer)) {
                const raw = this.dayiMap[key];
                const list = Array.isArray(raw) ? raw : [raw];

                for (const item of list) {
                    const char = typeof item === 'object' ? item.char : item;
                    // Only add if it has a high enough static freq or user history
                    // to be worth showing as a prediction.
                    // For simplicity, we add all, but the scoring/sorting will filter them down.
                    extensions.push({
                        char: char,
                        originalData: item,
                        isExact: false,
                        code: key // Track the full code
                    });
                }

                // Safety break if too many keys scanned? No, we need to scan all to find high scores.
                // But we can limit the *result* size if needed.
            }
        }

        return extensions;
    }

    /**
     * Get the best prediction (Phantom Text) for the current buffer.
     * This is strictly for "Smart Adopt" (Tab key), so it excludes exact matches
     * unless there are no other options.
     * 
     * @param {string} buffer 
     * @param {string} lastChar 
     * @returns {object|null} - The best candidate object or null
     */
    getBestPrediction(buffer, lastChar) {
        // Only look for extensions (non-exact matches)
        const extensions = this.getExtendedCandidates(buffer);
        if (extensions.length === 0) return null;

        // Score them
        const scored = extensions.map(c => ({
            ...c,
            score: this.calculateScore(c.char, lastChar, buffer)
        }));

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        return scored.length > 0 ? scored[0] : null;
    }

    /**
     * Predict phantom text based on current buffer and context.
     * DEPRECATED: Use getBestPrediction instead.
     */
    predictPhantom(buffer, lastChar) {
        const best = this.getBestPrediction(buffer, lastChar);
        return best ? best.char : null;
    }
}

// Export
window.PredictionEngine = PredictionEngine;
