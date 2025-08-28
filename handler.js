// handler.js

const fs = require('fs');
const path = require('path');
const config = require('./config');

// A Map to store all the commands from the plugins folder
const commands = new Map();

// Function to load all command plugins from the 'plugins' directory
function loadCommands() {
    const pluginsDir = path.join(__dirname, 'plugins');
    const commandFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const command = require(path.join(pluginsDir, file));
            if (command.name) {
                commands.set(command.name, command);
                console.log(`Loaded command: ${command.name}`);
            }
        } catch (error) {
            console.error(`Failed to load command from ${file}:`, error);
        }
    }
}

// Load commands on startup
loadCommands();

// The main handler function
async function commandHandler(sock, msg) {
    const messageType = Object.keys(msg.message)[0];
    const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    // Ignore messages that are not text or don't start with the prefix
    if (!messageText.startsWith(config.prefix)) {
        return;
    }

    // Parse the command and arguments
    const args = messageText.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Get the command from the Map
    const command = commands.get(commandName);

    if (!command) {
        // Optionally, you can send a "command not found" message
        // await sock.sendMessage(msg.key.remoteJid, { text: "Command not found." });
        return;
    }

    // Check for admin-only commands
    if (command.isAdmin && msg.key.remoteJid !== config.owner_jid) {
        await sock.sendMessage(msg.key.remoteJid, { text: "This command can only be used by the owner." });
        return;
    }

    try {
        // Execute the command
        await command.execute({ sock, msg, args });
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        await sock.sendMessage(msg.key.remoteJid, { text: `An error occurred while executing the command.` });
    }
}

module.exports = commandHandler;
