const axios = require('axios');
const config = require('../config.js');

const command = {
    name: "simdata",
    alias: ["data", "siminfo"],
    // Is command ko sirf owner hi istemal kar sakta hai
    ownerOnly: true, 
    exec: async (sock, m, args) => {
        try {
            const numberToSearch = args[0];

            if (!numberToSearch) {
                return sock.sendMessage(m.key.remoteJid, { text: `❌ Please provide a phone number!\n*Example:* .simdata 03321234567` }, { quoted: m });
            }

            // Number ko saaf karna
            const cleanedNumber = numberToSearch.replace(/\D/g, '');

            // Check karna ke number Pakistani format ka hai ya nahi
            if (!/^(03\d{9})$|^(923\d{9})$/.test(cleanedNumber)) {
                await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid Pakistani phone number format!\n*Example:* 03321234567` }, { quoted: m });
            }
            
            await sock.sendMessage(m.key.remoteJid, { react: { text: '⏳', key: m.key } });

            const apiUrl = `https://famofcfallxd.serv00.net/apis/famdata.php?num=${encodeURIComponent(cleanedNumber)}`;
            
            const response = await axios.get(apiUrl, { timeout: 15000 }); // 15 second ka timeout
            const data = response.data;

            if (data.status !== 'success' || !Array.isArray(data.data) || data.data.length === 0) {
                await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(m.key.remoteJid, { text: `❌ No data found for number ${cleanedNumber}.` }, { quoted: m });
            }

            let formattedResponse = `*✅ SIM Database Results*\n\n` +
                                  `*📞 Queried Number:* ${cleanedNumber}\n` +
                                  `*📊 Total Records Found:* ${data.data.length}\n\n`;

            data.data.forEach((record, index) => {
                formattedResponse += `*📌 Record ${index + 1}:*\n` +
                                     `*🔹 Name:* ${record.Name || 'N/A'}\n` +
                                     `*🔹 Number:* ${record.Mobile || 'N/A'}\n` +
                                     `*🔹 CNIC:* ${record.CNIC || 'N/A'}\n` +
                                     `*🔹 Address:* ${record.Address?.trim() || 'N/A'}\n` +
                                     `━━━━━━━\n`;
            });

            formattedResponse += `*Powered by MALIK-MD*`;

            await sock.sendMessage(m.key.remoteJid, { text: formattedResponse }, { quoted: m });
            await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error("SIM Data Command Error:", error.message);
            await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
            
            if (error.code === 'ECONNABORTED') {
                await sock.sendMessage(m.key.remoteJid, { text: `❌ Timeout: The server took too long to respond. Please try again later.` }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to retrieve SIM data. The API might be offline.` }, { quoted: m });
            }
        }
    }
};

module.exports = command;
