const fs = require("fs");
const path = require("path");
const config = require("../config.js");

// NAWAZ-style fancy bold (𝐚𝐛𝐜...)
function fb(t) {
    return String(t).replace(/[a-zA-Z0-9]/g, (c) => {
        const code = c.charCodeAt(0);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + (code - 97)); // 𝐚
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + (code - 65)); // 𝐀
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7CE + (code - 48)); // 𝟎
        return c;
    });
}

// Runtime ko "2h 14m" style mein
function runtime() {
    const s = Math.floor(process.uptime());
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
}

// Plugins se unique command names gino
function totalCommands() {
    try {
        const dir = path.join(__dirname);
        let n = 0;
        for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
            try {
                const m = require(path.join(dir, f));
                const mods = Array.isArray(m) ? m : [m];
                mods.forEach(x => { if (x && x.name) n++; });
            } catch (e) { /* ignore */ }
        }
        return n;
    } catch (e) { return 0; }
}

function box(title, cmds) {
    const lines = cmds.map(c => `┃❖┃ ${fb(c)}`).join("\n");
    return `╭━━〔 *${title}* 〕━━┈⊷
┃❖╭─────────────·๏
${lines}
┃❖└───────────┈⊷
╰──────────────┈⊷`;
}

const command = {
    name: "menu",
    alias: ["menu-v2", "allmenu", "list"],
    exec: async (sock, m, args) => {
        try {
            const cardPath = path.join(__dirname, '..', 'src', 'menu-card.jpg');
            const imagePath = fs.existsSync(cardPath) ? cardPath : path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
            const version = pkg.version || "1.0.0";
            const mode = (config.MODE || "public").toLowerCase();

            const head = `〔 *MALIK-MD* 〕
┃★╭──────────────
┃★│ ${fb("Owner")} : ${config.OWNER_NAME || "Malik Sahib"}
┃★│ ${fb("Mode")} : ${mode}
┃★│ ${fb("Prefix")} : ${config.prefix || "."}
┃★│ ${fb("Version")} : ${version}
┃★│ ${fb("Runtime")} : ${runtime()}
┃★│ ${fb("Total Commands")} : ${totalCommands()}
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷`;

            const sections = [
                box("MAIN", ["menu", "ping", "alive", "owner", "malik", "help", "join"]),
                box("AI", ["ai", "px", "pximg", "pxvid", "fluxai", "stablediffusion", "stabilityai", "gimage", "describe", "imagine", "summarize", "roast", "dream", "tone", "transcribe", "assistant"]),
                box("DOWNLOAD", ["dl", "tiktok", "tiktoksearch", "song", "pindl", "instagram"]),
                box("ISLAMIC", ["quran", "quranmenu", "namaz"]),
                box("GROUP", ["tagall", "kick", "promote", "demote", "antilink", "welcome", "automod", "stats", "poll"]),
                box("TOOLS", ["weather", "news", "viewonce", "tts", "screenshot", "sticker", "logo", "tourl", "shorturl", "autoreact", "autotyping", "autorecording", "antidelete", "say", "shayari", "animate", "morning"]),
                box("OWNER", ["owner_menu", "ai_menu", "general_menu", "settings", "listusers", "simdata", "send", "send_audio", "send_video", "testreminder", "stock", "stockin", "stockout", "stocklist", "lowstock"]),
            ];

            const channelBox = `╭━━〔 *📢 FOLLOW OUR CHANNEL* 〕━━┈⊷
┃❖╭─────────────·๏
┃❖┃ Updates, tips aur naye features
┃❖┃ sab se pehle yahan milen ge!
┃❖┃ 👉 ${config.CHANNEL_LINK}
┃❖└───────────┈⊷
╰──────────────┈⊷`;

            const foot = `\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ MALIK-MD*`;

            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                caption: head + "\n" + channelBox + "\n" + sections.join("\n") + foot
            }, { quoted: m });

        } catch (e) {
            console.error('Menu Error:', e);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Menu system is currently busy. Please try again later.` }, { quoted: m });
        }
    }
};

module.exports = command;
