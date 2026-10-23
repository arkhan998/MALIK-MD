// ======================================================
// PACK: ISLAMIC 2 — dua, hadith, asma, tasbeeh (offline)
// ======================================================
const send = (sock, m, text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const DUAS = {
    safar: { ar: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ', ur: 'Paak hai Woh Zaat jis ne is (sawari) ko hamare taabe kar diya, warna hum isay qaabu karne wale na thay. (Safar ki dua — Surah Az-Zukhruf 13)' },
    khana: { ar: 'بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ', ur: 'Allah ke naam se aur Allah ki barkat ke sath. (Khana shuru karne ki dua)' },
    sona: { ar: 'اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا', ur: 'Aye Allah! Tere hi naam ke sath marta hun aur zinda hota hun. (Sone ki dua)' },
    uthna: { ar: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', ur: 'Tamam tareef Allah ke liye jis ne humein marne (neend) ke baad zinda kiya, aur usi ki taraf laut kar jana hai. (Jaagne ki dua)' },
    bimari: { ar: 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ اشْفِهِ وَأَنْتَ الشَّافِي', ur: 'Aye Allah! Logon ke Rabb, takleef door kar de, shifa de — Tu hi shifa dene wala hai. (Bimari ki dua)' },
    rizq: { ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ رِزْقًا طَيِّبًا وَعِلْمًا نَافِعًا وَعَمَلًا مُتَقَبَّلًا', ur: 'Aye Allah! Main Tujh se paak rizq, nafa dene wala ilm aur qabool amal maangta hun.' },
    walidain: { ar: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', ur: 'Aye mere Rabb! Mere walidain par raham farma, jis tarah unho ne bachpan mein mujhe paala. (Surah Al-Isra 24)' },
    imtihan: { ar: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', ur: 'Aye mere Rabb! Mera seena khol de aur mera kaam mere liye asaan kar de. (Surah Ta-Ha 25-26 — imtihan/mushkil kaam se pehle)' }
};

const HADITH = [
    { text: 'Amal ka daromadar niyyaton par hai, aur har shakhs ko wahi milega jis ki us ne niyyat ki.', ref: 'Sahih Bukhari 1' },
    { text: 'Tum mein se behtareen woh hai jo Quran seekhe aur sikhaye.', ref: 'Sahih Bukhari 5027' },
    { text: 'Safai aadha imaan hai.', ref: 'Sahih Muslim 223' },
    { text: 'Muslim woh hai jis ki zabaan aur haath se doosre Muslim mehfooz rahein.', ref: 'Sahih Bukhari 10' },
    { text: 'Jo Allah aur Aakhirat ke din par imaan rakhta hai, woh achi baat kahe ya khamosh rahe.', ref: 'Sahih Bukhari 6018' },
    { text: 'Tum mein se koi (kamil) momin nahi ho sakta jab tak apne bhai ke liye wahi pasand na kare jo apne liye pasand karta hai.', ref: 'Sahih Bukhari 13' },
    { text: 'Qayamat ke din bande ke aamal mein sab se pehle namaz ka hisaab hoga.', ref: 'Tirmidhi 413' },
    { text: 'Sab se zyada mehboob amal Allah ke nazdeek woh hai jo hamesha ho, chahe thora hi ho.', ref: 'Sahih Bukhari 6464' },
    { text: 'Duniya momin ke liye qaid khana hai aur kafir ke liye jannat.', ref: 'Sahih Muslim 2956' },
    { text: 'Rishwat dene wala aur lene wala dono Jahannam mein hain.', ref: 'Tirmidhi 1337' },
    { text: 'Jis ne kisi momin ki duniya ki takleef door ki, Allah qayamat ki takleefon mein se us ki takleef door karega.', ref: 'Sahih Muslim 2699' },
    { text: 'Taakatwar woh nahi jo kushti mein hara de; taakatwar woh hai jo gusse ke waqt apne aap ko qaabu kare.', ref: 'Sahih Bukhari 6114' }
];

const ASMA = ['Ar-Rahman (Sab se zyada Reham wala)','Ar-Rahim (Bohat Meherban)','Al-Malik (Badshah)','Al-Quddus (Har aib se Paak)','As-Salam (Salamati wala)','Al-Mumin (Aman dene wala)','Al-Muhaymin (Nigran)','Al-Aziz (Ghalib)','Al-Jabbar (Zabardast)','Al-Mutakabbir (Barai wala)','Al-Khaliq (Paida karne wala)','Al-Bari (Banane wala)','Al-Musawwir (Surat banane wala)','Al-Ghaffar (Bohat Bakhshne wala)','Al-Qahhar (Sab par Ghalib)','Al-Wahhab (Bohat dene wala)','Ar-Razzaq (Rizq dene wala)','Al-Fattah (Faisla karne wala / Darwaze kholne wala)','Al-Alim (Sab jaanne wala)','Al-Qabid (Rizq tang karne wala)','Al-Basit (Rizq kholne wala)','Al-Khafid (Pasti dene wala)','Ar-Rafi (Bulandi dene wala)','Al-Muizz (Izzat dene wala)','Al-Mudhill (Zillat dene wala)','As-Sami (Sab sunne wala)','Al-Basir (Sab dekhne wala)','Al-Hakam (Insaf karne wala)','Al-Adl (Adal wala)','Al-Latif (Narmi wala / Bareek been)','Al-Khabir (Har cheez se bakhabar)','Al-Halim (Burdbari wala)','Al-Azim (Azmat wala)','Al-Ghafoor (Bakhshne wala)','Ash-Shakur (Qadar karne wala)','Al-Ali (Sab se Buland)','Al-Kabir (Sab se Bara)','Al-Hafiz (Hifazat karne wala)','Al-Muqit (Quwwat/rizq pohanchane wala)','Al-Hasib (Hisaab lene wala)','Al-Jalil (Buzurgi wala)','Al-Karim (Sakhi)','Ar-Raqib (Nigraani karne wala)','Al-Mujib (Dua qabool karne wala)','Al-Wasi (Har cheez ko gherne wala)','Al-Hakim (Hikmat wala)','Al-Wadud (Mohabbat karne wala)','Al-Majid (Buzurgi wala)','Al-Baith (Dobara zinda karne wala)','Ash-Shahid (Gawah)','Al-Haqq (Sach)','Al-Wakil (Kaarsaaz)','Al-Qawiyy (Taakat wala)','Al-Matin (Mazboot)','Al-Waliyy (Dost / Madadgar)','Al-Hamid (Tareef ke laiq)','Al-Muhsi (Ginti rakhne wala)','Al-Mubdi (Pehli baar paida karne wala)','Al-Muid (Dobara paida karne wala)','Al-Muhyi (Zinda karne wala)','Al-Mumit (Maut dene wala)','Al-Hayy (Hamesha Zinda)','Al-Qayyum (Sab ko qayam rakhne wala)','Al-Wajid (Sab kuch paane wala)','Al-Majid (Shan wala)','Al-Wahid (Akela / Yakta)','As-Samad (Be-niyaz)','Al-Qadir (Qudrat wala)','Al-Muqtadir (Puri qudrat wala)','Al-Muqaddim (Aage karne wala)','Al-Muakhkhir (Peeche karne wala)','Al-Awwal (Sab se Pehla)','Al-Akhir (Sab se Aakhri)','Az-Zahir (Zaahir)','Al-Batin (Chhupa hua)','Al-Wali (Hakim / Malik)','Al-Mutaali (Sab se Buland)','Al-Barr (Neki karne wala)','At-Tawwab (Tauba qabool karne wala)','Al-Muntaqim (Badla lene wala)','Al-Afuww (Muaaf karne wala)','Ar-Rauf (Bohat Shafqat wala)','Malik-ul-Mulk (Mulk ka Malik)','Dhul-Jalali wal-Ikram (Azmat aur Karam wala)','Al-Muqsit (Insaf karne wala)','Al-Jami (Jama karne wala)','Al-Ghaniyy (Be-niyaz)','Al-Mughni (Ghani karne wala)','Al-Mani (Rokne wala)','Ad-Darr (Nuqsan pohanchane wala — usi ke ikhtiyar mein)','An-Nafi (Nafa dene wala)','An-Nur (Roshni)','Al-Hadi (Hidayat dene wala)','Al-Badi (Be-misal banane wala)','Al-Baqi (Hamesha baqi rehne wala)','Al-Warith (Sab ke baad rehne wala)','Ar-Rashid (Seedhi raah dikhane wala)','As-Sabur (Bohat Sabr wala)'];

const tasbeehSessions = new Map(); // user -> { dhikr, count, target }

module.exports = [
    {
        name: 'dua',
        exec: async (sock, m, args) => {
            const cat = (args[0] || '').toLowerCase();
            if (!DUAS[cat]) return send(sock, m, `🤲 *Dua Categories*\n\n${Object.keys(DUAS).map(k => `• \`.dua ${k}\``).join('\n')}\n\nExample: \`.dua safar\``);
            const d = DUAS[cat];
            return send(sock, m, `🤲 *Dua — ${cat}*\n\n${d.ar}\n\n_${d.ur}_`);
        }
    },
    {
        name: 'hadith',
        exec: async (sock, m, args) => {
            const h = pick(HADITH);
            return send(sock, m, `📖 *Hadith*\n\n"${h.text}"\n\n— *${h.ref}*`);
        }
    },
    {
        name: 'asma',
        alias: ['asmaulhusna'],
        exec: async (sock, m, args) => {
            const q = (args[0] || '').toLowerCase();
            if (!q || q === 'list') return send(sock, m, `🕌 *Asma-ul-Husna (99 Names)*\n\n` + ASMA.map((n, i) => `${i + 1}. ${n}`).join('\n') + `\n\nKisi ek naam ke liye: \`.asma 15\``);
            const n = parseInt(q);
            if (n >= 1 && n <= 99) return send(sock, m, `🕌 *${n}. ${ASMA[n - 1]}*`);
            const found = ASMA.findIndex(x => x.toLowerCase().includes(q));
            if (found >= 0) return send(sock, m, `🕌 *${found + 1}. ${ASMA[found]}*`);
            return send(sock, m, '❌ Naam nahi mila. Number likho 1–99, ya `.asma list`');
        }
    },
    {
        name: 'tasbeeh',
        exec: async (sock, m, args) => {
            const user = m.key.participant || m.key.remoteJid;
            const sub = (args[0] || '').toLowerCase();
            if (sub === 'stop') { tasbeehSessions.delete(user); return send(sock, m, '🛑 Tasbeeh session khatam.'); }
            if (sub) {
                // Shuru: .tasbeeh <dhikr...> [target]  — aakhri number ho to wo target hai
                const lastNum = parseInt(args[args.length - 1]);
                const hasTarget = args.length > 1 && !isNaN(lastNum);
                const target = hasTarget ? lastNum : 33;
                const dhikr = (hasTarget ? args.slice(0, -1) : args).join(' ').trim();
                tasbeehSessions.set(user, { dhikr, count: 0, target });
                return send(sock, m, `📿 *Tasbeeh shuru*\n\nDhikr: *${dhikr}*\nTarget: ${target}\n\nHar ginne par sirf \`.tasbeeh\` likho — main count rakhoon ga. Khatam: \`.tasbeeh stop\``);
            }
            const s = tasbeehSessions.get(user);
            if (!s) return send(sock, m, '📿 *Digital Tasbeeh*\n\nShuru: `.tasbeeh SubhanAllah 33`\nPhir har martaba sirf `.tasbeeh` — count main rakhoon ga.\nKhatam: `.tasbeeh stop`');
            s.count++;
            if (s.count >= s.target) { tasbeehSessions.delete(user); return send(sock, m, `📿 ✅ *Mubarak!* Tasbeeh puri ho gayi\n\n*${s.dhikr}* × ${s.target}\nAllah qabool farmaye 🤲`); }
            return send(sock, m, `📿 *${s.dhikr}*\nCount: *${s.count} / ${s.target}*`);
        }
    }
];
