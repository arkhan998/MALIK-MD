import axios from 'axios';
import config from '../config.js';

const command = {
    name: "bill",
    aliases: ["mepco", "checkbill"],
    exec: async (sock, m, args) => {
        // Check if the user provided a valid 14-digit reference number
        if (!args[0] || args[0].length !== 14 || !/^\d+$/.test(args[0])) {
            return sock.sendMessage(m.key.remoteJid, {
                text: "❌ Please provide a valid 14-digit MEPCO reference number.\n\n*Example:*\n!bill 14123456789012"
            });
        }
        try {
            // Inform the user that the bill is being checked
            await sock.sendMessage(m.key.remoteJid, { text: "🔍 Checking your bill, please wait..." });
            
            const refNo = args[0];
            const apiUrl = `https://api.zaman-api.xyz/api/bill?ref=${refNo}&company=mepco&apikey=malik`;
            
            // Fetch the bill image from the API
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            
            // Send the bill image with a caption
            await sock.sendMessage(m.key.remoteJid, {
                image: response.data,
                caption: `✅ Here is the MEPCO bill for reference number: *${refNo}*\n\nPowered by 🦋⃟ᴠͥɪͣᴘͫ✮⃝🇲ᗩしᏆᏦ 🇸αнαв𝄟⃝`
            });

        } catch (error) {
            console.error("Error fetching bill:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Sorry, I couldn't fetch the bill. The API might be down or the reference number is incorrect." });
        }
    }
};

export default command;

