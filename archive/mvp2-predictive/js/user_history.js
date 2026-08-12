/**
 * User History Module for WebDayi MVP2
 * Tracks user usage habits and persists to localStorage.
 */
class UserHistory {
    constructor(storageKey = 'webdayi_user_history') {
        this.storageKey = storageKey;
        this.history = this.load();
    }

    /**
     * Load history from localStorage
     */
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('[UserHistory] Failed to load:', e);
            return {};
        }
    }

    /**
     * Save history to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (e) {
            console.error('[UserHistory] Failed to save:', e);
        }
    }

    /**
     * Record a character commitment.
     * @param {string} char - The character committed.
     */
    recordCommit(char) {
        if (!char) return;

        if (!this.history[char]) {
            this.history[char] = 0;
        }
        this.history[char]++;
        this.save();
    }

    /**
     * Get the frequency score for a character.
     * @param {string} char 
     * @returns {number} - Frequency count
     */
    getScore(char) {
        return this.history[char] || 0;
    }

    /**
     * Clear history
     */
    clear() {
        this.history = {};
        this.save();
    }
}

// Export
window.UserHistory = UserHistory;
