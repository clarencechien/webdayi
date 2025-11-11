# Enhanced Converter Design (v2)

## Problem Statement

The current converter (v1) uses a simple frequency calculation based on the order in which characters appear in the YAML file. This doesn't reflect actual character usage frequency in real-world Chinese text.

**Current approach:**
- First character for a code gets freq=100
- Second character gets freq=99
- Third character gets freq=98
- ... etc.

**Problem:** The order in dayi.dict.yaml may not reflect real-world usage patterns.

## Proposed Solution

Use an external frequency ranking file (`freq.yaml`) that contains the top 2000 most commonly used Chinese characters, ranked by actual usage frequency.

### Input Files

1. **dayi.dict.yaml** - Character to code mappings
   - Format: `char\tcode`
   - Example: `大\tv`

2. **freq.yaml** - Character frequency rankings (1-2000)
   - Format: `char\trank` OR just list of characters (rank = line number)
   - Rank 1 = most common character
   - Rank 2000 = 2000th most common character
   - Example:
     ```yaml
     的  1
     一  2
     是  3
     ```

### Frequency Calculation Algorithm

```javascript
// Base frequency calculation
const BASE_FREQ = 10000;
const MIN_FREQ = 1000;

function calculateFrequency(rank) {
  if (rank === null || rank === undefined) {
    // Character not in frequency list
    return MIN_FREQ;
  }

  // Map rank (1-2000) to frequency
  // Rank 1 -> 10000
  // Rank 2000 -> 8000
  // Linear mapping
  return BASE_FREQ - (rank - 1) * ((BASE_FREQ - 8000) / 1999);
}
```

### Example Output

For code "v" with characters: 大, 夫, 禾

**Before (v1):**
```json
{
  "v": [
    { "char": "大", "freq": 100 },
    { "char": "夫", "freq": 99 },
    { "char": "禾", "freq": 98 }
  ]
}
```

**After (v2) - assuming ranks: 大=15, 夫=1500, 禾=not in list:**
```json
{
  "v": [
    { "char": "大", "freq": 9986 },   // Most common, appears first
    { "char": "禾", "freq": 1000 },   // Not in freq list
    { "char": "夫", "freq": 8501 }    // Less common
  ]
}
```

## Implementation Plan (TDD)

### Phase 1: Tests First
1. Create `converter/convert-v2.test.js`
2. Test cases:
   - Parse freq.yaml correctly
   - Calculate frequency from rank
   - Handle characters not in freq list
   - Handle multiple characters with same code
   - Sort candidates by calculated frequency
   - Validate output format

### Phase 2: Implementation
1. Create `converter/convert-v2.js`
2. Implement functions to pass all tests
3. Refactor for clarity

### Phase 3: Integration
1. Run converter on actual data
2. Compare v1 vs v2 output
3. Validate improvements

## Success Criteria

- [ ] All TDD tests pass
- [ ] Characters with higher real-world frequency rank higher
- [ ] Characters not in freq.yaml still included with default freq
- [ ] Output JSON format unchanged (backward compatible)
- [ ] Performance acceptable (<5s for full conversion)

## Example freq.yaml Format

```yaml
# Top 2000 most common Chinese characters by usage frequency
# Format: char\trank
---
的	1
一	2
是	3
不	4
了	5
在	6
人	7
有	8
我	9
他	10
...
```

Or simplified (rank = line number):
```yaml
的
一
是
不
了
在
人
有
我
他
...
```
