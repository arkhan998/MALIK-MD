const axios = require('axios');

module.exports = {
    name: "song",
    alias: ["ytmp3", "ytaudio"],
    exec: async (sock, m, args) => {
        try {
            const songName = args.join(' ');
            if (!songName) {
                return await sock.sendMessage(m.key.remoteJid, { text: "Please provide a song name to download.\n\n*Example:* `!song memories`" }, { quoted: m });
            }

            // Let the user know the bot is working
            await sock.sendMessage(m.key.remoteJid, { text: `🎶 Searching for "${songName}"...` }, { quoted: m });

            // Using a public API to fetch the song data and download link
            const apiUrl = `https://api.itzpire.com/download/ytmp3?url=${encodeURIComponent(songName)}`;
            
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            // Check if the response contains valid audio data
            if (response.headers['content-type'].includes('audio/mpeg')) {
                const songTitle = response.headers['content-disposition']?.split('filename=')[1]?.split('"')[1] || `${songName}.mp3`;

                // Send the downloaded audio file
                await sock.sendMessage(
                    m.key.remoteJid,
                    {
                        audio: response.data,
                        mimetype: 'audio/mpeg',
                        fileName: songTitle,
                        ptt: false, // ptt: true makes it a voice note
                    },
                    { quoted: m }
                );
            } else {
                // If API returns something other than audio (like an error page)
                throw new Error("API did not return a valid audio file.");
            }

        } catch (error) {
            console.error("Error in song command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: `Sorry, I couldn't find or download the song "${args.join(' ')}". Please try another song.` }, { quoted: m });
        }
    }
};

