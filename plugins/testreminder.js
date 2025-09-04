const { generateReminderData } = require('../lib/reminder.js');
const config = require('../config.js');

const command = {
    name: "testreminder",
    ownerOnly: true,
    exec: async (sock, m, args) => {
        try {
            await sock.sendMessage(m.key.remoteJid, { text: "⏳ Generating and sending a test reminder to you..." }, { quoted: m });

            const reminderData = await generateReminderData();
            const jid = m.key.remoteJid;

            await sock.sendMessage(jid, { text: reminderData.textMessage });

            if (reminderData.audioUrl) {
                await sock.sendMessage(jid, { audio: { url: reminderData.audioUrl }, mimetype: 'audio/mpeg', ptt: true });
            }

            const botJid = sock.user.id.split(':')[0].split('@')[0];
            const botVCard = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + `FN:MALIK-MD Bot\n` + `ORG:Powered by ${config.OWNER_NAME};\n` + `TEL;type=CELL;type=VOICE;waid=${botJid}:${botJid}\n` + 'END:VCARD';
            
            await sock.sendMessage(jid, { contacts: { displayName: "MALIK-MD Bot", contacts: [{ vcard: botVCard }] } });

        } catch (error) {
            console.error("Error in testreminder command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ An error occurred while generating the test reminder." }, { quoted: m });
        }
    }
};

module.exports = command;

