const axios = require('axios');
const config = require('../config.js');
const { Buffer } = require('buffer');

// This function converts raw PCM audio data from the API into a valid WAV file format.
// It's a JavaScript version of the logic you provided in the Python script.
function pcmToWav(pcmData, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    const chunkSize = 36 + dataSize;

    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(chunkSize, 4);
    buffer.write('WAVE', 8);

    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size for PCM
    buffer.writeUInt16LE(1, 20); // AudioFormat 1 for PCM
    buffer.writeUInt16LE(channels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    // Write the actual audio data
    pcmData.copy(buffer, 44);

    return buffer;
}


module.exports = {
    name: "say",
    alias: ["tts", "speak"],
    exec: async (sock, m, args) => {
        try {
            const textToSpeak = args.join(" ");
            if (!textToSpeak) {
                return await sock.sendMessage(m.key.remoteJid, { text: "Please provide some text to convert to speech.\n\n*Example:* `!say Hello, how are you today?`" }, { quoted: m });
            }

            if (!config.GEMINI_API_KEY) {
                return await sock.sendMessage(m.key.remoteJid, { text: "⚠️ *API Key Not Found*\n\nThe owner has not set the Gemini API key. This feature is currently unavailable." }, { quoted: m });
            }

            // Let the user know the bot is working
            await sock.sendMessage(m.key.remoteJid, { text: "🔊 Converting your text to speech...\n\nThis might take a moment." }, { quoted: m });

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${config.GEMINI_API_KEY}`;
            
            const payload = {
                contents: [{
                    parts: [{ text: textToSpeak }]
                }],
                generationConfig: {
                    responseModalities: ["AUDIO"]
                },
                model: "gemini-2.5-flash-preview-tts"
            };

            const { data } = await axios.post(apiUrl, payload, { responseType: 'json' });

            if (data.candidates && data.candidates[0] && data.candidates[0].content.parts[0].inlineData.data) {
                const base64Data = data.candidates[0].content.parts[0].inlineData.data;
                const pcmBuffer = Buffer.from(base64Data, 'base64');

                // Convert the raw PCM buffer to a WAV buffer
                const wavBuffer = pcmToWav(pcmBuffer);

                await sock.sendMessage(
                    m.key.remoteJid,
                    {
                        audio: wavBuffer,
                        mimetype: 'audio/wav',
                    },
                    { quoted: m }
                );
            } else {
                 throw new Error("Invalid response structure from API or no audio generated.");
            }

        } catch (error) {
            console.error("Error in say command:", error.response ? error.response.data : error.message);
            let errorMessage = "Sorry, I couldn't convert the text to speech. There might be an issue with the AI service or the API key.";
             if (error.response && error.response.data && error.response.data.error) {
                errorMessage += `\n*Reason:* ${error.response.data.error.message}`;
            }
            await sock.sendMessage(m.key.remoteJd, { text: errorMessage }, { quoted: m });
        }
    }
};
