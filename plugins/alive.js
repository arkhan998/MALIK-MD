import fs from 'fs';
import path from 'path';
import {
    fileURLToPath
} from 'url';
import config from '../config.js';

// Get the directory name of the current module
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const command = {
    name: "alive",
    aliases: ["status", "online"],
    exec: async (sock, m, args) => {
        try {
            // Calculate uptime
            const uptime = process.uptime();
            const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

            // Create the status message text
            const aliveText = `*Hey, I am MALIK-MD, and I am online!* 🚀\n\n- *Version:* 1.0.0\n- *Uptime:* ${uptimeString}\n- *Developer:* ${config.OWNER_NAME}`;

            // Define the path to your local profile image
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            
            // Read the image file into a buffer
            const imageBuffer = fs.readFileSync(imagePath);

            // Create the message object with the image and caption
            const message = {
                image: imageBuffer,
                caption: aliveText,
                footer: `Powered by 🦋⃟ᴠͥɪͣᴘͫ✮⃝🇲ᗩしᏆᏦ 🇸αнαв𝄟⃝`,
            };

            // Send the message
            await sock.sendMessage(m.key.remoteJid, message);

        } catch (error) {
            console.error("Error in alive command:", error);
            await sock.sendMessage(m.key.remoteJid, {
                text: "Sorry, an error occurred while checking the status."
            });
        }
    },
};

export default command;

