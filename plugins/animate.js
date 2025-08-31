const axios = require('axios');
const config = require('../config.cjs');
const { Buffer } = require('buffer');

// Helper function to wait for a specific duration
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    name: "animate",
    alias: ["aivideo", "veo", "tovideo"],
    exec: async (sock, m, args) => {
        try {
            const prompt = args.join(" ");
            if (!prompt) {
                return await sock.sendMessage(m.key.remoteJid, { text: "Please provide a prompt to generate a video.\n\n*Example:* `!animate a majestic lion roaring on a cliff`" }, { quoted: m });
            }

            if (!config.GEMINI_API_KEY) {
                return await sock.sendMessage(m.key.remoteJid, { text: "⚠️ *API Key Not Found*\n\nThe owner has not set the Gemini API key." }, { quoted: m });
            }

            // --- Initial Message to User ---
            await sock.sendMessage(m.key.remoteJid, { text: "🎬 *AI Video Generation Started*\n\nYour prompt has been sent to the AI. This process can take several minutes. Please be patient, I will send the video once it's ready." }, { quoted: m });

            const startGenerationUrl = `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:generateVideos?key=${config.GEMINI_API_KEY}`;
            
            const payload = {
                prompt: prompt,
                config: {
                    aspect_ratio: "16:9",
                    number_of_videos: 1,
                    duration_seconds: 8,
                }
            };

            // --- Start the Generation Process ---
            const startResponse = await axios.post(startGenerationUrl, payload);
            const operation = startResponse.data;

            if (!operation || !operation.name) {
                throw new Error("Failed to start video generation process.");
            }

            let isDone = false;
            let finalResult;
            const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operation.name}?key=${config.GEMINI_API_KEY}`;
            
            // --- Polling Loop to Check Status ---
            // The bot will check every 15 seconds if the video is ready.
            while (!isDone) {
                await sleep(15000); 
                const pollResponse = await axios.get(pollUrl);
                const currentStatus = pollResponse.data;
                
                if (currentStatus.done) {
                    isDone = true;
                    finalResult = currentStatus;
                }
            }
            
            if (!finalResult || !finalResult.response || !finalResult.response.generatedVideos || finalResult.response.generatedVideos.length === 0) {
                 throw new Error("Video generation completed, but no video data was found.");
            }

            const videoUri = finalResult.response.generatedVideos[0].video.uri;
            
            // --- Announce Download ---
            await sock.sendMessage(m.key.remoteJid, { text: "✅ *Generation Complete!* \n\nDownloading your video now..." }, { quoted: m });

            // --- Download and Send the Video ---
            const videoResponse = await axios.get(videoUri, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(videoResponse.data, 'binary');

            const stylishCaption = `*🎬 AI Video Generated ✨*\n\n*Prompt:* ${prompt}\n\n*Powered by 🦋⃟ᴠͥɪͣᴘͫ✮⃝🇲ᗩしᏆᏦ 🇸αнαв𝄟⃝*`;

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    video: videoBuffer,
                    caption: stylishCaption,
                    mimetype: 'video/mp4',
                },
                { quoted: m }
            );

        } catch (error) {
            console.error("Error in animate command:", error.response ? error.response.data.error : error.message);
            let errorMessage = "Sorry, I couldn't generate the video. The process failed.";
             if (error.response && error.response.data && error.response.data.error) {
                errorMessage += `\n*Reason:* ${error.response.data.error.message}`;
            }
            await sock.sendMessage(m.key.remoteJd, { text: errorMessage }, { quoted: m });
        }
    }
};
