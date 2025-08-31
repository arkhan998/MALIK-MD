import fs from 'fs';
import path from 'path';
import {
    fileURLToPath
} from 'url';
import config from '../config.js';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const command = {
    name: "alive",
    aliases: ["status"],
    exec: async (sock, m, args) => {
        try {
            const uptime = process.uptime();
            const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

            const aliveText = `*Hey, I am MALIK-MD, and I am online!* 🚀\n\n- *Version:* 1.0.0\n- *Uptime:* ${uptimeString}\n- *Developer:* ${config.OWNER_NAME}`;

            // Read the local image file
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const message = {
                image: imageBuffer,
                caption: aliveText,
                footer: `Powered by 🦋⃟ᴠͥɪͣᴘͫ✮⃝🇲ᗩしᏆᏦ 🇸αнαв𝄟⃝`,
            };

            await sock.sendMessage(m.key.remoteJid, message);

        } catch (error) {
            console.error("Error in alive command:", error);
            await sock.sendMessage(m.key.remoteJid, {
                text: "Sorry, an error occurred."
            });
        }
    },
};

export default command;
 
