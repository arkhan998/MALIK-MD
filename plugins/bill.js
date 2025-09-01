import axios from 'axios';
import config from '../config.js';

const command = {
    name: "bill",
    aliases: ["mepco"],
    exec: async (sock, m, args) => {
        // 1. Check if the input is a valid 14-digit reference number
        if (!args[0] || args[0].length !== 14 || !/^\d+$/.test(args[0])) {
            return sock.sendMessage(m.key.remoteJid, {
                text: "❌ Please provide a valid 14-digit MEPCO reference number.\n\n*Example:*\n!bill 14123456789012"
            });
        }

        let searchingMsg;
        try {
            // 2. Inform the user that the process has started
            searchingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🔍 Accessing PITC database... Please wait." });
            const refNo = args[0];

            // 3. Call a fast scraper API that gets JSON data from the official PITC website
            const apiUrl = `https://api.herokucoders.eu.org/api/mepco?ref=${refNo}`;
            const { data } = await axios.get(apiUrl);

            // 4. Check if the API returned a successful response
            if (data.status === 200 && data.data) {
                const details = data.data;

                // 5. Format the details into a clean, readable text message
                const billText = `
*💡 MEPCO Bill Details Fetched!*

*👤 Consumer Name:* ${details.name}
*🗓️ Bill Month:* ${details.month}
*#️⃣ Reference No:* \`\`\`${details.ref}\`\`\`

- - - - - - - - - - - - - - -

*⏳ Due Date:* ${details.dueDate}
*💰 Amount (within due date):* Rs. ${details.netAmount}
*💵 Amount (after due date):* Rs. ${details.lateAmount}

- - - - - - - - - - - - - - -

*📊 Bill Status:* ${details.status}

Powered by ${config.OWNER_NAME}
                `;

                // Edit the "Searching..." message with the final result
                await sock.sendMessage(m.key.remoteJid, { 
                    text: billText,
                    edit: searchingMsg.key 
                });

            } else {
                // Handle cases where the bill is not found
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ Bill not found for reference number: *${refNo}*.\nPlease double-check the number.`,
                    edit: searchingMsg.key
                });
            }

        } catch (error) {
            // Handle network or other errors
            console.error("Error in bill command:", error);
            const errorMessage = "Sorry, the bill checking service is currently unavailable. The PITC website might be down. Please try again later.";
            if (searchingMsg) {
                 await sock.sendMessage(m.key.remoteJid, { text: errorMessage, edit: searchingMsg.key });
            } else {
                 await sock.sendMessage(m.key.remoteJid, { text: errorMessage });
            }
        }
    },
};

export default command;

