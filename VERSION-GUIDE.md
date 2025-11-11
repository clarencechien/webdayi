# WebDaYi 版本管理指南

## 快速查看版本

### 方法 1：瀏覽器 Console（推薦）

打開 WebDaYi 後，按 F12 開啟 DevTools，在 Console 中會自動顯示：

```
🚀 WebDaYi MVP 1.0
Version: 11.2.0
Build: 20251111-001
Commit: 22c263d
Release: Blind Typing Fix
--------------------------------------------------
Latest Changes:
  1. CRITICAL FIX: Space key now ONLY buffers (no prediction)
  2. = key triggers prediction + output (one step)
  3. Fixed mobile prediction button
  4. True blind typing workflow enabled
--------------------------------------------------
To check version: window.WEBDAYI_VERSION
```

或者在 Console 中輸入：
```javascript
window.WEBDAYI_VERSION
```

### 方法 2：查看頁面標題

頁面標題包含版本號：`WebDaYi (網頁大易輸入法) - MVP 1.0 v11.2`

### 方法 3：查看頁面原始碼

在頁面上按右鍵 → 查看頁面原始碼，搜尋 "app-version"：

```html
<meta name="app-version" content="11.2.0">
<meta name="app-build" content="20251111-001">
<meta name="app-commit" content="22c263d">
<meta name="app-release" content="Blind Typing Fix">
```

### 方法 4：查看 version.json

直接訪問：`https://your-site.com/version.json`

## 版本號格式

格式：`MAJOR.MINOR.PATCH`

- **MAJOR** (11): 重大功能變更或架構變更
- **MINOR** (2): 新功能或重要修復
- **PATCH** (0): 小修復或改進

## 開發者：如何更新版本

### 自動更新（推薦）

使用提供的腳本：

```bash
# Patch 版本（小修復）
./scripts/bump-version.sh patch "Bug Fix"

# Minor 版本（新功能）
./scripts/bump-version.sh minor "New Feature"

# Major 版本（重大變更）
./scripts/bump-version.sh major "Major Release"
```

腳本會自動更新：
- `mvp1/version.json`
- `mvp1/index.html` 中的所有版本資訊

### 手動更新

需要更新 3 個地方：

1. **mvp1/version.json**
   ```json
   {
     "version": "11.2.0",
     "build": "20251111-001",
     "commit": "22c263d",
     "releaseName": "Blind Typing Fix"
   }
   ```

2. **mvp1/index.html - Meta 標籤**
   ```html
   <meta name="app-version" content="11.2.0">
   <meta name="app-build" content="20251111-001">
   <meta name="app-commit" content="22c263d">
   <meta name="app-release" content="Blind Typing Fix">
   ```

3. **mvp1/index.html - window.WEBDAYI_VERSION**
   ```javascript
   window.WEBDAYI_VERSION = {
     version: '11.2.0',
     build: '20251111-001',
     commit: '22c263d',
     releaseName: 'Blind Typing Fix'
   };
   ```

## CI/CD

### 自動測試

推送到任何分支時，GitHub Actions 會自動運行測試：

- ✅ v11 core tests
- ✅ Laplace smoothing tests
- ✅ Sentence mode tests
- ✅ UX tests

查看測試結果：`https://github.com/YOUR-REPO/actions`

### 自動部署

推送到 `main` 分支時，GitHub Actions 會自動部署到 GitHub Pages。

## 版本歷史

### v11.2.0 (2025-11-11) - Blind Typing Fix
- CRITICAL FIX: Space key now ONLY buffers (no prediction)
- = key triggers prediction + output (one step)
- Fixed mobile prediction button
- True blind typing workflow enabled

### v11.1.0 (2025-11-11) - Function Scope Fix
- Fixed function scope issue (window.* vs global)
- Updated UI text 'Press Space' → 'Press ='
- Fixed button handler to call correct function

### v11.0.0 (2025-11-11) - Space/= Key Redesign
- Redesigned Space key behavior for sentence mode
- Changed = key from pagination to prediction confirmation
- Disabled selection keys in sentence mode
- 25 new TDD tests

### v10.0.0 (2025-11-06) - Full Laplace Smoothing
- Implemented complete Laplace smoothing
- N-gram database v2.0 with raw counts
- 96/96 tests passing

## 測試版本確認

為了確保測試的是正確版本：

1. **清除瀏覽器快取**
   - Chrome: Ctrl+Shift+R (強制重新載入)
   - 或開啟無痕模式測試

2. **檢查版本號**
   - 打開 Console 查看版本資訊
   - 確認版本號與預期一致

3. **檢查 Commit**
   - 版本資訊中會顯示 commit hash
   - 與 git log 對比確認

## 故障排除

### Q: 版本號沒有更新？

A: 清除瀏覽器快取後重新載入（Ctrl+Shift+R）

### Q: Console 沒有顯示版本資訊？

A: 檢查是否有 JavaScript 錯誤阻止腳本執行

### Q: GitHub Actions 測試失敗？

A: 查看 Actions 頁面的詳細日誌，檢查哪個測試失敗

## 相關文件

- [CLAUDE.md](./CLAUDE.md) - 項目整體說明
- [memory-bank/](./memory-bank/) - 項目記憶庫
- [docs/](./docs/) - 完整文檔
