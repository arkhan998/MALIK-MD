import axios from 'axios';
import yts from 'yt-search';

const fetchAudioDetails = async (url) => {
  try {
    const response = await axios.get(`https://matrix-serverless-api.vercel.app/api/ytdl?url=${url}&type=audio`);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching audio details.');
  }
};

const song = async (m, Matrix) => {
  const prefixMatch = m.body.match(/^[\\/!#.]/);
  const prefix = prefixMatch ? prefixMatch[0] : '/';
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  const validCommands = ['song', 'ytmp3', 'music', 'ytmp3doc'];

  if (validCommands.includes(cmd)) {
    if (!text) return m.reply('Please provide a YT URL or search query.');

    try {
      await m.React("🕘");

      const isUrl = text.includes('youtube.com') || text.includes('youtu.be');

      const sendAudioMessage = async (videoInfo, audioURL) => {
        const responseBuffer = await axios.get(audioURL, { responseType: 'arraybuffer' });

        if (cmd === 'ytmp3doc') {
          const docMessage = {
            document: Buffer.from(responseBuffer.data),
            mimetype: 'audio/mpeg',
            fileName: `${videoInfo.title}.mp3`,
            contextInfo: {
              mentionedJid: [m.sender],
              externalAdReply: {
                title: "↺ |◁   II   ▷|   ♡",
                body: `Now playing: ${videoInfo.title}`,
                thumbnailUrl: videoInfo.thumbnail,
                sourceUrl: videoInfo.url,
                mediaType: 1,
                renderLargerThumbnail: false,
              },
            },
          };
          await Matrix.sendMessage(m.from, docMessage, { quoted: m });
        } else {
          const audioMessage = {
            audio: Buffer.from(responseBuffer.data),
            mimetype: 'audio/mpeg',
            contextInfo: {
              mentionedJid: [m.sender],
              externalAdReply: {
                title: "↺ |◁   II   ▷|   ♡",
                body: `Now playing: ${videoInfo.title}`,
                thumbnailUrl: videoInfo.thumbnail,
                sourceUrl: videoInfo.url,
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          };
          await Matrix.sendMessage(m.from, audioMessage, { quoted: m });
        }

        await m.React("✅");
      };

      if (isUrl) {
        const { videoDetails, audioURL } = await fetchAudioDetails(text);
        await sendAudioMessage(videoDetails, audioURL);
      } else {
        const searchResult = await yts(text);
        const firstVideo = searchResult.videos[0];

        if (!firstVideo) {
          m.reply('Audio not found.');
          await m.React("❌");
          return;
        }

        const { videoDetails, audioURL } = await fetchAudioDetails(firstVideo.url);
        await sendAudioMessage(videoDetails, audioURL);
      }
    } catch (error) {
      console.error("Error generating response:", error);
      m.reply('Error processing your request.');
      await m.React("❌");
    }
  }
};

export default song;
