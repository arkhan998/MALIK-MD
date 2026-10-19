const config = require('../config.js');
const botEvents = require('../lib/events.js');

// ======================================================
// GROUP MANAGEMENT — .tagall .kick .promote .demote .antilink .welcome
// ======================================================

const antilinkGroups = new Map(); // jid -> true
const welcomeGroups = new Map();  // jid -> true

const LINK_REGEX = /(https?:\/\/|www\.|chat\.whatsapp\.com)/i;

const isGroup = (m) => m.key.remoteJid && m.key.remoteJid.endsWith('@g.us');
const norm = (jid) => String(jid || '').split(':')[0].split('@')[0];
const fullJid = (num) => `${norm(num)}@s.whatsapp.net`;

function senderOf(m) {
    return norm(m.key.participant || m.participant || m.key.remoteJid);
}

// target: mentioned user, ya jisko reply kiya
function targetOf(m) {
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    if (ctx?.mentionedJid?.length) return norm(ctx.mentionedJid[0]);
    if (ctx?.participant) return norm(ctx.participant);
    return null;
}

async function groupAdmins(sock, jid) {
    try {
        const meta = await sock.groupMetadata(jid);
        const admins = new Set();
        for (const p of meta.participants || []) {
            if (p.admin === 'admin' || p.admin === 'superadmin') admins.add(norm(p.id));
        }
        return { meta, admins };
    } catch (e) {
        return { meta: null, admins: new Set() };
    }
}

function botNumber(sock) {
    return norm(sock.user?.id);
}

// ---------- antilink listener ----------
botEvents.on('new-message', async ({ sock, m }) => {
    try {
        if (!m?.message || !isGroup(m) || m.key.fromMe) return;
        const jid = m.key.remoteJid;
        if (!antilinkGroups.get(jid)) return;

        const text = m.message?.conversation
            || m.message?.extendedTextMessage?.text
            || m.message?.imageMessage?.caption
            || m.message?.videoMessage?.caption
            || '';
        if (!LINK_REGEX.test(text)) return;

        const { admins } = await groupAdmins(sock, jid);
        const sender = senderOf(m);
        if (admins.has(sender)) return; // admins exempt
        if (!admins.has(botNumber(sock))) return; // bot must be admin to delete

        await sock.sendMessage(jid, { delete: m.key });
        await sock.sendMessage(jid, {
            text: `⚠️ @${sender} — links are not allowed in this group!`,
            mentions: [fullJid(sender)]
        });
    } catch (e) {
        console.error('antilink error:', e.message);
    }
});

// ---------- welcome / goodbye listener ----------
// (index.js emits 'group-participants-update' from sock.ev group-participants.update)
botEvents.on('group-participants-update', async ({ sock, update }) => {
    try {
        const jid = update.id;
        if (!welcomeGroups.get(jid)) return;
        for (const p of update.participants || []) {
            const tag = fullJid(p);
            if (update.action === 'add') {
                await sock.sendMessage(jid, {
                    text: `👋 Welcome @${norm(p)} to the group! 🎉`,
                    mentions: [tag]
                });
            } else if (update.action === 'remove') {
                await sock.sendMessage(jid, {
                    text: `👋 @${norm(p)} left the group.`,
                    mentions: [tag]
                });
            }
        }
    } catch (e) {
        console.error('welcome error:', e.message);
    }
});

// ---------- commands ----------
async function needGroupAdmin(sock, m) {
    const jid = m.key.remoteJid;
    const { meta, admins } = await groupAdmins(sock, jid);
    const sender = senderOf(m);
    if (!admins.has(sender)) {
        await sock.sendMessage(jid, { text: '❌ This command is for group admins only.' }, { quoted: m });
        return null;
    }
    return { jid, meta, admins, sender };
}

async function needBotAdmin(sock, m, admins, jid) {
    if (!admins.has(botNumber(sock))) {
        await sock.sendMessage(jid, { text: '❌ I need to be a group admin to do that. Make me admin first.' }, { quoted: m });
        return false;
    }
    return true;
}

const handlers = {
    async tagall(sock, m, args) {
        const chk = await needGroupAdmin(sock, m);
        if (!chk) return;
        const { jid, meta } = chk;
        const note = args.join(' ').trim() || '📢 Attention everyone!';
        const members = (meta?.participants || []).map(p => fullJid(p.id));
        if (!members.length) return sock.sendMessage(jid, { text: '❌ Could not fetch group members.' }, { quoted: m });
        await sock.sendMessage(jid, {
            text: `${note}\n\n${members.map(j => `@${norm(j)}`).join(' ')}`,
            mentions: members
        }, { quoted: m });
    },

    async kick(sock, m, args) {
        const chk = await needGroupAdmin(sock, m);
        if (!chk) return;
        const { jid, admins } = chk;
        if (!await needBotAdmin(sock, m, admins, jid)) return;
        const target = targetOf(m);
        if (!target) return sock.sendMessage(jid, { text: `❌ Usage: ${config.prefix}kick @user (mention or reply)` }, { quoted: m });
        if (target === botNumber(sock)) return sock.sendMessage(jid, { text: '❌ I cannot kick myself! 😅' }, { quoted: m });
        try {
            await sock.groupParticipantsUpdate(jid, [fullJid(target)], 'remove');
            await sock.sendMessage(jid, { text: `👢 @${target} has been kicked.`, mentions: [fullJid(target)] }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(jid, { text: `❌ Could not kick @${target}.` , mentions: [fullJid(target)] }, { quoted: m });
        }
    },

    async promote(sock, m, args) {
        const chk = await needGroupAdmin(sock, m);
        if (!chk) return;
        const { jid, admins } = chk;
        if (!await needBotAdmin(sock, m, admins, jid)) return;
        const target = targetOf(m);
        if (!target) return sock.sendMessage(jid, { text: `❌ Usage: ${config.prefix}promote @user (mention or reply)` }, { quoted: m });
        try {
            await sock.groupParticipantsUpdate(jid, [fullJid(target)], 'promote');
            await sock.sendMessage(jid, { text: `⬆️ @${target} is now an admin.`, mentions: [fullJid(target)] }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(jid, { text: `❌ Could not promote @${target}.`, mentions: [fullJid(target)] }, { quoted: m });
        }
    },

    async demote(sock, m, args) {
        const chk = await needGroupAdmin(sock, m);
        if (!chk) return;
        const { jid, admins } = chk;
        if (!await needBotAdmin(sock, m, admins, jid)) return;
        const target = targetOf(m);
        if (!target) return sock.sendMessage(jid, { text: `❌ Usage: ${config.prefix}demote @user (mention or reply)` }, { quoted: m });
        try {
            await sock.groupParticipantsUpdate(jid, [fullJid(target)], 'demote');
            await sock.sendMessage(jid, { text: `⬇️ @${target} is no longer an admin.`, mentions: [fullJid(target)] }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(jid, { text: `❌ Could not demote @${target}.`, mentions: [fullJid(target)] }, { quoted: m });
        }
    },

    async antilink(sock, m, args) {
        const chk = await needGroupAdmin(sock, m);
        if (!chk) return;
        const { jid } = chk;
        const opt = (args[0] || '').toLowerCase();
        if (opt === 'on') {
            antilinkGroups.set(jid, true);
            await sock.sendMessage(jid, { text: '🔗 *Anti-link enabled!*\nAnyone (except admins) posting a link will have it deleted.' }, { quoted: m });
        } else if (opt === 'off') {
            antilinkGroups.delete(jid);
            await sock.sendMessage(jid, { text: '🔗 *Anti-link disabled.*' }, { quoted: m });
        } else {
            const state = antilinkGroups.get(jid) ? 'ON ✅' : 'OFF ❌';
            await sock.sendMessage(jid, { text: `🔗 Anti-link is currently *${state}*\nUsage: ${config.prefix}antilink on|off` }, { quoted: m });
        }
    },

    async welcome(sock, m, args) {
        const chk = await needGroupAdmin(sock, m);
        if (!chk) return;
        const { jid } = chk;
        const opt = (args[0] || '').toLowerCase();
        if (opt === 'on') {
            welcomeGroups.set(jid, true);
            await sock.sendMessage(jid, { text: '👋 *Welcome messages enabled!*\nNew members will be greeted.' }, { quoted: m });
        } else if (opt === 'off') {
            welcomeGroups.delete(jid);
            await sock.sendMessage(jid, { text: '👋 *Welcome messages disabled.*' }, { quoted: m });
        } else {
            const state = welcomeGroups.get(jid) ? 'ON ✅' : 'OFF ❌';
            await sock.sendMessage(jid, { text: `👋 Welcome messages are currently *${state}*\nUsage: ${config.prefix}welcome on|off` }, { quoted: m });
        }
    }
};

handlers.tag = handlers.tagall; // .tag bhi .tagall jaisa kaam kare

module.exports = {
    name: 'tagall',
    aliases: ['tag', 'kick', 'promote', 'demote', 'antilink', 'welcome'],
    exec: async (sock, m, args) => {
        try {
            if (!isGroup(m)) {
                return sock.sendMessage(m.key.remoteJid, { text: '❌ This command only works in groups.' }, { quoted: m });
            }
            const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
            const cmd = body.slice(config.prefix.length).trim().split(/ +/)[0].toLowerCase();
            const fn = handlers[cmd];
            if (!fn) return sock.sendMessage(m.key.remoteJid, { text: '❌ Unknown group command.' }, { quoted: m });
            await fn(sock, m, args);
        } catch (e) {
            console.error('group command error:', e.message);
        }
    }
};
