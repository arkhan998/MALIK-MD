// ======================================================
// PACK: GROUP TOOLS 2 — warn, admins, grouplink, ginfo,
// setdesc, setname, mute, unmute, hidetag, members
// (Group commands — bot ka group admin hona aksar zaroori)
// ======================================================
const fs = require('fs');
const path = require('path');
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });
const WARN_FILE = path.join(__dirname, '..', 'data', 'warns.json');

function loadWarns() { try { return JSON.parse(fs.readFileSync(WARN_FILE, 'utf8')); } catch (e) { return {}; } }
function saveWarns(d) { try { fs.mkdirSync(path.dirname(WARN_FILE), { recursive: true }); fs.writeFileSync(WARN_FILE, JSON.stringify(d, null, 2)); } catch (e) {} }

async function meta(sock, jid) { try { return await sock.groupMetadata(jid); } catch (e) { return null; } }
function isAdmin(md, jid) { const p = md?.participants?.find(x => x.id === jid); return p?.admin === 'admin' || p?.admin === 'superadmin'; }
function senderOf(m) { return m.key.participant || m.key.remoteJid; }
function targetOf(m, args) {
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    if (ctx?.mentionedJid?.length) return ctx.mentionedJid[0];
    if (ctx?.participant) return ctx.participant;
    const raw = (args[0] || '').replace(/[^0-9]/g, '');
    if (raw.length >= 10) return raw + '@s.whatsapp.net';
    return null;
}
const groupOnly = (sock, m) => { if (!m.key.remoteJid.endsWith('@g.us')) { send(sock, m, '👥 Yeh command sirf group mein chalti hai.'); return false; } return true; };

module.exports = [
    {
        name: 'warn',
        exec: async (sock, m, args) => {
            if (!groupOnly(sock, m)) return;
            const jid = m.key.remoteJid;
            if ((args[0] || '').toLowerCase() === 'list') {
                const db = loadWarns()[jid] || {};
                const entries = Object.entries(db);
                if (!entries.length) return send(sock, m, '✅ Is group mein abhi koi warning nahi hai.');
                return send(sock, m, `⚠️ *Warnings*\n\n` + entries.map(([u, c]) => `• @${u.split('@')[0]} — ${c} warning`).join('\n'), { mentions: entries.map(([u]) => u) });
            }
            const md = await meta(sock, jid);
            if (!md) return send(sock, m, '❌ Group info nahi mili.');
            if (!isAdmin(md, senderOf(m))) return send(sock, m, '🛡️ Sirf group admins warn de sakte hain.');
            const target = targetOf(m, args);
            if (!target) return send(sock, m, '⚠️ *Warn*\n\nKisi ko mention/reply karke `.warn` likho.\nWarnings dekhne: `.warn list`\n3 warnings = kick (bot admin ho to)');
            const dbAll = loadWarns();
            dbAll[jid] = dbAll[jid] || {};
            dbAll[jid][target] = (dbAll[jid][target] || 0) + 1;
            const count = dbAll[jid][target];
            if (count >= 3) {
                delete dbAll[jid][target]; saveWarns(dbAll);
                try { await sock.groupParticipantsUpdate(jid, [target], 'remove'); return send(sock, m, `🚫 @${target.split('@')[0]} ko *3 warnings* ke baad group se nikaal diya gaya.`, { mentions: [target] }); }
                catch (e) { return send(sock, m, `⚠️ @${target.split('@')[0]} ki 3 warnings puri — lekin kick nahi ho saka (bot admin hai?). Warnings reset kar di hain.`, { mentions: [target] }); }
            }
            saveWarns(dbAll);
            return send(sock, m, `⚠️ @${target.split('@')[0]} ko *warning ${count}/3* di gayi.\n3 warnings par group se nikaal diya jayega.`, { mentions: [target] });
        }
    },
    {
        name: 'admins',
        exec: async (sock, m, args) => {
            if (!groupOnly(sock, m)) return;
            const md = await meta(sock, m.key.remoteJid);
            if (!md) return send(sock, m, '❌ Group info nahi mili.');
            const admins = md.participants.filter(p => p.admin);
            return send(sock, m, `🛡️ *Group Admins (${admins.length})*\n\n` + admins.map(p => `• @${p.id.split('@')[0]}${p.admin === 'superadmin' ? ' 👑 (owner)' : ''}`).join('\n'), { mentions: admins.map(p => p.id) });
        }
    },
    {
        name: 'grouplink',
        alias: ['glink'],
        exec: async (sock, m, args) => {
            if (!groupOnly(sock, m)) return;
            try {
                const code = await sock.groupInviteCode(m.key.remoteJid);
                return send(sock, m, `🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}\n\n⚠️ Jo bhi link paayega group join kar sakta hai — soch kar share karna.`);
            } catch (e) { return send(sock, m, '❌ Link nahi mil saka — bot is group mein admin hai? Link sirf admin nikaal sakta hai.'); }
        }
    },
    {
        name: 'groupinfo',
        alias: ['ginfo'],
        exec: async (sock, m, args) => {
            if (!groupOnly(sock, m)) return;
            const md = await meta(sock, m.key.remoteJid);
            if (!md) return send(sock, m, '❌ Group info nahi mili.');
            const created = md.creation ? new Date(md.creation * 1000).toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
            const admins = md.participants.filter(p => p.admin).length;
            return send(sock, m, `👥 *${md.subject}*\n\n🆔 ${md.id}\n👤 Members: *${md.participants.length}*\n🛡️ Admins: ${admins}\n👑 Owner: ${md.owner ? '@' + md.owner.split('@')[0] : '—'}\n📅 Bana: ${created}${md.desc ? `\n\n📝 ${String(md.desc).slice(0, 300)}` : ''}`, md.owner ? { mentions: [md.owner] } : {});
        }
    },
    {
        name: 'setdesc',
        exec: async (sock, m, args) => {
            if (!groupOnly(sock, m)) return;
            const text = args.join(' ').trim();
            if (!text) return send(sock, m, '📝 Example: `.setdesc Group ke usool: sab ki izzat karo`');
            try { await sock.groupUpdateDescription(m.key.remoteJid, text); return send(sock, m, '✅ Group description change ho gayi.'); }
            catch (e) { return send(sock, m, '❌ Nahi ho saka — tum admin ho? Bot bhi admin hona chahiye aksar.'); }
        }
    },
    {
        name: 'setname',
        exec: async (sock, m, args) => {
            if (!groupOnly(sock, m)) return;
            const text = args.join(' ').trim();
            if (!text) return send(sock, m, '📝 Example: `.setname Dostana Mehfil`');
            try { await sock.groupUpdateSubject(m.key.remoteJid, text); return send(sock, m, '✅ Group ka naam change ho gaya.'); }
            catch (e) { return send(sock, m, '❌ Nahi ho saka — admin permission chahiye.'); }
        }
    },
    {
        name: 'mute',
        exec: async (sock, m, args) => {
            if (!groupOnly(sock, m)) return;
            try { await sock.groupSettingUpdate(m.key.remoteJid, 'announcement'); return send(sock, m, '🔇 *Group mute ho gaya* — ab sirf admins message kar sakte hain.\nKhulne ke liye: `.unmute`'); }
            catch (e) { return send(sock, m, '❌ Nahi ho saka — bot ko admin banao pehle.'); }
        }
    },
    {
        name: 'unmute',
        exec: async (sock, m, args) => {
            if (!groupOnly(sock, m)) return;
            try { await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement'); return send(sock, m, '🔊 *Group open ho gaya* — ab sab message kar sakte hain.'); }
            catch (e) { return send(sock, m, '❌ Nahi ho saka — bot ko admin banao pehle.'); }
        }
    },
    {
        name: 'hidetag',
        exec: async (sock, m, args) => {
            if (!groupOnly(sock, m)) return;
            const text = args.join(' ').trim();
            if (!text) return send(sock, m, '📣 Example: `.hidetag Kal meeting 8 baje hai` — sab ko tag hoga, naam nazar nahi ayenge.');
            const md = await meta(sock, m.key.remoteJid);
            if (!md) return send(sock, m, '❌ Group info nahi mili.');
            return sock.sendMessage(m.key.remoteJid, { text: `📣 ${text}`, mentions: md.participants.map(p => p.id) });
        }
    },
    {
        name: 'members',
        exec: async (sock, m, args) => {
            if (!groupOnly(sock, m)) return;
            const md = await meta(sock, m.key.remoteJid);
            if (!md) return send(sock, m, '❌ Group info nahi mili.');
            const list = md.participants.slice(0, 50);
            let out = `👥 *Members — ${md.subject}*\nKul: *${md.participants.length}*\n\n`;
            out += list.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}${p.admin ? ' 🛡️' : ''}`).join('\n');
            if (md.participants.length > 50) out += `\n\n…aur ${md.participants.length - 50} members (list lambi hai, pehle 50 dikhaye)`;
            return send(sock, m, out, { mentions: list.map(p => p.id) });
        }
    }
];
