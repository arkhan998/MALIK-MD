const fs = require("fs");
const path = require("path");
const config = require("../config.js");

const command = {
    name: "menu",
    aliases: ["help", "commands"],
    exec: async (sock, m, args) => {
        try {
            // Tasveer ka path
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const isGroup = m.key.remoteJid.endsWith('@g.us');
            const sender = isGroup ? (m.key.participant || m.participant) : m.key.remoteJid;
            const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);
            const uptime = process.uptime();
            const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

            // ======================================================
            // YEH HAI SAB SE STABLE AUR RELIABLE MENU
            // Tasveer ke neeche caption me khoobsurat text menu
            // ======================================================
            
            let menuText = `*❖ ━━━━━━━ 
  *MALIK-MD MAIN MENU*
*━━━━━━━ ❖*

*╭─≽ Info*
*│*
*│  Owner: ${config.OWNER_NAME}*
*│  Prefix: ${config.prefix}*
*│  Uptime: ${uptimeString}*
*│*
*╰──────────≽*

*╭─≽ Categories*
*│*
*│  1️⃣ *AI Tools*
*│     (Type \`${config.prefix}ai_menu\`) *
*│*
*│  2️⃣ *General Tools*
*│     (Type \`${config.prefix}general_menu\`) *
*│*`;

            // Agar user owner hai, to Owner Panel ka option add karna
            if (isOwner) {
                menuText += `
*│  3️⃣ *Owner Panel*
*│     (Type \`${config.prefix}owner_menu\`) *
*│*`;
            }

            menuText += `
*╰──────────≽*

*Powered by 🦋⃟ᴠͥɪͣᴘͫ✮⃝🇲ᗩしᏆᏦ 🇸αнαв𝄟⃝*`;
            
            // ======================================================
            
            // Yahan hum tasveer aur uske neeche caption (menu) bhej rahe hain.
            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                caption: menuText 
            });

        } catch (error) {
            console.error("Error in menu command:", error);
            // Error ki soorat me user ko simple text message bhejna
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, menu me error aagaya. Please try again later." });
        }
    },
};

module.exports = command;

