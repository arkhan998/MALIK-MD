// ======================================================
// PACK: ISLAMIC 3 — public deeni features
// ayatkursi, kalma, darood, ramadan, qibla, ayah (daily),
// name99, wazifa, istikhara, jummah
// ======================================================
const crypto = require('crypto');
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });
const hashNum = (s, max) => crypto.createHash('md5').update(s).digest().readUInt16BE(0) % max;

const AYAHEN = [
    { ar: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', ref: 'Surah Ash-Sharh (94:6)', tr: 'Beshak mushkil ke sath asani hai.' },
    { ar: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', ref: 'Surah Ar-Ra\'d (13:28)', tr: 'Suno! Allah ke zikr se hi dilon ko sukoon milta hai.' },
    { ar: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', ref: 'Surah Taha (20:114)', tr: 'Aur kaho: Aye mere Rab! Mere ilm mein izafa farma.' },
    { ar: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', ref: 'Surah Al-Baqarah (2:153)', tr: 'Beshak Allah sabr karne walon ke sath hai.' },
    { ar: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا', ref: 'Surah At-Talaq (65:2)', tr: 'Jo Allah se darta hai, Allah us ke liye (mushkil se) nikalne ka rasta bana deta hai.' },
    { ar: 'فَإِنِّي قَرِيبٌ', ref: 'Surah Al-Baqarah (2:186)', tr: '(Allah farmata hai) Main bohat qareeb hun (apne bandon ke).' },
    { ar: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', ref: 'Surah Aal-e-Imran (3:173)', tr: 'Humein Allah kaafi hai, aur woh behtareen Kaarsaz hai.' },
];
const NAMES99 = [['Ar-Rahman', 'Sab se zyada Reham karne wala'], ['Ar-Raheem', 'Bohat Meharban'], ['Al-Malik', 'Badshah'], ['Al-Quddus', 'Har aib se paak'], ['As-Salam', 'Salamati dene wala'], ['Al-Mu\'min', 'Aman dene wala'], ['Al-Aziz', 'Sab par Ghalib'], ['Al-Jabbar', 'Zabardast taqat wala'], ['Al-Khaliq', 'Paida karne wala'], ['Al-Ghafoor', 'Bakshne wala'], ['Ar-Razzaq', 'Rizq dene wala'], ['Al-Aleem', 'Sab janne wala'], ['As-Samee', 'Sab sunne wala'], ['Al-Baseer', 'Sab dekhne wala'], ['Al-Hakeem', 'Hikmat wala'], ['As-Sabur', 'Bohat sabr wala'], ['Ash-Shakoor', 'Qadar karne wala'], ['Al-Kareem', 'Sakhi, izzat wala'], ['Al-Wadud', 'Bohat mohabbat karne wala'], ['An-Noor', 'Roshni']];
const WAZAIF = {
    rizq: '🤲 *Rizq ke liye:* Roz 100 martaba "Ya Razzaq" parhein, aur Fajr ke baad Surah Al-Waqiah ki tilawat mufeed hai.\n_(Namaz ki pabandi sab se pehle)_',
    bimari: '🤲 *Sehat ke liye:* 7 martaba Surah Al-Fatiha parh kar paani par dum kar ke piyen. Aur "Allahumma inni as\'aluka shifa" wali dua parhein.',
    pareshani: '🤲 *Pareshani ke liye:* "Hasbunallah wa ni\'mal wakeel" 450 martaba, aur kasrat se istighfar (Astaghfirullah) parhein.',
    imtihan: '🤲 *Imtihan/kamyabi ke liye:* "Rabbi zidni ilma" kasrat se parhein, aur namaz ke baad dua karein. Mehnat lazmi hai!',
    neend: '🤲 *Neend ke liye:* Sone se pehle Ayat-ul-Kursi, 3 Qul parhein — Nabi ﷺ ki sunnat hai.',
};

module.exports = [
    { name: 'ayatkursi', alias: ['ayatulkursi'], exec: async (sock, m) => send(sock, m, `📖 *Ayat-ul-Kursi (Surah Al-Baqarah 2:255)*\n\nاللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ\n\n*Fazeelat:* Jo har farz namaz ke baad parhe, us ke aur Jannat ke darmiyan sirf maut hai. (Nasa'i)`) },
    { name: 'kalma', alias: ['kalimas'], exec: async (sock, m, args) => {
        const n = parseInt(args[0]);
        const K = [
            '1️⃣ *Pehla Kalma (Tayyab):* La ilaha illallah, Muhammadur Rasulullah\n— Allah ke siwa koi mabood nahi, Muhammad ﷺ Allah ke Rasool hain.',
            '2️⃣ *Doosra Kalma (Shahadat):* Ash-hadu al-la ilaha illallah, wahdahu la sharika lah, wa ash-hadu anna Muhammadan abduhu wa rasuluh.',
            '3️⃣ *Teesra Kalma (Tamjeed):* Subhanallahi walhamdu lillahi wa la ilaha illallahu wallahu akbar.',
            '4️⃣ *Chautha Kalma (Tauheed):* La ilaha illallahu wahdahu la sharika lah, lahul mulku wa lahul hamdu, yuhyi wa yumit wa huwa ala kulli shay\'in qadeer.',
            '5️⃣ *Panchwan Kalma (Astaghfar):* Astaghfirullaha rabbi min kulli zambin wa atubu ilaih.',
            '6️⃣ *Chhata Kalma (Radd-e-Kufr):* Allahumma inni a\'uzu bika min an ushrika bika shay\'an wa ana a\'lamu bihi wa astaghfiruka lima la a\'lamu bihi.',
        ];
        return send(sock, m, n >= 1 && n <= 6 ? K[n - 1] : '📿 *6 Kalimaat:*\n\n' + K.join('\n\n') + '\n\nSirf ek ke liye: .kalma 1'); } },
    { name: 'darood', alias: ['daroodsharif'], exec: async (sock, m) => send(sock, m, `🤲 *Darood-e-Ibrahimi:*\n\nاللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ\nاللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ\n\n*Fazeelat:* Jo mujh par ek martaba darood bhejta hai, Allah us par 10 martaba rehmat bhejta hai. (Muslim)`) },
    { name: 'ramadan', alias: ['ramzan'], exec: async (sock, m) => { const next = new Date('2027-02-18T00:00:00+05:00'); const now = new Date(); const days = Math.ceil((next - now) / 864e5); return send(sock, m, days > 0 ? `🌙 *Ramadan 1448* tak taqreeban *${days} din* baaqi hain (andazi tareekh: 18 Feb 2027 — chaand par munhasir).\nTayyari abhi se shuru karo 🤲` : '🌙 Ramadan mubarak ho!'); } },
    { name: 'qibla', alias: ['qibladir'], exec: async (sock, m, args) => { const city = (args[0] || 'lahore').toLowerCase(); const D = { lahore: '259° (maghrib se thoda shumaal)', karachi: '272°', islamabad: '256°', faisalabad: '260°', multan: '263°', peshawar: '252°', quetta: '266°' }; return send(sock, m, `🧭 *Qibla Direction — ${city}:* ${D[city] || 'Apne sheher ke liye: Pakistan se Qibla taqreeban 252°–272° (maghribi simt) hoti hai.'}\n\nTareeka: Compass app kholo, degree par set karo. Ya dopahar 12 bajay sooraj ki simt se andaza lagao.`); } },
    { name: 'ayah', alias: ['dailyayah'], exec: async (sock, m) => { const a = AYAHEN[hashNum(new Date().toDateString(), AYAHEN.length)]; return send(sock, m, `📖 *Aj ki Ayat — ${a.ref}*\n\n${a.ar}\n\n_${a.tr}_`); } },
    { name: 'name99', alias: ['allahname'], exec: async (sock, m) => { const [n, d] = NAMES99[Math.floor(Math.random() * NAMES99.length)]; return send(sock, m, `✨ *${n}*\nMatlab: ${d}\n\n_(99 naamon mein se — poori list ke liye .asma)_`); } },
    { name: 'wazifa', alias: ['wazaif'], exec: async (sock, m, args) => { const k = (args[0] || '').toLowerCase(); return send(sock, m, WAZAIF[k] || '🤲 Kis maslay ke liye wazifa chahiye?\n\n• .wazifa rizq\n• .wazifa bimari\n• .wazifa pareshani\n• .wazifa imtihan\n• .wazifa neend\n\n_Note: Ye aam mashwara hai — apne muqami aalim se bhi zaroor mashwara karein._'); } },
    { name: 'istikhara', alias: ['istikharainfo'], exec: async (sock, m) => send(sock, m, `🤲 *Istikhara ka Tareeka:*\n\n1. Wuzu karke 2 rakaat nafal namaz parhein (Isha ke baad behtar hai).\n2. Phir Istikhara ki mashhoor dua parhein (dua kisi bhi Islami kitaab/app mein mil jayegi).\n3. Apna masla dil mein rakhein aur so jayen.\n4. 7 din tak dohra sakte hain — khawab lazmi nahi, dil ka rujhan aur asani dekhein.\n5. Faisla soch samajh aur mashware ke sath karein.\n\n_(Poori dua + tafseel ke liye kisi mustanad Islami app/kitaab se parhein)_`) },
    { name: 'jummah', alias: ['jumma'], exec: async (sock, m) => send(sock, m, `🕌 *Jummah Mubarak!*\n\nAj ke ahem amal:\n• Ghusal + saaf kapray + attar\n• Surah Al-Kahf ki tilawat\n• Kasrat se Darood-e-Pak\n• Jummah ki namaz waqt par\n• Maghrib se pehle dua ki qabooliyat ka waqt hota hai\n\n*.darood* likho Darood-e-Ibrahimi ke liye 🤲`) },
];
