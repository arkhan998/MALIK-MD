const fs = require('fs');
const path = require('path');
const config = require('../config.js');

// ======================================================
// INVOICE — .invoice Customer | Item, qty, rate | ...
// Misal: .invoice Ahmed Traders | Black Ink, 10, 450 | Solvent, 5, 800
// Owner-only. Invoice number khud barhta hai.
// ======================================================

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'invoices.json');

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

module.exports = {
    name: 'invoice',
    alias: ['billbanao', 'receipt'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const raw = args.join(' ').trim();
        if (!raw || !raw.includes('|')) {
            return sock.sendMessage(jid, {
                text: `🧾 *Invoice Banana*\n\nFormat:\n\`.invoice Customer | Item, qty, rate | Item2, qty, rate\`\n\nMisal:\n\`.invoice Ahmed Traders | Black Ink, 10, 450 | Washing Solvent, 5, 800\``
            }, { quoted: m });
        }
        try {
            const parts = raw.split('|').map(s => s.trim()).filter(Boolean);
            const customer = parts[0];
            const items = [];
            let total = 0;
            for (const p of parts.slice(1)) {
                const bits = p.split(',').map(s => s.trim());
                const name = bits[0];
                const qty = parseFloat(bits[1]) || 1;
                const rate = parseFloat(bits[2]) || 0;
                if (!name || rate <= 0) return sock.sendMessage(jid, { text: `❌ Item sahi nahi: "${p}"\nFormat: Item, qty, rate` }, { quoted: m });
                const amt = qty * rate;
                total += amt;
                items.push({ name, qty, rate, amt });
            }
            if (!items.length) return sock.sendMessage(jid, { text: '❌ Koi item nahi mila. Format check karo.' }, { quoted: m });

            const db = load();
            const no = 'INV-' + String(db.next).padStart(4, '0');
            db.next += 1;
            const date = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi' });
            db.list.push({ no, customer, items, total, date });
            save(db);

            let txt = `🧾 *INVOICE*\n` +
                `━━━━━━━━━━━━━━━\n` +
                `🏢 *${config.OWNER_NAME}*\n` +
                `🔢 Invoice No: *${no}*\n` +
                `📅 Date: ${date}\n` +
                `👤 Customer: *${customer}*\n` +
                `━━━━━━━━━━━━━━━\n`;
            items.forEach((it, i) => {
                txt += `\n${i + 1}. *${it.name}*\n    ${it.qty} × ${rs(it.rate)} = *${rs(it.amt)}*`;
            });
            txt += `\n━━━━━━━━━━━━━━━\n💰 *TOTAL: ${rs(total)}*\n━━━━━━━━━━━━━━━\n\n_Shukriya! Aap ke business ka shukrana._ 🙏`;

            await sock.sendMessage(jid, { text: txt }, { quoted: m });
        } catch (e) {
            console.error('invoice error:', e.message);
            await sock.sendMessage(jid, { text: '❌ Invoice nahi ban saka. Format dobara check karo.' }, { quoted: m });
        }
    }
};
