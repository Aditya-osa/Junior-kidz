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
    // Search for any occurrence of text "Events" or "Event" in links
    const matches = html.match(/<a[^>]*>[^<]*Event[^<]*<\/a>/gi) || [];
    console.log(`=== ${p} ===`);
    matches.forEach(m => console.log('  ', m.replace(/\s+/g, ' ')));
});
