// ======================================================
// PACK: UTILITY 2 — public daily-life tools
// zodiac, horoscope, dayofweek, datecalc, roman, numwords,
// tipcalc, sipcalc, currency, worldtime, stopwatch,
// pomodoro, task, pwcheck, uname, bioideas, captions,
// hashtags
// ======================================================
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });
const hashNum = (s, max) => crypto.createHash('md5').update(s).digest().readUInt16BE(0) % max;
const pkDate = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));

const SIGNS = [['Capricorn ♑',19],['Aquarius ♒',49],['Pisces ♓',80],['Aries ♈',110],['Taurus ♉',141],['Gemini ♊',172],['Cancer ♋',204],['Leo ♌',235],['Virgo ♍',266],['Libra ♎',296],['Scorpio ♏',326],['Sagittarius ♐',356],['Capricorn ♑',400]];
const SIGN_PK = { aries:'Mesh ♈ | 21 Mar – 19 Apr', taurus:'Saur ♉ | 20 Apr – 20 May', gemini:'Jauza ♊ | 21 May – 20 Jun', cancer:'Sartan ♋ | 21 Jun – 22 Jul', leo:'Asad ♌ | 23 Jul – 22 Aug', virgo:'Sunbula ♍ | 23 Aug – 22 Sep', libra:'Meezan ♎ | 23 Sep – 22 Oct', scorpio:'Aqrab ♏ | 23 Oct – 21 Nov', sagittarius:'Qaus ♐ | 22 Nov – 21 Dec', capricorn:'Jadi ♑ | 22 Dec – 19 Jan', aquarius:'Dalw ♒ | 20 Jan – 18 Feb', pisces:'Hoot ♓ | 19 Feb – 20 Mar' };
const HORO_LINES = ['Aj ka din tumhare liye moafiq hai — bara faisla le sakte ho.', 'Paisay ke mamlay mein ehtiyaat — aj kharcha kam rakho.', 'Koi purana dost achanak samnay aa sakta hai.', 'Mehnat ka phal qareeb hai, himmat na haro.', 'Aj gussa control mein rakho, shaam behtar hogi.', 'Safar ka moqa ban sakta hai — tayyar raho.', 'Khamoshi aj tumhari sab se bari taqat hai.', 'Ek achi khabar raste mein hai, sabr rakho.'];
const HORO_LUCKY = ['Sunehra', 'Sabz', 'Neela', 'Safed', 'Gulabi', 'Narangi', 'Jamni'];

const ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function numWords(n) {
    if (n < 0) return 'minus ' + numWords(-n);
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numWords(n % 100) : '');
    if (n < 1e6) return numWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + numWords(n % 1000) : '');
    if (n < 1e9) return numWords(Math.floor(n / 1e6)) + ' million' + (n % 1e6 ? ' ' + numWords(n % 1e6) : '');
    return String(n);
}
function toRoman(num) {
    if (num < 1 || num > 3999) return null;
    const T = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let out = ''; for (const [v, r] of T) while (num >= v) { out += r; num -= v; } return out;
}
const parseDate = (s) => { const p = (s || '').split(/[-/]/).map(Number); if (p.length !== 3 || p.some(isNaN)) return null; let [a, b, c] = p; let d = c > 31 ? new Date(c, b - 1, a) : new Date(a, b - 1, c); return isNaN(d) ? null : d; };

const DATA = path.join(__dirname, '..', 'data', 'tasks.json');
const loadTasks = () => { try { return JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch { return {}; } };
const saveTasks = (t) => { fs.mkdirSync(path.dirname(DATA), { recursive: true }); fs.writeFileSync(DATA, JSON.stringify(t, null, 2)); };
const swMap = new Map();

const BIOS = ['😎 | Apni kahani ka khud hero hun', 'Kam bolo, ziada karo 💪', 'Sapne wo nahi jo neend mein aain, sapne wo hain jo neend na ane dein ✨', '☕ Chai + sukoon = zindagi', 'Mehnat chup kar karo, kamyabi shor karegi 🔥', 'Simple banda, bare khwab 🌙', 'Waqt sab ka ata hai ⏳', 'Apne kaam se kaam rakho 🤫'];
const CAPS = { attitude: ['Apna time ayega 🔥', 'Hum woh hain jin ke hone se mehfil hai 😎', 'Sabr mera hathyar, waqt mera jawab ⏳'], love: ['Tum mile to laga khuda ne dua sun li ❤️', 'Mohabbat mein haar bhi jeet hai 💕', 'Dil ne kaha bas tum ✨'], sad: ['Kuch zakham lafzon se nahi bhartay 💔', 'Hansi ke peechay dard chhupa hai 🌧️', 'Khamoshi bhi ek jawab hai 🖤'], funny: ['Mera wallet bhi diet par hai 😂', 'Neend se mohabbat, kaam se dushmani 😴', 'Main lazy nahi, energy saving mode mein hun 🔋'], islamic: ['Alhamdulillah har hal mein 🤲', 'Allah par tawakkul hi kamyabi hai ✨', 'Sabr ka phal meetha hota hai 🌙'] };
const HASH = { general: '#viral #trending #pakistan #lahore #foryou #fyp', business: '#smallbusiness #pakistanbusiness #entrepreneur #shoplocal #malik', food: '#foodie #lahorefood #desifood #foodlover #yummy', travel: '#travelpakistan #beautifulpakistan #northernareas #wanderlust', photo: '#photography #instagood #photooftheday #nature' };

module.exports = [
    { name: 'zodiac', alias: ['burj'], exec: async (sock, m, args) => {
        const d = parseDate(args[0]); if (!d) return send(sock, m, '♈ Apni date of birth likho!\nExample: .zodiac 15-8-2000');
        const start = new Date(d.getFullYear(), 0, 0); const doy = Math.floor((d - start) / 864e5);
        const sign = SIGNS.find(([, lim]) => doy <= lim)[0];
        return send(sock, m, `♈ *Tumhara burj (zodiac):* ${sign}`); } },
    { name: 'horoscope', alias: ['falak'], exec: async (sock, m, args) => {
        const key = (args[0] || '').toLowerCase(); const info = SIGN_PK[key];
        if (!info) return send(sock, m, '♈ Apna burj English mein likho!\nExample: .horoscope leo\n\nBurj: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces');
        const seed = key + pkDate().toDateString();
        return send(sock, m, `🔮 *Aj ka Horoscope — ${info.split('|')[0].trim()}*\n${info.split('|')[1].trim()}\n\n${HORO_LINES[hashNum(seed, HORO_LINES.length)]}\n🍀 Lucky number: ${hashNum(seed + 'n', 9) + 1}\n🎨 Lucky rang: ${HORO_LUCKY[hashNum(seed + 'c', HORO_LUCKY.length)]}\n\n_(sirf tafreeh ke liye 😊)_`); } },
    { name: 'dayofweek', alias: ['din'], exec: async (sock, m, args) => {
        const d = parseDate(args[0]); if (!d) return send(sock, m, '📅 Date likho!\nExample: .dayofweek 23-10-2026');
        return send(sock, m, `📅 ${d.toLocaleDateString('en-GB')} ko *${d.toLocaleDateString('en-US', { weekday: 'long' })}* tha/hai.`); } },
    { name: 'datecalc', alias: ['daysbetween'], exec: async (sock, m, args) => {
        const d1 = parseDate(args[0]); if (!d1) return send(sock, m, '📅 Dates likho!\nExample: .datecalc 1-1-2026 31-12-2026\nYa ek date: .datecalc 31-12-2026 (aj se farq)');
        const d2 = parseDate(args[1]) || pkDate();
        const days = Math.round(Math.abs(d2 - d1) / 864e5);
        return send(sock, m, `📅 Dono dates ke darmiyan *${days} din* hain (${(days / 30.44).toFixed(1)} mahine / ${(days / 365.25).toFixed(2)} saal).`); } },
    { name: 'roman', alias: ['romannum'], exec: async (sock, m, args) => { const n = parseInt(args[0]); const r = toRoman(n); return send(sock, m, r ? `🏛️ ${n} = *${r}*` : '🏛️ 1 se 3999 tak ka number likho!\nExample: .roman 2026'); } },
    { name: 'numwords', alias: ['numtowords'], exec: async (sock, m, args) => { const n = parseInt((args[0] || '').replace(/,/g, '')); if (isNaN(n)) return send(sock, m, '🔢 Number likho!\nExample: .numwords 125000'); return send(sock, m, `🔢 *${n.toLocaleString()}* = ${numWords(n)}`); } },
    { name: 'tipcalc', alias: ['tip'], exec: async (sock, m, args) => { const [bill, tip = 10, ppl = 1] = args.map(Number); if (!bill) return send(sock, m, '🧾 Example: .tipcalc 5000 10 4\n(bill, tip %, log)'); const total = bill * (1 + tip / 100); return send(sock, m, `🧾 *Bill:* Rs ${bill}\n💝 Tip (${tip}%): Rs ${Math.round(bill * tip / 100)}\n💰 Total: Rs ${Math.round(total)}\n👥 Per banda (${ppl}): *Rs ${Math.round(total / ppl)}*`); } },
    { name: 'sipcalc', alias: ['sip'], exec: async (sock, m, args) => { const [monthly, years, rate = 15] = args.map(Number); if (!monthly || !years) return send(sock, m, '📈 Example: .sipcalc 5000 5 15\n(mahana bachat, saal, expected return %)'); const r = rate / 1200, n = years * 12; const fv = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r); const inv = monthly * n; return send(sock, m, `📈 *Bachat Plan:*\n💰 Jama: Rs ${inv.toLocaleString()}\n📊 Andazi value (${rate}%/saal): *Rs ${Math.round(fv).toLocaleString()}*\n🎉 Munafa: Rs ${Math.round(fv - inv).toLocaleString()}\n\n_(andaza hai, guarantee nahi)_`); } },
    { name: 'currency', alias: ['forexrate'], exec: async (sock, m, args) => { const amt = parseFloat(args[0]) || 1; const from = (args[1] || 'USD').toUpperCase(); const to = (args[2] || 'PKR').toUpperCase(); try { const r = await axios.get(`https://open.er-api.com/v6/latest/${from}`, { timeout: 8000 }); const rate = r.data && r.data.rates && r.data.rates[to]; if (!rate) throw 0; return send(sock, m, `💱 *${amt} ${from} = ${(amt * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}*\nRate: 1 ${from} = ${rate} ${to}\n_(open market andaza, bank/market rate mukhtalif ho sakta hai)_`); } catch { return send(sock, m, '💱 Rate abhi nahi mil saka — thodi der baad try karo.'); } } },
    { name: 'worldtime', alias: ['wtime'], exec: async (sock, m) => { const zones = [['🇵🇰 Pakistan', 'Asia/Karachi'], ['🇦🇪 Dubai', 'Asia/Dubai'], ['🇸🇦 Makkah', 'Asia/Riyadh'], ['🇬🇧 London', 'Europe/London'], ['🇺🇸 New York', 'America/New_York'], ['🇨🇳 Beijing', 'Asia/Shanghai']]; const now = new Date(); const lines = zones.map(([n, z]) => `${n}: *${now.toLocaleTimeString('en-GB', { timeZone: z, hour: '2-digit', minute: '2-digit' })}* (${now.toLocaleDateString('en-GB', { timeZone: z, weekday: 'short', day: 'numeric', month: 'short' })})`); return send(sock, m, '🌍 *Duniya ka waqt:*\n' + lines.join('\n')); } },
    { name: 'stopwatch', alias: ['sw'], exec: async (sock, m, args) => { const me = m.key.participant || m.key.remoteJid; const act = (args[0] || '').toLowerCase(); if (act === 'start') { swMap.set(me, Date.now()); return send(sock, m, '⏱️ Stopwatch shuru! Rokne ke liye: .stopwatch stop'); } if (act === 'stop') { const t0 = swMap.get(me); if (!t0) return send(sock, m, '⏱️ Pehle .stopwatch start karo.'); swMap.delete(me); const sec = (Date.now() - t0) / 1000; return send(sock, m, `⏱️ *Waqt: ${Math.floor(sec / 60)} min ${(sec % 60).toFixed(1)} sec*`); } return send(sock, m, '⏱️ .stopwatch start / .stopwatch stop'); } },
    { name: 'pomodoro', alias: ['pomo'], exec: async (sock, m, args) => { const mins = Math.min(120, Math.max(1, parseInt(args[0]) || 25)); send(sock, m, `🍅 Pomodoro shuru — *${mins} minute* focus karo! Waqt khatam hote hi bata dun ga.`); setTimeout(() => { sock.sendMessage(m.key.remoteJid, { text: `🍅⏰ @${(m.key.participant || m.key.remoteJid).split('@')[0]} Pomodoro khatam! ${mins} minute poora — ab 5 minute break lo ☕`, mentions: [m.key.participant || m.key.remoteJid] }).catch(() => {}); }, mins * 60000); } },
    { name: 'task', alias: ['tasks', 'mytodo'], exec: async (sock, m, args) => { const me = m.key.participant || m.key.remoteJid; const all = loadTasks(); all[me] = all[me] || []; const act = (args[0] || 'list').toLowerCase();
        if (act === 'add') { const t = args.slice(1).join(' '); if (!t) return send(sock, m, '📝 Example: .task add kal client ko call karni hai'); all[me].push({ t, done: false }); saveTasks(all); return send(sock, m, `✅ Task add ho gaya! (kul ${all[me].length})`); }
        if (act === 'done') { const i = parseInt(args[1]) - 1; if (!all[me][i]) return send(sock, m, '❌ Ye number wala task nahi hai.'); all[me][i].done = true; saveTasks(all); return send(sock, m, '🎉 Task complete mark ho gaya!'); }
        if (act === 'clear') { all[me] = all[me].filter(x => !x.done); saveTasks(all); return send(sock, m, '🧹 Complete wale tasks saaf ho gaye.'); }
        if (!all[me].length) return send(sock, m, '📝 Tumhari task list khaali hai.\nAdd karo: .task add <kaam>');
        return send(sock, m, '📝 *Tumhare Tasks:*\n' + all[me].map((x, i) => `${i + 1}. ${x.done ? '✅' : '⬜'} ${x.t}`).join('\n') + '\n\n.task done <number> | .task clear'); } },
    { name: 'pwcheck', alias: ['passwordmeter'], exec: async (sock, m, args) => { const p = args.join(' '); if (!p) return send(sock, m, '🔐 Password likho check karun (save nahi hota).\nExample: .pwcheck Malik@2026'); let sc = 0; if (p.length >= 8) sc++; if (p.length >= 12) sc++; if (/[A-Z]/.test(p)) sc++; if (/[a-z]/.test(p)) sc++; if (/\d/.test(p)) sc++; if (/[^A-Za-z0-9]/.test(p)) sc++; return send(sock, m, `🔐 *Password strength:* ${'🟩'.repeat(sc)}${'⬜'.repeat(6 - sc)} ${sc >= 5 ? 'Zabardast! 💪' : sc >= 3 ? 'Theek hai, aur behtar karo' : 'Kamzor hai! Bara + capital + number + symbol (@#$) milao'}\n_Length: ${p.length}_\n\n_(password kahin save nahi hua, fikar na karo)_`); } },
    { name: 'uname', alias: ['usernamegen'], exec: async (sock, m, args) => { const base = (args[0] || '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (!base) return send(sock, m, '👤 Naam likho!\nExample: .uname atta'); const pre = ['its', 'the', 'mr', 'real', 'iam', 'official']; const suf = ['official', 'pk', '786', '_x', '.pk', 'writes', 'creates', 'tech', 'king', '_official']; const out = new Set(); while (out.size < 8) out.add(Math.random() > .5 ? pre[hashNum(base + out.size + 'p', pre.length)] + base : base + suf[hashNum(base + out.size + 's', suf.length)]); return send(sock, m, '👤 *Username ideas:*\n' + [...out].map(u => '• @' + u).join('\n')); } },
    { name: 'bioideas', alias: ['biogen'], exec: async (sock, m) => { const a = [...BIOS].sort(() => Math.random() - .5).slice(0, 3); return send(sock, m, '✨ *WhatsApp/Insta Bio ideas:*\n' + a.map(b => '• ' + b).join('\n') + '\n\nAur chahiye to phir .bioideas likho.'); } },
    { name: 'captions', alias: ['captiongen'], exec: async (sock, m, args) => { const k = (args[0] || '').toLowerCase(); const bank = CAPS[k] || [...CAPS.attitude, ...CAPS.funny]; return send(sock, m, `📸 *Caption ideas (${k || 'mix'}):*\n` + [...bank].sort(() => Math.random() - .5).slice(0, 3).map(c => '• ' + c).join('\n') + '\n\nCategories: attitude, love, sad, funny, islamic'); } },
    { name: 'hashtags', alias: ['hashtaggen'], exec: async (sock, m, args) => { const k = (args[0] || 'general').toLowerCase(); return send(sock, m, `🏷️ *Hashtags (${k}):*\n${HASH[k] || HASH.general}\n\nTopics: business, food, travel, photo, general`); } },
];
