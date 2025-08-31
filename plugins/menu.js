const fs = require('fs');
const path = require('path');
const config = require('../config.cjs'); // Correct path to config file

// --- Uptime Calculation ---
// This function calculates how long the bot has been running.
function getUptime() {
    const uptime = process.uptime();
    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
    name: "menu",
    alias: ["help"],
    exec: async (sock, m) => {
        try {
            // --- Dynamically Read Commands ---
            const pluginsDir = path.join(__dirname); // Current directory is /plugins
            const commandFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js') && file !== 'menu.js');
            
            let commandList = '';
            commandFiles.forEach(file => {
                const commandName = path.basename(file, '.js');
                commandList += `│ • ${config.prefix}${commandName}\n`;
            });

            // --- Menu Content ---
            const menuText = `
╭─「 *${config.OWNER_NAME}'s BOT* 」
│
│  ❖  *Mode:* ${config.MODE}
│  ❖  *Prefix:* ${config.prefix}
│  ❖  *Owner:* ${config.OWNER_NAME}
│  ❖  *Uptime:* ${getUptime()}
│
╰───────────⭓

╭─「 *Commands* 」
${commandList.trim()}
╰───────────⭓
            `;

            const menuButtons = [
                { buttonId: `${config.prefix}ping`, buttonText: { displayText: 'Ping' }, type: 1 },
                { buttonId: `${config.prefix}sticker`, buttonText: { displayText: 'Sticker' }, type: 1 },
                { buttonId: `${config.prefix}song`, buttonText: { displayText: 'Song' }, type: 1 }
            ];

            const buttonMessage = {
                image: { url: 'https://telegra.ph/file/a2ae6cbfa40f473f0f631.jpg' }, // Watermark Image
                caption: menuText,
                footer: 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟɪᴋ-ᴍᴅ', // Stylish Footer
                buttons: menuButtons,
                headerType: 4
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage, { quoted: m });

        } catch (error) {
            console.error("Error in menu command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, I couldn't display the menu right now." });
        }
    }
};

