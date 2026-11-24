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

    // 1. Offcanvas mobile menu
    const offcanvasMatch = html.match(/<div class="offcanvas__menu[\s\S]*?<\/div>/);
    const offcanvasHasEvent = offcanvasMatch ? offcanvasMatch[0].includes('event.html') : false;

    // 2. Desktop main header nav
    const headerMatch = html.match(/<div class="header-menu[\s\S]*?<\/nav>/);
    const headerHasEvent = headerMatch ? headerMatch[0].includes('event.html') : false;

    // 3. Footer area
    const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/);
    const footerHasEvent = footerMatch ? footerMatch[0].includes('event.html') : false;

    console.log(`${f.padEnd(30)} | Offcanvas: ${offcanvasHasEvent ? 'YES' : 'NO '} | Header: ${headerHasEvent ? 'YES' : 'NO '} | Footer: ${footerHasEvent ? 'YES' : 'NO '}`);
});
