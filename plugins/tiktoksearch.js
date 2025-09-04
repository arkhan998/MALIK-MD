const axios = require('axios');

const command = {
    name: "tiktoksearch",
    alias: ["tiks"],
    exec: async (sock, m, args) => {
        try {
            const query = args.join(" ");
            if (!query) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide something to search for." }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, { text: "🧪 Running API debugger for TikTok Search... Please wait." }, { quoted: m });

            const apiUrl = `https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(query)}`;
            
            const { data } = await axios.get(apiUrl);

            // Poore JSON response ko ek saaf suthre text me convert karna
            const responseString = JSON.stringify(data, null, 2); 

            const debugMessage = `*🧪 API Debugger Result (TikTok Search) 🧪*\n\n` +
                                 `Please copy this entire message and send it to me so I can fix the command permanently.\n\n` +
                                 "```\n" +
                                 responseString +
                                 "\n```";
            
            // Raw response ko user ko bhejna
            await sock.sendMessage(m.key.remoteJid, { text: debugMessage }, { quoted: m });

        } catch (e) {
            console.error("Error in TikTok Search debugger:", e);
            await sock.sendMessage(m.key.remoteJid, { text: `API call failed. Error: ${e.message}` }, { quoted: m });
        }
    }
};

module.exports = command;

