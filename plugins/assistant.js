const axios = require('axios');
const config = require('../config.js');
const botEvents = require('../lib/events.js');

// ======================================================
// ASSISTANT — personal AI chatbot mode (.assistant on|off)
// Owner-only, DM/inbox only (refused in groups)
// ======================================================

const assistantChats = new Set(); // jid strings

const isGroup = (m) => m.key.remoteJid && m.key.remoteJid.endsWith('@g.us');
const norm = (jid) => String(jid || '').split(':')[0].split('@')[0];

function isOwner(m) {
    const sender = norm(m.key.participant || m.participant || m.key.remoteJid);
    return config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);
}

// ---------- listener ----------
botEvents.on('new-message', async ({ sock, m }) => {
    try {
        if (!m?.message || m.key.fromMe || isGroup(m)) return;
        const jid = m.key.remoteJid;
        if (!assistantChats.has(jid)) return;

        const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
        if (!text || text.startsWith(config.prefix)) return;
        if (!config.GEMINI_API_KEY) return;

        const prompt = `You are MALIK, a friendly witty personal assistant speaking Roman Urdu (Urdu written in Latin script). `
            + `Keep replies under 60 words, casual and helpful. Never mention you are an AI model.\n\nUser: ${text.slice(0, 500)}`;

        const waiting = await sock.sendMessage(jid, { text: '💭 ...' }, { quoted: m });
        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${config.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { timeout: 20000 }
        );
        const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
            || 'Sorry, samajh nahi aaya. Dobara kaho?';
        await sock.sendMessage(jid, { text: reply, edit: waiting.key }, { quoted: m });
    } catch (e) {
        console.error('assistant error:', e.message);
    }
});

// ---------- command ----------
module.exports = {
    name: 'assistant',
    aliases: ['aichat'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        if (isGroup(m)) {
            return sock.sendMessage(jid, { text: '❌ .assistant sirf inbox (DM) mein kaam karta hai, group mein nahi.' }, { quoted: m });
        }
        const opt = (args[0] || '').toLowerCase();
        if (opt === 'on') {
            assistantChats.add(jid);
            return sock.sendMessage(jid, { text: '🤖 *AI Assistant mode ON*\nAb tum jo bhi likho ge, main uska jawab dunga. Band karne ke liye: .assistant off' }, { quoted: m });
        }
        if (opt === 'off') {
            assistantChats.delete(jid);
            return sock.sendMessage(jid, { text: '🤖 *AI Assistant mode OFF*' }, { quoted: m });
        }
        const state = assistantChats.has(jid) ? 'ON 🟢' : 'OFF 🔴';
        return sock.sendMessage(jid, { text: `🤖 Assistant mode: *${state}*\n\n.assistant on — chat mode on\n.assistant off — band` }, { quoted: m });
    }
};
