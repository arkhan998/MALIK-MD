const dlapi = require('../lib/dlapi.js');

// ======================================================
// SOCIALDL — Facebook aur Twitter/X downloader
// lib/dlapi.js ke multi-source engine par chalta hai:
// ek API mare to agli khud lag jati hai, mari hui API
// 10 minute cooldown mein rehti hai.
// ======================================================

async function runDownload(sock, m, url, platform, label, emoji) {
    const jid = m.key.remoteJid;
    const wait = await sock.sendMessage(jid, { text: `⏳ _${label} se download ho raha hai... sources try kar raha hun_` }, { quoted: m });
    try {
        const res = await dlapi.download(platform, url);
        const caption = `${emoji} *${res.title || label}*\n📥 _via ${res.source} — MALIK-MD_`;
        try {
            const buf = await dlapi.fetchBuffer(res.mediaUrl);
            const payload = res.type === 'image'
                ? { image: buf, caption }
                : { video: buf, caption, mimetype: 'video/mp4' };
            await sock.sendMessage(jid, payload, { quoted: m });
        } catch (e) {
            // Buffer na aye to direct URL se bhejna try karo
            const payload = res.type === 'image'
                ? { image: { url: res.mediaUrl }, caption }
                : { video: { url: res.mediaUrl }, caption, mimetype: 'video/mp4' };
            await sock.sendMessage(jid, payload, { quoted: m });
        }
        await sock.sendMessage(jid, { text: '✅ _Done!_', edit: wait.key });
    } catch (e) {
        console.error(`socialdl ${platform}:`, e.details ? e.details.join(' | ') : e.message);
        await sock.sendMessage(jid, { text: `❌ *Download fail ho gaya*\n\nSab sources ne jawab nahi diya. Link public hai to thodi dair baad dobara try karo — private/login wali posts download nahi hotin.`, edit: wait.key });
    }
}

const fbCmd = {
    name: 'fb',
    alias: ['fbdl', 'facebook'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const url = (args[0] || '').trim();
        if (!url) {
            return sock.sendMessage(jid, { text: '📘 *Facebook Downloader*\n\n*.fb <facebook video/reel link>*\n\n*Example:*\n.fb https://www.facebook.com/watch?v=xxxx\n.fb https://fb.watch/xxxx' }, { quoted: m });
        }
        if (!/facebook\.com|fb\.watch/.test(url)) {
            return sock.sendMessage(jid, { text: '❌ Ye Facebook ka link nahi lagta. Sahi wala FB video/reel link bhejo.' }, { quoted: m });
        }
        return runDownload(sock, m, url, 'facebook', 'Facebook', '📘');
    }
};

const twCmd = {
    name: 'twitter',
    alias: ['tw', 'xdl', 'tweet'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const url = (args[0] || '').trim();
        if (!url) {
            return sock.sendMessage(jid, { text: '🐦 *Twitter / X Downloader*\n\n*.twitter <tweet link>*\n\n*Example:*\n.twitter https://x.com/user/status/123456' }, { quoted: m });
        }
        if (!/twitter\.com|x\.com/.test(url)) {
            return sock.sendMessage(jid, { text: '❌ Ye Twitter/X ka link nahi lagta. Tweet ka sahi link bhejo.' }, { quoted: m });
        }
        return runDownload(sock, m, url, 'twitter', 'Twitter/X', '🐦');
    }
};

module.exports = [fbCmd, twCmd];
