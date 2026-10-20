const fs = require('fs');
const path = require('path');
const config = require('../config.js');
const toggles = require('../lib/toggles.js');
const presence = require('../lib/presence.js');

// ======================================================
// SETTINGS — saare on/off toggles ki current halat
// .settings (owner only)
// Har toggle apni halat lib/toggles.js mein register
// karta hai; ye command bas sab ko ikatha dikhati hai.
// ======================================================

module.exports = {
    name: "settings",
    alias: ["botsettings"],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const onOff = (v) => v ? 'ON 🟢' : 'OFF 🔴';
        const get = (r) => { try { return !!r.getFn(jid); } catch (e) { return false; } };

        const globals = toggles.all().filter(r => r.scope === 'global');
        const chats = toggles.all().filter(r => r.scope === 'chat');
        const groups = toggles.all().filter(r => r.scope === 'group');

        // Morning Card ki halat (data/morning.json -> { enabled: [jid,...] })
        let morningOn = false;
        try {
            const store = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'morning.json'), 'utf8'));
            morningOn = Array.isArray(store.enabled) && store.enabled.includes(jid);
        } catch (e) { /* file nahi hai = off */ }

        let txt = `╭━━〔 *⚙️ MALIK-MD SETTINGS* 〕━━┈⊷\n`;
        txt += `┃ 🤖 Mode: *${config.MODE || 'public'}*  •  Prefix: *${config.prefix || '.'}*\n`;
        txt += `╰━━━━━━━━━━━━━━━━━━┈⊷\n`;

        txt += `\n*🌍 GLOBAL*\n`;
        txt += `⌨️ Auto-Typing: *${onOff(presence.state.typing)}*\n`;
        txt += `🎙️ Auto-Recording: *${onOff(presence.state.recording)}*\n`;
        for (const r of globals) txt += `${r.label}: *${onOff(get(r))}*\n`;

        txt += `\n*💬 IS CHAT KE LIYE*\n`;
        for (const r of chats) txt += `${r.label}: *${onOff(get(r))}*\n`;
        txt += `🌅 Morning Card: *${onOff(morningOn)}*\n`;

        if (isGroup) {
            txt += `\n*👥 IS GROUP KE LIYE*\n`;
            for (const r of groups) txt += `${r.label}: *${onOff(get(r))}*\n`;
        } else {
            txt += `\nℹ️ Group wale toggles (Anti-Link, Welcome, AutoMod) dekhne ke liye kisi group mein \`.settings\` likhein.`;
        }

        txt += `\n\n_Badlne ke liye har command apne naam ke sath on/off leta hai — jaise_ \`.antilink on\`_,_ \`.autoreact off\`_,_ \`.morning on\``;

        await sock.sendMessage(jid, { text: txt }, { quoted: m });
    }
};
