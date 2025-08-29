const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const express = require("express");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-terminal"); // New library import
const config = require("./config");
const handler = require("./handler");

const app = express();
const port = process.env.PORT || 3000;

// Path to store session files
const sessionPath = path.join(__dirname, 'session');
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath);
}

// Function to start the bot
async function startMalikBot() {
    // New authentication method
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    // Fetch the latest version of Baileys
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using Baileys version: ${version}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, // Set this to false
        logger: pino({ level: "silent" }),
        browser: ["MALIK-MD", "Safari", "1.0.0"],
    });

    // Handle connection updates
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("QR code received, scan with your phone.");
            // Generate QR code in terminal
            qrcode.generate(qr, { small: true });
        }
        if (connection === "close") {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed due to ", lastDisconnect?.error, ", reconnecting ", shouldReconnect);
            if (shouldReconnect) {
                startMalikBot();
            }
        } else if (connection === "open") {
            console.log("Connected successfully!");
        }
    });

    // Save credentials on update
    sock.ev.on("creds.update", saveCreds);

    // Listen for incoming messages
    sock.ev.on("messages.upsert", async (mek) => {
        try {
            const m = mek.messages[0];
            if (!m.message) return;
            // Pass the message to the handler
            await handler(sock, m, config);
        } catch (err) {
            console.error("Error in messages.upsert event:", err);
        }
    });

    // Welcome message for new group members
    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;
        if (action === 'add') {
            const welcomeMsg = `🎉 Welcome to the group, @${participants[0].split('@')[0]}! Enjoy your stay.`;
            sock.sendMessage(id, { text: welcomeMsg, mentions: participants });
        }
    });

    return sock;
}

startMalikBot();

// Express server to keep the bot alive on Heroku
app.get('/', (req, res) => {
    res.send('MALIK-MD Bot is running!');
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
