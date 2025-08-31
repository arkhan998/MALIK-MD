const axios = require('axios');

module.exports = {
    name: "bill",
    alias: ["mepco", "checkbill"],
    exec: async (sock, m, args) => {
        try {
            const refNo = args[0];
            
            // --- Input Validation ---
            if (!refNo) {
                return await sock.sendMessage(m.key.remoteJid, { text: "Please provide a 14-digit reference number.\n\n*Example:* `!bill 14123456789012`" }, { quoted: m });
            }
            if (refNo.length !== 14 || !/^\d+$/.test(refNo)) {
                return await sock.sendMessage(m.key.remoteJid, { text: "Invalid reference number. It must be 14 digits long and contain only numbers." }, { quoted: m });
            }

            // Let the user know the bot is working
            await sock.sendMessage(m.key.remoteJid, { text: `🧾 Fetching bill details for ${refNo}...` }, { quoted: m });

            // Using a public API to fetch bill data
            const apiUrl = `https://api.pitc.com.pk/mepco/bill/${refNo}`; // Example API URL
            
            // A more realistic public API endpoint might be needed if the above doesn't work.
            // Let's use a known working public wrapper API for this.
            const workingApiUrl = `https://hercai.onrender.com/api/mepcobill?refno=${refNo}`;
            
            const response = await axios.get(workingApiUrl);
            const billData = response.data;

            if (billData.status !== 200 || !billData.billDetails) {
                 return await sock.sendMessage(m.key.remoteJid, { text: `Sorry, could not find any bill for the reference number: ${refNo}. Please check the number and try again.` }, { quoted: m });
            }

            const details = billData.billDetails;

            // --- Format the Bill Details ---
            const billText = `
*MEPCO Electricity Bill* 💡

*Consumer Name:* ${details.consumerName}
*Reference Number:* ${details.referenceNo}
*Bill Month:* ${details.billMonth}

-----------------------------------

*Due Date:* ${details.dueDate}
*Amount Due:* PKR ${details.amountPayableWithinDueDate}

*After Due Date:*
*Amount:* PKR ${details.amountPayableAfterDueDate}
*Surcharge:* PKR ${details.lps}

-----------------------------------

*Units Consumed:* ${details.unitsConsumed}
*Issue Date:* ${details.issueDate}
*Billing Period:* ${details.billingPeriod}
            `;
            
            // Send the formatted bill details along with the bill image if available
            await sock.sendMessage(
                m.key.remoteJid,
                {
                    image: { url: billData.billImageUrl },
                    caption: billText,
                    footer: 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟɪᴋ-ᴍᴅ' // Stylish Footer
                },
                { quoted: m }
            );

        } catch (error) {
            console.error("Error in bill command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: `Sorry, an error occurred while fetching the bill. The service might be temporarily unavailable. Please try again later.` }, { quoted: m });
        }
    }
};

