import config from '../config.js';

const command = {
    name: "owner_menu",
    exec: async (sock, m, args) => {
        try {
            const ownerMenuText = `*👑 Welcome to the Owner Panel, Malik Sahab!*

Here are the exclusive commands only you can use to manage the bot.`;

            const buttons = [{
                buttonId: `${config.prefix}restart`,
                buttonText: { displayText: '♻️ Restart Bot' },
                type: 1
            }, {
                buttonId: `${config.prefix}listusers`,
                buttonText: { displayText: '👥 List Subscribers' },
                type: 1
            }];

            const buttonMessage = {
                text: ownerMenuText,
                footer: `Powered by ${config.OWNER_NAME}`,
                buttons: buttons,
                headerType: 1
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in owner_menu command:", error);
        }
    },
};

export default command;
