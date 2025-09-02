const { config } = require('../config.js');

module.exports = {
    name: "ai_menu",
    exec: async (sock, m, args) => {
        try {
            const aiMenuText = `*🧠 AI Tools Menu*\n\nHere are the available AI commands. Click a button or type the command to use. For example: \`${config.prefix}imagine a tiger in jungle\``;

            const buttons = [
                { buttonId: `${config.prefix}ai`, buttonText: { displayText: '🤖 Ask AI' }, type: 1 },
                { buttonId: `${config.prefix}imagine`, buttonText: { displayText: '🎨 Imagine (AI Image)' }, type: 1 },
                { buttonId: `${config.prefix}say`, buttonText: { displayText: '🗣️ Say (Text-to-Speech)' }, type: 1 },
                { buttonId: `${config.prefix}describe`, buttonText: { displayText: '👁️ Describe (Image Vision)' }, type: 1 }
            ];

            await sock.sendMessage(m.key.remoteJid, {
                text: aiMenuText,
                footer: `Powered by ${config.OWNER_NAME}`,
                buttons: buttons,
                headerType: 1
            });
        } catch (error) {
            console.error("Error in ai_menu command:", error);
        }
    }
};
