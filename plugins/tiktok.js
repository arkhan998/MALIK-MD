const axios = require('axios');

const command = {
    name: "tiktok",
    alias: ["tk", "ttdl"],
    exec: async (sock, m, args) => {
        try {
            const link = args[0];
            if (!link || !link.includes("tiktok.com")) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide a valid TikTok video link." }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, { text: "🧪 Running API debugger... Please wait." }, { quoted: m });

            const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(link)}`;
            
            const { data } = await axios.get(apiUrl);

            // Poore JSON response ko ek saaf suthre text me convert karna
            const responseString = JSON.stringify(data, null, 2); 

            const debugMessage = `*🧪 API Debugger Result 🧪*\n\n` +
                                 `Yeh API ka raw response hai. Please is poore message ko copy kar ke mujhe bhejein taake main isko hamesha ke liye theek kar sakoon.\n\n` +
                                 "```\n" +
                                 responseString +
                                 "\n```";
            
            // Raw response ko user ko bhejna
            await sock.sendMessage(m.key.remoteJid, { text: debugMessage }, { quoted: m });

        } catch (e) {
            console.error("Error in TikTok debugger:", e);
            await sock.sendMessage(m.key.remoteJid, { text: `API call failed. Error: ${e.message}` }, { quoted: m });
        }
    }
};

module.exports = command;

