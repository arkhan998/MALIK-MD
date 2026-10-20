const axios = require('axios');
const config = require('../config.js');
const botEvents = require('../lib/events.js');
const chatcache = require('../lib/chatcache.js');

// ======================================================
// CHAT HISTORY HOOK — caches recent group text messages
// so .summarize can summarize the conversation later.
// ======================================================
botEvents.on('new-message', ({ sock, m }) => {
    try {
        if (!m || !m.message) return;
        const jid = m.key.remoteJid;
        if (!jid || !jid.endsWith('@g.us')) return;      // groups only
        if (m.key.fromMe) return;                        // skip bot's own messages

        const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || "").trim();
        if (!text) return;
        if (text.startsWith(config.prefix)) return;      // skip commands

        const sender = m.pushName || m.key.participant || m.participant || 'Unknown';
        chatcache.push(jid, sender, text);
    } catch (e) {
        // cache must never break the bot
    }
});

module.exports = {
    name: "summarize",
    aliases: ["sum"],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            if (!jid.endsWith('@g.us')) {
                return await sock.sendMessage(jid, { text: "👥 This command only works in groups." }, { quoted: m });
            }

            if (!config.GEMINI_API_KEY) {
                return await sock.sendMessage(jid, { text: "❌ Gemini API Key is not set." }, { quoted: m });
            }

            const history = chatcache.get(jid, 80);
            if (history.length < 5) {
                return await sock.sendMessage(jid, {
                    text: "📭 *Not enough chat history yet!*\n\nI only started listening recently. Chat a little more in the group, then try `.summarize` again."
                }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(jid, { text: "🧠 Thinking..." }, { quoted: m });

            const chatText = history
                .map(h => `${h.sender}: ${h.text.slice(0, 120)}`)
                .join("\n");

            const prompt = `Summarize this WhatsApp group chat in Roman Urdu. Use bullet points with these sections: main topics, any decisions made, funny moments. Keep it under 150 words.\n\nChat:\n${chatText}`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${config.GEMINI_API_KEY}`;
            const response = await axios.post(apiUrl, { contents: [{ parts: [{ text: prompt }] }] });

            if (response.data.candidates && response.data.candidates.length > 0) {
                const summary = response.data.candidates[0].content.parts[0].text;
                await sock.sendMessage(jid, {
                    text: `*📝 Group Summary:*\n\n${summary}\n\n- - - - - - - - - - -\n*Powered by MALIK-MD*`,
                    edit: waitingMsg.key
                });
            } else {
                throw new Error("AI did not provide a response.");
            }
        } catch (error) {
            console.error("Error in summarize command:", error.response ? error.response.data : error.message);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Sorry, I couldn't summarize the chat right now." }, { quoted: m });
        }
    }
};
