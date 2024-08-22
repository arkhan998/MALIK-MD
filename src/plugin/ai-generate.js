const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.generateImage = async (Matrix, m, prompt) => {
    try {
        await m.react("⏳"); // Processing Reaction

        const response = await openai.createImage({
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        const imageUrl = response.data.data[0].url;

        // Sending the image URL back to the user
        await Matrix.sendMessage(m.from, { image: { url: imageUrl }, caption: "Here is your generated image." }, { quoted: m });

        await m.react("✅"); // Success Reaction
    } catch (error) {
        console.error("Error generating image: ", error);
        await Matrix.sendMessage(m.from, { text: "Kuch ghalat ho gaya, please dobara try karo." }, { quoted: m });
        await m.react("❌"); // Failure Reaction
    }
};
