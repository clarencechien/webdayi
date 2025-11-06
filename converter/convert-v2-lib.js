/**
 * Enhanced Converter Library (v2)
 * Converts Rime dayi.dict.yaml to dayi_db.json with real-world frequency ranking
 */

// Constants
const BASE_FREQ = 10000;  // Highest frequency (rank 1)
const MIN_FREQ = 8000;    // Lowest frequency (rank 2000)
const DEFAULT_FREQ = 1000; // Default for characters not in frequency list

/**
 * Parse frequency YAML file
 * Format: char\trank
 * @param {string} yamlContent - The YAML file content
 * @returns {Map<string, number>} - Map of character to rank
 */
function parseFrequencyYAML(yamlContent) {
  const freqMap = new Map();

  if (!yamlContent || yamlContent.trim() === '') {
    return freqMap;
  }

  const lines = yamlContent.split('\n');

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Skip comments and metadata
    if (line.startsWith('#') || line.startsWith('---') || line.startsWith('...')) {
      continue;
    }

    // Parse: char\trank
    const parts = line.split('\t');
    if (parts.length !== 2) {
      continue;
    }

    const char = parts[0].trim();
    const rank = parseInt(parts[1].trim(), 10);

    if (char && !isNaN(rank)) {
      freqMap.set(char, rank);
    }
  }

  return freqMap;
}

/**
 * Calculate frequency from rank
 * @param {number|null|undefined} rank - Character rank (1-2000)
 * @returns {number} - Calculated frequency
 */
function calculateFrequency(rank) {
  // Handle null or undefined rank
  if (rank === null || rank === undefined) {
    return DEFAULT_FREQ;
  }

  // Handle rank outside expected range
  if (rank < 1) {
    return BASE_FREQ;
  }
  if (rank > 2000) {
    return DEFAULT_FREQ;
  }

  // Linear mapping: rank 1 -> 10000, rank 2000 -> 8000
  // Formula: freq = BASE_FREQ - (rank - 1) * (BASE_FREQ - MIN_FREQ) / 1999
  const freqRange = BASE_FREQ - MIN_FREQ; // 2000
  const rankRange = 1999; // 2000 - 1

  const freq = BASE_FREQ - ((rank - 1) * freqRange) / rankRange;

  return Math.round(freq);
}

/**
 * Parse Dayi dictionary YAML file
 * Format: char\tcode
 * @param {string} yamlContent - The YAML file content
 * @returns {Map<string, string[]>} - Map of code to array of characters
 */
function parseDayiYAML(yamlContent) {
  const codeMap = new Map();

  if (!yamlContent || yamlContent.trim() === '') {
    return codeMap;
  }

  const lines = yamlContent.split('\n');

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Skip comments and metadata
    if (line.startsWith('#') ||
        line.startsWith('---') ||
        line.startsWith('...') ||
        line.includes('name:') ||
        line.includes('version:') ||
        line.includes('sort:') ||
        line.includes('use_preset')) {
      continue;
    }

    // Parse: char\tcode
    const parts = line.split('\t');
    if (parts.length !== 2) {
      continue;
    }

    const char = parts[0].trim();
    const code = parts[1].trim();

    if (!char || !code) {
      continue;
    }

    // Add character to code's character list
    if (!codeMap.has(code)) {
      codeMap.set(code, []);
    }

    codeMap.get(code).push(char);
  }

  return codeMap;
}

/**
 * Enrich candidates with frequency based on rank
 * @param {string[]} characters - Array of characters
 * @param {Map<string, number>} freqMap - Map of character to rank
 * @returns {Array<{char: string, freq: number}>} - Enriched candidates
 */
function enrichCandidatesWithFreq(characters, freqMap) {
  const candidates = [];

  for (const char of characters) {
    const rank = freqMap.get(char);
    const freq = calculateFrequency(rank);

    candidates.push({
      char: char,
      freq: freq
    });
  }

  return candidates;
}

/**
 * Build complete database from code map and frequency map
 * @param {Map<string, string[]>} codeMap - Map of code to characters
 * @param {Map<string, number>} freqMap - Map of character to rank
 * @returns {Object} - Database object ready for JSON serialization
 */
function buildDatabase(codeMap, freqMap) {
  const dbObject = {};

  for (const [code, characters] of codeMap.entries()) {
    // Enrich each character with frequency
    const candidates = enrichCandidatesWithFreq(characters, freqMap);

    // Sort by frequency descending
    candidates.sort((a, b) => b.freq - a.freq);

    dbObject[code] = candidates;
  }

  return dbObject;
}

// Export functions
module.exports = {
  parseFrequencyYAML,
  calculateFrequency,
  parseDayiYAML,
  enrichCandidatesWithFreq,
  buildDatabase,
  // Export constants for testing
  BASE_FREQ,
  MIN_FREQ,
  DEFAULT_FREQ
};
