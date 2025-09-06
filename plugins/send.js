const config = require('../config.js');

const command = {
    name: "send",
    alias: ["sendme", "save"],
    exec: async (sock, m, args) => {
        try {
            const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMessage) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please reply to a message you want to save." }, { quoted: m });
            }

            // Media download karna
            const mediaBuffer = await sock.downloadMediaMessage(quotedMessage);
            let messageContent = {};

            // Media ki qisam check karna
            if (quotedMessage.imageMessage) {
                messageContent = {
                    image: mediaBuffer,
                    caption: quotedMessage.imageMessage.caption || ''
                };
            } else if (quotedMessage.videoMessage) {
                messageContent = {
                    video: mediaBuffer,
                    caption: quotedMessage.videoMessage.caption || ''
                };
            } else if (quotedMessage.audioMessage) {
                messageContent = {
                    audio: mediaBuffer,
                    mimetype: 'audio/mpeg',
                    ptt: quotedMessage.audioMessage.ptt || false
                };
            } else {
                return sock.sendMessage(m.key.remoteJid, { text: "❌ Sorry, I can only save images, videos, and audio messages." }, { quoted: m });
            }

            // User ke private chat ka JID hasil karna
            const senderJid = m.key.participant || m.key.remoteJid;

            // Media ko user ke private chat me bhejna
            await sock.sendMessage(senderJid, messageContent);
            
            // User ko tasdeeqi paigham bhejna
            await sock.sendMessage(m.key.remoteJid, { text: "✅ Media has been sent to your private chat (Saved Messages)." }, { quoted: m });

        } catch (error) {
            console.error("Error in send/save command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ An error occurred: ${error.message}` }, { quoted: m });
        }
    }
};

module.exports = command;
