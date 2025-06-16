/**
 * @info - Updated Alive Command for MALIK-MD
 * @description - This command sends a professional and interactive "alive" message.
 * @author - Gemini
 * @updated_by - ARKHAN
 */

const {
    command
} = require("../lib/");
const os = require("os");

// --- START ---
// Aap in values ko apne hosting platform (Heroku, Render, etc.) ke environment variables mein set karein.
// Isse aapko code baar baar edit nahi karna padega.
const OWNER_NAME = process.env.OWNER_NAME || "MALIK-SAHAB";
const BOT_NAME = process.env.BOT_NAME || "MALIK-MD";
const OWNER_NUMBER = process.env.OWNER_NUMBER || "923322964709";
const THUMB_IMAGE = process.env.THUMB_IMAGE || "https://telegra.ph/file/5a24b1de6535593c66f68.jpg";
const REPO_URL = process.env.REPO_URL || "https://github.com/arkhan998/MALIK-MD";
// --- END ---

function formatp(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}

function uptimer(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

command(
    {
        pattern: "alive",
        fromMe: true,
        desc: "Bot ke kaam karne ki janch karta hai",
        type: "user",
    },
    async (message, match, client) => {
        try {
            // Uptime and memory usage details
            const uptime = uptimer(process.uptime());
            const totalMemory = formatp(os.totalmem());
            const freeMemory = formatp(os.freemem());
            const platform = os.platform();

            // Creating the message content
            const aliveMessage = `*${BOT_NAME} is active now!* ✨\n\n*Owner:* ${OWNER_NAME}\n*Platform:* ${platform}\n*Uptime:* ${uptime}\n*Total RAM:* ${totalMemory}\n*Free RAM:* ${freeMemory}`;
            
            // Defining interactive buttons
            const buttons = [
                {
                    "buttonId": "1",
                    "buttonText": { "displayText": "MENU 📋" },
                    "type": "RESPONSE_PAYLOAD" // Use RESPONSE_PAYLOAD for quick replies
                },
                 {
                    "buttonId": "2",
                    "buttonText": { "displayText": "STATUS 📊" },
                    "type": "RESPONSE_PAYLOAD"
                }
            ];

            // Defining the template message structure
            const templateMessage = {
                "text": aliveMessage,
                "footer": `© ${BOT_NAME} - Developed by ${OWNER_NAME}`,
                "headerType": "IMAGE",
                "buttons": buttons,
                 "contextInfo": {
                    "externalAdReply": {
                        "title": OWNER_NAME,
                        "body": "Author",
                        "thumbnailUrl": THUMB_IMAGE,
                        "mediaType": "IMAGE",
                        "mediaUrl": REPO_URL,
                        "sourceUrl": REPO_URL,
                        "showAdAttribution": true,
                    },
                     "forwardingScore": 999,
                     "isForwarded": true
                 }
            };
            
            // Sending the complete template message
            await message.sendMessage(message.jid, templateMessage, {}, "template");

        } catch (error) {
            console.error("Error in alive command: ", error);
            await message.reply("Oops! Alive command mein kuch gadbad ho gayi.");
        }
    }
);
