const fs = require('fs');
const path = require('path');
const config = require('./config.cjs'); 

const pluginsDir = path.join(__dirname, 'plugins');
const commands = new Map();

// --- Load all commands from plugins folder ---
try {
    const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    console.log(`Found ${pluginFiles.length} plugins.`);
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

async function handler(sock, m) { // config yahan zaroori nahi
    if (!m.message || !m.key.remoteJid) return;
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? m.key.participant : m.key.remoteJid;

    if (config.AUTO_READ) await sock.readMessages([m.key]);
    if (config.AUTO_TYPING) await sock.sendPresenceUpdate('composing', from);
    if (config.AUTO_RECORDING) await sock.sendPresenceUpdate('recording', from);

    const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if (!body || !body.startsWith(config.prefix)) return;

    const args = body.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = commands.get(commandName);

    const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
    if (config.MODE === 'private' && sender !== ownerJid) return;

    if (command) {
        try {
            await command.execute(sock, m, args);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            sock.sendMessage(from, { text: 'Command execution failed!' }, { quoted: m });
        }
    }
}

// Ab hum commands ko export nahi kar rahe
module.exports = { handler };

