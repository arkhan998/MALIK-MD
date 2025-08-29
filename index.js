const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const express = require("express");
const fs = require("fs");
const path = require("path");
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
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using Baileys version: ${version}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, // QR is no longer needed
        logger: pino({ level: "silent" }),
        browser: ["MALIK-MD", "Safari", "1.0.0"],
    });

    // Pairing Code Logic
    if (!sock.authState.creds.registered) {
        // Check if bot number is provided
        if (!config.bot_number) {
            console.error("Error: Bot number not found in config.js. Please add it to use pairing code.");
            return;
        }
        
        console.log("Requesting Pairing Code...");
        // Delay to ensure the request is sent
        setTimeout(async () => {
            const code = await sock.requestPairingCode(config.bot_number);
            console.log("------------------------------------------------");
            console.log("           YOUR PAIRING CODE");
            console.log("------------------------------------------------");
            console.log(`             ${code}`);
            console.log("------------------------------------------------");
            console.log("Open WhatsApp > Settings > Linked Devices > Link with phone number and enter this code.");
        }, 3000); // 3-second delay
    }

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed, reconnecting:", shouldReconnect);
            if (shouldReconnect) {
                startMalikBot();
            }
        } else if (connection === "open") {
            console.log("Connected successfully!");
        }
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("messages.upsert", async (mek) => {
        try {
            const m = mek.messages[0];
            if (!m.message) return;
            await handler(sock, m, config);
        } catch (err) {
            console.error("Error in messages.upsert event:", err);
        }
    });
    
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

app.get('/', (req, res) => res.send('MALIK-MD Bot is running!'));
app.listen(port, () => console.log(`Server is listening on port ${port}`));
