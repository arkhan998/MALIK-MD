const yts = require('yt-search');
const ytdl = require('ytdl-core');
const fs = require('fs');
const config = require('../config.cjs');

module.exports = {
    name: 'song',
    alias: ['music', 'play'],
    description: 'Downloads a song from YouTube and sends it.',
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

            const stream = ytdl(video.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
            });

            const filePath = `./temp_${video.videoId}.mp3`;

            stream.pipe(fs.createWriteStream(filePath));

            stream.on('end', async () => {
                await sock.sendMessage(m.key.remoteJid, {
                    audio: { url: filePath },
                    mimetype: 'audio/mp4',
                    ptt: false, // It's a song, not a voice note
                    fileName: `${video.title}.mp3`
                }, { quoted: m });

                // Clean up the file after sending
                fs.unlinkSync(filePath);
            });

            stream.on('error', (err) => {
                console.error('YTDL Stream Error:', err);
                // Don't crash the bot, just send a message
                sock.sendMessage(m.key.remoteJid, { text: '❌ Sorry, there was an error downloading the song. It might be due to a YouTube update.' }, { quoted: m });
            });

        } catch (error) {
            console.error("Song Command Error:", error);
            await sock.sendMessage(m.key.remoteJid, { text: 'An unexpected error occurred. Please try again later.' }, { quoted: m });
        }
    }
};

