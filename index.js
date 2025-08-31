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
const { File } = require('megajs'); // Mega.nz library
const config = require('./config.cjs');

// --- Basic Setup ---
const app = express();
const PORT = process.env.PORT || 9090; // Port updated as per your snippet
let initialConnection = true;

// --- Session Directory Setup ---
// Using 'sessions' (plural) as per your snippet
const sessionsPath = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionsPath, 'creds.json');
if (!fs.existsSync(sessionsPath)) {
    fs.mkdirSync(sessionsPath, { recursive: true });
}

// --- Mega.nz Session Downloader Function ---
async function downloadMegaSession() {
    return new Promise((resolve, reject) => {
        const SESSION_ID = process.env.SESSION_ID || config.SESSION_ID;
        if (!SESSION_ID) {
            console.error(chalk.red("SESSION_ID not found. Please add your Mega session link."));
            return resolve(false);
        }

        // Expects format: MALIK-MD~<mega_file_id>
        const sessdata = SESSION_ID.replace("MALIK-MD~", '');
        const url = `https://mega.nz/file/${sessdata}`;
        console.log(chalk.yellow(`Downloading session from Mega.nz...`));

        const file = File.fromURL(url);
        file.download((err, data) => {
            if (err) {
                console.error(chalk.red("Failed to download session from Mega.nz."), err);
                return resolve(false);
            }
            fs.writeFileSync(credsPath, data);
            console.log(chalk.green("✅ Session downloaded successfully from Mega.nz!"));
            resolve(true);
        });
    });
}

// --- Main Bot Function ---
async function startMalikBot() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionsPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.yellow(`🤖 MALIK-MD using WA v${version.join('.')}, isLatest: ${isLatest}`));

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        // Browser name to match the session prefix
        browser: ["MALIK-MD", "Safari", "1.0.0"],
        auth: state,
    });

    // --- Connection Logic ---
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('Connection closed, reconnecting:'), shouldReconnect);
            if (shouldReconnect) {
                startMalikBot();
            }
        } else if (connection === 'open') {
             if (initialConnection) {
                console.log(chalk.green("✅ Integration Successful! Bot is online."));
                sock.sendMessage(sock.user.id, { text: `*MALIK-MD is now connected!*\n\n> Owner: ${config.OWNER_NAME}` });
                initialConnection = false;
            } else {
                console.log(chalk.blue("♻️ Connection reestablished."));
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // --- Main Message & Event Handler ---
    sock.ev.on("messages.upsert", async (mek) => {
        await handler(sock, mek.messages[0], config);
    });
}

// --- Initialize Bot Startup ---
async function initialize() {
    if (fs.existsSync(credsPath)) {
        console.log(chalk.green("Session file found. Starting bot..."));
        await startMalikBot();
    } else {
        const downloaded = await downloadMegaSession();
        if (downloaded) {
            await startMalikBot();
        } else {
            console.error(chalk.red("Bot cannot start without a session. Exiting..."));
            process.exit(1);
        }
    }
}

initialize();
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

