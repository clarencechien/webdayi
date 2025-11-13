/**
 * UserDB - IndexedDB Wrapper for User N-gram Learning
 *
 * Stores user-learned bigram weights for personalized input prediction.
 * Uses IndexedDB for persistent, offline-first storage.
 *
 * Schema:
 *   key: "prevChar→currChar" (e.g., "天→氣")
 *   value: weight (float, can be positive or negative)
 *
 * @module UserDB
 * @version 1.0.0
 * @date 2025-11-12
 */

export class UserDB {
  constructor(dbName = 'webdayi_user_db', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.storeName = 'user_ngrams';
  }

  /**
   * Open/initialize the IndexedDB database
   * Creates the object store if it doesn't exist
   *
   * @returns {Promise<void>}
   */
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          // Use out-of-line keys (key path: 'id')
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });

          // Create index on bigram for faster lookups
          objectStore.createIndex('bigram', 'id', { unique: true });

          console.log(`[UserDB] Created object store: ${this.storeName}`);
        }
      };
    });
  }

  /**
   * Get the learned weight for a bigram
   *
   * @param {string} prevChar - Previous character
   * @param {string} currChar - Current character
   * @returns {Promise<number>} - Weight value (0 if not found)
   */
  async getWeight(prevChar, currChar) {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);

      const key = this._makeKey(prevChar, currChar);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.weight : 0);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get weight: ${request.error}`));
      };
    });
  }

  /**
   * Set the learned weight for a bigram
   *
   * @param {string} prevChar - Previous character
   * @param {string} currChar - Current character
   * @param {number} weight - Weight value (can be negative)
   * @returns {Promise<void>}
   */
  async setWeight(prevChar, currChar, weight) {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const key = this._makeKey(prevChar, currChar);
      const data = {
        id: key,
        prevChar: prevChar,
        currChar: currChar,
        weight: weight,
        lastUpdated: new Date().toISOString()
      };

      const request = objectStore.put(data);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to set weight: ${request.error}`));
      };
    });
  }

  /**
   * Get all learned weights for export
   *
   * @returns {Promise<Object>} - Object with keys like "天→氣" and values as weights
   */
  async getAllWeights() {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const results = request.result;
        const weights = {};

        results.forEach(item => {
          weights[item.id] = item.weight;
        });

        resolve(weights);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get all weights: ${request.error}`));
      };
    });
  }

  /**
   * Import weights from exported data
   * Overwrites existing weights
   *
   * @param {Object} weights - Object with keys like "天→氣" and values as weights
   * @returns {Promise<void>}
   */
  async importWeights(weights) {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      let completed = 0;
      let total = Object.keys(weights).length;
      let hasError = false;

      if (total === 0) {
        resolve();
        return;
      }

      for (const [key, weight] of Object.entries(weights)) {
        // Parse key: "天→氣" -> ['天', '氣']
        const [prevChar, currChar] = key.split('→');

        const data = {
          id: key,
          prevChar: prevChar,
          currChar: currChar,
          weight: weight,
          lastUpdated: new Date().toISOString()
        };

        const request = objectStore.put(data);

        request.onsuccess = () => {
          completed++;
          if (completed === total && !hasError) {
            resolve();
          }
        };

        request.onerror = () => {
          hasError = true;
          reject(new Error(`Failed to import weight for ${key}: ${request.error}`));
        };
      }
    });
  }

  /**
   * Clear all learned weights
   *
   * @returns {Promise<void>}
   */
  async clearAll() {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear database: ${request.error}`));
      };
    });
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Delete the entire database
   * Useful for testing or complete reset
   *
   * @returns {Promise<void>}
   */
  async deleteDatabase() {
    this.close();

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete database: ${request.error}`));
      };
    });
  }

  /**
   * Make a key from prevChar and currChar
   * Format: "prevChar→currChar"
   *
   * @private
   * @param {string} prevChar
   * @param {string} currChar
   * @returns {string}
   */
  _makeKey(prevChar, currChar) {
    return `${prevChar}→${currChar}`;
  }

  /**
   * Get database statistics
   *
   * @returns {Promise<Object>} - { count, totalWeight, avgWeight }
   */
  async getStats() {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const results = request.result;
        const count = results.length;

        let totalWeight = 0;
        results.forEach(item => {
          totalWeight += Math.abs(item.weight);
        });

        const avgWeight = count > 0 ? totalWeight / count : 0;

        resolve({
          count,
          totalWeight,
          avgWeight
        });
      };

      request.onerror = () => {
        reject(new Error(`Failed to get stats: ${request.error}`));
      };
    });
  }
}

// Export for use in other modules
export default UserDB;
