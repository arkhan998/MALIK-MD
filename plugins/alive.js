const fs = require('fs');
const path = require('path');
const { config } = require('../config.js');

module.exports = {
    name: "alive",
    aliases: ["status", "online"],
    exec: async (sock, m, args) => {
        try {
            const uptime = process.uptime();
            const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);
            const aliveText = `*Hey, I am MALIK-MD, and I am online!* 🚀\n\n- *Version:* 1.0.0\n- *Uptime:* ${uptimeString}\n- *Developer:* ${config.OWNER_NAME}`;
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                caption: aliveText,
                footer: `Powered by 🦋⃟ᴠͥɪͣᴘͫ✮⃝🇲ᗩしᏆᏦ 🇸αнαв𝄟⃝`,
            });
        } catch (error) {
            console.error("Error in alive command:", error);
        }
    }
};

