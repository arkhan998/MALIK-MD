const config = require('../config.js');

module.exports = {
    name: 'join',
    aliases: ['group', 'channel', 'community', 'support', 'info'],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const text =
`╭━━━〔 🌐 *Join Our Community* 〕━━━┈⊷
┃★╭──────────────
┃★│ 👥 *WhatsApp Group*
┃★│ 👇 _Tap to join:_
┃★│ ${config.GROUP_LINK}
┃★╰──────────────
┃★╭──────────────
┃★│ 📢 *WhatsApp Channel*
┃★│ 👇 _Tap to follow:_
┃★│ ${config.CHANNEL_LINK}
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
> ✨ _Naye updates sab se pehle pane ke liye channel follow karo!_`;
            await sock.sendMessage(jid, { text }, { quoted: m });
        } catch (e) { console.error('join error:', e.message); }
    }
};
