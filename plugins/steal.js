const { Sticker, StickerTypes } = require('wa-sticker-formatter');

// ======================================================
// STEAL — kisi ke sticker par reply karke .steal likho:
// wahi sticker MALIK-MD ke naam/pack ke sath tumhara
// ban kar wapis aa jata hai. Static + animated dono.
// ======================================================

module.exports = {
    name: 'steal',
    alias: ['stickersteal', 'churao', 'mystick'],
    exec: async (sock, m) => {
        const jid = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.stickerMessage) {
            return sock.sendMessage(jid, { text: '🕵️ *Sticker Steal*\n\nKisi ke *sticker par reply* karke `.steal` likho — wahi sticker MALIK-MD ke naam se tumhara ban jayega.' }, { quoted: m });
        }
        try {
            const buf = await sock.downloadMediaMessage({ key: m.key, message: m.message.extendedTextMessage.contextInfo.quotedMessage });
            if (!buf || !buf.length) throw new Error('empty media');
            try {
                const st = new Sticker(buf, { pack: 'MALIK-MD', author: 'By Malik', type: StickerTypes.FULL, quality: 80 });
                return sock.sendMessage(jid, await st.toMessage(), { quoted: m });
            } catch (e) {
                // formatter fail ho to asal sticker hi bhej do
                return sock.sendMessage(jid, { sticker: buf }, { quoted: m });
            }
        } catch (e) {
            console.error('steal error:', e.message);
            return sock.sendMessage(jid, { text: '❌ Sticker download nahi ho saka. Dobara try karo.' }, { quoted: m });
        }
    }
};
