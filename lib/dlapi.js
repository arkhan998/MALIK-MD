// ======================================================
// DLAPI — Multi-source downloader engine
// Har platform ke liye kayi providers line mein lage hain:
// pehla fail ho to agla khud try hota hai. Fail honay wali
// API 10 minute ke liye "cooldown" mein chali jati hai taa ke
// har request par mari hui API waqt zaya na kare.
// Provider ka kam sirf: url -> { type:'video'|'audio'|'image', mediaUrl, title?, thumbnail? }
// ======================================================
const axios = require('axios');

const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const deadUntil = new Map(); // name -> timestamp (cooldown khatam honay ka waqt)
const COOLDOWN_MS = 10 * 60 * 1000;

async function getJSON(url, timeout = 30000) {
    const { data } = await axios.get(url, { timeout, headers: { 'User-Agent': UA }, maxRedirects: 5 });
    return data;
}

function bestQualityUrl(downloads) {
    if (!Array.isArray(downloads)) return null;
    const vids = downloads.filter(d => d && d.url && (d.type === 'video' || !d.type));
    if (!vids.length) return null;
    const score = (d) => {
        const q = String(d.quality || '');
        const m = q.match(/(\d{3,4})\s*p/i);
        let s = m ? parseInt(m[1], 10) : 0;
        if (/hd/i.test(q)) s += 5;
        return s;
    };
    vids.sort((a, b) => score(b) - score(a));
    return vids[0].url;
}

// ---------------- PROVIDERS ----------------
// Har provider: { name, platform, fetch(url) -> result|null }
const PROVIDERS = [
    // FACEBOOK
    {
        name: 'siputzx-fb', platform: 'facebook',
        fetch: async (url) => {
            const d = await getJSON(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`);
            if (!d || d.status !== true || !d.data) return null;
            const media = bestQualityUrl(d.data.downloads);
            if (!media) return null;
            return { type: 'video', mediaUrl: media, title: d.data.title || 'Facebook Video', thumbnail: d.data.thumbnail || null };
        }
    },
    // TWITTER / X
    {
        name: 'siputzx-tw', platform: 'twitter',
        fetch: async (url) => {
            const d = await getJSON(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(url)}`);
            if (!d || d.status !== true || !d.data) return null;
            if (d.data.downloadLink) return { type: 'video', mediaUrl: d.data.downloadLink, title: d.data.videoTitle || 'Twitter Video' };
            if (d.data.imgUrl) return { type: 'image', mediaUrl: d.data.imgUrl, title: d.data.videoTitle || 'Twitter' };
            return null;
        }
    },
    // TIKTOK (tikwm — proven)
    {
        name: 'tikwm', platform: 'tiktok',
        fetch: async (url) => {
            const d = await getJSON(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
            if (!d || d.code !== 0 || !d.data) return null;
            const media = d.data.hdplay || d.data.play;
            if (!media) return null;
            return { type: 'video', mediaUrl: media, title: d.data.title || 'TikTok Video', thumbnail: d.data.cover || null };
        }
    },
    // INSTAGRAM (akuari — naya seedha address; purana api.akuari.my.id yahi redirect karta hai)
    {
        name: 'akuari-ig', platform: 'instagram',
        fetch: async (url) => {
            const d = await getJSON(`https://rest-api.akuari.my.id/downloader/igdl?link=${encodeURIComponent(url)}`);
            if (!d) return null;
            if (Array.isArray(d.result) && d.result[0] && d.result[0].url) {
                const u = d.result[0].url;
                return { type: /\.mp4(\?|$)/i.test(u) ? 'video' : 'image', mediaUrl: u, title: 'Instagram' };
            }
            if (d.result && d.result.url) return { type: 'video', mediaUrl: d.result.url, title: 'Instagram' };
            return null;
        }
    },
    // PINTEREST (akuari — naya seedha address)
    {
        name: 'akuari-pin', platform: 'pinterest',
        fetch: async (url) => {
            const d = await getJSON(`https://rest-api.akuari.my.id/downloader/pinterest?link=${encodeURIComponent(url)}`);
            if (!d || !d.respon) return null;
            const u = d.respon;
            return { type: /\.mp4(\?|$)/i.test(u) ? 'video' : 'image', mediaUrl: u, title: 'Pinterest' };
        }
    },
    // YOUTUBE: koi verified free API nahi mili (2026-10-25 test) — .dl/.song (yt-dlp) hi rasta hai
    // SNAPCHAT: koi zinda free API nahi mili (2026-10-25 test, ~50 endpoints) — source milte hi yahan add hoga
];

// Platform ke providers ko bari bari try karo — cooldown walay skip
async function download(platform, url) {
    const list = PROVIDERS.filter(p => p.platform === platform);
    const errors = [];
    for (const p of list) {
        const until = deadUntil.get(p.name) || 0;
        if (Date.now() < until) { errors.push(`${p.name}: cooldown`); continue; }
        try {
            const res = await p.fetch(url);
            if (res && res.mediaUrl) return { ...res, source: p.name };
            errors.push(`${p.name}: empty`);
            deadUntil.set(p.name, Date.now() + COOLDOWN_MS);
        } catch (e) {
            errors.push(`${p.name}: ${String(e.message || e).slice(0, 60)}`);
            deadUntil.set(p.name, Date.now() + COOLDOWN_MS);
        }
    }
    const err = new Error(`All ${platform} sources failed`);
    err.details = errors;
    throw err;
}

// Buffer mein media lao (WhatsApp par bhejne ke liye, 64MB cap)
async function fetchBuffer(mediaUrl, timeout = 120000) {
    const resp = await axios.get(mediaUrl, {
        responseType: 'arraybuffer', timeout, maxContentLength: 64 * 1024 * 1024,
        headers: { 'User-Agent': UA }, maxRedirects: 5
    });
    return Buffer.from(resp.data);
}

module.exports = { download, fetchBuffer, PROVIDERS, _deadUntil: deadUntil };
