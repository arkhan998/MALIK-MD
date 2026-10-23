// ======================================================
// PACK: ENTERTAINMENT — amazing fun features
// 8ball, ship, compliment, pickupline, riddle, quiz
// (interactive game), wouldyourather, fact, fortune,
// emojiquiz, meme (image maker), cat, dog, never
// ======================================================
const axios = require('axios');
const crypto = require('crypto');
const botEvents = require('../lib/events.js');
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const hashNum = (s, max) => crypto.createHash('md5').update(s).digest().readUInt16BE(0) % max;

const BALL = ['Bilkul! Pakka wala haan ✅', 'Sitaare keh rahe hain — ho jayega ✨', 'Haan, lekin thoda sabr ⏳', 'Mushkil lagta hai... lekin na-mumkin nahi 💪', 'Abhi nahi, sahi waqt anay wala hai 🌙', 'Nahi yaar, is dafa nahi ❌', 'Badal chaye hain — sign wazeh nahi ☁️', 'Phir se poochho dil se 🤔', '100% — likh lo 📝', 'Khwab acha hai, mehnat bhi kar lena 😄'];
const COMPLIMENTS = ['Tumhari muskurahat kisi ka din bana sakti hai 😊', 'Tum woh dost ho jis ki har mehfil ko talash hoti hai ✨', 'Tumhari baaton mein ek ajeeb sa sukoon hai 🌙', 'Log tum se mil kar positive ho jate hain — yeh khasiyat har kisi mein nahi hoti 💫', 'Tumhara style alag hai — copy karna mushkil hai 😎', 'Tum mushkil mein bhi doosron ko hansana jante ho 👏', 'Tumhari mehnat ek din sab ko jawab degi 💪', 'Duniya ko tum jaisay logon ki bohat zarurat hai ❤️'];
const PICKUPS = ['Tum WiFi ho kya? Kyunki connection feel ho raha hai 📶😄', 'Google par sab milta hai, lekin tum search se bhi upar ho 🔍✨', 'Tum chai ho kya? Baghair tumhare subah adhuri lagti hai ☕', 'Bijli ka bill to nahi ho? Kyunki heart rate barha diya ⚡', 'Tum dictionary ho kya? Zindagi ko meaning de diya 📖', 'Signal weak ho sakta hai, lekin tumhari smile full tower hai 📱😊'];
const RIDDLES = [
    { q: 'Woh kon si cheez hai jo bolti nahi, lekin har baat dohrati hai?', a: 'Goonj (echo)' },
    { q: 'Mere paas sheher hain lekin ghar nahi, janglaat hain lekin darakht nahi, darya hain lekin pani nahi. Main kya hun?', a: 'Naqsha (map)' },
    { q: 'Jo cheez jitni zyada bharo, utni halki hoti jati hai?', a: 'Ghubara (balloon)' },
    { q: 'Main hamesha ata hun lekin kabhi pohanchta nahi — main kya hun?', a: 'Kal (tomorrow)' },
    { q: 'Woh kya hai jo tumhara hai, lekin istemal sab se zyada doosre karte hain?', a: 'Tumhara naam' },
    { q: 'Kis cheez ki gardan hai lekin sir nahi?', a: 'Botal' },
    { q: 'Woh kya hai jo daur sakta hai lekin chal nahi sakta?', a: 'Pani / gharrhi ki sui (time)' },
    { q: 'Ek kamra jisme na darwaza na khidki — andar band hun, main kya hun?', a: 'Anda (egg)' }
];
const WYR = [
    ['Hamesha 10 minute late hona', 'Hamesha 20 minute pehle pohanch jana'],
    ['Baghair mobile ek hafta', 'Baghair chai ek hafta'],
    ['Urr sakna', 'Invisible ho sakna'],
    ['Crorepati lekin akailay', 'Gareeb lekin doston se ghira hua'],
    ['Hamesha garmi mein rehna', 'Hamesha sardi mein rehna'],
    ['Apna mustaqbil dekh sakna', 'Apna maazi badal sakna'],
    ['Bol sakne wali billi', 'Bol sakne wala tota'],
    ['Har zaban bol sakna', 'Har instrument baja sakna']
];
const FACTS = [
    'Shehed (honey) kabhi kharab nahi hota — 3000 saal purana shehed bhi khane ke qabil mila hai 🍯',
    'Insaan ki naak 1 trillion (10 kharab) se zyada khushbuon mein farq kar sakti hai 👃',
    'Octopus ke 3 dil hote hain 🐙',
    'Chaand par astronaut ke qadmon ke nishan lakhon saal rahenge — wahan hawa hi nahi 🌙',
    'Samandar ka sab se gehra maqam itna gehra hai ke Mount Everest usmein doob jaye 🌊',
    'Billi (cat) apni zindagi ka ~70% so kar guzarti hai 😴',
    'Bijli ka ek karka (lightning) sooraj ki satah se 5 guna zyada garam ho sakta hai ⚡',
    'Tumhare jism mein itna loha (iron) hai ke ek chhoti keel (nail) ban jaye 🔩',
    'Kele (banana) aur insaan ka DNA takreeban 60% milta julta hai 🍌',
    'Duniya bhar mein har saal toofanon se zyada log nariyal girne se marte hain 🥥'
];
const EMOJIQUIZ = [
    { e: '🦁👑', a: 'The Lion King (movie)' },
    { e: '🚢🧊💔', a: 'Titanic (movie)' },
    { e: '🕷️🧑', a: 'Spider-Man' },
    { e: '🍕🐢🥷', a: 'Teenage Mutant Ninja Turtles' },
    { e: '⚡🧑‍🦱🪄🏰', a: 'Harry Potter' },
    { e: '🍎👩‍🏫📚', a: 'School / teacher (back to school)' },
    { e: '🌧️☔💃', a: 'Barish mein nachna (monsoon masti)' },
    { e: '🇵🇰🏏🏆', a: 'Pakistan cricket jeet gaya!' }
];
const NEVERS = [
    'Maine kabhi class mein so nahi gaya... kabhi nahi 😴 — tum batao?',
    'Maine kabhi ammi ke hath ke khane ko bura nahi kaha (himat hi nahi hui) 🍲',
    'Maine kabhi dost ki DP par zoom karke logo ko nahi dekha 🔍',
    'Maine kabhi "bas 5 minute" keh kar 2 ghante game nahi kheli 🎮',
    'Maine kabhi rizq (khana) girane par "chalo koi baat nahi" keh kar utha kar nahi khaya 😅',
    'Maine kabhi alarm band karke "uth raha hun" jhoot nahi bola ⏰',
    'Maine kabhi baarish mein bheeg kar bimar hone par garma garam chai nahi maangi ☕'
];
const QUESTIONS = [
    { q: 'Pakistan kis saal azad hua?', opts: ['1945', '1947', '1950', '1948'], a: 1 },
    { q: 'Duniya ka sab se bara samandar konsa hai?', opts: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], a: 2 },
    { q: 'Insaan ke jism mein kitni haddiyan hoti hain?', opts: ['206', '186', '226', '256'], a: 0 },
    { q: 'Pakistan ka qaumi khel konsa hai?', opts: ['Cricket', 'Hockey', 'Football', 'Squash'], a: 1 },
    { q: 'Roshni ki raftaar taqreeban kitni hai?', opts: ['3 lakh km/s', '1 lakh km/s', '30 hazar km/s', '3 crore km/s'], a: 0 },
    { q: 'Quaid-e-Azam ki paidaish ka sheher konsa hai?', opts: ['Lahore', 'Delhi', 'Karachi', 'Bombay'], a: 2 },
    { q: 'Pani ka chemical formula kya hai?', opts: ['CO2', 'O2', 'NaCl', 'H2O'], a: 3 },
    { q: 'Duniya ka sab se lamba darya konsa hai?', opts: ['Amazon', 'Nile', 'Indus', 'Yangtze'], a: 1 },
    { q: 'Computer ka "dimagh" kisay kehte hain?', opts: ['RAM', 'Hard disk', 'CPU', 'Monitor'], a: 2 },
    { q: 'Pakistan ka sab se oncha pahar konsa hai?', opts: ['Nanga Parbat', 'K2', 'Tirich Mir', 'Rakaposhi'], a: 1 }
];
const FORTUNE_MOODS = ['Aaj ka din tumhare liye khaas hai — ek purani khwahish ki taraf qadam barhega.', 'Aaj kisi purane dost se achi khabar milegi.', 'Aaj paisa soch samajh kar kharch karna, faida hoga.', 'Aaj tumhari mehnat kisi ki nazar mein ayegi — rutba barhega.', 'Aaj ghar walon ke sath waqt guzarna sukoon dega.', 'Aaj ek mauqa darwaze par hai — pehchanna tumhara kaam hai.'];
const COLORS = ['Sabz 💚', 'Neela 💙', 'Sunehra 🧡', 'Safed 🤍', 'Gulabi 💗', 'Jamni 💜'];

// ---------- Interactive Quiz sessions ----------
const quizSessions = new Map(); // key chat|user -> {qs, idx, score}
function quizText(qn, total, q) {
    return `🧠 *QUIZ — Sawal ${qn}/${total}*\n\n❓ ${q.q}\n\n` + q.opts.map((o, i) => `${'ABCD'[i]}. ${o}`).join('\n') + `\n\n👉 Jawab mein sirf *A, B, C ya D* likho`;
}
async function startQuiz(sock, m) {
    const key = m.key.remoteJid + '|' + (m.key.participant || m.key.remoteJid);
    const qs = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
    quizSessions.set(key, { qs, idx: 0, score: 0 });
    return send(sock, m, `🎮 *Quiz shuru!* 5 sawal hain — chalo dekhte hain kitne sahi hote hain.\n\n` + quizText(1, 5, qs[0]));
}
botEvents.on('new-message', async ({ sock, m }) => {
    try {
        const key = m.key.remoteJid + '|' + (m.key.participant || m.key.remoteJid);
        const s = quizSessions.get(key);
        if (!s || m.key.fromMe) return;
        const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
        if (!/^[a-dA-D]$/.test(body)) return;
        const q = s.qs[s.idx];
        const chosen = 'abcd'.indexOf(body.toLowerCase());
        const right = chosen === q.a;
        if (right) s.score++;
        let out = right ? `✅ *Sahi jawab!*` : `❌ Ghalat — sahi jawab tha *${'ABCD'[q.a]}. ${q.opts[q.a]}*`;
        s.idx++;
        if (s.idx >= s.qs.length) {
            quizSessions.delete(key);
            const grade = s.score === 5 ? '🏆 PERFECT! Tum to champion ho!' : s.score >= 3 ? '👏 Bohat khoob!' : s.score >= 1 ? '🙂 Acha try tha — phir khelo ge to behtar hoga' : '😅 Is dafa naseeb kharab tha — dobara try karo!';
            return send(sock, m, `${out}\n\n🎮 *Quiz khatam!*\nScore: *${s.score}/5*\n${grade}\n\nPhir khelna ho to \`.quiz\``);
        }
        return send(sock, m, out + '\n\n' + quizText(s.idx + 1, s.qs.length, s.qs[s.idx]));
    } catch (e) {}
});

// ---------- Meme maker helpers ----------
function memeEscape(t) {
    return String(t || '_').replace(/_/g, '__').replace(/-/g, '--').replace(/ /g, '_').replace(/\?/g, '~q').replace(/&/g, '~a').replace(/%/g, '~p').replace(/#/g, '~h').replace(/\//g, '~s').replace(/"/g, "''").trim() || '_';
}
const MEMES = { drake: 'Drake (upar pasand nahi / neeche pasand)', fine: 'This is fine (dog aag mein)', doge: 'Doge', success: 'Success kid', fry: 'Fry (soch raha hai)', buzz: 'Buzz Lightyear (har jagah)', uno: 'UNO card', grumpy: 'Grumpy cat' };

module.exports = [
    {
        name: '8ball',
        alias: ['ball'],
        exec: async (sock, m, args) => {
            if (!args.length) return send(sock, m, '🎱 *Magic 8-Ball*\n\nDil ka sawaal poochho:\n`.8ball Kya kal chhutti hogi?`');
            return send(sock, m, `🎱 *8-Ball kehta hai:*\n\n${pick(BALL)}`);
        }
    },
    {
        name: 'ship',
        exec: async (sock, m, args) => {
            const raw = args.join(' ');
            const parts = raw.split(/[+&xX]| aur | and /i).map(x => x.trim()).filter(Boolean);
            if (parts.length < 2) return send(sock, m, '💘 *Ship Meter*\n\nExample: `.ship Ali + Fatima`\nDo naamon ki jori kitni jamti hai, % mein jawab milega 😄');
            const [a, b] = [parts[0], parts[1]];
            const pct = 7 + hashNum((a + '❤' + b).toLowerCase(), 94);
            const filled = Math.round(pct / 10);
            const bar = '💗'.repeat(Math.ceil(filled / 2)) + '🤍'.repeat(5 - Math.ceil(filled / 2));
            const line = pct >= 85 ? '🔥 Aag lagi basti mein! Ye jori to bani hi ek doosre ke liye hai' : pct >= 65 ? '💖 Bohat achi chemistry — baat aage barh sakti hai' : pct >= 45 ? '🙂 Dostana vibes zyada hain, waqt lagega' : pct >= 25 ? '😅 Thoda mushkil hai, lekin koshish jaari rakho' : '🧊 Baraf jami hui hai — pehle dosti hi mushkil lagti hai';
            return send(sock, m, `💘 *SHIP METER*\n\n👤 ${a}\n💞\n👤 ${b}\n\n${bar} *${pct}%*\n\n${line}`);
        }
    },
    { name: 'compliment', exec: async (sock, m, args) => send(sock, m, `💐 ${pick(COMPLIMENTS)}`) },
    { name: 'pickupline', alias: ['pickup'], exec: async (sock, m, args) => send(sock, m, `😉 ${pick(PICKUPS)}`) },
    {
        name: 'riddle',
        exec: async (sock, m, args) => {
            const r = pick(RIDDLES);
            return send(sock, m, `🧩 *PAHELI*\n\n${r.q}\n\nJawab: ||${r.a}||\n_(Jawab dekhne ke liye upar wali line ko dabao)_`);
        }
    },
    {
        name: 'quiz',
        exec: async (sock, m, args) => {
            if ((args[0] || '').toLowerCase() === 'stop') {
                quizSessions.delete(m.key.remoteJid + '|' + (m.key.participant || m.key.remoteJid));
                return send(sock, m, '🛑 Quiz band kar diya.');
            }
            return startQuiz(sock, m);
        }
    },
    {
        name: 'wouldyourather',
        alias: ['wyr'],
        exec: async (sock, m, args) => { const w = pick(WYR); return send(sock, m, `🤔 *YEH YA WOH?*\n\n🅰️ ${w[0]}\n\n🆚\n\n🅱️ ${w[1]}\n\nApna jawab batao — dekho kon jeet-ta hai group mein!`); }
    },
    { name: 'fact', exec: async (sock, m, args) => send(sock, m, `🤯 *Amazing Fact*\n\n${pick(FACTS)}`) },
    {
        name: 'fortune',
        exec: async (sock, m, args) => {
            const who = (m.pushName || 'dost').trim();
            const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
            const seed = who + '|' + day;
            const lucky = 1 + hashNum(seed + 'n', 99);
            const color = COLORS[hashNum(seed + 'c', COLORS.length)];
            const mood = FORTUNE_MOODS[hashNum(seed + 'm', FORTUNE_MOODS.length)];
            return send(sock, m, `🔮 *AAJ KA FORTUNE — ${who}*\n\n${mood}\n\n🍀 Lucky number: *${lucky}*\n🎨 Lucky rang: *${color}*\n\n_(Har din naya fortune — kal phir check karna)_`);
        }
    },
    {
        name: 'emojiquiz',
        exec: async (sock, m, args) => {
            const e = pick(EMOJIQUIZ);
            return send(sock, m, `🎬 *EMOJI QUIZ*\n\nGuess karo yeh kis cheez ki kahani hai:\n\n${e.e}\n\nJawab: ||${e.a}||`);
        }
    },
    {
        name: 'meme',
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const parts = args.join(' ').split('|').map(x => x.trim());
            const tpl = (parts[0] || '').toLowerCase();
            if (!MEMES[tpl]) return send(sock, m, `😂 *Meme Maker*\n\nExample: \`.meme drake | mehnat | aram\`\n(Pehle template, phir | upar text | neeche text)\n\nTemplates:\n${Object.entries(MEMES).map(([k, v]) => `• *${k}* — ${v}`).join('\n')}`);
            const top = memeEscape(parts[1] || '_'), bottom = memeEscape(parts[2] || '_');
            try {
                const url = `https://api.memegen.link/images/${tpl}/${top}/${bottom}.png`;
                const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 25000 });
                await sock.sendMessage(jid, { image: Buffer.from(data), caption: '😂 MALIK-MD Meme Maker' }, { quoted: m });
            } catch (e) { return send(sock, m, '❌ Meme nahi ban saka abhi, thodi dair baad try karo.'); }
        }
    },
    {
        name: 'cat',
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            try {
                const { data } = await axios.get('https://cataas.com/cat', { responseType: 'arraybuffer', timeout: 20000 });
                await sock.sendMessage(jid, { image: Buffer.from(data), caption: '🐱 Meow! MALIK-MD' }, { quoted: m });
            } catch (e) { return send(sock, m, '🐱 Billi abhi so rahi hai, phir try karo.'); }
        }
    },
    {
        name: 'dog',
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            try {
                const { data } = await axios.get('https://dog.ceo/api/breeds/image/random', { timeout: 15000 });
                const img = await axios.get(data.message, { responseType: 'arraybuffer', timeout: 20000 });
                await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: '🐶 Woof! MALIK-MD' }, { quoted: m });
            } catch (e) { return send(sock, m, '🐶 Kutta abhi sair par gaya hai, phir try karo.'); }
        }
    },
    { name: 'never', exec: async (sock, m, args) => send(sock, m, `🙈 *KABHI NAHI...?*\n\n${pick(NEVERS)}`) }
];
