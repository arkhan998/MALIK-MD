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
                // Add more categories as you add more commands
            };
    
            commands.forEach(cmd => {
                const category = cmd.category || 'General';
                if (!categories[category]) {
                    categories[category] = [];
                }
                // Avoid listing aliases, only main command name
                if (cmd.name === commands.get(cmd.name).name) {
                   categories[category].push(cmd.name);
                }
            });
    
            for (const category in categories) {
                if (categories[category].length > 0) {
                    commandList += `╭─「 *${category}* 」\n`;
                    commandList += [...new Set(categories[category])].map(cmd => `│ • ${config.prefix}${cmd}`).join('\n');
                    commandList += `\n╰───────────⭓\n\n`;
                }
            }
            
            const endTime = performance.now();
            const ping = (endTime - startTime).toFixed(2);
            const uptime = process.uptime();
            const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);
    
            const menuText = `
    ╭─「 *${config.OWNER_NAME}'s BOT* 」
    │
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
    

