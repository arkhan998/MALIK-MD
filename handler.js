import fs from 'fs';
import path from 'path';
import {
    fileURLToPath
} from 'url';
import chalk from 'chalk';
import botEvents from './lib/events.js';
import config from './config.js';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const commands = new Map();

// Plugins folder se saari commands ko load karne ka function
async function loadCommands() {
    const pluginsPath = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsPath)) {
        console.log(chalk.yellow("Plugins directory not found, skipping command loading."));
        return;
    }
    const commandFiles = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            // Use dynamic import for ESM with a file URL
            const commandModule = await
            import (path.join('file://', pluginsPath, file));
            const command = commandModule.default;
            if (command && command.name) {
                commands.set(command.name, command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => commands.set(alias, command));
                }
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error loading plugin ${file}:`), error);
        }
    }
    console.log(chalk.green(`✅ Found and loaded ${commands.size} commands/aliases.`));
}

// Initial command load
loadCommands();

// "new-message" event ko sun'na
botEvents.on('new-message', async ({ sock, m }) => {
    try {
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.buttonsResponseMessage?.selectedButtonId || "";

        // Owner aur Subscribed Users ka check (Groups ke liye)
        const isGroup = m.key.remoteJid.endsWith('@g.us');
        const sender = isGroup ? m.key.participant : m.key.remoteJid;
        const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);

        // Apne hi messages ko ignore karna (lekin owner ke nahi)
        if (!m.message || (m.key.fromMe && !isOwner)) {
            return;
        }

        if (!body.startsWith(config.prefix)) return;

        const args = body.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const isSubscribed = config.SUBSCRIBED_USERS && config.SUBSCRIBED_USERS.some(user => sender.startsWith(user));

        // Private mode me access check karna
        if (config.MODE === 'private' && !isOwner && !isSubscribed) {
            return sock.sendMessage(m.key.remoteJid, {
                text: "❌ *Access Denied!*\n\nYou are not a subscribed user. Please contact the owner to get access."
            });
        }

        const command = commands.get(commandName);
        if (command) {
            await command.exec(sock, m, args);
        }
    } catch (error) {
        console.error(chalk.red(`❌ Error in handler:`), error);
    }
});

console.log(chalk.magenta("🔧 Handler is listening for events..."));

