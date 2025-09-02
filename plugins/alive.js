const fs = require('fs');
const path = require('path');
// YEH HAI FIX: import ko require se badal diya hai
const config = require('../config.js');

const command = {
    name: "alive",
    aliases: ["status", "online"],
    exec: async (sock, m, args) => {
        try {
            const uptime = process.uptime();
            const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

            // Yahan config.OWNER_NAME bilkul theek kaam karega
            const aliveText = `*Hey, I am MALIK-MD, and I am online!* 🚀\n\n- *Version:* 1.0.1\n- *Uptime:* ${uptimeString}\n- *Developer:* ${config.OWNER_NAME}`;

            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const message = {
                image: imageBuffer,
                caption: aliveText,
                footer: `Powered by ${config.OWNER_NAME}`,
            };

            await sock.sendMessage(m.key.remoteJid, message);

        } catch (error) {
            console.error("Error in alive command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, an error occurred while checking the status." });
        }
    },
};

module.exports = command;

