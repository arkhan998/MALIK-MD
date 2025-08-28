// index.js

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const express = require('express');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const commandHandler = require('./handler');

// Setup logger
const logger = pino({ level: 'silent' }); // Use 'info' for detailed logs

// Setup in-memory store for chat data
const store = makeInMemoryStore({ logger });
store?.readFromFile('./baileys_store_multi.json');
// Save store data every 10 seconds
setInterval(() => {
    store?.writeToFile('./baileys_store_multi.json');
}, 10_000);

// Setup Express server
const app = express();
const port = config.server_port;

app.get('/', (req, res) => {
    res.send(`<h1>${config.bot_name} is alive!</h1>`);
});

app.listen(port, () => {
    console.log(`${config.bot_name} server listening on port ${port}`);
});

// Main connection function
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using Baileys version ${version}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger,
        browser: ['MALIK-MD', 'Safari', '1.0.0'] // Custom browser name
    });

    store?.bind(sock.ev);

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("QR code generated. Scan it with your phone.");
            // qrcode.generate(qr, { small: true }); // Optionally display QR in terminal
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ?
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut :
                true;
            console.log('Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp!');
        }
    });

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;

        // Pass the message to the command handler
        await commandHandler(sock, msg);
    });

    // Handle group participant updates (for welcome messages)
    sock.ev.on('group-participants.update', async (update) => {
        if (!config.auto_welcome) return;

        const { id, participants, action } = update;
        if (action === 'add') {
            const newUser = participants[0];
            const welcomeText = config.welcome_message.replace('@user', `@${newUser.split('@')[0]}`);
            try {
                await sock.sendMessage(id, {
                    text: welcomeText,
                    mentions: [newUser]
                });
            } catch (err) {
                console.error("Failed to send welcome message:", err);
            }
        }
    });

    return sock;
}

// Start the bot
connectToWhatsApp().catch(err => console.error("Failed to connect to WhatsApp:", err));
