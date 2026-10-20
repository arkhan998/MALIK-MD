const config = require('../config.js');
const botEvents = require('../lib/events.js');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// ======================================================
// ANTI-DELETE — .antidelete on|off (owner only, global)
// Deleted messages (text + media) are recovered and re-sent.
// ======================================================

let antiDeleteOn = false;

// key: `${remoteJid}:${messageId}` -> { msg (full WAMessage) }
const cache = new Map();
const MAX_CACHE = 500;

const norm = (jid) => String(jid || '').split(':')[0].split('@')[0];
const fullJid = (num) => `${norm(num)}@s.whatsapp.net`;

// Cache every incoming message (except revoke protocol notices)
botEvents.on('new-message', async ({ m }) => {
    try {
        if (!antiDeleteOn || !m?.message || !m.key?.id) return;
        if (m.message.protocolMessage) return; // revoke notices ko cache nahi karna
        const key = `${m.key.remoteJid}:${m.key.id}`;
        cache.set(key, { msg: m });
        if (cache.size > MAX_CACHE) {
            const oldest = cache.keys().next().value;
            cache.delete(oldest);
        }
    } catch (e) { /* silent */ }
});

// Revoke notice aaya (index.js emits 'message-revoked')
botEvents.on('message-revoked', async ({ sock, revokedKey }) => {
    try {
        if (!antiDeleteOn) return;
        const key = `${revokedKey.remoteJid}:${revokedKey.id}`;
        const cached = cache.get(key);
        const jid = revokedKey.remoteJid;
        const senderNum = norm(revokedKey.participant || revokedKey.remoteJid);

        if (!cached) {
            return; // purana message, cache mein nahi tha
        }
        cache.delete(key);

        const msg = cached.msg;
        const inner = msg.message || {};
        const text = inner.conversation || inner.extendedTextMessage?.text || '';

        const header = `🗑️ *Deleted message recovered*\n👤 From: @${senderNum}\n`;

        if (text) {
            await sock.sendMessage(jid, {
                text: `${header}\n${text}`,
                mentions: [fullJid(senderNum)]
            });
            return;
        }

        // Media wapas download karke bhejo (v7 wrapper pattern)
        try {
            const buf = await downloadMediaMessage({ key: msg.key, message: msg.message }, 'buffer', {});
            if (inner.imageMessage) {
                await sock.sendMessage(jid, { image: buf, caption: header, mentions: [fullJid(senderNum)] });
            } else if (inner.videoMessage) {
                await sock.sendMessage(jid, { video: buf, caption: header, mentions: [fullJid(senderNum)] });
            } else if (inner.audioMessage) {
                await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mpeg', ptt: !!inner.audioMessage.ptt });
                await sock.sendMessage(jid, { text: header, mentions: [fullJid(senderNum)] });
            } else if (inner.documentMessage) {
                await sock.sendMessage(jid, {
                    document: buf,
                    fileName: inner.documentMessage.fileName || 'file',
                    mimetype: inner.documentMessage.mimetype || 'application/octet-stream',
                    caption: header
                });
            } else if (inner.stickerMessage) {
                await sock.sendMessage(jid, { sticker: buf });
                await sock.sendMessage(jid, { text: header, mentions: [fullJid(senderNum)] });
            } else {
                await sock.sendMessage(jid, { text: `${header}\n_(unsupported message type, could not recover)_`, mentions: [fullJid(senderNum)] });
            }
        } catch (e) {
            await sock.sendMessage(jid, { text: '🗑️ Someone deleted a message, but I could not recover it.' });
        }
    } catch (e) {
        console.error('antidelete error:', e.message);
    }
});


// .settings ke liye toggle registry
try { require('../lib/toggles.js').register('antidelete', '🗑️ Anti-Delete', 'global', () => antiDeleteOn); } catch (e) {}

module.exports = {
    name: 'antidelete',
    aliases: ['ad'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        try {
            const opt = (args[0] || '').toLowerCase();
            if (opt === 'on') {
                antiDeleteOn = true;
                await sock.sendMessage(m.key.remoteJid, { text: '🗑️ *Anti-delete enabled!*\nAb koi message delete karega to main usay wapas bhej dunga.' }, { quoted: m });
            } else if (opt === 'off') {
                antiDeleteOn = false;
                cache.clear();
                await sock.sendMessage(m.key.remoteJid, { text: '🗑️ *Anti-delete disabled.*' }, { quoted: m });
            } else {
                const state = antiDeleteOn ? 'ON ✅' : 'OFF ❌';
                await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Anti-delete is currently *${state}*\nUsage: ${config.prefix}antidelete on|off` }, { quoted: m });
            }
        } catch (e) {
            console.error('antidelete command error:', e.message);
        }
    }
};
