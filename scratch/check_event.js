const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

async function run() {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const chrome = spawn(chromePath, [
        '--headless=new',
        '--remote-debugging-port=9232',
        '--no-sandbox',
        '--disable-gpu',
        '--user-data-dir=' + path.join(__dirname, 'cdp_prof_event')
    ]);

    let version = null;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 300));
        try {
            version = await new Promise((resolve, reject) => {
                http.get('http://127.0.0.1:9232/json/version', res => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(JSON.parse(data)));
                }).on('error', reject);
            });
            if (version) break;
        } catch (e) {}
    }

    if (!version) {
        console.error('Failed to connect to chrome');
        chrome.kill();
        process.exit(1);
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

    const targets = await getJson('http://127.0.0.1:9232/json/list');
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

    const viewports = [360, 375, 480, 768, 1024, 1440];
    const results = [];
    for (const w of viewports) {
        await pSend('Emulation.setDeviceMetricsOverride', {
            width: w,
            height: 800,
            deviceScaleFactor: 1,
            mobile: w < 992
        });
        await pSend('Page.navigate', { url: fileUrl });
        await new Promise(r => setTimeout(r, 1200));

        const res = await pSend('Runtime.evaluate', {
            expression: `(() => {
                const firstContent = document.querySelector('.event-wrapper-2 .event-right-items .event-list-items .event-content .content');
                if (!firstContent) return { error: 'content not found' };
                const date = firstContent.querySelector('.date');
                const title = firstContent.querySelector('.title-text');
                const dRect = date.getBoundingClientRect();
                const tRect = title.getBoundingClientRect();
                const h2 = date.querySelector('h2');
                const h2FontSize = window.getComputedStyle(h2).fontSize;
                const datePadding = window.getComputedStyle(date).padding;
                // isSingleRow means date is to the left of title and their vertical spans overlap
                const isSingleRow = (dRect.right <= tRect.left + 25) && (dRect.bottom > tRect.top);
                return {
                    viewport: ${w},
                    isSingleRow,
                    dateWidth: Math.round(dRect.width),
                    dateHeight: Math.round(dRect.height),
                    titleWidth: Math.round(tRect.width),
                    h2FontSize,
                    datePadding,
                    scrollWidth: document.documentElement.scrollWidth,
                    windowWidth: window.innerWidth
                };
            })()`,
            returnByValue: true
        });
        results.push(res.result.value);
    }

    console.log(JSON.stringify(results, null, 2));

    chrome.kill();
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
