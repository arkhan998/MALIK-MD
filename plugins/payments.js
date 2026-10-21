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
// PAYMENT DETAILS — .payinfo (customer ko bhejne wali card)
// .payset jazzcash 0321-1234567 | Malik Atta
// .payset easypaisa 0345-7654321 | Malik Atta
// .payset bank Meezan Bank | IBAN: PK36....
// Owner-only. Data: data/payments.json
// ======================================================
const FILE = 'payments.json';
const LABELS = { jazzcash: '🟢 JazzCash', easypaisa: '🟢 Easypaisa', bank: '🏦 Bank Transfer' };

module.exports = {
    name: 'payinfo',
    alias: ['payset', 'payment'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
        const db = load(FILE, {});
        const rawTxt = (m.message && (m.message.conversation || (m.message.extendedTextMessage || {}).text)) || '';
        const used = rawTxt.trim().split(/\s+/)[0].toLowerCase().replace(/^\./, '');
        try {
            if (used === 'payset') {
                const method = (args[0] || '').toLowerCase();
                const detail = args.slice(1).join(' ').trim();
                if (!LABELS[method] || !detail) return send('💳 *Payment Set Karna*\n\n`.payset jazzcash 0321-1234567 | Malik Atta`\n`.payset easypaisa 0345-7654321 | Malik Atta`\n`.payset bank Meezan Bank | IBAN: PK36...`');
                db[method] = detail;
                save(FILE, db);
                return send(`✅ ${LABELS[method]} save ho gaya:\n${detail}\n\nAb \`.payinfo\` bhej kar card dikhao.`);
            }
            const keys = Object.keys(LABELS).filter(k => db[k]);
            if (!keys.length) return send('💳 *Payment Details*\n\nAbhi koi payment method set nahi.\nPehle set karo:\n`.payset jazzcash 03xx-xxxxxxx | Tumhara Naam`');
            let txt = '💳 *PAYMENT DETAILS*\n━━━━━━━━━━━━━━━\nPayment in mein se kisi par bhej dein:';
            keys.forEach(k => { txt += `\n\n${LABELS[k]}\n${db[k]}`; });
            txt += '\n\n━━━━━━━━━━━━━━━\n📸 Payment ke baad *screenshot* isi number par bhej dein. Shukriya! 🙏';
            return send(txt);
        } catch (e) {
            console.error('payinfo error:', e.message);
            return send('❌ Payment details mein masla aya.');
        }
    }
};
