const axios = require('axios');
const config = require('../config.js');

module.exports = {
    name: "roast",
    aliases: ["roastme"],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const ctx = m.message?.extendedTextMessage?.contextInfo;

            // Target: mentioned user, else the user being replied to
            let target = null;
            if (ctx?.mentionedJid && ctx.mentionedJid.length > 0) {
                target = ctx.mentionedJid[0];
            } else if (ctx?.participant) {
                target = ctx.participant;
            }

            if (!target) {
                return await sock.sendMessage(jid, {
                    text: "🔥 *Usage:* `.roast @user` ya kisi ke message ka reply karke `.roast` likho.\n\n*Example:*\n.roast @923001234567"
                }, { quoted: m });
            }

            // Never roast the owner 😄
            const targetNum = String(target).replace(/\D/g, '');
            const ownerNum = String(config.OWNER_NUMBER || '').replace(/\D/g, '');
            if (ownerNum && targetNum.endsWith(ownerNum)) {
                return await sock.sendMessage(jid, {
                    text: "😎 *Owner ko roast?*\n\nItni himmat?! Malik Sahib to roast karte hain, roast hote nahi! 👑🔥"
                }, { quoted: m });
            }

            if (!config.GEMINI_API_KEY) {
                return await sock.sendMessage(jid, { text: "❌ Gemini API Key is not set." }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(jid, { text: "🧠 Thinking..." }, { quoted: m });

            const displayName = target.split('@')[0];
            const prompt = `Write a funny, playful, light-hearted roast in Roman Urdu (max 60 words) for a friend (username/number: ${displayName}). Tease about common funny things like late replies, too many selfies, PUBG addiction, or typing "hahaha" on everything. Keep it friendly and funny — no vulgarity, no real insults, nothing hurtful.`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${config.GEMINI_API_KEY}`;
            const response = await axios.post(apiUrl, { contents: [{ parts: [{ text: prompt }] }] });

            if (response.data.candidates && response.data.candidates.length > 0) {
                const roast = response.data.candidates[0].content.parts[0].text;
                await sock.sendMessage(jid, {
                    text: `*🔥 Roast for @${displayName}:*\n\n${roast}\n\n_Just for fun, dil pe mat lena! 😄_`,
                    edit: waitingMsg.key,
                    mentions: [target]
                });
            } else {
                throw new Error("AI did not provide a response.");
            }
        } catch (error) {
            console.error("Error in roast command:", error.response ? error.response.data : error.message);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Sorry, the roast machine is cooling down. Try again!" }, { quoted: m });
        }
    }
};
