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
    aliases: ["help", "list"],
    exec: async (sock, m, args) => {
        try {
            const pluginsPath = path.join(__dirname);
            const commandFiles = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));

            let commandList = '';
            for (const file of commandFiles) {
                const commandModule = await import (path.join('file://', pluginsPath, file));
                const cmd = commandModule.default;
                if (cmd && cmd.name && cmd.name !== 'menu') {
                    commandList += `│ • ${config.prefix}${cmd.name}\n`;
                }
            }

            const uptime = process.uptime();
            const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const menuText = `╭─「 *${config.OWNER_NAME}'s BOT* 」
│
│  ❖  *Mode:* ${config.MODE}
│  ❖  *Prefix:* ${config.prefix}
│  ❖  *Uptime:* ${uptimeString}
│
╰───────────⭓

╭─「 *Commands* 」
${commandList.trim()}
╰───────────⭓`;

            const buttons = [{
                buttonId: `${config.prefix}ping`,
                buttonText: {
                    displayText: '🚀 Ping'
                }
            }, {
                buttonId: `${config.prefix}alive`,
                buttonText: {
                    displayText: 'Status'
                }
            }, ];

            const buttonMessage = {
                image: imageBuffer,
                caption: menuText,
                footer: `Powered by 🦋⃟ᴠͥɪͣᴘͫ✮⃝🇲ᗩしᏆᏦ 🇸αнαв𝄟⃝`,
                buttons: buttons,
                headerType: 4,
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in menu command:", error);
        }
    },
};

export default command;

