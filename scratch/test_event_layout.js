const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

async function main() {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9244',
        '--no-sandbox',
        '--disable-gpu',
        '--user-data-dir=' + path.join(__dirname, 'cdp_prof_event')
    ]);

    // Retry connection up to 30 times (each 300ms)
    let versionData = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 300));
        try {
            versionData = await new Promise((res, rej) => {
                const req = http.get('http://127.0.0.1:9244/json/version', r => {
                    let d = '';
                    r.on('data', c => d += c);
                    r.on('end', () => res(JSON.parse(d)));
                });
                req.on('error', rej);
            });
            if (versionData) break;
        } catch (e) {}
    }

    if (!versionData) {
        console.error('Failed to connect to Chrome CDP');
        chrome.kill();
        process.exit(1);
    }

    const targets = await new Promise((res, rej) => {
        http.get('http://127.0.0.1:9244/json/list', r => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => res(JSON.parse(d)));
        }).on('error', rej);
    });

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => { ws.onopen = r; });

    let id = 1;
    function send(method, params = {}) {
        return new Promise((resolve) => {
            const msgId = id++;
            const listener = (event) => {
                const res = JSON.parse(event.data);
                if (res.id === msgId) {
                    ws.removeEventListener('message', listener);
                    resolve(res.result);
                }
            };
            ws.addEventListener('message', listener);
            ws.send(JSON.stringify({ id: msgId, method, params }));
        });
    }

    const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'event.html').replace(/\\/g, '/');
    await send('Page.enable');
    await send('Runtime.enable');

    const viewports = [
        { name: 'desktop_1440', width: 1440, height: 900, mobile: false },
        { name: 'laptop_1024', width: 1024, height: 800, mobile: false },
        { name: 'tablet_768', width: 768, height: 1024, mobile: false },
        { name: 'mobile_375', width: 375, height: 812, mobile: true }
    ];

    for (const vp of viewports) {
        await send('Emulation.setDeviceMetricsOverride', {
            width: vp.width,
            height: vp.height,
            deviceScaleFactor: 1,
            mobile: vp.mobile
        });
        await send('Page.navigate', { url: fileUrl });
        await new Promise(r => setTimeout(r, 1200));

        // Evaluate layout metrics
        const evalRes = await send('Runtime.evaluate', {
            expression: `(() => {
                const card = document.querySelector('.event-list-items');
                if (!card) return { error: 'no card' };
                const rect = card.getBoundingClientRect();
                const date = card.querySelector('.date').getBoundingClientRect();
                const title = card.querySelector('.title-text').getBoundingClientRect();
                const img = card.querySelector('.event-image').getBoundingClientRect();
                const scrollWidth = document.documentElement.scrollWidth;
                const clientWidth = document.documentElement.clientWidth;
                return {
                    scrollWidth,
                    clientWidth,
                    overflow: scrollWidth > clientWidth,
                    card: { width: Math.round(rect.width), height: Math.round(rect.height) },
                    date: { top: Math.round(date.top), left: Math.round(date.left), width: Math.round(date.width), height: Math.round(date.height) },
                    title: { top: Math.round(title.top), left: Math.round(title.left), width: Math.round(title.width) },
                    img: { top: Math.round(img.top), left: Math.round(img.left), width: Math.round(img.width), height: Math.round(img.height) }
                };
            })()`,
            returnByValue: true
        });

        console.log(`=== Viewport: ${vp.name} ===`, JSON.stringify(evalRes.value));

        const shot = await send('Page.captureScreenshot', { captureBeyondViewport: false });
        fs.writeFileSync(path.join(__dirname, `event_${vp.name}.png`), Buffer.from(shot.data, 'base64'));
    }

    ws.close();
    chrome.kill();
    console.log('Done!');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
