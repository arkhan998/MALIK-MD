const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');

// This function will be exported and called by index.js
const handleMessage = async (sock, m) => {
    // --- Start of Original Handler Logic ---
    const commands = new Map();
    const pluginsDir = path.join(__dirname, 'plugins');

    try {
        const commandFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            try {
                const command = require(path.join(pluginsDir, file));
                commands.set(command.name, command);
                if (command.alias) {
                    command.alias.forEach(alias => commands.set(alias, command));
                }
            } catch (error) {
                console.error(`Error loading plugin ${file}:`, error);
            }
        }
    } catch (error) {
        console.error("Error reading plugins directory:", error);
    }
    
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
    if (command) {
        try {
            await command.exec(sock, m, args);
        } catch (error) {
            console.error(`Error executing command ${command.name}:`, error);
            await sock.sendMessage(m.key.remoteJid, { text: 'An error occurred while executing the command.' }, { quoted: m });
        }
    }
    // --- End of Original Handler Logic ---
};

// Export the main function
module.exports = handleMessage;

