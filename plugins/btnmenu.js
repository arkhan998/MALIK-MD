// ======================================================
// BUTTON MENU — .btnmenu
// WhatsApp interactive LIST (single_select) menu:
// button dabao -> categories ki list -> category chuno
// -> us category ki saari commands aa jati hain.
//
// Agar kisi phone/WhatsApp version par button render na
// ho, to bot sath mein NUMBER wala tareeka bhi deta hai:
// menu ke jawab mein sirf number (1-8) likho.
//
// Responses 3 tareeqon se a sakte hain, teeno handle hain:
// 1) interactiveResponseMessage (nativeFlow paramsJson)
// 2) listResponseMessage (singleSelectReply)
// 3) buttonsResponseMessage / template reply
// Vote-menu (poll) wala purana tareeka .votemenu par
// mojoud hai — ye us ka button wala badal hai.
// ======================================================
const crypto = require('crypto');
const botEvents = require('../lib/events.js');
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });

const CATEGORIES = [
    { label: '🤖 AI Menu', cmds: ['ai', 'px', 'pximg', 'pxvid', 'fluxai', 'stablediffusion', 'stabilityai', 'gimage', 'describe', 'imagine', 'summarize', 'roast', 'dream', 'tone', 'transcribe', 'assistant', 'translate', 'grammar', 'kahani', 'nazm', 'samjhao', 'ideagen', 'fixcode', 'tldr'] },
    { label: '⬇️ Download Menu', cmds: ['dl', 'tiktok', 'tiktoksearch', 'song', 'pindl', 'instagram'] },
    { label: '🕌 Islamic Menu', cmds: ['quran', 'quranmenu', 'namaz', 'dua', 'hadith', 'asma', 'tasbeeh', 'nextprayer', 'hijri', 'ayatkursi', 'kalma', 'darood', 'ayah', 'wazifa', 'qibla', 'ramadan', 'jummah'] },
    { label: '👥 Group Menu', cmds: ['tagall', 'kick', 'promote', 'demote', 'antilink', 'welcome', 'automod', 'stats', 'poll', 'warn', 'admins', 'hidetag', 'mute', 'unmute', 'grouplink', 'groupinfo', 'members', 'guard', 'badwords', 'antiflood', 'rules', 'setrules', 'setwelcome', 'setbye', 'reportadmin'] },
    { label: '🧰 Tools Menu', cmds: ['weather', 'news', 'viewonce', 'tts', 'screenshot', 'sticker', 'logo', 'tourl', 'shorturl', 'qr', 'autoreact', 'autotyping', 'autorecording', 'antidelete', 'say', 'shayari', 'animate', 'morning', 'age', 'bmi', 'emi', 'zakat', 'split', 'unit', 'fuel', 'countdown', 'remindme', 'password', 'fancy', 'base64', 'define', 'wiki', 'country', 'motivate', 'joke', 'choose', 'dice', 'team', 'toimg', 'tomp3', 'compress', 'autostatus', 'birthday', 'currency', 'task', 'horoscope', 'zodiac', 'worldtime', 'roman', 'stopwatch', 'pomodoro', 'botstats', 'uptime'] },
    { label: '🎮 Fun & Games', cmds: ['quiz', 'meme', 'ship', '8ball', 'fortune', 'riddle', 'fact', 'cat', 'dog', 'guess', 'hangman', 'slots', 'roulette', 'aura', 'iq', 'sachmeter', 'crush', 'dostmeter', 'luck', 'mood', 'latifa', 'ghazal', 'flirt', 'textimg', 'qcard', 'color', 'acronym', 'upside', 'morse', 'emojify'] },
    { label: '💼 Business Menu', cmds: ['jadoo', 'jadooadd', 'invoice', 'catalog', 'catalogadd', 'expense', 'order', 'orders', 'calc', 'tax', 'discount', 'due', 'cust', 'quote', 'profit', 'att', 'report', 'note', 'payinfo', 'target', 'payreminder', 'shopcard', 'offer', 'followup', 'warranty'] },
    { label: '👑 Owner Menu', cmds: ['owner_menu', 'ai_menu', 'general_menu', 'settings', 'listusers', 'simdata', 'send', 'send_audio', 'send_video', 'testreminder', 'stock', 'stockin', 'stockout', 'stocklist', 'lowstock', 'feedback', 'suggestion'] }
];

function submenuText(cat) {
    const lines = cat.cmds.map(c => `│ ⚡ .${c}`).join('\n');
    return `╭─⟨ *${cat.label.toUpperCase()}* ⟩\n${lines}\n╰──────────────\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ MALIK-MD*`;
}

const sessions = new Map(); // jid -> ts (number fallback ke liye, 10 min)
const SESSION_TTL = 10 * 60 * 1000;

function numberedText() {
    return `╭─⟨ *🤖 MALIK-MD MENU* ⟩\n` +
        CATEGORIES.map((c, i) => `│ ${i + 1}️⃣ ${c.label} (${c.cmds.length})`).join('\n') +
        `\n╰──────────────\nSirf *number* likho (1-${CATEGORIES.length}) — us category ki commands aa jayengi.\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ MALIK-MD*`;
}

async function tryButtonMenu(sock, m) {
    const jid = m.key.remoteJid;
    const rows = CATEGORIES.map((c, i) => ({ header: '', title: c.label, description: `${c.cmds.length} commands — tap karo`, id: `btnmenu_${i}` }));
    const interactiveMessage = {
        body: { text: 'Assalam-o-Alaikum! 👋\nMALIK-MD ke **460+ commands** categories mein hain.\nNeeche wala button dabao, category chuno — commands hazir!' },
        footer: { text: '© ᴘᴏᴡᴇʀᴇᴅ ʙʏ MALIK-MD' },
        header: { title: '🤖 MALIK-MD', subtitle: 'Button Menu', hasMediaAttachment: false },
        nativeFlowMessage: {
            buttons: [{
                name: 'single_select',
                buttonParamsJson: JSON.stringify({ title: '📂 Menu Kholo', sections: [{ title: 'MALIK-MD — Categories', highlight_label: 'MALIK-MD', rows }] })
            }]
        }
    };
    await sock.relayMessage(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage
            }
        }
    }, { messageId: crypto.randomBytes(12).toString('hex').toUpperCase() });
}

// Selection se category index nikaalna (har format)
function extractSelection(m) {
    try {
        const msg = m.message || {};
        const ir = msg.interactiveResponseMessage;
        if (ir?.nativeFlowResponseMessage?.paramsJson) {
            const p = JSON.parse(ir.nativeFlowResponseMessage.paramsJson);
            if (p?.id && String(p.id).startsWith('btnmenu_')) return parseInt(String(p.id).split('_')[1]);
        }
        const lr = msg.listResponseMessage;
        const rowId = lr?.singleSelectReply?.selectedRowId || ir?.listResponseMessage?.singleSelectReply?.selectedRowId;
        if (rowId && String(rowId).startsWith('btnmenu_')) return parseInt(String(rowId).split('_')[1]);
        const br = msg.buttonsResponseMessage?.selectedButtonId || msg.templateButtonReplyMessage?.selectedId;
        if (br && String(br).startsWith('btnmenu_')) return parseInt(String(br).split('_')[1]);
    } catch {}
    return -1;
}

botEvents.on('new-message', async ({ sock, m }) => {
    try {
        const jid = m.key.remoteJid;
        const idx = extractSelection(m);
        if (idx >= 0 && CATEGORIES[idx]) {
            sessions.set(jid, Date.now());
            return send(sock, m, submenuText(CATEGORIES[idx]));
        }
        // Number fallback
        const ts = sessions.get(jid);
        if (ts && Date.now() - ts < SESSION_TTL) {
            const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
            if (/^[1-8]$/.test(body)) {
                const cat = CATEGORIES[parseInt(body) - 1];
                if (cat) return send(sock, m, submenuText(cat));
            }
        }
    } catch {}
});

const catCommands = CATEGORIES.map((cat, i) => ({
    name: ['aimenu', 'dlmenu', 'islamicmenu', 'groupmenu', 'toolsmenu', 'funmenu', 'bizmenu', 'ownermenu'][i],
    alias: [],
    exec: async (sock, m) => { sessions.set(m.key.remoteJid, Date.now()); return send(sock, m, submenuText(cat) + '\n\nAur categories: .btnmenu'); }
}));

module.exports = [
    {
        name: 'btnmenu',
        alias: ['buttonmenu', 'bmenu', 'listmenu', 'catmenu'],
        exec: async (sock, m) => {
            sessions.set(m.key.remoteJid, Date.now());
            return send(sock, m, numberedText());
        }
    },
    ...catCommands
];
