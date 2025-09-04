const fs = require("fs");
const path = require("path");
const config = require("../config.js");

const command = {
    name: "imenu",
    alias: ["menu-v3", "listmenu"],
    exec: async (sock, m, args) => {
        try {
            const isOwner = config.OWNER_NUMBER && m.key.remoteJid.startsWith(config.OWNER_NUMBER);

            const sections = [
                {
                    title: '🔥 Main Categories',
                    rows: [
                        { header: 'All Commands', title: 'View all bot features', id: `${config.prefix}allcommands` },
                        { header: 'AI Menu', title: 'Image, Text, and Vision AI', id: `${config.prefix}ai_menu` },
                        { header: 'Downloader Menu', title: 'Download from Social Media', id: `${config.prefix}downloader_menu` },
                        { header: 'Islamic Menu', title: 'Quran and Islamic Reminders', id: `${config.prefix}islamic_menu` },
                        { header: 'Tools Menu', title: 'General utility commands', id: `${config.prefix}tools_menu` }
                    ]
                }
            ];

            if (isOwner) {
                sections[0].rows.push({
                    header: 'Owner Menu',
                    title: 'Exclusive owner commands',
                    id: `${config.prefix}owner_menu`
                });
            }

            const interactiveMessage = {
                body: { text: `*Welcome to MALIK-MD Interactive Menu* 🌟\n\nPlease select a category from the list below to see the commands.` },
                footer: { text: `Powered by ${config.OWNER_NAME}` },
                header: {
                    title: "MALIK-MD",
                    subtitle: "Your Personal AI Assistant",
                    hasMediaAttachment: false
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "single_select",
                            buttonParamsJson: JSON.stringify({
                                title: 'MENU CATEGORIES',
                                sections: sections
                            })
                        }
                    ]
                }
            };

            await sock.sendMessage(m.key.remoteJid, {
                interactive: interactiveMessage,
            }, { quoted: m });

        } catch (e) {
            console.error('Interactive Menu Error:', e);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Menu system is currently busy. Please try again later.` }, { quoted: m });
        }
    }
};

module.exports = command;
