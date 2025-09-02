const fs = require("fs");
const path = require("path");
const config = require("../config.js");

const command = {
    name: "menu",
    aliases: ["help", "commands"],
    exec: async (sock, m, args) => {
        try {
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const isGroup = m.key.remoteJid.endsWith('@g.us');
            const sender = isGroup ? (m.key.participant || m.participant) : m.key.remoteJid;
            const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);
            const uptime = process.uptime();
            const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

            // ======================================================
            // YEH HAI AAPKA NAYA, PROFESSIONAL TEXT-BASED MENU
            // ======================================================
            
            let menuBodyText = `*❖ ━━━━━━━ 
  *MALIK-MD MAIN MENU*
*━━━━━━━ ❖*

*╭─≽ Info*
*│*
*│  Owner: ${config.OWNER_NAME}*
*│  Number: ${config.OWNER_NUMBER}*
*│  Platform: Heroku*
*│  Uptime: ${uptimeString}*
*│*
*╰──────────≽*`;

            // ======================================================
            // YEH HAIN AAPKE NAYE INTERACTIVE BUTTONS
            // ======================================================
            
            const interactiveButtons = [
                {
                    "headerType": 1,
                    "title": "🧠 AI Tools",
                    "id": `${config.prefix}ai_menu`
                },
                {
                    "headerType": 1,
                    "title": "🛠️ General Tools",
                    "id": `${config.prefix}general_menu`
                }
            ];

            if (isOwner) {
                interactiveButtons.push({
                    "headerType": 1,
                    "title": "👑 Owner Panel",
                    "id": `${config.prefix}owner_menu`
                });
            }

            const interactiveMessage = {
                "body": { "text": menuBodyText },
                "footer": { "text": `Powered by ${config.OWNER_NAME}` },
                "header": {
                    "title": "MALIK-MD",
                    "subtitle": "Welcome!",
                    "hasMediaAttachment": true, // Yeh zaroori hai tasveer ke liye
                    "imageMessage": {
                        "jpegThumbnail": imageBuffer
                    }
                },
                "nativeFlowMessage": {
                    "buttons": interactiveButtons
                }
            };
            
            await sock.sendMessage(m.key.remoteJid, {
                "interactive": interactiveMessage
            });


        } catch (error) {
            console.error("Error in menu command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, an error occurred while displaying the menu." });
        }
    },
};

module.exports = command;

