const fs = require('fs');
const path = require('path');
const config = require('../config.js');
const botEvents = require('../lib/events.js');

// ======================================================
// RANK — group activity leaderboard
// Har group message gin kar per-member count rakhta hai.
// .rank       — top 10 talkers (is group ke)
// .myrank     — tumhari position aur count
// .rankreset  — admin/owner: is group ka count zero
// Data: data/rank.json (per group, counting bot chalne se)
// ======================================================

const FILE = path.join(__dirname, '..', 'data', 'rank.json');
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return {}; } };
const persist = (d) => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 1)); } catch (e) {} };
const db = load();
let dirty = false;
setInterval(() => { if (dirty) { persist(db); dirty = false; } }, 10000).unref?.();

const senderOf = (m) => m.key.participant || m.key.remoteJid;

botEvents.on('new-message', ({ m }) => {
    try {
        const jid = m.key.remoteJid;
        if (!jid || !jid.endsWith('@g.us') || m.key.fromMe) return;
        const sender = senderOf(m);
        const g = db[jid] || (db[jid] = { total: 0, users: {}, since: Date.now() });
        const u = g.users[sender] || (g.users[sender] = { c: 0, name: '' });
        u.c += 1;
        if (m.pushName) u.name = m.pushName;
        g.total += 1;
        dirty = true;
    } catch (e) {}
});

function sortedUsers(jid) {
    const g = db[jid];
    if (!g) return { g: null, list: [] };
    const list = Object.entries(g.users).map(([id, u]) => ({ id, c: u.c, name: u.name || '' })).sort((a, b) => b.c - a.c);
    return { g, list };
}

const rankCmd = {
    name: 'rank',
    alias: ['leaderboard', 'topchat', 'top'],
    exec: async (sock, m) => {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '👥 .rank sirf group mein chalta hai — wahan sab ke messages gine jate hain.' }, { quoted: m });
        const { g, list } = sortedUsers(jid);
        if (!g || !list.length) return sock.sendMessage(jid, { text: '📊 Abhi is group mein koi message count nahi hua. Bot chalte hi counting shuru ho jati hai — thori dair baat-cheet karo, phir .rank dekho.' }, { quoted: m });
        const medals = ['🥇', '🥈', '🥉'];
        let out = `🏆 *GROUP LEADERBOARD*\n📨 Kul messages: *${g.total}*\n\n`;
        const mentions = [];
        list.slice(0, 10).forEach((u, i) => {
            mentions.push(u.id);
            out += `${medals[i] || (i + 1) + '.'} @${u.id.split('@')[0]} — *${u.c}* msgs\n`;
        });
        out += `\n👉 Apni position: \`.myrank\`\n_📅 Counting: ${new Date(g.since).toLocaleDateString('en-GB')}_`;
        return sock.sendMessage(jid, { text: out, mentions }, { quoted: m });
    }
};

const myrankCmd = {
    name: 'myrank',
    alias: ['rankme'],
    exec: async (sock, m) => {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '👥 .myrank sirf group mein chalta hai.' }, { quoted: m });
        const me = senderOf(m);
        const { g, list } = sortedUsers(jid);
        const idx = list.findIndex(u => u.id === me);
        if (!g || idx === -1) return sock.sendMessage(jid, { text: '📊 Tumhara abhi koi message count nahi hua is group mein. Kuch messages bhejo, phir .myrank dekho!' }, { quoted: m });
        const mine = list[idx];
        let extra = '';
        if (idx > 0) {
            const above = list[idx - 1];
            extra = `\n⬆️ Upar walay (${'@' + above.id.split('@')[0]}) se sirf *${above.c - mine.c + 1}* msgs peeche ho!`;
        } else {
            extra = '\n👑 Tum is group ke sab se active member ho!';
        }
        return sock.sendMessage(jid, { text: `📊 *TUMHARI POSITION*\n\n🏅 Rank: *#${idx + 1}* / ${list.length} members\n📨 Tumhare messages: *${mine.c}* (kul ${g.total} mein se)${extra}`, mentions: idx > 0 ? [list[idx - 1].id] : [] }, { quoted: m });
    }
};

const rankResetCmd = {
    name: 'rankreset',
    alias: ['resetrank'],
    exec: async (sock, m) => {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '👥 .rankreset sirf group mein chalta hai.' }, { quoted: m });
        const me = senderOf(m);
        const isOwner = m.key.fromMe || (config.OWNER_NUMBER && String(me).startsWith(config.OWNER_NUMBER));
        let allowed = !!isOwner;
        if (!allowed) {
            try {
                const md = await sock.groupMetadata(jid);
                const p = md.participants.find(x => x.id === me);
                allowed = p?.admin === 'admin' || p?.admin === 'superadmin';
            } catch (e) {}
        }
        if (!allowed) return sock.sendMessage(jid, { text: '🛡️ Rank reset sirf group admin ya bot owner kar sakta hai.' }, { quoted: m });
        delete db[jid];
        dirty = true; persist(db);
        return sock.sendMessage(jid, { text: '🗑️ Is group ka rank count reset kar diya gaya — nayi counting ab se shuru hai.' }, { quoted: m });
    }
};

module.exports = [rankCmd, myrankCmd, rankResetCmd];
