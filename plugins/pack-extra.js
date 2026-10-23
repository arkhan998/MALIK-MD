// ======================================================
// PACK: EXTRA — birthday tracker, nextprayer, hijri date
// ======================================================
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const send = (sock, m, text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
const BFILE = path.join(__dirname, '..', 'data', 'birthdays.json');
const loadB = () => { try { return JSON.parse(fs.readFileSync(BFILE, 'utf8')); } catch (e) { return { list: [] }; } };
const saveB = (d) => { try { fs.mkdirSync(path.dirname(BFILE), { recursive: true }); fs.writeFileSync(BFILE, JSON.stringify(d, null, 2)); } catch (e) {} };

function nextBirthday(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const now = new Date();
    const next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) next.setFullYear(next.getFullYear() + 1);
    const days = Math.round((next - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
    return { next, days, turning: next.getFullYear() - d.getFullYear() };
}

module.exports = [
    {
        name: 'birthday',
        alias: ['bday'],
        exec: async (sock, m, args) => {
            const db = loadB();
            const sub = (args[0] || '').toLowerCase();
            if (sub === 'add') {
                const name = args[1];
                const date = args[2];
                if (!name || !nextBirthday(date || '')) return send(sock, m, '🎂 Example: `.birthday add Ahmed 2000-05-15`');
                db.list.push({ name, date });
                saveB(db);
                return send(sock, m, `🎂 *${name}* ki birthday save ho gayi (${date}).\n\`.birthday\` likhne par aane wali birthdays nazar ayengi.`);
            }
            if (sub === 'list' || (!sub && db.list.length)) {
                if (!db.list.length) return send(sock, m, '🎂 Abhi koi birthday save nahi.\nAdd karo: `.birthday add <naam> <YYYY-MM-DD>`');
                const rows = db.list.map(x => ({ ...x, nb: nextBirthday(x.date) })).filter(x => x.nb).sort((a, b) => a.nb.days - b.nb.days);
                return send(sock, m, `🎂 *Birthdays*\n\n` + rows.map(x => `${x.nb.days === 0 ? '🎉 *AJ!*' : `⏳ ${x.nb.days} din`} — ${x.name} (${x.nb.turning} saal ke honge, ${x.nb.next.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`).join('\n'));
            }
            return send(sock, m, '🎂 *Birthday Tracker*\n\n• `.birthday add Ahmed 2000-05-15`\n• `.birthday list` — aane wali birthdays, din ke sath\n\nApno ki birthday kabhi bhool nahi hogi ab 😊');
        }
    },
    {
        name: 'nextprayer',
        alias: ['nextnamaz'],
        exec: async (sock, m, args) => {
            const city = args.join(' ').trim() || 'Lahore';
            try {
                const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Pakistan&method=1&school=1`;
                const res = await axios.get(url, { timeout: 15000 });
                const t = res.data?.data?.timings;
                if (!t) throw new Error('no');
                const clean = (x) => String(x).split(' ')[0];
                const now = new Date();
                const pkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
                const order = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
                const toMin = (s) => { const [h, mi] = clean(s).split(':').map(Number); return h * 60 + mi; };
                const nowMin = pkt.getHours() * 60 + pkt.getMinutes();
                let nextName = 'Fajr', nextMin = toMin(t.Fajr) + 1440;
                for (const name of order) {
                    const mm = toMin(t[name]);
                    if (mm > nowMin) { nextName = name; nextMin = mm; break; }
                }
                const diff = nextMin - nowMin;
                const hh = Math.floor(diff / 60), mi = diff % 60;
                return send(sock, m, `🕌 *Agli Namaz — ${city}* (Sunni Hanafi)\n\n⏰ *${nextName}* — ${clean(t[nextName])}\n⏳ Baqi waqt: *${hh ? hh + ' ghante ' : ''}${mi} minute*\n\nAaj ke auqat: Fajr ${clean(t.Fajr)} • Dhuhr ${clean(t.Dhuhr)} • Asr ${clean(t.Asr)} • Maghrib ${clean(t.Maghrib)} • Isha ${clean(t.Isha)}`);
            } catch (e) { return send(sock, m, '❌ Timings nahi mil sakein. Thodi dair baad try karo.'); }
        }
    },
    {
        name: 'hijri',
        exec: async (sock, m, args) => {
            try {
                const now = new Date();
                const pkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
                const dd = String(pkt.getDate()).padStart(2, '0'), mm = String(pkt.getMonth() + 1).padStart(2, '0'), yy = pkt.getFullYear();
                const res = await axios.get(`https://api.aladhan.com/v1/gToH?date=${dd}-${mm}-${yy}`, { timeout: 15000 });
                const h = res.data?.data?.hijri;
                if (!h) throw new Error('no');
                return send(sock, m, `🌙 *Hijri Date*\n\n📅 Aaj: *${h.day} ${h.month.en} ${h.year} Hijri*\n(${h.weekday.en})\n\nGregorian: ${dd}-${mm}-${yy}`);
            } catch (e) { return send(sock, m, '❌ Hijri date nahi mil saki.'); }
        }
    }
];
