const { Sticker, StickerTypes } = require('wa-sticker-formatter');

const command = {
    name: "sticker",
    alias: ["s"],
    exec: async (sock, m, args) => {
        try {
            const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMessage || (!quotedMessage.imageMessage && !quotedMessage.videoMessage)) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please reply to an image or a short video to create a sticker." }, { quoted: m });
            }

            // Sticker ka naam aur author set karna
            const [packname, author] = (args.join(' ') || "MALIK-MD|By Malik").split('|');

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎨 Creating your sticker..." }, { quoted: m });

            const media = await sock.downloadMediaMessage({ key: m.key, message: m.message.extendedTextMessage.contextInfo.quotedMessage });
            
            const sticker = new Sticker(media, {
                pack: packname,
                author: author,
                type: StickerTypes.FULL,
                quality: 50
            });

            await sock.sendMessage(m.key.remoteJid, await sticker.toMessage(), { quoted: m });
            await sock.sendMessage(m.key.remoteJid, { delete: waitingMsg.key });

        } catch (error) {
            console.error("Error in sticker command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to create sticker. The video might be too long (max 10 seconds)." }, { quoted: m });
        }
    }
};

module.exports = command;
