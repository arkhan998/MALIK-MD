const chatcache = require('../lib/chatcache.js');

// ======================================================
// GSTATS — group analytics (.stats) from message cache
// ======================================================

const isGroup = (m) => m.key.remoteJid && m.key.remoteJid.endsWith('@g.us');
const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

function hourLabel(ts) {
    const h = new Date(ts).getHours();
    const suffix = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12} ${suffix}`;
}

module.exports = {
    name: 'stats',
    aliases: ['gstats', 'groupstats'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        if (!isGroup(m)) {
            return sock.sendMessage(jid, { text: '❌ .stats sirf groups mein kaam karta hai.' }, { quoted: m });
        }
        const msgs = chatcache.get(jid, 120);
        if (msgs.length < 3) {
            return sock.sendMessage(jid, {
                text: '📊 Abhi itna data nahi hai.\nBot ko group mein thori der chalne do, phir .stats try karo — jitni chat hogi, utne behtar stats!'
            }, { quoted: m });
        }

        const counts = {};
        const hours = {};
        for (const x of msgs) {
            counts[x.sender] = (counts[x.sender] || 0) + 1;
            if (x.ts) {
                const hl = hourLabel(x.ts);
                hours[hl] = (hours[hl] || 0) + 1;
            }
        }
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];

        let out = `╭━━━〔 📊 *Group Stats* 〕━━━┈⊷\n`;
        out += `┃💬 Messages tracked: *${msgs.length}*\n`;
        out += `┃★╭──────────────\n┃★│ 🏆 *Top Talkers*\n`;
        top.forEach(([name, c], i) => {
            out += `┃★│ ${MEDALS[i]} ${name} — ${c}\n`;
        });
        out += `┃★╰──────────────\n`;
        if (topHour) out += `┃🕐 Sab se active time: *${topHour[0]}*\n`;
        out += `╰━━━━━━━━━━━━━━━┈⊷\n_Stats bot ke chalne ke doran jama hotay hain._`;

        await sock.sendMessage(jid, { text: out }, { quoted: m });
    }
};
