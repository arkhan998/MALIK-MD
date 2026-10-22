const axios = require('axios');

// ======================================================
// NAMAZ — prayer times (.namaz <city> / .prayer)
// Uses keyless Aladhan API
// ======================================================

const clean = (t) => String(t || '').split(' ')[0]; // "05:30 (PKT)" -> "05:30"

module.exports = {
    name: 'namaz',
    aliases: ['prayer', 'prayertimes'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const city = args.join(' ').trim() || 'Lahore';
        try {
            const waiting = await sock.sendMessage(jid, { text: `🕌 ${city} ke namaz timings la raha hun...` }, { quoted: m });
            // Sunni Hanafi: method=1 (University of Islamic Sciences, Karachi)
            // + school=1 (Hanafi Asr). Purana method=2 (ISNA America, Shafi Asr) tha — ghalat.
            const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Pakistan&method=1&school=1`;
            const res = await axios.get(url, { timeout: 20000 });
            const d = res.data?.data;
            if (!d?.timings) throw new Error('no timings');
            const t = d.timings;
            const date = d.date?.readable || '';
            const hijri = d.date?.hijri
                ? `${d.date.hijri.day} ${d.date.hijri.month.en} ${d.date.hijri.year}H`
                : '';

            const out = `╭━━━〔 🕌 *Namaz Timings — ${city}* 〕━━━┈⊷\n`
                + `┃📅 ${date}${hijri ? `  •  🌙 ${hijri}` : ''}\n`
                + `┃★╭──────────────\n`
                + `┃★│ 🌅 Fajr — *${clean(t.Fajr)}*\n`
                + `┃★│ 🌄 Sunrise — *${clean(t.Sunrise)}*\n`
                + `┃★│ ☀️ Dhuhr — *${clean(t.Dhuhr)}*\n`
                + `┃★│ 🌤️ Asr (Hanafi) — *${clean(t.Asr)}*\n`
                + `┃★│ 🌇 Maghrib — *${clean(t.Maghrib)}*\n`
                + `┃★│ 🌃 Isha — *${clean(t.Isha)}*\n`
                + `┃★╰──────────────\n`
                + `┃ 🕌 Sunni Hanafi • Karachi method\n`
                + `╰━━━━━━━━━━━━━━━┈⊷`;

            await sock.sendMessage(jid, { text: out, edit: waiting.key }, { quoted: m });
        } catch (e) {
            console.error('namaz error:', e.message);
            await sock.sendMessage(jid, {
                text: `❌ "${city}" ke timings nahi mil sakay.\n\n*Example:* .namaz Karachi`
            }, { quoted: m });
        }
    }
};
