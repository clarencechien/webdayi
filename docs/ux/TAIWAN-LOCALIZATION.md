# Taiwan Localization Report

**Date**: 2025-11-10
**Goal**: Evaluate Taiwan-localized N-gram corpus for WebDaYi
**Status**: ⚠️ **Completed with Important Findings**

---

## 📊 Summary

We implemented support for Taiwan-localized N-gram training using Rime's `terra_pinyin.dict.yaml` as suggested by the user. The implementation is **technically successful**, but the test results reveal **important limitations** that need to be addressed.

---

## ✅ Implementation Completed

### 1. **Terra Pinyin Parser** (NEW)
- **File**: `converter/build_ngram_lib.py`
- **Functions**:
  - `parse_terra_pinyin_dict()` - Parses Rime dict.yaml format
  - `parse_terra_pinyin_entry()` - Handles individual entries
- **Format Support**: `phrase\tpinyin` (no frequencies)
- **Strategy**: Assign uniform weight=1 to all entries

### 2. **Build Tool Enhancement**
- **File**: `converter/build_ngram.py`
- **New Parameter**: `--format [essay|terra_pinyin]`
- **Usage**:
  ```bash
  # Mainland corpus (default)
  python build_ngram.py --format essay --input essay.txt

  # Taiwan corpus
  python build_ngram.py --format terra_pinyin --input terra_pinyin.dict.yaml
  ```

### 3. **Taiwan N-gram Database**
- **File**: `mvp1/ngram_db_taiwan.json`
- **Size**: 5.4 MB (vs 15.7 MB mainland)
- **Source**: `terra_pinyin.dict.yaml` (99,327 entries)
- **Version**: 2.0 (with Laplace smoothing)

### 4. **Comparison Test Suite**
- **File**: `converter/test_taiwan_vs_mainland.js`
- **Tests**: Taiwan places, Taiwan-specific terms, common phrases
- **Result**: Comprehensive quality comparison

---

## 📈 Database Statistics Comparison

| Metric | Mainland (rime-essay) | Taiwan (terra_pinyin) | Winner |
|--------|----------------------|----------------------|---------|
| **Vocabulary Size** | 18,215 chars | 41,280 chars | Taiwan ✓ |
| **Total Characters** | 717,006,728 | 208,294 | Mainland ✓✓✓ |
| **Unique Bigrams** | 279,220 | 66,180 | Mainland ✓✓ |
| **Database Size** | 15.7 MB | 5.4 MB | Taiwan ✓ |
| **Data Type** | Corpus (with frequencies) | Dictionary (uniform) | Mainland ✓✓ |

---

## 🔍 Test Results: Taiwan vs Mainland

### Category 1: Taiwan Places

| Phrase | Description | Mainland Count | Taiwan Count | Winner |
|--------|-------------|----------------|--------------|---------|
| 臺灣 | Taiwan (traditional) | 50,967 ✓ | 4 ✓ | Mainland |
| 台北 | Taipei | 0 ✗ | 0 ✗ | Tie |
| 高雄 | Kaohsiung | 5,435 ✓ | 0 ✗ | Mainland |
| 新竹 | Hsinchu | 2,433 ✓ | 0 ✗ | Mainland |

**Finding**: Mainland corpus has better coverage even for Taiwan places!

### Category 2: Taiwan-Specific Terms

| Phrase | Description | Mainland Count | Taiwan Count | Winner |
|--------|-------------|----------------|--------------|---------|
| 網路 | Internet (TW) | 10,667 ✓ | 29 ✓ | Mainland |
| 資訊 | Information (TW) | 13,417 ✓ | 2 ✓ | Mainland |
| 軟體 | Software (TW) | 4,022 ✓ | 5 ✓ | Mainland |
| 捷運 | MRT (TW) | 3,391 ✓ | 1 ✓ | Mainland |

**Finding**: Taiwan-specific vocabulary exists in both, but mainland has higher counts due to massive dataset size.

### Category 3: Common Phrases

| Phrase | Description | Mainland Count | Taiwan Count | Winner |
|--------|-------------|----------------|--------------|---------|
| 大家 | Everyone | 365,429 ✓ | 9 ✓ | Mainland |
| 時間 | Time | 390,539 ✓ | 70 ✓ | Mainland |
| 工作 | Work | 431,648 ✓ | 9 ✓ | Mainland |
| 教育 | Education | 153,049 ✓ | 119 ✓ | Mainland |

**Finding**: Mainland corpus dominates in all categories due to 3,400x more data.

---

## 🚨 Critical Findings

### Issue 1: Dictionary vs Corpus
- **Problem**: `terra_pinyin.dict.yaml` is a **dictionary** (word list), not a **corpus** (text with frequencies)
- **Impact**: All words have weight=1, no frequency information
- **Result**: Cannot learn real-world usage patterns

### Issue 2: Dataset Size Disparity
- **Mainland**: 717 million characters (real text data)
- **Taiwan**: 208 thousand characters (dictionary entries × 1)
- **Ratio**: 3,400× difference
- **Result**: Mainland corpus dominates even for Taiwan-specific terms

### Issue 3: Laplace Smoothing Impact
- **With small dataset**: Smoothing helps but cannot overcome lack of data
- **With large dataset**: Real frequencies dominate, better predictions
- **Conclusion**: More data > Better localization for this use case

---

## 💡 Recommendations

### Option 1: Keep Mainland Corpus (RECOMMENDED)
**Pros:**
- ✓ 717M characters of real text data
- ✓ Better N-gram predictions for all phrases
- ✓ Includes Taiwan vocabulary (網路, 資訊, etc.)
- ✓ Already deployed and working well

**Cons:**
- ⚠ May use some mainland-specific terms (网络 vs 網路)
- ⚠ Frequencies based on mainland usage patterns

**Recommendation**: **Use this for production**

### Option 2: Hybrid Approach
**Strategy**: Combine both corpora with weighted mixing
```python
# Pseudo-code
final_count = (mainland_count * 0.8) + (taiwan_count * 1000)
```

**Pros:**
- ✓ Boost Taiwan-specific vocabulary
- ✓ Keep mainland's large dataset
- ✓ Customizable weights

**Cons:**
- ⚠ Complex implementation
- ⚠ Need careful tuning
- ⚠ May introduce artifacts

**Recommendation**: **Consider for future v11+ enhancement**

### Option 3: Find Better Taiwan Corpus
**Look for:**
- PTT (批踢踢) text dumps (if available)
- Taiwan government documents
- Taiwan news article corpus
- Wikipedia Taiwan articles

**Pros:**
- ✓ Real Taiwan usage patterns
- ✓ Natural frequencies
- ✓ Large dataset (if available)

**Cons:**
- ⚠ May be hard to find legal sources
- ⚠ Requires more data processing
- ⚠ Copyright/licensing issues

**Recommendation**: **Research for future versions**

### Option 4: User-Selectable Corpus (UI Enhancement)
**Strategy**: Let users choose in settings

**UI**:
```
⚙️ 語料庫設定 (Corpus Settings)
  ○ 大陸語料庫 (Mainland) - 推薦 ✓
     更大資料集，更準確預測
  ○ 台灣語料庫 (Taiwan) - 實驗性
     台灣詞彙，資料較少
```

**Recommendation**: **Nice-to-have for power users**

---

## 🎯 Final Recommendation

**For MVP 1.0 v11 Production:**
1. ✅ **Keep mainland corpus (rime-essay)** as default
2. ✅ **Do NOT switch to Taiwan corpus** (data too small)
3. 📋 **Document limitation**: N-gram based on mainland usage patterns
4. 📋 **Future enhancement**: Consider hybrid or better Taiwan corpus

**Reasoning:**
- Mainland corpus has 3,400× more data
- Even Taiwan-specific terms have better coverage in mainland corpus
- N-gram quality depends more on data volume than localization
- terra_pinyin is a dictionary, not a corpus (no frequency data)

---

## 📁 Files Created/Modified

### New Files:
1. `converter/raw_data/terra_pinyin.dict.yaml` (1.8 MB) - Taiwan dictionary from Rime
2. `mvp1/ngram_db_taiwan.json` (5.4 MB) - Taiwan N-gram database
3. `converter/test_taiwan_vs_mainland.js` - Comparison test suite
4. `TAIWAN-LOCALIZATION.md` (this file) - Documentation

### Modified Files:
1. `converter/build_ngram_lib.py` - Added `parse_terra_pinyin_dict()` function
2. `converter/build_ngram.py` - Added `--format` parameter

---

## 🔬 Technical Details

### Parser Implementation

**Function**: `parse_terra_pinyin_dict(filepath: str)`
- Skips YAML header (until `...` marker)
- Parses `phrase\tpinyin` format
- Assigns uniform frequency=1 to all entries
- Returns `List[Tuple[str, int]]` compatible with existing pipeline

**Example**:
```python
>>> parse_terra_pinyin_entry("臺灣\ttai2 wan1")
('臺灣', 1)
```

### Build Command

**Taiwan corpus**:
```bash
python build_ngram.py \
  --format terra_pinyin \
  --input converter/raw_data/terra_pinyin.dict.yaml \
  --output mvp1/ngram_db_taiwan.json
```

**Output**:
```
Building N-gram database from terra_pinyin.dict.yaml (Taiwan localized)...
======================================================================
[1/5] Parsing terra_pinyin.dict.yaml...
  ✓ Parsed 99,327 entries
[2/5] Counting unigrams...
  ✓ Unique characters: 41,280
[3/5] Counting bigrams...
  ✓ Unique bigrams: 66,180
[4/5] Calculating probabilities...
  ✓ Smoothing: Laplace (α=0.1) - Solution B
[5/5] Writing ngram_db.json...
  ✓ Output size: 5.3 MB
======================================================================
```

---

## 📝 User Communication

**Message to User**:

> 您好！我已完成台灣在地化語料庫的技術實作。
>
> **✅ 技術實作成功**：
> - 已支援 terra_pinyin.dict.yaml 格式
> - 生成了台灣版 ngram_db.json (5.4 MB)
> - 建立了對比測試工具
>
> **⚠️ 重要發現**：
> 測試結果顯示，rime-essay (大陸語料庫) 在**所有類別**都表現更好，包括：
> - 台灣地名（臺灣、高雄、新竹）
> - 台灣用語（網路、資訊、捷運）
> - 一般詞彙（大家、時間、工作）
>
> **原因**：
> 1. terra_pinyin 是詞典（word list），不是語料庫（corpus）
> 2. 資料量差距：717M 字 vs 208K 字（3,400 倍）
> 3. 無頻率資訊（所有詞都是 weight=1）
>
> **建議**：
> 1. **保持使用 rime-essay（推薦）** - 資料量大，預測更準確
> 2. 未來考慮混合兩個語料庫（hybrid approach）
> 3. 或尋找更好的台灣語料庫（如 PTT、台灣新聞等）
>
> terra_pinyin 作為詞典很優秀，但用於 N-gram 訓練時，資料量不足是致命弱點。
>
> 需要我探索其他台灣語料庫來源嗎？

---

## 🔗 Related Resources

- Rime terra_pinyin: https://github.com/rime/rime-terra-pinyin
- Rime essay: https://github.com/rime/rime-essay
- Wikipedia Chinese corpus: https://dumps.wikimedia.org/zhwiki/
- PTT corpus: (Need to research availability)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-10
**Status**: Ready for user review and decision
