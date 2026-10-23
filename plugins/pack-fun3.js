// ======================================================
// PACK: FUN 3 — games & meters (PUBLIC)
// guess (interactive), hangman (interactive), slots,
// roulette, aura, iq, savage, crush, dostmeter, luck,
// mood, sachmeter, babyname, nickgen, challenge, twister,
// wisdom, latifa, ghazal, flirt, emojistory
// ======================================================
const crypto = require('crypto');
const botEvents = require('../lib/events.js');
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const hashNum = (s, max) => crypto.createHash('md5').update(s).digest().readUInt16BE(0) % max;
const meter = (label, pct, emoji) => `${emoji} *${label}: ${pct}%*\n${'█'.repeat(Math.round(pct / 10))}${'░'.repeat(10 - Math.round(pct / 10))}`;

const SAVAGE = ['Tum itne unique ho ke log confuse ho jate hain — compliment hai, samjho 😏', 'Tumhara confidence tumhari qualification se bara hai 😄', 'Tum "main 5 minute mein araha hun" bol kar 2 ghante lagane walon mein se ho 😂', 'Tumhari planning itni zabardast hai ke plan khud darr jata hai 😅', 'Tum woh notification ho jo sab ignore kar dete hain 📱😄'];
const WISDOM = ['"Waqt se pehle aur qismat se zyada kisi ko kuch nahi milta." ⏳', '"Sabr ka phal hamesha meetha hota hai." 🍎', '"Mehnat itni khamoshi se karo ke kamyabi shor macha de." 🔥', '"Jo apne waqt ko zaya karta hai, waqt usay zaya kar deta hai." ⌛', '"Bara aadmi woh hai jis ke paas ilam aur akhlaq dono hon." 📚', '"Khamoshi sab se behtareen jawab hai bewakoof ke liye." 🤫'];
const LATIFAY = ['Molvi sahab: Beta namaz parha karo. Bachcha: Parhta hun, bas Allah se mulaqat roz nahi hoti! 🤲😄', 'Biwi: Sunain, main moti lagti hun? Shohar (soch kar): Is sawal ka koi sahi jawab hi nahi bana ab tak 😂', 'Ustaad: Pakistan ka pehla wazeer-e-azam kon tha? Student: Sir, woh to mujh se pehle mar gaya tha, main kese bataun! 😅', 'Patient: Doctor sahab, mujhe bhulne ki bimari hai. Doctor: Kab se? Patient: Kab se kya? 🤔😄', 'Ek dost: Yaar main ne ghari dekhi, hazaar ki mili. Dosra: Mehngi li, waqt to muft mein bhi guzar jata hai! ⌚😂'];
const GHAZAL = ['Hazaron khwahishen aisi ke har khwahish pe dum nikle,\nBohat nikle mere armaan lekin phir bhi kam nikle — Ghalib 🖋️', 'Dil-e-nadan tujhe hua kya hai,\nAakhir is dard ki dawa kya hai — Ghalib 🖋️', 'Nigah-e-naaz ne parda uthaya bhi to kya uthaya,\nJo tha poshida wo aya bhi to kya aya — Iqbal 🖋️', 'Khudi ko kar buland itna ke har taqdeer se pehle,\nKhuda bande se khud pooche, bata teri raza kya hai — Iqbal 🖋️', 'Sitaaron se agay jahan aur bhi hain,\nAbhi ishq ke imtihan aur bhi hain — Iqbal 🖋️', 'Mohabbat mein nahi hai farq jeene aur marne mein,\nUsi ko dekh kar jeete hain jis kafir pe dum nikle — Ghalib 🖋️'];
const FLIRT = ['Tum nazar aao to nazar jhuk jati hai, shayad dil exhibition se ghabra jata hai 😊', 'Chai mein cheeni zyada ho jaye to meethi hoti hai, tum muskurate ho to zindagi meethi ho jati hai ☕✨', 'Suraj ki pehli kiran bhi tum se jal jati hogi 🌅😄', 'Tum woh jawab ho jis ki talash mein main sawal bhool gaya ✨'];
const TWISTERS = ['Kacha papita pakka papita 👅', 'Sheeshi mein sheesha, sheeshe mein sheeshi 🏺', 'Upar pankha neeche pankha, pankhe pe pankha 😄', 'Lal kila kala kila, kale kile mein lal kila 🏰', 'Samajh samajh ke samajh ko samjho, samajh samajh na bhi ek samajh hai 🤯'];
const CHALLENGES = ['Aj kisi ajnabi ko muskurahat do 😊', 'Roz wale kaam ko ulta tareeqay se karo — left hand se chai pakro ☕', '5 minute baghair mobile ke baitho... mushkil hai na? 😏', 'Apni purani photo dekho aur khud ko ek mashwara likho 📸', 'Aj ek nayi cheez seekho — sirf 10 minute 📚', 'Kisi ko baghair wajah ke shukriya kaho 🙏'];
const EMOJI_STORIES = ['👨➡️🌙➡️🏚️➡️👁️➡️😱➡️🏃💨  Pehchana? Ye har horror film ki kahani hai!', '📱➡️🔋🪫➡️😭➡️📴  Battery khatam — modern zamane ki sab se bari tragedy!', '☕➡️📚➡️🌙➡️😴➡️⏰➡️😩  Exam ki raat wali kahani!', '💼➡️🚗➡️🚦➡️😤➡️🕐  Office late — roz ki kahani!'];
const BABY_NAMES = ['👦 Ladke: Ayaan (Allah ka tohfa), Zayaan (roshan), Rayyan (jannat ka darwaza), Arham (sab se rahamdil), Eesa, Hamdan (tareef wala)', '👧 Ladkiyan: Aiza (izzat wali), Mahnoor (chaand ki roshni), Zainab, Hoorain (khoobsurat), Inaya (Allah ki inayat), Alisha'];
const guessGames = new Map(), hangGames = new Map();
const HANG_WORDS = [['MALIK', 'Bot ka naam 🤖'], ['LAHORE', 'Punjab ka dil ❤️'], ['CRICKET', 'Pakistan ka junoon 🏏'], ['BIRYANI', 'Sab ki pasand 🍛'], ['CHAI', 'Har maslay ka hal ☕'], ['MOBILE', 'Har jeb mein 📱'], ['PAKISTAN', 'Meri pehchan 🇵🇰'], ['INTERNET', 'Duniya is se juri hai 🌐']];

botEvents.on('new-message', async ({ sock, m }) => {
    try {
        const jid = m.key.remoteJid; const me = m.key.participant || m.key.remoteJid;
        const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
        const gg = guessGames.get(jid + ':' + me);
        if (gg) {
            if (body.toLowerCase() === 'giveup') { guessGames.delete(jid + ':' + me); return send(sock, m, `🏳️ Number tha: *${gg.num}*. Phir try karna!`); }
            const n = parseInt(body);
            if (!isNaN(n) && n >= 1 && n <= 100) {
                gg.tries++;
                if (n === gg.num) { guessGames.delete(jid + ':' + me); return send(sock, m, `🎉 *SAHI!* Number ${gg.num} tha — ${gg.tries} koshishon mein pakar liya! 🏆`); }
                return send(sock, m, n < gg.num ? `🔼 Bara socho! (${gg.tries} koshish) — giveup likho to bata dun` : `🔽 Chota socho! (${gg.tries} koshish) — giveup likho to bata dun`);
            }
        }
        const hg = hangGames.get(jid + ':' + me);
        if (hg && /^[a-zA-Z]$/.test(body)) {
            const ch = body.toUpperCase();
            if (hg.used.includes(ch)) return send(sock, m, '⚠️ Ye letter pehle try ho chuka hai.');
            hg.used.push(ch);
            if (!hg.word.includes(ch)) { hg.lives--; if (hg.lives <= 0) { hangGames.delete(jid + ':' + me); return send(sock, m, `💀 Game khatam! Word tha: *${hg.word}*\nPhir khelo: .hangman`); } }
            const show = [...hg.word].map(c => hg.used.includes(c) ? c : ' _ ').join('');
            if (!show.includes('_')) { hangGames.delete(jid + ':' + me); return send(sock, m, `🎉 *JEET GAYE!* Word: *${hg.word}* 🏆`); }
            return send(sock, m, `🔤 ${show}\n❤️ Lives: ${hg.lives} | Used: ${hg.used.join(', ')}\nEk letter guess karo!`);
        }
    } catch {}
});

module.exports = [
    { name: 'guess', alias: ['guessgame'], exec: async (sock, m) => { const me = m.key.participant || m.key.remoteJid; guessGames.set(m.key.remoteJid + ':' + me, { num: Math.floor(Math.random() * 100) + 1, tries: 0 }); return send(sock, m, '🔢 *Number Guessing Game!*\nMain ne 1 se 100 tak ek number socha hai — sirf number likh kar guess karo!\nChorro to "giveup" likho.'); } },
    { name: 'hangman', alias: ['hang'], exec: async (sock, m) => { const me = m.key.participant || m.key.remoteJid; const [word, hint] = pick(HANG_WORDS); hangGames.set(m.key.remoteJid + ':' + me, { word, used: [], lives: 6 }); return send(sock, m, `🔤 *HANGMAN*\n💡 Hint: ${hint}\nWord: ${[...word].map(() => ' _ ').join('')}\n❤️ Lives: 6\nEk-ek letter guess karo!`); } },
    { name: 'slots', alias: ['slot'], exec: async (sock, m) => { const em = ['🍒', '🍋', '🍇', '⭐', '💎', '7️⃣']; const r = [pick(em), pick(em), pick(em)]; const win = r[0] === r[1] && r[1] === r[2]; const two = !win && (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]); return send(sock, m, `🎰 *SLOTS*\n[ ${r.join(' | ')} ]\n${win ? '🎉🎉 JACKPOT! Teenon ek jaisay!' : two ? '👏 Do milay — qareeb thay!' : '😅 Is dafa nahi — phir try karo!'}\n_(sirf game hai, paisa asli nahi 😄)_`); } },
    { name: 'roulette', alias: ['roul'], exec: async (sock, m, args) => { const bet = (args[0] || '').toLowerCase(); if (!['red', 'black', 'lal', 'kala'].includes(bet)) return send(sock, m, '🎡 Red ya Black chuno!\nExample: .roulette red'); const num = Math.floor(Math.random() * 37); const col = num === 0 ? 'green 🟢' : (num % 2 ? 'red 🔴' : 'black ⚫'); const win = (bet === 'red' || bet === 'lal') ? col.includes('red') : col.includes('black'); return send(sock, m, `🎡 Ball ruki: *${num} ${col}*\n${win ? '🎉 TUM JEETE!' : '😅 Haar gaye — qismat phir azmao!'}`); } },
    { name: 'aura', alias: ['aurapoints'], exec: async (sock, m) => { const me = m.key.participant || m.key.remoteJid; const p = 100 + hashNum(me + new Date().toDateString(), 9900); return send(sock, m, `✨ *Aj ke Aura Points: +${p}*\n${p > 8000 ? 'Legendary aura! Log tum se inspire hain 🔥' : p > 5000 ? 'Strong aura — din tumhara hai 💪' : p > 2500 ? 'Acha aura — thodi aur mehnat ✨' : 'Aura charge ho raha hai... chai piyo ☕'}`); } },
    { name: 'iq', alias: ['iqtest'], exec: async (sock, m, args) => { const who = (m.key.participant || m.key.remoteJid) + (args.join(' ') || ''); const iq = 70 + hashNum(who, 90); return send(sock, m, `🧠 *IQ Result: ${iq}*\n${iq > 140 ? 'Genius level! Einstein wali baat hai 🏆' : iq > 115 ? 'Bohat tez dimagh! 🔥' : iq > 95 ? 'Average se upar — achi baat hai 👍' : 'Marks kam aye hain... chai pee kar phir try karo ☕😄'}\n_(mazaaq hai, asal IQ test lamba hota hai)_`); } },
    { name: 'savage', alias: ['savageline'], exec: async (sock, m) => send(sock, m, '😏 ' + pick(SAVAGE)) },
    { name: 'crush', alias: ['crushmeter'], exec: async (sock, m, args) => { const t = args.join(' '); if (!t) return send(sock, m, '💘 Crush ka naam likho!\nExample: .crush <naam>'); return send(sock, m, meter(`Crush meter (${t})`, 5 + hashNum(t.toLowerCase() + (m.key.participant || ''), 96), '💘') + '\n_(sirf mazay ke liye 😄)_'); } },
    { name: 'dostmeter', alias: ['friendmeter'], exec: async (sock, m, args) => { const t = args.join(' '); if (t.split(/\s+/).length < 2) return send(sock, m, '🤝 Do doston ke naam likho!\nExample: .dostmeter Ali Ahmed'); const [a, b] = t.split(/\s+/); return send(sock, m, meter(`Dosti meter (${a} ❤️ ${b})`, 10 + hashNum((a + b).toLowerCase(), 91), '🤝')); } },
    { name: 'luck', alias: ['luckymeter'], exec: async (sock, m) => { const me = m.key.participant || m.key.remoteJid; return send(sock, m, meter('Aj ka luck', 5 + hashNum(me + new Date().toDateString(), 96), '🍀')); } },
    { name: 'mood', alias: ['moodmeter'], exec: async (sock, m) => { const moods = ['😄 Khush — din ban gaya!', '😌 Sukoon wala mood', '🤔 Soch mein gum', '😴 Neend wala mood — chai chahiye', '🔥 Full energetic!', '😎 Cool aur confident', '🥲 Halki si udaasi — guzar jayegi']; return send(sock, m, '🌡️ *Aj ka mood:* ' + moods[hashNum((m.key.participant || '') + new Date().toDateString(), moods.length)]); } },
    { name: 'sachmeter', alias: ['truthmeter'], exec: async (sock, m, args) => { const t = args.join(' '); if (!t) return send(sock, m, '🤥 Ek baat likho, sachai check karun!\nExample: .sachmeter main roz parhta hun'); const p = hashNum(t.toLowerCase(), 101); return send(sock, m, `🤥 *Sach Meter:* "${t}"\nSachai: *${p}%*\n${p > 70 ? 'Lagta hai sach bol rahe ho ✅' : p > 40 ? 'Aadha sach, aadhi kahani 🤔' : 'Hmm... naak lambi ho rahi hai 🤥😄'}`); } },
    { name: 'babyname', alias: ['baby'], exec: async (sock, m) => send(sock, m, '👶 *Khoobsurat Islami Naam:*\n' + pick(BABY_NAMES) + '\n\nAur naam: .babyname') },
    { name: 'nickgen', alias: ['nicknamegen'], exec: async (sock, m, args) => { const b = args.join(' ') || 'Malik'; const suf = ['X', 'Bhai', 'Boss', 'Don', 'King', '786', 'Official', 'Pro', 'Badshah', 'Jatt']; return send(sock, m, '🏷️ *Nickname ideas:*\n' + [...new Set([0, 1, 2, 3, 4].map(i => b + ' ' + suf[hashNum(b + i, suf.length)]))].map(x => '• ' + x).join('\n')); } },
    { name: 'challenge', alias: ['challengegen'], exec: async (sock, m) => send(sock, m, '🎯 *Aj ka challenge:*\n' + pick(CHALLENGES)) },
    { name: 'twister', alias: ['tongue'], exec: async (sock, m) => send(sock, m, '👅 *Tongue Twister — 5 dafa tez bolo:*\n' + pick(TWISTERS)) },
    { name: 'wisdom', alias: ['aqwal'], exec: async (sock, m) => send(sock, m, '📜 ' + pick(WISDOM)) },
    { name: 'latifa', alias: ['lateefa'], exec: async (sock, m) => send(sock, m, '😂 ' + pick(LATIFAY)) },
    { name: 'ghazal', alias: ['sher2'], exec: async (sock, m) => send(sock, m, '🖋️\n' + pick(GHAZAL)) },
    { name: 'flirt', alias: ['flirtline'], exec: async (sock, m) => send(sock, m, '😊 ' + pick(FLIRT)) },
    { name: 'emojistory', alias: ['emojikahani'], exec: async (sock, m) => send(sock, m, '📖 ' + pick(EMOJI_STORIES)) },
];
