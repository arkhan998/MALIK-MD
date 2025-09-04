const config = require("../config.js");

const command = {
    name: "downloader_menu",
    exec: async (sock, m, args) => {
        const menuText = `*📥 Downloader Menu 📥*\n\n` +
                         `• \`.tiktok [link]\` - Download TikTok video\n` +
                         `• \`.song [name]\` - Download song from YouTube\n` +
                         `• \`.pin [link]\` - Download from Pinterest\n`;
        await sock.sendMessage(m.key.remoteJid, { text: menuText }, { quoted: m });
    }
};
module.exports = command;
