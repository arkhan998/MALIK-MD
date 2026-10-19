// ======================================================
// TEXT-TO-SPEECH — .tts [lang] <text>
// Google Translate TTS (no API key). Default lang: en
// ======================================================

const CHUNK = 180;

function splitChunks(text, max) {
    const words = text.split(/\s+/);
    const chunks = [];
    let cur = '';
    for (const w of words) {
        if ((cur + ' ' + w).trim().length > max) {
            if (cur) chunks.push(cur.trim());
            cur = w;
        } else {
            cur = (cur + ' ' + w).trim();
        }
    }
    if (cur) chunks.push(cur.trim());
    return chunks.length ? chunks : [text.slice(0, max)];
}

module.exports = {
    name: 'tts',
    aliases: ['speak'],
    exec: async (sock, m, args) => {
        try {
            if (!args.length) {
                return sock.sendMessage(m.key.remoteJid, {
                    text: `❌ Usage: .tts [lang] <text>\nExample: .tts hello world\nExample: .tts ur assalam o alaikum`
                }, { quoted: m });
            }

            let lang = 'en';
            let text = args.join(' ');
            // pehla arg agar 2-letter language code hai to lang samjho
            if (args.length > 1 && /^[a-z]{2}(-[a-z]{2})?$/i.test(args[0])) {
                lang = args[0].toLowerCase();
                text = args.slice(1).join(' ');
            }
            if (!text.trim()) {
                return sock.sendMessage(m.key.remoteJid, { text: '❌ Koi text to likho! 😅' }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, { text: `🔊 *Generating voice...* (${lang})` }, { quoted: m });

            const chunks = splitChunks(text, CHUNK);
            const buffers = [];
            for (const c of chunks) {
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(c)}`;
                const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' } });
                if (!res.ok) throw new Error(`TTS request failed (${res.status})`);
                buffers.push(Buffer.from(await res.arrayBuffer()));
            }

            const audio = Buffer.concat(buffers);
            await sock.sendMessage(m.key.remoteJid, {
                audio: audio,
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m });
        } catch (e) {
            console.error('tts error:', e.message);
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Voice generate nahi ho saki. Dobara try karo.' }, { quoted: m });
        }
    }
};
