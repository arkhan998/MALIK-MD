const crypto = require('crypto');
const botEvents = require('../lib/events.js');
const config = require('../config.js');

// ======================================================
// VOTE MENU — WhatsApp Poll style menu
// .votemenu  -> ek poll aata hai, category par VOTE karo,
//               bot usi category ki commands bhej deta hai.
//
// NOTE (vote decryption): Baileys ki maujooda version mein
// messages.upsert par vote ENCRYPTED aata hai (selectedOptions
// khaali hota hai) — vote ko poll ke messageSecret se
// decryptPollVote karke parhna padta hai. Secret poll bhejte
// waqt returned message mein hota hai, hum use sambhal kar
// rakhte hain. Fallback: poll par reply karke number (1-7).
// ======================================================

let decryptPollVote = null;
try { decryptPollVote = require('@whiskeysockets/baileys').decryptPollVote; } catch (e) {}

const CATEGORIES = [
    { label: '🤖 AI Menu', cmds: ['ai', 'px', 'pximg', 'pxvid', 'fluxai', 'stablediffusion', 'stabilityai', 'gimage', 'describe', 'imagine', 'summarize', 'roast', 'dream', 'tone', 'transcribe', 'assistant'] },
    { label: '⬇️ Download Menu', cmds: ['dl', 'tiktok', 'tiktoksearch', 'song', 'pindl', 'instagram'] },
    { label: '🕌 Islamic Menu', cmds: ['quran', 'quranmenu', 'namaz', 'dua', 'hadith', 'asma', 'tasbeeh', 'nextprayer', 'hijri'] },
    { label: '👥 Group Menu', cmds: ['tagall', 'kick', 'promote', 'demote', 'antilink', 'welcome', 'automod', 'stats', 'poll', 'warn', 'admins', 'hidetag', 'mute', 'unmute', 'grouplink', 'groupinfo', 'members'] },
    { label: '🧰 Tools Menu', cmds: ['weather', 'news', 'viewonce', 'tts', 'screenshot', 'sticker', 'logo', 'tourl', 'shorturl', 'qr', 'autoreact', 'autotyping', 'autorecording', 'antidelete', 'say', 'shayari', 'animate', 'morning', 'age', 'bmi', 'emi', 'zakat', 'split', 'unit', 'fuel', 'countdown', 'remindme', 'password', 'fancy', 'base64', 'define', 'wiki', 'country', 'motivate', 'joke', 'choose', 'dice', 'team', 'toimg', 'tomp3', 'compress', 'autostatus', 'birthday'] },
    { label: '💼 Business Menu', cmds: ['jadoo', 'jadooadd', 'invoice', 'catalog', 'catalogadd', 'expense', 'order', 'orders', 'calc', 'tax', 'discount', 'due', 'cust', 'quote', 'profit', 'att', 'report', 'note', 'payinfo', 'target', 'payreminder', 'shopcard', 'offer', 'followup', 'warranty'] },
    { label: '👑 Owner Menu', cmds: ['owner_menu', 'ai_menu', 'general_menu', 'settings', 'listusers', 'simdata', 'send', 'send_audio', 'send_video', 'testreminder', 'stock', 'stockin', 'stockout', 'stocklist', 'lowstock'] }
];

const polls = new Map();      // pollMsgId -> { jid, ts, encKey }
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

const digestOf = (s) => crypto.createHash('sha256').update(s).digest();
const normJid = (j) => {
    if (!j) return '';
    const [user, domain] = String(j).split('@');
    return user.split(':')[0] + '@' + (domain || 's.whatsapp.net');
};

// Vote (decrypted ya plain) se category index nikaalna
function matchCategory(selectedOptions) {
    if (!Array.isArray(selectedOptions)) return -1;
    for (const opt of selectedOptions) {
        const buf = Buffer.from(opt);
        const idx = CATEGORIES.findIndex(c => digestOf(c.label).equals(buf));
        if (idx >= 0) return idx;
    }
    return -1;
}

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
            const vote = pu.vote || {};
            let catIdx = -1;

            if (Array.isArray(vote.selectedOptions) && vote.selectedOptions.length) {
                // (agar kabhi Baileys khud decrypt karke bheje)
                catIdx = matchCategory(vote.selectedOptions);
            } else if (vote.encPayload && vote.encIv && decryptPollVote && rec.encKey) {
                // Vote encrypted hai — poll secret se decrypt karo
                const voterJid = normJid(m.key.participant || m.key.remoteJid);
                const creatorJid = normJid(sock?.user?.id) || normJid((config.OWNER_NUMBER || '') + '@s.whatsapp.net');
                try {
                    const dec = decryptPollVote(
                        { encPayload: Buffer.from(vote.encPayload), encIv: Buffer.from(vote.encIv) },
                        { pollCreatorJid: creatorJid, pollMsgId: pollId, pollEncKey: Buffer.from(rec.encKey), voterJid }
                    );
                    catIdx = matchCategory(dec?.selectedOptions || []);
                } catch (e) {
                    console.error('votemenu decrypt failed:', e.message);
                    return;
                }
            } else {
                return; // na plain vote, na decryptable data
            }
            if (catIdx < 0) return; // khaali vote (vote hataya) ya unknown option

            const voter = (m.key.participant || m.key.remoteJid || '').split('@')[0];
            const guardKey = `${voter}|${pollId}|${catIdx}`;
            if (Date.now() - (lastSent.get(guardKey) || 0) < 8000) return;
            lastSent.set(guardKey, Date.now());
            return sendSubmenu(sock, rec.jid, catIdx, null);
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
                text: `🗳️ *MALIK-MD VOTE MENU*\n━━━━━━━━━━━━━━━\nNeeche poll aa raha hai — apni category par *vote* karo, bot usi category ki saari commands bhej dega.\n\n📌 Vote ka jawab na aye to poll par *reply* karke number likh do (1–7).`
            }, { quoted: m });

            const sent = await sock.sendMessage(jid, {
                poll: {
                    name: '🗳️ MALIK-MD MENU — Category chuno',
                    values: CATEGORIES.map(c => c.label),
                    selectableCount: 1
                }
            }, { quoted: m });

            const pollId = sent && sent.key && sent.key.id;
            if (pollId) {
                const secret = sent.message?.messageContextInfo?.messageSecret;
                polls.set(pollId, { jid, ts: Date.now(), encKey: secret ? Buffer.from(secret) : null });
            }
        } catch (e) {
            console.error('votemenu error:', e.message);
            await sock.sendMessage(jid, { text: '❌ Vote menu nahi ban saka. .menu wala classic menu try karo.' }, { quoted: m });
        }
    }
};
