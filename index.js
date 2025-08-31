const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const express = require("express");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { File } = require("megajs");

const config = require("./config.cjs");
const handler = require("./handler.js");

const app = express();
const port = process.env.PORT || 3000;

// Path to store session files
const sessionDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir);
}

// Function to start the bot
async function startMalikBot() {
    // Session download logic from Mega.nz
    if (!fs.existsSync(path.join(sessionDir, 'creds.json'))) {
        if (!config.SESSION_ID) {
            console.error(chalk.red('❌ Please add your session to SESSION_ID env !!'));
            process.exit(1);
        }
        console.log(chalk.yellow('🔄 No session found. Attempting to download from Mega.nz...'));
        try {
            const sessdata = config.SESSION_ID.replace("MALIK-MD~", '');
            const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
            const data = await filer.downloadBuffer();
            fs.writeFileSync(path.join(sessionDir, 'creds.json'), data);
            console.log(chalk.green("✅ Session downloaded successfully from Mega.nz!"));
        } catch (err) {
            console.error(chalk.red('❌ Failed to download session:', err));
            process.exit(1);
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.cyan(`🤖 MALIK-MD using WA v${version.join('.')}, isLatest: ${isLatest}`));

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS('Desktop'),
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red("❌ Connection closed. Reconnecting:"), shouldReconnect);
            if (shouldReconnect) {
                startMalikBot();
            }
        } else if (connection === "open") {
            console.log(chalk.green("✅ Integration Successful! Bot is online."));
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Main message handler
    sock.ev.on("messages.upsert", async (mek) => {
        try {
            const m = mek.messages[0];
            // THIS IS THE LINE WE CHANGED!
            // We removed || m.key.fromMe
            if (!m.message) return;
            await handler(sock, m);
        } catch (err) {
            console.error("Error in messages.upsert event:", err);
        }
    });

    // Call rejecter
    sock.ev.on('call', async (json) => {
        if (config.REJECT_CALL) {
            for (const id of json) {
                if (id.status === 'offer') {
                    await sock.rejectCall(id.id, id.from);
                }
            }
        }
    });

    // Auto status seen
    sock.ev.on('messages.upsert', async (mek) => {
        const m = mek.messages[0];
        if (m.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN) {
            await sock.readMessages([m.key]);
        }
    });

    // Welcome message
    sock.ev.on('group-participants.update', async (update) => {
        if (config.WELCOME) {
            const { id, participants, action } = update;
            if (action === 'add') {
                const welcomeMsg = `🎉 Welcome to the group, @${participants[0].split('@')[0]}!`;
                sock.sendMessage(id, { text: welcomeMsg, mentions: participants });
            }
        }
    });

    // Always online feature
    if (config.ALWAYS_ONLINE) {
        setInterval(() => {
            sock.sendPresenceUpdate('available');
        }, 60000); // Every 60 seconds
    }

    return sock;
}

startMalikBot();

app.get('/', (req, res) => res.send('MALIK-MD Bot is running!'));
app.listen(port, () => console.log(chalk.blue(`🚀 Server is listening on port ${port}`)));

