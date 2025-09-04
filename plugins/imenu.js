const fs = require("fs");
const path = require("path");
const config = require("../config.js");

const command = {
    name: "imenu",
    alias: ["interactivemenu"],
    exec: async (sock, m, args) => {
        try {
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const userStatus = config.OWNER_NUMBER && m.key.remoteJid.startsWith(config.OWNER_NUMBER) ? '👑 Owner' : '👤 User';

            const caption = `🌟 *Welcome to MALIK-MD Bot* 👋\n\nI am a versatile WhatsApp bot designed to make your day more exciting!\n\n📌 *Your Status:* ${userStatus}\n\n*Please select a category from the buttons below:*`;

            // Main menu ke 3 buttons
            const buttons = [
                { buttonId: `${config.prefix}ai_menu`, buttonText: { displayText: '🤖 AI Menu' }, type: 1 },
                { buttonId: `${config.prefix}downloader_menu`, buttonText: { displayText: '📥 Downloader Menu' }, type: 1 },
                { buttonId: `${config.prefix}imenu_page2`, buttonText: { displayText: 'Next Page ➡️' }, type: 1 }
            ];

            const buttonMessage = {
                image: imageBuffer,
                caption: caption,
                footer: `Powered by ${config.OWNER_NAME}`,
                buttons: buttons,
                headerType: 4
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage, { quoted: m });

        } catch (e) {
            console.error('iMenu Error:', e);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Menu system encountered a critical error.` }, { quoted: m });
        }
    }
};

module.exports = command;
