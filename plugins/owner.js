const config = require('../config.cjs');

module.exports = {
    name: 'owner',
    description: 'Sends the owner\'s contact card.',
    aliases: ['creator'],
    execute: async (sock, m) => {
        const ownerVCard = 
            'BEGIN:VCARD\n' +
            'VERSION:3.0\n' +
            `FN:${config.OWNER_NAME}\n` +
            `ORG:${config.OWNER_NAME}'s Bot;\n` +
            `TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER}:+${config.OWNER_NUMBER}\n` +
            'END:VCARD';

        await sock.sendMessage(
            m.key.remoteJid,
            {
                contacts: {
                    displayName: config.OWNER_NAME,
                    contacts: [{ vcard: ownerVCard }]
                }
            },
            { quoted: m }
        );
    },
};
