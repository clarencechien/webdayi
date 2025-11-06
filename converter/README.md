# WebDaYi Converter

將 Rime 的大易字典 (dayi.dict.yaml) 轉換為 WebDaYi 的 JSON 資料庫 (dayi_db.json)。

## 版本

### v1 (convert.js) - 基礎轉換器
- 使用簡單的順序為基礎的頻率計算
- 字典檔案中第一個出現的字 freq=100，第二個 99，以此類推
- **限制**：不反映真實世界的字元使用頻率

### v2 (convert-v2.js) - 增強轉換器 ✨ **推薦**
- 使用真實世界的字元頻率排名
- 基於台灣教育部常用字 2000 排名資料
- **優勢**：候選字排序更符合實際使用習慣

## 快速開始

### 使用 v2 增強轉換器（推薦）✨

本專案已包含完整的 2000 字頻率資料，可以直接使用！

```bash
# 直接執行（已包含完整的 freq.yaml）
node convert-v2.js

# 輸出檔案會產生在：../mvp1/dayi_db.json
```

### 使用 v1 基礎轉換器

```bash
# 直接執行（無需 freq.yaml）
node convert.js
```

## 頻率資料

### freq.yaml 格式

```tsv
# 中文字元頻率排名檔案
# 格式：char\trank（TSV 格式）
# Rank 1 = 最常用，Rank 2000 = 第 2000 名
---
的	1
不	2
一	3
我	4
是	5
...
```

### 資料來源 ✅

本專案已包含台灣教育部高頻漢字前 2000 字的完整資料！

**資料詳情**：
- 檔案：`raw_data/freq.yaml`（TSV 格式，供轉換器使用）
- 來源：台灣教育部常用字頻率統計
- 涵蓋範圍：前 2000 個最常用繁體中文字

**資料品質**：
- Rank 1: 的（最常用）
- Rank 6: 人
- Rank 9: 大
- ...
- Rank 2000: 吊

**轉換統計結果**：
- 高頻字 (>=9000): 1,153 個字元
- 中頻字 (2000-8999): 1,158 個字元
- 低頻字 (<2000): 11,615 個字元

## 測試

```bash
# 執行 v2 轉換器的測試套件
node convert-v2.test.js

# 應該看到：✓ All tests passed (21/21)
```

## 檔案結構

```
converter/
├── convert.js                # v1 基礎轉換器
├── convert-v2.js            # v2 增強轉換器（推薦）✨
├── convert-v2-lib.js        # v2 函式庫
├── convert-v2.test.js       # v2 測試套件 (21 tests)
├── DESIGN-v2.md             # v2 設計文件
├── README.md                # 本檔案
├── raw_data/
│   ├── dayi.dict.yaml       # Rime 大易字典
│   └── freq.yaml            # 頻率資料（TSV 格式，2000 字）✅
└── test-data/
    └── freq-sample.yaml     # 測試用頻率資料（前 20 字）
```

## 頻率計算演算法

### v2 頻率計算

```javascript
// 基準頻率
BASE_FREQ = 10000  // Rank 1
MIN_FREQ = 8000    // Rank 2000
DEFAULT_FREQ = 1000 // 不在排名中的字

// 線性映射：rank -> frequency
freq = BASE_FREQ - (rank - 1) * (BASE_FREQ - MIN_FREQ) / 1999

範例：
- Rank 1 (的)  -> freq 10000
- Rank 6 (人)  -> freq 9995
- Rank 9 (大)  -> freq 9992
- Rank 1000    -> freq 9000
- Rank 2000    -> freq 8000
- 不在列表中   -> freq 1000
```

### v1 頻率計算（舊版）

```javascript
// 基於 YAML 檔案中的順序
freq = 100 - index
// 第一個：100，第二個：99，第三個：98...
```

## 輸出格式

兩個版本都產生相同的 JSON 格式：

```json
{
  "code": [
    { "char": "字", "freq": 9988 },
    { "char": "字", "freq": 8500 },
    ...
  ]
}
```

## 性能比較

| 指標 | v1 | v2 |
|------|----|----|
| 處理速度 | ~0.5s | ~0.6s |
| 候選字準確度 | 低 | 高 ✨ |
| 需要額外檔案 | 否 | 是 (freq.yaml) |
| 推薦使用 | 開發測試 | 正式環境 ✅ |

## 常見問題

### Q: 專案已包含頻率資料嗎？
A: ✅ 是的！專案已包含台灣教育部高頻漢字前 2000 字的完整資料。直接執行 `node convert-v2.js` 即可使用。

### Q: 如何更新或自訂頻率資料？
A: 直接編輯 `raw_data/freq.yaml` 檔案（TSV 格式），然後執行 `node convert-v2.js` 重新產生資料庫。

### Q: 如何驗證轉換結果？
A:
1. 檢查輸出檔案大小（應該約 700KB）
2. 檢查字碼數量（應該有 1584 個字碼）
3. 執行測試套件：`node convert-v2.test.js`
4. 手動測試幾個常用字碼，確認候選字順序合理

### Q: 可以自訂頻率計算公式嗎？
A: 可以！修改 `convert-v2-lib.js` 中的 `calculateFrequency()` 函式。

## 下一步

產生 `dayi_db.json` 後：

1. **測試**：開啟 `mvp1/index.html` 測試輸入法
2. **驗證**：執行 `cd mvp1 && node test-node-v6.js && node test-node-v7.js`
3. **部署**：將檔案部署到 GitHub Pages 或其他主機

## 範例輸出

使用 v2 轉換器產生的資料庫，候選字按真實使用頻率排序：

```javascript
// Code 'v' (大)
[
  { "char": "大", "freq": 9992 },  // Rank 9 - 高頻常用字
  { "char": "夫", "freq": 9544 },  // Rank ~500
  { "char": "禾", "freq": 1000 }   // 不在頻率表中
]

// Code 'a' (人)
[
  { "char": "人", "freq": 9995 },  // Rank 6 - 超高頻字
  { "char": "入", "freq": 9785 }   // Rank ~250
]
```
