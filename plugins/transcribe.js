const axios = require('axios');
const config = require('../config.js');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: "transcribe",
    aliases: ["tt", "vn2text"],
    exec: async (sock, m, args) => {
        try {
            const jid = m.key.remoteJid;
            const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMessage) {
                return await sock.sendMessage(jid, {
                    text: "🎙️ *Kisi voice note ka reply karke* `.transcribe` likho.\n\n*Example:* voice note par reply → .transcribe"
                }, { quoted: m });
            }

            if (!quotedMessage.audioMessage) {
                return await sock.sendMessage(jid, {
                    text: "❌ Ye voice note/audio nahi hai! Kisi *voice note* ya *audio message* ka reply karke try karo."
                }, { quoted: m });
            }

            if (!config.GEMINI_API_KEY) {
                return await sock.sendMessage(jid, { text: "❌ Gemini API Key is not set." }, { quoted: m });
            }

            const waitingMsg = await sock.sendMessage(jid, { text: "🎙️ *Transcribing voice note...*" }, { quoted: m });

            // Download audio with the v7 wrapper pattern ({ key, message })
            const audioBuffer = await downloadMediaMessage({ key: m.key, message: quotedMessage }, 'buffer', {});
            const base64Audio = audioBuffer.toString('base64');
            const mimeType = (quotedMessage.audioMessage.mimetype || 'audio/ogg').split(';')[0];

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${config.GEMINI_API_KEY}`;
            const payload = {
                contents: [{
                    parts: [
                        { text: "Transcribe this voice note to text. Reply with the transcription only, in the same language spoken." },
                        { inlineData: { mimeType, data: base64Audio } }
                    ]
                }]
            };

            const response = await axios.post(apiUrl, payload);

            if (response.data.candidates && response.data.candidates.length > 0) {
                const transcription = response.data.candidates[0].content.parts[0].text;
                await sock.sendMessage(jid, {
                    text: `*🎙️ Transcription:*\n\n${transcription}\n\n- - - - - - - - - - -\n*Powered by MALIK-MD*`,
                    edit: waitingMsg.key
                });
            } else {
                throw new Error("AI did not provide a response.");
            }
        } catch (error) {
            console.error("Error in transcribe command:", error.response ? error.response.data : error.message);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Sorry, I couldn't transcribe that voice note." }, { quoted: m });
        }
    }
};
