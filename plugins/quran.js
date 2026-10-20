const axios = require('axios');
const config = require('../config.js');

// ======================================================
// QURAN — .quran <number|name>
// Source: api.alquran.cloud (purani quran-endpoint API mar
// chuki thi) + full-surah tilawat islamic.network CDN se
// ======================================================

const command = {
    name: "quran",
    alias: ["surah"],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        try {
            const surahInput = (args[0] || '').trim();

            if (!surahInput) {
                return sock.sendMessage(jid, { text: "📖 *Quran*\n\nSurah ka number ya naam likho.\n\n*Example:* `.quran 36` ya `.quran Yaseen`\n\nPoori list ke liye: *.quranmenu*" }, { quoted: m });
            }

            // Surah list (meta)
            const listRes = await axios.get('https://api.alquran.cloud/v1/surah', { timeout: 30000 });
            const surahs = listRes.data.data;
            const norm = (s) => String(s).toLowerCase().replace(/[\s\-']/g, '');
            const meta = surahs.find(s =>
                s.number === Number(surahInput) ||
                norm(s.englishName) === norm(surahInput)
            );

            if (!meta) {
                return sock.sendMessage(jid, { text: `❌ Surah "${surahInput}" nahi mili. Number (1-114) ya English naam likho, masalan: 36 ya Yaseen` }, { quoted: m });
            }

            await sock.sendMessage(jid, { text: `📖 Surah ${meta.englishName} dhoondi ja rahi hai...` }, { quoted: m });

            // Arabic (Uthmani) + English translation (Asad)
            const res = await axios.get(`https://api.alquran.cloud/v1/surah/${meta.number}/editions/quran-uthmani,en.asad`, { timeout: 45000 });
            const [arabic, english] = res.data.data;

            // Pehli 5 ayat (poori surah message mein bohat lambi ho jati hai)
            let text = `🕋 *Surah ${meta.number}: ${meta.name}*\n` +
                `📖 *${meta.englishName}* — ${meta.englishNameTranslation}\n` +
                `💫 *Type:* ${meta.revelationType} | *Ayahs:* ${meta.numberOfAyahs}\n\n` +
                `*— Pehli 5 Ayat —*\n`;
            for (let i = 0; i < Math.min(5, arabic.ayahs.length); i++) {
                text += `\n${arabic.ayahs[i].text}\n_${english.ayahs[i].text}_\n`;
            }
            text += `\n🎧 _Poori tilawat neeche voice note mein hai._\n\n_Powered by MALIK-MD_`;

            await sock.sendMessage(jid, { text }, { quoted: m });

            // Poori surah ki tilawat (Mishary Alafasy) — voice note
            await sock.sendMessage(jid, {
                audio: { url: `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${meta.number}.mp3` },
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m });

        } catch (error) {
            console.error("Error in quran command:", error.message);
            await sock.sendMessage(jid, { text: `❌ Quran command mein masla aya. Thodi dair baad dobara try karo.` }, { quoted: m });
        }
    }
};

module.exports = command;
