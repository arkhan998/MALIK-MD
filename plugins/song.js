const axios = require('axios');
const config = require('../config.js');

module.exports = {
    name: "song",
    alias: ["ytmp3", "ytaudio"],
    exec: async (sock, m, args) => {
        try {
            const songName = args.join(' ');
            if (!songName) {
                return await sock.sendMessage(m.key.remoteJid, { text: "Please provide a song name.\n*Example:* `!song memories`" }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: `🎶 Searching for "${songName}"...` }, { quoted: m });

            // NAYI, CHALTI HUI API
            const apiUrl = `https://vihangayt.me/download/ytmp3?url=${encodeURIComponent(songName)}`;
            
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            if (response.headers['content-type'].includes('audio/mpeg') && response.data.length > 0) {
                 await sock.sendMessage(
                    m.key.remoteJid,
                    {
                        audio: response.data,
                        mimetype: 'audio/mpeg',
                        fileName: `${songName}.mp3`,
                    },
                    { quoted: m }
                );
                // Purana "searching" message delete kar dein
                await sock.sendMessage(m.key.remoteJid, { delete: waitingMsg.key });
            } else {
                throw new Error("API did not return a valid audio file.");
            }

        } catch (error) {
            console.error("Error in song command:", error.message);
            await sock.sendMessage(m.key.remoteJid, { text: `Sorry, I couldn't find or download the song "${args.join(' ')}".` }, { quoted: m });
        }
    }
};
