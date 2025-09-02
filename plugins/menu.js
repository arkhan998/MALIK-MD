const config = require("../config.js");

const command = {
    name: "menu",
    aliases: ["help", "commands"],
    exec: async (sock, m, args) => {
        try {
            const isGroup = m.key.remoteJid.endsWith('@g.us');
            const sender = isGroup ? (m.key.participant || m.participant) : m.key.remoteJid;
            const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);

            // ======================================================
            // YEH HAI AAKHRI AUR 100% WORKING HAL
            // Hum buttons ko ab text ke andar hi bana rahe hain.
            // ======================================================
            
            let menuText = `*Assalam-o-Alaikum! Welcome to the MALIK-MD Agent!* 🚀

I am an AI-powered assistant designed by Malik Sahab. 
Please select a category by typing the command:

*┌─⊷ MENU ⊷*
*│*
*│  1. 🧠 AI Tools*
*│     (Type \`${config.prefix}ai_menu\`) *
*│*
*│  2. 🛠️ General Tools*
*│     (Type \`${config.prefix}general_menu\`) *
*│*`;

            // Agar user owner hai, to "Owner Panel" ka option add karna
            if (isOwner) {
                menuText += `
*│  3. 👑 Owner Panel*
*│     (Type \`${config.prefix}owner_menu\`) *
*│*`;
            }

            menuText += `
*└───────────*

*Powered by ${config.OWNER_NAME}*`;
            
            // ======================================================
            
            // Is naye tareeqe ke liye, hum ek simple text message bhejenge.
            await sock.sendMessage(m.key.remoteJid, { text: menuText });

        } catch (error) {
            console.error("Error in menu command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, an error occurred while displaying the menu." });
        }
    },
};

module.exports = command;

