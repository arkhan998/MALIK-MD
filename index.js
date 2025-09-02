const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { File } = require('megajs');
const cron = require('node-cron');

const config = require("./config.js");
const botEvents = require('./lib/events.js');
const { generateReminderMessage } = require('./lib/reminder.js');
require('./handler.js');

const app = express();
const port = process.env.PORT || 3000;
const sessionPath = path.join(__dirname, 'sessions');

if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
}

async function downloadSession() {
    console.log(chalk.yellow("📥 Attempting to download session from Mega.nz..."));
    if (!config.SESSION_ID || !config.SESSION_ID.includes('MALIK-MD~')) {
        console.error(chalk.red("❌ Error: SESSION_ID format is incorrect in Heroku vars."));
        return false;
    }
    const credsPath = path.join(sessionPath, 'creds.json');
    if (!fs.existsSync(credsPath)) {
        try {
            const sessdata = config.SESSION_ID.replace("MALIK-MD~", '');
            const file = File.fromURL(`https://mega.nz/file/${sessdata}`);
            await file.loadAttributes();
            const data = await file.downloadBuffer();
            fs.writeFileSync(credsPath, data);
            console.log(chalk.green("✅ Session downloaded successfully!"));
            return true;
        } catch (err) {
            console.error(chalk.red("❌ Failed to download session:"), err.message);
            return false;
        }
    }
    console.log(chalk.blue("ℹ️ Session file already exists. Skipping download."));
    return true;
}

async function connectToWhatsApp() {
    const sessionDownloaded = await downloadSession();
    if (!sessionDownloaded) {
        console.log(chalk.red("Exiting due to session download failure."));
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

    if (config.ENABLE_REMINDERS && config.REMINDER_USERS.length > 0) {
        console.log(chalk.magenta('⏰ Daily reminder service is enabled.'));
        cron.schedule('50 22 * * *', async () => {
            console.log(chalk.bgGreen.white('🌅 Running daily reminder job...'));
            const message = await generateReminderMessage();
            for (const user of config.REMINDER_USERS) {
                const jid = user.trim() + "@s.whatsapp.net";
                try {
                    await sock.sendMessage(jid, { text: message });
                    console.log(chalk.green(`✅ Reminder sent to ${user}`));
                } catch (err) {
                    console.error(chalk.red(`❌ Failed to send reminder to ${user}:`), err);
                }
            }
        }, {
            scheduled: true,
            timezone: "Asia/Karachi"
        });
    }

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            // ======================================================
            // YEH HAI NAYA AUR SMART CODE
            // Agar session kharab (loggedOut) ya invalid (401) ho to session folder delete kar do
            // ======================================================
            if (statusCode === DisconnectReason.loggedOut || statusCode === DisconnectReason.connectionReplaced || statusCode === 401) {
                console.log(chalk.red("❌ Unrecoverable session error. Deleting session and restarting..."));
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
                // Bot ko aaram se restart hone do
                connectToWhatsApp();
            } else {
                 console.log(chalk.yellow("Connection closed, attempting to reconnect..."));
                 connectToWhatsApp();
            }
        } else if (connection === "open") {
            console.log(chalk.green("✅ Bot is online."));
        }
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("messages.upsert", (mek) => {
        try {
            const m = mek.messages[0];
            if (!m.message) return;
            botEvents.emit('new-message', { sock, m });
        } catch (err) { console.error(chalk.red("Error in messages.upsert:"), err); }
    });
}

app.get('/', (req, res) => res.send('MALIK-MD Bot is running!'));
app.listen(port, () => {
    console.log(chalk.blue(`🚀 Web server listening on port ${port}`));
    connectToWhatsApp().catch(err => console.error(chalk.red("❌ Bot failed to start:"), err));
});

