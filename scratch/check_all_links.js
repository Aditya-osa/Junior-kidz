const fs = require('fs');

const files = [
    '404.html',
    'about.html',
    'contact.html',
    'courses.html',
    'event.html',
    'faq.html',
    'franchise.html',
    'gallery.html',
    'home.html',
    'news-details.html',
    'nursery-teacher-training.html'
];

files.forEach(f => {
    const html = fs.readFileSync(f, 'utf8');
    const navs = html.match(/<nav[\s\S]*?<\/nav>/g) || [];
    const offcanvasNav = navs[0] || '';
    const headerNav = navs[1] || '';
    const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/);
    const footer = footerMatch ? footerMatch[0] : '';

    console.log(
        f.padEnd(30),
        'NavCount:', navs.length,
        '| OffcanvasEvent:', offcanvasNav.includes('event.html') ? 'YES' : 'NO ',
        '| HeaderEvent:', headerNav.includes('event.html') ? 'YES' : 'NO ',
        '| FooterEvent:', footer.includes('event.html') ? 'YES' : 'NO '
    );
});
