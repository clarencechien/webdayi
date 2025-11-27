/**
 * Prediction Engine for WebDayi MVP2
 * Handles Phantom Text and Bigram Predictions
 */

class PredictionEngine {
    constructor(bigramData = {}) {
        this.bigramData = bigramData;
        this.dayiMap = {}; // Map<code, candidates[]>
    }

    setDayiMap(map) {
        this.dayiMap = map;
    }

    /**
     * Predict phantom text based on current buffer.
     * Strategy:
     * 1. If buffer is empty, return null.
     * 2. Look up buffer in dayiMap.
     * 3. If match found, return the first candidate (highest frequency).
     * 4. (Future) If no exact match, look for extensions? For now, exact prefix match.
     * 
     * @param {string} buffer - Current input buffer (e.g., "i")
     * @returns {string|null} - Phantom text suggestion or null
     */
    predictPhantom(buffer) {
        // Simple frequency-based prediction (mock)
        // In real app, check if buffer matches a high-freq char
        const candidate = this.dayiMap[buffer];
        if (candidate) {
            // If candidate is object (from DB), return char property
            return typeof candidate === 'object' ? candidate.char : candidate;
        }
        return null;
    }

    getBigramSuggestion(lastChar, nextCode) {
        if (!lastChar || !nextCode) return null;

        const predictions = this.bigramData[lastChar];
        if (!predictions) {
            return null;
        }

        if (predictions[nextCode]) {
            return predictions[nextCode];
        }

        for (const code in predictions) {
            if (code.startsWith(nextCode)) {
                return predictions[code];
            }
        }

        return null;
    }
}

// Export for testing
window.PredictionEngine = PredictionEngine;
