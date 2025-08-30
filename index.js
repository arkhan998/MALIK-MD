const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
} = require('@whiskeysockets/baileys');
const { handler } = require('./handler.js');
const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { Boom } = require('@hapi/boom');
const { Buffer } = require('buffer');
const config = require('./config.cjs');

// --- Basic Setup ---
const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_ID = process.env.SESSION_ID || config.SESSION_ID;

// --- Session Directory Setup ---
const sessionPath = path.join(__dirname, 'session');
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
}

// --- Main Bot Function ---
async function startMalikBot() {
    if (!SESSION_ID) {
        console.error(chalk.red("SESSION_ID not found in config or Heroku Vars. Please set it."));
        return;
    }

    try {
        // Simple Base64 decoding for the session
        const credsData = Buffer.from(SESSION_ID, 'base64').toString('utf-8');
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), credsData);
        console.log(chalk.green("🔒 Session file created successfully."));
    } catch (err) {
        console.error(chalk.red("Invalid SESSION_ID. Please provide a valid Base64 string. Error:"), err.message);
        return;
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.yellow(`🤖 ${config.bot_name} using WA v${version.join('.')}, isLatest: ${isLatest}`));

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: [config.bot_name, "Safari", "1.0.0"],
        auth: state,
    });

    // --- Event Listeners ---
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('Connection closed, reconnecting:'), shouldReconnect);
            if (shouldReconnect) {
                startMalikBot();
            }
        } else if (connection === 'open') {
            console.log(chalk.green("✅ Connection Successful! Bot is online."));
            sock.sendMessage(sock.user.id, { text: `*${config.bot_name} is now connected!*\n\n> Owner: ${config.OWNER_NAME}\n> Prefix: ${config.prefix}` });
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // --- Main Message & Event Handler ---
    sock.ev.on("messages.upsert", async (mek) => {
        const m = mek.messages[0];
        // Pass the message to the handler
        await handler(sock, m, config);
    });
    
    // --- Group Participants Update Handler for Welcome Message ---
    sock.ev.on('group-participants.update', async (update) => {
        if (config.WELCOME && update.action === 'add') {
            const { id, participants } = update;
            const welcomeMsg = `🎉 Welcome to the group, @${participants[0].split('@')[0]}!`;
            sock.sendMessage(id, { text: welcomeMsg, mentions: participants });
        }
    });

    // --- Call Handler ---
    sock.ev.on('call', async (call) => {
        if (config.REJECT_CALL && call[0].status === 'offer') {
            console.log(chalk.red(`Rejecting call from ${call[0].from}`));
            await sock.rejectCall(call[0].id, call[0].from);
            await sock.sendMessage(call[0].from, { text: "Sorry, I can't take calls. I am a bot." });
        }
    });

    // --- Always Online Feature ---
    if (config.ALWAYS_ONLINE) {
        // Send a presence update every minute
        setInterval(() => sock.sendPresenceUpdate('available'), 60000); 
        console.log("Always Online feature is enabled.");
    }
    
    return sock;
}

// --- Start the Bot and the Web Server ---
startMalikBot();
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

