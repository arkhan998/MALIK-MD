const axios = require('axios');
const config = require('../config.js');

const command = {
    name: "tiktoksearch",
    alias: ["tiktoks", "tiks"],
    exec: async (sock, m, args) => {
        try {
            const query = args.join(" ");
            if (!query) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide something to search on TikTok.\n\n*Example:*\n.tiktoksearch funny cats" }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: `🔎 Searching TikTok for: *${query}*...` }, { quoted: m });

            const apiUrl = `https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(query)}`;
            
            const { data } = await axios.get(apiUrl);

            if (!data || !data.data || data.data.length === 0) {
                return sock.sendMessage(m.key.remoteJid, { text: `❌ No results found for "${query}". Please try a different keyword.`, edit: waitingMsg.key }, { quoted: m });
            }

            // Sirf 5 random videos bhejna taake chat spam na ho
            const results = data.data.sort(() => 0.5 - Math.random()).slice(0, 5);

            await sock.sendMessage(m.key.remoteJid, { text: `Found ${results.length} videos for your search. Sending them now...`, edit: waitingMsg.key }, { quoted: m });

            for (const video of results) {
                if (video.nowm) { // nowm = No Watermark
                    const caption = `*🌸 TikTok Video Result 🌸*\n\n` +
                                    `*• Title:* ${video.title}\n` +
                                    `*• Author:* ${video.author || 'Unknown'}\n` +
                                    `*• Duration:* ${video.duration || "N/A"}\n\n` +
                                    `*Powered by MALIK-MD*`;

                    await sock.sendMessage(m.key.remoteJid, {
                        video: { url: video.nowm },
                        caption: caption
                    }, { quoted: m });
                    
                    // Har video ke baad thora sa wait karna
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                }
            }

        } catch (error) {
            console.error("Error in TikTokSearch command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ An error occurred while searching TikTok. The API might be down." }, { quoted: m });
        }
    }
};

module.exports = command;
