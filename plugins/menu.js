import fs from 'fs';
import path from 'path';
import {
    fileURLToPath
} from 'url';
import config from '../config.js';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const command = {
    name: "menu",
    aliases: ["help", "commands"],
    exec: async (sock, m, args) => {
        try {
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const menuText = `*Assalam-o-Alaikum! Welcome to the MALIK-MD Agent!* агенты

I am an AI-powered assistant designed by Malik Sahab. Please select a category from the buttons below to explore my features.`;

            // Using templateButtons to include a URL button for the channel
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

            const buttonMessage = {
                image: imageBuffer,
                caption: menuText,
                footer: `Powered by ${config.OWNER_NAME}`,
                templateButtons: templateButtons,
                headerType: 4,
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in menu command:", error);
            await sock.sendMessage(m.key.remoteJid, {
                text: "Sorry, an error occurred."
            });
        }
    },
};

export default command;

