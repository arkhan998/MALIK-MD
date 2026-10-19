module.exports = {
    name: "malik",
    alias: ["owner", "creator"], // Aap is command ko !owner ya !creator likh kar bhi chala sakte hain
    exec: async (sock, m, args) => {
        try {
            // --- APNA AUDIO LINK YAHAN DAALEIN ---
            // Neeche di gayi line me 'YOUR_AUDIO_URL_HERE' ki jagah
            // apni audio file ka direct download link (.mp3, .ogg, etc.) daalein.
            const audioUrl = "https://files.catbox.moe/9d8sj2.mp3";

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
