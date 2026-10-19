const axios = require('axios');
const config = require('../config.js');

const STYLES = ['professional', 'funny', 'romantic', 'serious', 'simple'];

module.exports = {
    name: "tone",
    aliases: ["rewrite"],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const style = (args[0] || '').toLowerCase();
            const text = args.slice(1).join(' ').trim();

            if (!STYLES.includes(style) || !text) {
                return await sock.sendMessage(jid, {
                    text: `🎭 *Usage:* .tone <style> <your message>\n\n*Styles:* ${STYLES.join(' | ')}\n\n*Example:*\n.tone funny yaar kal milte hain`
                }, { quoted: m });
            }

            if (!config.GEMINI_API_KEY) {
                return await sock.sendMessage(jid, { text: "❌ Gemini API Key is not set." }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(jid, { text: "🧠 Thinking..." }, { quoted: m });

            const prompt = `Rewrite this message in a ${style} tone, in Roman Urdu. Keep the original meaning, max 80 words. Output the rewritten message only, no explanation: "${text}"`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${config.GEMINI_API_KEY}`;
            const response = await axios.post(apiUrl, { contents: [{ parts: [{ text: prompt }] }] });

            if (response.data.candidates && response.data.candidates.length > 0) {
                const rewritten = response.data.candidates[0].content.parts[0].text;
                await sock.sendMessage(jid, {
                    text: `*🎭 ${style} tone:*\n\n${rewritten}\n\n- - - - - - - - - - -\n*Powered by MALIK-MD*`,
                    edit: waitingMsg.key
                });
            } else {
                throw new Error("AI did not provide a response.");
            }
        } catch (error) {
            console.error("Error in tone command:", error.response ? error.response.data : error.message);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Sorry, I couldn't rewrite that right now." }, { quoted: m });
        }
    }
};
