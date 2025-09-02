module.exports = {
    name: 'ping',
    aliases: ['speed'],
    exec: async (sock, m, args) => {
        try {
            const startTime = Date.now();
            const sentMsg = await sock.sendMessage(m.key.remoteJid, { text: 'Pinging...' });
            const speed = Date.now() - startTime;
            await sock.sendMessage(m.key.remoteJid, { text: `*Pong!* 🏓\n_Response Time: ${speed} ms_`, edit: sentMsg.key }, { quoted: m });
        } catch (error) {
            console.error("Error in ping command:", error);
        }
    }
};

