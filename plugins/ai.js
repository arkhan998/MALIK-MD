const axios = require('axios');
const config = require('../config.js');

const command = {
    name: "ai",
    aliases: ["gemini", "ask"],
    exec: async (sock, m, args) => {
        try {
            const question = args.join(" ");
            if (!question) {
                return sock.sendMessage(m.key.remoteJid, { text: "🤖 Please ask a question after the command.\n\n*Example:*\n!ai Who is the president of Pakistan?" });
            }

            if (!config.GEMINI_API_KEY) {
                return sock.sendMessage(m.key.remoteJid, { text: "❌ Gemini API Key is not set." });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🧠 Thinking..." }, { quoted: m });

            // YEH HAI FIX: Google ka naya model istemal kar rahe hain
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${config.GEMINI_API_KEY}`;
            
            const requestData = {
                contents: [{
                    parts: [{
                        text: question
                    }]
                }]
            };

            const response = await axios.post(apiUrl, requestData);
            
            if (response.data.candidates && response.data.candidates.length > 0) {
                const aiResponse = response.data.candidates[0].content.parts[0].text;
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `*🤖 Gemini AI Response:*\n\n${aiResponse}\n\n- - - - - - - - - - -\n*Powered by MALIK-MD*`,
                    edit: waitingMsg.key 
                });
            } else {
                throw new Error("AI did not provide a response.");
            }

        } catch (error) {
            console.error("Error in AI command:", error.response ? error.response.data : error.message);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Sorry, I couldn't connect to the AI service right now." }, { quoted: m });
        }
    },
};

module.exports = command;

