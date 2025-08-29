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
        printQRInTerminal: false, // Important: Keep this false
        logger: pino({ level: "silent" }),
        browser: ["MALIK-MD", "Safari", "1.0.0"],
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            // Log the QR string directly
            console.log("------------------------------------------------");
            console.log("             SCAN THIS QR CODE");
            console.log("------------------------------------------------\n");
            console.log("QR Code String (copy this and use an online generator): \n\n", qr, "\n");
            console.log("Website to generate QR from text: https://www.the-qrcode-generator.com/");
            console.log("\n------------------------------------------------");
        }
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

