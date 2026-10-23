// ======================================================
// PACK: MEDIA TOOLS — toimg (sticker→photo), tomp3
// (video→audio, ffmpeg chahiye), compress (photo halki)
// ======================================================
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const send = (sock, m, text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });

function quotedMsg(m) {
    const ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || {};
    const q = ctx.quotedMessage;
    if (!q) return null;
    return { key: { remoteJid: m.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant }, message: q };
}
module.exports = [
    {
        name: 'toimg',
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const q = quotedMsg(m);
            if (!q?.message?.stickerMessage) return send(sock, m, '🖼️ Kisi *sticker* par reply karke `.toimg` likho — photo ban jayegi.');
            try {
                const buf = await downloadMediaMessage(q, 'buffer', {}, { reuploadRequest: s => s });
                await sock.sendMessage(jid, { image: buf, caption: '🖼️ Sticker → Photo (MALIK-MD)' }, { quoted: m });
            } catch (e) { return send(sock, m, '❌ Sticker download nahi ho saka.'); }
        }
    },
    {
        name: 'tomp3',
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const q = quotedMsg(m);
            if (!q?.message?.videoMessage) return send(sock, m, '🎵 Kisi *video* par reply karke `.tomp3` likho — sirf awaz (mp3) mil jayegi.');
            const tmpIn = path.join(os.tmpdir(), `malik_in_${Date.now()}.mp4`);
            const tmpOut = tmpIn.replace('.mp4', '.mp3');
            try {
                const buf = await downloadMediaMessage(q, 'buffer', {}, { reuploadRequest: s => s });
                fs.writeFileSync(tmpIn, buf);
                await new Promise((res, rej) => execFile('ffmpeg', ['-y', '-i', tmpIn, '-vn', '-codec:a', 'libmp3lame', '-q:a', '4', tmpOut], { timeout: 120000 }, (e) => e ? rej(e) : res()));
                await sock.sendMessage(jid, { audio: fs.readFileSync(tmpOut), mimetype: 'audio/mpeg' }, { quoted: m });
            } catch (e) {
                return send(sock, m, '❌ Convert nahi ho saka — is system par *ffmpeg* installed nahi lagta. (Codespace mein: `sudo apt install ffmpeg` ya mujhe batao, main aur tareeqa kar dun)');
            } finally { try { fs.unlinkSync(tmpIn); } catch (e) {} try { fs.unlinkSync(tmpOut); } catch (e) {} }
        }
    },
    {
        name: 'compress',
        exec: async (sock, m, args) => {
            const jid = m.key.remoteJid;
            const q = quotedMsg(m);
            if (!q?.message?.imageMessage) return send(sock, m, '🗜️ Kisi *photo* par reply karke `.compress` likho — halki (chhoti size) photo milegi, DP/status ke liye behtareen.');
            try {
                const buf = await downloadMediaMessage(q, 'buffer', {}, { reuploadRequest: s => s });
                const sharp = require('sharp');
                const out = await sharp(buf).resize({ width: 1080, withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer();
                const kb = (b) => Math.round(b.length / 1024);
                await sock.sendMessage(jid, { image: out, caption: `🗜️ Compress ho gayi: ${kb(buf)} KB → *${kb(out)} KB*` }, { quoted: m });
            } catch (e) { return send(sock, m, '❌ Photo process nahi ho saki.'); }
        }
    }
];
