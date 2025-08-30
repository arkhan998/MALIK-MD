const { readdirSync } = require('fs');
const path = require('path');
const config = require('./config.cjs');

const commands = new Map();
const pluginsDir = path.join(process.cwd(), 'plugins');

// Dynamically load all command files from the 'plugins' directory
try {
    const commandFiles = readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(pluginsDir, file));
        if (command && command.name) {
            commands.set(command.name, command);
            console.log(`Loaded command: ${command.name}`);
        }
    }
} catch (error) {
    console.error("Error loading plugins:", error);
}

// Helper function to check if the sender is the owner
const isOwner = (m) => {
    // Check for both private and group messages
    const senderJid = m.key.remoteJid.endsWith('@g.us') ? m.key.participant : m.key.remoteJid;
    return config.owner_jid === senderJid;
};


const handler = async (sock, m, config) => {
    if (!m || !m.message) return;
    
    const sender = m.key.remoteJid;

    // --- Auto Features ---
    if (config.AUTO_READ) {
        await sock.readMessages([m.key]);
    }
    if (config.AUTO_TYPING) {
        await sock.sendPresenceUpdate('composing', sender);
    }
    if (config.AUTO_RECORDING) {
        await sock.sendPresenceUpdate('recording', sender);
    }

    const messageText = m.message.conversation || m.message.extendedTextMessage?.text || '';

    if (!messageText.startsWith(config.prefix)) {
        return;
    }
    
    // --- Mode Check (Public/Private) ---
    if (config.MODE === 'private' && !isOwner(m)) {
        console.log(`Blocked command from non-owner [${sender}] in private mode.`);
        return;
    }

    const args = messageText.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);

    if (!command) {
        return;
    }

    try {
        await command.execute({ sock, m, args, config, commands });
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        sock.sendMessage(m.key.remoteJid, { text: 'An error occurred while executing this command.' }, { quoted: m });
    }
};

module.exports = { handler };

