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

module.exports = {
    name: "owner_menu",
    ownerOnly: true,
    exec: async (sock, m, args) => {
        try {
            const txt = `*👑 Welcome to the Owner Panel, Malik Sahab!*\n\n` +
                box("OWNER", ["owner_menu", "ai_menu", "general_menu", "settings", "listusers", "simdata", "send", "send_audio", "send_video", "testreminder", "stock", "stockin", "stockout", "stocklist", "lowstock"]) +
                `\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ MALIK-MD*`;
            await sock.sendMessage(m.key.remoteJid, { text: txt }, { quoted: m });
        } catch (error) {
            console.error("Error in owner_menu command:", error);
        }
    },
};
