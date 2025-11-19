const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');

let browser;
let server;
const PORT = 8080;

async function setup() {
    // Start local server
    server = spawn('npx', ['http-server', '.', '-p', PORT.toString()], {
        cwd: path.join(__dirname, '..'),
        stdio: 'ignore'
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // Enable console logging from browser
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('dialog', async dialog => {
            console.log('DIALOG:', dialog.message());
            await dialog.dismiss();
        });
        await page.close();
    } catch (error) {
        console.error('\n\x1b[31mERROR: Failed to launch browser!\x1b[0m');
        console.error('This is likely due to missing system dependencies in WSL.');
        console.error('Please run the installation script:\n');
        console.error('  \x1b[33m./install-deps.sh\x1b[0m\n');
        console.error('Original error:', error.message);
        if (server) server.kill();
        process.exit(1);
    }

    return browser;
}

async function teardown() {
    if (browser) await browser.close();
    if (server) server.kill();
}

module.exports = { setup, teardown, PORT };
