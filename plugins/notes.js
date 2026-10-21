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
// OWNER NOTES — .note kuch bhi likho | .notes | .note del 2
// Owner-only. Data: data/notes.json
// ======================================================
const FILE = 'notes.json';

module.exports = {
    name: 'note',
    alias: ['notes'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
        const db = load(FILE, { list: [] });
        const rawTxt = (m.message && (m.message.conversation || (m.message.extendedTextMessage || {}).text)) || '';
        const used = rawTxt.trim().split(/\s+/)[0].toLowerCase().replace(/^\./, '');
        try {
            if (used === 'notes' || (args[0] || '').toLowerCase() === 'list') {
                if (!db.list.length) return send('🗒️ *Notes*\n\nAbhi koi note nahi.\n`.note kal supplier ko call karni hai` likho.');
                let txt = '🗒️ *TUMHARE NOTES*\n━━━━━━━━━━━━━━━';
                db.list.forEach((x, i) => { txt += `\n${i + 1}. ${x.text}\n   📅 ${x.date}`; });
                return send(txt);
            }
            if ((args[0] || '').toLowerCase() === 'del') {
                const i = parseInt(args[1]) - 1;
                if (isNaN(i) || !db.list[i]) return send('❌ Sahi number do: `.note del 2`');
                const gone = db.list.splice(i, 1)[0];
                save(FILE, db);
                return send(`🗑️ Note hata diya:\n"${gone.text}"`);
            }
            const text = args.join(' ').trim();
            if (!text) return send('🗒️ *Notes*\n\n`.note apna khayal likho` — save ho jayega\n`.notes` — sab notes\n`.note del 2` — hata do');
            db.list.push({ text, date: today() });
            save(FILE, db);
            return send(`✅ Note save ho gaya (#${db.list.length}):\n"${text}"`);
        } catch (e) {
            console.error('note error:', e.message);
            return send('❌ Note save nahi hua.');
        }
    }
};
