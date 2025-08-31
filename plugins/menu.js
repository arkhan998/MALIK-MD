const fs = require('fs');
const path = require('path');
const config = require('../config.cjs');

module.exports = {
    name: 'menu',
    alias: ['help'],
    description: 'Displays the interactive bot menu with buttons.',
    async exec(sock, m) {
        try {
            const watermarkImageUrl = 'https://telegra.ph/file/a8a185275811c68f27303.jpg';
            const stylishFooter = 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟɪᴋ-ᴍᴅ';

            // --- Button Creation ---
            const pluginsDir = path.join(__dirname);
            const commandFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
            
            const buttons = commandFiles.map(file => {
                const commandName = path.parse(file).name;
                // We don't want a button for the menu command itself
                if (commandName === 'menu') return null;
                return {
                    buttonId: `${config.prefix}${commandName}`, // The ID will be the command itself e.g., !ping
                    buttonText: { displayText: commandName.toUpperCase() },
                    type: 1
                };
            }).filter(Boolean); // Remove any null entries

            // --- Menu Message Construction ---
            const uptime = new Date(process.uptime() * 1000).toISOString().substr(11, 8);
            const menuCaption = `
*As-salamu alaykum!* 🌟

I am MALIK-MD, your personal AI agent. Please select an option from the buttons below to get started.

  ❖  *Mode:* ${config.MODE}
  ❖  *Uptime:* ${uptime}
`;

            const buttonMessage = {
                image: { url: watermarkImageUrl },
                caption: menuCaption,
                footer: stylishFooter,
                buttons: buttons,
                headerType: 4 // 4 for image
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in menu command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: 'Could not generate the interactive menu.' }, { quoted: m });
        }
    }
};

