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
// CUSTOMER BOOK — .cust
// .cust add Ahmed Traders | 0321-1234567 | Lahore
// .cust list | .cust find ahmed | .cust del Ahmed Traders
// Owner-only. Data: data/customers.json
// ======================================================
const FILE = 'customers.json';

module.exports = {
    name: 'cust',
    alias: ['custs', 'customer', 'customers'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
        const db = load(FILE, { list: [] });
        const sub = (args[0] || '').toLowerCase();
        try {
            if (!args.length || sub === 'list') {
                if (!db.list.length) return send('👥 *Customer Book*\n\nAbhi koi customer nahi.\nAdd karo: `.cust add Naam | Number | Sheher`');
                let txt = `👥 *CUSTOMER BOOK* (${db.list.length})\n━━━━━━━━━━━━━━━`;
                db.list.forEach((x, i) => { txt += `\n${i + 1}. *${x.name}*\n   📞 ${x.phone || '-'}${x.address ? `\n   📍 ${x.address}` : ''}`; });
                return send(txt);
            }
            if (sub === 'add') {
                const raw = args.slice(1).join(' ');
                const parts = raw.split('|').map(s => s.trim());
                if (!parts[0]) return send('❌ Format: `.cust add Naam | Number | Sheher`');
                if (db.list.some(x => x.name.toLowerCase() === parts[0].toLowerCase())) return send(`❌ *${parts[0]}* pehle se book mein hai.`);
                db.list.push({ name: parts[0], phone: parts[1] || '', address: parts[2] || '', date: today() });
                save(FILE, db);
                return send(`✅ Customer add ho gaya:\n👤 *${parts[0]}*\n📞 ${parts[1] || '-'}${parts[2] ? `\n📍 ${parts[2]}` : ''}`);
            }
            if (sub === 'find') {
                const q = args.slice(1).join(' ').toLowerCase();
                const hits = db.list.filter(x => x.name.toLowerCase().includes(q) || (x.phone || '').includes(q));
                if (!hits.length) return send(`❌ "${q}" nahi mila.`);
                let txt = '🔍 *Result:*';
                hits.forEach(x => { txt += `\n\n👤 *${x.name}*\n📞 ${x.phone || '-'}${x.address ? `\n📍 ${x.address}` : ''}`; });
                return send(txt);
            }
            if (sub === 'del') {
                const name = args.slice(1).join(' ');
                const i = db.list.findIndex(x => x.name.toLowerCase() === name.toLowerCase());
                if (i < 0) return send(`❌ "${name}" book mein nahi hai.`);
                db.list.splice(i, 1); save(FILE, db);
                return send(`✅ *${name}* customer book se hata diya.`);
            }
            return send('👥 *Customer Book*\n\n`.cust add Naam | Number | Sheher`\n`.cust list` — sab customers\n`.cust find ahmed` — dhoondo\n`.cust del Naam` — hata do');
        } catch (e) {
            console.error('cust error:', e.message);
            return send('❌ Customer book mein masla aya.');
        }
    }
};
