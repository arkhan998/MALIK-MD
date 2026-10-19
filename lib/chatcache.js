// lib/chatcache.js — recent group message history for .summarize
// Keeps the last 120 text messages per group JID in memory (drops oldest).

const cache = new Map();

function push(jid, senderName, text) {
    if (!jid || !text) return;
    if (!cache.has(jid)) cache.set(jid, []);
    const arr = cache.get(jid);
    arr.push({ sender: senderName || 'Unknown', text });
    while (arr.length > 120) arr.shift();
}

function get(jid, n) {
    const arr = cache.get(jid) || [];
    return arr.slice(-Math.max(0, n || 120));
}

module.exports = { push, get };
