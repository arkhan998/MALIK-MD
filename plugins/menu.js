const fs = require("fs");
const path = require("path");
const config = require("../config.js");

const command = {
    name: "menu",
    aliases: ["help", "commands"],
    exec: async (sock, m, args) => {
        try {
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const menuText = `*Assalam-o-Alaikum! Welcome to the MALIK-MD Agent!* 🚀\n\nI am an AI-powered assistant designed by Malik Sahab. Please select a category from the buttons below to explore my features.`;

            const isGroup = m.key.remoteJid.endsWith('@g.us');
            const sender = isGroup ? (m.key.participant || m.participant) : m.key.remoteJid;
            const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);

            // ======================================================
            // YEH HAI FIX: Purane buttons ko naye "templateButtons" se badal diya hai
            // ======================================================
            const templateButtons = [
                { index: 1, quickReplyButton: { displayText: '🧠 AI Tools', id: `${config.prefix}ai_menu` } },
                { index: 2, quickReplyButton: { displayText: '🛠️ General Tools', id: `${config.prefix}general_menu` } }
            ];

            // Agar user owner hai, to "Owner Panel" ka button add karna
            if (isOwner) {
                templateButtons.push(
                    { index: 3, quickReplyButton: { displayText: '👑 Owner Panel', id: `${config.prefix}owner_menu` } }
                );
            }
            
            // Channel ka button aakhir me daal dein
            templateButtons.push(
                { index: 4, urlButton: { displayText: 'Follow My Channel', url: 'https://whatsapp.com/channel/0029VaN8WMOHFxP0SLAKKu0P' } }
            );
            // ======================================================

            const buttonMessage = {
                image: imageBuffer,
                caption: menuText,
                footer: `Powered by ${config.OWNER_NAME}`,
                templateButtons: templateButtons, // Yahan par naye buttons daal diye hain
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in menu command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, an error occurred while displaying the menu." });
        }
    },
};

module.exports = command;

