const presence = require('../lib/presence.js');

module.exports = {
    name: 'autotyping',
    aliases: ['at'],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const sub = (args[0] || '').toLowerCase();

            if (sub === 'on') {
                presence.state.typing = true;
                return sock.sendMessage(jid, { text: '✅ *Auto-Typing ON* ⌨️\n\nAb har command ka jawab dene se pehle "typing..." dikhega.' }, { quoted: m });
            }
            if (sub === 'off') {
                presence.state.typing = false;
                return sock.sendMessage(jid, { text: '❌ *Auto-Typing OFF*' }, { quoted: m });
            }
            if (sub === 'status') {
                return sock.sendMessage(jid, { text: `ℹ️ *Auto-Typing:* ${presence.state.typing ? 'ON ⌨️' : 'OFF'}\nℹ️ *Auto-Recording:* ${presence.state.recording ? 'ON 🎙️' : 'OFF'}` }, { quoted: m });
            }
            return sock.sendMessage(jid, { text: '⌨️ *Auto-Typing*\n\n*.autotyping on* — jawab se pehle typing dikhega\n*.autotyping off* — band\n*.autotyping status* — check karo' }, { quoted: m });
        } catch (e) { console.error('autotyping error:', e.message); }
    }
};
