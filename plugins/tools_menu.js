const config = require("../config.js");

const command = {
    name: "tools_menu",
    exec: async (sock, m, args) => {
        const menuText = `*🛠️ Tools Menu 🛠️*\n\n` +
                         `• \`.weather [city]\` - Get weather information\n` +
                         `• \`.news\` - Get latest news in English\n` +
                         `• \`.news urdu\` - Get latest news in Urdu\n` +
                         `• \`.gimage [query]\` - Search for an image\n`;
        await sock.sendMessage(m.key.remoteJid, { text: menuText }, { quoted: m });
    }
};
module.exports = command;
