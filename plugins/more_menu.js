const config = require("../config.js");

const command = {
    name: "more_menu",
    exec: async (sock, m, args) => {
        try {
            const senderJid = m.key.remoteJid;
            const isOwner = config.OWNER_NUMBER && senderJid.startsWith(config.OWNER_NUMBER);

            // Baaki categories ke buttons
            const buttons = [
                { buttonId: `${config.prefix}islamic_menu`, buttonText: { displayText: '🕋 Islamic Menu' }, type: 1 },
                { buttonId: `${config.prefix}tools_menu`, buttonText: { displayText: '🛠️ Tools Menu' }, type: 1 },
            ];

            if (isOwner) {
                buttons.push({ buttonId: `${config.prefix}owner_menu`, buttonText: { displayText: '👑 Owner Menu' }, type: 1 });
            }

            const buttonMessage = {
                text: `*📚 More Categories*\n\nPlease select another category from the buttons below.`,
                footer: `Powered by ${config.OWNER_NAME}`,
                buttons: buttons,
                headerType: 1
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage, { quoted: m });

        } catch (e) {
            console.error('More Menu Error:', e);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Menu system encountered an error.` }, { quoted: m });
        }
    }
};

module.exports = command;
