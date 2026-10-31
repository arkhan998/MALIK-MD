const axios = require('axios');
const botEvents = require('../lib/events.js');
const config = require('../config.js');

// 📲 APK Downloader — Play Store style apps seedha WhatsApp par
// Source: Aptoide public API (muft, koi key nahi) — 2026-10-31 live-verified.
// APKPure Cloudflare se band hai, is liye wahi source rakha jo asal mein chalta hai.
// Flow: .apk <naam> -> top 5 list -> user sirf number likhe -> app hazir.
// 80 MB tak file seedha document ban kar; zyada bari app ka direct link.

const API = 'https://ws75.aptoide.com/api/7/apps/search';
const MAX_FILE = 80 * 1024 * 1024;
const SESSION_MS = 5 * 60 * 1000;
const sessions = new Map(); // "jid|sender" -> { list, ts }

const senderOf = (m, jid) => jid.endsWith('@g.us') ? (m.key.participant || m.participant || jid) : jid;
const mb = (b) => (b / (1024 * 1024)).toFixed(1) + ' MB';
const shortNum = (n) => n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B+' : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M+' : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K+' : '' + n;

async function searchApps(query) {
    const { data } = await axios.get(API, {
        params: { query, limit: 5 },
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) MALIK-MD' }
    });
    const list = (data && data.datalist && data.datalist.list) || [];
    return list.filter(a => a && a.file && a.file.path);
}

function detailsText(app) {
    const f = app.file;
    const size = f.filesize || app.size || 0;
    const rating = app.stats && app.stats.prating && app.stats.prating.avg;
    const downloads = app.stats && app.stats.downloads;
    let t = `📱 *${app.name}*\n`;
    t += `🏷️ Package: ${app.package}\n`;
    t += `🔢 Version: ${f.vername || '-'}\n`;
    t += `💾 Size: ${size ? mb(size) : '-'}\n`;
    if (downloads) t += `⬇️ Downloads: ${shortNum(downloads)}\n`;
    if (rating) t += `⭐ Rating: ${rating}\n`;
    if (f.malware && f.malware.rank === 'TRUSTED') t += `🛡️ Scan: Trusted ✅\n`;
    t += `\n_Powered by MALIK-MD_`;
    return t;
}

async function sendApp(sock, m, app) {
    const jid = m.key.remoteJid;
    const f = app.file;
    const size = f.filesize || app.size || 0;
    const details = detailsText(app);

    if (size && size <= MAX_FILE) {
        await sock.sendMessage(jid, { text: `⏳ *${app.name}* download ho rahi hai (${mb(size)})...` }, { quoted: m });
        const res = await axios.get(f.path, { responseType: 'arraybuffer', timeout: 180000, maxRedirects: 5 });
        const buf = Buffer.from(res.data);
        return sock.sendMessage(jid, {
            document: buf,
            mimetype: 'application/vnd.android.package-archive',
            fileName: `${app.package}.apk`,
            caption: details
        }, { quoted: m });
    }
    // Bari app — file ki bajaye seedha link (Codespace se 80MB+ bhejna sust/risky hai)
    return sock.sendMessage(jid, { text: `${details}\n\n🔗 *Download link* (size bari hai, link se le lo):\n${f.path}` }, { quoted: m });
}

// Number reply — .apk ki list ke baad user sirf "1".."5" likhe to app bhej do
botEvents.on('new-message', async ({ sock, m }) => {
    try {
        if (!m || !m.message) return;
        const jid = m.key.remoteJid;
        if (!jid || jid === 'status@broadcast') return;
        const body = (m.message.conversation || m.message.extendedTextMessage?.text || '').trim();
        if (!/^\d+$/.test(body) || body.startsWith(config.prefix)) return;

        const key = jid + '|' + senderOf(m, jid);
        const s = sessions.get(key);
        if (!s) return;
        if (Date.now() - s.ts > SESSION_MS) { sessions.delete(key); return; }
        const idx = parseInt(body, 10) - 1;
        if (idx < 0 || idx >= s.list.length) return;
        sessions.delete(key);
        await sendApp(sock, m, s.list[idx]);
    } catch (e) {
        console.error('apk select error:', e.message);
    }
});

module.exports = [{
    name: 'apk',
    alias: ['playstore'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();
        try {
            if (!query) {
                return sock.sendMessage(jid, { text: '📲 *APK Downloader*\n\nPlay Store style apps seedha WhatsApp par.\n\n*Example:*\n`.apk whatsapp`\n`.apk pubg mobile`\n\nList ayegi — sirf number likhna, app bhej dunga. 80 MB tak file, zyada bari ka link.' }, { quoted: m });
            }
            await sock.sendMessage(jid, { text: `🔎 *"${query}"* dhoondh raha hun...` }, { quoted: m });
            const list = await searchApps(query);
            if (!list.length) {
                return sock.sendMessage(jid, { text: `❌ "${query}" naam ki koi app nahi mili. Naam dobara check karke likho.` }, { quoted: m });
            }
            sessions.set(jid + '|' + senderOf(m, jid), { list, ts: Date.now() });
            let t = `📲 *"${query}" ke top results:*\n\n`;
            list.forEach((a, i) => {
                const size = a.file.filesize || a.size || 0;
                t += `*${i + 1}.* ${a.name} — ${size ? mb(size) : ''} · v${a.file.vername || '-'}\n`;
            });
            t += `\n👉 Sirf *number* likho (1-${list.length}) — app bhej dunga. (5 minute ke andar)`;
            return sock.sendMessage(jid, { text: t }, { quoted: m });
        } catch (e) {
            console.error('apk error:', e.message);
            return sock.sendMessage(jid, { text: '❌ APK source abhi jawab nahi de raha. Thodi der baad dobara try karo.' }, { quoted: m });
        }
    }
}];
