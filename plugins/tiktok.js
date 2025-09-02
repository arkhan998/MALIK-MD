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
            
            // User ko batana ke process shuru ho gaya hai
            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎵 Downloading your TikTok video, please wait..." }, { quoted: m });
            
            // API se video ki maloomat fetch karna
            const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(link)}`;
            const { data } = await axios.get(apiUrl);
            
            if (!data.status || !data.data) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I failed to fetch the TikTok video. The API might be down.", edit: waitingMsg.key }, { quoted: m });
            }
            
            const { title, like, comment, share, author, meta } = data.data;
            
            // Video ka link dhoondna
            const videoData = meta.media.find(v => v.type === "video" && v.quality === "nwm"); // nwm = no watermark
            
            if (!videoData || !videoData.url) {
                 return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I could not find a downloadable video link.", edit: waitingMsg.key }, { quoted: m });
            }
            
            const videoUrl = videoData.url;
            
            const caption = `*🎵 TikTok Video Downloaded 🎵*\n\n` +
                            `👤 *User:* ${author.nickname} (@${author.username})\n` +
                            `📖 *Title:* ${title || 'No Title'}\n` +
                            `👍 *Likes:* ${like}\n💬 *Comments:* ${comment}\n🔁 *Shares:* ${share}\n\n*Powered by MALIK-MD*`;
            
            // Video bhejna
            await sock.sendMessage(m.key.remoteJid, {
                video: { url: videoUrl },
                caption: caption
            }, { quoted: m });

            // "Downloading" wala message delete kar dena (optional)
            await sock.sendMessage(m.key.remoteJid, { delete: waitingMsg.key });
            
        } catch (e) {
            console.error("Error in TikTok downloader command:", e);
            await sock.sendMessage(m.key.remoteJid, { text: `An error occurred: ${e.message}` }, { quoted: m });
        }
    }
};

module.exports = command;
 
