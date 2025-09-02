const { config } = require('../config.js');

module.exports = {
    name: "owner_menu",
    ownerOnly: true,
    exec: async (sock, m) => {
        try {
            const ownerMenuText = `*👑 Owner Panel*\n\nExclusive commands for Malik Sahab.`;

            const buttons = [
                { buttonId: `${config.prefix}restart`, buttonText: { displayText: '♻️ Restart Bot' }, type: 1 },
                { buttonId: `${config.prefix}listusers`, buttonText: { displayText: '👥 List Subscribers' }, type: 1 },
                { buttonId: `${config.prefix}settings`, buttonText: { displayText: '⚙️ Bot Settings' }, type: 1 }
            ];

            await sock.sendMessage(m.key.remoteJid, {
                text: ownerMenuText,
                footer: `Powered by ${config.OWNER_NAME}`,
                buttons: buttons,
                headerType: 1
            });
        } catch (error) {
            console.error("Error in owner_menu command:", error);
        }
    },
};

