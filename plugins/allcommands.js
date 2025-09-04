const config = require("../config.js");

const command = {
    name: "allcommands",
    exec: async (sock, m, args) => {
        // Aap yahan apne saare commands ki list daal sakte hain
        const menuText = `*🔥 All Commands 🔥*\n\n*This is a list of all available commands.*\n\n` +
                         `*.ai_menu*\n` +
                         `*.downloader_menu*\n` +
                         `*.islamic_menu*\n` +
                         `*.tools_menu*\n` +
                         `*.owner_menu*\n`;
        await sock.sendMessage(m.key.remoteJid, { text: menuText }, { quoted: m });
    }
};
module.exports = command;
