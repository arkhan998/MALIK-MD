const axios = require('axios');
const config = require('../config.cjs');

const command = {
    name: "dl",
    aliases: ["download", "get", "fetch"],
    exec: async (sock, m, args) => {
        try {
            const url = args[0];
            if (!url) {
                return sock.sendMessage(m.key.remoteJid, {
                    text: "🔗 Please provide a link to download.\n\n*Example:*\n!dl <tiktok_video_url>"
                });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🔎 Searching for media, please wait..." });

            const apiUrl = `https://batgpt.vercel.app/api/alldl?url=${encodeURIComponent(url)}`;
            const { data } = await axios.get(apiUrl);

            if (data.status === "true" && data.result && data.result.length > 0) {
                const media = data.result[0];
                const title = media.title || "Downloaded Media";
                const thumbnail = media.thumbnail;

                // Download options ke liye buttons banayein
                const buttons = [];
                if (media.video) {
                    buttons.push({
                        buttonId: `${config.prefix}send_video ${url}`, // Original URL ko button ke sath bhejna
                        buttonText: { displayText: '🎬 Download Video' },
                        type: 1
                    });
                }
                if (media.audio) {
                    buttons.push({
                        buttonId: `${config.prefix}send_audio ${url}`, // Original URL ko button ke sath bhejna
                        buttonText: { displayText: '🎵 Download Audio (MP3)' },
                        type: 1
                    });
                }

                if (buttons.length === 0) {
                    return sock.sendMessage(m.key.remoteJid, { text: "Could not find any downloadable media from this link.", edit: waitingMsg.key });
                }
                
                // Thumbnail ke sath options user ko bhejna
                const buttonMessage = {
                    image: { url: thumbnail },
                    caption: `*${title}*\n\nPlease select a format to download:`,
                    footer: `Powered by ${config.OWNER_NAME}`,
                    buttons: buttons,
                    headerType: 4
                };

                await sock.sendMessage(m.key.remoteJid, buttonMessage);
                await sock.sendMessage(m.key.remoteJid, { delete: waitingMsg.key }); // "Searching..." message ko delete karna

            } else {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: "❌ Sorry, I couldn't find any media at that link. The URL might be incorrect or unsupported.",
                    edit: waitingMsg.key 
                });
            }
        } catch (error) {
            console.error("Error in downloader command:", error);
            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ An error occurred with the download service. Please try again later."
            });
        }
    },
};

module.exports = command;

