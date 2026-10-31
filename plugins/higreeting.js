const botEvents = require('../lib/events.js');
const config = require('../config.js');
const { getHiAudio } = require('../lib/hivoice.js');

// 👋 Hi/Hello Voice Greeting
// Koi sirf "hi", "hii", "hello" ya "helo" likhe — DM ho ya group —
// bot usay voice note (src/hivoice.b64) bhej deta hai.
// Default: har chat mein ON. Kisi chat mein band karna ho to .hivoice off (owner).
// Spam se bachao: ek user ko ek chat mein 30 minute mein ek hi dafa voice milegi.

const COOLDOWN_MS = 30 * 60 * 1000;
const lastSent = new Map(); // "jid|sender" -> timestamp
const offChats = new Set();

function isGreeting(body) {
    // Sirf akelay greeting par fire ho — "hi there" ya jumlay ke beech wala "hi" nahi.
    // Emoji/viram hata kar, chhote haroof mein, exact match:
    // hi, hii, hiii... / helo, hello, helloo...
    const clean = (body || '').toLowerCase().replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').trim();
    return /^(hi+|he+l+o+)$/.test(clean);
}

botEvents.on('new-message', async ({ sock, m }) => {
    try {
        if (!m || !m.message || m.key.fromMe) return;
        const jid = m.key.remoteJid;
        if (!jid || jid === 'status@broadcast') return;
        if (offChats.has(jid)) return;

        const body = (m.message.conversation || m.message.extendedTextMessage?.text || '').trim();
        if (!body || body.startsWith(config.prefix)) return;
        if (!isGreeting(body)) return;

        const sender = jid.endsWith('@g.us') ? (m.key.participant || m.participant || jid) : jid;
        const key = jid + '|' + sender;
        const now = Date.now();
        if (now - (lastSent.get(key) || 0) < COOLDOWN_MS) return;

        const audio = getHiAudio();
        if (!audio) return;
        lastSent.set(key, now);

        await sock.sendMessage(jid, {
            audio: audio,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true // voice note ban kar jayega
        }, { quoted: m });
    } catch (e) {
        console.error('higreeting error:', e.message);
    }
});

// .settings ke liye toggle registry
try { require('../lib/toggles.js').register('hivoice', '👋 Hi Voice', 'chat', (jid) => !offChats.has(jid)); } catch (e) {}

module.exports = {
    name: 'hivoice',
    aliases: ['higreet', 'higreeting'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'off') {
            offChats.add(jid);
            return sock.sendMessage(jid, { text: '🔇 *Hi Voice OFF* — ab is chat mein hi/hello par voice nahi aayegi.\n\nWapas on karne ke liye: *.hivoice on*' }, { quoted: m });
        }
        if (sub === 'on') {
            offChats.delete(jid);
            return sock.sendMessage(jid, { text: '🔊 *Hi Voice ON* — ab koi hi/hello likhega to voice note jayegi. 👋' }, { quoted: m });
        }
        const on = !offChats.has(jid);
        return sock.sendMessage(jid, { text: `👋 *Hi Voice Greeting*\n\nStatus (is chat mein): ${on ? 'ON 🔊' : 'OFF 🔇'}\nKaam: koi sirf *hi / hii / hello / helo* likhe (DM ya group) to bot voice note bhejta hai. Ek user ko 30 minute mein ek dafa.\n\nBand karna ho: *.hivoice off*` }, { quoted: m });
    }
};
