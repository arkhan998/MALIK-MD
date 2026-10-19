const axios = require('axios');
const config = require('../config.js');

module.exports = {
    name: "dream",
    aliases: ["khwab", "tabeer"],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const khwab = args.join(" ").trim();

            if (!khwab) {
                return await sock.sendMessage(jid, {
                    text: "🌙 *Apna khwab likho:*\n\n*Example:*\n.dream maine dekha ke main barish mein udd raha tha"
                }, { quoted: m });
            }

            if (!config.GEMINI_API_KEY) {
                return await sock.sendMessage(jid, { text: "❌ Gemini API Key is not set." }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(jid, { text: "🧠 Thinking..." }, { quoted: m });

            const prompt = `The user dreamt this (written in Roman Urdu/Urdu): "${khwab}". Give a short Islamic + psychological dream interpretation in Roman Urdu with exactly this structure:\n1) Mumkina matlab (possible meaning)\n2) Ek amli mashwara (one practical advice)\nMax 120 words total. Warm, respectful tone. Do not claim certainty — use words like "ho sakta hai".`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${config.GEMINI_API_KEY}`;
            const response = await axios.post(apiUrl, { contents: [{ parts: [{ text: prompt }] }] });

            if (response.data.candidates && response.data.candidates.length > 0) {
                const tabeer = response.data.candidates[0].content.parts[0].text;
                await sock.sendMessage(jid, {
                    text: `*🌙 Khwab ki Tabeer:*\n\n${tabeer}\n\n- - - - - - - - - - -\n*Powered by MALIK-MD*`,
                    edit: waitingMsg.key
                });
            } else {
                throw new Error("AI did not provide a response.");
            }
        } catch (error) {
            console.error("Error in dream command:", error.response ? error.response.data : error.message);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Sorry, I couldn't interpret the dream right now." }, { quoted: m });
        }
    }
};
