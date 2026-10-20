const fs = require('fs');
const path = require('path');

// ======================================================
// ORDER BOOK — orders sambhalo (owner-only)
// .order Ahmed | 10 Black Ink | 4500     -> naya order
// .orders                                -> pending orders
// .orderdone 1                           -> order #1 mukammal
// .ordercancel 1                         -> order #1 cancel
// ======================================================

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'orders.json');

function load() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        if (!fs.existsSync(FILE)) return { next: 1, list: [] };
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch (e) { return { next: 1, list: [] }; }
}
function save(d) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
    } catch (e) {}
}
const rs = (n) => 'Rs ' + Number(n).toLocaleString('en-PK');

module.exports = [
    {
        name: 'order',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const raw = args.join(' ').trim();
            const bits = raw.split('|').map(s => s.trim());
            if (bits.length < 2 || !bits[0] || !bits[1]) {
                return sock.sendMessage(jid, { text: '🧾 *Naya Order*\n\nFormat:\n`.order Customer | Items | Amount`\n\nMisal:\n`.order Ahmed Traders | 10 Black Ink | 4500`' }, { quoted: m });
            }
            const db = load();
            const id = db.next++;
            const amount = parseFloat(bits[2]) || 0;
            db.list.push({ id, customer: bits[0], items: bits[1], amount, status: 'pending', date: new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi' }) });
            save(db);
            await sock.sendMessage(jid, { text: `✅ *Order #${id} darj ho gaya!*\n\n👤 ${bits[0]}\n📦 ${bits[1]}${amount ? `\n💰 ${rs(amount)}` : ''}\n📌 Status: *Pending*` }, { quoted: m });
        }
    },
    {
        name: 'orders',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const db = load();
            const pending = db.list.filter(o => o.status === 'pending');
            if (!pending.length) return sock.sendMessage(jid, { text: '📦 Koi pending order nahi hai. Sab clear! ✅' }, { quoted: m });
            let txt = `📦 *PENDING ORDERS (${pending.length})*\n━━━━━━━━━━━━━━━`;
            pending.forEach(o => { txt += `\n\n*#${o.id}* — ${o.customer}\n📦 ${o.items}${o.amount ? `\n💰 ${rs(o.amount)}` : ''}\n📅 ${o.date}`; });
            txt += `\n━━━━━━━━━━━━━━━\n_Mukammal karne ke liye: .orderdone <number>_`;
            await sock.sendMessage(jid, { text: txt }, { quoted: m });
        }
    },
    {
        name: 'orderdone',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const id = parseInt(args[0]);
            const db = load();
            const o = db.list.find(x => x.id === id && x.status === 'pending');
            if (!o) return sock.sendMessage(jid, { text: `❌ Pending order #${args[0]} nahi mila. \`.orders\` se list dekho.` }, { quoted: m });
            o.status = 'done';
            save(db);
            await sock.sendMessage(jid, { text: `✅ Order *#${id}* (${o.customer}) mukammal ho gaya! 🎉` }, { quoted: m });
        }
    },
    {
        name: 'ordercancel',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const id = parseInt(args[0]);
            const db = load();
            const o = db.list.find(x => x.id === id && x.status === 'pending');
            if (!o) return sock.sendMessage(jid, { text: `❌ Pending order #${args[0]} nahi mila.` }, { quoted: m });
            o.status = 'cancelled';
            save(db);
            await sock.sendMessage(jid, { text: `🚫 Order *#${id}* (${o.customer}) cancel kar diya.` }, { quoted: m });
        }
    }
];
