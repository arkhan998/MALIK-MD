// ======================================================
// OLDDL — purana downloader (batgpt API mar chuki thi)
// Ab ye seedha .dl (yt-dlp + tikwm) ko delegate karta hai
// ======================================================
const dl = require('./dl.js');

const command = {
    name: "olddl",
    aliases: ["get", "fetch"],
    exec: async (sock, m, args) => {
        return dl.exec(sock, m, args);
    },
};

module.exports = command;
