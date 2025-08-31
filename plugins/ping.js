module.exports = {
    name: "ping",
    exec: async (sock, m) => {
        try {
            // Calculate latency by comparing the current timestamp with the message's timestamp.
            // performance.now() is more accurate for measuring time intervals.
            const startTime = new Date();
            const messageTimestamp = new Date(m.messageTimestamp * 1000); // Convert Unix timestamp to milliseconds
            const latency = startTime - messageTimestamp;

            const responseText = `*Pong!* 🏓\n*Response Time:* ${latency}ms`;

            // Send the response back to the user with a stylish footer.
            await sock.sendMessage(m.key.remoteJid, {
                text: responseText,
                footer: 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟɪᴋ-ᴍᴅ' // Stylish Footer
            }, { quoted: m });

        } catch (error) {
            console.error("Error in ping command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, I couldn't measure the ping right now." });
        }
    }
};

