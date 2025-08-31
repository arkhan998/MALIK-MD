const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');

// Helper function to upload media to a temporary hosting service
async function uploadToTmpFiles(buffer) {
    const form = new FormData();
    form.append('file', buffer, { filename: 'sticker_media' });
    const { data } = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: { ...form.getHeaders() }
    });
    // The URL from tmpfiles.org is in the format: "https://tmpfiles.org/dl/{id}/{filename}"
    // We need the direct file URL which is usually: "https://tmpfiles.org/uploads/{filename_on_server}"
    // The API response gives us the direct download URL.
    return data.data.url;
}

module.exports = {
    name: "sticker",
    alias: ["s"],
    exec: async (sock, m) => {
        try {
            const messageType = Object.keys(m.message)[0];
            const isQuoted = messageType === 'extendedTextMessage' && m.message.extendedTextMessage.contextInfo?.quotedMessage;
            
            let mediaMessage;
            if (m.message.imageMessage || m.message.videoMessage) {
                mediaMessage = m;
            } else if (isQuoted && (m.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage || m.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage)) {
                mediaMessage = { message: m.message.extendedTextMessage.contextInfo.quotedMessage, key: m.key };
            } else {
                return await sock.sendMessage(m.key.remoteJid, { text: "Please reply to an image or video, or send one with the command to create a sticker." }, { quoted: m });
            }

            // Let the user know the bot is working
            await sock.sendMessage(m.key.remoteJid, { text: "🎨 Creating your sticker..." }, { quoted: m });

            const mediaBuffer = await downloadMediaMessage(mediaMessage, 'buffer');

            // Upload media to get a direct URL
            const mediaUrl = await uploadToTmpFiles(mediaBuffer);

            // Use a public sticker API
            const stickerApiUrl = `https://api.itzpire.com/tools/sticker?url=${encodeURIComponent(mediaUrl)}`;
            
            const response = await axios.get(stickerApiUrl, { responseType: 'arraybuffer' });

            if (response.status === 200) {
                await sock.sendMessage(
                    m.key.remoteJid,
                    {
                        sticker: response.data
                    },
                    { quoted: m }
                );
            } else {
                throw new Error("API failed to create sticker.");
            }

        } catch (error) {
            console.error("Error in sticker command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, I couldn't create the sticker. The media might be too large or unsupported." }, { quoted: m });
        }
    }
};

