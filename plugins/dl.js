const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function runYtDlp(args, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
        execFile('yt-dlp', args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || err.message).slice(0, 300)));
            resolve(stdout.trim());
        });
    });
}

function cleanUrl(input) {
    try {
        const u = new URL(input);
        if (!['http:', 'https:'].includes(u.protocol)) return null;
        return u.toString();
    } catch (e) { return null; }
}

module.exports = {
    name: 'dl',
    aliases: ['download', 'ydl'],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const rawUrl = args[0];
            const wantAudio = (args[1] || '').toLowerCase() === 'mp3';

            const url = rawUrl ? cleanUrl(rawUrl) : null;
            if (!url) {
                return sock.sendMessage(jid, {
                    text: '📥 *Universal Downloader*\n\n*.dl <link>* — video download\n*.dl <link> mp3* — audio only\n\n_Supports: YouTube, TikTok, Instagram, Facebook, X/Twitter, Reddit, Dailymotion + 1000 more_\n\n*Example:*\n.dl https://www.tiktok.com/@user/video/123'
                }, { quoted: m });
            }

            // yt-dlp available?
            try {
                await runYtDlp(['--version'], 15000);
            } catch (e) {
                return sock.sendMessage(jid, { text: '❌ *yt-dlp not installed*\n\nServer par ye command chalao:\n`pip install -U yt-dlp`' }, { quoted: m });
            }

            const waitMsg = await sock.sendMessage(jid, { text: '⏳ _Downloading..._' }, { quoted: m });
            const outTpl = path.join(os.tmpdir(), `malikdl_%(id)s.%(ext)s`);

            try {
                let file, title = '';
                if (wantAudio) {
                    const out = await runYtDlp(['--no-playlist', '-x', '--audio-format', 'mp3', '--audio-quality', '0',
                        '-o', outTpl, '--print', 'filepath', url]);
                    const lines = out.split('\n');
                    file = lines[lines.length - 1];
                    await sock.sendMessage(jid, { audio: fs.readFileSync(file), mimetype: 'audio/mpeg', fileName: path.basename(file) }, { quoted: m });
                } else {
                    const out = await runYtDlp(['--no-playlist',
                        '-f', 'best[ext=mp4][filesize<60M]/best[filesize<60M]/best[ext=mp4]/best',
                        '-o', outTpl, '--print', 'filepath', url]);
                    const lines = out.split('\n');
                    file = lines[lines.length - 1];
                    const stat = fs.statSync(file);
                    if (stat.size > 64 * 1024 * 1024) {
                        fs.unlinkSync(file);
                        return sock.sendMessage(jid, { text: '❌ File bohat bari hai (64MB+), WhatsApp par nahi bhej sakta.' }, { quoted: m });
                    }
                    await sock.sendMessage(jid, { video: fs.readFileSync(file), caption: `🎬 *Downloaded via MALIK-MD*`, mimetype: 'video/mp4' }, { quoted: m });
                }
                try { fs.unlinkSync(file); } catch (e) {}
                await sock.sendMessage(jid, { text: '✅ _Done!_', edit: waitMsg.key });
            } catch (e) {
                console.error('dl error:', e.message);
                await sock.sendMessage(jid, { text: `❌ Download failed.\n_${e.message}_\n\n_Private/deleted ya login-wali posts download nahi hoti._`, edit: waitMsg.key });
            }
        } catch (e) { console.error('dl cmd error:', e.message); }
    }
};
