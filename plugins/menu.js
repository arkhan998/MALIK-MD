const fs = require("fs");
const path = require("path");
const config = require("../config.js");

const command = {
    name: "menu",
    aliases: ["help", "commands"],
    exec: async (sock, m, args) => {
        try {
            // NOTE: Tasveer wala code hata diya hai kyunke woh buttons ke saath kaam nahi karta.
            // const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            // const imageBuffer = fs.readFileSync(imagePath);

            const menuText = `*Assalam-o-Alaikum! Welcome to the MALIK-MD Agent!* 🚀\n\nI am an AI-powered assistant designed by Malik Sahab. Please select a category from the buttons below to explore my features.`;

            const isGroup = m.key.remoteJid.endsWith('@g.us');
            const sender = isGroup ? (m.key.participant || m.participant) : m.key.remoteJid;
            const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);

            const templateButtons = [
                { index: 1, quickReplyButton: { displayText: '🧠 AI Tools', id: `${config.prefix}ai_menu` } },
                { index: 2, quickReplyButton: { displayText: '🛠️ General Tools', id: `${config.prefix}general_menu` } }
            ];

            if (isOwner) {
                templateButtons.push(
                    { index: 3, quickReplyButton: { displayText: '👑 Owner Panel', id: `${config.prefix}owner_menu` } }
                );
            }
            
            templateButtons.push(
                { index: 4, urlButton: { displayText: 'Follow My Channel', url: 'https://whatsapp.com/channel/0029VaN8WMOHFxP0SLAKKu0P' } }
            );

            // ======================================================
            // YEH HAI FIX: Ab message me 'image' nahi, balke 'text' bhej rahe hain
            // ======================================================
            const buttonMessage = {
                text: menuText, // Caption ko 'text' bana diya
                footer: `Powered by ${config.OWNER_NAME}`,
                templateButtons: templateButtons,
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in menu command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, an error occurred while displaying the menu." });
        }
    },
};

module.exports = command;

