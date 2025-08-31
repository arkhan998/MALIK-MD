const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');

const commands = new Map();

// --- Command Loader ---
// This section reads all .js files from the /plugins directory at startup.
// It loads each valid command into the 'commands' Map for easy access.
const pluginsDir = path.join(__dirname, 'plugins');
try {
    const commandFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    console.log(`🔍 Found ${commandFiles.length} commands.`);

    for (const file of commandFiles) {
        try {
            const command = require(path.join(pluginsDir, file));
            // A valid command must have a name and an exec function.
            if (command.name && typeof command.exec === 'function') {
                commands.set(command.name, command);
                // If the command has aliases (short names), load them too.
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

// --- Main Message Handler Function ---
// This function is called by index.js for every new message.
const handleMessage = async (sock, m) => {
    try {
        // Perform auto-actions based on config settings.
        if (config.AUTO_TYPING) await sock.sendPresenceUpdate('composing', m.key.remoteJid);
        if (config.AUTO_RECORDING) await sock.sendPresenceUpdate('recording', m.key.remoteJid);
        if (config.AUTO_READ) await sock.readMessages([m.key]);

        // Determine the message content from various possible message types.
        const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.buttonsResponseMessage?.selectedButtonId || '';
        
        // Ignore messages that don't start with the command prefix.
        if (!messageText.startsWith(config.prefix)) return;

        // Parse the command and arguments from the message text.
        const args = messageText.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);

        // Enforce private mode: only the owner can use the bot.
        const isOwner = m.key.remoteJid.startsWith(config.OWNER_NUMBER);
        if (config.MODE === 'private' && !isOwner) {
            return; // Silently ignore commands from non-owners in private mode.
        }

        // Execute the command if it exists and is a valid function.
        if (command && typeof command.exec === 'function') {
            await command.exec(sock, m, args);
        }
    } catch (error) {
        // Catch any errors during command execution to prevent the bot from crashing.
        console.error(`Error executing command:`, error);
        await sock.sendMessage(m.key.remoteJid, { text: 'An unexpected error occurred while running the command.' }, { quoted: m });
    }
};

module.exports = handleMessage;

