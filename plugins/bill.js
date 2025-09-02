const axios = require('axios');
const { config } = require('../config.js');

module.exports = {
    name: "bill",
    aliases: ["mepco"],
    exec: async (sock, m, args) => {
        if (!args[0] || args[0].length !== 14 || !/^\d+$/.test(args[0])) {
            return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a valid 14-digit MEPCO reference number.\n\n*Example:*\n!bill 14123456789012" }, { quoted: m });
        }
        let searchingMsg;
        try {
            searchingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🔍 Accessing PITC database... Please wait." }, { quoted: m });
            const refNo = args[0];
            const { data } = await axios.get(`https://api.herokucoders.eu.org/api/mepco?ref=${refNo}`);

            if (data.status === 200 && data.data) {
                const details = data.data;
                const billText = `*💡 MEPCO Bill Details Fetched!*\n\n*👤 Consumer Name:* ${details.name}\n*🗓️ Bill Month:* ${details.month}\n*#️⃣ Reference No:* \`\`\`${details.ref}\`\`\`\n\n- - - - - - - - - - - - - - -\n\n*⏳ Due Date:* ${details.dueDate}\n*💰 Amount (within due date):* Rs. ${details.netAmount}\n*💵 Amount (after due date):* Rs. ${details.lateAmount}\n\n- - - - - - - - - - - - - - -\n\n*📊 Bill Status:* ${details.status}\n\nPowered by ${config.OWNER_NAME}`;
                await sock.sendMessage(m.key.remoteJid, { text: billText, edit: searchingMsg.key }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: `❌ Bill not found for reference number: *${refNo}*.`, edit: searchingMsg.key }, { quoted: m });
            }
        } catch (error) {
            console.error("Error in bill command:", error);
            const errorMessage = "Sorry, the bill checking service is currently unavailable.";
            if (searchingMsg) await sock.sendMessage(m.key.remoteJid, { text: errorMessage, edit: searchingMsg.key }, { quoted: m });
            else await sock.sendMessage(m.key.remoteJid, { text: errorMessage }, { quoted: m });
        }
    }
};

