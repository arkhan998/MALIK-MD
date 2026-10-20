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

// --print filepath kuch sites (TikTok) par "NA" deta hai —
// is liye pehle ID, phir fixed naam, phir file dhoondna.
async function getVideoId(url) {
    try {
        const out = await runYtDlp(['--no-playlist', '--no-download', '--print', '%(id)s', url], 45000);
        const id = out.split('\n')[0].trim().replace(/[^\w-]/g, '');
        return id || String(Date.now());
    } catch (e) { return String(Date.now()); }
}

function findDownloaded(prefix) {
    return fs.readdirSync(os.tmpdir())
        .filter(f => f.startsWith(prefix + '.') && !f.endsWith('.part') && !f.endsWith('.ytdl'))
        .map(f => path.join(os.tmpdir(), f))[0];
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

            try {
                let file, title = '';
                const vid = await getVideoId(url);
                const prefix = `malikdl_${vid}`;
                const outTpl = path.join(os.tmpdir(), `${prefix}.%(ext)s`);
                if (wantAudio) {
                    await runYtDlp(['--no-playlist', '-x', '--audio-format', 'mp3', '--audio-quality', '0',
                        '-o', outTpl, url]);
                    file = findDownloaded(prefix);
                    if (!file) throw new Error('Downloaded file nahi mili.');
                    await sock.sendMessage(jid, { audio: fs.readFileSync(file), mimetype: 'audio/mpeg', fileName: path.basename(file) }, { quoted: m });
                } else {
                    await runYtDlp(['--no-playlist',
                        '-f', 'best[ext=mp4][filesize<60M]/best[filesize<60M]/best[ext=mp4]/best',
                        '-o', outTpl, url]);
                    file = findDownloaded(prefix);
                    if (!file) throw new Error('Downloaded file nahi mili.');
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
