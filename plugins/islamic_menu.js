const config = require("../config.js");

const command = {
    name: "islamic_menu",
    exec: async (sock, m, args) => {
        const menuText = `*🕋 Islamic Menu 🕋*\n\n` +
                         `• \`.quran [surah no]\` - Get Surah details & audio\n` +
                         `• \`.quranmenu\` - Get list of all Surahs\n` +
                         `• \`.testreminder\` - Test the daily Islamic reminder\n`;
        await sock.sendMessage(m.key.remoteJid, { text: menuText }, { quoted: m });
    }
};
module.exports = command;
