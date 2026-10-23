// ======================================================
// PACK: TEXT TOOLS — fancy, repeat, reverse, base64, hash, case
// ======================================================
const crypto = require('crypto');
const send = (sock, m, text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });

// Fancy unicode styles
const STYLES = {
    bold: { map: (c) => ({ a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠', h: '𝐡', i: '𝐢', j: '𝐣', k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧', o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮', v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳', A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆', H: '𝐇', I: '𝐈', J: '𝐉', K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍', O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓', U: '𝐔', V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙' }[c] || c) },
    script: { map: (c) => ({ a: '𝒶', b: '𝒷', c: '𝒸', d: '𝒹', e: 'ℯ', f: '𝒻', g: 'ℊ', h: '𝒽', i: '𝒾', j: '𝒿', k: '𝓀', l: '𝓁', m: '𝓂', n: '𝓃', o: 'ℴ', p: '𝓅', q: '𝓆', r: '𝓇', s: '𝓈', t: '𝓉', u: '𝓊', v: '𝓋', w: '𝓌', x: '𝓍', y: '𝓎', z: '𝓏', A: '𝒜', B: 'ℬ', C: '𝒞', D: '𝒟', E: 'ℰ', F: 'ℱ', G: '𝒢', H: 'ℋ', I: 'ℐ', J: '𝒥', K: '𝒦', L: 'ℒ', M: 'ℳ', N: '𝒩', O: '𝒪', P: '𝒫', Q: '𝒬', R: 'ℛ', S: '𝒮', T: '𝒯', U: '𝒰', V: '𝒱', W: '𝒲', X: '𝒳', Y: '𝒴', Z: '𝒵' }[c] || c) },
    circled: { map: (c) => { const lower = 'abcdefghijklmnopqrstuvwxyz'; const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; if (lower.includes(c)) return String.fromCodePoint(0x24D0 + lower.indexOf(c)); if (upper.includes(c)) return String.fromCodePoint(0x24B6 + upper.indexOf(c)); return c; } },
    small: { map: (c) => ({ a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ' }[(c || '').toLowerCase()] || c) }
};

module.exports = [
    {
        name: 'fancy',
        exec: async (sock, m, args) => {
            const style = (args[0] || '').toLowerCase();
            if (!STYLES[style] || !args[1]) {
                const sample = 'Malik';
                let out = '✨ *Fancy Text Generator*\n\nExample: `.fancy bold Apna Naam`\n\nStyles:\n';
                for (const [name, s] of Object.entries(STYLES)) out += `• *${name}* → ${[...sample].map(s.map).join('')}\n`;
                return send(sock, m, out.trim());
            }
            const styled = [...args.slice(1).join(' ')].map(STYLES[style].map).join('');
            return send(sock, m, styled);
        }
    },
    {
        name: 'repeat',
        exec: async (sock, m, args) => {
            const n = parseInt(args[0]);
            const text = args.slice(1).join(' ').trim();
            if (!n || n < 1 || n > 20 || !text) return send(sock, m, '🔁 *Repeat*\n\nExample: `.repeat 5 Shukriya`\n(1–20 dafa, phir text)');
            return send(sock, m, Array(n).fill(text).join('\n'));
        }
    },
    {
        name: 'reverse',
        exec: async (sock, m, args) => {
            const text = args.join(' ').trim();
            if (!text) return send(sock, m, '🔃 *Reverse Text*\n\nExample: `.reverse Lahore`');
            return send(sock, m, [...text].reverse().join(''));
        }
    },
    {
        name: 'base64',
        exec: async (sock, m, args) => {
            const mode = (args[0] || '').toLowerCase();
            const text = args.slice(1).join(' ');
            if ((mode !== 'en' && mode !== 'de') || !text) return send(sock, m, '🔣 *Base64*\n\nEncode: `.base64 en Hello`\nDecode: `.base64 de SGVsbG8=`');
            try {
                const out = mode === 'en' ? Buffer.from(text, 'utf8').toString('base64') : Buffer.from(text, 'base64').toString('utf8');
                return send(sock, m, out);
            } catch (e) { return send(sock, m, '❌ Galat input hai.'); }
        }
    },
    {
        name: 'hash',
        exec: async (sock, m, args) => {
            const text = args.join(' ').trim();
            if (!text) return send(sock, m, '🔑 *Hash Generator*\n\nExample: `.hash mera secret text`\n(MD5 + SHA256 fingerprint banta hai)');
            const md5 = crypto.createHash('md5').update(text).digest('hex');
            const sha = crypto.createHash('sha256').update(text).digest('hex');
            return send(sock, m, `🔑 *Hash*\n\nMD5: \`${md5}\`\n\nSHA256: \`${sha}\``);
        }
    },
    {
        name: 'case',
        exec: async (sock, m, args) => {
            const mode = (args[0] || '').toLowerCase();
            const text = args.slice(1).join(' ');
            if (!['upper', 'lower', 'title'].includes(mode) || !text) return send(sock, m, '🔠 *Text Case*\n\n`.case upper hello world`\n`.case lower HELLO`\n`.case title mera naam malik hai`');
            const out = mode === 'upper' ? text.toUpperCase() : mode === 'lower' ? text.toLowerCase() : text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
            return send(sock, m, out);
        }
    }
];
