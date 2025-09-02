const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { File } = require('megajs');
const config = require("./config.js");
const botEvents = require('./lib/events.js');

// Handler ko yahan import karna zaroori hai taake woh events sun'na shuru kar de
require('./handler.js');

const app = express();
const port = process.env.PORT || 3000;

const sessionPath = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
}

// Mega.nz se session download karne ka function
async function downloadSession() {
    console.log(chalk.yellow("📥 Attempting to download session from Mega.nz..."));
    if (!config.SESSION_ID) {
        console.error(chalk.red("❌ Error: SESSION_ID not found. Please set it in Heroku Vars."));
        return false;
    }
    const credsPath = path.join(sessionPath, 'creds.json');
    if (!fs.existsSync(credsPath)) {
        try {
            const sessdata = config.SESSION_ID.replace("MALIK-MD~", '');
            const file = File.fromURL(`https://mega.nz/file/${sessdata}`);
            const data = await file.downloadBuffer();
            fs.writeFileSync(credsPath, data);
            console.log(chalk.green("✅ Session downloaded successfully from Mega.nz!"));
            return true;
        } catch (err) {
            console.error(chalk.red("❌ Failed to download session:"), err);
            return false;
        }
    }
    console.log(chalk.blue("ℹ️ Session file already exists. Skipping download."));
    return true;
}

let initialConnection = true;

// Bot ko start karne ka function
async function startMalikBot() {
    const sessionDownloaded = await downloadSession();
    if (!sessionDownloaded) {
        console.log(chalk.red("Session download failed. Exiting."));
        process.exit(1);
    }

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(sessionPath);
    const {
        version,
        isLatest
    } = await fetchLatestBaileysVersion();
    console.log(chalk.cyan(`🔄 Using Baileys version: ${version.join('.')}, isLatest: ${isLatest}`));

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({
            level: "silent"
        }),
        browser: ["MALIK-MD", "Safari", "1.0.0"],
    });

    sock.ev.on("connection.update", (update) => {
        const {
            connection,
            lastDisconnect
        } = update;
        if (connection === "close") {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red("❌ Connection closed, reconnecting:"), shouldReconnect);
            if (shouldReconnect) {
                startMalikBot();
            }
        } else if (connection === "open") {
            console.log(chalk.green("✅ Integration Successful! Bot is online."));
            if (initialConnection && config.OWNER_NUMBER) {
                const ownerJid = config.OWNER_NUMBER + "@s.whatsapp.net";
                const connectMsg = `*🚀 MALIK-MD Bot Connected!*\n\nBot has successfully connected and is now online.\n\n❖ *Mode:* ${config.MODE}\n❖ *Prefix:* ${config.prefix}`;
                sock.sendMessage(ownerJid, { text: connectMsg });
                initialConnection = false;
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Message aane par event announce karna
    sock.ev.on("messages.upsert", (mek) => {
        try {
            const m = mek.messages[0];
            if (!m.message) return;
            botEvents.emit('new-message', { sock, m });
        } catch (err) {
            console.error(chalk.red("Error in messages.upsert event:"), err);
        }
    });
    
    // Call rejection logic
    sock.ev.on('call', async (json) => {
        if (config.REJECT_CALL) {
            for (const id of json) {
                if (id.status === 'offer') {
                    await sock.rejectCall(id.id, id.from);
                }
            }
        }
    });
}

startMalikBot();

app.get('/', (req, res) => res.send('MALIK-MD Bot is running!'));
app.listen(port, () => console.log(chalk.blue(`🚀 Server is listening on port ${port}`)));
