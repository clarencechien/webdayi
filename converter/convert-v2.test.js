#!/usr/bin/env node

/**
 * Test suite for Enhanced Converter (v2) with frequency ranking
 * Uses TDD approach - tests written first
 */

const fs = require('fs');
const path = require('path');

// Test framework (simple implementation)
class TestRunner {
  constructor() {
    this.tests = [];
    this.currentSuite = null;
  }

  describe(name, fn) {
    console.log(`\n\x1b[1m${name}\x1b[0m`);
    this.currentSuite = name;
    fn();
    this.currentSuite = null;
  }

  it(description, fn) {
    this.tests.push({ suite: this.currentSuite, description, fn });
  }

  async run() {
    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`  \x1b[32m✓\x1b[0m ${test.description}`);
        passed++;
      } catch (error) {
        console.log(`  \x1b[31m✗\x1b[0m ${test.description}`);
        console.log(`    ${error.message}`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(50));
    if (failed === 0) {
      console.log(`\x1b[32m✓ All tests passed (${passed}/${this.tests.length})\x1b[0m`);
    } else {
      console.log(`\x1b[31m✗ Some tests failed (${passed}/${this.tests.length} passed, ${failed} failed)\x1b[0m`);
    }
    console.log('='.repeat(50));

    return failed === 0;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

function assertArrayEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Arrays not equal:\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

// Import the module to test (will be created)
let converter;
try {
  converter = require('./convert-v2-lib.js');
} catch (error) {
  console.error('Warning: convert-v2-lib.js not found, skipping tests that require it');
  converter = null;
}

// Test data
const TEST_FREQ_DATA = `# Test frequency data
---
的	1
一	2
是	3
大	13
人	7
`;

const TEST_DAYI_DATA = `# Test dayi dictionary
---
大	v
人	a
入	a
天	v
一	z
的	zz
`;

// Create test runner
const runner = new TestRunner();

// ============================================================================
// Test Suite 1: Frequency Parsing
// ============================================================================
runner.describe('Frequency Parser', () => {
  runner.it('should parse frequency YAML with rank numbers', () => {
    if (!converter) return;

    const freqMap = converter.parseFrequencyYAML(TEST_FREQ_DATA);

    assertEquals(freqMap.get('的'), 1, 'Character 的 should have rank 1');
    assertEquals(freqMap.get('一'), 2, 'Character 一 should have rank 2');
    assertEquals(freqMap.get('是'), 3, 'Character 是 should have rank 3');
    assertEquals(freqMap.get('大'), 13, 'Character 大 should have rank 13');
    assertEquals(freqMap.get('人'), 7, 'Character 人 should have rank 7');
  });

  runner.it('should handle characters not in frequency list', () => {
    if (!converter) return;

    const freqMap = converter.parseFrequencyYAML(TEST_FREQ_DATA);

    assertEquals(freqMap.get('未'), undefined, 'Unknown character should return undefined');
  });

  runner.it('should skip comments and metadata lines', () => {
    if (!converter) return;

    const freqMap = converter.parseFrequencyYAML(TEST_FREQ_DATA);

    // Should have 5 entries (的一是大人)
    assertEquals(freqMap.size, 5, 'Should parse exactly 5 characters');
  });
});

// ============================================================================
// Test Suite 2: Frequency Calculation
// ============================================================================
runner.describe('Frequency Calculation', () => {
  runner.it('should calculate high frequency for rank 1', () => {
    if (!converter) return;

    const freq = converter.calculateFrequency(1);

    assertEquals(freq, 10000, 'Rank 1 should have frequency 10000');
  });

  runner.it('should calculate lower frequency for higher ranks', () => {
    if (!converter) return;

    const freq1 = converter.calculateFrequency(1);
    const freq10 = converter.calculateFrequency(10);
    const freq100 = converter.calculateFrequency(100);

    assert(freq1 > freq10, 'Lower rank should have higher frequency');
    assert(freq10 > freq100, 'Frequency should decrease with rank');
  });

  runner.it('should calculate minimum frequency for rank 2000', () => {
    if (!converter) return;

    const freq = converter.calculateFrequency(2000);

    assertEquals(freq, 8000, 'Rank 2000 should have frequency 8000');
  });

  runner.it('should return default frequency for null rank', () => {
    if (!converter) return;

    const freq = converter.calculateFrequency(null);

    assertEquals(freq, 1000, 'Null rank should return default frequency 1000');
  });

  runner.it('should return default frequency for undefined rank', () => {
    if (!converter) return;

    const freq = converter.calculateFrequency(undefined);

    assertEquals(freq, 1000, 'Undefined rank should return default frequency 1000');
  });
});

// ============================================================================
// Test Suite 3: Dayi Dictionary Parsing
// ============================================================================
runner.describe('Dayi Dictionary Parser', () => {
  runner.it('should parse dayi dictionary correctly', () => {
    if (!converter) return;

    const codeMap = converter.parseDayiYAML(TEST_DAYI_DATA);

    assert(codeMap.has('v'), 'Should have code "v"');
    assert(codeMap.has('a'), 'Should have code "a"');
    assert(codeMap.has('z'), 'Should have code "z"');
    assert(codeMap.has('zz'), 'Should have code "zz"');
  });

  runner.it('should handle multiple characters for same code', () => {
    if (!converter) return;

    const codeMap = converter.parseDayiYAML(TEST_DAYI_DATA);

    const aChars = codeMap.get('a');
    assertEquals(aChars.length, 2, 'Code "a" should have 2 characters');
    assert(aChars.includes('人'), 'Code "a" should include 人');
    assert(aChars.includes('入'), 'Code "a" should include 入');
  });

  runner.it('should skip comments and metadata lines', () => {
    if (!converter) return;

    const codeMap = converter.parseDayiYAML(TEST_DAYI_DATA);

    assertEquals(codeMap.size, 4, 'Should parse exactly 4 codes');
  });
});

// ============================================================================
// Test Suite 4: Candidate Enrichment
// ============================================================================
runner.describe('Candidate Enrichment with Frequency', () => {
  runner.it('should enrich candidates with frequency from rank', () => {
    if (!converter) return;

    const freqMap = converter.parseFrequencyYAML(TEST_FREQ_DATA);
    const characters = ['大', '天'];

    const enriched = converter.enrichCandidatesWithFreq(characters, freqMap);

    assertEquals(enriched.length, 2, 'Should have 2 enriched candidates');
    assertEquals(enriched[0].char, '大', 'First candidate should be 大');
    assertEquals(enriched[0].freq, 9988, '大 (rank 13) should have freq 9988');
    assertEquals(enriched[1].char, '天', 'Second candidate should be 天');
    assertEquals(enriched[1].freq, 1000, '天 (not in list) should have default freq 1000');
  });

  runner.it('should handle characters not in frequency list', () => {
    if (!converter) return;

    const freqMap = converter.parseFrequencyYAML(TEST_FREQ_DATA);
    const characters = ['未知字'];

    const enriched = converter.enrichCandidatesWithFreq(characters, freqMap);

    assertEquals(enriched[0].freq, 1000, 'Unknown character should get default frequency');
  });

  runner.it('should sort candidates by frequency descending', () => {
    if (!converter) return;

    const freqMap = converter.parseFrequencyYAML(TEST_FREQ_DATA);
    const characters = ['天', '大', '一']; // 大=rank 13, 一=rank 2, 天=not in list

    const enriched = converter.enrichCandidatesWithFreq(characters, freqMap);
    enriched.sort((a, b) => b.freq - a.freq);

    assertEquals(enriched[0].char, '一', 'Highest frequency should be first');
    assertEquals(enriched[1].char, '大', 'Second highest should be second');
    assertEquals(enriched[2].char, '天', 'Lowest frequency should be last');
  });
});

// ============================================================================
// Test Suite 5: Integration Tests
// ============================================================================
runner.describe('Integration: Full Conversion', () => {
  runner.it('should convert complete dataset correctly', () => {
    if (!converter) return;

    const freqMap = converter.parseFrequencyYAML(TEST_FREQ_DATA);
    const codeMap = converter.parseDayiYAML(TEST_DAYI_DATA);

    const result = converter.buildDatabase(codeMap, freqMap);

    assert(result.v, 'Result should have code "v"');
    assert(result.a, 'Result should have code "a"');
  });

  runner.it('should sort candidates within each code by frequency', () => {
    if (!converter) return;

    const freqMap = converter.parseFrequencyYAML(TEST_FREQ_DATA);
    const codeMap = converter.parseDayiYAML(TEST_DAYI_DATA);

    const result = converter.buildDatabase(codeMap, freqMap);

    // Code 'a' has: 人(rank 7), 入(not in list)
    // 人 should come before 入
    assertEquals(result.a[0].char, '人', '人 should be first (higher freq)');
    assertEquals(result.a[1].char, '入', '入 should be second (lower freq)');
  });

  runner.it('should maintain correct JSON structure', () => {
    if (!converter) return;

    const freqMap = converter.parseFrequencyYAML(TEST_FREQ_DATA);
    const codeMap = converter.parseDayiYAML(TEST_DAYI_DATA);

    const result = converter.buildDatabase(codeMap, freqMap);

    // Check structure
    assert(Array.isArray(result.v), 'Each code should map to an array');
    assert(result.v[0].hasOwnProperty('char'), 'Each candidate should have char');
    assert(result.v[0].hasOwnProperty('freq'), 'Each candidate should have freq');
  });
});

// ============================================================================
// Test Suite 6: Edge Cases
// ============================================================================
runner.describe('Edge Cases', () => {
  runner.it('should handle empty frequency list', () => {
    if (!converter) return;

    const freqMap = converter.parseFrequencyYAML('');

    assertEquals(freqMap.size, 0, 'Empty input should produce empty map');
  });

  runner.it('should handle empty dayi dictionary', () => {
    if (!converter) return;

    const codeMap = converter.parseDayiYAML('');

    assertEquals(codeMap.size, 0, 'Empty input should produce empty map');
  });

  runner.it('should handle code with only one character', () => {
    if (!converter) return;

    const freqMap = converter.parseFrequencyYAML(TEST_FREQ_DATA);
    const codeMap = new Map([['z', ['一']]]);

    const result = converter.buildDatabase(codeMap, freqMap);

    assertEquals(result.z.length, 1, 'Should handle single character');
    assertEquals(result.z[0].char, '一', 'Character should be correct');
  });

  runner.it('should handle very large rank numbers gracefully', () => {
    if (!converter) return;

    const freq = converter.calculateFrequency(5000);

    assert(freq >= 1000, 'Frequency should not go below minimum');
  });
});

// Run all tests
if (converter) {
  runner.run().then(success => {
    process.exit(success ? 0 : 1);
  });
} else {
  console.error('\x1b[31m✗ Cannot run tests: convert-v2-lib.js not found\x1b[0m');
  console.error('Please implement convert-v2-lib.js first');
  process.exit(1);
}
