const fs = require('fs');
const path = require('path');
const config = require('../config.js');

const command = {
    name: "alive",
    aliases: ["status", "online"],
    exec: async (sock, m, args) => {
        try {
            const uptime = process.uptime();
            const hrs = String(Math.floor(uptime / 3600)).padStart(2, '0');
            const mins = String(Math.floor((uptime % 3600) / 60)).padStart(2, '0');
            const secs = String(Math.floor(uptime % 60)).padStart(2, '0');

            let pluginCount = 0;
            try {
                pluginCount = fs.readdirSync(__dirname).filter(f => f.endsWith('.js')).length;
            } catch (e) { pluginCount = '59+'; }

            let version = '1.0.3';
            try {
                version = require('../package.json').version || version;
            } catch (e) {}

            const aliveText =
`╭━━━〔 🤖 *MALIK-MD* 〕━━━┈⊷
┃★╭──────────────
┃★│ ✅ *Status:* Online & Ready
┃★│ ⚡ *Version:* ${version}
┃★│ ⏱️ *Uptime:* ${hrs}:${mins}:${secs}
┃★│ 🔌 *Plugins:* ${pluginCount}
┃★│ 🌐 *Mode:* ${config.MODE || 'public'}
┃★│ 👑 *Owner:* ${config.OWNER_NAME}
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
> ✨ _"Type .menu to explore the magic!"_ ✨`;

            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            let message;
            try {
                const imageBuffer = fs.readFileSync(imagePath);
                message = { image: imageBuffer, caption: aliveText, footer: `Powered by ${config.OWNER_NAME} 👑` };
            } catch (e) {
                message = { text: aliveText };
            }

            await sock.sendMessage(m.key.remoteJid, message);

        } catch (error) {
            console.error("Error in alive command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, an error occurred while checking the status." });
        }
    },
};

module.exports = command;
