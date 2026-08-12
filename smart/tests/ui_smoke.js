// /smart/ UI 煙霧測試(真瀏覽器)— Lite 對齊版 UX
const path = require('path');
// 需要 playwright(不進 repo 相依):npm i -D playwright,或
//   node --experimental-... 皆可;找不到就跳過(CI 無瀏覽器時不擋)
let chromium;
try { chromium = require('playwright').chromium; }
catch (e) { console.log('SKIP: playwright 未安裝(npm i playwright 後可跑瀏覽器煙霧測試)'); process.exit(0); }
const http = require('http');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  });
});

(async () => {
  await new Promise(r => server.listen(8931, r));
  const launchOpts = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
  const browser = await chromium.launch(launchOpts);
  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  let pass = 0, fail = 0;
  const t = (name, cond, detail) => {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + '  ' + (detail || '')); }
  };

  await page.goto('http://localhost:8931/smart/index.html');
  await page.waitForFunction(() => document.getElementById('status-indicator').textContent.startsWith('就緒'), { timeout: 30000 });
  t('資料載入就緒', true);

  const type = async keys => { for (const k of keys) await page.keyboard.press(k === ' ' ? 'Space' : k); };
  const composeText = () => page.$$eval('#compose-area .cell .ch', els => els.map(e => e.textContent).join(''));
  const outText = () => page.$eval('#output-buffer', e => e.value);

  const tokensOf = await page.evaluate(async () => {
    const r = await fetch('data/dayi_db.json'); const d = await r.json();
    const full = {};
    for (const code in d) for (const c of d[code]) {
      if (!full[c.char] || code.length > full[c.char].length) full[c.char] = code;
    }
    const tok = ch => full[ch].length === 1 ? full[ch] : full[ch][0] + full[ch][full[ch].length - 1];
    return ['今天天氣很好', '你吃飯了嗎', '火車快要出發了', '昨天查不到資料'].map(s => [...s].map(tok));
  });
  const typeSentence = async toks => { for (const tk of toks) await type(tk.length === 1 ? tk + ' ' : tk); };

  // 1. 解碼
  await typeSentence(tokensOf[0]);
  t('解碼 今天天氣很好', (await composeText()) === '今天天氣很好', await composeText());

  // 2. Enter 送出 + 自動複製(預設 ON)
  await page.keyboard.press('Enter');
  t('送出到輸出區', (await outText()) === '今天天氣很好', await outText());
  t('送出後緩衝區清空', (await composeText()) === '', await composeText());
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  t('送出後自動複製到剪貼簿', clip === '今天天氣很好', clip);

  // 3. 單碼字 + 空白送出(無待配對碼時 Space = 送出)
  await typeSentence(tokensOf[2]);
  t('單碼字句 火車快要出發了', (await composeText()) === '火車快要出發了', await composeText());
  await page.keyboard.press('Space');
  await page.waitForTimeout(60);
  t('單擊空白不送出(斷字)', !(await outText()).endsWith('火車快要出發了'), await outText());
  await page.keyboard.press('Space');
  await page.waitForTimeout(80);
  t('連按兩下空白 = 送出', (await outText()).endsWith('火車快要出發了'), await outText());

  // 4. 候選列預設對準「剛打的字」+ 傳統選字鍵 ' 換第 2 候選
  await typeSentence(tokensOf[3]);
  t('解碼 昨天查不到資料', (await composeText()) === '昨天查不到資料', await composeText());
  const candsNow = await page.$$eval('#candidate-bar .cand', els => els.map(e => e.lastChild.textContent));
  t('候選列自動列出最後一字候選', candsNow.length > 0, JSON.stringify(candsNow));
  const labels = await page.$$eval('#candidate-bar .cand .num', els => els.map(e => e.textContent));
  t("選字鍵標示為 ␣ ' [ ] - \\", labels.slice(0, 3).join('') === "␣'[", JSON.stringify(labels));
  await page.keyboard.press("'");
  await page.waitForTimeout(80);
  const afterQuote = await composeText();
  t("' 鍵替換最後一字為第 2 候選", afterQuote.slice(-1) === candsNow[1], `${afterQuote} vs ${candsNow[1]}`);
  const pinned = await page.$$eval('#compose-area .cell.pinned', els => els.length);
  t('替換後鎖定(綠線)', pinned === 1, String(pinned));

  // 5. 數字鍵是大易碼不是選字鍵
  const before = await composeText();
  await page.keyboard.press('1');
  await page.waitForTimeout(50);
  const pendingKeys = await page.$$eval('#compose-area .cell.pending .keys', e => e.map(x => x.textContent));
  t('數字鍵當大易碼(進入待配對)', pendingKeys.length === 1, JSON.stringify(pendingKeys));
  await page.keyboard.press('Backspace');
  t('退格取消待配對碼', (await composeText()) === before, await composeText());
  for (let i = 0; i < 10; i++) await page.keyboard.press('Backspace');

  // 6. 全碼逃生口
  await page.keyboard.press('`');
  t('backtick 進入全碼模式', (await page.$eval('#mode-chip', e => e.textContent)) === '全碼逃生口');
  await type('o2c');
  await page.waitForTimeout(80);
  const fcCands = await page.$$eval('#candidate-bar .cand', els => els.map(e => e.lastChild.textContent));
  t('全碼候選含 吃', fcCands.includes('吃'), JSON.stringify(fcCands));
  await page.keyboard.press('Space');
  await page.waitForTimeout(80);
  t('全碼 Space 選第 1 個並鎖定', (await composeText()) === '吃', await composeText());
  await page.keyboard.press('Backspace');

  // 7. 換頁鍵 =
  await type('ao');
  await page.waitForTimeout(80);
  const pg = await page.$eval('#candidate-bar .cand-page', e => e.textContent).catch(() => null);
  t('多候選時顯示換頁資訊', !!pg, String(pg));
  if (pg) {
    const p1 = await page.$$eval('#candidate-bar .cand', els => els.map(e => e.lastChild.textContent));
    await page.keyboard.press('=');
    await page.waitForTimeout(60);
    const p2 = await page.$$eval('#candidate-bar .cand', els => els.map(e => e.lastChild.textContent));
    t('= 鍵換頁', JSON.stringify(p1) !== JSON.stringify(p2), JSON.stringify([p1, p2]));
  }
  for (let i = 0; i < 4; i++) await page.keyboard.press('Backspace');

  // 8. Mini 模式(IME 兩列)
  await page.click('#menu-fab');
  await page.click('#toggle-mini');
  await page.waitForTimeout(120);
  t('Mini 模式啟用', await page.$eval('#mini-ui', e => !e.classList.contains('hidden')));
  t('Mini 模式隱藏主 UI', await page.$eval('.app-container', e => getComputedStyle(e).display === 'none'));
  await typeSentence(tokensOf[1]);
  const miniCompose = await page.$$eval('#mini-compose .cell .ch', els => els.map(e => e.textContent).join(''));
  t('Mini 緩衝區顯示解碼結果', miniCompose === '你吃飯了嗎', miniCompose);
  const miniCands = await page.$$eval('#mini-cands .cand', els => els.length);
  t('Mini 候選列有候選', miniCands > 0, String(miniCands));
  await page.keyboard.press('Enter');
  const miniOut = await page.$eval('#mini-output', e => e.value);
  t('Mini 輸出列同步', miniOut.endsWith('你吃飯了嗎'), miniOut);
  t('Mini 模式沒有虛擬鍵盤(比照 Lite)', await page.$eval('#mini-ui', e => !e.querySelector('.vk')));
  const dragGeom = await page.$eval('.mini-drag-region', e => {
    const r = e.getBoundingClientRect(), bar = e.parentElement.getBoundingClientRect();
    return { covers: Math.round(r.width) >= Math.round(bar.width) - 1 && Math.round(r.height) >= Math.round(bar.height) - 1,
             region: getComputedStyle(e).webkitAppRegion || getComputedStyle(e).getPropertyValue('-webkit-app-region') };
  });
  t('Mini 有桌面 PWA 拖曳區(覆蓋整條標題列)', dragGeom.covers, JSON.stringify(dragGeom));
  await page.screenshot({ path: path.join(__dirname, 'screenshot-mini.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  t('Escape 離開 Mini 模式', await page.$eval('#mini-ui', e => e.classList.contains('hidden')));

  // 8b. Ctrl 熱鍵:單擊複製、連按兩下切換 Mini 模式(與 Lite 相同)
  await page.evaluate(() => navigator.clipboard.writeText('__reset__'));
  await page.keyboard.press('Control');
  await page.waitForTimeout(120);
  const ctrlClip = await page.evaluate(() => navigator.clipboard.readText());
  t('單擊 Ctrl 複製輸出', ctrlClip === (await outText()), ctrlClip);
  await page.waitForTimeout(600);   // 超過 double-tap 視窗,確保下一組是全新的
  await page.keyboard.press('Control');
  await page.keyboard.press('Control');
  await page.waitForTimeout(150);
  t('連按兩下 Ctrl 進入 Mini 模式', await page.$eval('#mini-ui', e => !e.classList.contains('hidden')));
  await page.keyboard.press('Control');
  await page.keyboard.press('Control');
  await page.waitForTimeout(150);
  t('Mini 模式內連按兩下 Ctrl 切回主 UI', await page.$eval('#mini-ui', e => e.classList.contains('hidden')));
  await page.waitForTimeout(600);
  await page.keyboard.press('Control');
  await page.waitForTimeout(400);
  t('單擊 Ctrl 不會誤觸 Mini 模式', await page.$eval('#mini-ui', e => e.classList.contains('hidden')));

  // 8c. 地球鍵:中 / 英數 切換(Lite 規格,不可移除)
  const globeSel = '.vk-row:last-child .vk-key:first-child';
  t('鍵盤保留地球鍵', (await page.$eval(globeSel, e => e.textContent)).includes('🌐'));
  const outBefore = await outText();
  await page.click(globeSel);
  await page.waitForTimeout(80);
  t('切換到英數模式', (await page.$eval('#mode-chip', e => e.textContent)) === '英數 EN');
  await type('abc');
  await page.keyboard.press('Space');
  await page.waitForTimeout(60);
  t('英數模式直接輸出字母', (await outText()) === outBefore + 'abc ', JSON.stringify(await outText()));
  await page.keyboard.press('Backspace');
  t('英數模式退格刪字元', (await outText()) === outBefore + 'abc', await outText());
  await page.click(globeSel);
  await page.waitForTimeout(80);
  t('切回大易模式', (await page.$eval('#mode-chip', e => e.textContent)) === '智慧 2 碼');

  // 8d. Alt 熱鍵:單擊送出、連按兩下清除緩衝區
  await typeSentence(tokensOf[0]);
  t('Alt 前緩衝區有字', (await composeText()).length > 0);
  await page.keyboard.press('Alt');
  await page.waitForTimeout(100);
  t('單擊 Alt 送出緩衝區', (await outText()).endsWith('今天天氣很好'), await outText());
  await typeSentence(tokensOf[0]);
  await page.keyboard.press('Alt');
  await page.keyboard.press('Alt');
  await page.waitForTimeout(120);
  t('連按兩下 Alt 清除緩衝區', (await composeText()) === '', await composeText());

  // 9. 設定持久化
  await page.click('#menu-fab');
  await page.click('#toggle-autocopy');
  await page.waitForTimeout(50);
  const savedOff = await page.evaluate(() => JSON.parse(localStorage.getItem('webdayi_smart_settings')).autoCopy);
  t('自動複製可關閉並存檔', savedOff === false, String(savedOff));
  await page.reload();
  await page.waitForFunction(() => document.getElementById('status-indicator').textContent.startsWith('就緒'), { timeout: 30000 });
  const restored = await page.$eval('#toggle-autocopy .toggle-status', e => e.textContent);
  t('重載後設定還原', restored === 'OFF', restored);

  // 10. 手機視窗:不需捲動就能看到緩衝區與鍵盤
  const mobile = await ctx.newPage();
  await mobile.setViewportSize({ width: 390, height: 664 });
  await mobile.goto('http://localhost:8931/smart/index.html');
  await mobile.waitForFunction(() => document.getElementById('status-indicator').textContent.startsWith('就緒'), { timeout: 30000 });
  const fits = await mobile.evaluate(() => {
    const kb = document.getElementById('virtual-keyboard').getBoundingClientRect();
    return { bottom: Math.round(kb.bottom), vh: window.innerHeight, scroll: document.body.scrollHeight > window.innerHeight + 2 };
  });
  t(`手機版鍵盤在首屏內(${fits.bottom}/${fits.vh})`, fits.bottom <= fits.vh, JSON.stringify(fits));
  t('手機版首屏無垂直捲動', !fits.scroll, JSON.stringify(fits));

  // 10b. 鍵盤幾何(比照 Lite):貼底、滿版、按鍵撐滿整列
  const kbGeom = await mobile.evaluate(() => {
    const kc = document.querySelector('.keyboard-container').getBoundingClientRect();
    const row = document.querySelector('.vk-row').getBoundingClientRect();
    const keys = [...document.querySelectorAll('.vk-row')].map(r =>
        [...r.children].map(k => k.getBoundingClientRect()));
    const first = keys[0][0], last = keys[0][keys[0].length - 1];
    return {
      vw: window.innerWidth, vh: window.innerHeight,
      kcLeft: Math.round(kc.left), kcRight: Math.round(kc.right),
      gapBelow: Math.round(window.innerHeight - kc.bottom),
      rowSpan: Math.round(last.right - first.left), rowWidth: Math.round(row.width),
      keyH: Math.round(first.height),
    };
  });
  t('鍵盤滿版(左右不留白)', kbGeom.kcLeft <= 1 && kbGeom.kcRight >= kbGeom.vw - 1, JSON.stringify(kbGeom));
  t('鍵盤貼底(下方僅狀態列)', kbGeom.gapBelow <= 26, JSON.stringify(kbGeom));
  t('按鍵撐滿整列', kbGeom.rowSpan >= kbGeom.rowWidth - 2, JSON.stringify(kbGeom));
  t('按鍵高度可觸控(≥42px)', kbGeom.keyH >= 42, JSON.stringify(kbGeom));

  // 10c. PWA:manifest 可取得且欄位正確
  const mf = await mobile.evaluate(async () => {
    const href = document.querySelector('link[rel=manifest]').getAttribute('href');
    const r = await fetch(href);
    return r.ok ? await r.json() : null;
  });
  t('manifest.json 可載入', !!mf, JSON.stringify(mf));
  t('manifest 為 standalone(可裝成 PWA)', mf && mf.display === 'standalone', mf && mf.display);
  t('manifest 有圖示', mf && Array.isArray(mf.icons) && mf.icons.length > 0);
  await mobile.screenshot({ path: path.join(__dirname, 'screenshot-mobile.png') });

  t('無 page error / console error', errors.length === 0, errors.join(' | '));

  await page.screenshot({ path: path.join(__dirname, 'screenshot-ui.png'), fullPage: true });
  await browser.close();
  server.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
