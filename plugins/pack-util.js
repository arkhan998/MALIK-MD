// ======================================================
// PACK: UTILITIES — roz-marra ke kaam ke calculators/tools
// age, bmi, emi, zakat, split, percentage, unit, fuel,
// countdown, remindme, password, words
// ======================================================
const crypto = require('crypto');
const rs = (n) => 'Rs ' + Math.round(n).toLocaleString('en-PK');
const num = (s) => parseFloat(String(s || '').replace(/,/g, ''));
const send = (sock, m, text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });

module.exports = [
    {
        name: 'age',
        exec: async (sock, m, args) => {
            const d = new Date(args[0]);
            if (isNaN(d)) return send(sock, m, '🎂 *Age Calculator*\n\nExample: `.age 2000-05-15`\n(Apni date of birth YYYY-MM-DD mein likho)');
            const now = new Date();
            let y = now.getFullYear() - d.getFullYear();
            let mo = now.getMonth() - d.getMonth();
            let da = now.getDate() - d.getDate();
            if (da < 0) { mo--; da += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
            if (mo < 0) { y--; mo += 12; }
            const days = Math.floor((now - d) / 86400000);
            return send(sock, m, `🎂 *Tumhari Age*\n\n📅 *${y} saal, ${mo} mahine, ${da} din*\n🔢 Kul din: ${days.toLocaleString('en-PK')}\n🎈 Agli birthday: ${(() => { const n = new Date(now.getFullYear(), d.getMonth(), d.getDate()); if (n < now) n.setFullYear(n.getFullYear() + 1); return Math.ceil((n - now) / 86400000); })()} din baad`);
        }
    },
    {
        name: 'bmi',
        exec: async (sock, m, args) => {
            const w = num(args[0]), h = num(args[1]);
            if (!w || !h) return send(sock, m, '⚖️ *BMI Calculator*\n\nExample: `.bmi 70 170`\n(Pehle wazan kg mein, phir qad cm mein)');
            const bmi = w / Math.pow(h / 100, 2);
            const cat = bmi < 18.5 ? 'Kamzor (Underweight)' : bmi < 25 ? 'Normal ✅' : bmi < 30 ? 'Zyada (Overweight)' : 'Motapa (Obese)';
            const idealMin = (18.5 * Math.pow(h / 100, 2)).toFixed(1), idealMax = (24.9 * Math.pow(h / 100, 2)).toFixed(1);
            return send(sock, m, `⚖️ *BMI Report*\n\n📊 BMI: *${bmi.toFixed(1)}* — ${cat}\n🎯 Tumhare qad ke liye ideal wazan: ${idealMin}–${idealMax} kg`);
        }
    },
    {
        name: 'emi',
        alias: ['qist'],
        exec: async (sock, m, args) => {
            const P = num(args[0]), months = num(args[1]), annual = num(args[2] || 0);
            if (!P || !months) return send(sock, m, '🏦 *Loan/Qist Calculator*\n\nExample: `.emi 500000 24 15`\n(Raqam, mahine, saalana sood % — sood na ho to 0)');
            const r = annual / 1200;
            const emi = r === 0 ? P / months : P * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
            const total = emi * months;
            return send(sock, m, `🏦 *Qist Plan*\n\n💰 Raqam: ${rs(P)}\n📆 Muddat: ${months} mahine\n📈 Sood: ${annual}%/saal\n\n🧾 *Mahana qist: ${rs(emi)}*\n💵 Kul adaigi: ${rs(total)}\n📊 Sood ka hissa: ${rs(total - P)}`);
        }
    },
    {
        name: 'zakat',
        exec: async (sock, m, args) => {
            const amt = num(args[0]);
            if (!amt) return send(sock, m, '🕌 *Zakat Calculator*\n\nExample: `.zakat 500000`\n(Kul maal/naqdi ki raqam likho — zakat 2.5% banti hai)');
            return send(sock, m, `🕌 *Zakat*\n\n💰 Kul maal: ${rs(amt)}\n🤲 *Zakat (2.5%): ${rs(amt * 0.025)}*\n\n📌 Note: Zakat sirf nisab se zyada maal par, saal pura hone par wajib hoti hai. Gold/chandi aur qarz ka hisaab alag hota hai — tafseel ke liye aalim se zaroor poochhein.`);
        }
    },
    {
        name: 'split',
        exec: async (sock, m, args) => {
            const amt = num(args[0]), ppl = num(args[1]);
            if (!amt || !ppl) return send(sock, m, '🧾 *Bill Split*\n\nExample: `.split 4500 5`\n(Kul bill, kitne log)');
            return send(sock, m, `🧾 *Bill Split*\n\n💵 Kul: ${rs(amt)}\n👥 Log: ${ppl}\n➗ *Har ek ka hissa: ${rs(amt / ppl)}*`);
        }
    },
    {
        name: 'percentage',
        alias: ['percent'],
        exec: async (sock, m, args) => {
            const a = num(args[0]), b = num(args[1]);
            if (!a || !b) return send(sock, m, '📊 *Percentage*\n\nExample: `.percentage 450 600`\n(Kitne marks/number mile, kul kitne mein se)\n\nDusra use: `.percentage 15 of 2000` — 2000 ka 15%');
            if ((args[1] || '').toLowerCase() === 'of') return send(sock, m, `📊 ${a}% of ${num(args[2])} = *${(a / 100 * num(args[2])).toLocaleString('en-PK')}*`);
            return send(sock, m, `📊 *${a} / ${b} = ${((a / b) * 100).toFixed(2)}%*`);
        }
    },
    {
        name: 'unit',
        exec: async (sock, m, args) => {
            const v = num(args[0]), from = (args[1] || '').toLowerCase(), to = (args[2] || '').toLowerCase();
            const table = {
                'kg>g': v * 1000, 'g>kg': v / 1000, 'km>m': v * 1000, 'm>km': v / 1000,
                'km>mile': v * 0.621371, 'mile>km': v * 1.60934, 'c>f': v * 9 / 5 + 32, 'f>c': (v - 32) * 5 / 9,
                'l>ml': v * 1000, 'ml>l': v / 1000, 'inch>cm': v * 2.54, 'cm>inch': v / 2.54,
                'ft>m': v * 0.3048, 'm>ft': v * 3.28084, 'lb>kg': v * 0.453592, 'kg>lb': v * 2.20462,
                'dozen>pcs': v * 12, 'pcs>dozen': v / 12
            };
            const key = from + '>' + to;
            if (!v || !table[key]) return send(sock, m, '🔄 *Unit Converter*\n\nExample: `.unit 5 kg lb`\n\nUnits: kg, g, km, m, mile, c, f, l, ml, inch, cm, ft, lb, dozen, pcs');
            return send(sock, m, `🔄 *${v} ${from} = ${(+table[key].toFixed(4)).toLocaleString('en-PK')} ${to}*`);
        }
    },
    {
        name: 'fuel',
        exec: async (sock, m, args) => {
            const km = num(args[0]), avg = num(args[1]), price = num(args[2]);
            if (!km || !avg || !price) return send(sock, m, '⛽ *Fuel Cost Calculator*\n\nExample: `.fuel 350 14 280`\n(Safar km, gari ki average km/litre, petrol price/litre)');
            const litres = km / avg;
            return send(sock, m, `⛽ *Safar ka Fuel*\n\n🛣️ Fasla: ${km} km\n🚗 Petrol lage ga: *${litres.toFixed(1)} litre*\n💵 *Kul kharcha: ${rs(litres * price)}*`);
        }
    },
    {
        name: 'countdown',
        exec: async (sock, m, args) => {
            const d = new Date(args[0]);
            if (isNaN(d)) return send(sock, m, '⏳ *Countdown*\n\nExample: `.countdown 2027-01-01`\n(Kisi date tak kitne din baqi hain)');
            const days = Math.ceil((d - new Date()) / 86400000);
            if (days > 0) return send(sock, m, `⏳ *${args[0]}* tak *${days} din* baqi hain.`);
            if (days === 0) return send(sock, m, `⏳ *${args[0]}* — AJ HI KA DIN HAI! 🎉`);
            return send(sock, m, `⏳ *${args[0]}* ko guzre *${Math.abs(days)} din* ho gaye hain.`);
        }
    },
    {
        name: 'remindme',
        alias: ['timer'],
        exec: async (sock, m, args) => {
            const mins = num(args[0]);
            const text = args.slice(1).join(' ').trim();
            if (!mins || mins <= 0 || mins > 1440 || !text) return send(sock, m, '⏰ *Reminder set karo*\n\nExample: `.remindme 30 chai pee lena`\n(Minutes 1–1440, phir reminder ka text)\n\n⚠️ Bot band/restart ho to reminder nahi ayega.');
            const sender = m.key.participant || m.key.remoteJid;
            await send(sock, m, `⏰ Theek hai! *${mins} minute* baad yaad dila dun ga: _${text}_`);
            setTimeout(async () => {
                try { await sock.sendMessage(m.key.remoteJid, { text: `⏰ *REMINDER* @${sender.split('@')[0]}\n\n📌 ${text}`, mentions: [sender] }); } catch (e) {}
            }, mins * 60000);
        }
    },
    {
        name: 'password',
        alias: ['passgen'],
        exec: async (sock, m, args) => {
            let len = parseInt(args[0]) || 12;
            len = Math.min(32, Math.max(6, len));
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
            let out = '';
            const buf = crypto.randomBytes(len);
            for (let i = 0; i < len; i++) out += chars[buf[i] % chars.length];
            return send(sock, m, `🔐 *Strong Password (${len} characters)*\n\n\`${out}\`\n\n⚠️ Ise kahin safe jagah note kar lo, aur kisi ke sath share mat karna.`);
        }
    },
    {
        name: 'words',
        exec: async (sock, m, args) => {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const qText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
            const text = (args.join(' ') || qText).trim();
            if (!text) return send(sock, m, '🔤 *Word Counter*\n\nExample: `.words Yeh mera message hai`\n(Ya kisi message par reply karke `.words`)');
            const words = text.split(/\s+/).filter(Boolean).length;
            return send(sock, m, `🔤 *Count*\n\n📝 Words: *${words}*\n🔡 Characters: *${text.length}* (spaces ke sath)\n📏 Characters (bina space): *${text.replace(/\s/g, '').length}*`);
        }
    }
];
