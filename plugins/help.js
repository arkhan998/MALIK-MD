const os = require('os');
const fs = require('fs');
const path = require('path');
const config = require('../config.js');
const moment = require('moment-timezone');

// RAM aur Uptime ko format karne ke liye helper functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    function pad(s) {
        return (s < 10 ? '0' : '') + s;
    }
    const hours = Math.floor(seconds / (60 * 60));
    const minutes = Math.floor(seconds % (60 * 60) / 60);
    const secs = Math.floor(seconds % 60);
    return `${pad(hours)}h ${pad(minutes)}m ${pad(secs)}s`;
}


const command = {
    name: "help",
    alias: ["h", "?"],
    exec: async (sock, m, args) => {
        try {
            const imagePath = path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const isOwner = config.OWNER_NUMBER && m.key.remoteJid.startsWith(config.OWNER_NUMBER);

            // System Information
            const totalMemory = formatBytes(os.totalmem());
            const freeMemory = formatBytes(os.freemem());
            const uptime = formatUptime(process.uptime());
            
            // Time-based Greeting
            const time = moment.tz("Asia/Karachi").format("HH");
            let greeting = "Hello";
            if (time < 12) greeting = "Good Morning ☀️";
            else if (time < 18) greeting = "Good Afternoon 🌤️";
            else greeting = "Good Evening 🌙";

            const caption = `*${greeting}, ${m.pushName}! 👋*\n\n` +
                          `╭─────────────━┈⊷\n` +
                          `│🤖 Bot Name: *MALIK-MD*\n` +
                          `│👨‍💻 Owner: *${config.OWNER_NAME}*\n` +
                          `│🛡️ Mode: *${config.MODE}*\n` +
                          `│⚙️ Prefix: *[ ${config.prefix} ]*\n` +
                          `│🕒 Uptime: *${uptime}*\n` +
                          `│💻 Platform: *${os.platform()}*\n` +
                          `│📊 RAM: *${freeMemory} / ${totalMemory}*\n` +
                          `╰─────────────━┈⊷\n\n` +
                          `I am your personal AI assistant. Commands dekhne ke liye:\n\n` +
                          `📋 *.menu* — Full Menu\n` +
                          `🤖 *.ai_menu* — AI Commands\n` +
                          `🛠️ *.general_menu* — Tools\n` +
                          `👑 *.owner_menu* — Owner Panel`;

            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                caption: caption,
                footer: `© Powered by MALIK-MD`
            }, { quoted: m });

        } catch (e) {
            console.error('Help Command Error:', e);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Help menu encountered an error.` }, { quoted: m });
        }
    }
};

module.exports = command;
