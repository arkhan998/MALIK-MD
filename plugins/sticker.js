const { Sticker, StickerTypes } = require('wa-sticker-formatter');

// ======================================================
// STICKER — .sticker
// 1) Photo/short video par reply karo  -> us ka sticker
// 2) .sticker <text>                   -> ANIMATED sticker:
//    rang badalti hui bold text (ATTP style), bilkul offline
//    sharp se frames bante hain, koi API nahi.
// ======================================================

const FRAME_COLORS = ['#FF3355', '#FF8A00', '#FFD500', '#22CC66', '#00BBFF', '#BB55FF'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function splitLines(text) {
    const t = text.trim().replace(/\s+/g, ' ');
    if (t.length <= 10) return [t];
    const words = t.split(' ');
    if (words.length === 1) return [t.slice(0, 12), t.slice(12, 24)].filter(Boolean);
    const lines = [''];
    for (const w of words) {
        const cur = lines[lines.length - 1];
        if ((cur + ' ' + w).trim().length <= 10 || !cur) lines[lines.length - 1] = (cur + ' ' + w).trim();
        else if (lines.length < 2) lines.push(w);
        else lines[lines.length - 1] = (lines[1] + ' ' + w).trim().slice(0, 14);
    }
    return lines.slice(0, 2);
}

async function animatedTextSticker(text) {
    const sharp = require('sharp');
    const lines = splitLines(text);
    const longest = Math.max(...lines.map(l => l.length), 1);
    const fs = Math.max(52, Math.min(150, Math.floor(470 / (longest * 0.60))));
    const lineH = fs * 1.12;
    const yStart = 256 - ((lines.length - 1) * lineH) / 2;

    const frames = [];
    for (let i = 0; i < FRAME_COLORS.length; i++) {
        const rot = i % 2 === 0 ? -2 : 2;
        const texts = lines.map((ln, li) =>
            `<text x="256" y="${Math.round(yStart + li * lineH)}" font-size="${fs}" fill="${FRAME_COLORS[i]}" stroke="#ffffff" stroke-width="${Math.max(6, fs / 9)}" paint-order="stroke" stroke-linejoin="round" text-anchor="middle" dominant-baseline="middle" font-family="DejaVu Sans, sans-serif" font-weight="900">${esc(ln)}</text>`
        ).join('');
        const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(${rot} 256 256)">${texts}</g></svg>`;
        frames.push(await sharp(Buffer.from(svg)).png().toBuffer());
    }

    // Frames ko ffmpeg (libwebp_anim) se animated WebP mein jodo.
    // ffmpeg na mile to pehla frame hi static sticker ban jayega —
    // command kabhi fail nahi hoga.
    const fsmod = require('fs');
    const os = require('os');
    const path = require('path');
    const { execFile } = require('child_process');
    const dir = fsmod.mkdtempSync(path.join(os.tmpdir(), 'asticker-'));
    try {
        frames.forEach((f, i) => fsmod.writeFileSync(path.join(dir, `frame${String(i).padStart(2, '0')}.png`), f));
        const out = path.join(dir, 'out.webp');
        await new Promise((resolve, reject) => {
            execFile('ffmpeg', ['-y', '-framerate', '8', '-i', path.join(dir, 'frame%02d.png'),
                '-c:v', 'libwebp_anim', '-q:v', '72', '-loop', '0', '-an', out],
                { timeout: 25000 }, (err) => err ? reject(err) : resolve());
        });
        return fsmod.readFileSync(out);
    } catch (e) {
        return sharp(frames[0]).webp({ quality: 80 }).toBuffer();
    } finally {
        try { fsmod.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    }
}

async function sendTextSticker(sock, m, rawText) {
    const jid = m.key.remoteJid;
    const text = (rawText || '').trim().slice(0, 26);
    if (!text) {
        return sock.sendMessage(jid, { text: '✍️ *Text Sticker*\n\nFormat: `.sticker Malik`\nJo text likho ge, rang badalta animated sticker ban jayega.\n\nYa kisi photo/video par reply karke `.sticker` likho.' }, { quoted: m });
    }
    try {
        const webp = await animatedTextSticker(text);
        const sticker = new Sticker(webp, { pack: 'MALIK-MD', author: 'By Malik', type: StickerTypes.FULL, quality: 80 });
        const msg = await sticker.toMessage();
        // Formatter kabhi animation flatten kar de to raw webp hi bhej do
        const out = msg.sticker || webp;
        const meta = await require('sharp')(out).metadata().catch(() => null);
        if (meta && (meta.pages || 1) > 1) return sock.sendMessage(jid, msg, { quoted: m });
        return sock.sendMessage(jid, { sticker: webp }, { quoted: m });
    } catch (e) {
        console.error('text sticker error:', e.message);
        return sock.sendMessage(jid, { text: '❌ Sticker nahi ban saka. Dobara koshish karo.' }, { quoted: m });
    }
}

const stickerCmd = {
    name: "sticker",
    alias: ["s"],
    exec: async (sock, m, args) => {
        const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        // Text mode: koi quoted media nahi aur text likha hai
        if ((!quotedMessage || (!quotedMessage.imageMessage && !quotedMessage.videoMessage)) && args.join(' ').trim()) {
            return sendTextSticker(sock, m, args.join(' '));
        }
        try {
            if (!quotedMessage || (!quotedMessage.imageMessage && !quotedMessage.videoMessage)) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please reply to an image or a short video to create a sticker — ya `.sticker <text>` likho, animated text sticker ban jayega." }, { quoted: m });
            }

            // Sticker ka naam aur author set karna
            const [packname, author] = (args.join(' ') || "MALIK-MD|By Malik").split('|');

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎨 Creating your sticker..." }, { quoted: m });

            const media = await sock.downloadMediaMessage({ key: m.key, message: m.message.extendedTextMessage.contextInfo.quotedMessage });

            const sticker = new Sticker(media, {
                pack: packname,
                author: author,
                type: StickerTypes.FULL,
                quality: 50
            });

            await sock.sendMessage(m.key.remoteJid, await sticker.toMessage(), { quoted: m });
            await sock.sendMessage(m.key.remoteJid, { delete: waitingMsg.key });

        } catch (error) {
            console.error("Error in sticker command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to create sticker. The video might be too long (max 10 seconds)." }, { quoted: m });
        }
    }
};

const attpCmd = {
    name: 'attp',
    alias: ['tsticker', 'textsticker'],
    exec: async (sock, m, args) => sendTextSticker(sock, m, args.join(' '))
};

module.exports = [stickerCmd, attpCmd];
