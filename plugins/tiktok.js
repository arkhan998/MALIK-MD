const axios = require('axios');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ======================================================
// TIKTOK DOWNLOADER
// .tiktok <link>       -> video (bina watermark)
// .tiktok <link> mp3   -> sirf audio
// Engine 1: tikwm API (fast + region-block nahi)
// Engine 2: yt-dlp (backup)
// ======================================================

function runYtDlp(args, timeoutMs = 180000) {
    return new Promise((resolve, reject) => {
        execFile('yt-dlp', args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || err.message).slice(0, 300)));
            resolve(stdout.trim());
        });
    });
}

function fancyCaption(d) {
    const title = (d.title || 'No Title').slice(0, 200);
    const author = d.author?.nickname || 'Unknown';
    const username = d.author?.unique_id ? `@${d.author.unique_id}` : '-';
    return `╭━━〔 🎵 *TIKTOK* 〕━━┈⊷
┃❖ 🎵 *TITLE:* ${title}
┃❖ 👤 *AUTHOR:* ${author}
┃❖ ⚡ *USERNAME:* ${username}
┃❖ 📥 *STATUS:* DOWNLOADED ✓
╰━━〔 ⚡ *ENJOY* 〕━━┈⊷
> © MALIK-MD`;
}

async function downloadBuffer(url) {
    const resp = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: 64 * 1024 * 1024,
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36' }
    });
    return Buffer.from(resp.data);
}

// ---------- Engine 1: tikwm ----------
async function viaTikwm(sock, m, link, wantAudio) {
    const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(link)}&hd=1`;
    const { data } = await axios.get(api, { timeout: 45000 });
    if (!data || data.code !== 0 || !data.data) throw new Error('tikwm API failed');
    const d = data.data;

    if (wantAudio) {
        if (!d.music) throw new Error('Music link nahi mila');
        const buf = await downloadBuffer(d.music);
        await sock.sendMessage(m.key.remoteJid, { audio: buf, mimetype: 'audio/mpeg', fileName: 'tiktok-audio.mp3' }, { quoted: m });
    } else {
        const videoUrl = d.hdplay || d.play;
        if (!videoUrl) throw new Error('Video link nahi mila');
        const buf = await downloadBuffer(videoUrl);
        await sock.sendMessage(m.key.remoteJid, { video: buf, caption: fancyCaption(d), mimetype: 'video/mp4' }, { quoted: m });
    }
}

// ---------- Engine 2: yt-dlp (backup) ----------
async function viaYtDlp(sock, m, link, wantAudio, waitMsg) {
    try { await runYtDlp(['--version'], 15000); }
    catch (e) { throw new Error('yt-dlp not installed — `pip3 install -U yt-dlp` ya binary lagao'); }

    let title = '', uploader = '', vid = '';
    try {
        const info = await runYtDlp(['--no-playlist', '--no-download', '--print', '%(id)s|%(title)s|%(uploader)s', link], 45000);
        const parts = info.split('\n')[0].split('|');
        vid = (parts[0] || '').replace(/[^\w-]/g, '');
        title = parts[1] || ''; uploader = parts[2] || '';
    } catch (e) { /* ignore */ }
    if (!vid) vid = String(Date.now());

    const prefix = `maliktt_${vid}`;
    const outTpl = path.join(os.tmpdir(), `${prefix}.%(ext)s`);
    const dlArgs = wantAudio
        ? ['--no-playlist', '-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', outTpl, link]
        : ['--no-playlist', '-f', 'download/b[ext=mp4]/best[ext=mp4]/best', '-o', outTpl, link];
    await runYtDlp(dlArgs);

    const file = fs.readdirSync(os.tmpdir())
        .filter(f => f.startsWith(prefix + '.') && !f.endsWith('.part') && !f.endsWith('.ytdl'))
        .map(f => path.join(os.tmpdir(), f))[0];
    if (!file) throw new Error('Downloaded file nahi mili.');

    try {
        if (wantAudio) {
            await sock.sendMessage(m.key.remoteJid, { audio: fs.readFileSync(file), mimetype: 'audio/mpeg', fileName: path.basename(file) }, { quoted: m });
        } else {
            const stat = fs.statSync(file);
            if (stat.size > 64 * 1024 * 1024) throw new Error('Video bohat bari hai (64MB+), WhatsApp par nahi bhej sakta.');
            const caption = `🎵 *TikTok Video Downloaded*\n` +
                (uploader ? `\n👤 *User:* ${uploader}` : '') +
                (title ? `\n📖 *Title:* ${title}` : '') +
                `\n\n_Powered by MALIK-MD_`;
            await sock.sendMessage(m.key.remoteJid, { video: fs.readFileSync(file), caption, mimetype: 'video/mp4' }, { quoted: m });
        }
    } finally {
        try { fs.unlinkSync(file); } catch (e) {}
    }
}

const command = {
    name: "tiktok",
    alias: ["tik", "ttdl"],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        try {
            // Poore message se pehla TikTok link nikalo (share text bhi chalega)
            const raw = args.join(' ');
            const match = raw.match(/https?:\/\/[^\s]*tiktok[^\s]*/i);
            const link = match ? match[0] : null;
            const wantAudio = /\bmp3\b/i.test(raw);

            if (!link) {
                return sock.sendMessage(jid, {
                    text: '🎵 *TikTok Downloader*\n\n*.tiktok <link>* — video (bina watermark)\n*.tiktok <link> mp3* — sirf audio\n\nExample:\n`.tiktok https://vt.tiktok.com/xxxx/`'
                }, { quoted: m });
            }

            const waitMsg = await sock.sendMessage(jid, { text: wantAudio ? '🎧 _TikTok audio download ho raha hai..._' : '🎵 _TikTok video download ho raha hai..._' }, { quoted: m });

            try {
                await viaTikwm(sock, m, link, wantAudio);
            } catch (e1) {
                console.error('tikwm failed, trying yt-dlp:', e1.message);
                try {
                    await viaYtDlp(sock, m, link, wantAudio, waitMsg);
                } catch (e2) {
                    console.error('tiktok error:', e2.message);
                    return sock.sendMessage(jid, { text: `❌ Download failed.\n_${e2.message}_\n\n_Video ka sahi link bhejo (profile/channel ka link nahi chalega)._`, edit: waitMsg.key });
                }
            }
            await sock.sendMessage(jid, { text: '✅ _Done!_', edit: waitMsg.key });
        } catch (e) { console.error('tiktok cmd error:', e.message); }
    }
};

module.exports = command;
