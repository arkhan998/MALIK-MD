const axios = require('axios');

const command = {
    name: "tiktok",
    alias: ["ttdl", "tt", "tiktokdl"],
    exec: async (sock, m, args) => {
        try {
            const link = args[0];

            if (!link) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide a TikTok video link.\n\n*Example:*\n.tiktok https://vm.tiktok.com/ZSYPgt2pA/" }, { quoted: m });
            }
            if (!link.includes("tiktok.com")) {
                return sock.sendMessage(m.key.remoteJid, { text: "This is not a valid TikTok link." }, { quoted: m });
            }
            
            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎵 Downloading your TikTok video, please wait..." }, { quoted: m });
            
            // ======================================================
            // YEH HAI AAPKI NAYI API
            // ======================================================
            const apiUrl = `https://lance-frank-asta.onrender.com/api/tikdl?url=${encodeURIComponent(link)}`;
            
            const { data } = await axios.get(apiUrl);
            
            // API se response check karna
            if (data.status !== true || !data.result || !data.result.video || data.result.video.length === 0) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I failed to fetch the TikTok video. The API might be down or the link is invalid.", edit: waitingMsg.key }, { quoted: m });
            }
            
            const videoInfo = data.result;
            // Aksar pehla link watermark wala hota hai aur doosra बगैर watermark ke.
            // Agar sirf ek link hai, to wohi istemal hoga.
            const videoUrl = videoInfo.video[1] || videoInfo.video[0]; 
            
            if (!videoUrl) {
                 return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I could not find a downloadable video link from the API response.", edit: waitingMsg.key }, { quoted: m });
            }
            
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

