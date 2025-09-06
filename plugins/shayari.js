const axios = require('axios');
const config = require('../config.js');

const command = {
    name: "shayari",
    alias: ["poetry", "sher"],
    exec: async (sock, m, args) => {
        try {
            await sock.sendMessage(m.key.remoteJid, { react: { text: '✍️', key: m.key } });

            const apiUrl = `https://api.maher-zubair.tech/ai/shayari`;
            const { data } = await axios.get(apiUrl);

            if (data.status !== 200 || !data.result) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I couldn't fetch shayari right now." }, { quoted: m });
            }

            const shayari = data.result;
            const message = `*✍️ Here's some Urdu Shayari ✍️*\n\n_${shayari}_\n\n*Powered by MALIK-MD*`;
            await sock.sendMessage(m.key.remoteJid, { text: message }, { quoted: m });

        } catch (error) {
            console.error("Error in shayari command:", error.message);
            await sock.sendMessage(m.key.remoteJid, { text: `Sorry, the shayari service seems to be unavailable. Error: ${error.message}` }, { quoted: m });
        }
    }
};

module.exports = command;

