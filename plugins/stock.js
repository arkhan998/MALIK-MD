const axios = require('axios');
const config = require('../config.js');

// ======================================================
// MALIK ERP — STOCK (Google Sheet bridge, owner-only)
// .stock <item>          -> stock check
// .stockin <item> <qty>  -> stock in   (qty pehle bhi chalega)
// .stockout <item> <qty> -> stock out
// .stocklist             -> saara stock
// .lowstock              -> kam stock wali items
// .stockadd Name, qty, min, unit -> naya item
// Data Google Sheet "MALIK ERP - Stock" mein rehta hai.
// ======================================================

const norm = (jid) => String(jid || '').split(':')[0].split('@')[0];

function isOwner(m) {
    if (m.key.fromMe) return true;
    const sender = norm(m.key.participant || m.key.remoteJid);
    return config.OWNER_NUMBER && sender === norm(config.OWNER_NUMBER);
}

async function api(payload) {
    if (!config.STOCK_API_URL) {
        const err = new Error('NOT_CONFIGURED');
        throw err;
    }
    const { data } = await axios.post(config.STOCK_API_URL, {
        token: config.STOCK_API_TOKEN,
        ...payload
    }, { timeout: 30000 });
    return data;
}

function notConfigured(sock, m) {
    return sock.sendMessage(m.key.remoteJid, {
        text: '⚠️ *Stock system abhi configured nahi hai.*\n\nPehle Google Sheet mein Apps Script deploy karke us ka URL config mein `STOCK_API_URL` mein dalna hoga.'
    }, { quoted: m });
}

function guard(sock, m) {
    if (!isOwner(m)) {
        sock.sendMessage(m.key.remoteJid, { text: '👑 Ye command sirf owner ke liye hai.' }, { quoted: m });
        return false;
    }
    return true;
}

// ".stockin black ink 10" ya ".stockin 10 black ink" — dono chalein ge
function parseItemQty(args) {
    if (!args.length) return { item: '', qty: 0 };
    const first = parseFloat(args[0]);
    const last = parseFloat(args[args.length - 1]);
    if (!isNaN(first) && args.length > 1) return { item: args.slice(1).join(' '), qty: first };
    if (!isNaN(last) && args.length > 1) return { item: args.slice(0, -1).join(' '), qty: last };
    return { item: args.join(' '), qty: 0 };
}

const stockCheck = {
    name: 'stock',
    aliases: ['stockcheck'],
    exec: async (sock, m, args) => {
        if (!guard(sock, m)) return;
        const item = args.join(' ').trim();
        if (!item) return sock.sendMessage(m.key.remoteJid, { text: '📦 *Usage:* `.stock <item name>`\nExample: `.stock black ink`' }, { quoted: m });
        try {
            const r = await api({ action: 'check', item });
            if (!r.ok) return sock.sendMessage(m.key.remoteJid, { text: `❌ Item nahi mila: *${item}*\nList ke liye: \`.stocklist\`` }, { quoted: m });
            const warn = r.stock <= r.min ? '\n⚠️ *Low stock!* Min level se kam hai.' : '';
            return sock.sendMessage(m.key.remoteJid, { text: `📦 *${r.item}*\n\nStock: *${r.stock} ${r.unit}*\nMin Level: ${r.min} ${r.unit}${warn}` }, { quoted: m });
        } catch (e) {
            if (e.message === 'NOT_CONFIGURED') return notConfigured(sock, m);
            return sock.sendMessage(m.key.remoteJid, { text: '❌ Sheet se rabta nahi ho saka. Thori dair baad try karein.' }, { quoted: m });
        }
    }
};

function makeInOut(action) {
    return {
        name: action === 'in' ? 'stockin' : 'stockout',
        aliases: action === 'in' ? ['addstock'] : ['removestock'],
        exec: async (sock, m, args) => {
            if (!guard(sock, m)) return;
            const { item, qty } = parseItemQty(args);
            if (!item || !qty) {
                const ex = action === 'in' ? '.stockin black ink 10' : '.stockout solvent 5';
                return sock.sendMessage(m.key.remoteJid, { text: `📦 *Usage:* \`${ex}\`` }, { quoted: m });
            }
            try {
                const r = await api({ action, item, qty });
                if (!r.ok) {
                    if (r.error === 'stock kam hai') return sock.sendMessage(m.key.remoteJid, { text: `❌ *Stock kam hai!*\n${r.item} mein sirf *${r.stock} ${r.unit}* bacha hai — ${qty} out nahi ho sakta.` }, { quoted: m });
                    return sock.sendMessage(m.key.remoteJid, { text: `❌ Item nahi mila: *${item}*` }, { quoted: m });
                }
                const arrow = action === 'in' ? '📥 IN' : '📤 OUT';
                const warn = r.stock <= r.min ? '\n⚠️ *Low stock warning!*' : '';
                return sock.sendMessage(m.key.remoteJid, { text: `✅ *Stock ${arrow}*\n\nItem: *${r.item}*\nQty: ${qty} ${r.unit}\nNaya Balance: *${r.stock} ${r.unit}*${warn}\n\n_Sheet update ho gayi hai ✓_` }, { quoted: m });
            } catch (e) {
                if (e.message === 'NOT_CONFIGURED') return notConfigured(sock, m);
                return sock.sendMessage(m.key.remoteJid, { text: '❌ Sheet se rabta nahi ho saka. Thori dair baad try karein.' }, { quoted: m });
            }
        }
    };
}

const stockList = {
    name: 'stocklist',
    aliases: ['allstock'],
    exec: async (sock, m, args) => {
        if (!guard(sock, m)) return;
        try {
            const r = await api({ action: 'list' });
            if (!r.ok || !r.items?.length) return sock.sendMessage(m.key.remoteJid, { text: '📦 Sheet khaali hai. Pehle `.stockadd` se item add karein.' }, { quoted: m });
            let total = 0;
            const lines = r.items.map(it => {
                total += it.stock;
                const flag = it.stock <= it.min ? ' ⚠️' : '';
                return `• *${it.item}* — ${it.stock} ${it.unit}${flag}`;
            });
            return sock.sendMessage(m.key.remoteJid, { text: `📦 *MALIK ERP — STOCK LIST*\n━━━━━━━━━━━━━━━\n${lines.join('\n')}\n━━━━━━━━━━━━━━━\n⚠️ = low stock` }, { quoted: m });
        } catch (e) {
            if (e.message === 'NOT_CONFIGURED') return notConfigured(sock, m);
            return sock.sendMessage(m.key.remoteJid, { text: '❌ Sheet se rabta nahi ho saka.' }, { quoted: m });
        }
    }
};

const lowStock = {
    name: 'lowstock',
    aliases: ['low'],
    exec: async (sock, m, args) => {
        if (!guard(sock, m)) return;
        try {
            const r = await api({ action: 'low' });
            if (!r.ok) return sock.sendMessage(m.key.remoteJid, { text: '❌ Kuch masla hua.' }, { quoted: m });
            if (!r.items.length) return sock.sendMessage(m.key.remoteJid, { text: '✅ *Sab theek hai!*\nKoi item low stock par nahi hai.' }, { quoted: m });
            const lines = r.items.map(it => `• *${it.item}* — sirf ${it.stock} ${it.unit} (min: ${it.min})`);
            return sock.sendMessage(m.key.remoteJid, { text: `⚠️ *LOW STOCK ALERT*\n━━━━━━━━━━━━━━━\n${lines.join('\n')}\n━━━━━━━━━━━━━━━\nJaldi restock karein!` }, { quoted: m });
        } catch (e) {
            if (e.message === 'NOT_CONFIGURED') return notConfigured(sock, m);
            return sock.sendMessage(m.key.remoteJid, { text: '❌ Sheet se rabta nahi ho saka.' }, { quoted: m });
        }
    }
};

const stockAdd = {
    name: 'stockadd',
    aliases: ['additem'],
    exec: async (sock, m, args) => {
        if (!guard(sock, m)) return;
        const raw = args.join(' ');
        const parts = raw.split(',').map(s => s.trim());
        if (parts.length < 2 || !parts[0] || isNaN(parseFloat(parts[1]))) {
            return sock.sendMessage(m.key.remoteJid, { text: '📦 *Usage:* `.stockadd Item Name, qty, min level, unit`\nExample: `.stockadd Black Ink, 50, 10, Bottle`' }, { quoted: m });
        }
        try {
            const r = await api({ action: 'add', item: parts[0], qty: parseFloat(parts[1]), min: parseFloat(parts[2]) || 0, unit: parts[3] || 'Piece' });
            if (!r.ok) return sock.sendMessage(m.key.remoteJid, { text: `❌ ${r.error === 'item pehle se hai' ? 'Ye item pehle se sheet mein hai.' : 'Item add nahi ho saka.'}` }, { quoted: m });
            return sock.sendMessage(m.key.remoteJid, { text: `✅ *Naya item add ho gaya!*\n\nItem: *${r.item}*\nStock: ${r.stock} ${r.unit}\nMin Level: ${r.min} ${r.unit}` }, { quoted: m });
        } catch (e) {
            if (e.message === 'NOT_CONFIGURED') return notConfigured(sock, m);
            return sock.sendMessage(m.key.remoteJid, { text: '❌ Sheet se rabta nahi ho saka.' }, { quoted: m });
        }
    }
};

module.exports = [stockCheck, makeInOut('in'), makeInOut('out'), stockList, lowStock, stockAdd];
