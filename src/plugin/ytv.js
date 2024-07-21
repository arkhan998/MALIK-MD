import play from 'play-dl';
import yts from 'yt-search';
import pkg, { prepareWAMessageMedia } from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;

const videoMap = new Map();
let videoIndex = 1;

const song = async (m, Matrix) => {
  const prefixMatch = m.body.match(/^[\\/!#.]/);
  const prefix = prefixMatch ? prefixMatch[0] : '/';
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  const validCommands = ['ytv'];

  if (validCommands.includes(cmd)) {
    if (!text || !play.yt_validate(text)) {
      return m.reply('Please provide a valid YouTube URL.');
    }

    try {
      await m.React("🕘");

      const info = await play.video_info(text);
      const videoDetails = {
        title: info.video_details.title,
        author: info.video_details.channel.name,
        views: info.video_details.views,
        uploadDate: formatDate(info.video_details.upload_date),
        duration: formatDuration(info.video_details.durationInSec),
        thumbnailUrl: info.video_details.thumbnails[0].url,
        videoUrl: text,
      };

      const formats = info.format.filter(format => format.hasAudio && format.hasVideo);

      const desiredQualities = {
        '144p': formats.find(f => f.qualityLabel === '144p')?.itag,
        '240p': formats.find(f => f.qualityLabel === '240p')?.itag,
        '360p': formats.find(f => f.qualityLabel === '360p')?.itag,
        '480p': formats.find(f => f.qualityLabel === '480p')?.itag,
        '720p': formats.find(f => f.qualityLabel === '720p')?.itag,
        '1080p': formats.find(f => f.qualityLabel === '1080p')?.itag,
      };

      const qualityButtons = Object.entries(desiredQualities).map(([quality, itag], index) => {
        if (itag) {
          const uniqueId = videoIndex + index;
          videoMap.set(uniqueId, { itag, videoId: info.video_details.id, ...videoDetails, quality });
          return {
            "header": "",
            "title": `${quality}`,
            "description": `Select ${quality} quality`,
            "id": `quality_${uniqueId}`
          };
        }
      }).filter(Boolean);

      // Generate and send interactive message
      const msg = generateWAMessageFromContent(m.from, {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: {
                text: `> *VIDEO DOWNLOADER*\n> *TITLE:* ${videoDetails.title}\n> *AUTHOR:* ${videoDetails.author}\n> *VIEWS:* ${videoDetails.views}\n> *UPLOAD DATE:* ${videoDetails.uploadDate}\n> *DURATION:* ${videoDetails.duration}\n`
              },
              footer: { text: "© Powered By Your Bot" },
              header: await prepareWAMessageMedia({ image: { url: videoDetails.thumbnailUrl } }, { upload: Matrix.waUploadToServer }),
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                      title: "🎬 Select a video quality",
                      sections: [
                        {
                          title: "📥 Available Qualities",
                          highlight_label: "💡 Choose Quality",
                          rows: qualityButtons
                        },
                      ]
                    })
                  },
                ],
              },
              contextInfo: { mentionedJid: [m.sender] }
            },
          },
        },
      }, {});

      await Matrix.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
      await m.React("✅");

      videoIndex += qualityButtons.length;
    } catch (error) {
      console.error("Error processing your request:", error);
      m.reply('Error processing your request.');
      await m.React("❌");
    }
  } else if (selectedId) {
    const key = parseInt(selectedId.replace('quality_', ''));
    const selectedQuality = videoMap.get(key);

    if (selectedQuality) {
      try {
        const stream = await play.stream(selectedQuality.videoUrl, { quality: selectedQuality.itag });
        const finalVideoBuffer = await streamToBuffer(stream.stream);

        const content = {
          document: finalVideoBuffer,
          mimetype: 'video/mp4',
          fileName: `${selectedQuality.title}.mp4`,
          caption: `*DOWNLOADED BY YOUR BOT*`,
          contextInfo: {
            externalAdReply: {
              showAdAttribution: true,
              title: selectedQuality.title,
              body: 'Your Bot',
              thumbnailUrl: selectedQuality.thumbnailUrl,
              sourceUrl: selectedQuality.videoUrl,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        };

        await Matrix.sendMessage(m.from, content, { quoted: m });
      } catch (error) {
        console.error("Error fetching video details:", error);
        m.reply(`Error fetching video details: ${error.message}`);
      }
    }
  }
};

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
};

const formatDate = (date) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};

export default song;
