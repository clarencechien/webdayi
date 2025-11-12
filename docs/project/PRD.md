# **產品需求文件 (PRD)：WebDaYi (網頁大易輸入法)**

| 文件版本 | 1.4 (v3.0 智能升級：個人化學習 & 情境感知) |
| :---- | :---- |
| **建立日期** | 2025-11-12 |
| **最後更新** | 2025-11-12 |
| **專案負責人** | (您的名字) |
| **狀態** | 已批准 (Approved) |

## **1\. 概述 (Overview)**

### **1.1. 問題陳述 (Problem)**

1. **大易輸入法**的使用者群體雖然穩定，但可選用的現代輸入法工具相對較少。  
2. 現有的高效能輸入法（如 Rime）功能強大，但**設定檔 (config) 複雜**，客製化門檻高，且「全家桶」架構對只想用單一輸入法的使用者來說過於笨重。  
3. 使用者（開發者本人）希望擁有一個**完全可控、輕量、且能依據個人習慣高度客製化**的輸入法，並希望它能以現代 Web 技術為核心，以便未來擴展。

### **1.2. 解決方案 (Solution)**

打造一個名為「**WebDaYi**」的輕量級、網頁優先 (Web-First) 的大易輸入法。本專案將寄生 (piggyback) 於 Rime 現有的開源大易**資料**之上，但**自行實作**一個更簡單、更現代的**核心引擎**與**瀏覽器整合**外殼。

### **1.3. 專案願景 (Vision)**

提供一個啟動快、延遲低、易於客製化、且最終能實現個人化學習（N-gram、動態詞庫、雲同步）的**瀏覽器內**原生輸入體驗。

## **2\. 專案目標 & 範圍 (Goals & Scope)**

### **2.1. 核心目標**

* **驗證可行性：** 證明 Web 技術（JS）足以承擔高效能輸入法所需的核心運算（查表、排序）。  
* **提供價值：** 為大易使用者（特別是重度瀏覽器使用者）提供一個「免設定、雲同步」的智能輸入選項。

### **2.2. 成功指標 (Success Metrics)**

* **MVP 1：** 核心查表邏輯 100% 準確。使用者能在 3 分鐘內，透過「輸入-選字-複製」流程，無錯誤地完成 100 字的段落撰寫。  
* **MVP 2a：** 「就地注入」(In-Place Injection) 延遲低於 100ms。外掛能在 3 個以上的主流 Web 應用（例如：Gmail, Notion Web, Google Docs）的輸入框中無縫運作。

### **2.3. 目標使用者 (Target Audience)**

* **P0 (主要)：** 開發者本人。一個熟悉大易、重度使用瀏覽器（Web Apps）、且渴望工具能「情境感知」和「雲同步」的超級使用者。  
* **P1 (次要)：** 其他大易輸入法使用者，他們的主要工作和溝通都在瀏覽器中完成。

## **3\. 專案路線圖 (Project Roadmap)**

本專案將拆分為三個 MVP 階段，逐步增加複雜性。

1. **MVP 1：純網站核心引擎 (The Core Engine)**
   * **目標：** 驗證「逐字」輸入-查詢-排序-組字的核心演算法。
   * **交付物：** 一個靜態網頁 (index.html \+ core\_logic.js)。
2. **MVP 2a：「瀏覽器整合」外掛 (The Browser Plugin)**
   * **目標：** 重用 MVP 1 核心，提供「逐字」的「就地」輸入體驗。
   * **交付物：** 一個 Chrome 擴充功能 .zip 檔。
3. **MVP 3：N-gram 智能引擎 (The Smart Engine)**
   * **目標：** 重構 MVP 2a，從「逐字」選擇進化為「整句預測（盲打）」，並包含個人化學習功能。
   * **交付物：** Chrome 擴充功能的 v2.0 更新。

## **4\. 共通架構：資料管線 (Data Pipeline)**

此為所有 MVP 的**共同依賴項**，必須最先完成。

| ID | 需求 | 備註 |
| :---- | :---- | :---- |
| **C.1** | **Rime 資料轉換器** | 必須建立一個一次性的轉換腳本 (Python 或 Node.js)。 |
| **C.2** | **讀取 Rime 碼表** | 腳本必須能讀取 Rime 的 dayi.dict.yaml (大易詞典檔)。 |
| **C.3** | **輸出 dayi\_db.json** | 腳本必須輸出一份 json 檔案，作為 Web App 的核心資料庫。 |
| **C.4** | **JSON 資料結構** | 輸出的 JSON 必須採用「**以碼為 Key**」的結構，以實現 O(1) 查詢。 **格式範例：** { "4jp": \[ { "char": "易", "freq": 80 }, { "char": "義", "freq": 70 } \], "a": \[ { "char": "大", "freq": 100 } \] ... } |
| **C.5** | **N-gram 轉換器 (MVP 3)** | 必須使用 build\_ngram.py 腳本（已提供）。 |
| **C.6** | **N-gram 來源 (MVP 3)** | **(已確認)** 腳本必須讀取 **rime-essay** (https://github.com/rime/rime-essay) 中的 **essay.txt** (約 6MB)。 |
| **C.7** | **輸出 ngram\_db.json (MVP 3)** | 腳本必須輸出一份 N-gram 機率檔 (e.g., { "unigram\_counts": {...}, "bigram\_counts": {...} })。 |

## **5\. MVP 1：「純網站」核心引擎 PRD**

**目標：** 在瀏覽器沙盒中，專注驗證核心演算法。

| ID | 功能 | 使用者故事 (User Story) | 驗收標準 (AC) |
| :---- | :---- | :---- | :---- |
| **MVP1.1** | **資料載入** | 作為使用者，我希望頁面載入時，能快速讀取大易碼表資料庫。 | 1\. core\_logic.js 必須使用 fetch API 讀取 dayi\_db.json。 2\. 必須將 JSON 資料轉換為 JavaScript Map 物件並存入記憶體，以供快速查詢。 |
| **MVP1.2** | **按鍵輸入** | 作為使用者，我希望在「輸入框」中輸入大易碼 4jp。 | 1\. 頁面需有一個 \<input\> 元素。 2\. JS 必須監聽 input 事件。 |
| **MVP1.3** | **查詢與排序** | 作為使用者，我輸入 4jp 後，希望能立刻看到「易」和「義」。 | 1\. JS 必須即時查詢 Map.get('4jp')。 2\. 必須依照 dayi\_db.json 中提供的 freq (詞頻) **由高到低**排序候選字。 |
| **MVP1.4** | **候選字渲染** | 作為使用者，我希望候選字依序顯示 1\. 易 2\. 義。 | 1\. 頁面需有一個 \<div\> (候選區)。 2\. 排序後的候選字必須被動態渲染到此 \<div\> 中，並包含數字編號。 |
| **MVP1.5** | **選字與組字** | 作為使用者，我希望能按下數字鍵 1 來選擇「易」。 | 1\. JS 必須監聽 keydown 事件 (捕捉 1-9)。 2\. 選字後，「易」字必須被添加(append)到一個「輸出緩衝區」(\<textarea\>) 中。 3\. 選字後，「輸入框」必須自動清空。 |
| **MVP1.6** | **剪貼簿輸出** | 作為使用者，我組好一句話後，希望能點擊「複製」按鈕。 | 1\. 頁面需有一個「複製」按鈕。 2\. 點擊後，必須呼叫 navigator.clipboard.writeText()，複製「輸出緩衝區」的**所有**內容。 |
| **MVP1.7** | **載入個人紀錄** | 作為使用者，我希望輸入法能在我下次打開時，記得我上次的偏好。 | 1\. 頁面載入時，必須嘗試從 localStorage.getItem('webDayi_UserModel') 讀取資料。 2\. 必須將讀取的 JSON 資料解析並存入一個 userModel Map 中。 |
| **MVP1.8** | **儲存個人偏好** | 作為使用者，當我選了一個非預設的候選字時 (e.g., 選了第 2 個)，我希望輸入法能記住這個選擇。 | 1\. 在 onCandidateSelected 事件中，必須觸發 updateUserModel 邏輯。 2\. 必須計算出一個「新的偏好順序」陣列 (將選中的字移到最前)。 3\. 必須呼叫 localStorage.setItem() 將整個 userModel 寫回瀏覽器。 |
| **MVP1.9** | **優先顯示偏好** | 作為使用者，如果我之前選過「義」，我希望下次打 4jp 時，「義」能顯示為第 1 個選項。 | 1\. query() 函式必須優先檢查 userModel 中是否存在該 code 的紀錄。 2\. 如果存在，必須按照 userModel 中儲存的陣列順序來渲染候選字。 3\. 如果不存在，才使用 staticModel 的預設 freq 順序。 |

## **6\. MVP 2a：「瀏覽器整合」外掛 PRD**

**目標：** 重用 MVP 1 核心，將其打包成一個無縫的「瀏覽器內」原生輸入法。

### **6.1. 功能需求 (Functional Requirements)**

| ID | 功能 | 使用者故事 (User Story) | 驗收標準 (AC) |
| :---- | :---- | :---- | :---- |
| **MVP2a.1** | **核心重用 (P0)** | 作為開發者，我希望能 100% 重用 MVP 1 的核心邏輯。 | 1\. MVP 1 的 core\_logic.js (查詢、排序) 應被重構為一個可獨立呼叫的模組。 2\. dayi\_db.json 應由 background.js 載入。 |
| **MVP2a.2** | **外掛結構** | 作為開發者，我需要一個標準的 Manifest V3 外掛結構。 | 1\. 必須包含 manifest.json (V3)。 2\. 必須包含 background.js (Service Worker)。 3\. 必須包含 content.js (內容腳本)。 |
| **MVP2a.3** | **權限請求** | 作為使用者，我希望外掛只請求最必要的權限。 | 1\. manifest.json 必須請求 "storage" (用於個人詞庫)。 2\. 必須請求 "scripting" 和 "activeTab" 來實現動態注入 content.js (這是比 \<all\_urls\> 更安全的作法)。 |
| **MVP2a.4** | **核心載入** | 作為使用者，我希望輸入法核心能在瀏覽器啟動時就準備好。 | 1\. background.js 必須在 onInstalled 或 onStartup 事件時，fetch dayi\_db.json 並將其載入記憶體的 Map 物件。 |
| **MVP2a.5** | **輸入攔截** | 作為使用者，當我在 Gmail 輸入框中打字時，我希望 WebDaYi 能被觸發。 | 1\. content.js (被注入後) 必須能偵測頁面上的可輸入區域 (如 \<textarea\>, contentEditable)。 2\. 必須監聽 keydown 事件，並能**攔截** (e.g., event.preventDefault()) 大易碼 (如 4jp)。 |
| **MVP2a.6** | **動態 UI** | 作為使用者，我希望候選字視窗能出現在我打字的地方。 | 1\. content.js 必須**動態建立**一個 \<div\> (候選字視窗)。 2\. 此 \<div\> 必須透過計算 window.getSelection() 或 element.caretPosition 來精確**定位**在游標附近。 |
| **MVP2a.7** | **訊息通訊** | (背後運作) 內容腳本需要向背景腳本請求查詢。 | 1\. content.js 必須使用 chrome.runtime.sendMessage 發送查詢請求 (e.g., { type: "query", code: "4jp" })。 2\. background.js 必須監聽 onMessage 事件，處理查詢並回傳結果。 |
| **MVP2a.8** | **就地注入 (P0)** | 作為使用者，我按下 1 選字後，「易」字必須**立刻**出現在我的 Gmail 中。 | 1\. content.js 收到選字指令 (e.g., 按下 1)。 2\. 必須使用 document.execCommand('insertText', ...) 或直接操作 textarea.value 將「易」字**就地插入**到游標位置。 3\. 插入後，動態 UI \<div\> 必須被銷毀或隱藏。 |

### **6.2. 非功能需求 (Non-Functional)**

* **效能：** 從按鍵 (e.g., p) \-\> 攔截 \-\> 查詢 \-\> 候選字渲染，整個過程必須低於 100ms，達到體感無延遲。  
* **相容性：** content.js 必須能正確應對**富文本編輯器** (如 Google Docs, Notion) 和**Shadow DOM** (某些網頁元件)。  
* **穩定性：** content.js 注入的 CSS 和 JS **不得**與宿主網頁的樣式或功能衝突 (需使用 CSS 隔離策略)。

## **7\. MVP 3：N-gram 智能引擎 PRD (v1.3 詳述)**

**目標：** 重構 MVP 2a，實現「盲打」功能，並整合「N-gram 個人化學習」。這將徹底改變 content.js 和 background.js 的運作方式。

### **7.1. 功能需求 (Functional Requirements)**

| ID | 功能 | 使用者故事 (User Story) | 驗收標準 (AC) |
| :---- | :---- | :---- | :---- |
| **MVP3.1** | **N-gram 資料庫** | 作為開發者，我需要 ngram\_db.json 檔案。 | 1\. 必須使用 build\_ngram.py 成功處理 rime-essay (6MB) 的 essay.txt。<br>2\. 產生的 ngram\_db.json 必須打包到 Chrome 外掛中。 |
| **MVP3.2** | **Viterbi 演算法** | 作為開發者，我需要一個 Viterbi.js 模組來計算最佳句子路徑。 | 1\. 必須實作一個維特比演算法。<br>2\. 輸入為 Lattice (候選字格狀圖)。<br>3\. 輸出為機率最高的「句子」(字元陣列)。 |
| **MVP3.3** | **背景核心升級** | 作為輸入法大腦，background.js 需要載入 N-gram 模型。 | 1\. background.js 必須在啟動時，同時載入 dayi\_db.json 和 ngram\_db.json 到記憶體中。 |
| **MVP3.4** | **背景 API (盲打)** | background.js 需要一個 API 來處理句子預測。 | 1\. 必須新增一個訊息監聽器 querySentence。<br>2\. 此 API 接收一個「編碼陣列」(e.g., ['4jp', 'ad'])。<br>3\. 必須使用 Viterbi 演算法、碼表、N-gram 模型，計算出最佳句子 (e.g., "易 在")。<br>4\. 回傳該句子。 |
| **MVP3.5** | **內容腳本 (盲打)** | 作為使用者，我希望可以「盲打」一串編碼。 | 1\. content.js 不再於 4jp 時就去查詢。<br>2\. content.js 必須在本機緩存 (buffer) 使用者的編碼 (e.g., ['4jp', 'ad'])。 |
| **MVP3.6** | **整句注入** | 作為使用者，我按下 空白鍵 後，希望能看到預測的整句話。 | 1\. content.js 監聽到 Spacebar (空白鍵) 或其他觸發鍵。<br>2\. 將緩存的編碼陣列 ['4jp', 'ad'] 透過 querySentence API 發送到 background.js。<br>3\. (AC 詳述) 此時應顯示「候選字視窗」，第一候選為 Viterbi 算出的最佳句子。<br>4\. 使用者按 Enter 或 1 選中該句，並使用 document.execCommand('insertText', ...) 將整句話一次性注入。 |
| **MVP3.7** | **N-gram 學習 (偵測)** | 作為使用者，如果系統預測「台灣」，但我手動將其修改為「大灣」，我希望系統能記住我的偏好。 | 1\. content.js 必須有能力偵測到「手動修正」事件 (例如，使用者在盲打後，按 Shift+Left 選取了 "台"，然後按 2 將其改為 "大")。 |
| **MVP3.8** | **N-gram 學習 (儲存)** | 作為開發者，background.js 必須能儲存使用者的 N-gram 偏好。 | 1\. 當 content.js 偵測到修正 (e.g., P("灣" \| "大"))，必須發送一個新訊息 (e.g., learnNgram: {prev: "大", next: "灣"})。<br>2\. background.js 必須將這個「使用者偏好」的 N-gram 組合 (e.g., {"大": {"灣": 1000}}) 儲存到 chrome.storage.sync 中。 |
| **MVP3.9** | **N-gram 學習 (應用)** | 作為使用者，我希望我教過輸入法的詞，下次能優先出現。 | 1\. background.js 在啟動時，除了載入靜態模型，還必須載入 chrome.storage.sync 中的「使用者 N-gram 模型」。<br>2\. Viterbi 演算法在計算 P(B\|A) 機率時，必須優先查詢「使用者模型」，如果找不到，才回退 (fallback) 到靜態的 ngram\_db.json。 |

### **7.2. 非功能需求 (Non-Functional)**

* **效能：** querySentence (Viterbi 運算) 必須在 200ms 內完成，以實現即時回應。
* **大小：** 包含 ngram\_db.json 的外掛總大小應控制在 5-10MB (gzipped) 以內。

## **8\. MVP 3.0 v2：智能升級 PRD (v1.4 - 個人化學習與情境感知)**

**目標：** 在 MVP 3.0 (N-gram 整句預測) 的基礎上，實現「個人化學習」與「情境自適應」，解決 v2.7 的平局問題。

### **8.1. 問題陳述 (v2.7 局限性)**

雖然 MVP 3.0 v2.7 Hybrid 已達到 94.4% 準確率，但仍存在以下問題：

1. **平局問題：** 當「天氣」和「天真」的 N-gram 分數接近時（70/30 混合），系統無法學習使用者偏好。
2. **情境盲目：** 在 GitHub (正式) 和 PTT (口語) 上使用相同的預測策略，無法針對情境優化。
3. **一體適用：** 無法適應個人打字習慣，每個使用者得到相同的預測結果。
4. **靜態模型：** 沒有個人化或學習能力，無法隨時間改進。

### **8.2. 解決方案：雙軌並行開發**

我們將並行開發兩個**「共享功能模組」**，兩者都將自動增強「逐字模式」與「整句模式」：

* **F-4.0: 個人化 N-gram 學習 (User LoRA)** - 優先級 1
* **F-5.0: 情境自適應權重 (Adaptive Weights)** - 優先級 2

兩個模組都被設計為**「共享服務」**，無論是「逐字模式」還是「整句模式」呼叫 Viterbi.js 時，都會自動啟用這些新功能。

### **8.3. F-4.0: 個人化 N-gram 學習 (User LoRA)**

#### **概念：使用者自適應 (User-Side LoRA)**

受機器學習的 LoRA (Low-Rank Adaptation) 技術啟發，我們在靜態 N-gram 模型上實現「使用者適配層」。

**核心架構**：
* **基礎模型 (Base Model)**: ngram_db.json，靜態、唯讀，提供統計基礎
* **適配器 (LoRA)**: chrome.storage.sync (使用者資料庫)，動態、可讀寫，記錄個人偏好
* **運作方式**: Viterbi 演算法計算分數時，將「基礎模型分數」與「LoRA 分數」相加

**公式**：
```
最終分數 = 基礎模型分數 + 使用者 LoRA 分數
```

#### **功能需求 (Functional Requirements)**

| ID | 功能 | 使用者故事 | 驗收標準 (AC) |
| :---- | :---- | :---- | :---- |
| **F-4.1** | **UserDB 模組** | 作為開發者，我需要一個 UserDB.js 模組來管理使用者的個人化權重。 | 1\. 必須實作 UserDB.js 類別。<br>2\. 必須提供 getWeights(prevChar, currChar) 方法，回傳個人權重 (e.g., +10, -5, 0)。<br>3\. 必須提供 recordCorrection(prevChar, currChar, action) 方法，action 為 "promote" (+5) 或 "demote" (-2)。<br>4\. 必須使用 chrome.storage.sync 或 localStorage 持久化儲存。 |
| **F-4.2** | **逐字模式整合** | 作為使用者，當我在逐字模式中選擇非預設候選字時，我希望系統能記住我的偏好。 | 1\. sortCandidates() 函式必須查詢 UserDB.getWeights(prevChar, candidate.char)。<br>2\. 最終分數 = candidate.freq + userWeight。<br>3\. 當使用者選擇第 2 個候選字時，必須呼叫 UserDB.recordCorrection(prevChar, selectedChar, "promote")。<br>4\. (可選) 同時呼叫 UserDB.recordCorrection(prevChar, defaultChar, "demote")。 |
| **F-4.3** | **整句模式整合** | 作為使用者，當我在整句模式中手動修正預測結果時，我希望系統能記住這次修正。 | 1\. viterbi\_module.js 的 forwardPass() 必須在計算轉移機率時，加上 userDB.getWeights(prevChar, currChar)。<br>2\. content.js 必須偵測「手動修正」事件 (使用者改變了 Viterbi 的預測)。<br>3\. 必須呼叫 UserDB.recordCorrection() 記錄此修正。 |
| **F-4.4** | **跨模式協同** | 作為使用者，我希望在逐字模式中教過的詞，在整句模式中立刻生效，反之亦然。 | 1\. UserDB 必須被兩種模式共享 (同一個 chrome.storage.sync 資料)。<br>2\. 在逐字模式學習 {"天": {"氣": +5}} 後，在整句模式盲打「天氣」時，Viterbi 必須自動使用此權重。 |
| **F-4.5** | **學習回饋 UI** | 作為使用者，當系統學習了我的偏好時，我希望能看到明確的回饋。 | 1\. 當 UserDB.recordCorrection() 被呼叫時，必須顯示 Toast 通知：「✓ 已學習：天氣 > 天真」。<br>2\. 必須在設定面板中，提供「查看已學習模式」功能。<br>3\. 必須提供「清除學習資料」按鈕。 |

#### **範例：平局問題解決**

**情境**：使用者打「天」(ev) 後，接著打「c8」(氣/真)

**v2.7 行為 (無學習)**：
```
候選字: [1. 真 (freq: 80), 2. 氣 (freq: 70)]
問題: 永遠是「真」排第一
```

**v3.0 行為 (有學習)**：
```
第一次:
  候選字: [1. 真 (80), 2. 氣 (70)]
  使用者選擇: 2 (氣)
  UserDB 記錄: {"天": {"氣": +5, "真": -2}}

第二次 (相同輸入):
  候選字排序:
    真: 80 + (-2) = 78
    氣: 70 + (+5) = 75
  結果: [1. 氣, 2. 真]  ✓ 已學習！

第三次 (使用者再次選氣):
  UserDB 更新: {"天": {"氣": +10, "真": -4}}
  結果: 氣 = 80, 真 = 76  ✓ 偏好更強化！
```

### **8.4. F-5.0: 情境自適應權重 (Adaptive Weights)**

#### **概念：動態調整「泛用 vs 聊天」比例**

我們的 ngram_db.json 是 70% 泛用 + 30% 聊天混合模型。但在不同網站上，使用者的需求不同：

* **GitHub / Medium**：正式寫作 → Bigram 結構更重要 (80/20)
* **PTT / Dcard**：口語聊天 → Unigram 熱門字更重要 (60/40)
* **預設**：平衡 (70/30，v2.5 黃金比例)

**錯誤作法**：載入兩個模型 (慢、佔記憶體)
**正確作法**：只載入一個模型，動態調整 Viterbi.js 的評分公式權重

#### **功能需求 (Functional Requirements)**

| ID | 功能 | 使用者故事 | 驗收標準 (AC) |
| :---- | :---- | :---- | :---- |
| **F-5.1** | **ContextEngine 模組** | 作為開發者，我需要一個 ContextEngine.js 模組來根據網站情境，提供動態權重。 | 1\. 必須實作 ContextEngine.js 類別。<br>2\. 必須提供 getWeights(url) 方法，回傳 {bigram: 0.7, unigram: 0.3}。<br>3\. 必須預設定義至少 10 個常見網站的規則 (github.com, ptt.cc, etc.)。 |
| **F-5.2** | **情境偵測** | 作為系統，我必須能自動偵測使用者當前所在的網站。 | 1\. content.js 必須能取得 window.location.hostname。<br>2\. 必須在每次查詢時，將 context (hostname) 傳遞給 background.js。 |
| **F-5.3** | **Viterbi 整合** | 作為 Viterbi 演算法，我必須根據情境權重，動態調整評分公式。 | 1\. forwardPass() 函式必須接收 contextWeights 參數。<br>2\. 計算轉移機率時，必須使用：<br>&nbsp;&nbsp;&nbsp;finalProb = contextWeights.bigram \* bigramProb + contextWeights.unigram \* unigramProb。<br>3\. 不再使用固定的 BIGRAM\_WEIGHT = 0.7。 |
| **F-5.4** | **自訂規則** | 作為使用者，我希望能為特定網站自訂權重。 | 1\. 必須在設定面板中，提供「情境規則」編輯介面。<br>2\. 使用者可以新增自訂規則 (e.g., "mycompany.com": {bigram: 0.75, unigram: 0.25})。<br>3\. 自訂規則必須儲存在 chrome.storage.sync 中。 |
| **F-5.5** | **情境回饋 UI** | 作為使用者，我希望能看到當前的情境權重。 | 1\. 必須在候選字區域顯示「情境徽章」，例如「GitHub: 80/20」。<br>2\. 點擊徽章可以快速調整權重 (選擇預設 Preset：正式/口語/平衡)。 |

#### **範例：情境適應**

**情境**：使用者輸入「實作演算法」

**在 github.com (正式寫作)**：
```
contextWeights = {bigram: 0.8, unigram: 0.2}

候選 A: "實作" (formal)
  bigramProb = 0.30 (moderate structure)
  unigramProb = 0.05 (less common)
  finalScore = 0.8 * 0.30 + 0.2 * 0.05 = 0.25

候選 B: "實做" (colloquial)
  bigramProb = 0.25 (weaker structure)
  unigramProb = 0.08 (more common)
  finalScore = 0.8 * 0.25 + 0.2 * 0.08 = 0.216

結果: "實作" 勝出 (0.25 > 0.216) ✓ 正式用語
```

**在 ptt.cc (口語聊天)**：
```
contextWeights = {bigram: 0.6, unigram: 0.4}

候選 A: "實作"
  finalScore = 0.6 * 0.30 + 0.4 * 0.05 = 0.20

候選 B: "實做"
  finalScore = 0.6 * 0.25 + 0.4 * 0.08 = 0.182

結果: "實作" 仍勝出，但差距縮小
      (若 unigram 差異更大，"實做" 可能勝出)
```

### **8.5. 架構演進 (v2.7 → v3.0)**

#### **v2.7 架構 (當前)**

```
Content/UI → Viterbi.js → ngram_db.json (靜態模型)
```

#### **v3.0 架構 (目標)**

```
┌──────────────────────────────────────────────────────────┐
│              UI Layer (content.js / index.html)          │
│  ┌────────────────┐              ┌──────────────────┐   │
│  │ Character Mode │              │  Sentence Mode   │   │
│  │ (逐字模式)      │              │  (整句模式)       │   │
│  └────────┬───────┘              └────────┬─────────┘   │
└───────────┼──────────────────────────────┼──────────────┘
            │                              │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │   viterbi_module.js      │
            │   (Enhanced Scoring)     │
            └──────────────┬───────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
   ┌──────────────┐ ┌─────────────┐ ┌────────────┐
   │  UserDB.js   │ │ContextEngine│ │ngram_db.json│
   │  (F-4.0)     │ │   (F-5.0)   │ │  (Static)  │
   │              │ │             │ │            │
   │ - getWeights │ │ - getWeights│ │ - unigrams │
   │ - record     │ │ - setCustom │ │ - bigrams  │
   │ - learn      │ │             │ │ - smoothing│
   └──────┬───────┘ └─────────────┘ └────────────┘
          │
          ▼
   ┌──────────────┐
   │chrome.storage│
   │   .sync      │
   │  (Cloud DB)  │
   └──────────────┘
```

**關鍵改進**：
1. **統一評分**: 逐字與整句模式使用相同的增強評分函式
2. **模組化設計**: UserDB 與 ContextEngine 是獨立、可重用的模組
3. **雲端持久化**: 使用者偏好透過 chrome.storage.sync 跨裝置同步
4. **優雅降級**: 若模組失敗，回退至 v2.7 靜態模型
5. **漸進式增強**: 可以獨立啟用 F-4.0 與 F-5.0

### **8.6. 成功指標 (Success Metrics)**

**量化指標**：
* **準確率提升**: v2.7 基準 94.4% (17/18) → v3.0 目標 97% (18/18) (經過 10 次學習迭代後)
* **學習速度**: 1-2 次修正即可學會高信心偏好
* **情境效果**: 特定領域文本準確率提升 +3-5%

**質化指標**：
* 學習過程無感 (無需額外步驟)
* 情境適應自然 (無需手動切換)
* 回饋清晰 (「✓ 已學習：天氣 > 天真」)

**發布標準**：
* ✅ 100+ 測試通過 (單元 + 整合)
* ✅ 5+ 真實場景手動測試
* ✅ 文件完整 (README, 使用指南, 開發指南)
* ✅ 效能基準達成 (< 10ms 額外延遲)

### **8.7. 實作排程 (Implementation Schedule)**

#### 🆕 新策略：PWA POC 優先

**關鍵決策**：Feature 分支的首個交付產物將是 **PWA (Progressive Web App)** 作為概念驗證 (Proof-of-Concept)。

**儲存策略**：
- **PWA 階段 (Phase 0.5-1)**: IndexedDB (本地快取) + 手動匯出/匯入同步
- **Extension 階段 (Phase 4)**: chrome.storage.sync (雲端同步) + 自動同步

| 階段 | 時程 | 交付物 | 狀態 |
| :---- | :---- | :---- | :---- |
| **Phase 0: 基礎** | Week 1 | 設計文件 + PRD 更新 + Memory Bank 更新 | ✅ 完成 |
| **Phase 0.5: PWA POC** 🆕 | Week 2 | PWA + IndexedDB + 手動匯出/匯入 | ⏳ 下一步 |
| **Phase 1: F-4.0 增強** | Week 3 | 基於 PWA POC 的進階學習功能 + 25+ 測試 | ⏳ 待開始 |
| **Phase 2: F-5.0** | Week 4-5 | ContextEngine.js + 情境整合 + 30+ 測試 | ⏳ 待開始 |
| **Phase 3: MVP1 v12** | Week 6 | 整合至 MVP 1.0，版本 12.0.0 發布 | ⏳ 待開始 |
| **Phase 4: MVP2a v2.0** | Week 7-9 | 移植至 Chrome Extension (IndexedDB → chrome.storage.sync) | ⏳ 待開始 |

**總計時程**：9 週 (原 8 週 + PWA POC 1 週)

#### Phase 0.5 詳細規格 (PWA POC)

**目標**：驗證 F-4.0 核心概念，無需 Chrome Extension 複雜性

**核心功能**：
1. **Progressive Web App**
   - Service Worker 提供離線支援
   - 可安裝為獨立應用程式 (手機 + 桌面)
   - 響應式設計 (RWD)

2. **IndexedDB 本地快取**
   - 儲存 `user_ngram.db` (key-value pairs)
   - Schema: `{ prevChar, currChar, weight, lastUpdated }`
   - 非同步 API，不阻塞查詢

3. **手動匯出/匯入**
   - 匯出：下載 `user_ngram.json` (包含時間戳)
   - 匯入：上傳 JSON 檔案至另一台裝置
   - 格式：`{ "version": "1.0", "data": {...}, "exportDate": "..." }`

4. **N-gram 引擎整合**
   - 基於 v2.7 Hybrid 演算法 (OOP + 70/30 + Laplace)
   - UserDB 權重應用於候選字評分
   - 學習偵測：追蹤非預設選擇

5. **Mobile 自訂觸控鍵盤** 🆕
   - **問題解決**：系統鍵盤 (Gboard, iOS) 為 QWERTY 佈局，不適合大易輸入
   - **解決方案**：PWA 內建 HTML 自訂鍵盤
     - 完美複製大易鍵位配置 (~50 按鈕)
     - 固定於畫面底部 (`position: fixed; bottom: 0`)
     - 不遮擋文字編輯區 (無 reflow)
   - **統一邏輯**：Desktop 與 Mobile 共用同一套 N-gram 引擎
     - Desktop: `keydown` 事件 (實體鍵盤)
     - Mobile: `click`/`touchstart` 事件 (HTML 按鈕)
     - 兩者都呼叫 `viterbi.processInput(code)`
   - **阻擋系統鍵盤**：使用 `inputmode="none"` 防止 Gboard/iOS 鍵盤彈出
   - **觸控回饋**：
     - 震動回饋 (`navigator.vibrate(50)`)
     - 視覺回饋 (按鈕按下動畫)
     - 聲音回饋 (可選)
   - **RWD 響應式設計**：
     - Desktop: 自訂鍵盤隱藏 (`display: none`)
     - Mobile: 自訂鍵盤顯示 (`display: grid`)
     - 單一頁面，無需兩個版本

**成功標準**：
- ✅ PWA 可在手機/桌面安裝
- ✅ 使用者可學習偏好 (與 v2.7 相同行為)
- ✅ 匯出/匯入跨裝置運作
- ✅ 離線模式功能正常
- ✅ 效能：< 10ms 總額外延遲
- ✅ **Mobile**: 自訂大易鍵盤正常運作 (系統鍵盤被阻擋)
- ✅ **Mobile**: N-gram 預測結果與 Desktop 一致
- ✅ **Mobile**: 觸控回饋 (震動/視覺) 正常運作

**未來遷移路徑**：
- Phase 1: 增強 PWA 的完整 F-4.0 功能
- Phase 4: 將 IndexedDB 邏輯移植至 chrome.storage.sync (Extension)
- 自動同步：以雲端同步取代手動匯出/匯入

## **9\. 未來展望 (MVP 3.1+ 路線)**

MVP 3.0 的個人化學習與情境感知架構為我們解鎖了更多「超能力」：

* **MVP3.1+ (進階學習 - LoRA 啟發)：** 實現真正的 LoRA 風格自適應學習率、信心評分、自適應閾值。
* **MVP3.1+ (多語料庫情境)：** 針對不同情境載入特定領域的 N-gram 模型 (GitHub 載入程式碼語料，PTT 載入聊天語料)。
* **MVP3.1+ (協作學習)：** 選擇性分享匿名化的學習模式給所有使用者，使用差分隱私技術保護隱私。
* **MVP3.1+ (視覺化學習儀表板)：** 顯示「我學到的模式」頁面，使用 Heatmap 視覺化 bigram 權重，支援手動編輯、匯出/匯入。
