// ======================================================
// PACK: INFO — define, wiki, country, ipinfo, joke, motivate
// (keyless public APIs + local motivation collection)
// ======================================================
const axios = require('axios');
const send = (sock, m, text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const QUOTES = [
    'Mehnat itni khamoshi se karo ke kamyabi shor macha de.',
    'Waqt sab ko milta hai zindagi badalne ke liye, zindagi dobara nahi milti waqt badalne ke liye.',
    'Jo ruk gaya, woh haar gaya — jo chalta raha, woh pohnach gaya.',
    'Kamyabi unhi ko milti hai jo girne ke baad uthna nahi bhoolte.',
    'Kal ka din behtar hoga, bas aaj haar mat maano.',
    'Chhote qadam bhi manzil tak le jate hain, agar rukna na aye.',
    'Apni qeemat khud bano, duniya to sirf istemal karti hai.',
    'Khwab woh nahi jo sote mein ayen, khwab woh hain jo sone na dein.',
    'Mushkil waqt hamesha nahi rehta, mushkil log bann jate hain jo guzar jate hain.',
    'Agar tum thak jao to araam karna seekho, rukna nahi.',
    'Har din ek naya mauqa hai — purani galti ko dohrane ka nahi, seekhne ka.',
    'Jeetne wale kabhi haar nahi maante, haarne wale kabhi jeet nahi paate.',
    'Apna muqabala sirf apne kal se karo.',
    'Sabr aur mehnat — yeh do cheezein taqdeer badal deti hain.',
    'Jo khud par yaqeen rakhta hai, duniya us par yaqeen karne lagti hai.'
];

module.exports = [
    {
        name: 'define',
        exec: async (sock, m, args) => {
            const word = (args[0] || '').trim().toLowerCase();
            if (!word) return send(sock, m, '📖 *Dictionary*\n\nExample: `.define success`\n(English lafz ka matlab)');
            try {
                const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 15000 });
                const e = data[0];
                const meaning = e.meanings?.[0];
                const def = meaning?.definitions?.[0];
                if (!def) throw new Error('no def');
                let out = `📖 *${e.word}* ${e.phonetic ? `(${e.phonetic})` : ''}\n\n_${meaning.partOfSpeech}_\n${def.definition}`;
                if (def.example) out += `\n\n📌 Example: _${def.example}_`;
                return send(sock, m, out);
            } catch (e) { return send(sock, m, `❌ "${word}" dictionary mein nahi mila.`); }
        }
    },
    {
        name: 'wiki',
        exec: async (sock, m, args) => {
            const q = args.join(' ').trim();
            if (!q) return send(sock, m, '🌐 *Wikipedia*\n\nExample: `.wiki Quaid e Azam`');
            try {
                const { data } = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/ /g, '_'))}`, { timeout: 15000, headers: { 'User-Agent': 'MALIK-MD bot' } });
                if (!data.extract) throw new Error('empty');
                return send(sock, m, `🌐 *${data.title}*\n\n${String(data.extract).slice(0, 900)}\n\n🔗 ${data.content_urls?.desktop?.page || ''}`);
            } catch (e) { return send(sock, m, `❌ "${q}" par Wikipedia article nahi mila.`); }
        }
    },
    {
        name: 'country',
        exec: async (sock, m, args) => {
            const q = args.join(' ').trim();
            if (!q) return send(sock, m, '🌍 *Country Info*\n\nExample: `.country Pakistan`');
            try {
                const { data } = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`, { timeout: 15000 });
                const c = data[0];
                const cur = c.currencies ? Object.values(c.currencies)[0] : null;
                const langs = c.languages ? Object.values(c.languages).join(', ') : '—';
                return send(sock, m, `🌍 *${c.name.common}* ${c.flag || ''}\n\n🏛️ Darul-hukumat: ${c.capital?.[0] || '—'}\n👥 Aabadi: ${c.population?.toLocaleString('en-PK') || '—'}\n💰 Currency: ${cur ? `${cur.name} (${cur.symbol || ''})` : '—'}\n🗣️ Zaban: ${langs}\n🗺️ Region: ${c.region}${c.subregion ? ' — ' + c.subregion : ''}`);
            } catch (e) { return send(sock, m, `❌ "${q}" nahi mila. English naam likho, maslan \`.country Japan\``); }
        }
    },
    {
        name: 'ipinfo',
        alias: ['ip'],
        exec: async (sock, m, args) => {
            const ip = (args[0] || '').trim();
            if (!ip) return send(sock, m, '🌐 *IP Info*\n\nExample: `.ipinfo 8.8.8.8`');
            try {
                const { data } = await axios.get(`http://ip-api.com/json/${encodeURIComponent(ip)}`, { timeout: 15000 });
                if (data.status !== 'success') throw new Error('fail');
                return send(sock, m, `🌐 *IP: ${data.query}*\n\n📍 ${data.city}, ${data.country}\n🏢 ISP: ${data.isp}\n🕐 Timezone: ${data.timezone}`);
            } catch (e) { return send(sock, m, '❌ IP ki malomat nahi mil sakein.'); }
        }
    },
    {
        name: 'joke',
        exec: async (sock, m, args) => {
            try {
                const { data } = await axios.get('https://official-joke-api.appspot.com/random_joke', { timeout: 15000 });
                return send(sock, m, `😂 ${data.setup}\n\n|| ${data.punchline} ||`);
            } catch (e) { return send(sock, m, '😂 Teacher: Tum late kyun aye?\nStudent: Sir, raaste mein board laga tha "Aage school hai, aahista chalein" — to main aahista chalta aya!'); }
        }
    },
    {
        name: 'motivate',
        alias: ['motivation'],
        exec: async (sock, m, args) => send(sock, m, `💪 *Aaj ki Motivation*\n\n"${pick(QUOTES)}"`)
    }
];
