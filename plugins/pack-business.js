// ======================================================
// PACK: BUSINESS 2 — payreminder, shopcard, offer,
// followup, warranty (client ko dikhane wale kaam ke tools)
// ======================================================
const fs = require('fs');
const path = require('path');
const config = require('../config.js');
const send = (sock, m, text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
const readJson = (name, fb) => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', name), 'utf8')); } catch (e) { return fb; } };

module.exports = [
    {
        name: 'payreminder',
        exec: async (sock, m, args) => {
            const parts = args.join(' ').split('|').map(x => x.trim());
            if (parts.length < 2 || !parts[0] || !parts[1]) return send(sock, m, '💬 *Payment Reminder banayein*\n\nExample:\n`.payreminder Ahmed | 15000 | 10 din`\n\n(Customer ka naam | baqaya raqam | kitne din se) — ek polite Roman Urdu reminder tayyar milega, copy karke bhej dein.');
            const [name, amount, when] = parts;
            const amt = Number(String(amount).replace(/[^0-9.]/g, '')).toLocaleString('en-PK');
            return send(sock, m,
`💬 *Yeh raha tayyar reminder — copy karke bhej dein:*

Assalam o Alaikum ${name} bhai, umeed hai ap khairiyat se honge. 🙂
Ek meherbani wala reminder hai: aap ke zimmay *Rs ${amt}* baqaya hain${when ? ` (pichle ${when} se)` : ''}. Jab aap ke liye asani ho, ada kar dijiye ga — aap ki meherbani hogi.
Koi masla ya sawaal ho to be-jhijhak bata dein. Shukriya! 🙏

— ${config.OWNER_NAME}`);
        }
    },
    {
        name: 'shopcard',
        exec: async (sock, m, args) => {
            const pay = readJson('payments.json', {});
            const biz = (readJson('jadoo.json', {}).biz || '').trim();
            const lines = [
                `╭━━━〔 💼 *${config.OWNER_NAME}* 〕━━━┈⊷`,
                `┃ 📱 WhatsApp: ${config.OWNER_NUMBER}`,
            ];
            if (pay.jazzcash) lines.push(`┃ 💚 JazzCash: ${pay.jazzcash}`);
            if (pay.easypaisa) lines.push(`┃ 💙 Easypaisa: ${pay.easypaisa}`);
            if (pay.bank) lines.push(`┃ 🏦 Bank: ${pay.bank}`);
            if (biz) lines.push(`┃`, `┃ ${biz.split('\n')[0]}`);
            lines.push(`╰━━━━━━━━━━━━━━━┈⊷`);
            lines.push(`_Yeh card save/share kar dein — payment ki tafseel yahin hai._`);
            lines.push(`_(Payment numbers .payset se, business info .jadoobiz se ata hai)_`);
            return send(sock, m, lines.join('\n'));
        }
    },
    {
        name: 'offer',
        exec: async (sock, m, args) => {
            const parts = args.join(' ').split('|').map(x => x.trim());
            if (parts.length < 3) return send(sock, m, '🎉 *Offer Post Maker*\n\nExample:\n`.offer WhatsApp Bot Setup | 25000 | 15000 | 31 Oct tak`\n\n(Cheez | purani qeemat | nai qeemat | aakhri date)');
            const [item, oldP, newP, expiry] = parts;
            const o = Number(String(oldP).replace(/[^0-9.]/g, '')), n = Number(String(newP).replace(/[^0-9.]/g, ''));
            const off = o > 0 && n > 0 ? Math.round((1 - n / o) * 100) : 0;
            return send(sock, m,
`🎉🔥 *DHAMAKA OFFER* 🔥🎉

✨ *${item}*
❌ Purani qeemat: ~Rs ${o ? o.toLocaleString('en-PK') : oldP}~
✅ *Ab sirf: Rs ${n ? n.toLocaleString('en-PK') : newP}*${off ? `  (${off}% OFF!)` : ''}
${expiry ? `⏰ Aakhri mauqa: *${expiry}*\n` : ''}
📲 Order ke liye abhi WhatsApp karein: ${config.OWNER_NUMBER}
— ${config.OWNER_NAME}`);
        }
    },
    {
        name: 'followup',
        exec: async (sock, m, args) => {
            const parts = args.join(' ').split('|').map(x => x.trim());
            if (parts.length < 2) return send(sock, m, '📞 *Customer Follow-up Message*\n\nExample:\n`.followup Rashid | WhatsApp Bot`\n\n(Customer | kis cheez ke baare mein baat hui thi)');
            const [name, thing] = parts;
            return send(sock, m,
`📞 *Tayyar follow-up — copy karke bhej dein:*

Assalam o Alaikum ${name} bhai, mein ${config.OWNER_NAME} bol raha hun. 🙂
Hamari *${thing}* ke baare mein baat hui thi — socha yaad dehani kar doon. Agar aap tayyar hain to aaj hi shuru kar lete hain, koi sawaal ho to main hazir hun.
Aap ka waqt dene ka shukriya! 🙏`);
        }
    },
    {
        name: 'warranty',
        exec: async (sock, m, args) => {
            const parts = args.join(' ').split('|').map(x => x.trim());
            const start = new Date(parts[1]);
            const months = parseInt(parts[2]);
            if (parts.length < 3 || !parts[0] || isNaN(start) || !months) return send(sock, m, '🛡️ *Warranty Card Maker*\n\nExample:\n`.warranty Dell Laptop 5430 | 2026-10-23 | 2`\n\n(Cheez | khareed date YYYY-MM-DD | warranty mahine)\n\n(60-day checking warranty = 2 mahine)');
            const expiry = new Date(start); expiry.setMonth(expiry.getMonth() + months);
            const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            const daysLeft = Math.ceil((expiry - new Date()) / 86400000);
            return send(sock, m,
`🛡️ *WARRANTY CARD*

📦 Cheez: *${parts[0]}*
📅 Khareed: ${fmt(start)}
⏳ Warranty: ${months} mahine
📆 *Aakhri date: ${fmt(expiry)}*${daysLeft >= 0 ? ` (${daysLeft} din baqi)` : ` (⚠️ ${Math.abs(daysLeft)} din pehle khatam ho chuki!)`}

📌 Is arsay mein koi bhi masla ho to foran rabta karein.
— ${config.OWNER_NAME} • ${config.OWNER_NUMBER}`);
        }
    }
];
