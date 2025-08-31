const yts = require('yt-search');
const axios = require('axios');
const config = require('../config.cjs');

module.exports = {
    name: 'song',
    alias: ['music', 'play'],
    description: 'Downloads a song from YouTube using an API and sends it.',
    async exec(sock, m, args) {
        if (!args.length) {
            await sock.sendMessage(m.key.remoteJid, { text: 'Please provide a song name!' }, { quoted: m });
            return;
        }

        const searchTerm = args.join(' ');
        await sock.sendMessage(m.key.remoteJid, { text: `🎵 Searching for "${searchTerm}"...` }, { quoted: m });

        try {
            const searchResult = await yts(searchTerm);
            const video = searchResult.videos[0];

            if (!video) {
                await sock.sendMessage(m.key.remoteJid, { text: 'Sorry, no song found for that query.' }, { quoted: m });
                return;
            }

            await sock.sendMessage(m.key.remoteJid, { text: `⬇️ Downloading "${video.title}"...` }, { quoted: m });

            // Using an external API to get the download link
            const apiUrl = `https://yt-dlx.vercel.app/mp3?url=${video.url}`;
            const response = await axios.get(apiUrl);
            
            // Check if the API response is successful
            if (response.data && response.data.result && response.data.result.url) {
                const downloadUrl = response.data.result.url;

                // Send the audio directly from the URL
                await sock.sendMessage(m.key.remoteJid, {
                    audio: { url: downloadUrl },
                    mimetype: 'audio/mp4',
                    ptt: false,
                    fileName: `${video.title}.mp3`
                }, { quoted: m });

            } else {
                throw new Error("Could not get a valid download link from the API.");
            }

        } catch (error) {
            console.error("Song Command API Error:", error);
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Sorry, there was an error downloading the song. The API might be temporarily down.' }, { quoted: m });
        }
    }
};

