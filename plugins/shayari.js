// ======================================================
// SHAYARI — ab 100% OFFLINE (local collection)
// Purani api.maher-zubair.tech mar chuki thi (ENOTFOUND),
// is liye API hata kar mashhoor ash'aar bot ke andar rakh
// diye hain — internet ho ya na ho, .shayari hamesha chalega.
// .shayari            -> random sher
// .shayari ishq|dard|dosti|zindagi -> category ka sher
// ======================================================

const COLLECTION = {
    ishq: [
        { sher: 'Hazaaron khwahishen aisi ke har khwahish pe dam nikle\nBahut nikle mere armaan lekin phir bhi kam nikle', poet: 'Mirza Ghalib' },
        { sher: 'Ranjish hi sahi dil hi dukhane ke liye aa\nAa phir se mujhe chhod ke jaane ke liye aa', poet: 'Ahmed Faraz' },
        { sher: 'Mujh se pehli si mohabbat mere mehboob na maang', poet: 'Faiz Ahmed Faiz' },
        { sher: 'Woh to khushboo hai hawaon mein bikhar jayega\nMasla phool ka hai, phool kidhar jayega', poet: 'Parveen Shakir' },
        { sher: 'Ab ke hum bichde to shayad kabhi khwabon mein milein\nJis tarah sookhe hue phool kitaabon mein milein', poet: 'Ahmed Faraz' },
        { sher: 'Dikhai diye yun ke bekhud kiya\nHamein aap se bhi juda kar chale', poet: 'Mir Taqi Mir' },
        { sher: 'Kuch to hawa bhi sard thi, kuch tha tera khayal bhi\nDil ko khush rakhne ko Ghalib khayal acha hai', poet: 'Parveen Shakir / Mirza Ghalib' },
        { sher: 'Tere bina zindagi se koi shikwa to nahi\nTere bina zindagi, zindagi to nahi', poet: 'Gulzar' }
    ],
    dard: [
        { sher: 'Dil-e-nadaan tujhe hua kya hai\nAakhir is dard ki dawa kya hai', poet: 'Mirza Ghalib' },
        { sher: 'Dil na-umeed to nahi, nakaam hi to hai\nLambi hai gham ki shaam magar shaam hi to hai', poet: 'Faiz Ahmed Faiz' },
        { sher: 'Aur bhi dukh hain zamane mein mohabbat ke siwa\nRahatein aur bhi hain vasl ki raahat ke siwa', poet: 'Faiz Ahmed Faiz' },
        { sher: 'Main bhi munh mein zabaan rakhta hun\nKaash poochho ke mudda\'a kya hai', poet: 'Jaun Elia' },
        { sher: 'Yeh mujhe chain kyun nahi padta\nIk hi shakhs tha jahaan mein, to kya hua', poet: 'Jaun Elia' },
        { sher: 'Patta patta boota boota haal hamara jaane hai\nJaane na jaane gul hi na jaane, baagh to saara jaane hai', poet: 'Mir Taqi Mir' },
        { sher: 'Hum ko maloom hai jannat ki haqeeqat lekin\nDil ke khush rakhne ko Ghalib khayal acha hai', poet: 'Mirza Ghalib' },
        { sher: 'Zakhm kya kya na zindagi se mile\nKhwab palkon se be-rukhi se mile', poet: 'Mohsin Naqvi' }
    ],
    dosti: [
        { sher: 'Dosti aam hai lekin aye dost\nDost milta hai badi mushkil se', poet: 'Hafeez Jalandhari' },
        { sher: 'Yeh daulat bhi le lo, yeh shohrat bhi le lo\nBhale chheen lo mujh se meri jawani\nMagar mujh ko lauta do bachpan ka saawan\nWoh kaaghaz ki kashti, woh baarish ka paani', poet: 'Sudarshan Faakir' },
        { sher: 'Dushmani jam kar karo lekin yeh gunjaish rahe\nJab kabhi hum dost ho jayein to sharminda na hon', poet: 'Bashir Badr' },
        { sher: 'Aapki dosti ka saath itna khoobsurat hai\nKe dil karta hai har lamha bas aapke saath guzre', poet: '—' },
        { sher: 'Log roop dekhte hain, hum dil dekhte hain\nLog duniya dekhte hain, hum dosti dekhte hain', poet: '—' }
    ],
    zindagi: [
        { sher: 'Khudi ko kar buland itna ke har taqdeer se pehle\nKhuda bande se khud pooche, bata teri raza kya hai', poet: 'Allama Iqbal' },
        { sher: 'Tu shaheen hai, parwaz hai kaam tera\nTere saamne aasmaan aur bhi hain', poet: 'Allama Iqbal' },
        { sher: 'Zindagi yun hui basar tanha\nQafila saath aur safar tanha', poet: 'Gulzar' },
        { sher: 'Sitaaron se aage jahaan aur bhi hain\nAbhi ishq ke imtihaan aur bhi hain', poet: 'Allama Iqbal' },
        { sher: 'Hazaro saal nargis apni be-noori pe roti hai\nBadi mushkil se hota hai chaman mein deedawar paida', poet: 'Allama Iqbal' },
        { sher: 'Girte hain shahsawar hi maidan-e-jung mein\nWoh tifl kya gire jo ghutno ke bal chale', poet: '—' }
    ]
};

const ALL = Object.entries(COLLECTION).flatMap(([cat, arr]) => arr.map(x => ({ ...x, cat })));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const command = {
    name: 'shayari',
    alias: ['poetry', 'sher'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        try { await sock.sendMessage(jid, { react: { text: '✍️', key: m.key } }); } catch (e) {}
        const cat = (args[0] || '').toLowerCase();
        if (cat && !COLLECTION[cat]) {
            return sock.sendMessage(jid, {
                text: `✍️ *Shayari Categories*\n\n• \`.shayari ishq\` ❤️\n• \`.shayari dard\` 💔\n• \`.shayari dosti\` 🤝\n• \`.shayari zindagi\` 🌙\n• \`.shayari\` — koi bhi random sher`
            }, { quoted: m });
        }
        const item = cat ? { ...pick(COLLECTION[cat]), cat } : pick(ALL);
        const poetLine = item.poet && item.poet !== '—' ? `\n\n— *${item.poet}*` : '';
        const text = `*✍️ Urdu Shayari ✍️*\n\n_${item.sher}_${poetLine}\n\n> Category: ${item.cat} • Powered by MALIK-MD`;
        return sock.sendMessage(jid, { text }, { quoted: m });
    }
};

module.exports = command;
