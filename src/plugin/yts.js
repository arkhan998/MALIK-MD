import yts from 'yt-search';
import fetch from 'node-fetch';
import pkg, { prepareWAMessageMedia } from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;

const videoMap = new Map();
let videoIndex = 1;
let audioIndex = 1001;

const song = async (m, Matrix) => {
  let selectedListId;
  const selectedButtonId = m?.message?.templateButtonReplyMessage?.selectedId;
  const interactiveResponseMessage = m?.message?.interactiveResponseMessage;

  if (interactiveResponseMessage) {
    const paramsJson = interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson;
    if (paramsJson) {
      const params = JSON.parse(paramsJson);
      selectedListId = params.id;
    }
  }

  const selectedId = selectedListId || selectedButtonId;

  const prefixMatch = m.body.match(/^[\\/!#.]/);
  const prefix = prefixMatch ? prefixMatch[0] : '/';
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  const validCommands = ['yts', 'ytsearch'];

  if (validCommands.includes(cmd)) {
    if (!text) return m.reply('Please provide a YouTube URL or search query');

    try {
      await m.React("🕘");

      // Search YouTube for the provided query
      const searchResult = await yts(text);
      const topVideos = searchResult.videos.slice(0, 10);

      if (topVideos.length === 0) {
        m.reply('No results found.');
        await m.React("❌");
        return;
      }

      const videoButtons = topVideos.map((video, index) => {
        const uniqueId = videoIndex + index;
        videoMap.set(uniqueId, { ...video, isAudio: false });
        return {
          "header": "",
          "title": video.title,
          "description": ``,
          "id": `🎦video_${uniqueId}`
        };
      });

      const audioButtons = topVideos.map((video, index) => {
        const uniqueId = audioIndex + index;
        videoMap.set(uniqueId, { ...video, isAudio: true });
        return {
          "header": "",
          "title": video.title,
          "description": ``,
          "id": `🎵audio_${uniqueId}`
        };
      });

      const firstVideo = topVideos[0];
      const videoInfo = {
        title: firstVideo.title,
        author: firstVideo.author.name,
        duration: firstVideo.timestamp,
        views: firstVideo.views,
        url: `https://www.youtube.com/watch?v=${firstVideo.videoId}`,
        thumbnail: firstVideo.thumbnail,
      };

      const msg = generateWAMessageFromContent(m.from, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: `*𝞢𝙏𝞖𝞘𝞦-𝞛𝘿 VIDEO DOWNLOADER*\n\n> *TITLE:* _${videoInfo.title}_\n> *AUTHOR:* _${videoInfo.author}_\n> *DURATION:* _${videoInfo.duration}_\n> *VIEWS:* _${videoInfo.views}_\n> *URL:* _${videoInfo.url}_`
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "© Powered By Ethix-MD"
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                ...(await prepareWAMessageMedia({ image: { url: videoInfo.thumbnail } }, { upload: Matrix.waUploadToServer })),
                title: ``,
                gifPlayback: true,
                subtitle: "",
                hasMediaAttachment: false
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                      title: "🔖 SELECT A VIDEO",
                      sections: [
                        {
                          title: "😎 Top 10 YouTube Results - Videos",
                          highlight_label: "🤩 Top 10",
                          rows: videoButtons
                        },
                      ]
                    })
                  },
                  {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                      title: "🎧 SELECT AN AUDIO",
                      sections: [
                        {
                          title: "🎶 Top 10 YouTube Results - Audios",
                          highlight_label: "🤩 Top 10",
                          rows: audioButtons
                        },
                      ]
                    })
                  },
                ],
              }),
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 9999,
                isForwarded: true,
              }
            }),
          },
        },
      }, {});

      await Matrix.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
      });
      await m.React("✅");

      videoIndex += topVideos.length;
      audioIndex += topVideos.length;
    } catch (error) {
      console.error("Error processing your request:", error);
      m.reply('Error processing your request.');
      await m.React("❌");
    }
  } else if (selectedId) {
    const isAudio = selectedId.startsWith('🎵audio_');
    const key = parseInt(selectedId.replace(isAudio ? '🎵audio_' : '🎦video_', ''));
    const selectedVideo = videoMap.get(key);

    if (selectedVideo) {
      try {
        const videoUrl = `https://www.youtube.com/watch?v=${selectedVideo.videoId}`;
        const apiUrl = `https://matrix-serverless-api.vercel.app/api/ytdl?url=${encodeURIComponent(videoUrl)}&type=${isAudio ? 'audio' : 'video'}`;

        const response = await fetch(apiUrl);
        const mediaData = await response.json();

        if (response.ok) {
          const mediaUrl = isAudio ? mediaData.audioURL : mediaData.videoURL;
          const buffer = await fetch(mediaUrl).then(res => res.buffer());

          if (isAudio) {
            const doc = {
              audio: buffer,
              mimetype: 'audio/mpeg',
              ptt: false,
              fileName: `${selectedVideo.title}.mp3`,
              contextInfo: {
                mentionedJid: [m.sender],
                externalAdReply: {
                  title: "↺ |◁   II   ▷|   ♡",
                  body: `Now playing: ${selectedVideo.title}`,
                  thumbnailUrl: selectedVideo.thumbnail,
                  sourceUrl: videoUrl,
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            };
            await Matrix.sendMessage(m.from, doc, { quoted: m });
          } else {
            await Matrix.sendMessage(m.from,
              {
                video: buffer,
                mimetype: 'video/mp4',
                caption: `> *TITLE:* ${selectedVideo.title}\n> *AUTHOR:* ${selectedVideo.author.name}\n> *DURATION:* ${selectedVideo.timestamp}\n\n> *POWERED BY Ethix-MD*`,
              },
              { quoted: m }
            );
          }
        } else {
          m.reply('Error fetching media.');
          await m.React("❌");
        }
      } catch (error) {
        console.error("Error fetching video details:", error);
        m.reply('Error fetching video details.');
        await m.React("❌");
      }
    }
  }
};

export default song;
