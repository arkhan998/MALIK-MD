const { performance } = require('perf_hooks');

module.exports = {
    name: 'ping',
    description: 'Checks the bot response speed.',
    category: 'General', // Added category for menu
    execute: async (sock, m, args) => {
        const startTime = performance.now();
        
        // A simple message to measure round-trip time
        const sentMsg = await sock.sendMessage(m.key.remoteJid, { text: 'Pinging...' }, { quoted: m });
        
        const endTime = performance.now();
        const responseTime = (endTime - startTime).toFixed(2);
        
        // Edit the message with the response time
        await sock.sendMessage(m.key.remoteJid, { 
            text: `*Pong!* 🏓\n*Response Time:* ${responseTime} ms`,
            edit: sentMsg.key 
        });
    },
};
