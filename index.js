const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { File } = require('megajs'); // Mega.nz ke liye zaroori

// config.js se saari settings import karna
const config = require("./config.js"); 
const botEvents = require('./lib/events.js');
require('./handler.js');

const app = express();
const port = process.env.PORT || 3000;
const sessionPath = path.join(__dirname, 'sessions');

if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
}

// =================================================================
// AAPKA MEGA.NZ SESSION DOWNLOAD WALA CODE (BILKUL THEEK KIYA HUA)
// =================================================================
async function downloadSession() {
    console.log(chalk.yellow("📥 Attempting to download session from Mega.nz..."));
    
    // Yahan check kar rahe hain ke SESSION_ID hai aur usme "MALIK-MD~" hai ya nahi
    if (!config.SESSION_ID || !config.SESSION_ID.includes('MALIK-MD~')) {
        console.error(chalk.red("❌ Error: SESSION_ID Heroku me set nahi hai ya format ghalat hai."));
        console.error(chalk.red("   Format hona chahiye: MALIK-MD~[aapka_mega_link_ka_hissa]"));
        return false;
    }
    
    const credsPath = path.join(sessionPath, 'creds.json');
    
    // Agar session file pehle se nahi hai, tabhi download karein
    if (!fs.existsSync(credsPath)) {
        try {
            // Yahan par "MALIK-MD~" ko hata kar aage wala link ka hissa istemal kar rahe hain
            const sessdata = config.SESSION_ID.replace("MALIK-MD~", '');
            const file = File.fromURL(`https://mega.nz/file/${sessdata}`);
            await file.loadAttributes();
            const data = await file.downloadBuffer();
            fs.writeFileSync(credsPath, data);
            console.log(chalk.green("✅ Session downloaded successfully from Mega.nz!"));
            return true;
        } catch (err) {
            console.error(chalk.red("❌ Session download nahi ho saka:"), err.message);
            return false;
        }
    }
    console.log(chalk.blue("ℹ️ Session file pehle se maujood hai. Download skip kar rahe hain."));
    return true;
}
// =================================================================

let initialConnection = true;

async function startMalikBot() {
    // Bot start hone se pehle session download karega
    const sessionDownloaded = await downloadSession();
    if (!sessionDownloaded) {
        console.log(chalk.red("Session download fail hogaya. Bot band ho raha hai."));
        process.exit(1); 
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.cyan(`🔄 Using Baileys version: ${version.join('.')}, isLatest: ${isLatest}`));

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: ["MALIK-MD", "Safari", "1.0.0"],
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red("❌ Connection closed, reconnecting:"), shouldReconnect);
            if (shouldReconnect) {
                startMalikBot();
            } else {
                console.log(chalk.red("❌ Logged out. Please delete 'sessions' folder and rescan QR."));
            }
        } else if (connection === "open") {
            console.log(chalk.green("✅ Integration Successful! Bot is online."));
            if (initialConnection && config.OWNER_NUMBER) {
                const ownerJid = config.OWNER_NUMBER + "@s.whatsapp.net";
                const connectMsg = `*🚀 MALIK-MD Bot Connected!*\n\n❖ *Mode:* ${config.MODE}\n❖ *Prefix:* ${config.prefix}`;
                sock.sendMessage(ownerJid, { text: connectMsg });
                initialConnection = false;
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Baaki saara trigger wala code (welcome, reject call, etc.)
    sock.ev.on("messages.upsert", (mek) => {
        try {
            const m = mek.messages[0];
            if (!m.message) return;
            if (config.TRIGGERS.auto_read) { sock.readMessages([m.key]); }
            botEvents.emit('new-message', { sock, m });
        } catch (err) {
            console.error(chalk.red("Error in messages.upsert:"), err);
        }
    });
    
    sock.ev.on('messages.upsert', async (mek) => {
        if (config.TRIGGERS.auto_status_seen) {
            const m = mek.messages[0];
            if (m.key.remoteJid === 'status@broadcast') { await sock.readMessages([m.key]); }
        }
    });
    
    sock.ev.on('call', async (json) => {
        if (config.TRIGGERS.reject_call) {
            for (const id of json) {
                if (id.status === 'offer') { await sock.rejectCall(id.id, id.from); }
            }
        }
    });

    sock.ev.on('group-participants.update', async (event) => {
        if (config.TRIGGERS.welcome) {
            try {
                if (event.action === 'add') {
                    const welcomeMsg = `Assalam-o-Alaikum @${event.participants[0].split('@')[0]}! Welcome.`;
                    await sock.sendMessage(event.id, { text: welcomeMsg, mentions: event.participants });
                } else if (event.action === 'remove') {
                    const goodbyeMsg = `Allah Hafiz @${event.participants[0].split('@')[0]}!`;
                    await sock.sendMessage(event.id, { text: goodbyeMsg, mentions: event.participants });
                }
            } catch (err) {
                console.log("Error in group-participants.update:", err);
            }
        }
    });
}

startMalikBot();
app.get('/', (req, res) => res.send('MALIK-MD Bot is running!'));
app.listen(port, () => console.log(chalk.blue(`🚀 Server listening on port ${port}`)));

