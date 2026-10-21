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
// STAFF ATTENDANCE — .att in Name | .att out Name
// .att list (aaj) | .att month Name
// Owner-only. Data: data/attendance.json
// ======================================================
const FILE = 'attendance.json';
const timeNow = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' });

module.exports = {
    name: 'att',
    alias: ['haazri', 'attendance'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
        const db = load(FILE, { list: [] });
        const sub = (args[0] || '').toLowerCase();
        const d = today();
        try {
            if (!args.length || sub === 'list') {
                const rows = db.list.filter(x => x.date === d);
                if (!rows.length) return send('🗓️ *Aaj ki Haazri*\n\nAaj abhi kisi ki entry nahi.\n`.att in Naam` se lagao.');
                let txt = `🗓️ *AAJ KI HAAZRI* (${d})\n━━━━━━━━━━━━━━━`;
                rows.forEach((x, i) => { txt += `\n${i + 1}. *${x.name}*\n   🟢 In: ${x.inTime}${x.outTime ? `\n   🔴 Out: ${x.outTime}` : '\n   ⏳ Abhi andar hai'}`; });
                return send(txt);
            }
            if (sub === 'in' || sub === 'out') {
                const name = args.slice(1).join(' ');
                if (!name) return send('❌ Naam lazmi hai. `.att in Ahmed`');
                let x = db.list.find(r => r.date === d && r.name.toLowerCase() === name.toLowerCase());
                if (sub === 'in') {
                    if (x) return send(`❌ *${name}* ki entry aaj pehle se lagi hai (${x.inTime}).`);
                    x = { name, date: d, inTime: timeNow(), outTime: '' };
                    db.list.push(x); save(FILE, db);
                    return send(`🟢 *${name}* — Haazir!\n⏰ In time: ${x.inTime} (${d})`);
                }
                if (!x) return send(`❌ *${name}* ki aaj koi IN entry nahi. Pehle \`.att in ${name}\` lagao.`);
                if (x.outTime) return send(`❌ *${name}* ka OUT pehle se laga hai (${x.outTime}).`);
                x.outTime = timeNow(); save(FILE, db);
                return send(`🔴 *${name}* — Rukhsat\n⏰ Out time: ${x.outTime} (In: ${x.inTime})`);
            }
            if (sub === 'month') {
                const name = args.slice(1).join(' ');
                const parts = d.split('/');
                const rows = db.list.filter(x => { const p = x.date.split('/'); return p[1] === parts[1] && p[2] === parts[2] && x.name.toLowerCase() === name.toLowerCase(); });
                return send(`🗓️ *${name}* — is mahine ki haazri: *${rows.length} din*\n${rows.map(x => `• ${x.date} — ${x.inTime}${x.outTime ? ' → ' + x.outTime : ''}`).join('\n') || 'Koi record nahi.'}`);
            }
            return send('🗓️ *Attendance*\n\n`.att in Naam` — entry\n`.att out Naam` — rukhsat\n`.att list` — aaj ki list\n`.att month Naam` — mahine ka record');
        } catch (e) {
            console.error('att error:', e.message);
            return send('❌ Attendance mein masla aya.');
        }
    }
};
