const botEvents = require('../lib/events.js');
const config = require('../config.js');

// jid -> { mode: 'smart' | 'random' | 'custom', emoji }
const state = new Map();

// Roman Urdu + English keyword -> emoji
const KEYWORDS = [
    [/shukriya|thanks|thank ?you|meherbani/i, '🙏'],
    [/mubarak|congrat|shabash/i, '🎉'],
    [/eid/i, '🌙'],
    [/udaas|sad|rona|😢|😭|dil toot/i, '❤️'],
    [/haha|hehe|😂|🤣|funny|mazak|mazaaq/i, '😂'],
    [/love|mohabbat|pyaar|ishq|❤️|💕/i, '❤️'],
    [/shaadi|wedding|nikah/i, '💍'],
    [/good ?morning|subah ?bakhair|assalam|aoa/i, '🌅'],
    [/good ?night|shab ?bakhair/i, '🌙'],
    [/wow|amazing|kamal|zabardast|🔥|awesome/i, '🔥'],
    [/ok|theek|done|ho gaya|👍/i, '👍'],
    [/welcome|khush ?aamdeed/i, '🤗'],
    [/sorry|maaf|maazrat/i, '🤗'],
    [/birthday|janam ?din|saalgira/i, '🎂'],
    [/pasand|like|best|behtreen/i, '💯'],
    [/hairan|surprise|shock|😮|😲/i, '😮'],
    [/dua|ameen/i, '🤲'],
    [/pakistan|🇵🇰/i, '🇵🇰'],
    [/cricket|match|babar/i, '🏏'],
    [/chai|☕/i, '☕'],
    [/khana|biryani|🍔|🍕/i, '😋'],
];

const RANDOM_SET = ['❤️', '😂', '🔥', '👍', '🎉', '😮', '👏', '💯', '🤩', '🫡'];

function smartEmoji(text) {
    for (const [re, emoji] of KEYWORDS) {
        if (re.test(text)) return emoji;
    }
    return null;
}

botEvents.on('new-message', async ({ sock, m }) => {
    try {
        if (!m || !m.message || m.key.fromMe) return;
        const jid = m.key.remoteJid;
        const cfg = state.get(jid);
        if (!cfg) return;

        const body = (m.message.conversation || m.message.extendedTextMessage?.text || '').trim();
        if (!body) return;
        if (body.startsWith(config.prefix)) return; // commands par react nahi

        let emoji;
        if (cfg.mode === 'custom') emoji = cfg.emoji;
        else if (cfg.mode === 'random') emoji = RANDOM_SET[Math.floor(Math.random() * RANDOM_SET.length)];
        else emoji = smartEmoji(body) || '👍';

        await sock.sendMessage(jid, { react: { text: emoji, key: m.key } });
    } catch (e) {
        console.error('autoreact error:', e.message);
    }
});


// .settings ke liye toggle registry
try { require('../lib/toggles.js').register('autoreact', '🎭 Auto-React', 'chat', (jid) => state.has(jid)); } catch (e) {}

module.exports = {
    name: 'autoreact',
    aliases: ['ar'],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const sub = (args[0] || '').toLowerCase();

            if (sub === 'on' || sub === 'smart') {
                state.set(jid, { mode: 'smart' });
                return sock.sendMessage(jid, { text: '✅ *Auto-React ON* 🧠\n\nAb har message par smart emoji reaction aayega (Roman Urdu + English samajhta hai).' }, { quoted: m });
            }
            if (sub === 'off') {
                state.delete(jid);
                return sock.sendMessage(jid, { text: '❌ *Auto-React OFF*' }, { quoted: m });
            }
            if (sub === 'random') {
                state.set(jid, { mode: 'random' });
                return sock.sendMessage(jid, { text: '✅ *Auto-React ON* 🎲\n\nAb har message par random fun emoji aayega.' }, { quoted: m });
            }
            if (sub === 'status') {
                const cfg = state.get(jid);
                return sock.sendMessage(jid, { text: cfg ? `ℹ️ *Auto-React:* ON\n*Mode:* ${cfg.mode}${cfg.emoji ? ' ' + cfg.emoji : ''}` : 'ℹ️ *Auto-React:* OFF' }, { quoted: m });
            }
            // custom emoji: .autoreact ❤️
            if (args[0] && /^\p{Extended_Pictographic}/u.test(args[0])) {
                state.set(jid, { mode: 'custom', emoji: args[0] });
                return sock.sendMessage(jid, { text: `✅ *Auto-React ON* ${args[0]}\n\nAb har message par yehi emoji aayega.` }, { quoted: m });
            }

            return sock.sendMessage(jid, {
                text: '⚡ *Auto-React*\n\n*.autoreact on* — smart emoji (message samajh kar)\n*.autoreact random* — random fun emoji\n*.autoreact ❤️* — hamesha yehi emoji\n*.autoreact off* — band karo\n*.autoreact status* — check karo'
            }, { quoted: m });
        } catch (e) {
            console.error('autoreact cmd error:', e.message);
        }
    }
};
