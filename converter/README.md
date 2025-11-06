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

### 方法 1：使用 v2 增強轉換器（推薦）✨

本專案已包含完整的 2000 字頻率資料，可以直接使用！

```bash
# 直接執行（已包含完整的 freq.yaml）
node convert-v2.js

# 輸出檔案會產生在：../mvp1/dayi_db.json
```

**如果需要更新頻率資料**：
```bash
# 1. 編輯 raw_data/feq.yaml（較易讀的 YAML 格式）
# 2. 轉換為 freq.yaml
node convert-feq-to-freq.js
# 3. 重新產生資料庫
node convert-v2.js
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

### 完整的頻率資料（已包含）✅

本專案已包含台灣教育部高頻漢字前 2000 字的完整資料！

**資料來源**：
- 原始檔案：`raw_data/feq.yaml`（YAML 格式，易讀易編輯）
- 轉換後：`raw_data/freq.yaml`（TSV 格式，供轉換器使用）
- 來源：台灣教育部常用字頻率統計
- 涵蓋範圍：前 2000 個最常用繁體中文字

**資料品質**：
- Rank 1: 的（最常用）
- Rank 9: 大
- Rank 6: 人
- ...
- Rank 2000: 吊

**統計結果（使用真實資料）**：
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
├── convert-feq-to-freq.js   # feq.yaml 格式轉換工具
├── DESIGN-v2.md             # v2 設計文件
├── README.md                # 本檔案
├── raw_data/
│   ├── dayi.dict.yaml       # Rime 大易字典
│   ├── feq.yaml             # 教育部頻率資料（YAML 格式，2000 字）✅
│   ├── freq.yaml            # 轉換後頻率資料（TSV 格式，供轉換器使用）✅
│   └── freq.yaml.example    # 頻率檔案範例（舊檔案，可忽略）
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

### Q: 專案已包含頻率資料嗎？
A: ✅ 是的！專案已包含台灣教育部高頻漢字前 2000 字的完整資料。直接執行 `node convert-v2.js` 即可使用。

### Q: freq.yaml 和 feq.yaml 有什麼差別？
A:
- `feq.yaml`：原始 YAML 格式（易讀易編輯）來自 main branch
- `freq.yaml`：轉換後的 TSV 格式（供轉換器使用）
- 使用 `node convert-feq-to-freq.js` 可以將 feq.yaml 轉換為 freq.yaml

### Q: 如何更新或自訂頻率資料？
A:
1. 編輯 `raw_data/feq.yaml`（較易讀）
2. 執行 `node convert-feq-to-freq.js` 轉換格式
3. 執行 `node convert-v2.js` 重新產生資料庫

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
