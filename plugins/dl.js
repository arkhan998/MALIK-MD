const { execFile } = require('child_process');
const axios = require('axios');
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

// TikTok links Codespace/datacenter IPs par yt-dlp se redirect
// ho kar fail hote hain — unke liye pehle tikwm API (proven).
async function viaTikwmDl(sock, m, url, wantAudio) {
    const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
    const { data } = await axios.get(api, { timeout: 45000 });
    if (!data || data.code !== 0 || !data.data) throw new Error('tikwm API failed');
    const d = data.data;
    const jid = m.key.remoteJid;

    const downloadBuffer = async (u) => {
        const resp = await axios.get(u, {
            responseType: 'arraybuffer', timeout: 120000,
            maxContentLength: 64 * 1024 * 1024,
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36' }
        });
        return Buffer.from(resp.data);
    };

    if (wantAudio) {
        if (!d.music) throw new Error('Music link nahi mila');
        const buf = await downloadBuffer(d.music);
        await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mpeg', fileName: 'tiktok-audio.mp3' }, { quoted: m });
    } else {
        const videoUrl = d.hdplay || d.play;
        if (!videoUrl) throw new Error('Video link nahi mila');
        const buf = await downloadBuffer(videoUrl);
        const title = (d.title || 'No Title').slice(0, 200);
        const author = d.author?.nickname || 'Unknown';
        const username = d.author?.unique_id ? `@${d.author.unique_id}` : '-';
        const caption = `╭━━〔 🎵 *TIKTOK* 〕━━┈⊷
┃❖ 🎵 *TITLE:* ${title}
┃❖ 👤 *AUTHOR:* ${author}
┃❖ ⚡ *USERNAME:* ${username}
┃❖ 📥 *STATUS:* DOWNLOADED ✓
╰━━〔 ⚡ *ENJOY* 〕━━┈⊷
> © MALIK-MD`;
        await sock.sendMessage(jid, { video: buf, caption, mimetype: 'video/mp4' }, { quoted: m });
    }
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

            const waitMsg = await sock.sendMessage(jid, { text: '⏳ _Downloading..._' }, { quoted: m });

            // TikTok? Pehle tikwm — yt-dlp wahan aksar redirect-fail hota hai
            if (url.includes('tiktok.com')) {
                try {
                    await viaTikwmDl(sock, m, url, wantAudio);
                    return sock.sendMessage(jid, { text: '✅ _Done!_', edit: waitMsg.key });
                } catch (e) {
                    console.error('dl tikwm failed, yt-dlp try:', e.message);
                }
            }

            // yt-dlp available?
            try {
                await runYtDlp(['--version'], 15000);
            } catch (e) {
                return sock.sendMessage(jid, { text: '❌ *yt-dlp not installed*\n\nServer par is ki binary lagao (pip is Codespace mein nahi hai).', edit: waitMsg.key });
            }

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
