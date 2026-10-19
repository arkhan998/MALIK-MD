const axios = require('axios');
const config = require('../config.js');
const botEvents = require('../lib/events.js');

// ======================================================
// AUTOMOD — AI group guard: .automod on|off (admin-only)
// Deletes abusive/spam messages via Gemini classification
// ======================================================

const automodGroups = new Map(); // jid -> true
const lastCall = new Map();      // jid -> timestamp (rate limit)

const isGroup = (m) => m.key.remoteJid && m.key.remoteJid.endsWith('@g.us');
const norm = (jid) => String(jid || '').split(':')[0].split('@')[0];
const fullJid = (num) => `${norm(num)}@s.whatsapp.net`;

function senderOf(m) {
    return norm(m.key.participant || m.participant || m.key.remoteJid);
}

async function groupAdmins(sock, jid) {
    try {
        const meta = await sock.groupMetadata(jid);
        const admins = new Set();
        for (const p of meta.participants || []) {
            if (p.admin === 'admin' || p.admin === 'superadmin') admins.add(norm(p.id));
        }
        return admins;
    } catch (e) {
        return new Set();
    }
}

// ---------- listener ----------
botEvents.on('new-message', async ({ sock, m }) => {
    try {
        if (!m?.message || !isGroup(m) || m.key.fromMe) return;
        const jid = m.key.remoteJid;
        if (!automodGroups.get(jid)) return;

        const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
        if (!text || text.length < 2 || text.startsWith(config.prefix)) return;

        // Rate limit: max 1 Gemini call per 3 sec per group
        const now = Date.now();
        if (now - (lastCall.get(jid) || 0) < 3000) return;
        lastCall.set(jid, now);

        const admins = await groupAdmins(sock, jid);
        const sender = senderOf(m);
        if (admins.has(sender)) return;                       // admins exempt
        if (!admins.has(norm(sock.user?.id))) return;         // bot must be admin to delete
        if (!config.GEMINI_API_KEY) return;

        const prompt = `Classify this WhatsApp group message as exactly ONE word — OK, ABUSE, or SPAM.\n`
            + `ABUSE = gali/galoch, harassment, hate, threats (any language).\n`
            + `SPAM = ads, promotions, invite links, repeated marketing.\n`
            + `Otherwise OK. Reply with ONE word only, nothing else.\n\nMessage: "${text.slice(0, 300)}"`;

        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${config.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { timeout: 15000 }
        );
        const verdict = (res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().toUpperCase();

        if (verdict === 'ABUSE' || verdict === 'SPAM') {
            await sock.sendMessage(jid, { delete: m.key });
            const kind = verdict === 'ABUSE' ? 'gali/galoch' : 'spam';
            await sock.sendMessage(jid, {
                text: `⚠️ @${sender} — ${kind} wale messages yahan allowed nahi. Warning!`,
                mentions: [fullJid(sender)]
            });
        }
    } catch (e) {
        console.error('automod error:', e.message);
    }
});

// ---------- command ----------
module.exports = {
    name: 'automod',
    aliases: ['mod'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        if (!isGroup(m)) {
            return sock.sendMessage(jid, { text: '❌ .automod sirf groups mein kaam karta hai.' }, { quoted: m });
        }
        const sender = senderOf(m);
        const admins = await groupAdmins(sock, jid);
        if (!admins.has(sender)) {
            return sock.sendMessage(jid, { text: '❌ Ye command sirf group admins ke liye hai.' }, { quoted: m });
        }
        const opt = (args[0] || '').toLowerCase();
        if (opt === 'on') {
            automodGroups.set(jid, true);
            return sock.sendMessage(jid, { text: '🛡️ *AutoMod ON*\nAb gali/galoch aur spam messages AI detect karke auto-delete hongay.\n_(Note: mujhe group admin hona chahiye)_' }, { quoted: m });
        }
        if (opt === 'off') {
            automodGroups.delete(jid);
            return sock.sendMessage(jid, { text: '🛡️ *AutoMod OFF*' }, { quoted: m });
        }
        const state = automodGroups.get(jid) ? 'ON 🟢' : 'OFF 🔴';
        return sock.sendMessage(jid, { text: `🛡️ AutoMod is currently *${state}*\n\nUse:\n.automod on — AI guard on karo\n.automod off — band karo` }, { quoted: m });
    }
};
