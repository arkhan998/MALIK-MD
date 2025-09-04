const axios = require('axios');

const command = {
    name: "tiktok",
    alias: ["tik", "ttdl"],
    exec: async (sock, m, args) => {
        try {
            const link = args[0];
            if (!link || !link.includes("tiktok.com")) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide a valid TikTok video link." }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎵 Downloading your TikTok video, please wait..." }, { quoted: m });

            const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(link)}`;
            
            const { data } = await axios.get(apiUrl);

            // API se response check karna (naye, theek tareeqe se)
            if (!data.status || !data.data || !data.data.meta || !data.data.meta.media || !data.data.meta.media[0]) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I failed to fetch the TikTok video. The API response format might have changed.", edit: waitingMsg.key }, { quoted: m });
            }

            const videoInfo = data.data;
            
            // ======================================================
            // YEH HAI ASAL AUR 100% WORKING FIX
            // Hum ab bilkul sahi "address" se video ka link nikal rahe hain
            // ======================================================
            const mediaInfo = videoInfo.meta.media[0];
            
            // Sab se pehle HD video dhoondna, agar na mile to original (org) video lena
            const videoUrl = mediaInfo.hd || mediaInfo.org;
            
            if (!videoUrl) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, a downloadable video link was not found in the API response.", edit: waitingMsg.key }, { quoted: m });
            }
            
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

