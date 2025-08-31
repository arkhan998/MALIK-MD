const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const express = require("express");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { File } = require("megajs");
const config = require("./config.cjs");
const handleMessage = require("./handler.js");

const app = express();
const port = process.env.PORT || 3000;

// --- Session Directory Setup ---
const sessionDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

// --- Mega.nz Session Downloader ---
async function downloadSession() {
    return new Promise(async (resolve, reject) => {
        if (!config.SESSION_ID) {
            console.error(chalk.red("❌ Error: SESSION_ID not found in config. Please add it."));
            return resolve(false);
        }

        if (fs.existsSync(path.join(sessionDir, 'creds.json'))) {
            console.log(chalk.green("✅ Session file found locally."));
            return resolve(true);
        }

        console.log(chalk.yellow("📥 No session file found. Attempting to download from Mega.nz..."));
        const sessionID = config.SESSION_ID.replace("MALIK-MD~", '').trim();
        
        try {
            const file = File.fromURL(`https://mega.nz/file/${sessionID}`);
            await file.loadAttributes(); // Necessary to get file details
            const data = await file.downloadBuffer();
            fs.writeFileSync(path.join(sessionDir, 'creds.json'), data);
            console.log(chalk.green("✅ Session downloaded successfully from Mega.nz!"));
            resolve(true);
        } catch (error) {
            console.error(chalk.red("❌ Failed to download session from Mega.nz:"), error.message || error);
            console.error(chalk.red("Please ensure your SESSION_ID is correct and the Mega link is valid."));
            resolve(false);
        }
    });
}


// --- Main Bot Function ---
async function startMalikBot() {
    const sessionDownloaded = await downloadSession();
    if (!sessionDownloaded) return; // Stop if session fails

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.cyan(`🤖 MALIK-MD using WA v${version.join('.')}, isLatest: ${isLatest}`));

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["MALIK-MD", "Safari", "1.0.0"],
    });

    // --- Event Handlers ---
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log(chalk.yellow("Connection closed, reconnecting..."));
                startMalikBot();
            } else {
                console.log(chalk.red("Connection closed permanently. You have been logged out."));
            }
        } else if (connection === "open") {
            console.log(chalk.green("✅ Integration Successful! Bot is online."));
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (mek) => {
        try {
            const m = mek.messages[0];
            if (!m.message || m.key.id.startsWith('BAE5')) return;
            await handleMessage(sock, m);
        } catch (error) {
            console.error("Error in messages.upsert event:", error);
        }
    });
    
    // Call rejection
    if (config.REJECT_CALL) {
        sock.ev.on('call', async (call) => {
            if (call[0].status === 'offer') {
                await sock.rejectCall(call[0].id, call[0].from);
                await sock.sendMessage(call[0].from, { text: "Sorry, I can't take calls. I am an AI Bot." });
            }
        });
    }

    // Welcome message
    if (config.WELCOME) {
        sock.ev.on('group-participants.update', async (update) => {
            const { id, participants, action } = update;
            if (action === 'add') {
                const welcomeMsg = `🎉 Welcome to the group, @${participants[0].split('@')[0]}! Enjoy your stay.`;
                sock.sendMessage(id, { text: welcomeMsg, mentions: participants });
            }
        });
    }
}

// --- Start Server and Bot ---
app.get('/', (req, res) => res.send('MALIK-MD Bot is running!'));
app.listen(port, () => {
    console.log(chalk.blue(`🚀 Server is listening on port ${port}`));
    startMalikBot();
});

