const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9235;

async function run() {
    const chrome = spawn(CHROME_PATH, [
        --remote-debugging-port=,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--user-data-dir=' + path.resolve(__dirname, 'chrome_tmp')
    ]);

    // Wait for Chrome to be ready
    let versionData;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        try {
            const res = await fetch(http://127.0.0.1:/json/version);
            if (res.ok) {
                versionData = await res.json();
                break;
            }
        } catch (e) {}
    }

    if (!versionData) {
        console.error('Failed to connect to Chrome');
        chrome.kill();
        process.exit(1);
    }

    const WebSocket = require('ws') || null;
    // Let's use simple CDP via fetch or puppeteer if available
    console.log('Chrome ready, webSocketDebuggerUrl:', versionData.webSocketDebuggerUrl);
    chrome.kill();
}
run();