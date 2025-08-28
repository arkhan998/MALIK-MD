// plugins/help.js
const config = require('../config');

// We need to get the commands map from the handler, which is a bit tricky.
// A better approach would be to pass the commands map to the execute function.
// For now, we'll create a simple static help message.

module.exports = {
    name: 'help',
    description: 'Shows a list of available commands.',
    isAdmin: false,
    execute: async ({ sock, msg }) => {
        const remoteJid = msg.key.remoteJid;

        // In a more advanced setup, you would dynamically generate this list.
        const helpText = `
*${config.bot_name} Commands*

- *${config.prefix}ping*: Check if the bot is responsive.
- *${config.prefix}help*: Show this help message.

More commands coming soon!
        `;

        await sock.sendMessage(remoteJid, { text: helpText.trim() });
    }
};
