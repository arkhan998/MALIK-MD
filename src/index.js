import dotenv from 'dotenv';
dotenv.config();

import {
    makeWASocket,
    Browsers,
    jidDecode,
    makeInMemoryStore,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
    getAggregateVotesInPollMessage
} from '@whiskeysockets/baileys';
import { Handler, Callupdate, GroupUpdate } from './event/index.js';
import { Boom } from '@hapi/boom';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import NodeCache from 'node-cache';
import path from 'path';
import chalk from 'chalk';
import { writeFile } from 'fs/promises';
import moment from 'moment-timezone';
import axios from 'axios';
import fetch from 'node-fetch';
import * as os from 'os';
import config from '../config.cjs';
import pkg from '../lib/autoreact.cjs';
const { emojis, doReact } = pkg;

const app = express();
let initialConnection = true;
const PORT = process.env.PORT || 3000;

// Set up logger
const MAIN_LOGGER = pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
});
const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

async function downloadSessionData() {
    if (!process.env.SESSION_ID) {
        console.log('No SESSION_ID found in environment variables. Proceeding with QR code authentication...');
        return false;
    }
    const sessdata = process.env.SESSION_ID.split("Ethix-MD&")[1];
    const url = `https://pastebin.com/raw/${sessdata}`;
    try {
        const response = await axios.get(url);
        const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        await fs.promises.writeFile(credsPath, data);
        console.log("🔒 Session Successfully Loaded !!");
        return true;
    } catch (error) {
        console.error('Failed to download session data:', error);
        return false;
    }
}

async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`🤖 Bot using WA v${version.join('.')}, isLatest: ${isLatest}`);
        
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            browser: Browsers.baileys('Desktop'),
            auth: state,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg.message || undefined;
                }
                return { conversation: "Default message" };
            }
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed due to', lastDisconnect.error, ', reconnecting', shouldReconnect);
                if (shouldReconnect) {
                    start();
                }
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log("😃 Integration Successful️ ✅");
                    sock.sendMessage(sock.user.id, { text: `😃 Integration Successful️ ✅` });
                    initialConnection = false;
                } else {
                    console.log("♻️ Connection reestablished after restart.");
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on("messages.upsert", async chatUpdate => await Handler(chatUpdate, sock, logger));
        sock.ev.on("call", async (json) => await Callupdate(json, sock));
        sock.ev.on("group-participants.update", async (messag) => await GroupUpdate(sock, messag));

        if (config.MODE === "public") {
            sock.public = true;
        } else if (config.MODE === "private") {
            sock.public = false;
        }

        if (config.AUTO_REACT) {
            sock.ev.on('messages.upsert', async (chatUpdate) => {
                try {
                    const mek = chatUpdate.messages[0];
                    if (!mek.key.fromMe) {
                        console.log(mek);
                        if (mek.message) {
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            await doReact(randomEmoji, mek, sock);
                        }
                    }
                } catch (err) {
                    console.error('Error during auto reaction:', err);
                }
            });
        }
    } catch (err) {
        console.error('Failed to start WhatsApp bot:', err);
    }
}

async function init() {
    if (fs.existsSync(credsPath)) {
        await start();
    } else {
        const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) {
            await start();
        } else {
            console.log('Session data not available, QR code will be printed for authentication.');
            await start();
        }
    }
}

init();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
