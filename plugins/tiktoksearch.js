const axios = require('axios');
const config = require('../config.js');

const command = {
    name: "tiktoksearch",
    alias: ["tiks"],
    exec: async (sock, m, args) => {
        try {
            const query = args.join(" ");
            if (!query) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide something to search on TikTok.\n\n*Example:*\n.tiktoksearch funny cats" }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: `🔎 Searching TikTok for: *${query}*...` }, { quoted: m });

            // Nayi aur reliable API
            const apiUrl = `https://api.akuari.my.id/downloader/tiktoksearch?query=${encodeURIComponent(query)}`;
            
            const { data } = await axios.get(apiUrl);

            if (!data || !data.result || data.result.length === 0) {
                return sock.sendMessage(m.key.remoteJid, { text: `❌ No results found for "${query}".`, edit: waitingMsg.key }, { quoted: m });
            }

            // Sirf 3 random videos bhejna
            const results = data.result.sort(() => 0.5 - Math.random()).slice(0, 3);

            await sock.sendMessage(m.key.remoteJid, { text: `Found ${results.length} videos! Sending them now...`, edit: waitingMsg.key }, { quoted: m });

            for (const video of results) {
                if (video.nowm) { // No Watermark
                    const caption = `*🌸 TikTok Search Result 🌸*\n\n` +
                                    `*• Title:* ${video.title}\n` +
                                    `*• Author:* ${video.author || 'Unknown'}\n\n` +
                                    `*Powered by MALIK-MD*`;

                    await sock.sendMessage(m.key.remoteJid, {
                        video: { url: video.nowm },
                        caption: caption
                    }, { quoted: m });
                    
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                }
            }

        } catch (error) {
            console.error("Error in TikTokSearch command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ An error occurred while searching. The new API might also be down." }, { quoted: m });
        }
    }
};

module.exports = command;

