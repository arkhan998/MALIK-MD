const command = {
    name: "restart",
    ownerOnly: true, // Sirf owner — pehle koi bhi bot band kar sakta tha!
    exec: async (sock, m, args) => {
        try {
            await sock.sendMessage(m.key.remoteJid, { text: "♻️ Restarting the bot...\n\n_Codespace mein band ho jaye to `npm start` dobara chalana._" }, { quoted: m });
            // Reply pohanch jaye, phir process band
            setTimeout(() => process.exit(0), 1000);
        } catch (error) {
            console.error("Error in restart command:", error);
        }
    },
};

module.exports = command;
