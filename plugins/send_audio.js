// ======================================================
// SEND_AUDIO — .send_audio <link>
// (batgpt API mar chuki thi — ab .dl engine use hota hai)
// ======================================================
const dl = require('./dl.js');

const command = {
    name: "send_audio",
    exec: async (sock, m, args) => {
        if (!args[0]) {
            return sock.sendMessage(m.key.remoteJid, { text: "🎵 Usage: `.send_audio <link>`" }, { quoted: m });
        }
        return dl.exec(sock, m, [args[0], 'mp3']);
    },
};

module.exports = command;
