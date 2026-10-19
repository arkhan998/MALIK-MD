const presence = require('../lib/presence.js');

module.exports = {
    name: 'autorecording',
    aliases: ['arcd'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const sub = (args[0] || '').toLowerCase();

            if (sub === 'on') {
                presence.state.recording = true;
                return sock.sendMessage(jid, { text: '✅ *Auto-Recording ON* 🎙️\n\nAb har command ka jawab dene se pehle "recording voice..." dikhega.' }, { quoted: m });
            }
            if (sub === 'off') {
                presence.state.recording = false;
                return sock.sendMessage(jid, { text: '❌ *Auto-Recording OFF*' }, { quoted: m });
            }
            return sock.sendMessage(jid, { text: '🎙️ *Auto-Recording* (sirf owner)\n\n*.autorecording on* — jawab se pehle recording dikhega\n*.autorecording off* — band' }, { quoted: m });
        } catch (e) { console.error('autorecording error:', e.message); }
    }
};
