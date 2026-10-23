const fs = require('fs');
const path = require('path');
const botEvents = require('../lib/events.js');
const toggles = require('../lib/toggles.js');
const config = require('../config.js');

// ======================================================
// AUTO STATUS — WhatsApp status AUTO-SEEN (auto view)
// Koi bhi status lagaye, bot khud dekh (seen kar) leta hai.
// .autostatus on/off         — auto-seen on/off (owner only)
// .autostatus react on/off   — status par emoji react bhi ho
// Halat data/autostatus.json mein; default ON (seen), react OFF.
// ======================================================

const FILE = path.join(__dirname, '..', 'data', 'autostatus.json');
function load() { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return { enabled: true, react: false }; } }
function save(d) { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); } catch (e) {} }
const state = load();
toggles.register('autostatus', '👁️ Auto Status Seen', 'global', () => state.enabled);

const REACTS = ['❤️', '🔥', '😍', '👏', '💯', '😮', '🙌'];

// ---------- listener: status aate hi seen ----------
botEvents.on('new-message', async ({ sock, m }) => {
    try {
        if (!state.enabled) return;
        if (m.key.remoteJid !== 'status@broadcast') return;
        if (m.key.fromMe) return;
        await sock.readMessages([m.key]);
        if (state.react) {
            const who = m.key.participant;
            if (who) {
                await sock.sendMessage('status@broadcast',
                    { react: { text: REACTS[Math.floor(Math.random() * REACTS.length)], key: m.key } },
                    { statusJidList: [who] });
            }
        }
    } catch (e) {
        // status seen fail ho to khamosh raho — chat flood nahi karna
    }
});

// ---------- command ----------
module.exports = {
    name: 'autostatus',
    alias: ['statusseen'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const send = (t) => sock.sendMessage(jid, { text: t }, { quoted: m });
        const a = (args[0] || '').toLowerCase();
        const b = (args[1] || '').toLowerCase();
        if (a === 'on') { state.enabled = true; save(state); return send('👁️ *Auto Status Seen ON* — ab har status khud seen ho jayega.'); }
        if (a === 'off') { state.enabled = false; save(state); return send('👁️ *Auto Status Seen OFF*'); }
        if (a === 'react' && (b === 'on' || b === 'off')) {
            state.react = b === 'on'; save(state);
            return send(`👁️ Status par auto-react *${state.react ? 'ON' : 'OFF'}*`);
        }
        return send(`👁️ *AUTO STATUS SEEN*\n\nHalat: *${state.enabled ? 'ON ✅' : 'OFF ❌'}*\nAuto-react: *${state.react ? 'ON' : 'OFF'}*\n\n• \`.autostatus on\` / \`off\`\n• \`.autostatus react on\` / \`off\`\n\n📌 Har naya status bot khud dekh kar seen kar deta hai — logon ko lagega tum har waqt online/active ho. Yahi is feature ki pehchan hai.`);
    }
};
