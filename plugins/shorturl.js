const axios = require('axios');
const config = require('../config.js');

const command = {
    name: "shorturl",
    alias: ["short", "tinyurl"],
    exec: async (sock, m, args) => {
        try {
            const longUrl = args[0];
            if (!longUrl || !longUrl.startsWith('http')) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide a valid link to shorten.\n\n*Example:*\n.shorturl https://github.com/arkhan998/MALIK-MD" }, { quoted: m });
            }

            const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
            const { data } = await axios.get(apiUrl);

            if (!data || data.includes('Error')) {
                return sock.sendMessage(m.key.remoteJid, { text: `❌ Error: Could not shorten the URL.` }, { quoted: m });
            }

            const shortUrl = data;
            const message = `*🔗 URL Shortened Successfully 🔗*\n\n*Short Link:* ${shortUrl}\n\n*Powered by MALIK-MD*`;
            await sock.sendMessage(m.key.remoteJid, { text: message }, { quoted: m });

        } catch (error) {
            console.error("Error in shorturl command:", error.message);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ An error occurred: ${error.message}` }, { quoted: m });
        }
    }
};

module.exports = command;

