const config = require('../config.js');

const command = {
    name: "bill",
    aliases: ["mepco"],
    exec: async (sock, m, args) => {
        try {
            // User ko batayein ke service filhal band hai
            await sock.sendMessage(m.key.remoteJid, {
                text: "⚠️ *Service Unavailable*\n\nThe bill checking service is temporarily down because the third-party provider's website is not working.\n\nWe will re-enable this feature once a new service is available."
            }, { quoted: m });

        } catch (error) {
            console.error("Error in disabled bill command:", error);
        }
    },
};

module.exports = command;

