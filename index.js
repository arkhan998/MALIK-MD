import {
    makeWASocket,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { handler } from './handler.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Boom } from '@hapi/boom';
import { Buffer } from 'buffer';
import config from './config.js';

// --- Basic Setup ---
const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_ID = process.env.SESSION_ID;

// --- Session Directory Setup ---
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const sessionPath = path.join(__dirname, 'session');

if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
}

// --- Main Bot Function ---
async function startMalikBot() {
    // 1. Check for SESSION_ID
    if (!SESSION_ID) {
        console.error(chalk.red("SESSION_ID not found in Heroku Config Vars. Please set it."));
        return;
    }

    // 2. Decode and write the session file from Base64
    try {
        const credsData = Buffer.from(SESSION_ID, 'base64').toString('utf-8');
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), credsData);
        console.log(chalk.green("🔒 Session file created successfully."));
    } catch (err) {
        console.error(chalk.red("Failed to decode or write session file:", err));
        return;
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.yellow(`🤖 MALIK-MD using WA v${version.join('.')}, isLatest: ${isLatest}`));

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // We are not using QR
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
            sock.sendMessage(sock.user.id, { text: `*MALIK-MD is now connected!*\n\n> Owner: ${config.owner_name}\n> Prefix: ${config.prefix}` });
        }
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on("messages.upsert", async (mek) => {
        // Ensure mek and mek.messages are defined
        if (mek && mek.messages && mek.messages.length > 0) {
            await handler(sock, mek.messages[0], config);
        }
    });
    
    return sock;
}

// --- Start the Bot ---
startMalikBot();

app.get('/', (req, res) => {
    res.send('MALIK-MD Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

