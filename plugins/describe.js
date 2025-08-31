const axios = require('axios');
const config = require('../config.cjs');
const { Buffer } = require('buffer');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: "describe",
    alias: ["whatisthis", "askimg", "vision"],
    exec: async (sock, m, args) => {
        try {
            const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            // Check if the user is replying to a message and if that message is an image
            if (!quotedMessage || !quotedMessage.imageMessage) {
                return await sock.sendMessage(m.key.remoteJid, { text: "Please reply to an image to use this command." }, { quoted: m });
            }

            if (!config.GEMINI_API_KEY) {
                return await sock.sendMessage(m.key.remoteJid, { text: "⚠️ *API Key Not Found*\n\nThe owner has not set the Gemini API key for Vision features." }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, { text: "🖼️ *Analyzing the image with AI Vision...*\n\nThis might take a moment." }, { quoted: m });

            // Download the image buffer from the quoted message
            const imageBuffer = await downloadMediaMessage(quotedMessage, 'buffer', {});
            const mimeType = quotedMessage.imageMessage.mimetype; // Get the actual mime type

            const base64Image = imageBuffer.toString('base64');

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${config.GEMINI_API_KEY}`;
            
            // Allow the user to ask a specific question about the image
            const userPrompt = args.join(" ") || "Describe this image in detail.";

            const payload = {
                contents: [
                    {
                        parts: [
                            { text: userPrompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ]
            };

            const { data } = await axios.post(apiUrl, payload);

            if (data.candidates && data.candidates[0].content.parts[0].text) {
                const description = data.candidates[0].content.parts[0].text;
                
                const stylishCaption = `*🤖 AI Image Analysis ✨*\n\n${description}\n\n*Powered by 🦋⃟ᴠͥɪͣᴘͫ✮⃝🇲ᗩしᏆᏦ 🇸αнαв𝄟⃝*`;

                await sock.sendMessage(m.key.remoteJid, { text: stylishCaption }, { quoted: m });
            } else {
                 throw new Error("Invalid response from Vision API or no description generated.");
            }

        } catch (error) {
            console.error("Error in describe command:", error.response ? error.response.data : error.message);
            let errorMessage = "Sorry, I couldn't analyze the image. The AI service might be busy or the image format is not supported.";
             if (error.response && error.response.data && error.response.data.error) {
                errorMessage += `\n*Reason:* ${error.response.data.error.message}`;
            }
            await sock.sendMessage(m.key.remoteJid, { text: errorMessage }, { quoted: m });
        }
    }
};
