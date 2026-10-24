const axios = require('axios');

// ======================================================
// LOGO — .logo [text]
// Pehle AI API (siputzx stabilityai) try hoti hai.
// Wo API band/404 ho to LOCAL logo khud ban jata hai
// (sharp, offline) — command kabhi khaali nahi jata.
// (Purana bug: m.key.remote_id typo se hamesha crash tha.)
// ======================================================

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 30);

async function localLogo(title) {
    const sharp = require('sharp');
    const t = esc(title || 'MALIK-MD');
    const fs = t.length <= 8 ? 118 : t.length <= 14 ? 92 : 68;
    const svg = `<svg width="1024" height="640" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0B1020"/><stop offset="55%" stop-color="#131B36"/><stop offset="100%" stop-color="#1E3A5F"/>
      </linearGradient>
      <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#F8FAFC"/><stop offset="45%" stop-color="#94A3B8"/><stop offset="55%" stop-color="#E2E8F0"/><stop offset="100%" stop-color="#64748B"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="640" fill="url(#bg)"/>
    <circle cx="880" cy="90" r="200" fill="#2563EB" opacity="0.18"/>
    <circle cx="120" cy="570" r="170" fill="#FACC15" opacity="0.10"/>
    <rect x="36" y="36" width="952" height="568" rx="28" fill="none" stroke="#FACC15" stroke-width="3" opacity="0.65"/>
    <text x="512" y="290" font-size="${fs}" font-weight="900" fill="url(#chrome)" stroke="#0F172A" stroke-width="2" text-anchor="middle" font-family="DejaVu Sans, sans-serif" letter-spacing="2">${t}</text>
    <text x="512" y="378" font-size="40" font-weight="bold" fill="#FACC15" stroke="#FFFFFF" stroke-width="0.7" paint-order="stroke" text-anchor="middle" font-family="DejaVu Sans, sans-serif" letter-spacing="4">MULTI DEVICE WHATSAPP BOT</text>
    <text x="512" y="452" font-size="32" font-weight="bold" fill="#FFFFFF" text-anchor="middle" font-family="DejaVu Sans, sans-serif">Developer: MALIK SAHIB</text>
    <text x="512" y="548" font-size="24" fill="#94A3B8" text-anchor="middle" font-family="DejaVu Sans, sans-serif">Powered by MALIK-MD</text>
    </svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
}

const command = {
    name: "logo",
    alias: ["banner", "profilepic"],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const waitingMsg = await sock.sendMessage(jid, { text: "🎨 Generating your official MALIK-MD logo..." }, { quoted: m });
        const caption = `*👑 Here is your official MALIK-MD Logo! 👑*\n\n*Powered by MALIK-MD*`;
        try {
            const professionalPrompt = `An ultra-realistic, cinematic, and professional-style studio photo of a computer monitor showing coding scripts. The image is taken from a wide angle, capturing a spacious studio environment. The text "MALIK-MD" is prominently displayed in bold, chrome 3D letters, casting a cool reflection. Below it, in a slightly smaller size, the text "MULTI DEVICE WHATSAPP BOT" is written in a vibrant yellow color with a clean white stroke, and below that, "Developer:MALIK SAHIB" is written in bold white color. The overall atmosphere is dark with a futuristic and technological feel, enhanced by dramatic, high-contrast lighting that illuminates the details of the scene. The image quality is extremely sharp, with intricate details that make it look incredibly real.`;
            const apiUrl = `https://api.siputzx.my.id/api/ai/stabilityai?prompt=${encodeURIComponent(professionalPrompt)}`;
            const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 20000 });
            if (!response || !response.data) throw new Error('empty api response');
            const imageBuffer = Buffer.from(response.data, "binary");
            await sock.sendMessage(jid, { image: imageBuffer, caption }, { quoted: m });
        } catch (apiErr) {
            // API band hai (404) — local logo bhej do, command khaali na jaye
            try {
                const img = await localLogo(args.join(' ').trim());
                await sock.sendMessage(jid, { image: img, caption }, { quoted: m });
            } catch (e) {
                console.error("Logo Command Error:", e.message);
                await sock.sendMessage(jid, { text: `An error occurred while making the logo.` }, { quoted: m });
            }
        }
        try { await sock.sendMessage(jid, { delete: waitingMsg.key }); } catch (e) {}
    }
};

module.exports = command;
