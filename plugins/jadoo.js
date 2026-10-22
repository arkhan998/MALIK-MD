const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config.js');
const botEvents = require('../lib/events.js');

// ======================================================
// JADOO AUTO-REPLY — keyword par foran DM jawab + AI niyat
// (JadooDM guide ki WhatsApp base: keyword -> gift/link)
//
// .jadoo                 -> panel / status
// .jadoo on|off          -> auto-reply on/off (owner)
// .jadoo ai on|off       -> AI intent on/off (owner)
// .jadooadd KEY | jawab  -> keyword rule add/update (owner)
// .jadoodel KEY          -> rule delete (owner)
// .jadoolist             -> saari rules (owner)
// .jadoobiz <info>       -> business info jo AI use karega (owner)
// .jadoostats            -> kitne logo ko jawab gaya (owner)
// .jadooreset all|<num>  -> dedupe saaf (owner)
//
// Data: data/jadoo.json
// Kaam sirf DM (inbox) mein — groups mein default band.
// Anti-spam: ek shakhs ko ek keyword ka jawab sirf EK dafa.
// ======================================================

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'jadoo.json');

const DEFAULTS = {
    enabled: false,
    aiEnabled: true,
    biz: '',
    rules: [],              // { keyword, reply, created }
    served: {},             // { senderNumber: { KEYWORD: timestamp } }
    stats: { keyword: 0, ai: 0, total: 0 }
};

function load() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        if (!fs.existsSync(FILE)) return JSON.parse(JSON.stringify(DEFAULTS));
        const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        return { ...JSON.parse(JSON.stringify(DEFAULTS)), ...d, stats: { ...DEFAULTS.stats, ...(d.stats || {}) } };
    } catch (e) { return JSON.parse(JSON.stringify(DEFAULTS)); }
}
function save(db) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
    } catch (e) {}
}

// ---------- text normalization / matching ----------
function normText(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 1) return 99;
    const row = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
        let prev = row[0]; row[0] = i;
        for (let j = 1; j <= n; j++) {
            const tmp = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = tmp;
        }
    }
    return row[n];
}
// Ek rule is message par match karta hai ya nahi:
//  - poora keyword (phrase) text mein mojood ho, ya
//  - single-word keyword kisi token ke barabar ho, ya
//  - token se sirf 1 harf ka farq ho (typo: "gudie", "prce") — min length 4
function ruleMatches(rule, textNorm, tokens) {
    const kw = normText(rule.keyword);
    if (!kw) return false;
    if (textNorm === kw) return true;
    if (kw.includes(' ')) return (' ' + textNorm + ' ').includes(' ' + kw + ' ');
    if (tokens.includes(kw)) return true;
    if (kw.length >= 4) {
        for (const t of tokens) {
            if (t.length >= 4 && levenshtein(t, kw) <= 1) return true;
        }
    }
    return false;
}

const senderNum = (jid) => String(jid || '').split('@')[0].split(':')[0];
const isGroupJid = (jid) => String(jid || '').endsWith('@g.us');

function loadCatalogLines() {
    try {
        const f = path.join(DATA_DIR, 'catalog.json');
        if (!fs.existsSync(f)) return '';
        const items = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (!Array.isArray(items) || !items.length) return '';
        return items.map(it => `- ${it.name}: Rs ${Number(it.price).toLocaleString('en-PK')}${it.unit ? ' / ' + it.unit : ''}`).join('\n');
    } catch (e) { return ''; }
}
function loadPaymentLines() {
    try {
        const f = path.join(DATA_DIR, 'payments.json');
        if (!fs.existsSync(f)) return '';
        const db = JSON.parse(fs.readFileSync(f, 'utf8'));
        return Object.keys(db).map(k => `- ${k}: ${db[k]}`).join('\n');
    } catch (e) { return ''; }
}

// ---------- AI intent ----------
async function aiDecide(db, text) {
    if (!config.GEMINI_API_KEY) return null;
    const rulesList = db.rules.map(r => `- KEYWORD: ${r.keyword} -> jawab: ${r.reply.slice(0, 120)}`).join('\n') || '(koi rule nahi)';
    const catalog = loadCatalogLines();
    const payments = loadPaymentLines();
    const prompt =
`Tum ek WhatsApp business auto-reply system ke intent engine ho. Customer ka message parho aur faisla karo.

BUSINESS INFO (owner ne di hai):
${db.biz || '(nahi di gayi)'}

KEYWORD RULES:
${rulesList}
${catalog ? '\nPRICE LIST (catalog):\n' + catalog : ''}
${payments ? '\nPAYMENT DETAILS:\n' + payments : ''}

CUSTOMER MESSAGE: "${text.slice(0, 400)}"

Faisla sirf JSON mein do, kuch aur mat likho:
{"action":"serve","keyword":"GUIDE"}  — agar customer asal mein kisi rule wali cheez ki taraf ishara kar raha hai (ghalat spelling, Roman Urdu, Urdu script, ghuma phira kar — sab chalega)
{"action":"answer","text":"..."}      — agar customer business se mutaliq sawal pooch raha hai (price, service, payment, order, timing) aur jawab UPAR di gayi maloomat se banta hai. Jawab Roman Urdu mein, dostana, 60 alfaaz se kam. Jo maloomat upar nahi, wo invent MAT karna.
{"action":"none"}                     — agar message business se mutaliq nahi ya jawab maloomat se nahi banta.`;

    const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${config.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { timeout: 20000 }
    );
    let raw = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json|```/g, '').trim();
    const start = raw.indexOf('{'), end = raw.lastIndexOf('}');
    if (start < 0 || end < 0) return null;
    return JSON.parse(raw.slice(start, end + 1));
}

// ---------- serving ----------
async function serveRules(sock, m, db, rules, viaAi) {
    const jid = m.key.remoteJid;
    const num = senderNum(jid);
    const first = (m.pushName || '').trim().split(' ')[0];
    const greet = first ? `Assalam o Alaikum ${first}! 👋` : 'Assalam o Alaikum! 👋';
    const body = rules.map(r => r.reply).join('\n\n━━━━━━━━━━━━━━━\n\n');
    await sock.sendMessage(jid, { text: `${greet}\n\n${body}` }, { quoted: m });
    db.served[num] = db.served[num] || {};
    const now = Date.now();
    rules.forEach(r => { db.served[num][normText(r.keyword).toUpperCase()] = now; });
    if (viaAi) db.stats.ai += rules.length; else db.stats.keyword += rules.length;
    db.stats.total += rules.length;
    save(db);
}

// ---------- listener ----------
const aiCooldown = new Map(); // num -> last AI ts (30s)

botEvents.on('new-message', async ({ sock, m }) => {
    try {
        if (!m?.message || m.key.fromMe) return;
        const jid = m.key.remoteJid;
        if (isGroupJid(jid)) return; // DM only
        const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
        if (!text || text.startsWith(config.prefix || '.')) return;

        const db = load();
        if (!db.enabled) return;
        if (!db.rules.length && !db.biz) return;

        const num = senderNum(jid);
        if (config.OWNER_NUMBER && num.startsWith(config.OWNER_NUMBER)) return; // owner khud test commands se karega

        const textNorm = normText(text);
        const tokens = textNorm.split(' ').filter(Boolean);

        // 1) Keyword match (exact / typo-tolerant)
        const matched = db.rules.filter(r => ruleMatches(r, textNorm, tokens));
        const already = db.served[num] || {};
        const fresh = matched.filter(r => !already[normText(r.keyword).toUpperCase()]);
        if (fresh.length) return serveRules(sock, m, db, fresh, false);
        if (matched.length) return; // pehle serve ho chuka — spam nahi

        // 2) AI intent (keyword miss ho to)
        if (!db.aiEnabled) return;
        const last = aiCooldown.get(num) || 0;
        if (Date.now() - last < 30000) return;
        aiCooldown.set(num, Date.now());

        const decision = await aiDecide(db, text);
        if (!decision) return;
        if (decision.action === 'serve' && decision.keyword) {
            const rule = db.rules.find(r => normText(r.keyword) === normText(decision.keyword));
            if (rule && !(already[normText(rule.keyword).toUpperCase()])) {
                return serveRules(sock, m, db, [rule], true);
            }
            return;
        }
        if (decision.action === 'answer' && decision.text) {
            const reply = String(decision.text).slice(0, 900).trim();
            if (!reply) return;
            await sock.sendMessage(jid, { text: reply }, { quoted: m });
            db.stats.ai += 1; db.stats.total += 1;
            save(db);
        }
    } catch (e) {
        console.error('jadoo listener error:', e.message);
    }
});

// ---------- commands ----------
const HELP =
`🪄 *JADOO AUTO-REPLY*
━━━━━━━━━━━━━━━
Customer DM mein keyword likhe — bot foran tayyar jawab/link bhej deta hai. Keyword miss ho to *AI niyat samajh kar* sahi jawab deta hai.

*Commands (owner):*
• \`.jadoo on\` / \`.jadoo off\`
• \`.jadoo ai on\` / \`.jadoo ai off\`
• \`.jadooadd GUIDE | Assalam... aapki guide: <link>\`
• \`.jadoodel GUIDE\`
• \`.jadoolist\`
• \`.jadoobiz <business info>\` — AI ke liye services/rates
• \`.jadoostats\`
• \`.jadooreset all\` ya \`.jadooreset 923xx...\`

📌 Ek shakhs ko ek keyword ka jawab sirf *ek dafa* jata hai (dedupe) — dobara likhne par bot khamosh rehta hai.
📌 Sirf DM mein kaam karta hai, groups mein nahi.`;

try { require('../lib/toggles.js').register('jadoo', '🪄 Jadoo Auto-Reply', 'global', () => load().enabled); } catch (e) {}

module.exports = [
    {
        name: 'jadoo',
        alias: ['autoreply'],
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
            const db = load();
            const sub = (args[0] || '').toLowerCase();
            if (sub === 'on') { db.enabled = true; save(db); return send('🪄 *Jadoo Auto-Reply ON* 🟢\nAb DM mein keyword par foran jawab jayega.' + (db.aiEnabled ? '\n🤖 AI intent bhi ON hai.' : '')); }
            if (sub === 'off') { db.enabled = false; save(db); return send('🪄 *Jadoo Auto-Reply OFF* 🔴'); }
            if (sub === 'ai') {
                const v = (args[1] || '').toLowerCase();
                if (v === 'on') { db.aiEnabled = true; save(db); return send('🤖 *Jadoo AI intent ON* 🟢\nKeyword miss ho to AI niyat samajh kar jawab dega.'); }
                if (v === 'off') { db.aiEnabled = false; save(db); return send('🤖 *Jadoo AI intent OFF* 🔴\nAb sirf exact keyword chalega.'); }
                return send('Format: `.jadoo ai on` ya `.jadoo ai off`');
            }
            const people = Object.keys(db.served).length;
            return send(
`🪄 *JADOO AUTO-REPLY* — Status
━━━━━━━━━━━━━━━
Halat: ${db.enabled ? 'ON 🟢' : 'OFF 🔴'}
AI intent: ${db.aiEnabled ? 'ON 🤖' : 'OFF'}
Keyword rules: *${db.rules.length}*
Serve hue log: *${people}*
Kul jawab: *${db.stats.total}* (keyword: ${db.stats.keyword}, AI: ${db.stats.ai})
Business info: ${db.biz ? 'set hai ✅' : 'nahi di ❌ (.jadoobiz)'}

${HELP.split('\n').slice(6).join('\n')}`);
        }
    },
    {
        name: 'jadooadd',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
            const raw = args.join(' ').trim();
            const bits = raw.split('|').map(s => s.trim());
            const keyword = (bits[0] || '').trim();
            const reply = bits.slice(1).join(' | ').trim();
            if (!keyword || !reply) return send('❌ Format: `.jadooadd GUIDE | <jawab — link ke sath>`\nMisal: `.jadooadd PRICE | Hamari rate list ye hai: ...`');
            const db = load();
            const key = normText(keyword);
            const existing = db.rules.find(r => normText(r.keyword) === key);
            if (existing) { existing.reply = reply; existing.keyword = keyword.toUpperCase(); }
            else db.rules.push({ keyword: keyword.toUpperCase(), reply, created: Date.now() });
            save(db);
            return send(`✅ Keyword *${keyword.toUpperCase()}* ${existing ? 'update' : 'add'} ho gaya.\n\nAb koi DM mein "${keyword}" likhe ga to ye jawab jayega:\n\n${reply}`);
        }
    },
    {
        name: 'jadoodel',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
            const keyword = args.join(' ').trim();
            if (!keyword) return send('❌ Format: `.jadoodel GUIDE`');
            const db = load();
            const before = db.rules.length;
            db.rules = db.rules.filter(r => normText(r.keyword) !== normText(keyword));
            if (db.rules.length === before) return send(`❌ "${keyword}" wala rule nahi mila.`);
            save(db);
            return send(`🗑️ Keyword *${keyword.toUpperCase()}* delete ho gaya.`);
        }
    },
    {
        name: 'jadoolist',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const db = load();
            if (!db.rules.length) return sock.sendMessage(jid, { text: '🪄 Abhi koi keyword rule nahi.\nAdd karo: `.jadooadd GUIDE | <jawab>`' }, { quoted: m });
            let txt = '🪄 *JADOO KEYWORDS*\n━━━━━━━━━━━━━━━';
            db.rules.forEach((r, i) => { txt += `\n\n${i + 1}. *${r.keyword}*\n${r.reply.slice(0, 140)}${r.reply.length > 140 ? '…' : ''}`; });
            txt += '\n\n━━━━━━━━━━━━━━━\nNaya: `.jadooadd KEY | jawab`';
            return sock.sendMessage(jid, { text: txt }, { quoted: m });
        }
    },
    {
        name: 'jadoobiz',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
            const db = load();
            const info = args.join(' ').trim();
            if (!info) {
                return send(db.biz
                    ? `🏢 *Business Info (AI ke liye)*\n━━━━━━━━━━━━━━━\n${db.biz}\n\nBadalne ke liye: \`.jadoobiz <nayi info>\`\nSaaf karne ke liye: \`.jadoobiz clear\``
                    : '🏢 Abhi business info set nahi.\n\nAI ko apne business ki maloomat do, taake wo customers ko sahi jawab de:\n`.jadoobiz MALIK Services — WhatsApp bot setup Rs 15,000, monthly Rs 2,500. Website Rs 20,000 se. Timing subah 9 se raat 10.`');
            }
            if (info.toLowerCase() === 'clear') { db.biz = ''; save(db); return send('🗑️ Business info saaf kar di.'); }
            db.biz = info.slice(0, 2000);
            save(db);
            return send('✅ *Business info save ho gayi.*\nAb AI isi base par customers ko jawab dega — is se bahar ki maloomat invent nahi karega.');
        }
    },
    {
        name: 'jadoostats',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const db = load();
            const people = Object.entries(db.served);
            let txt =
`🪄 *JADOO STATS*
━━━━━━━━━━━━━━━
Kul jawab bheje: *${db.stats.total}*
├ Keyword par: ${db.stats.keyword}
└ AI intent par: ${db.stats.ai}
Alag log serve hue: *${people.length}*
Active rules: *${db.rules.length}*`;
            if (people.length) {
                txt += '\n\n*Recent log:*';
                people.slice(-10).reverse().forEach(([num, kws]) => {
                    txt += `\n• ${num} → ${Object.keys(kws).join(', ')}`;
                });
            }
            txt += '\n\nKisi ek ko dobara serve karna ho: `.jadooreset <number>`';
            return sock.sendMessage(jid, { text: txt }, { quoted: m });
        }
    },
    {
        name: 'jadooreset',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
            const target = (args[0] || '').trim();
            if (!target) return send('❌ Format: `.jadooreset all` ya `.jadooreset 923xxxxxxxxx`');
            const db = load();
            if (target.toLowerCase() === 'all') {
                db.served = {}; db.stats = { keyword: 0, ai: 0, total: 0 };
                save(db);
                return send('🧹 Poora dedupe log + stats saaf kar diye. Ab sab ko dobara serve ho sakega.');
            }
            const num = target.replace(/\D/g, '');
            if (db.served[num]) { delete db.served[num]; save(db); return send(`🧹 ${num} ka record saaf — ab usay dobara jawab ja sakega.`); }
            return send(`❌ ${num} ka koi record nahi mila.`);
        }
    }
];
