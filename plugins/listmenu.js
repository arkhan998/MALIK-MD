const fs = require("fs");
const path = require("path");
const config = require("../config.js");

const command = {
    name: "listmenu",
    alias: ["lmenu"],
    exec: async (sock, m, args) => {
        try {
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const isOwner = config.OWNER_NUMBER && m.key.remoteJid.startsWith(config.OWNER_NUMBER);

            // ======================================================
            // LIST KE ANDAR WALI CATEGORIES
            // ======================================================
            const menuRows = [
                { title: "🤖 AI Menu", description: "Image, Text, and Vision AI", rowId: `${config.prefix}ai_menu` },
                { title: "📥 Downloader Menu", description: "Download from Social Media", rowId: `${config.prefix}downloader_menu` },
                { title: "🕋 Islamic Menu", description: "Quran and Islamic Reminders", rowId: `${config.prefix}islamic_menu` },
                { title: "🛠️ Tools Menu", description: "General utility commands", rowId: `${config.prefix}tools_menu` },
                { title: "🏠 Main Menu", description: "Bot information and status", rowId: `${config.prefix}main_menu` } // Changed from `menu` to avoid conflict
            ];

            if (isOwner) {
                menuRows.push({
                    title: "👑 Owner Menu",
                    description: "Exclusive owner commands",
                    rowId: `${config.prefix}owner_menu`
                });
            }

            // ======================================================
            // YEH HAI AAPKA NAYA, STABLE LIST MENU
            // ======================================================
            const listMessage = {
                image: imageBuffer,
                caption: `*Welcome to MALIK-MD Bot* 🌟\n\nClick the button below to see all command categories.`,
                footer: `Powered by ${config.OWNER_NAME}`,
                buttonText: "☰ Menu Categories",
                sections: [{
                    title: "Bot Commands",
                    rows: menuRows
                }]
            };

            await sock.sendMessage(m.key.remoteJid, listMessage, { quoted: m });

        } catch (e) {
            console.error('List Menu Error:', e);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Menu system encountered an error. Please try again later.` }, { quoted: m });
        }
    }
};

module.exports = command;
