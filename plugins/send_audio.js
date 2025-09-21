const axios = require('axios');

// Yeh command user direct istemal nahi karega, yeh button se trigger hogi
const command = {
    name: "send_audio", 
    exec: async (sock, m, args) => {
        try {
            const url = args[0];
            if (!url) return; // Agar URL na ho to chup chap fail ho jaye

            await sock.sendMessage(m.key.remoteJid, { text: "🎵 Preparing your audio..." });

            const apiUrl = `https://batgpt.vercel.app/api/alldl?url=${encodeURIComponent(url)}`;
            const { data } = await axios.get(apiUrl);

            if (data.status === "true" && data.result && data.result[0]?.audio) {
                await sock.sendMessage(m.key.remoteJid, {
                    audio: { url: data.result[0].audio },
                    mimetype: 'audio/mp4' // Mimetype set karna zaroori hai
                });
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to get the audio link." });
            }
        } catch (error) {
            console.error("Error in send_audio command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ An error occurred while sending the audio." });
        }
    },
};

module.exports = command;
