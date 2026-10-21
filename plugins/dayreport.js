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
// DAILY REPORT — .report
// Aaj ki sales, orders, cash in/out aur udhaar ka khulasa.
// Invoices + Orders + Expenses + Dues files se banta hai.
// Owner-only.
// ======================================================
module.exports = {
    name: 'report',
    alias: ['dayreport', 'rozreport'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
        try {
            const d = today();
            const inv = load('invoices.json', { list: [] });
            const ord = load('orders.json', { list: [] });
            const exp = load('expenses.json', { list: [] });
            const due = load('dues.json', { list: [] });
            const tInv = inv.list.filter(x => x.date === d);
            const sales = tInv.reduce((s, x) => s + (x.total || 0), 0);
            const tOrd = ord.list.filter(x => x.date === d);
            const pend = ord.list.filter(x => x.status === 'pending').length;
            let cin = 0, cout = 0;
            exp.list.forEach(x => {
                const xd = new Date(x.ts).toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi' });
                if (xd === d) { if (x.type === 'in') cin += x.amount || 0; else cout += x.amount || 0; }
            });
            const udhaarTotal = due.list.reduce((s, x) => s + (x.balance || 0), 0);
            const txt = `📊 *AAJ KI REPORT* — ${d}\n━━━━━━━━━━━━━━━\n🧾 Sales (Invoices): *${rs(sales)}* (${tInv.length} bill)\n📦 Orders aaj: *${tOrd.length}* — pending kul: ${pend}\n━━━━━━━━━━━━━━━\n💵 Cash IN: ${rs(cin)}\n💸 Kharcha OUT: ${rs(cout)}\n🏦 Net Cash: *${rs(cin - cout)}*\n━━━━━━━━━━━━━━━\n📒 Kul Udhaar (baaki): *${rs(udhaarTotal)}*`;
            return send(txt);
        } catch (e) {
            console.error('report error:', e.message);
            return send('❌ Report nahi ban saki.');
        }
    }
};
