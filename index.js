const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { File } = require('megajs');
const { config, botSettings } = require("./config.js");
const botEvents = require('./lib/events.js');

// Handler ko yahan start kar rahe hain taake woh messages sun sake
require('./handler.js');

const app = express();
const port = process.env.PORT || 3000;
const sessionPath = path.join(__dirname, 'sessions');

// Agar sessions ka folder nahi hai to usay banayein
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
}

// Session download karne ka function
async function downloadSession() {
    console.log(chalk.yellow("📥 Attempting to download session..."));
    if (!config.SESSION_ID) {
        console.error(chalk.red("❌ Error: SESSION_ID not provided in Heroku vars."));
        return false;
    }
    const credsPath = path.join(sessionPath, 'creds.json');
    if (fs.existsSync(credsPath)) {
         console.log(chalk.blue("ℹ️ Session file already exists. Skipping download."));
         return true;
    }
    try {
        const sessdata = config.SESSION_ID.replace("MALIK-MD~", '');
        const file = File.fromURL(`https://mega.nz/file/${sessdata}`);
        const data = await file.downloadBuffer();
        fs.writeFileSync(credsPath, data);
        console.log(chalk.green("✅ Session downloaded successfully!"));
        return true;
    } catch (err) {
        console.error(chalk.red("❌ Failed to download session:"), err);
        return false;
    }
}

let initialConnection = true;

// Bot ko start karne ka main function
async function startMalikBot() {
    if (!await downloadSession()) {
        console.log(chalk.red("Session download failed. Exiting."));
        process.exit(1);
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.cyan(`🔄 Using Baileys version: ${version.join('.')}, isLatest: ${isLatest}`));

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["MALIK-MD", "Safari", "1.0.0"],
        shouldIgnoreJid: jid => jid.endsWith('@broadcast'),
    });

    // Connection ka status update hone par
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red("❌ Connection closed, reconnecting:"), shouldReconnect);
            if (shouldReconnect) startMalikBot();
        } else if (connection === "open") {
            console.log(chalk.green("✅ Bot is online!"));
            if (initialConnection && config.OWNER_NUMBER) {
                const ownerJid = jidNormalizedUser(config.OWNER_NUMBER);
                sock.sendMessage(ownerJid, { text: `*🚀 MALIK-MD Bot Connected!*\n\n❖ *Mode:* ${config.MODE}\n❖ *Prefix:* ${config.prefix}` });
                initialConnection = false;
            }
        }
    });

    // Jab bhi session update ho, usay save karein
    sock.ev.on("creds.update", saveCreds);

    // Jab naya message aaye
    sock.ev.on("messages.upsert", (mek) => {
        try {
            const m = mek.messages[0];
            if (!m.message) return;

            // Settings ke mutabiq kaam karna
            if (botSettings.autoRead) sock.readMessages([m.key]);
            if (botSettings.autoTyping) sock.sendPresenceUpdate('composing', m.key.remoteJid);
            if (botSettings.autoRecording) sock.sendPresenceUpdate('recording', m.key.remoteJid);

            // Message ko handler ke paas bhejna
            botEvents.emit('new-message', { sock, m });
        } catch (err) {
            console.error(chalk.red("Error in messages.upsert:"), err);
        }
    });
    
    // Call aane par reject karna
    sock.ev.on('call', async (json) => {
        if (botSettings.rejectCall) {
            for (const id of json) {
                if (id.status === 'offer') await sock.rejectCall(id.id, id.from);
            }
        }
    });
}

// Bot start karein
startMalikBot();

// Heroku ko zinda rakhne ke liye
app.get('/', (req, res) => res.send('MALIK-MD Bot is running!'));
app.listen(port, () => console.log(chalk.blue(`🚀 Server listening on port ${port}`)));

