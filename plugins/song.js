const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const config = require('../config.cjs');

module.exports = {
    name: 'song',
    description: 'Downloads a song from YouTube.',
    aliases: ['ytmp3', 'music'],
    execute: async (sock, m, args) => {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(m.key.remoteJid, { text: 'Please provide a song name to search.' }, { quoted: m });
        }

        try {
            await sock.sendMessage(m.key.remoteJid, { text: `Searching for "${query}"...` }, { quoted: m });
            
            const searchResult = await ytSearch(query);
            const video = searchResult.videos[0];

            if (!video) {
                return sock.sendMessage(m.key.remoteJid, { text: 'Song not found.' }, { quoted: m });
            }

            const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
            
            const chunks = [];
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                await sock.sendMessage(
                    m.key.remoteJid,
                    {
                        audio: buffer,
                        mimetype: 'audio/mpeg',
                        fileName: `${video.title}.mp3`,
                        ptt: false // ptt: true for voice note
                    },
                    { quoted: m }
                );
            });
            stream.on('error', (err) => {
                console.error("YTDL Error:", err);
                sock.sendMessage(m.key.remoteJid, { text: 'Failed to download the song.' }, { quoted: m });
            });

        } catch (error) {
            console.error("Song command error:", error);
            sock.sendMessage(m.key.remoteJid, { text: 'An error occurred.' }, { quoted: m });
        }
    },
};
