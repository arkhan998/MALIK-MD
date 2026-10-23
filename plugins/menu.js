const fs = require("fs");
const path = require("path");
const config = require("../config.js");
const generateMenuCard = require("../lib/menucard.js");

// NAWAZ-style fancy bold (𝐚𝐛𝐜...)
function fb(t) {
    return String(t).replace(/[a-zA-Z0-9]/g, (c) => {
        const code = c.charCodeAt(0);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + (code - 97));
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + (code - 65));
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7CE + (code - 48));
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

// ======================================================
// MENU STYLES — har .menu par naya style (rotate)
// ======================================================
const STYLES = [
    {
        name: "Classic",
        head: (i) => `〔 *MALIK-MD* 〕
┃★╭──────────────
┃★│ ${fb("Owner")} : ${i.owner}
┃★│ ${fb("Mode")} : ${i.mode}
┃★│ ${fb("Prefix")} : ${i.prefix}
┃★│ ${fb("Version")} : ${i.version}
┃★│ ${fb("Runtime")} : ${i.runtime}
┃★│ ${fb("Total Commands")} : ${i.total}
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷`,
        box: (title, cmds) => `╭━━〔 *${title}* 〕━━┈⊷
┃❖╭─────────────·๏
${cmds.map(c => `┃❖┃ ${fb(c)}`).join("\n")}
┃❖└───────────┈⊷
╰──────────────┈⊷`
    },
    {
        name: "Royal",
        head: (i) => `╔════〔 *MALIK-MD* 〕════╗
 👑 *Owner* : ${i.owner}
 ⚙️ *Mode* : ${i.mode}
 ⌘ *Prefix* : ${i.prefix}
 🔖 *Version* : ${i.version}
 ⏱️ *Runtime* : ${i.runtime}
 📚 *Commands* : ${i.total}
╚════════════════════╝`,
        box: (title, cmds) => `╔═〔 *${title}* 〕════════
${cmds.map(c => `║ ➤ ${fb(c)}`).join("\n")}
╚════════════════════`
    },
    {
        name: "Minimal",
        head: (i) => `*MALIK-MD*
━━━━━━━━━━━━━━━
Owner: ${i.owner}  •  Mode: ${i.mode}
Prefix: ${i.prefix}  •  Version: ${i.version}
Runtime: ${i.runtime}  •  Commands: ${i.total}
━━━━━━━━━━━━━━━`,
        box: (title, cmds) => `*— ${title} —*
${cmds.map(c => `• ${c}`).join("\n")}`
    },
    {
        name: "Neon",
        head: (i) => `【 *MALIK-MD* 】
⚡ Owner » ${i.owner}
⚡ Mode » ${i.mode}
⚡ Prefix » ${i.prefix}
⚡ Version » ${i.version}
⚡ Runtime » ${i.runtime}
⚡ Commands » ${i.total}`,
        box: (title, cmds) => `╭─⟨ *${title}* ⟩
${cmds.map(c => `│ ⚡ ${fb(c)}`).join("\n")}
╰──────────────`
    }
];
let lastStyle = -1;

const SECTIONS = [
    ["MAIN", ["menu", "votemenu", "ping", "alive", "owner", "malik", "help", "join"]],
    ["AI", ["ai", "px", "pximg", "pxvid", "fluxai", "stablediffusion", "stabilityai", "gimage", "describe", "imagine", "summarize", "roast", "dream", "tone", "transcribe", "assistant"]],
    ["DOWNLOAD", ["dl", "tiktok", "tiktoksearch", "song", "pindl", "instagram"]],
    ["ISLAMIC", ["quran", "quranmenu", "namaz", "dua", "hadith", "asma", "tasbeeh"]],
    ["GROUP", ["tagall", "kick", "promote", "demote", "antilink", "welcome", "automod", "stats", "poll", "warn", "admins", "hidetag", "mute", "unmute", "grouplink", "groupinfo", "members"]],
    ["TOOLS", ["weather", "news", "viewonce", "tts", "screenshot", "sticker", "logo", "tourl", "shorturl", "qr", "autoreact", "autotyping", "autorecording", "antidelete", "say", "shayari", "animate", "morning", "age", "bmi", "emi", "zakat", "split", "unit", "fuel", "countdown", "remindme", "password", "fancy", "base64", "define", "wiki", "country", "motivate", "joke", "choose", "dice", "team", "toimg", "tomp3", "compress"]],
    ["BUSINESS", ["jadoo", "jadooadd", "invoice", "catalog", "catalogadd", "expense", "order", "orders", "calc", "tax", "discount", "due", "cust", "quote", "profit", "att", "report", "note", "payinfo", "target", "payreminder", "shopcard", "offer", "followup", "warranty"]],
    ["OWNER", ["owner_menu", "ai_menu", "general_menu", "settings", "listusers", "simdata", "send", "send_audio", "send_video", "testreminder", "stock", "stockin", "stockout", "stocklist", "lowstock"]]
];

const command = {
    name: "menu",
    alias: ["menu-v2", "allmenu", "list"],
    exec: async (sock, m, args) => {
        try {
            const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
            const info = {
                owner: config.OWNER_NAME || "Malik Sahib",
                mode: (config.MODE || "public").toLowerCase(),
                prefix: config.prefix || ".",
                version: pkg.version || "1.0.0",
                runtime: runtime(),
                total: totalCommands()
            };

            // Har dafa pichhle se ALAG style
            let si = Math.floor(Math.random() * STYLES.length);
            if (si === lastStyle) si = (si + 1) % STYLES.length;
            lastStyle = si;
            const st = STYLES[si];

            const head = st.head(info);
            const sections = SECTIONS.map(([t, cmds]) => st.box(t, cmds));
            const foot = `\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ MALIK-MD* • style: ${st.name}`;

            // Pehle koshish: live generated NAYA card. Fail ho to purani photo.
            let imageBuffer = null;
            try {
                imageBuffer = await generateMenuCard({ owner: info.owner, commands: info.total, mode: info.mode });
            } catch (e) { imageBuffer = null; }
            if (!imageBuffer) {
                const cardPath = path.join(__dirname, '..', 'src', 'menu-card.jpg');
                const imagePath = fs.existsSync(cardPath) ? cardPath : path.join(__dirname, '..', 'src', 'malikmd.jpeg');
                imageBuffer = fs.readFileSync(imagePath);
            }

            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                caption: head + "\n" + sections.join("\n") + foot
            }, { quoted: m });

        } catch (e) {
            console.error('Menu Error:', e);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Menu system is currently busy. Please try again later.` }, { quoted: m });
        }
    }
};

module.exports = command;
