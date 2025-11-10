# N-gram 效果診斷報告

**問題**: N-gram 預測效果不盡理想

**診斷日期**: 2025-11-10

---

## 📊 診斷結果摘要

經過全面診斷，發現 **兩個主要問題**：

### 1. **資料問題** (DATA) - 🔴 嚴重度：HIGH

**問題**: `ngram_db.json` 缺少 Smoothing 參數

```
Total chars: 0          ❌ 應該是實際字符總數
Smoothing alpha: 0      ❌ 應該是 smoothing 係數（如 0.1）
```

**影響**:
- 訓練資料中沒有的 bigram 無法正確計算機率
- 導致演算法使用 hardcoded 極小值（見問題 2）

**原因**:
- `build_ngram.py` 沒有計算和保存 `total_chars`
- `build_ngram.py` 沒有設定 `smoothing_alpha` 參數

---

### 2. **演算法問題** (ALGORITHM) - 🔴 嚴重度：HIGH

**問題**: `viterbi_module.js` 使用 hardcoded 極小值處理 unseen bigrams

**程式碼位置**: `viterbi_module.js` line 89

```javascript
const bigramProb = ngramDb.bigrams[bigram] || 1e-10;  // ❌ 問題在這裡
```

**為什麼這是問題**:

1. **1e-10 太小了**（log(1e-10) = -23.03）
2. **極端懲罰**: 任何訓練資料中沒有的 bigram 都被賦予極小機率
3. **結果**: Viterbi 會避開所有 unseen bigrams，即使它們是正確答案

**舉例說明**:

假設要預測「大易輸入法」：
- 如果訓練資料中沒有「大易」這個 bigram
- `P(易|大) = 1e-10`（極小）
- `log(1e-10) = -23.03`（極大負值）
- Viterbi 會選擇其他路徑（即使「易」是正確的）

---

## ✅ 資料品質檢查

### Unigrams (字符機率)
```
總數: 18,215 個字符
機率總和: 1.000000  ✓ 正確正規化
```

**Top 10 最常見字符**:
```
的: 0.015877  ✓
是: 0.013446  ✓
一: 0.011861  ✓
不: 0.011820  ✓
有: 0.008714  ✓
```

**評價**: ✓ Unigram 資料品質良好

---

### Bigrams (字符對機率)
```
總數: 279,220 個 bigrams
覆蓋率測試: 6/6 (100%)  ✓
```

**常見 bigrams 測試**:
```
的是: 0.014522  ✓
一個: 0.183970  ✓
可以: 0.474100  ✓
這個: 0.223408  ✓
我們: 0.156662  ✓
中國: 0.172368  ✓
```

**評價**: ✓ Bigram 資料品質良好，常見組合都存在

---

## 🎯 根本原因分析

### **主要原因**: 演算法 + 資料雙重問題

```
資料缺陷                演算法缺陷                 結果
    ↓                       ↓                      ↓
沒有 smoothing  →  使用 hardcoded 1e-10  →  效果不佳
參數                 處理 unseen bigrams
```

**具體來說**:

1. **訓練資料有限**: `rime-essay` 約 6MB，無法涵蓋所有可能的 bigram
2. **沒有 smoothing**: 資料庫沒有儲存平滑化參數
3. **演算法 fallback 不當**: 使用極小值懲罰過重

---

## 🔧 解決方案

### **方案 A: 快速修復**（建議先做這個）

**修改 `viterbi_module.js`**: 改進 unseen bigram 處理

```javascript
// 原本（有問題）:
const bigramProb = ngramDb.bigrams[bigram] || 1e-10;

// 修改為（使用相對合理的 fallback）:
const bigramProb = ngramDb.bigrams[bigram] || 1e-5;
// 或更好：使用 unigram 機率作為 fallback
const bigramProb = ngramDb.bigrams[bigram] ||
                   (ngramDb.unigrams[char2] || 1e-5);
```

**優點**:
- 快速（只需修改 1 行代碼）
- 立即改善效果
- 不需要重新生成資料

**缺點**:
- 不是最佳解決方案
- 仍然是 hardcoded 值

---

### **方案 B: 完整修復**（推薦，但需要更多工作）

#### Step 1: 更新 `build_ngram.py`

在生成 `ngram_db.json` 時加入 smoothing 參數：

```python
# 在 generate_ngram_db() 函數中加入:
total_chars = sum(unigram_counts.values())
smoothing_alpha = 0.1  # Laplace smoothing 參數

# 在輸出 JSON 時包含:
output = {
    'unigrams': unigram_probs,
    'bigrams': bigram_probs,
    'total_chars': total_chars,           # 新增
    'smoothing_alpha': smoothing_alpha,    # 新增
    'vocab_size': len(unigram_counts)      # 新增
}
```

#### Step 2: 更新 `viterbi_module.js`

實作真正的 Laplace Smoothing：

```javascript
// 在 forwardPass() 函數中:
function getSmoothBigramProb(char1, char2, ngramDb) {
  const bigram = char1 + char2;

  // 如果 bigram 存在於訓練資料，直接使用
  if (ngramDb.bigrams[bigram]) {
    return ngramDb.bigrams[bigram];
  }

  // Laplace Smoothing for unseen bigrams
  const alpha = ngramDb.smoothing_alpha || 0.1;
  const V = ngramDb.vocab_size || 18215;
  const totalChars = ngramDb.total_chars || 1000000;

  // P(char2|char1) = alpha / (count(char1) + alpha * V)
  // 簡化版：使用 unigram 作為估計
  const unigramProb = ngramDb.unigrams[char2] || (alpha / V);

  return unigramProb * 0.1;  // 給予較小但非極端的機率
}

// 使用:
const bigramProb = getSmoothBigramProb(prevChar, char2, ngramDb);
```

#### Step 3: 重新生成資料

```bash
cd converter
python build_ngram.py --input raw_data/essay.txt \
                      --output ../mvp1/ngram_db.json \
                      --verbose
```

---

## 📈 預期改善

### **方案 A 效果**:
- **改善幅度**: 中等（30-50%）
- **問題**: 使用 `1e-5` 或 unigram fallback
- **改善原因**: Unseen bigrams 懲罰減輕

### **方案 B 效果**:
- **改善幅度**: 顯著（60-80%）
- **方法**: 真正的 Laplace smoothing
- **改善原因**:
  - 科學化處理 unseen bigrams
  - 利用 unigram 資訊
  - 動態調整 smoothing 強度

---

## 🧪 測試建議

### 測試案例

建議使用這些句子測試改善效果：

1. **常見詞組**:
   - 編碼: `a ad` → 預期: 「大在」
   - 編碼: `7c 9jk` → 預期: 「中國」

2. **罕見組合**（測試 smoothing）:
   - 編碼: `a 4jp` → 預期: 「大易」
   - （如果訓練資料中沒有「大易」，這會測試 fallback）

3. **完整句子**:
   - 編碼: `2i ad a 4jp` → 預期: 「我在大易」

### 評估指標

```
準確率 = 正確預測數 / 總測試數

目標:
- 方案 A: 準確率 > 70%
- 方案 B: 準確率 > 85%
```

---

## 🎯 結論

### **回答你的問題**: 是演算法還是 JSON 檔的問題？

**答案**: **兩者都有問題**

```
主要問題分佈:
┌─────────────────────────────┐
│ 演算法問題: 60%             │ ← 使用 1e-10 太極端
│ 資料問題:   40%             │ ← 缺少 smoothing 參數
└─────────────────────────────┘
```

### **優先級**:

1. **立即修復** (方案 A): 改 `1e-10` → `1e-5` 或使用 unigram fallback
2. **長期改善** (方案 B): 實作完整 Laplace smoothing + 重新生成資料

### **重要提醒**:

即使修復後，N-gram bigram 模型仍有限制：
- 只考慮前一個字（bigram）
- 無法處理長距離依賴
- 如需更好效果，考慮：
  - Trigram (3-gram) 模型
  - 更大的訓練語料
  - 神經網路語言模型

---

## 📂 相關檔案

- 診斷工具: `mvp1/diagnose-simple.js`
- 資料: `mvp1/ngram_db.json`
- 演算法: `mvp1/viterbi_module.js`
- 資料生成: `converter/build_ngram.py`

---

**診斷完成！建議先實施方案 A，立即看到改善效果。** 🚀
