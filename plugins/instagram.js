const axios = require('axios');
const config = require('../config.js');

// Hum 2 alag alag APIs try karenge
const INSTA_APIS = [
    `https://rest-api.akuari.my.id/downloader/igdl?link=`,
    `https://api.maher-zubair.tech/download/instagram?url=`
];

const command = {
    name: "instagram",
    alias: ["ig", "insta"],
    exec: async (sock, m, args) => {
        try {
            const link = args[0];
            if (!link || !link.includes("instagram.com")) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide a valid Instagram Reel or Video link." }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📥 Downloading from Instagram...\n_Trying multiple sources..._" }, { quoted: m });

            let mediaUrl = null;

            for (const apiUrl of INSTA_APIS) {
                try {
                    const response = await axios.get(`${apiUrl}${encodeURIComponent(link)}`);
                    const data = response.data;
                    
                    if (data.result && data.result[0]?.url) { // akuari API
                        mediaUrl = data.result[0].url;
                        break;
                    } else if (data.result?.url) { // maher-zubair API
                        mediaUrl = data.result.url;
                        break;
                    }
                } catch (e) {
                    console.log(`Instagram API failed: ${apiUrl}. Trying next...`);
                }
            }

            if (!mediaUrl) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I failed to fetch the media from all sources. The link might be private or all APIs are down.", edit: waitingMsg.key }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, {
                video: { url: mediaUrl },
                caption: `*✅ Instagram Video Downloaded*\n\n*Powered by MALIK-MD*`
            }, { quoted: m });

            await sock.sendMessage(m.key.remoteJid, { delete: waitingMsg.key });

        } catch (error) {
            console.error("Error in Instagram command:", error.message);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ An unknown error occurred: ${error.message}` }, { quoted: m });
        }
    }
};

module.exports = command;

