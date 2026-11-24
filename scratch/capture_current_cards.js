const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

async function run() {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9241',
        '--no-sandbox',
        '--disable-gpu',
        '--user-data-dir=' + path.join(__dirname, 'cdp_prof_layout')
    ]);

    let version = null;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 300));
        try {
            version = await new Promise((res, rej) => {
                http.get('http://127.0.0.1:9241/json/version', r => {
                    let d = '';
                    r.on('data', c => d += c);
                    r.on('end', () => res(JSON.parse(d)));
                }).on('error', rej);
            });
            if (version) break;
        } catch (e) {}
    }

    const targets = await new Promise((res, rej) => {
        http.get('http://127.0.0.1:9241/json/list', r => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => res(JSON.parse(d)));
        }).on('error', rej);
    });

    const pageWs = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
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

    const fileUrl = 'file:///' + path.resolve('event.html').replace(/\\/g, '/');
    await pSend('Page.enable');
    await pSend('DOM.enable');

    // 1440px desktop
    await pSend('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await pSend('Page.navigate', { url: fileUrl });
    await new Promise(r => setTimeout(r, 1200));

    const clip1 = (await pSend('Runtime.evaluate', {
        expression: `(() => { const r = document.querySelector('.event-list-items').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`,
        returnByValue: true
    })).result.value;
    const shot1 = await pSend('Page.captureScreenshot', { clip: { x: clip1.x, y: clip1.y, width: clip1.width, height: clip1.height, scale: 1 } });
    fs.writeFileSync('scratch/current_desktop_card.png', Buffer.from(shot1.data, 'base64'));

    // 768px tablet
    await pSend('Emulation.setDeviceMetricsOverride', { width: 768, height: 900, deviceScaleFactor: 1, mobile: true });
    await pSend('Page.navigate', { url: fileUrl });
    await new Promise(r => setTimeout(r, 1200));

    const clip2 = (await pSend('Runtime.evaluate', {
        expression: `(() => { const r = document.querySelector('.event-list-items').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`,
        returnByValue: true
    })).result.value;
    const shot2 = await pSend('Page.captureScreenshot', { clip: { x: clip2.x, y: clip2.y, width: clip2.width, height: clip2.height, scale: 1 } });
    fs.writeFileSync('scratch/current_tablet_card.png', Buffer.from(shot2.data, 'base64'));

    // 375px mobile
    await pSend('Emulation.setDeviceMetricsOverride', { width: 375, height: 800, deviceScaleFactor: 2, mobile: true });
    await pSend('Page.navigate', { url: fileUrl });
    await new Promise(r => setTimeout(r, 1200));

    const clip3 = (await pSend('Runtime.evaluate', {
        expression: `(() => { const r = document.querySelector('.event-list-items').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`,
        returnByValue: true
    })).result.value;
    const shot3 = await pSend('Page.captureScreenshot', { clip: { x: clip3.x, y: clip3.y, width: clip3.width, height: clip3.height, scale: 1 } });
    fs.writeFileSync('scratch/current_mobile_card.png', Buffer.from(shot3.data, 'base64'));

    console.log('Screenshots captured successfully');
    chrome.kill();
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
