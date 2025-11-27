const { setup, teardown, PORT } = require('./setup');
const assert = require('assert');

describe('Basic Flow', function () {
    let browser;
    let page;

    before(async function () {
        browser = await setup();
        page = await browser.newPage();
    });

    after(async function () {
        await teardown();
    });

    it('should load the app and show correct title', async function () {
        await page.goto(`http://localhost:${PORT}`);
        const title = await page.title();
        assert.strictEqual(title, 'WebDaYi PWA (網頁大易輸入法) - Phase 0.5 POC');
    });

    it('should show candidates when typing "x"', async function () {
        // Focus input
        await page.focus('#input-box');

        // Type 'x'
        await page.keyboard.type('x');

        // Wait for candidates
        await page.waitForSelector('.candidate-item');

        // Check first candidate
        const firstCandidate = await page.$eval('.candidate-item', el => el.textContent);
        assert(firstCandidate.includes('水'));
    });

    it('should output character when selecting candidate 1', async function () {
        // Select first candidate (press Space)
        // Note: This implementation uses Space for 1st candidate
        await page.keyboard.press(' ');

        // Wait for output to update
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check output buffer (textarea uses value property)
        const output = await page.$eval('#output-buffer', el => el.value);
        assert.strictEqual(output, '水');
    });
});
