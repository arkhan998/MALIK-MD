// ======================================================
// AMAZING MENU — .amenu
// Har dafa ek fresh gradient banner (SVG -> PNG, offline)
// + personalized greeting card menu:
// naam, Karachi waqt, live command count, categories
// direct commands ke sath.
//
// Themes har dafa rotate hote hain — menu kabhi purana
// nahi lagta. Koi external API nahi, sharp se banta hai.
// ======================================================
const fs = require('fs');
const path = require('path');
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const THEMES = [
    { name: 'Sunset', a: '#ff7b00', b: '#ff2e88', bg: '#160d14' },
    { name: 'Neon', a: '#7b2fff', b: '#00d4ff', bg: '#0a0a1a' },
    { name: 'Ocean', a: '#00b4ff', b: '#00ffa3', bg: '#061418' },
    { name: 'Emerald', a: '#00c853', b: '#b2ff59', bg: '#0a140c' },
    { name: 'Crimson', a: '#ff1744', b: '#ff9100', bg: '#180a0e' },
    { name: 'Royal', a: '#ffd700', b: '#ff7b00', bg: '#141006' },
];

const CATS = [
    ['🤖', 'AI Menu', 'aimenu', 24],
    ['⬇️', 'Download Menu', 'dlmenu', 6],
    ['🕌', 'Islamic Menu', 'islamicmenu', 17],
    ['👥', 'Group Menu', 'groupmenu', 25],
    ['🧰', 'Tools Menu', 'toolsmenu', 53],
    ['🎮', 'Fun & Games', 'funmenu', 30],
    ['💼', 'Business Menu', 'bizmenu', 25],
    ['👑', 'Owner Menu', 'ownermenu', 17],
];

let cachedStats = null;
function liveStats() {
    if (cachedStats) return cachedStats;
    try {
        const dir = path.join(__dirname);
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        let names = 0;
        for (const f of files) {
            const src = fs.readFileSync(path.join(dir, f), 'utf8');
            names += (src.match(/name:\s*["'][a-z0-9_]+["']/gi) || []).length;
            for (const mm of src.matchAll(/alias(?:es)?:\s*\[([^\]]*)\]/gi)) names += (mm[1].match(/["'][a-z0-9_]+["']/gi) || []).length;
        }
        cachedStats = { files: files.length, names };
    } catch { cachedStats = { files: 100, names: 482 }; }
    return cachedStats;
}

function greeting(hour) {
    if (hour < 5) return '🌙 Shab bakhair';
    if (hour < 12) return '☀️ Subah bakhair';
    if (hour < 17) return '🌤️ Dopahar bakhair';
    if (hour < 20) return '🌇 Shaam bakhair';
    return '🌙 Shab bakhair';
}

async function banner(theme, userName, stats, timeStr, dateStr) {
    const sharp = require('sharp');
    const W = 1280, H = 720;
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${theme.a}"/><stop offset="100%" stop-color="${theme.b}"/>
  </linearGradient>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${theme.bg}"/><stop offset="100%" stop-color="#000000"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<circle cx="1150" cy="80" r="240" fill="${theme.a}" opacity="0.14"/>
<circle cx="90" cy="660" r="200" fill="${theme.b}" opacity="0.12"/>
<rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="36" fill="none" stroke="url(#g)" stroke-width="4"/>
<text x="50%" y="150" font-size="44" fill="#9aa0aa" text-anchor="middle" font-family="sans-serif" letter-spacing="8">✦ MULTI-DEVICE WHATSAPP BOT ✦</text>
<text x="50%" y="290" font-size="150" font-weight="bold" fill="url(#g)" text-anchor="middle" font-family="sans-serif">MALIK-MD</text>
<text x="50%" y="360" font-size="40" fill="#ffffff" text-anchor="middle" font-family="sans-serif">Assalam-o-Alaikum, ${esc(userName)}!</text>
<text x="50%" y="425" font-size="34" fill="#c9cdd4" text-anchor="middle" font-family="sans-serif">${esc(timeStr)} • ${esc(dateStr)} (PKT)</text>
<g font-family="sans-serif" font-size="32" fill="#ffffff">
  <rect x="120" y="480" width="330" height="76" rx="38" fill="${theme.a}" opacity="0.9"/>
  <text x="285" y="530" text-anchor="middle">${stats.names} Commands</text>
  <rect x="475" y="480" width="330" height="76" rx="38" fill="${theme.b}" opacity="0.9"/>
  <text x="640" y="530" text-anchor="middle">${stats.files} Plugins</text>
  <rect x="830" y="480" width="330" height="76" rx="38" fill="#22262e"/>
  <text x="995" y="530" text-anchor="middle">${theme.name} Theme</text>
</g>
<text x="50%" y="640" font-size="30" fill="#8a8f98" text-anchor="middle" font-family="sans-serif">Channel: MALIK-MD Tech Updates • Type .btnmenu for categories</text>
</svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
}

module.exports = {
    name: 'amenu',
    alias: ['amazingmenu', 'newmenu', 'menu2'],
    exec: async (sock, m) => {
        const jid = m.key.remoteJid;
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const userName = m.pushName || 'Dost';
        const stats = liveStats();
        const theme = THEMES[Math.floor(Math.random() * THEMES.length)];

        const catLines = CATS.map((c, i) => `${i + 1}️⃣ ${c[0]} *${c[1]}* (${c[3]}) → .${c[2]}`).join('\n');
        const caption =
`╭━━━〔 🤖 *MALIK-MD* 〕━━━╮
 ${greeting(now.getHours())}, *${userName}*! 
 🕐 ${timeStr} • ${dateStr}
 ⚡ ${stats.names} Commands • 🧩 ${stats.files} Plugins • 🟢 Online
╰━━━━━━━━━━━━━━━━━━╯

📂 *CATEGORIES* — number wala menu: .btnmenu
${catLines}

💡 *Quick try:* .quiz • .meme • .guess • .btnmenu
🪄 Business ke liye: .jadoo — WhatsApp Business Automation by MALIK
📢 Channel: https://whatsapp.com/channel/0029VbAf3sx3bbUy90Z9K703

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ MALIK-MD*`;

        try {
            const img = await banner(theme, userName, stats, timeStr, dateStr);
            return sock.sendMessage(jid, { image: img, caption }, { quoted: m });
        } catch (e) {
            // Image fail ho jaye to text menu hi kafi hai
            return send(sock, m, caption);
        }
    }
};
