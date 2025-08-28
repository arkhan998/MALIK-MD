// plugins/menu.js

const config = require('../config');
const { performance } = require('perf_hooks');

// Function to format uptime
function formatUptime(uptime) {
    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const hours = Math.floor((uptime / (60 * 60)) % 24);
    const days = Math.floor(uptime / (60 * 60 * 24));

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
    name: 'menu', // Command name
    description: 'Shows the main menu of the bot.',
    isAdmin: false,
    execute: async ({ sock, msg }) => {
        const remoteJid = msg.key.remoteJid;
        const startTime = performance.now(); // Start timing for ping

        // Get current date and time
        const now = new Date();
        const date = now.toLocaleDateString('en-GB'); // Format: DD/MM/YYYY
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // Calculate uptime (process.uptime() returns seconds)
        const uptime = formatUptime(process.uptime());
        
        // End timing and calculate ping
        const endTime = performance.now();
        const ping = (endTime - startTime).toFixed(2);

        const menuText = `
╭─⬣「 *${config.bot_name}* 」⬣
│
├ ❖  *Owner* : Malik
├ ❖  *Bot Name* : ${config.bot_name}
├ ❖  *Uptime* : ${uptime}
├ ❖  *Ping* : ${ping} ms
├ ❖  *Date* : ${date}
├ ❖  *Time* : ${time}
│
├─⬣「 *GENERAL COMMANDS* 」
│
├ ≻ ${config.prefix}ping
├ ≻ ${config.prefix}status
├ ≻ ${config.prefix}owner
│
├─⬣「 *GROUP COMMANDS* 」
│
├ ≻ ${config.prefix}promote @user
├ ≻ ${config.prefix}demote @user
├ ≻ ${config.prefix}kick @user
├ ≻ ${config.prefix}add <number>
├ ≻ ${config.prefix}groupinfo
│
├─⬣「 *FUN COMMANDS* 」
│
├ ≻ ${config.prefix}sticker
├ ≻ ${config.prefix}joke
│
╰─⬣「 *Powered By Malik* 」`;

        // Send the menu with a context info for a professional look
        await sock.sendMessage(remoteJid, {
            text: menuText.trim(),
            contextInfo: {
                externalAdReply: {
                    title: config.bot_name,
                    body: "Select a command from the menu",
                    thumbnail: null, // You can add a URL to an image here
                    sourceUrl: "https://github.com/your-repo", // Optional: Link to your GitHub
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });
    }
};
