const axios = require('axios');
const config = require('../config.js');

const command = {
    name: "pindl",
    alias: ["pinterest", "pin"],
    exec: async (sock, m, args) => {
        try {
            const link = args[0];

            if (!link) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide a Pinterest video or image link.\n\n*Example:*\n.pin https://pin.it/4xS8e5g9c" }, { quoted: m });
            }
            if (!link.includes("pinterest.com") && !link.includes("pin.it")) {
                return sock.sendMessage(m.key.remoteJid, { text: "This is not a valid Pinterest link." }, { quoted: m });
            }
            
            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📥 Downloading from Pinterest, please wait..." }, { quoted: m });
            
            // Using a new, reliable API
            const apiUrl = `https://rest-api.akuari.my.id/downloader/pinterest?link=${encodeURIComponent(link)}`;
            const { data } = await axios.get(apiUrl);
            
            if (!data || !data.respon) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I failed to fetch the media from Pinterest. The link might be private or the API is down.", edit: waitingMsg.key }, { quoted: m });
            }
            
            const mediaUrl = data.respon;
            
            const caption = `*📌 Pinterest Media Downloaded*\n\n*Powered by MALIK-MD*`;
            
            // Check if the link is for a video or an image
            if (mediaUrl.includes('.mp4')) {
                // Send as video
                await sock.sendMessage(m.key.remoteJid, {
                    video: { url: mediaUrl },
                    caption: caption
                }, { quoted: m });
            } else {
                // Send as image
                await sock.sendMessage(m.key.remoteJid, {
                    image: { url: mediaUrl },
                    caption: caption
                }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, { delete: waitingMsg.key });
            
        } catch (e) {
            console.error("Error in Pinterest downloader command:", e);
            await sock.sendMessage(m.key.remoteJid, { text: `An error occurred: ${e.message}` }, { quoted: m });
        }
    }
};

module.exports = command;
