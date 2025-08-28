// plugins/ping.js

module.exports = {
    name: 'ping',
    description: 'Check if the bot is alive.',
    isAdmin: false, // Set to true if only the owner can use it
    execute: async ({ sock, msg }) => {
        // The JID (Jaber ID) of the chat where the message was sent
        const remoteJid = msg.key.remoteJid;

        // Reply to the message
        await sock.sendMessage(remoteJid, { text: 'Pong!' }, { quoted: msg });
    }
};
