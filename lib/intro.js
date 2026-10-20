const fs = require('fs');
const path = require('path');

// MALIK-MD intro voice note — repo ke andar base64 mein mehfooz hai
// (src/intro.b64). Koi external host/link nahi, is liye kabhi fail nahi hota.
let cache = null;

function getIntroAudio() {
    if (!cache) {
        const b64 = fs.readFileSync(path.join(__dirname, '..', 'src', 'intro.b64'), 'utf8');
        cache = Buffer.from(b64.replace(/\s+/g, ''), 'base64');
    }
    return cache;
}

module.exports = { getIntroAudio };
