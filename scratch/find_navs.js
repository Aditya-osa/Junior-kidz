const fs = require('fs');

const files = ['home.html', 'event.html', 'about.html', 'faq.html'];

files.forEach(f => {
    const html = fs.readFileSync(f, 'utf8');
    console.log('====================================');
    console.log('FILE:', f);
    const navMatches = html.match(/<nav[\s\S]*?<\/nav>/g);
    if (navMatches) {
        navMatches.forEach((m, i) => {
            console.log(`--- NAV ${i} ---`);
            const links = m.match(/<a\s+href="[^"]*"[^>]*>[\s\S]*?<\/a>/g) || [];
            links.forEach(l => {
                const href = l.match(/href="([^"]*)"/)?.[1];
                const text = l.replace(/<[^>]*>/g, '').trim();
                console.log(`  href="${href}" | text="${text}"`);
            });
        });
    }
});
