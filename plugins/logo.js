const axios = require('axios');

const command = {
    name: "logo",
    alias: ["banner", "profilepic"],
    exec: async (sock, m, args) => {
        try {
            const waitingMsg = await sock.sendMessage(m.key.remote_id, { text: "🎨 Generating your official MALIK-MD logo... This is a high-quality render and might take a moment." }, { quoted: m });

            // Yeh wohi zabardast prompt hai jo aapne bheja tha
            const professionalPrompt = `An ultra-realistic, cinematic, and professional-style studio photo of a computer monitor showing coding scripts. The image is taken from a wide angle, capturing a spacious studio environment. The text "MALIK-MD" is prominently displayed in bold, chrome 3D letters, casting a cool reflection. Below it, in a slightly smaller size, the text "MULTI DEVICE WHATSAPP BOT" is written in a vibrant yellow color with a clean white stroke, and below that, "Developer:MALIK SAHIB" is written in bold white color. The overall atmosphere is dark with a futuristic and technological feel, enhanced by dramatic, high-contrast lighting that illuminates the details of the scene. The image quality is extremely sharp, with intricate details that make it look incredibly real.`;
            
            // Hum StabilityAI wala model istemal kar rahe hain jo high quality images banata hai
            const apiUrl = `https://api.siputzx.my.id/api/ai/stabilityai?prompt=${encodeURIComponent(professionalPrompt)}`;
            
            const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

            if (!response || !response.data) {
                return sock.sendMessage(m.key.remote_id, { text: "Error: The API did not return a valid image.", edit: waitingMsg.key }, { quoted: m });
            }

            const imageBuffer = Buffer.from(response.data, "binary");
            const caption = `*👑 Here is your official MALIK-MD Logo! 👑*\n\n*Powered by MALIK-MD*`;

            await sock.sendMessage(m.key.remote_id, {
                image: imageBuffer,
                caption: caption
            }, { quoted: m });

            await sock.sendMessage(m.key.remote_id, { delete: waitingMsg.key });

        } catch (error) {
            console.error("Logo Command Error:", error);
            await sock.sendMessage(m.key.remote_id, { text: `An error occurred. The AI service might be busy.` }, { quoted: m });
        }
    }
};

module.exports = command;
 
