const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const botEvents = require('./lib/events.js');
const presence = require('./lib/presence.js');
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
            const mods = Array.isArray(commandModule) ? commandModule : [commandModule];
            for (const mod of mods) {
                if (mod && mod.name) {
                    commands.set(mod.name, mod);
                    if (mod.alias && Array.isArray(mod.alias)) {
                        mod.alias.forEach(alias => commands.set(alias, mod));
                    }
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

        // "Malik" baghair dot ke bhi — pura .malik command chalega
        // (voice note + owner info + contact card)
        if (body.toLowerCase() === "malik") {
            const malikCmd = commands.get("malik") || commands.get("owner");
            if (malikCmd) {
                await presence.showTyping(sock, m.key.remoteJid);
                try {
                    await malikCmd.exec(sock, m, []);
                } catch (err) {
                    console.error("Error in 'Malik' auto-reply:", err);
                } finally {
                    await presence.hideTyping(sock, m.key.remoteJid);
                }
            }
            return;
        }

        // Normal command handling
        if (!body.startsWith(config.prefix)) return;
        
        const args = body.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);

        if (command) {
            const sender = m.key.remoteJid.endsWith('@g.us') ? (m.key.participant || m.participant || m.key.remoteJid) : m.key.remoteJid;
            // Bot ke apne number se aya message (fromMe) = owner hi hai
            const isOwner = m.key.fromMe || (config.OWNER_NUMBER && String(sender).startsWith(config.OWNER_NUMBER));

            if (command.ownerOnly && !isOwner) {
                return sock.sendMessage(m.key.remoteJid, { text: "👑 This command is for my owner only." }, { quoted: m });
            }
            await presence.showTyping(sock, m.key.remoteJid);
            try {
                await command.exec(sock, m, args);
            } finally {
                await presence.hideTyping(sock, m.key.remoteJid);
            }
        }

    } catch (error) {
        console.error(chalk.red(`❌ Error in handler:`), error);
    }
});

console.log(chalk.magenta("🔧 Handler is listening for events..."));

