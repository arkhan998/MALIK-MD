const axios = require('axios');
const cache = require('../lib/cache.js'); // Bot ki memory ko import karna

const command = {
    name: "tiktok",
    alias: ["tt", "tik"],
    exec: async (sock, m, args) => {
        try {
            const link = args[0];
            if (!link || !link.includes("tiktok.com")) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide a valid TikTok video link." }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, { react: { text: '⏳', key: m.key } });

            const apiUrl = `https://lance-frank-asta.onrender.com/api/tikdl?url=${encodeURIComponent(link)}`;
            const { data } = await axios.get(apiUrl);

            if (data.status !== true || !data.result) {
                return sock.sendMessage(m.key.remoteJid, { text: "❌ TikTok download failed. Please try again." }, { quoted: m });
            }

            const videoInfo = data.result;

            // Maloomat ko bot ki memory (cache) me save karna
            const cacheId = m.key.id; // Message ki unique ID
            cache[cacheId] = {
                videoUrl: videoInfo.video[1] || videoInfo.video[0],
                audioUrl: videoInfo.music
            };

            // User ko maloomat aur instructions bhejna
            const caption = `*🎵 TikTok Downloader 🎵*\n\n` +
                            `*👤 Author:* ${videoInfo.author.nickname}\n` +
                            `*📖 Title:* ${videoInfo.description || 'No Title'}\n\n` +
                            `*➡️ Reply with "1" for Video*\n` +
                            `*➡️ Reply with "2" for Audio*`;

            await sock.sendMessage(m.key.remoteJid, {
                image: { url: videoInfo.cover },
                caption: caption
            }, { quoted: m });

        } catch (e) {
            console.error("TikTok command error:", e);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ TikTok download failed. The API might be down." }, { quoted: m });
        }
    }
};

module.exports = command;

