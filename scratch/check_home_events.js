const fs = require('fs');

const html = fs.readFileSync('home.html', 'utf8');

// Search for event section in home.html
const eventSec = html.match(/<section[^>]*event[^>]*>[\s\S]*?<\/section>/i);
if (eventSec) {
    console.log('--- EVENT SECTION IN HOME.HTML ---');
    const links = eventSec[0].match(/<a\s+[^>]*href="[^"]*"[^>]*>[\s\S]*?<\/a>/gi) || [];
    links.forEach(l => console.log(l));
} else {
    // search for event-wrapper-2
    const wrapper = html.match(/class="[^"]*event-wrapper-2[^"]*"[\s\S]*?<\/section>/i);
    console.log('Wrapper match:', !!wrapper);
    if (wrapper) {
        const links = wrapper[0].match(/<a\s+[^>]*href="[^"]*"[^>]*>[\s\S]*?<\/a>/gi) || [];
        links.forEach(l => console.log(l));
    }
}
