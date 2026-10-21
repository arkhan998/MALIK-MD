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
// UDHAAR BOOK — .due
// .due add Ahmed 5000 [note] | .due Ahmed 5000 (shortcut)
// .due pay Ahmed 2000 | .due list | .due check Ahmed | .due del Ahmed
// Owner-only. Data: data/dues.json
// ======================================================
const FILE = 'dues.json';
const findC = (db, name) => db.list.find(x => x.name.toLowerCase() === String(name).toLowerCase());

module.exports = {
    name: 'due',
    alias: ['udhaar', 'dues'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
        const db = load(FILE, { list: [] });
        const sub = (args[0] || '').toLowerCase();
        try {
            if (!args.length || sub === 'list') {
                if (!db.list.length) return send('📒 *Udhaar Book*\n\nAbhi kisi ka udhaar nahi. Alhamdulillah! 😄');
                let total = 0, txt = '📒 *UDHAAR BOOK*\n━━━━━━━━━━━━━━━';
                db.list.forEach((x, i) => { total += x.balance; txt += `\n${i + 1}. *${x.name}* — ${rs(x.balance)}${x.note ? `\n   📝 ${x.note}` : ''}`; });
                txt += `\n━━━━━━━━━━━━━━━\n💰 *Total Udhaar: ${rs(total)}*`;
                return send(txt);
            }
            if (sub === 'help') return send('📒 *Udhaar Book*\n\n`.due add Naam 5000` — naya udhaar\n`.due Naam 5000` — shortcut\n`.due pay Naam 2000` — adaigi\n`.due list` — sab ka hisaab\n`.due check Naam` — ek bande ka\n`.due del Naam` — hata do');
            if (sub === 'check') {
                const name = args.slice(1).join(' ');
                const x = findC(db, name);
                if (!x) return send(`❌ "${name}" ka koi udhaar nahi mila.`);
                return send(`📒 *${x.name}*\n💰 Udhaar: *${rs(x.balance)}*\n📅 Last update: ${x.updated}${x.note ? `\n📝 ${x.note}` : ''}`);
            }
            if (sub === 'del') {
                const name = args.slice(1).join(' ');
                const i = db.list.findIndex(x => x.name.toLowerCase() === name.toLowerCase());
                if (i < 0) return send(`❌ "${name}" book mein nahi hai.`);
                db.list.splice(i, 1); save(FILE, db);
                return send(`✅ *${name}* udhaar book se hata diya.`);
            }
            if (sub !== 'add' && sub !== 'pay') return module.exports.exec(sock, m, ['add', ...args]);
            const rest = args.slice(1);
            const ai = rest.findIndex(t => !isNaN(parseFloat(t)) && parseFloat(t) > 0);
            if (ai < 0) return send('❌ Amount nahi mila.\nFormat: `.due add Ahmed 5000`');
            const amount = parseFloat(rest[ai]);
            const name = rest.slice(0, ai).join(' ');
            const note = rest.slice(ai + 1).join(' ');
            if (!name) return send('❌ Naam lazmi hai.\nFormat: `.due add Ahmed 5000`');
            let x = findC(db, name);
            if (!x) { x = { name, balance: 0, note: '', updated: today() }; db.list.push(x); }
            if (sub === 'add') x.balance += amount; else x.balance = Math.max(0, x.balance - amount);
            if (note) x.note = note;
            x.updated = today();
            if (sub === 'pay' && x.balance <= 0) {
                db.list = db.list.filter(y => y !== x); save(FILE, db);
                return send(`🎉 *${name}* ka udhaar mukammal ada ho gaya! Book se hata diya.`);
            }
            save(FILE, db);
            return send(`✅ *${name}*\n${sub === 'add' ? '➕ Udhaar jama' : '➖ Adaigi'}: ${rs(amount)}\n💰 *Baaki Udhaar: ${rs(x.balance)}*`);
        } catch (e) {
            console.error('due error:', e.message);
            return send('❌ Udhaar book mein masla aya. Dobara koshish karo.');
        }
    }
};
