const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const botEvents = require('./lib/events.js');
const config = require('./config.js');

const commands = new Map();

async function loadCommands() {
    const pluginsPath = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsPath)) {
        console.log(chalk.yellow("Plugins directory not found, skipping command loading."));
        return;
    }
    const commandFiles = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const commandModule = require(path.join(pluginsPath, file));
            if (commandModule && commandModule.name) {
                commands.set(commandModule.name, commandModule);
                if (commandModule.alias && Array.isArray(commandModule.alias)) {
                    commandModule.alias.forEach(alias => commands.set(alias, commandModule));
                }
            }
        } catch (error)
        {
            console.error(chalk.red(`❌ Error loading plugin ${file}:`), error);
        }
    }
    console.log(chalk.green(`✅ Found and loaded ${commands.size} commands/aliases.`));
}

loadCommands();

botEvents.on('new-message', async ({ sock, m }) => {
    try {
        // YEH HAI FIX: Pehle check kar rahe hain ke 'm' ya 'm.message' khali to nahi
        if (!m || !m.message) {
            return;
        }

        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.buttonsResponseMessage?.selectedButtonId || "";
        
        if (!body) return;

        const isGroup = m.key.remoteJid.endsWith('@g.us');
        const sender = isGroup ? (m.key.participant || m.participant) : m.key.remoteJid;
        const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);

        if (m.key.fromMe && !isOwner) {
            return;
        }

        if (!body.startsWith(config.prefix)) return;

        const args = body.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = commands.get(commandName);
        if (command) {
            if (command.ownerOnly && !isOwner) {
                return sock.sendMessage(m.key.remoteJid, { text: "👑 This command can only be used by my owner, Malik Sahab." }, { quoted: m });
            }

            const isSubscribed = config.SUBSCRIBED_USERS && config.SUBSCRIBED_USERS.some(user => sender.startsWith(user));
            if (config.MODE === 'private' && !isOwner && !isSubscribed) {
                return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied!*\n\nYou are not a subscribed user." }, { quoted: m });
            }
            
            await command.exec(sock, m, args);
        }
    } catch (error) {
        console.error(chalk.red(`❌ Error in handler:`), error);
    }
});

console.log(chalk.magenta("🔧 Handler is listening for events..."));

