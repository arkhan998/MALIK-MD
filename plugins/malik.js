module.exports = {
    name: "malik",
    alias: ["owner", "creator"], // Aap is command ko !owner ya !creator likh kar bhi chala sakte hain
    exec: async (sock, m, args) => {
        try {
            // --- APNA AUDIO LINK YAHAN DAALEIN ---
            // Neeche di gayi line me 'YOUR_AUDIO_URL_HERE' ki jagah
            // apni audio file ka direct download link (.mp3, .ogg, etc.) daalein.
            const audioUrl = "YOUR_AUDIO_URL_HERE";

            // Check if the URL is a placeholder
            if (audioUrl === "YOUR_AUDIO_URL_HERE") {
                return await sock.sendMessage(m.key.remoteJid, { text: "⚠️ *Audio Not Set*\n\nThe owner has not configured the audio URL for this command yet." }, { quoted: m });
            }

            // Sending the audio as a voice note
            await sock.sendMessage(
                m.key.remoteJid,
                {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mp4',
                    ptt: true // This makes it a push-to-talk voice note
                },
                { quoted: m }
            );

        } catch (error) {
            console.error("Error in malik command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, I couldn't send the voice note." }, { quoted: m });
        }
    }
};
