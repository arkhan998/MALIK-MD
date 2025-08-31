import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import botEvents from './lib/events.js';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = new Map();

// Plugins folder se saari commands ko load karne ka function
async function loadCommands() {
    const pluginsPath = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsPath)) {
        console.error(chalk.red(`❌ Plugins directory not found at: ${pluginsPath}`));
        return;
    }
    const commandFiles = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            // Use dynamic import for ESM with a file URL
            const commandModule = await import (path.join('file://', pluginsPath, file));
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
        if (!body.startsWith(config.prefix)) return;

        const args = body.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const sender = m.key.remoteJid;
        
        // Owner aur Subscribed Users ka check
        const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);
        const isSubscribed = config.SUBSCRIBED_USERS && config.SUBSCRIBED_USERS.some(user => sender.startsWith(user));

        // Private mode me access check karna
        if (config.MODE === 'private' && !isOwner && !isSubscribed) {
            return sock.sendMessage(sender, {
                text: "❌ *Access Denied!*\n\nYou are not a subscribed user. Please contact the owner to get access."
            });
        }

        const command = commands.get(commandName);

        if (command) {
            // Auto-actions
            if (config.AUTO_TYPING) await sock.sendPresenceUpdate('composing', sender);
            if (config.AUTO_READ) await sock.readMessages([m.key]);

            await command.exec(sock, m, args);

            if (config.AUTO_TYPING) await sock.sendPresenceUpdate('paused', sender);

        }

    } catch (error) {
        console.error(chalk.red(`❌ Error in handler:`), error);
    }
});

console.log(chalk.magenta("🔧 Handler is listening for events..."));

