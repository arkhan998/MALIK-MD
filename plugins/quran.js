const axios = require('axios');
const { translate } = require('@vitalets/google-translate-api');
const config = require('../config.js');

const command = {
    name: "quran",
    alias: ["surah"],
    exec: async (sock, m, args) => {
        try {
            const surahInput = args[0];

            if (!surahInput) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please type a Surah Number.\n\n*Example:*\n.quran 36\n\nType *.quranmenu* to get the list of Surahs." }, { quoted: m });
            }

            // Surah ki list fetch karna
            const surahListRes = await axios.get('https://quran-endpoint.vercel.app/quran');
            const surahList = surahListRes.data.data;

            // Diye gaye number ya naam se Surah dhoondna
            let surahData = surahList.find(surah => 
                surah.number === Number(surahInput) || 
                (surah.asma.ar.short && surah.asma.ar.short.toLowerCase() === surahInput.toLowerCase()) || 
                (surah.asma.en.short && surah.asma.en.short.toLowerCase() === surahInput.toLowerCase())
            );

            if (!surahData) {
                return sock.sendMessage(m.key.remoteJid, { text: `Sorry, I couldn't find any Surah with the name or number "${surahInput}".` }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, { text: `📖 Searching for Surah ${surahData.asma.en.short}...` }, { quoted: m });

            // Surah ki tafseel fetch karna
            const res = await axios.get(`https://quran-endpoint.vercel.app/quran/${surahData.number}`);
            const json = res.data;

            // Tafseer ko Urdu aur English me translate karna
            const translatedTafsirUrdu = await translate(json.data.tafsir.id, { to: 'ur', autoCorrect: true });
            const translatedTafsirEnglish = await translate(json.data.tafsir.id, { to: 'en', autoCorrect: true });

            let quranSurah = `
🕋 *Quran: The Holy Book ♥️🌹قرآن مجید🌹♥️*\n
📖 *Surah ${json.data.number}: ${json.data.asma.ar.long} (${json.data.asma.en.long})*\n
💫 *Type:* ${json.data.type.en}\n
✅ *Number of verses:* ${json.data.ayahCount}\n
⚡🔮 *Explanation (Urdu):*\n
${translatedTafsirUrdu.text}\n
⚡🔮 *Explanation (English):*\n
${translatedTafsirEnglish.text}`;

            // Tasveer aur tafseel bhejna
            await sock.sendMessage(
              m.key.remoteJid,
              {
                image: { url: `https://files.catbox.moe/8fy6up.jpg` },
                caption: quranSurah,
              },
              { quoted: m }
            );

            // Tilawat ko voice note me bhejna
            if (json.data.recitation.full) {
              await sock.sendMessage(m.key.remoteJid, {
                audio: { url: json.data.recitation.full },
                mimetype: 'audio/mpeg',  
                ptt: true // Isse voice note jayega
              }, { quoted: m });
            }

        } catch (error) {
            console.error("Error in quran command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: `An error occurred: ${error.message}` }, { quoted: m });
        }
    }
};

module.exports = command;
