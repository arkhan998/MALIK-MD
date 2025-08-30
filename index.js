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
const SESSION_ID = process.env.SESSION_ID || "";

// --- Session Directory Setup ---
const sessionPath = path.join(__dirname, 'session');
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
}

// --- Main Bot Function ---
async function startMalikBot() {
    // Check for SESSION_ID
    if (!SESSION_ID) {
        console.error(chalk.red("SESSION_ID not found in config.cjs or Heroku Vars. Please set it."));
        return;
    }

    try {
        // Decode the Base64 session string and write to creds.json
        // This is the simplest and most reliable way to use a pre-existing session.
        const credsData = Buffer.from(SESSION_ID, 'base64').toString('utf-8');
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), credsData);
        console.log(chalk.green("🔒 Session file created successfully from SESSION_ID."));
    } catch (err) {
        console.error(chalk.red("Invalid SESSION_ID. It must be a valid Base64 string. Error:"), err.message);
        return;
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.yellow(`🤖 MALIK-MD using WA v${version.join('.')}, isLatest: ${isLatest}`));

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        // This is the important part: The browser name now matches your prefix.
        browser: ["MALIK-MD", "Safari", "1.0.0"],
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
            sock.sendMessage(sock.user.id, { text: `*MALIK-MD is now connected!*\n\n> Owner: ${config.OWNER_NAME}` });
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // --- Main Message & Event Handler ---
    sock.ev.on("messages.upsert", async (mek) => {
        await handler(sock, mek.messages[0], config);
    });
    
    // Other event handlers from config can go here...
    // (Call reject, Welcome message, etc.)

    return sock;
}

// --- Start the Bot and the Web Server ---
startMalikBot();
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

