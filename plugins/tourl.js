const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const command = {
    name: "tourl",
    alias: ["upload", "link"],
    exec: async (sock, m, args) => {
        try {
            const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMessage || (!quotedMessage.imageMessage && !quotedMessage.videoMessage)) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please reply to an image or video to get its link." }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📥 Uploading your file, please wait..." }, { quoted: m });

            const mediaBuffer = await sock.downloadMediaMessage({ key: m.key, message: quotedMessage });

            // File ko upload karne ke liye FormData tayyar karna
            const form = new FormData();
            form.append('file', mediaBuffer, {
                filename: `malik-md-upload.${quotedMessage.imageMessage ? 'jpeg' : 'mp4'}`,
                contentType: quotedMessage.imageMessage ? 'image/jpeg' : 'video/mp4',
            });

            // File ko telegra.ph par upload karna
            const { data } = await axios.post('https://telegra.ph/upload', form, {
                headers: form.getHeaders(),
            });

            if (!data || !data[0] || !data[0].src) {
                return sock.sendMessage(m.key.remoteJid, { text: "Sorry, I failed to upload the file.", edit: waitingMsg.key }, { quoted: m });
            }
            
            // Link hasil karna
            const fileUrl = `https://telegra.ph${data[0].src}`;

            const message = `*✅ File Uploaded Successfully!*\n\n` +
                            `*🔗 Your permanent link is:*\n${fileUrl}\n\n` +
                            `*Powered by MALIK-MD*`;

            await sock.sendMessage(m.key.remoteJid, { text: message, edit: waitingMsg.key }, { quoted: m });

        } catch (error) {
            console.error("Error in tourl command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ An error occurred while uploading the file." }, { quoted: m });
        }
    }
};

module.exports = command;
 
