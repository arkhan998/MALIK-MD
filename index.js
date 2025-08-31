const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const {
    Boom
} = require("@hapi/boom");
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const path = require("path");
const {
    File
} = require('megajs');
const chalk = require("chalk");
const config = require("./config.cjs");
const botEvents = require('./lib/events.js'); // Naya Event Emitter import kiya gaya hai

// Handler ko yahan se hata diya gaya hai, usko ab index.js ki zaroorat nahi
// require('./handler.js');

const app = express();
const port = process.env.PORT || 3000;

// Sessions folder ka path
const sessionPath = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath);
}

// Mega.nz se session download karne ka function
async function downloadSession() {
    console.log(chalk.yellow("📥 Attempting to download session from Mega.nz..."));
    if (!config.SESSION_ID) {
        console.error(chalk.red("❌ Error: SESSION_ID not found in config.cjs or Heroku Vars."));
        return false;
    }
    if (!fs.existsSync(sessionPath + '/creds.json')) {
        try {
            const sessdata = config.SESSION_ID.replace("MALIK-MD~", '');
            const file = File.fromURL(`https://mega.nz/file/${sessdata}`);
            const data = await file.downloadBuffer();
            fs.writeFileSync(sessionPath + '/creds.json', data);
            console.log(chalk.green("✅ Session downloaded successfully from Mega.nz!"));
            return true;
        } catch (err) {
            console.error(chalk.red("❌ Failed to download session:"), err);
            return false;
        }
    }
    return true; // Session pehle se mojood hai
}


// Bot ko start karne ka function
async function startMalikBot() {
    const sessionDownloaded = await downloadSession();
    if (!sessionDownloaded && !fs.existsSync(sessionPath + '/creds.json')) {
        console.log(chalk.red("Initial session download failed and no local session found. Exiting."));
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
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Message aane par event announce karna
    sock.ev.on("messages.upsert", async (mek) => {
        try {
            const m = mek.messages[0];
            if (!m.message) return;

            // Yahan se handler ko direct call karne ke bajaye event emit kiya ja raha hai
            botEvents.emit('new-message', {
                sock,
                m,
                config
            });

        } catch (err) {
            console.error(chalk.red("Error in messages.upsert event:"), err);
        }
    });

    // Welcome/Goodbye message
    sock.ev.on('group-participants.update', async (update) => {
        if (!config.WELCOME) return;
        const {
            id,
            participants,
            action
        } = update;
        try {
            const groupMeta = await sock.groupMetadata(id);
            for (const participant of participants) {
                const user = participant.split('@')[0];
                if (action === 'add') {
                    sock.sendMessage(id, {
                        text: `🎉 Assalam-o-Alaikum @${user}! Welcome to *${groupMeta.subject}*.`,
                        mentions: [participant]
                    });
                } else if (action === 'remove') {
                    sock.sendMessage(id, {
                        text: `👋 Allah Hafiz @${user}! We'll miss you.`,
                        mentions: [participant]
                    });
                }
            }
        } catch (err) {
            console.log("Error in group-participants.update:", err);
        }
    });


    // Auto Status Seen
    sock.ev.on('messages.upsert', async (mek) => {
        const m = mek.messages[0];
        if (config.AUTO_STATUS_SEEN && m.key.remoteJid === 'status@broadcast') {
            await sock.readMessages([m.key]);
        }
    });

    // Reject Call
    sock.ev.on('call', async (json) => {
        if (config.REJECT_CALL) {
            for (const id of json) {
                if (id.status === 'offer') {
                    await sock.rejectCall(id.id, id.from);
                }
            }
        }
    });

    return sock;
}

startMalikBot();

app.get('/', (req, res) => res.send('MALIK-MD Bot is running!'));
app.listen(port, () => console.log(chalk.blue(`🚀 Server is listening on port ${port}`)));

