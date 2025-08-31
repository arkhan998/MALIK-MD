const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');

// Load all commands from the plugins folder
const commands = new Map();
const pluginsDir = path.join(__dirname, 'plugins');

try {
    const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of pluginFiles) {
        const command = require(path.join(pluginsDir, file));
        if (command.name && typeof command.exec === 'function') {
            commands.set(command.name, command);
            if (command.alias) {
                command.alias.forEach(alias => commands.set(alias, command));
            }
        }
    }
    console.log(`✅ Found ${commands.size} commands.`);
} catch (error) {
    console.error("Error loading plugins:", error);
}

// --- Helper function to check for subscription ---
const hasAccess = (senderJid) => {
    const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
    if (senderJid === ownerJid) return true; // Owner always has access

    const subscribedUsers = config.SUBSCRIBED_USERS.split(',').map(num => `${num.trim()}@s.whatsapp.net`);
    return subscribedUsers.includes(senderJid);
};


const handler = async (sock, m) => {
    try {
        const messageType = Object.keys(m.message)[0];
        if (messageType === 'protocolMessage' || messageType === 'senderKeyDistributionMessage') return;

        const senderJid = m.key.remoteJid.endsWith('@g.us') ? m.key.participant : m.key.remoteJid;
        
        // --- SUBSCRIPTION CHECK ---
        // If mode is not public, check if the user has access.
        if (config.MODE !== 'public' && !hasAccess(senderJid)) {
            return await sock.sendMessage(m.key.remoteJid, { text: "⚠️ *Access Denied*\n\nYou are not a subscribed user. Please contact the owner to get access." }, { quoted: m });
        }
        // --- END OF SUBSCRIPTION CHECK ---


        // Determine message body (for text commands and button clicks)
        let body = "";
        let commandName = "";
        let args = [];
        const prefix = '!';

        // Check for button click response
        if (m.message.templateButtonReplyMessage) {
            body = m.message.templateButtonReplyMessage.selectedId;
        } 
        // Check for regular text messages
        else {
            body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || "";
        }

        if (!body.startsWith(prefix)) return;

        args = body.slice(prefix.length).trim().split(/ +/);
        commandName = args.shift().toLowerCase();
        
        const command = commands.get(commandName);

        if (!command) return;

        // --- Owner Only Command Check ---
        const isOwner = senderJid === `${config.OWNER_NUMBER}@s.whatsapp.net`;
        if (command.ownerOnly && !isOwner) {
             return await sock.sendMessage(m.key.remoteJid, { text: "⚠️ *Owner Command*\n\nThis command can only be used by the bot owner." }, { quoted: m });
        }

        // Execute command
        if (typeof command.exec === 'function') {
            await command.exec(sock, m, args);
        } else {
             console.error(`Command ${commandName} is missing the 'exec' function.`);
        }

    } catch (error) {
        console.error("Error in handler:", error);
    }
};

module.exports = { handler, hasAccess };

