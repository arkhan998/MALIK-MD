const axios = require('axios');

// Yeh command user direct istemal nahi karega, yeh button se trigger hogi
const command = {
    name: "send_video", 
    exec: async (sock, m, args) => {
        try {
            const url = args[0];
            if (!url) return; // Agar URL na ho to chup chap fail ho jaye

            await sock.sendMessage(m.key.remoteJid, { text: "📥 Preparing your video..." });

            const apiUrl = `https://batgpt.vercel.app/api/alldl?url=${encodeURIComponent(url)}`;
            const { data } = await axios.get(apiUrl);

            if (data.status === "true" && data.result && data.result[0]?.video) {
                await sock.sendMessage(m.key.remoteJid, {
                    video: { url: data.result[0].video },
                    caption: `✅ Video downloaded successfully!`
                });
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to get the video link." });
            }
        } catch (error) {
            console.error("Error in send_video command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ An error occurred while sending the video." });
        }
    },
};

module.exports = command;
