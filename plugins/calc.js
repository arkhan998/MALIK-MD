// ======================================================
// BUSINESS MATH — calc / tax / discount (array export)
// .calc 1500*3+200     .tax 50000 18     .discount 1200 25
// ======================================================

const rs = (n) => 'Rs ' + Number(Math.round(n * 100) / 100).toLocaleString('en-PK');

module.exports = [
    {
        name: 'calc',
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const expr = args.join(' ').replace(/\s+/g, '');
            if (!expr) return sock.sendMessage(jid, { text: '🧮 Usage: `.calc 1500*3+200`' }, { quoted: m });
            // Sirf digits, + - * / % ( ) . allow — code injection impossible
            if (!/^[0-9+\-*/%().]+$/.test(expr)) {
                return sock.sendMessage(jid, { text: '❌ Sirf numbers aur + − × ÷ % ( ) use ho sakte hain.' }, { quoted: m });
            }
            try {
                const val = Function('"use strict"; return (' + expr + ')')();
                if (typeof val !== 'number' || !isFinite(val)) throw new Error('bad');
                await sock.sendMessage(jid, { text: `🧮 *${args.join(' ')}*\n= *${Math.round(val * 100) / 100}*` }, { quoted: m });
            } catch (e) {
                await sock.sendMessage(jid, { text: '❌ Calculation ghalat hai, dobara likho.' }, { quoted: m });
            }
        }
    },
    {
        name: 'tax',
        alias: ['gst'],
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const amount = parseFloat(args[0]);
            const rate = args[1] !== undefined ? parseFloat(args[1]) : 18;
            if (isNaN(amount) || amount <= 0) {
                return sock.sendMessage(jid, { text: '🧾 Usage: `.tax 50000` (18% default) ya `.tax 50000 17`' }, { quoted: m });
            }
            const taxAmt = amount * rate / 100;
            await sock.sendMessage(jid, {
                text: `🧾 *Tax Calculation*\n━━━━━━━━━━━━━━━\n💵 Amount: *${rs(amount)}*\n📊 Tax Rate: *${rate}%*\n🧾 Tax: *${rs(taxAmt)}*\n💰 *Total (tax ke sath): ${rs(amount + taxAmt)}*`
            }, { quoted: m });
        }
    },
    {
        name: 'discount',
        alias: ['off'],
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const price = parseFloat(args[0]);
            const pct = parseFloat(args[1]);
            if (isNaN(price) || isNaN(pct)) {
                return sock.sendMessage(jid, { text: '🏷️ Usage: `.discount 1200 25` (price, % off)' }, { quoted: m });
            }
            const off = price * pct / 100;
            await sock.sendMessage(jid, {
                text: `🏷️ *Discount Calculation*\n━━━━━━━━━━━━━━━\n💵 Price: *${rs(price)}*\n📉 Discount: *${pct}%* (−${rs(off)})\n💰 *Final Price: ${rs(price - off)}*`
            }, { quoted: m });
        }
    }
];
