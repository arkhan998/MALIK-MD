const fs = require("fs");
const path = require("path");
const config = require("../config.js");

const command = {
    name: "cmenu",
    alias: ["clickablemenu"],
    exec: async (sock, m, args) => {
        try {
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            // Yeh hain aapke 3 main clickable buttons
            const buttons = [
                { buttonId: `${config.prefix}ai_menu`, buttonText: { displayText: '🤖 AI Menu' }, type: 1 },
                { buttonId: `${config.prefix}downloader_menu`, buttonText: { displayText: '📥 Downloader Menu' }, type: 1 },
                { buttonId: `${config.prefix}more_menu`, buttonText: { displayText: '📚 More Categories' }, type: 1 }
            ];

            const buttonMessage = {
                image: imageBuffer,
                caption: `*Welcome to MALIK-MD Bot* 🌟\n\nI am your personal AI assistant. Please select a category from the buttons below to explore my features.`,
                footer: `Powered by ${config.OWNER_NAME}`,
                buttons: buttons,
                headerType: 4 // Is se tasveer ke neeche buttons aate hain
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage, { quoted: m });

        } catch (e) {
            console.error('Clickable Menu Error:', e);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Menu system encountered a critical error.` }, { quoted: m });
        }
    }
};

module.exports = command;
