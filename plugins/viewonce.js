const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// ======================================================
// VIEW-ONCE DOWNLOADER — .vv (view-once message ka reply)
// ======================================================

module.exports = {
    name: 'viewonce',
    aliases: ['vv'],
    exec: async (sock, m, args) => {
        try {
            const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMessage) {
                return sock.sendMessage(m.key.remoteJid, { text: '❌ Reply to a view-once photo/video/audio to recover it.' }, { quoted: m });
            }

            // viewOnceMessage / viewOnceMessageV2 ko unwrap karo
            const unwrapped = quotedMessage.viewOnceMessage?.message
                || quotedMessage.viewOnceMessageV2?.message
                || quotedMessage.viewOnceMessageV2Extension?.message
                || null;

            if (!unwrapped || (!unwrapped.imageMessage && !unwrapped.videoMessage && !unwrapped.audioMessage)) {
                return sock.sendMessage(m.key.remoteJid, { text: '❌ Ye view-once message nahi lag raha. View-once photo/video par reply karke try karo.' }, { quoted: m });
            }

            // v7 wrapper pattern (describe.js jaisa)
            const buf = await downloadMediaMessage({ key: m.key, message: quotedMessage }, 'buffer', {});

            const caption = '👁️ *View-once recovered*';
            if (unwrapped.imageMessage) {
                await sock.sendMessage(m.key.remoteJid, { image: buf, caption }, { quoted: m });
            } else if (unwrapped.videoMessage) {
                await sock.sendMessage(m.key.remoteJid, { video: buf, caption }, { quoted: m });
            } else if (unwrapped.audioMessage) {
                await sock.sendMessage(m.key.remoteJid, { audio: buf, mimetype: 'audio/mpeg', ptt: !!unwrapped.audioMessage.ptt }, { quoted: m });
                await sock.sendMessage(m.key.remoteJid, { text: caption }, { quoted: m });
            }
        } catch (e) {
            console.error('viewonce error:', e.message);
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Could not recover the view-once media. (Shayad expire ho gaya ya download fail hua.)' }, { quoted: m });
        }
    }
};
