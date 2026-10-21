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
// MONTHLY TARGET — .target set 300000 | .target (progress)
// Progress invoices.json ki is mahine ki sales se banta hai.
// Owner-only. Data: data/target.json
// ======================================================
const FILE = 'target.json';

module.exports = {
    name: 'target',
    alias: ['targetset', 'mahina'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
        try {
            const db = load(FILE, { amount: 0 });
            if ((args[0] || '').toLowerCase() === 'set') {
                const amt = parseFloat(args[1]);
                if (!amt || amt <= 0) return send('🎯 Format: `.target set 300000`');
                db.amount = amt; save(FILE, db);
                return send(`🎯 Is mahine ka target set ho gaya: *${rs(amt)}*\nAb \`.target\` se progress dekho.`);
            }
            if (!db.amount) return send('🎯 *Monthly Target*\n\nAbhi target set nahi.\n`.target set 300000` likho.');
            const inv = load('invoices.json', { list: [] });
            const dp = today().split('/');
            const mine = inv.list.filter(x => { const p = String(x.date || '').split('/'); return p[1] === dp[1] && p[2] === dp[2]; });
            const sales = mine.reduce((s, x) => s + (x.total || 0), 0);
            const pct = Math.min(100, Math.floor((sales / db.amount) * 100));
            const filled = Math.round(pct / 10);
            const bar = '▓'.repeat(filled) + '░'.repeat(10 - filled);
            const nowP = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
            const daysInMonth = new Date(nowP.getFullYear(), nowP.getMonth() + 1, 0).getDate();
            const daysLeft = daysInMonth - nowP.getDate() + 1;
            const remain = Math.max(0, db.amount - sales);
            let txt = `🎯 *MONTHLY TARGET*\n━━━━━━━━━━━━━━━\n🎯 Target: ${rs(db.amount)}\n💰 Ab tak sales: *${rs(sales)}* (${mine.length} invoices)\n\n${bar} *${pct}%*\n\n📌 Baaki: *${rs(remain)}*\n📅 Mahine ke baaki din: ${daysLeft}`;
            if (remain > 0) txt += `\n⚡ Roz ka hisaab: *${rs(Math.ceil(remain / daysLeft))}/din* chahiye`;
            else txt += '\n\n🎉 *TARGET PURA! Mubarak ho!*';
            return send(txt);
        } catch (e) {
            console.error('target error:', e.message);
            return send('❌ Target nahi khul saka.');
        }
    }
};
