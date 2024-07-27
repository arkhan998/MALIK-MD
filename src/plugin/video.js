import axios from 'axios';
import yts from 'yt-search';

const fetchVideoDetails = async (url) => {
  try {
    const response = await axios.get(`https://matrix-serverless-api.vercel.app/api/ytdl?url=${url}&type=video`);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching video details.');
  }
};

const video = async (m, Matrix) => {
  const prefixMatch = m.body.match(/^[\\/!#.]/);
  const prefix = prefixMatch ? prefixMatch[0] : '/';
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  const validCommands = ['video', 'ytmp4', 'vid', 'ytmp4doc'];

  if (validCommands.includes(cmd)) {
    if (!text) return m.reply('Give a YouTube URL or search query.');

    try {
      await m.React("🕘");

      const isUrl = text.includes('youtube.com') || text.includes('youtu.be');
      await m.React("⬇️");

      const sendVideoMessage = async (videoInfo, videoURL) => {
        const responseBuffer = await axios.get(videoURL, { responseType: 'arraybuffer' });

        if (cmd === 'ytmp4doc') {
          const docMessage = {
            document: Buffer.from(responseBuffer.data),
            mimetype: 'video/mp4',
            fileName: `${videoInfo.title}.mp4`,
            caption: `> ${videoInfo.title}\n> © Powered by 𝞢𝙏𝞖𝞘𝞦-𝞛𝘿`,
          };
          await Matrix.sendMessage(m.from, docMessage, { quoted: m });
        } else {
          const videoMessage = {
            video: Buffer.from(responseBuffer.data),
            mimetype: 'video/mp4',
            caption: `> ${videoInfo.title}\n> © POWERED BY 𝞢𝙏𝞖𝞘𝞦-𝞛𝘿`,
          };
          await Matrix.sendMessage(m.from, videoMessage, { quoted: m });
        }
        await m.React("✅");
      };

      if (isUrl) {
        const { videoDetails, videoURL } = await fetchVideoDetails(text);
        await sendVideoMessage(videoDetails, videoURL);
      } else {
        const searchResult = await yts(text);
        const firstVideo = searchResult.videos[0];
        await m.React("⬇️");

        if (!firstVideo) {
          m.reply('Video not found.');
          await m.React("❌");
          return;
        }

        const { videoDetails, videoURL } = await fetchVideoDetails(firstVideo.url);
        await sendVideoMessage(videoDetails, videoURL);
      }
    } catch (error) {
      console.error("Error generating response:", error);
      m.reply('An error occurred while processing your request.');
      await m.React("❌");
    }
  }
};

export default video;
