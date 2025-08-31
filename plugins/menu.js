import fs from 'fs';
import path from 'path';
import {
    fileURLToPath
} from 'url';
import config from '../config.js';

// Get the directory name of the current module
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const command = {
    name: "menu",
    aliases: ["help", "list"],
    exec: async (sock, m, args) => {
        try {
            // Dynamically read command files from the plugins directory
            const pluginsPath = path.join(__dirname);
            const commandFiles = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));

            let commandList = '';
            for (const file of commandFiles) {
                try {
                    // Import each command file to get its details
                    const commandModule = await
                    import (path.join('file://', pluginsPath, file));
                    const cmd = commandModule.default;
                    // Add command to the list if it has a name
                    if (cmd && cmd.name) {
                        commandList += `│ • ${config.prefix}${cmd.name}\n`;
                    }
                } catch (e) {
                    console.log("Could not import command file:", file, e);
                }
            }

            // Calculate bot uptime
            const uptime = process.uptime();
            const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

            // Define the path to your local profile image and read it
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            // Create the menu text
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

            // Define interactive buttons
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

            // Create the final button message object
            const buttonMessage = {
                image: imageBuffer,
                caption: menuText,
                footer: `Powered by 🦋⃟ᴠͥɪͣᴘͫ✮⃝🇲ᗩしᏆᏦ 🇸αнαв𝄟⃝`,
                buttons: buttons,
                headerType: 4,
            };

            // Send the message
            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in menu command:", error);
            await sock.sendMessage(m.key.remoteJid, {
                text: "Sorry, an error occurred while fetching the menu."
            });
        }
    },
};

export default command;

