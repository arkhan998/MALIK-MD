const axios = require('axios');
const config = require('../config.cjs');

module.exports = {
    name: 'bill',
    alias: ['mepco', 'checkbill'],
    description: 'Checks MEPCO electricity bill using a 14-digit reference number.',
    async exec(sock, m, args) {
        // Check if the user provided a 14-digit reference number
        if (!args[0] || args[0].length !== 14 || !/^\d+$/.test(args[0])) {
            const exampleMessage = '❌ Please provide a valid 14-digit reference number without spaces.\n\n*Example:*\n!bill 12345678901234';
            await sock.sendMessage(m.key.remoteJid, { text: exampleMessage }, { quoted: m });
            return;
        }

        const refNo = args[0];
        await sock.sendMessage(m.key.remoteJid, { text: `🔍 Searching for bill with reference number:\n*${refNo}*` }, { quoted: m });

        try {
            // Using a public API to fetch bill data
            const apiUrl = `https://api.maher-zubair.tech/bill/mepco?ref=${refNo}`;
            const response = await axios.get(apiUrl);

            // Check if the API returned an error or no data
            if (response.data.status !== 200 || !response.data.result || response.data.result.error) {
                const errorMessage = response.data.result.error || 'Bill not found! Please check the reference number and try again.';
                await sock.sendMessage(m.key.remoteJid, { text: `❌ ${errorMessage}` }, { quoted: m });
                return;
            }

            const billData = response.data.result;

            // Format the bill details into a nice message
            const billDetails = `
*💡 MEPCO Electricity Bill Details 💡*

*👤 Consumer Name:*
${billData.consumerDetails.name}

*📍 Address:*
${billData.consumerDetails.address}

*🔢 Reference No:*
\`${billData.consumerDetails.referenceNo}\`

*📅 Due Date:*
*${billData.billDetails.dueDate}*

*💰 Amount (within Due Date):*
*Rs. ${billData.billDetails.amountWithinDueDate}*

*💰 Amount (after Due Date):*
*Rs. ${billData.billDetails.amountAfterDueDate}*

*🗓️ Billing Month:*
${billData.billDetails.billingMonth}

*🧾 Bill Status:*
*${billData.billDetails.billStatus}*

*Powered by MALIK-MD Bot*
            `;

            // Check if the API provided a bill image URL to send
            if (billData.billImageUrl) {
                await sock.sendMessage(m.key.remoteJid, {
                    image: { url: billData.billImageUrl },
                    caption: billDetails
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: billDetails }, { quoted: m });
            }

        } catch (error) {
            console.error("Bill Command Error:", error);
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Sorry, the bill checking service is currently unavailable. Please try again later.' }, { quoted: m });
        }
    }
};
