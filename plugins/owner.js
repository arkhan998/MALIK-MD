const config = require('../config.js');

const command = {
    name: "owner",
    alias: ["creator", "malik"],
    exec: async (sock, m, args) => {
        try {
            // 1. Sab se pehle voice note bhejna
            await sock.sendMessage(m.key.remoteJid, {
                audio: { url: "https://files.catbox.moe/8zmfz3.mp3" },
                mimetype: 'audio/mpeg',
                ptt: true // Is se voice note ban kar jayega
            }, { quoted: m });


            // 2. Bot ki information tayyar karna
            const uptime = process.uptime();
            // Uptime ko Ghante, Minute, Second me convert karna
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

            const botInfo = `*👑 MALIK-MD Bot Information 👑*\n\n` +
                          `*👤 Owner:* ${config.OWNER_NAME}\n` +
                          `*⚙️ Mode:* ${config.MODE}\n` +
                          `*🕒 Uptime:* ${uptimeString}\n` +
                          `*#️⃣ Prefix:* ${config.prefix}\n\n` +
                          `This bot is a personal AI assistant. Below is the contact card of my creator.`;

            // Bot ki information bhejna
            await sock.sendMessage(m.key.remoteJid, { text: botInfo }, { quoted: m });


            // 3. Owner ka contact card (VCard) banana aur bhejna
            const ownerVCard = 'BEGIN:VCARD\n' +
                               'VERSION:3.0\n' +
                               `FN:${config.OWNER_NAME}\n` +
                               `ORG:MALIK-MD Bot;\n` +
                               `TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER}:+${config.OWNER_NUMBER}\n` +
                               'END:VCARD';

            await sock.sendMessage(m.key.remoteJid, {
                contacts: {
                    displayName: config.OWNER_NAME,
                    contacts: [{ vcard: ownerVCard }]
                }
            }, { quoted: m });

        } catch (error) {
            console.error("Error in advanced owner command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, an error occurred while fetching owner details." }, { quoted: m });
        }
    }
};

module.exports = command;
