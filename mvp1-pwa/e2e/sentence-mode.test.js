const { setup, teardown, PORT } = require('./setup');
const assert = require('assert');

describe('Sentence Mode', function () {
    let browser;
    let page;

    before(async function () {
        browser = await setup();
        page = await browser.newPage();

        // Enable logs and dialog handling
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('dialog', async dialog => {
            console.log('DIALOG:', dialog.message());
            await dialog.dismiss();
        });
    });

    after(async function () {
        await teardown();
    });

    it('should switch to sentence mode', async function () {
        await page.goto(`http://localhost:${PORT}`);

        // Click sentence mode button
        await page.click('#sentence-mode-btn');

        // Verify sentence panel is visible
        await page.waitForSelector('#sentence-mode-panel', { visible: true });
        const panelVisible = await page.$eval('#sentence-mode-panel', el => !el.classList.contains('hidden'));
        assert(panelVisible);
    });

    it('should predict sentence for "x a"', async function () {
        this.timeout(60000); // Increase timeout for N-gram loading

        // Type 'x' (水) and 'a' (日)
        await page.focus('#input-box');
        await page.keyboard.type('xa');

        // Wait for buffer to update (check for badges)
        await page.waitForSelector('.buffered-code-badge');

        // Click predict button instead of key press
        await page.click('#predict-sentence-btn');

        // Wait for prediction result (char-span) - wait longer for first load
        await page.waitForSelector('.char-span', { timeout: 30000 });

        // Verify result contains '水' or '日' (or whatever prediction comes up)
        // We just check if prediction happened and spans are clickable
        const chars = await page.$$eval('.char-span', els => els.map(el => el.textContent));
        assert(chars.length > 0);
        console.log('Predicted chars:', chars);
    });

    it('should open candidate modal when clicking character', async function () {
        // Click on the first character span
        await page.click('.char-span');

        // Wait for modal
        await page.waitForSelector('#candidate-modal', { visible: true });

        // Verify modal is visible
        const modalVisible = await page.$eval('#candidate-modal', el => !el.classList.contains('hidden'));
        assert(modalVisible);
    });
});
