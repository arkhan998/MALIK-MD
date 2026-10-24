const fs = require('fs');
const path = require('path');
const config = require('../config.js');
const botEvents = require('../lib/events.js');

// ======================================================
// WELCOME CARD — naya member aye to PHOTO wala welcome
// .welcomecard on/off (group admin/owner, per group)
// Default OFF — on karne par text .welcome ki jagah ya
// us ke sath ye card jayega (dono on hon to dono ayenge,
// ek band kar dena behtar hai).
// Profile photo mil jaye to card par lag jati hai,
// na mile to number wala design khud ban jata hai.
// ======================================================

const FILE = path.join(__dirname, '..', 'data', 'welcomecard.json');
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return {}; } };
const save = (d) => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); } catch (e) {} };
const store = load();
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 42);
const THEMES = [['#0F2027', '#2C5364'], ['#41295A', '#2F0743'], ['#134E5E', '#71B280'], ['#8E2DE2', '#4A00E0'], ['#B31217', '#E52D27']];

async function makeCard(sock, userJid, groupName, memberCount) {
    const sharp = require('sharp');
    const num = userJid.split('@')[0];
    const [c1, c2] = THEMES[Math.floor(Date.now() / 86400000) % THEMES.length];
    let picBuf = null;
    try {
        const url = await sock.profilePictureUrl(userJid, 'image');
        if (url) {
            const axios = require('axios');
            const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
            picBuf = Buffer.from(r.data);
        }
    } catch (e) { picBuf = null; }

    const svg = `<svg width="900" height="420" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="900" height="420" fill="url(#g)"/>
    <circle cx="760" cy="60" r="130" fill="#FFFFFF" opacity="0.07"/>
    <circle cx="90" cy="380" r="110" fill="#FFFFFF" opacity="0.07"/>
    <text x="330" y="130" font-size="64" font-weight="bold" fill="#FFFFFF" font-family="DejaVu Sans, sans-serif">WELCOME</text>
    <text x="330" y="195" font-size="40" font-weight="bold" fill="#FACC15" font-family="DejaVu Sans, sans-serif">@${esc(num)}</text>
    <text x="330" y="258" font-size="30" fill="#E5E7EB" font-family="DejaVu Sans, sans-serif">${esc(groupName)}</text>
    <text x="330" y="305" font-size="25" fill="#D1D5DB" font-family="DejaVu Sans, sans-serif">Member #${memberCount} — khush aamdeed!</text>
    <text x="330" y="368" font-size="22" fill="#9CA3AF" font-family="DejaVu Sans, sans-serif">MALIK-MD — group rules ka khayal rakhein</text>
    </svg>`;
    let img = sharp(Buffer.from(svg));
    if (picBuf) {
        try {
            const circle = Buffer.from('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#fff"/></svg>');
            const avatar = await sharp(picBuf).resize(200, 200, { fit: 'cover' }).composite([{ input: circle, blend: 'dest-in' }]).png().toBuffer();
            img = img.composite([{ input: avatar, left: 65, top: 110 }]);
        } catch (e) {}
    } else {
        const initial = Buffer.from(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#FACC15"/><text x="100" y="128" font-size="92" font-weight="bold" fill="#111827" text-anchor="middle" font-family="DejaVu Sans, sans-serif">${esc((num || 'M')[0])}</text></svg>`);
        img = img.composite([{ input: initial, left: 65, top: 110 }]);
    }
    return img.png().toBuffer();
}

botEvents.on('group-participants-update', async ({ sock, update }) => {
    try {
        const jid = update.id;
        if (!store[jid] || update.action !== 'add') return;
        let subject = 'Group', count = 0;
        try {
            const md = await sock.groupMetadata(jid);
            subject = md.subject || subject;
            count = (md.participants || []).length;
        } catch (e) {}
        for (const p of update.participants || []) {
            const userJid = String(p).includes('@') ? String(p) : `${String(p).split(':')[0]}@s.whatsapp.net`;
            try {
                const img = await makeCard(sock, userJid, subject, count);
                await sock.sendMessage(jid, { image: img, caption: `👋 Welcome @${userJid.split('@')[0]}! 🎉`, mentions: [userJid] });
            } catch (e) {
                await sock.sendMessage(jid, { text: `👋 Welcome @${userJid.split('@')[0]} to the group! 🎉`, mentions: [userJid] }).catch(() => {});
            }
        }
    } catch (e) {}
});

module.exports = {
    name: 'welcomecard',
    alias: ['wcard'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '👥 .welcomecard sirf group mein hai.' }, { quoted: m });
        const me = m.key.participant || jid;
        const isOwner = m.key.fromMe || (config.OWNER_NUMBER && String(me).startsWith(config.OWNER_NUMBER));
        let allowed = !!isOwner;
        if (!allowed) {
            try {
                const md = await sock.groupMetadata(jid);
                const p = md.participants.find(x => x.id === me);
                allowed = p?.admin === 'admin' || p?.admin === 'superadmin';
            } catch (e) {}
        }
        if (!allowed) return sock.sendMessage(jid, { text: '🛡️ Ye setting sirf group admin ya owner badal sakta hai.' }, { quoted: m });
        const a = (args[0] || '').toLowerCase();
        if (a === 'on') { store[jid] = true; save(store); return sock.sendMessage(jid, { text: '🖼️ *Welcome Card ON* — ab naya member ane par photo wala welcome jayega.\n(Tip: purana text .welcome on hai to usay off kar dena, warna dono ayenge.)' }, { quoted: m }); }
        if (a === 'off') { delete store[jid]; save(store); return sock.sendMessage(jid, { text: '🖼️ *Welcome Card OFF*' }, { quoted: m }); }
        return sock.sendMessage(jid, { text: `🖼️ *WELCOME CARD*\n\nHalat: *${store[jid] ? 'ON ✅' : 'OFF ❌'}*\n\n• \`.welcomecard on\` / \`off\`\n\nNaya member aye to us ke naam/number aur profile photo ke sath khubsurat card jata hai.` }, { quoted: m });
    }
};
