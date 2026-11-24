const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

async function run() {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const chrome = spawn(chromePath, [
        '--headless=new',
        '--remote-debugging-port=9233',
        '--no-sandbox',
        '--disable-gpu',
        '--user-data-dir=' + path.join(__dirname, 'cdp_prof_event_shot')
    ]);

    let version = null;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 300));
        try {
            version = await new Promise((resolve, reject) => {
                http.get('http://127.0.0.1:9233/json/version', res => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(JSON.parse(data)));
                }).on('error', reject);
            });
            if (version) break;
        } catch (e) {}
    }

    function getJson(url) {
        return new Promise((resolve, reject) => {
            http.get(url, res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });
    }

    const targets = await getJson('http://127.0.0.1:9233/json/list');
    const pageTarget = targets.find(t => t.type === 'page');
    const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => { pageWs.onopen = r; });

    let pId = 1;
    function pSend(method, params = {}) {
        return new Promise((resolve) => {
            const msgId = pId++;
            const listener = (event) => {
                const res = JSON.parse(event.data);
                if (res.id === msgId) {
                    pageWs.removeEventListener('message', listener);
                    resolve(res.result);
                }
            };
            pageWs.addEventListener('message', listener);
            pageWs.send(JSON.stringify({ id: msgId, method, params }));
        });
    }

    const fileUrl = 'file:///' + path.resolve('home.html').replace(/\\/g, '/');
    await pSend('Page.enable');
    await pSend('DOM.enable');

    await pSend('Emulation.setDeviceMetricsOverride', {
        width: 375,
        height: 750,
        deviceScaleFactor: 2,
        mobile: true
    });
    await pSend('Page.navigate', { url: fileUrl });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll to event section
    await pSend('Runtime.evaluate', {
        expression: `(() => {
            const el = document.querySelector('.event-wrapper-2');
            if (el) el.scrollIntoView({ block: 'center' });
        })()`
    });
    await new Promise(r => setTimeout(r, 500));

    const clipRes = await pSend('Runtime.evaluate', {
        expression: `(() => {
            const el = document.querySelector('.event-wrapper-2 .event-right-items .event-list-items');
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
        })()`,
        returnByValue: true
    });
    const clip = clipRes.result.value;
    const shot = await pSend('Page.captureScreenshot', {
        clip: { x: Math.max(0, clip.x), y: Math.max(0, clip.y), width: clip.width, height: clip.height, scale: 1 }
    });
    fs.writeFileSync('scratch/event_mobile_screenshot.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot successfully');

    chrome.kill();
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
