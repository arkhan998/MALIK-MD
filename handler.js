const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');

const commands = new Map();

// --- Command Loader ---
// We load commands only once when the file is required
const pluginsDir = path.join(__dirname, 'plugins');
try {
    const commandFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    console.log(`🔍 Found ${commandFiles.length} commands.`);

    for (const file of commandFiles) {
        try {
            const command = require(path.join(pluginsDir, file));
            // Check if the command is valid
            if (command.name && typeof command.exec === 'function') {
                commands.set(command.name, command);
                if (command.alias) {
                    command.alias.forEach(alias => commands.set(alias, command));
                }
            } else {
                console.error(`❌ Invalid command structure in ${file}. Skipping.`);
            }
        } catch (error) {
            console.error(`Error loading plugin ${file}:`, error);
        }
    }
} catch (error) {
    console.error("Error reading plugins directory:", error);
}

// --- Message Handler Function ---
const handleMessage = async (sock, m) => {
    try {
        // Auto actions (typing, recording, reading)
        if (config.AUTO_TYPING) await sock.sendPresenceUpdate('composing', m.key.remoteJid);
        if (config.AUTO_RECORDING) await sock.sendPresenceUpdate('recording', m.key.remoteJid);
        if (config.AUTO_READ) await sock.readMessages([m.key]);

        // Extracting command and arguments
        const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        if (!messageText.startsWith(config.prefix)) return;

        const args = messageText.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);

        // Private mode logic
        const isOwner = m.key.remoteJid.startsWith(config.OWNER_NUMBER);
        if (config.MODE === 'private' && !isOwner) {
            return;
        }

        // Command execution
        if (command && typeof command.exec === 'function') {
            await command.exec(sock, m, args);
        } else {
            // Optional: send a message if command is not found
            // await sock.sendMessage(m.key.remoteJid, { text: `Command not found: ${commandName}` }, { quoted: m });
        }
    } catch (error) {
        console.error(`Error in handleMessage for command:`, error);
        await sock.sendMessage(m.key.remoteJid, { text: 'An unexpected error occurred.' }, { quoted: m });
    }
};

module.exports = handleMessage;

