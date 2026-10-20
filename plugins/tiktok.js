const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ======================================================
// TIKTOK DOWNLOADER — yt-dlp based (purani dead API hata di)
// .tiktok <link>       -> video (bina watermark)
// .tiktok <link> mp3   -> sirf audio
// Note: --print filepath TikTok par "NA" deta hai aur
// download ruk jata hai — is liye pehle ID le kar fixed
// naam par download karte hain, phir file dhoondte hain.
// ======================================================

function runYtDlp(args, timeoutMs = 180000) {
    return new Promise((resolve, reject) => {
        execFile('yt-dlp', args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || err.message).slice(0, 300)));
            resolve(stdout.trim());
        });
    });
}

const command = {
    name: "tiktok",
    alias: ["tik", "ttdl"],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        try {
            const link = args[0];
            const wantAudio = (args[1] || '').toLowerCase() === 'mp3';

            if (!link || !link.includes('tiktok.com')) {
                return sock.sendMessage(jid, {
                    text: '🎵 *TikTok Downloader*\n\n*.tiktok <link>* — video (bina watermark)\n*.tiktok <link> mp3* — sirf audio\n\nExample:\n`.tiktok https://vt.tiktok.com/xxxx/`'
                }, { quoted: m });
            }

            // yt-dlp available?
            try {
                await runYtDlp(['--version'], 15000);
            } catch (e) {
                return sock.sendMessage(jid, { text: '❌ *yt-dlp not installed*\n\nServer par ye command chalao:\n`pip3 install -U yt-dlp`' }, { quoted: m });
            }

            const waitMsg = await sock.sendMessage(jid, { text: wantAudio ? '🎧 _TikTok audio download ho raha hai..._' : '🎵 _TikTok video download ho raha hai..._' }, { quoted: m });

            try {
                // 1) ID + title/uploader
                let title = '', uploader = '', vid = '';
                try {
                    const info = await runYtDlp(['--no-playlist', '--no-download', '--print', '%(id)s|%(title)s|%(uploader)s', link], 45000);
                    const parts = info.split('\n')[0].split('|');
                    vid = (parts[0] || '').replace(/[^\w-]/g, '');
                    title = parts[1] || ''; uploader = parts[2] || '';
                } catch (e) { /* ignore */ }
                if (!vid) vid = String(Date.now());

                // 2) Fixed naam par download
                const prefix = `maliktt_${vid}`;
                const outTpl = path.join(os.tmpdir(), `${prefix}.%(ext)s`);
                const dlArgs = wantAudio
                    ? ['--no-playlist', '-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', outTpl, link]
                    : ['--no-playlist', '-f', 'download/b[ext=mp4]/best[ext=mp4]/best', '-o', outTpl, link];
                await runYtDlp(dlArgs);

                // 3) File dhoondo
                const file = fs.readdirSync(os.tmpdir())
                    .filter(f => f.startsWith(prefix + '.') && !f.endsWith('.part') && !f.endsWith('.ytdl'))
                    .map(f => path.join(os.tmpdir(), f))[0];
                if (!file) throw new Error('Downloaded file nahi mili.');

                if (wantAudio) {
                    await sock.sendMessage(jid, {
                        audio: fs.readFileSync(file),
                        mimetype: 'audio/mpeg',
                        fileName: path.basename(file)
                    }, { quoted: m });
                } else {
                    const stat = fs.statSync(file);
                    if (stat.size > 64 * 1024 * 1024) {
                        try { fs.unlinkSync(file); } catch (e) {}
                        return sock.sendMessage(jid, { text: '❌ Video bohat bari hai (64MB+), WhatsApp par nahi bhej sakta.', edit: waitMsg.key });
                    }
                    const caption = `🎵 *TikTok Video Downloaded*\n` +
                        (uploader ? `\n👤 *User:* ${uploader}` : '') +
                        (title ? `\n📖 *Title:* ${title}` : '') +
                        `\n\n_Powered by MALIK-MD_`;
                    await sock.sendMessage(jid, { video: fs.readFileSync(file), caption, mimetype: 'video/mp4' }, { quoted: m });
                }
                try { fs.unlinkSync(file); } catch (e) {}
                await sock.sendMessage(jid, { text: '✅ _Done!_', edit: waitMsg.key });
            } catch (e) {
                console.error('tiktok error:', e.message);
                await sock.sendMessage(jid, { text: `❌ Download failed.\n_${e.message}_\n\n_Private video ya region-lock ho to download nahi hoti._`, edit: waitMsg.key });
            }
        } catch (e) { console.error('tiktok cmd error:', e.message); }
    }
};

module.exports = command;
