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

function runYtDlp(args, timeoutMs = 180000) {
    return new Promise((resolve, reject) => {
        execFile('yt-dlp', ['--js-runtimes', 'node', ...args], { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || err.message).slice(0, 300)));
            resolve(stdout.trim());
        });
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
