const fs = require('fs');
const path = require('path');
const config = require('../config.js');

// ======================================================
// BILL — photo invoice (image card)
// .bill Customer | Item, qty, rate | ...   -> naya invoice
//    + usi waqt tasveer wala bill bhej deta hai
// .bill              -> sab se akhri invoice ki photo
// .bill INV-0003     -> us number ke invoice ki photo
// Data .invoice wala hi hai: data/invoices.json
// Owner-only (.invoice ki tarah).
// ======================================================

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'invoices.json');
function load() { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return { next: 1, list: [] }; } }
function save(d) { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); } catch (e) {} }
const rs = (n) => 'Rs ' + Number(n).toLocaleString('en-PK');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 60);

async function renderBill(inv) {
    const sharp = require('sharp');
    const W = 880;
    const rowH = 54;
    const headH = 150, metaH = 118, tableHeadH = 46, totalH = 92, footH = 64;
    const H = headH + metaH + tableHeadH + inv.items.length * rowH + totalH + footH;
    let rows = '';
    inv.items.forEach((it, i) => {
        const y = headH + metaH + tableHeadH + i * rowH;
        rows += `<rect x="40" y="${y}" width="${W - 80}" height="${rowH}" fill="${i % 2 ? '#F8FAFC' : '#FFFFFF'}"/>
        <text x="60" y="${y + 35}" font-size="25" fill="#0F172A" font-family="DejaVu Sans, sans-serif">${i + 1}. ${esc(it.name)}</text>
        <text x="480" y="${y + 35}" font-size="25" fill="#334155" text-anchor="middle" font-family="DejaVu Sans, sans-serif">${it.qty}</text>
        <text x="620" y="${y + 35}" font-size="25" fill="#334155" text-anchor="end" font-family="DejaVu Sans, sans-serif">${Number(it.rate).toLocaleString('en-PK')}</text>
        <text x="820" y="${y + 35}" font-size="25" font-weight="bold" fill="#0F172A" text-anchor="end" font-family="DejaVu Sans, sans-serif">${Number(it.amt).toLocaleString('en-PK')}</text>`;
    });
    const ty = headH + metaH + tableHeadH + inv.items.length * rowH;
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#FFFFFF"/>
    <rect width="${W}" height="${headH}" fill="#111827"/>
    <text x="40" y="68" font-size="42" font-weight="bold" fill="#FFFFFF" font-family="DejaVu Sans, sans-serif">${esc(config.OWNER_NAME || 'MALIK SAHAB')}</text>
    <text x="40" y="112" font-size="24" fill="#9CA3AF" font-family="DejaVu Sans, sans-serif">INVOICE / BILL</text>
    <text x="${W - 40}" y="68" font-size="30" font-weight="bold" fill="#FACC15" text-anchor="end" font-family="DejaVu Sans, sans-serif">${esc(inv.no)}</text>
    <text x="${W - 40}" y="112" font-size="24" fill="#D1D5DB" text-anchor="end" font-family="DejaVu Sans, sans-serif">${esc(inv.date)}</text>
    <text x="40" y="${headH + 52}" font-size="26" fill="#475569" font-family="DejaVu Sans, sans-serif">Customer:</text>
    <text x="40" y="${headH + 92}" font-size="32" font-weight="bold" fill="#0F172A" font-family="DejaVu Sans, sans-serif">${esc(inv.customer)}</text>
    <rect x="40" y="${headH + metaH}" width="${W - 80}" height="${tableHeadH}" fill="#1F2937"/>
    <text x="60" y="${headH + metaH + 31}" font-size="22" font-weight="bold" fill="#FFFFFF" font-family="DejaVu Sans, sans-serif">ITEM</text>
    <text x="480" y="${headH + metaH + 31}" font-size="22" font-weight="bold" fill="#FFFFFF" text-anchor="middle" font-family="DejaVu Sans, sans-serif">QTY</text>
    <text x="620" y="${headH + metaH + 31}" font-size="22" font-weight="bold" fill="#FFFFFF" text-anchor="end" font-family="DejaVu Sans, sans-serif">RATE</text>
    <text x="820" y="${headH + metaH + 31}" font-size="22" font-weight="bold" fill="#FFFFFF" text-anchor="end" font-family="DejaVu Sans, sans-serif">AMOUNT</text>
    ${rows}
    <rect x="40" y="${ty}" width="${W - 80}" height="${totalH - 14}" rx="12" fill="#065F46"/>
    <text x="60" y="${ty + 52}" font-size="30" font-weight="bold" fill="#FFFFFF" font-family="DejaVu Sans, sans-serif">TOTAL</text>
    <text x="820" y="${ty + 52}" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="end" font-family="DejaVu Sans, sans-serif">${rs(inv.total)}</text>
    <text x="${W / 2}" y="${ty + totalH + 40}" font-size="22" fill="#64748B" text-anchor="middle" font-family="DejaVu Sans, sans-serif">Shukriya! Aap ke business ka shukrana. — MALIK-MD</text>
    </svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
}

module.exports = {
    name: 'bill',
    alias: ['billphoto', 'photobill', 'imagebill'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const raw = args.join(' ').trim();
        try {
            const db = load();
            let inv = null;
            if (!raw) {
                inv = db.list[db.list.length - 1];
                if (!inv) return sock.sendMessage(jid, { text: '🧾 Abhi koi invoice maujood nahi. Pehle banao:\n`.bill Customer | Item, qty, rate`' }, { quoted: m });
            } else if (/^INV-\d+$/i.test(raw)) {
                inv = db.list.find(x => x.no.toLowerCase() === raw.toLowerCase());
                if (!inv) return sock.sendMessage(jid, { text: `❌ ${raw} wala invoice nahi mila.` }, { quoted: m });
            } else if (raw.includes('|')) {
                const parts = raw.split('|').map(s => s.trim()).filter(Boolean);
                const customer = parts[0];
                const items = []; let total = 0;
                for (const p of parts.slice(1)) {
                    const bits = p.split(',').map(s => s.trim());
                    const name = bits[0];
                    const qty = parseFloat(bits[1]) || 1;
                    const rate = parseFloat(bits[2]) || 0;
                    if (!name || rate <= 0) return sock.sendMessage(jid, { text: `❌ Item sahi nahi: "${p}"\nFormat: Item, qty, rate` }, { quoted: m });
                    const amt = qty * rate; total += amt;
                    items.push({ name, qty, rate, amt });
                }
                if (!items.length) return sock.sendMessage(jid, { text: '❌ Koi item nahi mila. Format check karo.' }, { quoted: m });
                inv = { no: 'INV-' + String(db.next).padStart(4, '0'), customer, items, total, date: new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi' }) };
                db.next += 1; db.list.push(inv); save(db);
            } else {
                return sock.sendMessage(jid, { text: '🧾 *Photo Bill*\n\n• `.bill Customer | Item, qty, rate | ...` — naya bill (photo)\n• `.bill` — akhri invoice ki photo\n• `.bill INV-0003` — us number ki photo' }, { quoted: m });
            }
            const img = await renderBill(inv);
            return sock.sendMessage(jid, { image: img, caption: `🧾 *${inv.no}* — ${inv.customer}\n💰 Total: *${rs(inv.total)}*` }, { quoted: m });
        } catch (e) {
            console.error('bill error:', e.message);
            return sock.sendMessage(jid, { text: '❌ Bill ki photo nahi ban saki. Format dobara check karo.' }, { quoted: m });
        }
    }
};
