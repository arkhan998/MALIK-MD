const axios = require('axios');
const config = require('../config.cjs');

module.exports = {
    name: "imagine",
    alias: ["aiimg", "genimg", "dalle"],
    exec: async (sock, m, args) => {
        try {
            const prompt = args.join(" ");
            if (!prompt) {
                return await sock.sendMessage(m.key.remoteJid, { text: "Please provide a prompt to generate an image.\n\n*Example:* `!imagine a beautiful horse on fire`" }, { quoted: m });
            }

            if (!config.GEMINI_API_KEY) {
                return await sock.sendMessage(m.key.remoteJid, { text: "⚠️ *API Key Not Found*\n\nThe owner has not set the Gemini API key. This feature is currently unavailable." }, { quoted: m });
            }

            // Let the user know the bot is working
            await sock.sendMessage(m.key.remoteJid, { text: "🎨 Generating your image with AI...\n\nThis might take a moment." }, { quoted: m });

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${config.GEMINI_API_KEY}`;

            const payload = {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseModalities: ["IMAGE"]
                },
            };

            const { data } = await axios.post(apiUrl, payload);
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content.parts[0].inlineData.data) {
                const base64Data = data.candidates[0].content.parts[0].inlineData.data;
                const imageBuffer = Buffer.from(base64Data, 'base64');
                
                const stylishCaption = `*✨ Image Generated with AI ✨*\n\n*Prompt:* ${prompt}\n\n*Powered by 🦋⃟ᴠͥɪͣᴘͫ✮⃝🇲ᗩしᏆᏦ 🇸αнαв𝄟⃝*`;

                await sock.sendMessage(
                    m.key.remoteJid,
                    {
                        image: imageBuffer,
                        caption: stylishCaption,
                    },
                    { quoted: m }
                );
            } else {
                 throw new Error("Invalid response structure from API or no image generated.");
            }

        } catch (error) {
            console.error("Error in imagine command:", error.response ? error.response.data : error.message);
            let errorMessage = "Sorry, I couldn't generate the image. There might be an issue with the AI service or the API key.";
             if (error.response && error.response.data && error.response.data.error) {
                errorMessage += `\n*Reason:* ${error.response.data.error.message}`;
            }
            await sock.sendMessage(m.key.remoteJd, { text: errorMessage }, { quoted: m });
        }
    }
};
