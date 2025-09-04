const axios = require('axios');

const command = {
    name: "instagram",
    alias: ["ig", "insta"],
    exec: async (sock, m, args) => {
        try {
            const link = args[0];
            if (!link || !link.includes("instagram.com")) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide a valid Instagram Reel or Video link." }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📥 Downloading from Instagram..." }, { quoted: m });

            const apiUrl = `https://api.akuari.my.id/downloader/igdl?link=${encodeURIComponent(link)}`;
            
            const { data } = await axios.get(apiUrl);

            if (!data || !data.result || data.result.length === 0) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I failed to fetch the media. The link might be for a private account or stories.", edit: waitingMsg.key }, { quoted: m });
            }

            // API se video ka link nikalna
            const mediaUrl = data.result[0].url;

            await sock.sendMessage(m.key.remoteJid, {
                video: { url: mediaUrl },
                caption: `* reels Downloaded ✅*\n\n*Powered by MALIK-MD*`
            }, { quoted: m });

            await sock.sendMessage(m.key.remoteJid, { delete: waitingMsg.key });

        } catch (error) {
            console.error("Error in Instagram command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ An error occurred. The API might be down." }, { quoted: m });
        }
    }
};

module.exports = command;
