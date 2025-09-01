import config from '../config.js';

const command = {
    name: "ai_menu",
    exec: async (sock, m, args) => {
        try {
            const aiMenuText = `*🧠 AI Tools Menu*

Here are the available AI commands. Click a button or type the command to use. For example: \`${config.prefix}imagine a tiger in jungle\``;

            const buttons = [{
                buttonId: `${config.prefix}imagine`,
                buttonText: {
                    displayText: '🎨 Imagine (AI Image)'
                },
                type: 1
            }, {
                buttonId: `${config.prefix}animate`,
                buttonText: {
                    displayText: '🎥 Animate (AI Video)'
                },
                type: 1
            }, {
                buttonId: `${config.prefix}say`,
                buttonText: {
                    displayText: '🗣️ Say (Text-to-Speech)'
                },
                type: 1
            }, {
                buttonId: `${config.prefix}describe`,
                buttonText: {
                    displayText: '👁️ Describe (Image Vision)'
                },
                type: 1
            }, ];

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

export default command;
