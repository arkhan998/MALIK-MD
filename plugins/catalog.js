const fs = require('fs');
const path = require('path');

// ======================================================
// PRICE CATALOG — dukaan ki rate list
// .catalog              -> poori price list (koi bhi dekh sakta hai)
// .catalogadd Item | price | unit    (owner)
// .catalogdel Item                   (owner)
// ======================================================

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'catalog.json');

function load() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        if (!fs.existsSync(FILE)) return [];
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch (e) { return []; }
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
        name: 'catalog',
        alias: ['pricelist', 'prices', 'ratelist'],
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const items = load();
            if (!items.length) {
                return sock.sendMessage(jid, { text: '📋 *Price List*\n\nAbhi koi item nahi hai.\nOwner add kare: `.catalogadd Item | price | unit`' }, { quoted: m });
            }
            let txt = `📋 *PRICE LIST*\n━━━━━━━━━━━━━━━\n`;
            items.forEach((it, i) => { txt += `\n${i + 1}. *${it.name}*\n    💰 ${rs(it.price)}${it.unit ? ' / ' + it.unit : ''}`; });
            txt += `\n━━━━━━━━━━━━━━━\n_Order ke liye reply karein._`;
            await sock.sendMessage(jid, { text: txt }, { quoted: m });
        }
    },
    {
        name: 'catalogadd',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const raw = args.join(' ').trim();
            const bits = raw.split('|').map(s => s.trim());
            const name = bits[0];
            const price = parseFloat(bits[1]);
            const unit = bits[2] || '';
            if (!name || isNaN(price)) {
                return sock.sendMessage(jid, { text: '❌ Format: `.catalogadd Item | price | unit`\nMisal: `.catalogadd Black Ink | 450 | litre`' }, { quoted: m });
            }
            const items = load();
            const existing = items.find(i => i.name.toLowerCase() === name.toLowerCase());
            if (existing) { existing.price = price; existing.unit = unit; }
            else items.push({ name, price, unit });
            save(items);
            await sock.sendMessage(jid, { text: `✅ *${name}* — ${rs(price)}${unit ? ' / ' + unit : ''} list mein ${existing ? 'update' : 'add'} ho gaya.` }, { quoted: m });
        }
    },
    {
        name: 'catalogdel',
        ownerOnly: true,
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const name = args.join(' ').trim().toLowerCase();
            if (!name) return sock.sendMessage(jid, { text: '❌ Format: `.catalogdel Item ka naam`' }, { quoted: m });
            let items = load();
            const before = items.length;
            items = items.filter(i => i.name.toLowerCase() !== name);
            if (items.length === before) return sock.sendMessage(jid, { text: `❌ "${args.join(' ')}" list mein nahi mila.` }, { quoted: m });
            save(items);
            await sock.sendMessage(jid, { text: `🗑️ *${args.join(' ')}* price list se hata diya.` }, { quoted: m });
        }
    }
];
