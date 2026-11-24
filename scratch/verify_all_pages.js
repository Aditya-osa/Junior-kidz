const fs = require('fs');

const pages = [
    'home.html',
    'about.html',
    'contact.html',
    'courses.html',
    'event.html',
    'franchise.html',
    'gallery.html',
    'news-details.html',
    'nursery-teacher-training.html',
    '404.html'
];

pages.forEach(p => {
    const html = fs.readFileSync(p, 'utf8');
    const navs = html.match(/<nav[\s\S]*?<\/nav>/g) || [];
    const offcanvasLinks = (navs[0] || '').match(/href="([^"]*)"/g) || [];
    const headerLinks = (navs[1] || '').match(/href="([^"]*)"/g) || [];

    const footer = (html.match(/<footer[\s\S]*?<\/footer>/) || [''])[0];
    const footerLinks = footer.match(/href="([^"]*)"/g) || [];

    console.log(`=== ${p} ===`);
    console.log('  Offcanvas:', offcanvasLinks.join(', '));
    console.log('  Header:   ', headerLinks.join(', '));
    console.log('  Footer:   ', footerLinks.filter(l => l.includes('.html')).join(', '));
});
