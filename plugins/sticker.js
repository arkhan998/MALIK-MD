const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config.cjs');

async function convertToWebP(mediaPath, isVideo) {
    return new Promise((resolve, reject) => {
        const outputPath = `${mediaPath}.webp`;
        const ffmpegCommand = isVideo
            ? `ffmpeg -i "${mediaPath}" -vcodec libwebp -vf "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0" -loop 0 -ss 00:00:00 -t 00:00:09 -preset default -an -vsync 0 -s 512:512 "${outputPath}"`
            : `ffmpeg -i "${mediaPath}" -vcodec libwebp -vf "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease, pad=320:320:-1:-1:color=white@0.0" -loop 0 -preset default -an -vsync 0 -s 512:512 "${outputPath}"`;

        exec(ffmpegCommand, (error) => {
            if (error) {
                console.error('FFmpeg error:', error);
                return reject(error);
            }
            resolve(outputPath);
        });
    });
}

module.exports = {
    name: 'sticker',
    description: 'Creates a sticker from an image or video.',
    aliases: ['s'],
    execute: async (sock, m) => {
        const messageType = Object.keys(m.message)[0];
        const isReplied = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const repliedMessageType = isReplied ? Object.keys(m.message.extendedTextMessage.contextInfo.quotedMessage)[0] : null;

        let stream;
        let isVideo = false;

        const mediaMessage = isReplied 
            ? m.message.extendedTextMessage.contextInfo.quotedMessage 
            : m.message;
        
        const mediaType = isReplied ? repliedMessageType : messageType;

        if (mediaType === 'imageMessage') {
            stream = await downloadContentFromMessage(mediaMessage.imageMessage, 'image');
        } else if (mediaType === 'videoMessage') {
            stream = await downloadContentFromMessage(mediaMessage.videoMessage, 'video');
            isVideo = true;
        } else {
            return sock.sendMessage(m.key.remoteJid, { text: 'Please reply to an image or video to create a sticker.' }, { quoted: m });
        }

        const mediaPath = path.join(__dirname, `temp_media_${m.key.id}`);
        const writeStream = fs.createWriteStream(mediaPath);
        
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        fs.writeFileSync(mediaPath, buffer);

        try {
            const webpPath = await convertToWebP(mediaPath, isVideo);
            await sock.sendMessage(m.key.remoteJid, {
                sticker: { url: webpPath },
                pack: config.OWNER_NAME,
                author: 'MALIK-MD'
            }, { quoted: m });

            fs.unlinkSync(mediaPath);
            fs.unlinkSync(webpPath);
        } catch (error) {
            sock.sendMessage(m.key.remoteJid, { text: 'Failed to create sticker.' }, { quoted: m });
            fs.unlinkSync(mediaPath); 
        }
    },
};
