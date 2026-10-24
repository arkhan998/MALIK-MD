const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config.js');

// ======================================================
// PAIR SYSTEM — bot ke andar se hi link device
// .pair 923xxxxxxxxx  -> 8-digit pairing code milta hai
// .qrpair             -> QR code ki photo ati hai, scan karo
//
// Pair ho jane par creds owner ke Mega par upload hokar
// SESSION_ID (MALIK-MD~...) usi chat mein aa jata hai.
// Sirf DM mein chalta hai (group mein code sab ko dikhega).
// Ek user ka ek waqt mein ek hi session; 4 minute expiry.
// MEGA_EMAIL / MEGA_PASSWORD env na ho to creds.json file
// bhej di jati hai taa ke kaam ruke nahi.
// ======================================================

const baileys = require('@whiskeysockets/baileys');
const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;

const ROOT = path.join(__dirname, '..', 'data', 'pair-sessions');
if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true });

const active = new Map(); // requesterJid -> token
const sessions = new Map(); // token -> rec
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const send = (sock, jid, text, extra = {}) => sock.sendMessage(jid, { text, ...extra });

async function uploadToMega(phone, buffer) {
    const email = process.env.MEGA_EMAIL || config.MEGA_EMAIL;
    const password = process.env.MEGA_PASSWORD || config.MEGA_PASSWORD;
    if (!email || !password) return null;
    const { Storage } = require('megajs');
    const storage = await new Promise((resolve, reject) => {
        const s = new Storage({ email, password }, (err) => err ? reject(err) : resolve(s));
    });
    const name = `malik-md-creds-${phone || 'qr'}.json`;
    const file = await new Promise((resolve, reject) => {
        storage.upload(name, buffer).complete((err, f) => err ? reject(err) : resolve(f));
    });
    const link = await file.link();
    try { storage.close?.(); } catch (e) {}
    const mm = link.match(/mega\.nz\/file\/([^#]+)#(.+)$/);
    if (!mm) return null;
    return `MALIK-MD~${mm[1]}#${mm[2]}`;
}

function cleanup(token, why) {
    const rec = sessions.get(token);
    if (!rec) return;
    clearTimeout(rec.timeout);
    try { rec.sock?.ws?.close(); } catch (e) {}
    try { rec.sock?.end?.(); } catch (e) {}
    try { fs.rmSync(rec.dir, { recursive: true, force: true }); } catch (e) {}
    if (active.get(rec.requester) === token) active.delete(rec.requester);
    sessions.delete(token);
}

function launch(rec) {
    const sock = makeWASocket({
        version: rec.version,
        auth: rec.state,
        printQRInTerminal: false,
        browser: ['MALIK-MD Session', 'Chrome', '1.0'],
        syncFullHistory: false,
        markOnlineOnConnect: false,
    });
    sock.ev.on('creds.update', rec.saveCreds);
    rec.sock = sock;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && rec.mode === 'qr' && !rec.done) {
            const now = Date.now();
            if (now - (rec.lastQrSent || 0) > 15000) {
                rec.lastQrSent = now;
                try {
                    const QRCode = require('qrcode');
                    const dataUrl = await QRCode.toDataURL(qr, { width: 512, margin: 2 });
                    const imgBuf = Buffer.from(dataUrl.split(',')[1], 'base64');
                    await rec.mainSock.sendMessage(rec.requester, {
                        image: imgBuf,
                        caption: '📷 *MALIK-MD QR Pairing*\n\nDoosre phone par WhatsApp kholo → Settings → Linked Devices → Link a Device → ye QR scan kar lo.\n⏰ QR har ~20 sec mein badal jata hai — naya QR khud aa jayega, jo screen par hai wahi scan karo.'
                    });
                } catch (e) { /* agla QR aa jayega */ }
            }
        }

        if (connection === 'open' && !rec.done) {
            rec.done = true;
            await sleep(800);
            try {
                const buffer = fs.readFileSync(path.join(rec.dir, 'creds.json'));
                const sessionId = await uploadToMega(rec.phone, buffer).catch(() => null);
                if (sessionId) {
                    await send(rec.mainSock, rec.requester,
`✅ *PAIRING KAMYAB!*

Tumhara SESSION_ID:
\`${sessionId}\`

Isay apne bot ki settings (SESSION_ID) mein lagao.
⚠️ Ye tumhare WhatsApp ka login hai — kisi se share mat karo!`);
                } else {
                    await rec.mainSock.sendMessage(rec.requester, {
                        document: buffer,
                        fileName: 'creds.json',
                        mimetype: 'application/json',
                        caption: '✅ *PAIRING KAMYAB!*\n\nYe tumhari session file (creds.json) hai. SESSION_ID auto-banane ke liye bot owner ko MEGA_EMAIL / MEGA_PASSWORD set karna hoga — filhal ye file sambhal kar rakho aur owner ko bata do.'
                    });
                }
            } catch (e) {
                await send(rec.mainSock, rec.requester, '⚠️ Pair ho gaya tha lekin session save nahi ho saka. Dobara try karo.');
            }
            cleanup(rec.token, 'done');
        }

        if (connection === 'close' && !rec.done) {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code === DisconnectReason.loggedOut) {
                await send(rec.mainSock, rec.requester, '❌ Pairing cancel/logged out ho gayi. Dobara .pair ya .qrpair try karo.');
                cleanup(rec.token, 'logged out');
            } else if (code === DisconnectReason.restartRequired) {
                // Pairing ke baad WhatsApp ka lazmi restart — error nahi hai
                rec.reconnects = (rec.reconnects || 0) + 1;
                if (rec.reconnects <= 3) {
                    try { sock.ws?.close(); } catch (e) {}
                    launch(rec);
                }
            }
        }
    });
    return sock;
}

async function startSession(mainSock, requester, mode, phone) {
    if (active.has(requester)) {
        return send(mainSock, requester, '⏳ Tumhara ek pairing session pehle se chal raha hai. Us ke khatam (4 min) ka intezar karo ya thori dair baad try karo.');
    }
    const token = crypto.randomBytes(4).toString('hex');
    const dir = path.join(ROOT, token);
    fs.mkdirSync(dir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

    const rec = {
        token, dir, state, saveCreds, version, mode, phone,
        requester, mainSock, sock: null, done: false, reconnects: 0, lastQrSent: 0,
        timeout: setTimeout(async () => {
            if (!rec.done) await send(mainSock, requester, '⏰ Pairing ka waqt (4 min) khatam ho gaya. Dobara .pair / .qrpair likho.');
            cleanup(token, 'timeout');
        }, 4 * 60 * 1000)
    };
    sessions.set(token, rec);
    active.set(requester, token);
    launch(rec);
    return rec;
}

const pairCmd = {
    name: 'pair',
    alias: ['paircode', 'linkcode'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        if (jid.endsWith('@g.us')) {
            return send(sock, jid, '🔒 Pairing sirf *DM* (private chat) mein hoti hai — group mein code sab ko dikh jayega. Bot ko DM mein .pair likho.');
        }
        const phone = String(args[0] || '').replace(/\D/g, '');
        if (!/^\d{10,15}$/.test(phone)) {
            return send(sock, jid, '📱 *Pairing Code*\n\nFormat: `.pair 923xxxxxxxxx`\nNumber country code ke sath, baghair + aur 0 ke.\n\nYa QR se pair karna ho to `.qrpair` likho.');
        }
        try {
            const rec = await startSession(sock, jid, 'code', phone);
            if (!rec) return;
            // Handshake pura hone do, phir code mango (warna Connection Closed)
            await sleep(3000);
            let code, lastErr;
            for (let i = 0; i < 3; i++) {
                try { code = await rec.sock.requestPairingCode(phone); break; }
                catch (e) { lastErr = e; if (!/connection closed/i.test(e.message)) break; await sleep(2500); }
            }
            if (!code) {
                cleanup(rec.token, 'code failed');
                return send(sock, jid, '❌ Code nahi ban saka: ' + (lastErr?.message || 'unknown') + '\nThori dair baad dobara try karo, ya .qrpair use karo.');
            }
            const pretty = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
            return send(sock, jid,
`🔑 *MALIK-MD PAIRING CODE*

\`${pretty}\`

Steps:
1️⃣ Jis number ko pair karna hai us ka WhatsApp kholo
2️⃣ Settings → Linked Devices → Link a Device
3️⃣ "Link with phone number instead" chuno
4️⃣ Upar wala code dal do

⏰ Code 4 minute ke andar use kar lena. Pair hote hi SESSION_ID yahi aa jayega.`);
        } catch (e) {
            console.error('pair error:', e.message);
            return send(sock, jid, '❌ Pairing start nahi ho saki. Dobara try karo.');
        }
    }
};

const qrpairCmd = {
    name: 'qrpair',
    alias: ['pairqr', 'qrscan'],
    exec: async (sock, m) => {
        const jid = m.key.remoteJid;
        if (jid.endsWith('@g.us')) {
            return send(sock, jid, '🔒 QR pairing sirf *DM* mein hoti hai. Bot ko DM mein .qrpair likho.');
        }
        try {
            await send(sock, jid, '📷 QR ban raha hai — chand second mein photo ayegi, usi ko scan kar lena...');
            await startSession(sock, jid, 'qr', null);
        } catch (e) {
            console.error('qrpair error:', e.message);
            return send(sock, jid, '❌ QR pairing start nahi ho saki. Dobara try karo.');
        }
    }
};

module.exports = [pairCmd, qrpairCmd];
