const fs = require('fs');
const path = require('path');
// Address theek kar diya gaya hai
const config = require('./config.cjs'); 

const pluginsDir = path.join(__dirname, 'plugins');
const commands = new Map();

// --- Load all commands from plugins folder ---
try {
    const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of pluginFiles) {
        try {
            const command = require(path.join(pluginsDir, file));
            if (command.name && command.execute) {
                commands.set(command.name, command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => commands.set(alias, command));
                }
            }
        } catch (err) {
            console.error(`Error loading plugin ${file}:`, err);
        }
    }
} catch (error) {
    console.error("Error reading plugins directory:", error);
}

async function handler(sock, m, config) {
    // Ignore if message is empty or not from a user
    if (!m.message || !m.key.remoteJid) return;
    const messageType = Object.keys(m.message)[0];
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? m.key.participant : m.key.remoteJid;

    // --- Auto Actions ---
    if (config.AUTO_READ) {
        await sock.readMessages([m.key]);
    }
    if (config.AUTO_TYPING) {
        await sock.sendPresenceUpdate('composing', from);
    }
    if (config.AUTO_RECORDING) {
        await sock.sendPresenceUpdate('recording', from);
    }

    // --- Command Logic ---
    const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if (!body || !body.startsWith(config.prefix)) return;

    const args = body.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = commands.get(commandName);

    // --- Mode Check (Public/Private) ---
    const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
    if (config.MODE === 'private' && sender !== ownerJid) {
        return; // In private mode, only owner can use commands
    }

    if (command) {
        try {
            await command.execute(sock, m, args);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            sock.sendMessage(from, { text: 'An error occurred while executing the command.' }, { quoted: m });
        }
    }
}

module.exports = { handler, commands };

