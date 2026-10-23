// ======================================================
// PACK: GUARD — public group protection
// .badwords on/off/add/list (listener deletes + warns)
// .antiflood on/off (listener: 5 msgs/5s = warning)
// .guard (status)
// Note: .antilink pehle se bot mein mojoud hai.
// ======================================================
const fs = require('fs');
const path = require('path');
const botEvents = require('../lib/events.js');
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });
const FILE = path.join(__dirname, '..', 'data', 'guard.json');
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; } };
const save = (d) => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); };
const DEFAULT_BAD = ['badword1', 'badword2'];
const floodMap = new Map();

botEvents.on('new-message', async ({ sock, m }) => {
    try {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us') || m.key.fromMe) return;
        const sender = m.key.participant || jid;
        const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || '').toLowerCase();
        const g = load()[jid] || {};
        // antiflood
        if (g.antiflood) {
            const now = Date.now(); const key = jid + ':' + sender;
            const arr = (floodMap.get(key) || []).filter(t => now - t < 5000); arr.push(now); floodMap.set(key, arr);
            if (arr.length === 6) { await sock.sendMessage(jid, { text: `⚠️ @${sender.split('@')[0]} flood mat karo! Slow ho jao warna admin ko report hogi.`, mentions: [sender] }).catch(() => {}); }
        }
        // bad words
        if (g.badwords && body) {
            const words = (g.words && g.words.length ? g.words : DEFAULT_BAD);
            const hit = words.find(w => body.includes(w.toLowerCase()));
            if (hit) {
                await sock.deleteMessage?.(jid, m.key).catch(() => {});
                await sock.sendMessage(jid, { delete: m.key }).catch(() => {});
                await sock.sendMessage(jid, { text: `🚫 @${sender.split('@')[0]} group mein gali/man'aa shuda lafz mana hai! Message delete kar diya gaya hai.`, mentions: [sender] }).catch(() => {});
            }
        }
    } catch {}
});

const groupOnly = (sock, m) => m.key.remoteJid.endsWith('@g.us') || (send(sock, m, '👥 Ye command sirf groups mein hai.'), false);

module.exports = [
    { name: 'guard', alias: ['guardstatus'], exec: async (sock, m) => { if (!groupOnly(sock, m)) return; const g = load()[m.key.remoteJid] || {}; return send(sock, m, `🛡️ *Group Guard Status*\n• Bad-words filter: ${g.badwords ? 'ON ✅' : 'OFF ❌'}\n• Anti-flood: ${g.antiflood ? 'ON ✅' : 'OFF ❌'}\n• Anti-link: .antilink command se (bot mein mojoud)\n\nChalao: .badwords on | .antiflood on`); } },
    { name: 'badwords', alias: ['antibad'], exec: async (sock, m, args) => {
        if (!groupOnly(sock, m)) return; const jid = m.key.remoteJid; const all = load(); all[jid] = all[jid] || {};
        const act = (args[0] || '').toLowerCase();
        if (act === 'on') { all[jid].badwords = true; save(all); return send(sock, m, '🛡️ Bad-words filter ON ho gaya! Galat lafz wala message delete + warning jayegi.'); }
        if (act === 'off') { all[jid].badwords = false; save(all); return send(sock, m, '🛡️ Bad-words filter OFF ho gaya.'); }
        if (act === 'add') { const w = args.slice(1).join(' ').toLowerCase(); if (!w) return send(sock, m, 'Example: .badwords add <lafz>'); all[jid].words = [...new Set([...(all[jid].words || []), w])]; save(all); return send(sock, m, `✅ "${w}" list mein add ho gaya.`); }
        if (act === 'list') { const ws = all[jid].words?.length ? all[jid].words : DEFAULT_BAD; return send(sock, m, '🚫 *Man\'aa shuda alfaz:*\n' + ws.map(w => '• ' + w).join('\n')); }
        return send(sock, m, '🛡️ Use: .badwords on/off/add <lafz>/list'); } },
    { name: 'antiflood', alias: ['floodguard'], exec: async (sock, m, args) => {
        if (!groupOnly(sock, m)) return; const jid = m.key.remoteJid; const all = load(); all[jid] = all[jid] || {};
        const act = (args[0] || '').toLowerCase();
        if (act === 'on') { all[jid].antiflood = true; save(all); return send(sock, m, '🌊 Anti-flood ON! 5 second mein 6+ messages = warning.'); }
        if (act === 'off') { all[jid].antiflood = false; save(all); return send(sock, m, '🌊 Anti-flood OFF ho gaya.'); }
        return send(sock, m, '🌊 Use: .antiflood on/off'); } },
];
