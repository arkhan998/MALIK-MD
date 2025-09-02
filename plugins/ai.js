const axios = require('axios');
const config = require('../config.cjs');

const command = {
    name: "ai",
    aliases: ["gemini", "ask"],
    exec: async (sock, m, args) => {
        try {
            const question = args.join(" ");
            if (!question) {
                return sock.sendMessage(m.key.remoteJid, {
                    text: "🤖 Please ask a question after the command.\n\n*Example:*\n!ai Who is the president of Pakistan?"
                });
            }

            if (!config.GEMINI_API_KEY) {
                return sock.sendMessage(m.key.remoteJid, {
                    text: "❌ Gemini API Key is not set. The owner needs to configure this feature."
                });
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🧠 Thinking..." });

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.GEMINI_API_KEY}`;
            const requestData = {
                contents: [{
                    parts: [{
                        text: question
                    }]
                }]
            };

            const response = await axios.post(apiUrl, requestData);
            const aiResponse = response.data.candidates[0].content.parts[0].text;
            
            // Edit the "Thinking..." message with the final AI response
            await sock.sendMessage(m.key.remoteJid, { 
                text: `*🤖 Gemini AI Response:*\n\n${aiResponse}\n\n- - - - - - - - - - -\n*Powered by MALIK-MD*`,
                edit: waitingMsg.key 
            });

        } catch (error) {
            console.error("Error in AI command:", error.response ? error.response.data : error.message);
            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ Sorry, I couldn't connect to the AI service right now. Please try again later."
            });
        }
    },
};

module.exports = command;
