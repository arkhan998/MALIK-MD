const fs = require('fs');
const path = require('path');
const config = require('../config.js');
const botEvents = require('../lib/events.js');

// ======================================================
// MORNING CARD — roz subah 5:00 AM (PKT) khud-ba-khud
// designed card: Islamic ayat/hadith + motivation + desi quote + date
// .morning on|off|now|status
// ======================================================

const STORE = path.join(__dirname, '..', 'data', 'morning.json');

function loadStore() {
    try { return JSON.parse(fs.readFileSync(STORE, 'utf8')); }
    catch (e) { return { enabled: [] }; }
}
function saveStore(s) {
    try {
        fs.mkdirSync(path.dirname(STORE), { recursive: true });
        fs.writeFileSync(STORE, JSON.stringify(s, null, 2));
    } catch (e) { /* ignore */ }
}

// ---------- Content banks (roz rotation) ----------
const ISLAMIC = [
    { ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", ur: "Beshak har mushkil ke sath aasani hai.", ref: "Surah Ash-Sharh 94:6" },
    { ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا", ur: "Aur kaho: Aye mere Rabb, mere ilm mein izafa farma.", ref: "Surah Taha 20:114" },
    { ar: "فَاذْكُرُونِي أَذْكُرْكُمْ", ur: "Tum mujhe yaad karo, Main tumhein yaad karunga.", ref: "Surah Al-Baqarah 2:152" },
    { ar: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا", ur: "Jo Allah se darta hai, Allah us ke liye nikalne ka rasta bana deta hai.", ref: "Surah At-Talaq 65:2" },
    { ar: "لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", ur: "Allah ki rehmat se mayoos na ho.", ref: "Surah Az-Zumar 39:53" },
    { ar: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", ur: "Beshak Allah sabr karne walon ke sath hai.", ref: "Surah Al-Baqarah 2:153" },
    { ar: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", ur: "Tum mein behtareen woh hai jo Quran seekhe aur sikhaye.", ref: "Hadith — Bukhari" },
    { ar: "الطُّهُورُ شَطْرُ الْإِيمَانِ", ur: "Paaki aadha imaan hai.", ref: "Hadith — Muslim" },
    { ar: "وَبَشِّرِ الصَّابِرِينَ", ur: "Aur sabr karne walon ko khushkhabri de do.", ref: "Surah Al-Baqarah 2:155" },
    { ar: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", ur: "Aamaal ka dar-o-madar niyyaton par hai.", ref: "Hadith — Bukhari" },
    { ar: "وَاللَّهُ خَيْرُ الرَّازِقِينَ", ur: "Aur Allah behtareen rizq dene wala hai.", ref: "Surah Al-Jumu'ah 62:11" },
    { ar: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", ur: "Humein Allah kaafi hai aur woh behtareen kaar-saaz hai.", ref: "Surah Aal-e-Imran 3:173" },
    { ar: "الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ", ur: "Reham karne walon par Rehman reham karta hai.", ref: "Hadith — Tirmidhi" },
    { ar: "وَقُولُوا لِلنَّاسِ حُسْنًا", ur: "Aur logon se achi baat kaha karo.", ref: "Surah Al-Baqarah 2:83" },
];

const MOTIVATION = [
    "Mehnat ka koi shortcut nahi — seedhi si baat, roz ka kaam.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Chota qadam bhi qadam hai — ruko mat, chalte raho.",
    "Your only limit is the story you keep telling yourself.",
    "Waqt kisi ka intezar nahi karta — aaj ka din tumhara hai.",
    "Discipline is choosing what you want most over what you want now.",
    "Girte hain shahsawar hi maidan-e-jung mein — haar kar jeetne wale ko baazigar kehte hain.",
    "Dream big, start small, act now.",
    "Mushkilein utni hi bari hoti hain jitna hum unhein bana lete hain.",
    "The best time to start was yesterday. The second best time is now.",
    "Khud par yaqeen aadhi jeet hai.",
    "Hard days make strong people. Keep going.",
    "Jo soya woh khoya — subah ki mehnat din bana deti hai.",
    "Small progress every day adds up to big results.",
];

const DESI = [
    "Ammi kehti hain: subah ka nashta, din bhar ki taaqat! 🍳",
    "Desi usool: chai ke baghair din shuru nahi hota. ☕",
    "Jitni chadar ho, utne paon phailao — yehi asal budget hai.",
    "Mehmaan nawazi dil se hoti hai, dastarkhwan se nahi.",
    "Nani ka totka: haldi wala doodh, har marz ki dawa! 🥛",
    "Bijli jaye to kya — gupshup to chalti rehti hai. 😄",
    "Baron ki izzat, choton se pyar — yehi hamari pehchan hai.",
    "Ammi ki dua aur abbu ki mehnat — dono ka koi muqabla nahi.",
    "Desi ghar mein 'aur khao' ka matlab hota hai: mohabbat. ❤️",
    "Sardi ho ya garmi, pind ki hawa sab se achi.",
    "Jo cheez ghar ki bani ho, us ka maza hi aur hai.",
    "Risleydaari nibhana seekho — waqt par rishtay hi kaam aate hain.",
    "Bachat aaj ki, sukh kal ka.",
    "Subah ki sair aur ammi ke hath ka paratha — jannat ka combo! 🌅",
];

// ---------- Helpers ----------
function pktNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
}
function dayIndex() {
    const n = pktNow();
    const start = new Date(n.getFullYear(), 0, 0);
    return Math.floor((n - start) / 86400000);
}
function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Card (server render) mein emoji fonts nahi hote — hata do, warna box bane ga.
// WhatsApp caption mein emojis theek ayenge (phone render karta hai).
function stripEmoji(s) {
    return String(s).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim();
}
function wrap(text, max) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
        if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur.trim()); cur = w; }
        else cur += ' ' + w;
    }
    if (cur.trim()) lines.push(cur.trim());
    return lines;
}

const THEMES = [
    { bg1: '#06392a', bg2: '#02120b', accent: '#d4af37', soft: '#f3ecd2', label: '#e9d8a6' },
    { bg1: '#0b1e4b', bg2: '#04081a', accent: '#7dd3fc', soft: '#e6eefc', label: '#bcd8ff' },
    { bg1: '#3d1150', bg2: '#150418', accent: '#fb923c', soft: '#fdeedd', label: '#ffd9b0' },
];

async function buildCard() {
    const sharp = require('sharp');
    const idx = dayIndex();
    const isl = ISLAMIC[idx % ISLAMIC.length];
    const mot = MOTIVATION[idx % MOTIVATION.length];
    const desi = DESI[idx % DESI.length];
    const th = THEMES[idx % THEMES.length];

    const now = pktNow();
    const dateLine = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    const hijri = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);

    const arLines = wrap(isl.ar, 30);
    const urLines = wrap(isl.ur, 46);
    const motLines = wrap(stripEmoji(mot), 42);
    const desiLines = wrap(stripEmoji(desi), 44);

    const tspans = (lines, x, y, dy) => lines.map((l, i) =>
        `<text x="${x}" y="${y + i * dy}" font-size="34" fill="${th.soft}" text-anchor="middle" font-family="sans-serif">${esc(l)}</text>`).join('\n');

    let y = 470;
    const arSvg = arLines.map((l, i) => `<text x="540" y="${y + i * 62}" font-size="46" fill="#ffffff" text-anchor="middle" font-family="sans-serif" font-weight="bold">${esc(l)}</text>`).join('\n');
    y += arLines.length * 62 + 16;
    const urSvg = urLines.map((l, i) => `<text x="540" y="${y + i * 46}" font-size="31" fill="${th.soft}" text-anchor="middle" font-family="sans-serif">${esc(l)}</text>`).join('\n');
    y += urLines.length * 46 + 8;
    const refY = y; y += 66;
    const motY = y + 84;
    const motSvg = tspans(motLines, 540, motY, 50);
    y = motY + motLines.length * 50 + 40;
    const desiY = y + 84;
    const desiSvg = tspans(desiLines, 540, desiY, 50);

    const svg = `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${th.bg1}"/><stop offset="1" stop-color="${th.bg2}"/>
  </linearGradient>
</defs>
<rect width="1080" height="1350" fill="url(#bg)"/>
<rect x="26" y="26" width="1028" height="1298" rx="36" fill="none" stroke="${th.accent}" stroke-width="4"/>
<text x="540" y="150" font-size="76" fill="${th.accent}" text-anchor="middle" font-family="sans-serif" font-weight="bold">SUBAH BAKHAIR</text>
<text x="540" y="216" font-size="38" fill="#ffffff" text-anchor="middle" font-family="sans-serif">${esc(dateLine)}</text>
<text x="540" y="266" font-size="31" fill="${th.label}" text-anchor="middle" font-family="sans-serif">${esc(hijri)}</text>
<line x1="240" y1="306" x2="840" y2="306" stroke="${th.accent}" stroke-width="3"/>
<text x="540" y="382" font-size="34" fill="${th.accent}" text-anchor="middle" font-family="sans-serif" font-weight="bold">— AAJ KI AYAT / HADITH —</text>
${arSvg}
${urSvg}
<text x="540" y="${refY}" font-size="27" fill="${th.label}" text-anchor="middle" font-family="sans-serif" font-style="italic">${esc(isl.ref)}</text>
<text x="540" y="${motY - 56}" font-size="34" fill="${th.accent}" text-anchor="middle" font-family="sans-serif" font-weight="bold">— MOTIVATION —</text>
${motSvg}
<text x="540" y="${desiY - 56}" font-size="34" fill="${th.accent}" text-anchor="middle" font-family="sans-serif" font-weight="bold">— DESI NASIHAT —</text>
${desiSvg}
<text x="540" y="1274" font-size="30" fill="${th.label}" text-anchor="middle" font-family="sans-serif">Allah aap ke din mein barkat de</text>
<text x="540" y="1312" font-size="26" fill="${th.accent}" text-anchor="middle" font-family="sans-serif" font-weight="bold">MALIK-MD</text>
</svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
}

async function sendCard(sock, jid) {
    const buf = await buildCard();
    const now = pktNow();
    const dateLine = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    await sock.sendMessage(jid, {
        image: buf,
        caption: `🌅 *Subah Bakhair!*\n📅 ${dateLine}\n\n🤲 Aaj ka din barkaton bhara ho — ye raha aaj ka morning card!\n\n> *MALIK-MD*`
    });
}

// ---------- Scheduler ----------
let liveSock = null;
botEvents.on('new-message', ({ sock }) => { if (sock) liveSock = sock; });
botEvents.on('sock-ready', ({ sock }) => { if (sock) liveSock = sock; });

let cronStarted = false;
function startCron() {
    if (cronStarted) return;
    cronStarted = true;
    try {
        const cron = require('node-cron');
        cron.schedule('0 5 * * *', async () => {
            try {
                const store = loadStore();
                if (!liveSock || !store.enabled.length) return;
                for (const jid of store.enabled) {
                    try { await sendCard(liveSock, jid); } catch (e) { console.error('morning send fail:', jid, e.message); }
                    await new Promise(r => setTimeout(r, 3000));
                }
            } catch (e) { console.error('morning cron error:', e.message); }
        }, { timezone: 'Asia/Karachi' });
        console.log('Morning card scheduler started (5:00 AM PKT).');
    } catch (e) { console.error('node-cron missing:', e.message); }
}
startCron();

// ---------- Command ----------
const command = {
    name: 'morning',
    aliases: ['subah', 'goodmorning'],
    exec: async (sock, m, args) => {
        liveSock = sock;
        const jid = m.key.remoteJid;
        const opt = (args[0] || '').toLowerCase();
        const store = loadStore();

        if (opt === 'on') {
            if (!store.enabled.includes(jid)) { store.enabled.push(jid); saveStore(store); }
            return sock.sendMessage(jid, { text: '🌅 *Morning Card ON!*\n\nRoz subah *5:00 AM* is chat mein designed card aayega — Islamic ayat/hadith, motivation, desi nasihat aur date ke sath.\n\nTest karna hai? `.morning now` likho!' }, { quoted: m });
        }
        if (opt === 'off') {
            store.enabled = store.enabled.filter(x => x !== jid); saveStore(store);
            return sock.sendMessage(jid, { text: '🌙 Morning Card *OFF* kar diya gaya hai.' }, { quoted: m });
        }
        if (opt === 'now') {
            await sock.sendMessage(jid, { text: '🎨 Card ban raha hai...' }, { quoted: m });
            try { await sendCard(sock, jid); }
            catch (e) { await sock.sendMessage(jid, { text: `❌ Card nahi ban saka: ${e.message}` }, { quoted: m }); }
            return;
        }
        const st = store.enabled.includes(jid) ? 'ON ✅' : 'OFF ❌';
        return sock.sendMessage(jid, { text: `🌅 *Morning Card* — Status: *${st}*\n\nRoz subah 5:00 AM designed card: ayat/hadith + motivation + desi nasihat + date (Hijri bhi!)\n\n*Usage:*\n• \`.morning on\` — is chat mein ON\n• \`.morning off\` — band karo\n• \`.morning now\` — abhi card bhejo (test)` }, { quoted: m });
    }
};

module.exports = command;
