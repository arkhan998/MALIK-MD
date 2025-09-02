const { config } = require('../config.js');

module.exports = {
    name: "general_menu",
    exec: async (sock, m, args) => {
        try {
            const generalMenuText = `*🛠️ General Tools Menu*\n\nHere are the available utility and downloader commands. For example: \`${config.prefix}song memories\``;
            const buttons = [
                { buttonId: `${config.prefix}bill`, buttonText: { displayText: '💡 Check Bill' }, type: 1 },
                { buttonId: `${config.prefix}song`, buttonText: { displayText: '🎵 Download Song' }, type: 1 },
                { buttonId: `${config.prefix}ping`, buttonText: { displayText: '🚀 Ping' }, type: 1 }
            ];
            await sock.sendMessage(m.key.remoteJid, {
                text: generalMenuText,
                footer: `Powered by ${config.OWNER_NAME}`,
                buttons: buttons,
                headerType: 1
            });
        } catch (error) {
            console.error("Error in general_menu command:", error);
        }
    }
};

