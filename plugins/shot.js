const axios = require('axios');

// ======================================================
// SHOT — website screenshot (.screenshot <url> / .ss)
// Uses keyless Microlink API
// ======================================================

module.exports = {
    name: 'screenshot',
    aliases: ['ss', 'shot'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const url = (args[0] || '').trim();
        if (!url || !/^https?:\/\//i.test(url)) {
            return sock.sendMessage(jid, {
                text: `📸 *Website Screenshot*\n\n*Example:*\n.screenshot https://google.com\n\nURL http:// ya https:// se shuru hona chahiye.`
            }, { quoted: m });
        }
        try {
            const waiting = await sock.sendMessage(jid, { text: '📸 Screenshot le raha hun...' }, { quoted: m });
            const api = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false`;
            const res = await axios.get(api, { timeout: 30000 });
            const shotUrl = res.data?.data?.screenshot?.url;
            if (!shotUrl) throw new Error('no screenshot url');
            await sock.sendMessage(jid, {
                image: { url: shotUrl },
                caption: `📸 *${url}*`
            }, { quoted: m });
            await sock.sendMessage(jid, { text: '✅', edit: waiting.key });
        } catch (e) {
            console.error('screenshot error:', e.message);
            await sock.sendMessage(jid, {
                text: `❌ Screenshot nahi ban saka. URL check karo aur dobara try karo.\n\n*Example:* .ss https://google.com`
            }, { quoted: m });
        }
    }
};
