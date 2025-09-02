const axios = require('axios');
const config = require('../config.js');

const command = {
    name: "gimage",
    alias: ["image", "img"],
    exec: async (sock, m, args) => {
        try {
            const query = args.join(" ");
            if (!query) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide something to search for.\n\n*Example:*\n.gimage beautiful car" }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Searching for "${query}" on Google...` }, { quoted: m });

            // Using a reliable, free API for Google Image Search
            const apiUrl = `https://api.akuari.my.id/search/gimage?query=${encodeURIComponent(query)}`;
            
            const { data } = await axios.get(apiUrl);

            // API se response check karna
            if (!data || !data.result || data.result.length === 0) {
                return sock.sendMessage(m.key.remoteJid, { text: `Sorry, I couldn't find any images for "${query}".`, edit: waitingMsg.key }, { quoted: m });
            }

            // Randomly ek image chun'na
            const randomImage = data.result[Math.floor(Math.random() * data.result.length)];
            const imageUrl = randomImage;

            const caption = `*🖼️ Google Image Result*\n\n*Query:* ${query}\n\n*Powered by MALIK-MD*`;

            await sock.sendMessage(m.key.remoteJid, {
                image: { url: imageUrl },
                caption: caption
            }, { quoted: m });
            
            await sock.sendMessage(m.key.remoteJid, { delete: waitingMsg.key });

        } catch (error) {
            console.error("Error in gimage command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: `Sorry, an error occurred while searching for images.` }, { quoted: m });
        }
    }
};

module.exports = command;
