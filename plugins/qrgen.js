const fs = require('fs');
const path = require('path');

// ======================================================
// QR CODE — .qr koi bhi text ya link
// Customer ko bhejne ke liye ready QR image.
// ======================================================
module.exports = {
    name: 'qr',
    alias: ['qrcode'],
    ownerOnly: false,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const text = args.join(' ').trim();
        if (!text) return sock.sendMessage(jid, { text: '🔳 *QR Code Banana*\n\nFormat: `.qr https://tumhari-link.com`\nya `.qr koi bhi text`' }, { quoted: m });
        try {
            const url = 'https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=10&data=' + encodeURIComponent(text);
            await sock.sendMessage(jid, { image: { url }, caption: `🔳 *QR Code*\n📄 ${text}\n\n_© MALIK-MD_` }, { quoted: m });
        } catch (e) {
            console.error('qr error:', e.message);
            await sock.sendMessage(jid, { text: '❌ QR nahi ban saka. Dobara koshish karo.' }, { quoted: m });
        }
    }
};
