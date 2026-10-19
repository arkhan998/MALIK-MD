const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const botEvents = require('./lib/events.js');
const config = require('./config.js');
const cache = require('./lib/cache.js'); // Bot ki memory ko import karna

const commands = new Map();

async function loadCommands() {
    const pluginsPath = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsPath)) {
        console.log(chalk.yellow("Plugins directory not found."));
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
        } catch (error) {
            console.error(chalk.red(`❌ Error loading plugin ${file}:`), error);
        }
    }
    console.log(chalk.green(`✅ Found and loaded ${commands.size} commands/aliases.`));
}

loadCommands();

botEvents.on('new-message', async ({ sock, m }) => {
    try {
        if (!m || !m.message) return;

        const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || "").trim();
        const repliedToId = m.message.extendedTextMessage?.contextInfo?.stanzaId;

        // ======================================================
        // YEH HAI NAYA REPLY SYSTEM
        // Yeh check karta hai ke message kisi command ka reply hai ya nahi
        // ======================================================
        if (repliedToId && cache[repliedToId]) {
            const cachedData = cache[repliedToId];
            const replyText = body.toLowerCase();

            // Agar reply "1" hai to video bhejo
            if (replyText === '1') {
                await sock.sendMessage(m.key.remoteJid, { react: { text: '🎬', key: m.key } });
                await sock.sendMessage(m.key.remoteJid, {
                    video: { url: cachedData.videoUrl },
                    caption: "*Here is your TikTok video!*"
                }, { quoted: m });
                delete cache[repliedToId]; // Kaam khatam, memory se data saaf kar do
                return; // Yahan ruk jao
            } 
            // Agar reply "2" hai to audio bhejo
            else if (replyText === '2') {
                await sock.sendMessage(m.key.remoteJid, { react: { text: '🎧', key: m.key } });
                await sock.sendMessage(m.key.remoteJid, {
                    audio: { url: cachedData.audioUrl },
                    mimetype: 'audio/mpeg'
                }, { quoted: m });
                delete cache[repliedToId]; // Kaam khatam, memory se data saaf kar do
                return; // Yahan ruk jao
            }
        }
        // ======================================================

        // Purana "Malik" auto-reply
        if (body.toLowerCase() === "malik") {
            try {
                await sock.sendMessage(m.key.remoteJid, {
                    audio: { url: "https://files.catbox.moe/gk6kpk.mp3" },
                    mimetype: 'audio/mpeg',
                    ptt: true
                }, { quoted: m });
            } catch (err) {
                console.error("Error sending 'Malik' auto-reply:", err);
            }
            return;
        }

        // Normal command handling
        if (!body.startsWith(config.prefix)) return;
        
        const args = body.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);

        if (command) {
            const sender = m.key.remoteJid.endsWith('@g.us') ? (m.key.participant || m.participant) : m.key.remoteJid;
            const isOwner = config.OWNER_NUMBER && sender.startsWith(config.OWNER_NUMBER);

            if (command.ownerOnly && !isOwner) {
                return sock.sendMessage(m.key.remoteJid, { text: "👑 This command is for my owner only." }, { quoted: m });
            }
            await command.exec(sock, m, args);
        }

    } catch (error) {
        console.error(chalk.red(`❌ Error in handler:`), error);
    }
});

console.log(chalk.magenta("🔧 Handler is listening for events..."));

