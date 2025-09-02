const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const botEvents = require('./lib/events.js');
const { config } = require('./config.js');

const commands = new Map();

// plugins folder se saare commands load karne ka function
function loadCommands() {
    const pluginsPath = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsPath)) {
        console.log(chalk.yellow("Plugins directory not found, skipping command loading."));
        return;
    }
    const commandFiles = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            // Har file ko require karke uske command ko load karna
            const command = require(path.join(pluginsPath, file));
            if (command && command.name) {
                commands.set(command.name, command);
                // Command ke aliases (dosre naam) ko bhi set karna
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

// Bot start hone par commands load karna
loadCommands();

// 'new-message' event ko sun'na
botEvents.on('new-message', async ({ sock, m }) => {
    try {
        // Message ke text ko nikalna, chahe woh normal ho, reply ho, ya button click
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.buttonsResponseMessage?.selectedButtonId || m.message?.templateButtonReplyMessage?.selectedId || "";

        // Check karna ke message me kuch hai aur prefix se start ho raha hai
        if (!m.message || !body.startsWith(config.prefix)) {
            return;
        }

        // Bhejne wale ka number nikalna
        const sender = m.key.remoteJid.endsWith('@g.us') ? m.key.participant : m.key.remoteJid;
        const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);

        // Agar bot ne khud message bheja hai to ignore karna (lekin owner ke nahi)
        if (m.key.fromMe && !isOwner) {
            return;
        }

        // Command aur uske aage ke text (arguments) ko alag karna
        const args = body.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);

        // Agar command mojood nahi hai to kuch na karna
        if (!command) {
            return;
        }
        
        // User subscribed hai ya nahi, yeh check karna
        const isSubscribed = config.SUBSCRIBED_USERS.some(user => sender.startsWith(user));

        // Private mode me access check karna
        if (config.MODE === 'private' && !isOwner && !isSubscribed) {
            return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied!*\n\nThis bot is in private mode. Contact the owner for access." });
        }
        
        // Owner-only command ko check karna
        if (command.ownerOnly && !isOwner) {
             return sock.sendMessage(m.key.remoteJid, { text: "❌ *Owner Command!*\n\nThis command can only be used by the bot owner." });
        }

        // Command ko execute karna
        await command.exec(sock, m, args);

    } catch (error) {
        console.error(chalk.red(`❌ Error in handler:`), error);
    }
});

console.log(chalk.magenta("🔧 Handler is listening for new messages..."));

