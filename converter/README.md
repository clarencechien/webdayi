# WebDaYi Converter

將 Rime 的大易字典 (dayi.dict.yaml) 轉換為 WebDaYi 的 JSON 資料庫 (dayi_db.json)。

## 版本

### v1 (convert.js) - 基礎轉換器
- 使用簡單的順序為基礎的頻率計算
- 字典檔案中第一個出現的字 freq=100，第二個 99，以此類推
- **限制**：不反映真實世界的字元使用頻率

### v2 (convert-v2.js) - 增強轉換器 ✨ **推薦**
- 使用真實世界的字元頻率排名
- 基於常用字 2000 排名的資料檔案 (freq.yaml)
- **優勢**：候選字排序更符合實際使用習慣

## 快速開始

### 方法 1：使用 v2 增強轉換器（推薦）

```bash
# 1. 準備頻率資料檔案
cp raw_data/freq.yaml.example raw_data/freq.yaml
# 或使用您自己的完整 freq.yaml (包含 2000 個字元)

# 2. 執行轉換
node convert-v2.js

# 3. 輸出檔案會產生在：../mvp1/dayi_db.json
```

### 方法 2：使用 v1 基礎轉換器

```bash
# 直接執行（無需 freq.yaml）
node convert.js
```

## freq.yaml 格式

```yaml
# 中文字元頻率排名檔案
# 格式：char\trank
# Rank 1 = 最常用，Rank 2000 = 第 2000 名
---
的	1
一	2
是	3
...
```

### 如何取得完整的 freq.yaml

1. **搜尋資源**：搜尋「中文字元頻率表」或「Chinese character frequency list」
2. **常見來源**：
   - 現代漢語常用字表
   - 語料庫分析工具
   - 學術研究資料
3. **建立自己的**：使用真實文本語料庫進行統計分析

## 測試

```bash
# 執行 v2 轉換器的測試套件
node convert-v2.test.js

# 應該看到：✓ All tests passed (21/21)
```

## 檔案結構

```
converter/
├── convert.js              # v1 基礎轉換器
├── convert-v2.js          # v2 增強轉換器（推薦）
├── convert-v2-lib.js      # v2 函式庫
├── convert-v2.test.js     # v2 測試套件 (21 tests)
├── DESIGN-v2.md           # v2 設計文件
├── README.md              # 本檔案
├── raw_data/
│   ├── dayi.dict.yaml           # Rime 大易字典
│   ├── freq.yaml.example        # 頻率檔案範例 (100 字)
│   └── freq.yaml                # 完整頻率檔案 (2000 字) - 您需要建立
└── test-data/
    └── freq-sample.yaml   # 測試用頻率資料
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
- Rank 13 (大) -> freq 9988
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
| 推薦使用 | 開發測試 | 正式環境 |

## 常見問題

### Q: 我沒有 freq.yaml，可以使用 v2 嗎？
A: 可以！v2 會自動回退到 v1 的算法。但建議取得真實的頻率資料以獲得最佳結果。

### Q: freq.yaml 必須包含所有字元嗎？
A: 不需要。v2 會對 freq.yaml 中的字元使用真實頻率，其他字元使用預設頻率 (1000)。

### Q: 如何驗證轉換結果？
A:
1. 檢查輸出檔案大小（應該約 700KB）
2. 檢查字碼數量（應該有 1584 個字碼）
3. 手動測試幾個常用字碼，確認候選字順序合理

### Q: 可以自訂頻率計算公式嗎？
A: 可以！修改 `convert-v2-lib.js` 中的 `calculateFrequency()` 函式。

## 下一步

產生 `dayi_db.json` 後：

1. **測試**：開啟 `mvp1/index.html` 測試輸入法
2. **驗證**：執行 `cd mvp1 && node test-node-v6.js && node test-node-v7.js`
3. **部署**：將檔案部署到 GitHub Pages 或其他主機

## 貢獻

如果您有高品質的 freq.yaml 資料，歡迎分享！
