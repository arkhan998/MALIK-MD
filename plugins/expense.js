const fs = require('fs');
const path = require('path');

// ======================================================
// EXPENSE / INCOME — roz ka khata (owner-only)
// .expense 500 petrol          -> kharcha
// .expense in 5000 sale        -> aamdani
// .expense today               -> aaj ka hisaab
// .expense month               -> is month ka hisaab
// ======================================================

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'expenses.json');

function load() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        if (!fs.existsSync(FILE)) return [];
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch (e) { return []; }
}
function save(d) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
    } catch (e) {}
}
const rs = (n) => 'Rs ' + Number(n).toLocaleString('en-PK');
const pktDate = (ts) => new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }); // YYYY-MM-DD
const pktMonth = (ts) => pktDate(ts).slice(0, 7);

function summary(list, label) {
    const inSum = list.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0);
    const outSum = list.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);
    let txt = `📒 *${label}*\n━━━━━━━━━━━━━━━\n` +
        `🟢 Aamdani: *${rs(inSum)}*\n` +
        `🔴 Kharcha: *${rs(outSum)}*\n` +
        `💰 Balance: *${rs(inSum - outSum)}*\n`;
    const last = list.slice(-8);
    if (last.length) {
        txt += `━━━━━━━━━━━━━━━\n`;
        last.forEach(e => { txt += `\n${e.type === 'in' ? '🟢' : '🔴'} ${rs(e.amount)} — ${e.note}`; });
    }
    return txt;
}

module.exports = {
    name: 'expense',
    alias: ['kharcha', 'khata'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        try {
            const sub = (args[0] || '').toLowerCase();

            if (sub === 'today') {
                const today = pktDate(Date.now());
                return sock.sendMessage(jid, { text: summary(load().filter(e => pktDate(e.ts) === today), 'Aaj ka Hisaab — ' + today) }, { quoted: m });
            }
            if (sub === 'month') {
                const mon = pktMonth(Date.now());
                return sock.sendMessage(jid, { text: summary(load().filter(e => pktMonth(e.ts) === mon), 'Is Month ka Hisaab — ' + mon) }, { quoted: m });
            }

            let type = 'out', rest = args;
            if (sub === 'in' || sub === 'addin') { type = 'in'; rest = args.slice(1); }
            const amount = parseFloat(rest[0]);
            const note = rest.slice(1).join(' ') || (type === 'in' ? 'Aamdani' : 'Kharcha');
            if (isNaN(amount) || amount <= 0) {
                return sock.sendMessage(jid, {
                    text: `📒 *Roz ka Khata (Owner)*\n\n🔴 Kharcha: \`.expense 500 petrol\`\n🟢 Aamdani: \`.expense in 5000 sale\`\n📅 Aaj: \`.expense today\`\n🗓️ Month: \`.expense month\``
                }, { quoted: m });
            }
            const list = load();
            list.push({ type, amount, note, ts: Date.now() });
            save(list);
            const today = pktDate(Date.now());
            const t = list.filter(e => pktDate(e.ts) === today);
            const bal = t.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0) - t.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);
            await sock.sendMessage(jid, { text: `${type === 'in' ? '🟢 Aamdani' : '🔴 Kharcha'} darj: *${rs(amount)}* — ${note}\n💰 Aaj ka balance: *${rs(bal)}*` }, { quoted: m });
        } catch (e) {
            console.error('expense error:', e.message);
            await sock.sendMessage(jid, { text: '❌ Entry darj nahi ho saki.' }, { quoted: m });
        }
    }
};
