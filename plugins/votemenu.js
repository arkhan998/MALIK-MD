const crypto = require('crypto');
const botEvents = require('../lib/events.js');
const config = require('../config.js');

// ======================================================
// VOTE MENU — WhatsApp Poll style menu
// .votemenu  -> ek poll aata hai, category par VOTE karo,
//               bot usi category ki commands bhej deta hai.
// Fallback: poll par reply karke number (1-7) likh do.
// Poll ka data restart ke baad memory se saaf — .votemenu
// dobara chalana hoga (aam baat hai).
// ======================================================

const CATEGORIES = [
    { label: '🤖 AI Menu', cmds: ['ai', 'px', 'pximg', 'pxvid', 'fluxai', 'stablediffusion', 'stabilityai', 'gimage', 'describe', 'imagine', 'summarize', 'roast', 'dream', 'tone', 'transcribe', 'assistant'] },
    { label: '⬇️ Download Menu', cmds: ['dl', 'tiktok', 'tiktoksearch', 'song', 'pindl', 'instagram'] },
    { label: '🕌 Islamic Menu', cmds: ['quran', 'quranmenu', 'namaz'] },
    { label: '👥 Group Menu', cmds: ['tagall', 'kick', 'promote', 'demote', 'antilink', 'welcome', 'automod', 'stats', 'poll'] },
    { label: '🧰 Tools Menu', cmds: ['weather', 'news', 'viewonce', 'tts', 'screenshot', 'sticker', 'logo', 'tourl', 'shorturl', 'qr', 'autoreact', 'autotyping', 'autorecording', 'antidelete', 'say', 'shayari', 'animate', 'morning'] },
    { label: '💼 Business Menu', cmds: ['jadoo', 'jadooadd', 'invoice', 'catalog', 'catalogadd', 'expense', 'order', 'orders', 'calc', 'tax', 'discount', 'due', 'cust', 'quote', 'profit', 'att', 'report', 'note', 'payinfo', 'target'] },
    { label: '👑 Owner Menu', cmds: ['owner_menu', 'ai_menu', 'general_menu', 'settings', 'listusers', 'simdata', 'send', 'send_audio', 'send_video', 'testreminder', 'stock', 'stockin', 'stockout', 'stocklist', 'lowstock'] }
];

const polls = new Map();      // pollMsgId -> { jid, ts }
const lastSent = new Map();   // voter+poll+cat -> ts (spam guard)
const POLL_TTL = 1000 * 60 * 60 * 6; // 6 ghante

function submenuText(cat) {
    const lines = cat.cmds.map(c => `│ ⚡ .${c}`).join('\n');
    return `╭─⟨ *${cat.label.toUpperCase()}* ⟩\n${lines}\n╰──────────────\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ MALIK-MD*`;
}

async function sendSubmenu(sock, jid, catIdx, quoted) {
    const cat = CATEGORIES[catIdx];
    if (!cat) return;
    try { await sock.sendMessage(jid, { text: submenuText(cat) }, quoted ? { quoted } : undefined); }
    catch (e) { console.error('votemenu submenu error:', e.message); }
}

const sha256hex = (s) => crypto.createHash('sha256').update(s).digest('hex');

// ---------- listeners ----------
botEvents.on('new-message', async ({ sock, m }) => {
    try {
        if (!m?.message) return;
        const jid = m.key.remoteJid;

        // --- 1) Poll vote ---
        const pu = m.message.pollUpdateMessage;
        if (pu && pu.pollCreationMessageKey) {
            const pollId = pu.pollCreationMessageKey.id;
            const rec = polls.get(pollId);
            if (!rec || Date.now() - rec.ts > POLL_TTL) return;
            const selected = pu.vote && Array.isArray(pu.vote.selectedOptions) ? pu.vote.selectedOptions : [];
            if (!selected.length) return; // vote hataya — khamosh
            const hexes = selected.map(o => Buffer.from(o).toString('hex'));
            const idx = CATEGORIES.findIndex(c => hexes.includes(sha256hex(c.label)));
            if (idx < 0) return;
            const voter = (m.key.participant || m.key.remoteJid || '').split('@')[0];
            const guardKey = `${voter}|${pollId}|${idx}`;
            if (Date.now() - (lastSent.get(guardKey) || 0) < 8000) return;
            lastSent.set(guardKey, Date.now());
            return sendSubmenu(sock, rec.jid, idx, null);
        }

        // --- 2) Fallback: poll par quoted reply mein number ---
        if (m.key.fromMe) return;
        const ext = m.message.extendedTextMessage;
        const body = (m.message.conversation || ext?.text || '').trim();
        if (!/^[1-7]$/.test(body)) return;
        const stanzaId = ext?.contextInfo?.stanzaId;
        if (!stanzaId) return;
        const rec = polls.get(stanzaId);
        if (!rec || rec.jid !== jid || Date.now() - rec.ts > POLL_TTL) return;
        return sendSubmenu(sock, jid, parseInt(body, 10) - 1, m);
    } catch (e) {
        console.error('votemenu listener error:', e.message);
    }
});

// ---------- command ----------
module.exports = {
    name: 'votemenu',
    alias: ['vmenu', 'pollmenu', 'votem'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        try {
            await sock.sendMessage(jid, {
                text: `🗳️ *MALIK-MD VOTE MENU*\n━━━━━━━━━━━━━━━\nNeeche poll aa raha hai — apni category par *vote* karo, bot usi category ki saari commands bhej dega.\n\n📌 Vote register na ho to poll par *reply* karke number likh do (1–7).`
            }, { quoted: m });

            const sent = await sock.sendMessage(jid, {
                poll: {
                    name: '🗳️ MALIK-MD MENU — Category chuno',
                    values: CATEGORIES.map(c => c.label),
                    selectableCount: 1
                }
            }, { quoted: m });

            const pollId = sent && sent.key && sent.key.id;
            if (pollId) polls.set(pollId, { jid, ts: Date.now() });
        } catch (e) {
            console.error('votemenu error:', e.message);
            await sock.sendMessage(jid, { text: '❌ Vote menu nahi ban saka. .menu wala classic menu try karo.' }, { quoted: m });
        }
    }
};
