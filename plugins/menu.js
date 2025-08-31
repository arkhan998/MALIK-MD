// Path to config file is now correct
const config = require('../config.cjs');
const { commands } = require('../handler.js'); 
const { performance } = require('perf_hooks');

module.exports = {
    name: 'menu',
    description: 'Displays the bot menu.',
    aliases: ['help', 'commands'],
    execute: async (sock, m, args) => {
        const startTime = performance.now();
        
        let commandList = '';
        const categories = {
            'General': [],
            'Group': [],
            // Add more categories as needed
        };

        commands.forEach(cmd => {
            const category = cmd.category || 'General';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(cmd.name);
        });

        for (const category in categories) {
            if (categories[category].length > 0) {
                commandList += `╭─「 *${category}* 」\n`;
                commandList += categories[category].map(cmd => `│ • ${config.prefix}${cmd}`).join('\n');
                commandList += `\n╰───────────⭓\n\n`;
            }
        }
        
        const endTime = performance.now();
        const ping = (endTime - startTime).toFixed(2);
        const uptime = process.uptime();
        const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

        const menuText = `
╭─「 *MALIK-MD BOT* 」
│
│  ❖  *Owner:* ${config.OWNER_NAME}
│  ❖  *Mode:* ${config.MODE}
│  ❖  *Prefix:* ${config.prefix}
│  ❖  *Uptime:* ${uptimeString}
│  ❖  *Ping:* ${ping} ms
│
╰───────────⭓

${commandList}
        `;

        await sock.sendMessage(
            m.key.remoteJid, 
            { text: menuText.trim() },
            { quoted: m }
        );
    },
};
