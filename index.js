const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { File } = require('megajs');
const chalk = require('chalk');
const config = require('./config.cjs');
const { handler } = require('./handler.js');

const app = express();
const port = process.env.PORT || 3000;

const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir);
}

// --- Function to download session from Mega.nz ---
async function downloadSessionData() {
    if (!fs.existsSync(path.join(sessionsDir, 'creds.json'))) {
        if (!config.SESSION_ID) {
            console.error(chalk.red('❌ Please add your SESSION_ID to env!'));
            return false;
        }
        
        console.log(chalk.yellow('⬇️ Downloading session from Mega.nz...'));
        try {
            const sessdata = config.SESSION_ID.replace("MALIK-MD~", '');
            const file = File.fromURL(`https://mega.nz/file/${sessdata}`);
            const data = await file.downloadBuffer();
            fs.writeFileSync(path.join(sessionsDir, 'creds.json'), data);
            console.log(chalk.green('✅ Session downloaded successfully!'));
            return true;
        } catch (err) {
            console.error(chalk.red('❌ Failed to download session:'), err);
            return false;
        }
    }
    return true; // Session already exists
}

async function startMalikBot() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.cyan(`🤖 Using Baileys version: ${version.join('.')}, isLatest: ${isLatest}`));

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["MALIK-MD", "Safari", "1.0.0"],
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red(`🔌 Connection closed, reconnecting: ${shouldReconnect}`));
            if (shouldReconnect) {
                startMalikBot();
            }
        } else if (connection === "open") {
            console.log(chalk.green('✅ Integration Successful! Bot is online.'));
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (mek) => {
        try {
            const m = mek.messages[0];
            if (!m.message) return;
            await handler(sock, m); 
        } catch (err) {
            console.error(chalk.red("❌ Error in messages.upsert event:"), err);
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        if (config.WELCOME) {
            const { id, participants, action } = update;
            if (action === 'add') {
                const welcomeMsg = `🎉 Welcome to the group, @${participants[0].split('@')[0]}!`;
                sock.sendMessage(id, { text: welcomeMsg, mentions: participants });
            }
        }
    });

    // --- Other event handlers from config ---
    sock.ev.on('call', async (call) => {
        if (config.REJECT_CALL && call[0].status === 'offer') {
            await sock.rejectCall(call[0].id, call[0].from);
        }
    });

    sock.ev.on('presence.update', (json) => {
        if (config.ALWAYS_ONLINE) {
             sock.sendPresenceUpdate('available');
        }
    });

    sock.ev.on('messages.upsert', async (mek) => {
         const m = mek.messages[0];
         if (config.AUTO_STATUS_SEEN && m.key.remoteJid === 'status@broadcast') {
             await sock.readMessages([m.key]);
         }
         if (config.AUTO_BLOCK && m.key.remoteJid.startsWith('212')) {
            await sock.updateBlockStatus(m.key.remoteJid, 'block');
         }
    });

    return sock;
}

// --- Start the bot after downloading session ---
downloadSessionData().then(success => {
    if (success) {
        startMalikBot();
    } else {
        console.error(chalk.red('Could not start bot due to session download failure.'));
    }
});

app.get('/', (req, res) => res.send('MALIK-MD Bot is running!'));
app.listen(port, () => console.log(chalk.blue(`🚀 Server is listening on port ${port}`)));

