const fs = require('fs');
const path = require('path');

// Hi/Hello greeting voice note — repo ke andar base64 mein mehfooz hai
// (src/hivoice.b64). Intro (lib/intro.js) wala hi pattern: koi external
// host/link nahi, is liye kabhi fail nahi hota.
// File na ho to null — plugin crash nahi karega, bas khamosh rahega.
let cache = null;

function getHiAudio() {
    if (cache) return cache;
    try {
        const b64 = fs.readFileSync(path.join(__dirname, '..', 'src', 'hivoice.b64'), 'utf8');
        cache = Buffer.from(b64.replace(/\s+/g, ''), 'base64');
        return cache;
    } catch (e) {
        return null;
    }
}

module.exports = { getHiAudio };
