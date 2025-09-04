const axios = require('axios');

const command = {
    name: "tiktok",
    alias: ["tk", "ttdl"],
    exec: async (sock, m, args) => {
        try {
            const link = args[0];
            if (!link || !link.includes("tiktok.com")) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide a valid TikTok video link." }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎵 Downloading your TikTok video, please wait..." }, { quoted: m });

            // Yeh wohi working API hai jo doosre bot me istemal ho rahi hai
            const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(link)}`;
            
            const { data } = await axios.get(apiUrl);

            // API se response check karna
            if (!data.status || !data.data || !data.data.meta) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I failed to fetch the TikTok video. The link might be private or the API is down.", edit: waitingMsg.key }, { quoted: m });
            }

            const videoInfo = data.data;
            
            // ======================================================
            // YEH HAI ASAL FIX: Ab hum sahi "address" (meta.media) se video ka link nikal rahe hain
            // ======================================================
            const videoMedia = videoInfo.meta.media.find(v => v.type === "video" && v.quality === "nwm"); // No Watermark
            
            if (!videoMedia || !videoMedia.url) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, a downloadable video link was not found.", edit: waitingMsg.key }, { quoted: m });
            }

            const videoUrl = videoMedia.url;
            
            const caption = `*🎵 TikTok Video Downloaded 🎵*\n\n` +
                            `👤 *User:* ${videoInfo.author.nickname} (@${videoInfo.author.username})\n` +
                            `📖 *Title:* ${videoInfo.title || 'No Title'}\n\n` +
                            `*Powered by MALIK-MD*`;

            await sock.sendMessage(m.key.remoteJid, {
                video: { url: videoUrl },
                caption: caption
            }, { quoted: m });

            await sock.sendMessage(m.key.remoteJid, { delete: waitingMsg.key });

        } catch (e) {
            console.error("Error in TikTok downloader command:", e);
            await sock.sendMessage(m.key.remoteJid, { text: `An unknown error occurred. The API might be down.` }, { quoted: m });
        }
    }
};

module.exports = command;

