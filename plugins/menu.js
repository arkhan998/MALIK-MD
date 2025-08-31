const fs = require('fs');
const path =require('path');
const config = require('../config.cjs');

module.exports = {
    name: 'menu',
    alias: ['help'],
    description: 'Displays the bot menu.',
    async exec(sock, m) {
        try {
            // Get bot's uptime
            const uptime = process.uptime();
            const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

            // Read command files from plugins directory
            const pluginsDir = path.join(__dirname);
            const commandFiles = fs.readdirSync(pluginsDir)
                .filter(file => file.endsWith('.js'))
                .map(file => `│ • ${config.prefix}${path.parse(file).name}`);

            const menuText = `
╭─「 *${config.OWNER_NAME}'s BOT* 」
│
│  ❖  *Mode:* ${config.MODE}
│  ❖  *Prefix:* ${config.prefix}
│  ❖  *Uptime:* ${uptimeString}
│
╰───────────⭓

╭─「 *Commands* 」
${commandFiles.join('\n')}
╰───────────⭓
            `;

            await sock.sendMessage(m.key.remoteJid, { text: menuText }, { quoted: m });
        } catch (error) {
            console.error("Error in menu command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: 'Could not generate the menu.' }, { quoted: m });
        }
    }
};

