import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { File } from 'megajs';
import chalk from "chalk";
import config from "./config.js";
import botEvents from './lib/events.js';

// Handler ko yahan import karna zaroori hai taake woh events sun'na shuru kar de
import './handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const sessionPath = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
}

// Mega.nz se session download karne ka function
async function downloadSession() {
    // ... (yeh function bilkul wesa hi rahega)
    console.log(chalk.yellow("📥 Attempting to download session from Mega.nz..."));
    if (!config.SESSION_ID) {
        console.error(chalk.red("❌ Error: SESSION_ID not found."));
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
    console.log(chalk.blue("ℹ️ Session file already exists."));
    return true;
}

let initialConnection = true; // Yeh flag check karega ke pehli baar connect hua hai ya nahi

// Bot ko start karne ka function
async function startMalikBot() {
    const sessionDownloaded = await downloadSession();
    if (!sessionDownloaded) {
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
            initialConnection = true; // Reconnect par flag reset karna
            if (shouldReconnect) {
                startMalikBot();
            }
        } else if (connection === "open") {
            console.log(chalk.green("✅ Integration Successful! Bot is online."));

            // **Yahan Naya Feature Add Kiya Gaya Hai**
            // Agar pehli baar connect hua hai, to owner ko message bhejo
            if (initialConnection) {
                const ownerJid = config.OWNER_NUMBER + "@s.whatsapp.net";
                const connectMsg = `*🚀 MALIK-MD Bot Connected!*

Bot has successfully connected and is now online.

❖ *Mode:* ${config.MODE}
❖ *Prefix:* ${config.prefix}
❖ *Owner:* ${config.OWNER_NAME}

To see all commands, type:
\`${config.prefix}menu\``;

                sock.sendMessage(ownerJid, { text: connectMsg });
                initialConnection = false; // Flag ko false kar do taake dobara message na jaye
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Message aane par event announce karna
    sock.ev.on("messages.upsert", (mek) => {
        try {
            const m = mek.messages[0];
            if (!m.message || m.key.fromMe) return;
            botEvents.emit('new-message', {
                sock,
                m
            });
        } catch (err) {
            console.error(chalk.red("Error in messages.upsert event:"), err);
        }
    });

    // ... (Baaki saara code bilkul wesa hi rahega)
}

startMalikBot();

app.get('/', (req, res) => res.send('MALIK-MD Bot is running!'));
app.listen(port, () => console.log(chalk.blue(`🚀 Server is listening on port ${port}`)));

