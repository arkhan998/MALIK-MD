const config = require('../config.js');

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

function box(title, cmds) {
    const lines = cmds.map(c => `┃❖┃ ${fb(c)}`).join("\n");
    return `╭━━〔 *${title}* 〕━━┈⊷
┃❖╭─────────────·๏
${lines}
┃❖└───────────┈⊷
╰──────────────┈⊷`;
}

const command = {
    name: "ai_menu",
    exec: async (sock, m, args) => {
        try {
            const txt = `〔 *MALIK-MD* 〕\n\n` +
                box("AI", ["ai", "px", "pximg", "pxvid", "fluxai", "stablediffusion", "stabilityai", "gimage", "describe", "imagine", "summarize", "roast", "dream", "tone", "transcribe", "assistant"]) +
                `\n\nExample: \`${config.prefix}imagine a tiger in jungle\`\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ MALIK-MD*`;
            await sock.sendMessage(m.key.remoteJid, { text: txt }, { quoted: m });
        } catch (error) {
            console.error("Error in ai_menu command:", error);
        }
    },
};

module.exports = command;
