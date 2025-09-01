import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command = {
    name: "menu",
    aliases: ["help", "commands"],
    exec: async (sock, m, args) => {
        try {
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const menuText = `*Assalam-o-Alaikum! Welcome to the MALIK-MD Agent!* 🚀

I am an AI-powered assistant designed by Malik Sahab. Please select a category from the buttons below to explore my features.`;

            // Check if the user is the owner
            const sender = m.key.remoteJid.endsWith('@g.us') ? m.key.participant : m.key.remoteJid;
            const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);

            // Base buttons for everyone
            const templateButtons = [{
                index: 1,
                urlButton: { displayText: 'Follow My Channel', url: 'https://whatsapp.com/channel/0029VaN8WMOHFxP0SLAKKu0P' }
            }, {
                index: 2,
                quickReplyButton: { displayText: '🧠 AI Tools', id: `${config.prefix}ai_menu` }
            }, {
                index: 3,
                quickReplyButton: { displayText: '🛠️ General Tools', id: `${config.prefix}general_menu` }
            }];
            
            // Add the owner panel button only if the user is the owner
            if (isOwner) {
                templateButtons.push({
                    index: 4,
                    quickReplyButton: { displayText: '👑 Owner Panel', id: `${config.prefix}owner_menu` }
                });
            }

            const buttonMessage = {
                image: imageBuffer,
                caption: menuText,
                footer: `Powered by ${config.OWNER_NAME}`,
                templateButtons: templateButtons,
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in menu command:", error);
        }
    },
};

export default command;

