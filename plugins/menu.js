const config = require('../config.cjs');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'menu',
    description: 'Displays the list of available commands.',
    aliases: ['help', 'commands'],
    execute: async (sock, m, args) => {
        const startTime = performance.now();
        
        let commandListText = '';
        try {
            // Read the plugins directory to get all command files
            const pluginsDir = path.join(__dirname); 
            const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
            
            commandListText = pluginFiles
                .map(file => `│ - ${config.prefix}${path.parse(file).name}`)
                .join('\n');
        } catch (error) {
            console.error("Could not generate command list for menu:", error);
            commandListText = "│ Could not load commands.";
        }

        const endTime = performance.now();
        const ping = (endTime - startTime).toFixed(2);
        const uptime = process.uptime();
        const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

        const menuText = `
╭─「 *${config.OWNER_NAME}'s BOT* 」
│
│  ◈ *Mode:* ${config.MODE}
│  ◈ *Prefix:* ${config.prefix}
│  ◈ *Uptime:* ${uptimeString}
│  ◈ *Ping:* ${ping} ms
│
╰───────────⭓

╭─「 *Commands* 」
${commandListText}
╰───────────⭓
        `;

        await sock.sendMessage(
            m.key.remoteJid, 
            { text: menuText.trim() },
            { quoted: m }
        );
    },
};

