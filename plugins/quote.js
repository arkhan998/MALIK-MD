const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
function load(file, def) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        const f = path.join(DATA_DIR, file);
        if (!fs.existsSync(f)) return def;
        return JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch (e) { return def; }
}
function save(file, d) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(d, null, 2));
    } catch (e) {}
}
const rs = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');
const today = () => new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi' });

// ======================================================
// QUOTATION — .quote Customer | Item, qty, rate | ...
// Invoice se pehle ka estimate. Number QTN-0001 se.
// Owner-only. Data: data/quotes.json
// ======================================================
const FILE = 'quotes.json';
const config = require('../config.js');

module.exports = {
    name: 'quote',
    alias: ['quotation', 'estimate'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
        const raw = args.join(' ').trim();
        if (!raw || !raw.includes('|')) return send('📋 *Quotation Banana*\n\nFormat:\n`.quote Customer | Item, qty, rate | Item2, qty, rate`\n\nMisal:\n`.quote Ahmed Traders | Black Ink, 10, 450 | Solvent, 5, 800`');
        try {
            const parts = raw.split('|').map(s => s.trim()).filter(Boolean);
            const customer = parts[0];
            const items = [];
            let total = 0;
            for (const p of parts.slice(1)) {
                const bits = p.split(',').map(s => s.trim());
                const nm = bits[0];
                const qty = parseFloat(bits[1]) || 1;
                const rate = parseFloat(bits[2]) || 0;
                if (!nm || rate <= 0) return send(`❌ Item sahi nahi: "${p}"\nFormat: Item, qty, rate`);
                const amt = qty * rate; total += amt;
                items.push({ name: nm, qty, rate, amt });
            }
            if (!items.length) return send('❌ Koi item nahi mila. Format check karo.');
            const db = load(FILE, { next: 1, list: [] });
            const no = 'QTN-' + String(db.next).padStart(4, '0');
            db.next += 1;
            db.list.push({ no, customer, items, total, date: today() });
            save(FILE, db);
            let txt = `📋 *QUOTATION*\n━━━━━━━━━━━━━━━\n🏢 *${config.OWNER_NAME || 'MALIK'}*\n🔢 Estimate No: *${no}*\n📅 Date: ${today()}\n👤 Customer: *${customer}*\n━━━━━━━━━━━━━━━`;
            items.forEach((it, i) => { txt += `\n${i + 1}. *${it.name}*\n    ${it.qty} × ${rs(it.rate)} = *${rs(it.amt)}*`; });
            txt += `\n━━━━━━━━━━━━━━━\n💰 *TOTAL ESTIMATE: ${rs(total)}*\n━━━━━━━━━━━━━━━\n\n_Ye sirf estimate hai. Final rate order confirm honay par tay hoga._\n⏳ Validity: 7 din\n\nShukriya! 🙏`;
            return send(txt);
        } catch (e) {
            console.error('quote error:', e.message);
            return send('❌ Quotation nahi ban saka. Format check karo.');
        }
    }
};
