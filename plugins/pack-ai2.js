// ======================================================
// PACK: AI HELPERS 2 — Gemini powered public tools
// grammar, explain (samjhao), tldr, kahani, nazm,
// fixcode, interviewq, cvtip, ideagen, translate
// ======================================================
const axios = require('axios');
const config = require('../config');
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });

async function askGemini(prompt) {
    if (!config.GEMINI_API_KEY) return null;
    try {
        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${config.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { timeout: 30000 }
        );
        return res.data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || null;
    } catch { return null; }
}
const AI = (name, alias, instruction, label, example) => ({ name, alias, exec: async (sock, m, args) => {
    const t = args.join(' '); if (!t) return send(sock, m, `🤖 Kuch likho!\nExample: .${name} ${example}`);
    const out = await askGemini(`${instruction}\n\nUser input: ${t}\n\nJawab Roman Urdu/English mix mein, short aur saaf do.`);
    return send(sock, m, out ? `${label}\n\n${out}` : '🤖 AI abhi available nahi (API key set/check karo). Thodi der baad try karo.');
} });

module.exports = [
    AI('grammar', ['fixgrammar'], 'Is text ki English grammar aur spelling theek karo. Sirf corrected version + neeche ek line mein batao kya theek kiya:', '✍️ *Corrected:*', 'i goes to market yesterday'),
    AI('explain', ['samjhao'], 'Is topic ko aise samjhao jese 10 saal ke bachay ko samjha rahe ho — aasan misal ke sath, 5-6 lines mein:', '🧒 *Aasan Zaban Mein:*', 'bijli kese banti hai'),
    AI('tldr', ['shortsummary'], 'Is lambe text ka khulasa (TL;DR) 3-4 lines mein do — asal points sirf:', '📝 *Khulasa:*', '<lambe text paste karo>'),
    AI('kahani', ['story'], 'Is topic par ek chhoti si dilchasp kahani likho (150 words tak), Roman Urdu mein:', '📖 *Kahani:*', 'ek gareeb ladka aur us ka sapna'),
    AI('nazm', ['poemai'], 'Is topic par 4-6 ashaar ki khoobsurat nazm/poetry likho, Roman Urdu mein:', '🖋️ *Nazm:*', 'maa ki mohabbat'),
    AI('fixcode', ['codefix'], 'Is code ko dekho, ghalti batao aur theek karke do. Pehle 1 line mein masla, phir fixed code:', '💻 *Code Fix:*', 'function add(a,b){ return a-b }'),
    AI('interviewq', ['interview'], 'Is job ke liye 5 ahem interview sawal + har sawal ka short jawab ka hint do:', '🎤 *Interview Tayyari:*', 'sales officer'),
    AI('cvtip', ['resumetip'], 'Is profession ke bande ke CV ke liye 5 zabardast tips do ke CV select ho jaye:', '📄 *CV Tips:*', 'web developer'),
    AI('ideagen', ['businessidea'], 'Is budget/area ke hisab se 3 chhote business ideas do — har idea: naam, lagat andaza, kamai kese:', '💡 *Business Ideas:*', 'Lahore mein 1 lakh budget'),
    { name: 'translate', alias: ['tarjuma'], exec: async (sock, m, args) => {
        const t = args.join(' ');
        if (!t) return send(sock, m, '🌐 Example: .translate urdu Assalam o Alaikum ka matlab\n.translate english mujhe madad chahiye');
        const lang = (args[0] || '').toLowerCase();
        const text = ['urdu', 'english', 'en', 'ur'].includes(lang) ? args.slice(1).join(' ') : t;
        const target = lang === 'urdu' || lang === 'ur' ? 'Urdu (Roman Urdu bhi chalegi)' : 'English';
        if (!text) return send(sock, m, '🌐 Tarjuma karne wala text bhi likho!');
        const out = await askGemini(`Translate this text to ${target}. Sirf translation do:\n\n${text}`);
        return send(sock, m, out ? `🌐 *Tarjuma:*\n${out}` : '🌐 AI abhi available nahi — thodi der baad try karo.');
    } },
];
