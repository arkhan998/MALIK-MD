const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const express = require("express");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const handler = require("./handler");
const { Buffer } = require("buffer");

const app = express();
const port = process.env.PORT || 3000;

// Get SESSION_ID from Heroku Environment Variables
const SESSION_ID = process.env.SESSION_ID;

// Path to store session files
const sessionPath = path.join(__dirname, 'session');
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath);
}

// Function to start the bot
async function startMalikBot() {
    // Check for SESSION_ID
    if (!SESSION_ID) {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("!!!               ERROR                      !!!");
        console.error("!!!        SESSION_ID not found.           !!!");
        console.error("!!! Please set it in Heroku Config Vars.     !!!");
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        return;
    }

    // Decode and write the session file
    try {
        const credsData = Buffer.from(SESSION_ID, 'base64').toString('utf-8');
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), credsData);
        console.log("Session file created successfully.");
    } catch (err) { // Corrected this line, removed the extra dot
        console.error("Failed to decode or write session file:", err);
        return;
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using Baileys version: ${version}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        // Using the browser name from the other bot's session
        browser: ["SHABAN-MD", "Safari", "1.0.0"],
    });
    
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed, reconnecting:", shouldReconnect);
            if (shouldReconnect) {
                startMalikBot();
            }
        } else if (connection === "open") {
            console.log("Connected directly using SESSION_ID!");
            console.log(`Welcome, ${config.owner_name}! Bot is ready to use.`);
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
    
    return sock;
}

startMalikBot();

app.get('/', (req, res) => res.send('MALIK-MD Bot is running!'));
app.listen(port, () => console.log(`Server is listening on port ${port}`));

