const fs = require("fs");
const path = require("path");
const config = require("../config.cjs");

const command = {
    name: "menu",
    aliases: ["help", "commands"],
    exec: async (sock, m, args) => {
        try {
            // Aapki local profile image ka path
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            // Menu ka main text
            const menuText = `*Assalam-o-Alaikum! Welcome to the MALIK-MD Agent!* 🚀

I am an AI-powered assistant designed by Malik Sahab. Please select a category from the buttons below to explore my features.`;

            // Check karna ke message bhejnewala owner hai ya nahi
            const isGroup = m.key.remoteJid.endsWith('@g.us');
            const sender = isGroup ? m.key.participant : m.key.remoteJid;
            const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);

            // Har user ke liye base buttons
            const templateButtons = [{
                index: 1,
                urlButton: {
                    displayText: 'Follow My Channel',
                    url: 'https://whatsapp.com/channel/0029VaN8WMOHFxP0SLAKKu0P'
                }
            }, {
                index: 2,
                quickReplyButton: {
                    displayText: '🧠 AI Tools',
                    id: `${config.prefix}ai_menu`
                }
            }, {
                index: 3,
                quickReplyButton: {
                    displayText: '🛠️ General Tools',
                    id: `${config.prefix}general_menu`
                }
            }, ];

            // Agar user owner hai, to "Owner Panel" ka button add karna
            if (isOwner) {
                templateButtons.push({
                    index: 4,
                    quickReplyButton: {
                        displayText: '👑 Owner Panel',
                        id: `${config.prefix}owner_menu`
                    }
                });
            }

            // Final message tayyar karna
            const buttonMessage = {
                image: imageBuffer,
                caption: menuText,
                footer: `Powered by ${config.OWNER_NAME}`,
                templateButtons: templateButtons,
            };

            // Message bhejna
            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in menu command:", error);
            await sock.sendMessage(m.key.remoteJid, {
                text: "Sorry, an error occurred while displaying the menu."
            });
        }
    },
};

module.exports = command;

