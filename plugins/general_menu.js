import config from '../config.js';

const command = {
    name: "general_menu",
    exec: async (sock, m, args) => {
        try {
            const generalMenuText = `*🛠️ General Tools Menu*

Here are the available utility and downloader commands. Click a button or type the command to use. For example: \`${config.prefix}sticker\` by replying to an image.`;

            // Define interactive buttons for general commands
            const buttons = [{
                buttonId: `${config.prefix}bill`,
                buttonText: {
                    displayText: '💡 Check Bill'
                },
                type: 1
            }, {
                buttonId: `${config.prefix}sticker`,
                buttonText: {
                    displayText: '🖼️ Sticker Maker'
                },
                type: 1
            }, {
                buttonId: `${config.prefix}song`,
                buttonText: {
                    displayText: '🎵 Download Song'
                },
                type: 1
            }, {
                buttonId: `${config.prefix}ping`,
                buttonText: {
                    displayText: '🚀 Ping'
                },
                type: 1
            }, ];

            const buttonMessage = {
                text: generalMenuText,
                footer: `Powered by ${config.OWNER_NAME}`,
                buttons: buttons,
                headerType: 1
            };

            // Send the message
            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in general_menu command:", error);
            // Optionally send an error message to the user
            // await sock.sendMessage(m.key.remoteJid, { text: "Sorry, an error occurred." });
        }
    },
};

export default command;
