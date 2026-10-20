// ======================================================
// SEND_VIDEO — .send_video <link>
// (batgpt API mar chuki thi — ab .dl engine use hota hai)
// ======================================================
const dl = require('./dl.js');

const command = {
    name: "send_video",
    exec: async (sock, m, args) => {
        if (!args[0]) {
            return sock.sendMessage(m.key.remoteJid, { text: "📥 Usage: `.send_video <link>`" }, { quoted: m });
        }
        return dl.exec(sock, m, [args[0]]);
    },
};

module.exports = command;
