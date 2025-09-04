const axios = require('axios');

const command = {
    name: "tiktok",
    alias: ["ttdl", "tt", "tiktokdl"],
    exec: async (sock, m, args) => {
        try {
            const link = args[0];

            if (!link || !link.includes("tiktok.com")) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide a valid TikTok video link." }, { quoted: m });
            }
            
            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎵 Downloading your TikTok video, please wait..." }, { quoted: m });
            
            const apiUrl = `https://lance-frank-asta.onrender.com/api/tikdl?url=${encodeURIComponent(link)}`;
            
            const { data } = await axios.get(apiUrl);
            
            // ======================================================
            // YEH HAI NAYI API KE MUTABIQ CODE
            // Ab hum 'data.result.video[0]' check kar rahe hain
            // ======================================================
            if (data.status !== true || !data.result || !data.result.video || !data.result.video[0]) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I failed to fetch the TikTok video. The API might be down or the link is invalid.", edit: waitingMsg.key }, { quoted: m });
            }
            
            const videoInfo = data.result;
            // Yeh API aksar 2 link bhejti hai. Doosra wala behtar quality ka hota hai.
            const videoUrl = videoInfo.video[1] || videoInfo.video[0]; 
            
            const caption = `*🎵 TikTok Video Downloaded 🎵*\n\n` +
                            `👤 *User:* ${videoInfo.author.nickname || 'N/A'}\n` +
                            `📖 *Title:* ${videoInfo.description || 'No Title'}\n\n` +
                            `*Powered by MALIK-MD*`;
            
            await sock.sendMessage(m.key.remoteJid, {
                video: { url: videoUrl },
                caption: caption
            }, { quoted: m });

            await sock.sendMessage(m.key.remoteJid, { delete: waitingMsg.key });
            
        } catch (e) {
            console.error("Error in TikTok downloader command:", e);
            await sock.sendMessage(m.key.remoteJid, { text: `An error occurred. The API might be temporarily down.` }, { quoted: m });
        }
    }
};

module.exports = command;

