const fs = require('fs');

const html = fs.readFileSync('home.html', 'utf8');

// Find offcanvas section
const offcanvasMatch = html.match(/<div class="offcanvas__menu"[\s\S]*?<\/div>/);
console.log('--- OFFCANVAS MENU IN HOME.HTML ---');
console.log(offcanvasMatch ? offcanvasMatch[0].slice(0, 500) : 'NOT FOUND');

// Find header menu
const headerMatch = html.match(/<div class="header-menu"[\s\S]*?<\/div>/);
console.log('--- HEADER MENU IN HOME.HTML ---');
console.log(headerMatch ? headerMatch[0].slice(0, 500) : 'NOT FOUND');

// Find footer
const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/);
console.log('--- FOOTER LINKS IN HOME.HTML ---');
const footerLinks = (footerMatch ? footerMatch[0] : '').match(/<a [^>]*href="[^"]*"[^>]*>[^<]*<\/a>/g);
console.log(footerLinks);
