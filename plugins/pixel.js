const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const API = 'https://ahm7xmakki.com/api';
const RATIOS = ['1:1','16:9','9:16','4:3','3:4','2:1','1:2','3:2','2:3','4:5','5:4'];

async function quotedImageBase64(sock, m) {
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage;
    if (!quoted) return { error: '❌ Kisi *photo* par reply karke ye command chalao.' };
    const imgMsg = quoted.imageMessage;
    if (!imgMsg) return { error: '❌ Reply wali message mein photo nahi hai.' };
    try {
        const buf = await downloadMediaMessage({ key: m.key, message: { imageMessage: imgMsg } }, 'buffer', {});
        return { base64: buf.toString('base64') };
    } catch (e) {
        return { error: '❌ Photo download nahi ho saki, dobara try karo.' };
    }
}

function parseRatio(args) {
    let ratio = '1:1';
    if (args[0] && RATIOS.includes(args[0])) ratio = args.shift();
    return { ratio, prompt: args.join(' ') };
}

const pixel = {
    name: 'px',
    aliases: ['pixel', 'pxtoi'],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const { ratio, prompt } = parseRatio([...args]);
            if (!prompt) return sock.sendMessage(jid, { text: '🎨 *PixelSter AI Image*\n\n*.px <prompt>*\n*.px 9:16 <prompt>*\n\n_Ratios: 1:1, 16:9, 9:16, 4:3, 3:4_\n\n*Example:*\n.px 9:16 a warrior in desert storm' }, { quoted: m });
            const wait = await sock.sendMessage(jid, { text: '🎨 _Generating image..._' }, { quoted: m });
            try {
                const { data } = await axios.post(`${API}/tti`, { prompt, ratio }, { timeout: 120000 });
                if (!data.success || !data.imageUrl) throw new Error('API ne image nahi di.');
                await sock.sendMessage(jid, { image: { url: data.imageUrl }, caption: `🎨 *${prompt}*\n> _Powered by PixelSter x MALIK-MD_` }, { quoted: m });
                await sock.sendMessage(jid, { react: { text: '✅', key: wait.key } });
            } catch (e) {
                await sock.sendMessage(jid, { text: `❌ Image nahi ban saki. Thori der baad try karo.`, edit: wait.key });
            }
        } catch (e) { console.error('px error:', e.message); }
    }
};

const pxi = {
    name: 'pximg',
    aliases: ['pxtoi2', 'pxedit'],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const prompt = args.join(' ');
            if (!prompt) return sock.sendMessage(jid, { text: '🖼️ *PixelSter Image-to-Image*\n\nKisi photo par reply karke:\n*.pximg <prompt>*\n\n*Example:*\n.pximg make it cyberpunk' }, { quoted: m });
            const q = await quotedImageBase64(sock, m);
            if (q.error) return sock.sendMessage(jid, { text: q.error }, { quoted: m });
            const wait = await sock.sendMessage(jid, { text: '🖼️ _Transforming image..._' }, { quoted: m });
            try {
                const { data } = await axios.post(`${API}/pti`, { prompt, imageBase64: q.base64 }, { timeout: 180000, maxBodyLength: Infinity });
                if (!data.success || !data.imageUrl) throw new Error('API ne image nahi di.');
                await sock.sendMessage(jid, { image: { url: data.imageUrl }, caption: `🖼️ *${prompt}*\n> _Powered by PixelSter x MALIK-MD_` }, { quoted: m });
                await sock.sendMessage(jid, { react: { text: '✅', key: wait.key } });
            } catch (e) {
                await sock.sendMessage(jid, { text: `❌ Transform nahi ho saka. Thori der baad try karo.`, edit: wait.key });
            }
        } catch (e) { console.error('pximg error:', e.message); }
    }
};

const pxv = {
    name: 'pxvid',
    aliases: ['pxtov'],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const { ratio, prompt } = parseRatio([...args]);
            if (!prompt) return sock.sendMessage(jid, { text: '🎬 *PixelSter Image-to-Video*\n\nKisi photo par reply karke:\n*.pxvid <prompt>*\n*.pxvid 9:16 <prompt>*\n\n*Example:*\n.pxvid 9:16 the character walks slowly' }, { quoted: m });
            const q = await quotedImageBase64(sock, m);
            if (q.error) return sock.sendMessage(jid, { text: q.error }, { quoted: m });
            const wait = await sock.sendMessage(jid, { text: '🎬 _Generating video... (1-2 min lag sakte hain)_' }, { quoted: m });
            try {
                const { data } = await axios.post(`${API}/ptv`, { prompt, ratio, duration: 8, imageBase64: q.base64 }, { timeout: 300000, maxBodyLength: Infinity });
                if (!data.success || !data.videoUrl) throw new Error('API ne video nahi di.');
                await sock.sendMessage(jid, { video: { url: data.videoUrl }, caption: `🎬 *${prompt}*\n> _Powered by PixelSter x MALIK-MD_` }, { quoted: m });
                await sock.sendMessage(jid, { react: { text: '✅', key: wait.key } });
            } catch (e) {
                await sock.sendMessage(jid, { text: `❌ Video nahi ban saki. Thori der baad try karo.`, edit: wait.key });
            }
        } catch (e) { console.error('pxvid error:', e.message); }
    }
};

module.exports = [pixel, pxi, pxv];
