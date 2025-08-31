const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const botEvents = require('./lib/events.js'); // Naya Event Emitter import kiya gaya hai

const commands = new Map();

// Plugins folder se saari commands ko load karne ka function
function loadCommands() {
    const pluginsPath = path.join(__dirname, 'plugins');
    const commandFiles = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const command = require(path.join(pluginsPath, file));
            if (command.name) {
                commands.set(command.name, command);
                // Command ke aliases (doosre naam) bhi load karna
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => commands.set(alias, command));
                }
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error loading plugin ${file}:`), error);
        }
    }
    console.log(chalk.green(`✅ Found ${commands.size / 2} commands.`)); // Divide by 2 to account for aliases
}

// Initial command load
loadCommands();


// "new-message" event ko sun'na
botEvents.on('new-message', async ({ sock, m, config }) => {
    try {
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
        const args = body.slice(1).trim().split(/ +/).slice(1);
        const commandName = body.split(/ +/)[0].slice(1).toLowerCase();
        const sender = m.key.remoteJid;
        const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);

        // Auto-actions (typing, recording, etc.)
        if (config.AUTO_TYPING) await sock.sendPresenceUpdate('composing', sender);
        if (config.AUTO_RECORDING) await sock.sendPresenceUpdate('recording', sender);
        if (config.AUTO_READ) await sock.readMessages([m.key]);

        // Command prefix check
        if (!body.startsWith(config.prefix)) return;

        // Subscription check
        if (config.MODE === 'private' && !isOwner) {
            const isSubscribed = config.SUBSCRIBED_USERS && config.SUBSCRIBED_USERS.some(user => sender.startsWith(user));
            if (!isSubscribed) {
                return sock.sendMessage(sender, {
                    text: "❌ *Access Denied!*\n\nYou are not a subscribed user. Please contact the owner to get access."
                });
            }
        }

        const command = commands.get(commandName);

        if (command) {
            await command.exec(sock, m, args, config);
        }

    } catch (error) {
        console.error(chalk.red(`❌ Error in handler:`), error);
    }
});

console.log(chalk.magenta("🔧 Handler is listening for events..."));

