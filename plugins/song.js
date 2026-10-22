const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config.js');

// ======================================================
// SONG — naam likho, YouTube se mp3 (yt-dlp)
// .song <song name>  ya  .song <youtube link>
// (Purani vihangayt API mar chuki thi — hata di)
// ======================================================

function ytCookiesArgs() {
    try {
        const candidates = [
            process.env.YT_COOKIES_FILE,
            path.join(__dirname, '..', 'data', 'yt-cookies.txt'),
            path.join(__dirname, '..', 'yt-cookies.txt')
        ].filter(Boolean);
        for (const p of candidates) { if (fs.existsSync(p)) return ['--cookies', p]; }
    } catch (e) {}
    return [];
}

function runYtDlpOnce(args, timeoutMs) {
    return new Promise((resolve, reject) => {
        execFile('yt-dlp', ['--js-runtimes', 'node:' + process.execPath, ...ytCookiesArgs(), ...args], { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) {
                const rawErr = String(stderr || err.message || '');
                const errLines = rawErr.split('\n').filter(l => /ERROR/i.test(l));
                return reject(new Error((errLines.length ? errLines.join(' ') : rawErr.slice(-300)).slice(0, 300)));
            }
            resolve(stdout.trim());
        });
    });
}

function runYtDlp(args, timeoutMs = 180000) {
    return runYtDlpOnce(args, timeoutMs).catch(err => {
        // YouTube ka IP bot-check aye to ek dafa android_vr client se dobara koshish
        if (/Sign in to confirm/i.test(err.message) && !args.includes('--extractor-args')) {
            return runYtDlpOnce([...args, '--extractor-args', 'youtube:player_client=android_vr'], timeoutMs);
        }
        throw err;
    });
}
module.exports = {
    name: "song",
    alias: ["ytmp3", "ytaudio"],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        try {
            const query = args.join(' ').trim();
            if (!query) {
                return sock.sendMessage(jid, { text: `🎶 *Song Downloader*\n\nUsage: \`${config.prefix}song <song name>\`\nExample: \`${config.prefix}song alan walker faded\`` }, { quoted: m });
            }

            // yt-dlp available?
            try { await runYtDlp(['--version'], 15000); }
            catch (e) {
                return sock.sendMessage(jid, { text: '❌ *yt-dlp not installed*\n\nCodespace mein is ki binary lagani hogi.' }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(jid, { text: `🎶 Searching for "${query}"...` }, { quoted: m });

            try {
                const isUrl = /^https?:\/\//i.test(query);
                const target = isUrl ? query : `ytsearch1:${query}`;

                // Pehle ID + title
                let vid = '', title = query;
                try {
                    const info = await runYtDlp(['--no-playlist', '--no-download', '--print', '%(id)s|%(title)s', target], 60000);
                    const parts = info.split('\n')[0].split('|');
                    vid = (parts[0] || '').replace(/[^\w-]/g, '');
                    if (parts[1]) title = parts[1];
                } catch (e) { /* ignore */ }
                if (!vid) vid = String(Date.now());

                // Phir fixed naam par audio download
                const prefix = `maliksong_${vid}`;
                const outTpl = path.join(os.tmpdir(), `${prefix}.%(ext)s`);
                await runYtDlp(['--no-playlist', '-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', outTpl, target]);

                const file = fs.readdirSync(os.tmpdir())
                    .filter(f => f.startsWith(prefix + '.') && !f.endsWith('.part') && !f.endsWith('.ytdl'))
                    .map(f => path.join(os.tmpdir(), f))[0];
                if (!file) throw new Error('Downloaded file nahi mili.');

                try {
                    const stat = fs.statSync(file);
                    if (stat.size > 64 * 1024 * 1024) throw new Error('File bohat bari hai (64MB+).');
                    await sock.sendMessage(jid, {
                        audio: fs.readFileSync(file),
                        mimetype: 'audio/mpeg',
                        fileName: `${title.slice(0, 60)}.mp3`
                    }, { quoted: m });
                    await sock.sendMessage(jid, { text: `🎵 *${title}*\n\n_Powered by MALIK-MD_` }, { quoted: m });
                } finally {
                    try { fs.unlinkSync(file); } catch (e) {}
                }
                await sock.sendMessage(jid, { delete: waitingMsg.key });
            } catch (e) {
                console.error('song error:', e.message);
                await sock.sendMessage(jid, { text: `❌ Sorry, "${query}" download nahi ho saka.\n_${e.message}_`, edit: waitingMsg.key });
            }
        } catch (error) {
            console.error("Error in song command:", error.message);
        }
    }
};
