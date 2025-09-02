const config = require('../config.js');

const command = {
    name: "ai_menu",
    exec: async (sock, m, args) => {
        try {
            // Ab yahan config.prefix ka error nahi aayega
            const aiMenuText = `*🧠 AI Tools Menu*\n\nHere are the available AI commands. Type the command to use.\n\nExample: \`${config.prefix}imagine a tiger in jungle\``;

            const buttons = [
                { buttonId: `${config.prefix}ai`, buttonText: { displayText: '🤖 Ask Gemini' }, type: 1 },
                { buttonId: `${config.prefix}imagine`, buttonText: { displayText: '🎨 Imagine (AI Image)' }, type: 1 },
                { buttonId: `${config.prefix}describe`, buttonText: { displayText: '👁️ Describe (Image Vision)' }, type: 1 }
            ];

            const buttonMessage = {
                text: aiMenuText,
                footer: `Powered by ${config.OWNER_NAME}`,
                buttons: buttons,
                headerType: 1
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in ai_menu command:", error);
        }
    },
};

module.exports = command;

