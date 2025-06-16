/**
 * @info - WhatsApp Pairing Code Command for MALIK-MD
 * @description - Generates a WhatsApp pairing code using an external API.
 * @author - User provided, adapted by Gemini for MALIK-MD
 * @updated_by - ARKHAN
 */

const { command } = require("../lib/");
const fetch = require('node-fetch');

command({
    pattern: "pair",
    alias: ["getpair", "clonebot"],
    fromMe: true, // Yeh command sirf bot owner use kar sakta hai
    desc: "WhatsApp ke liye pairing code banata hai",
    category: "owner",
    use: ".pair <phone_number>",
    filename: __filename
}, 
async (message, match, client) => {
    try {
        // Agar user ne number nahi diya to example ke saath message bhejein
        if (!match) {
            return await message.reply("*_Please provide a phone number with the country code._*\n*Example:* .pair 923184070915");
        }

        // Number se non-digit characters (jaise '+') hata dein
        const phoneNumber = match.replace(/[^0-9]/g, '');

        // User ko batayein ki code generate ho raha hai
        await message.reply(`Generating pairing code for *${phoneNumber}*... Please wait. ✨`);

        // External API se pairing code fetch karein
        const response = await fetch(`https://awais-md-pair.onrender.com/code?number=${phoneNumber}`);
        
        // Agar API se response na aaye to error handle karein
        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }

        const pairData = await response.json();

        // Agar API ne code nahi bheja ya koi error aya to user ko batayein
        if (!pairData || !pairData.code) {
            return await message.reply("❌ Failed to retrieve pairing code.\nThe service might be down, or the phone number is invalid. Please try again later.");
        }

        const pairingCode = pairData.code;
        const successMessage = `> *MALIK-MD Pairing Code*`;

        // Pairing code ko user ko bhejein
        await message.reply(`${successMessage}\n\n*Here is your pairing code:*\n*${pairingCode}*`);
       
        // 2 second ke baad, code ko dobara bhejein taaki copy karna aasan ho
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        await message.reply(pairingCode);

    } catch (error) {
        // Agar koi aur error aaye to console mein log karein aur user ko batayein
        console.error("Error in pair command:", error);
        await message.reply("An error occurred while generating the pairing code. Please try again later.");
    }
});
