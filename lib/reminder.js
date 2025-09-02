const axios = require('axios');

async function generateReminderMessage() {
    try {
        // 1. Aaj ki English date hasil karna
        const today = new Date();
        const gregorianDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        // 2. Islamic date hasil karna
        const dateForApi = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const hijriResponse = await axios.get(`http://api.aladhan.com/v1/gToH?date=${dateForApi}`);
        const hijriData = hijriResponse.data.data.hijri;
        const islamicDate = `${hijriData.day} ${hijriData.month.en} ${hijriData.year} AH`;

        // 3. Motivational quote hasil karna
        const quoteResponse = await axios.get('https://api.quotable.io/random?tags=inspirational|wisdom|life');
        const quote = `"${quoteResponse.data.content}" - ${quoteResponse.data.author}`;

        // 4. Random Surah ka naam hasil karna
        const randomSurahNumber = Math.floor(Math.random() * 114) + 1;
        const surahResponse = await axios.get(`https://quran-endpoint.vercel.app/quran/${randomSurahNumber}`);
        const surahName = surahResponse.data.data.asma.en.long;
        const surahMeaning = surahResponse.data.data.asma.en.translation;

        // 5. Poora message tayyar karna
        const message = `*Assalam-o-Alaikum! ☀️ Subha Bakhair*\n\n` +
                        `*📅 Aaj ki Tareekh:* ${gregorianDate}\n` +
                        `*🌙 Islami Tareekh:* ${islamicDate}\n\n` +
                        `*📖 Aaj ki Surah:* Surah ${surahName} (${surahMeaning})\n` +
                        `*(Surah No: ${randomSurahNumber})*\n\n` +
                        `*💡 Aaj ka Paigham:*\n${quote}\n\n` +
                        `*Have a blessed day! - MALIK-MD*`;
        
        return message;

    } catch (error) {
        console.error("Error generating reminder message:", error);
        return "Sorry, I couldn't generate the daily reminder today.";
    }
}

module.exports = { generateReminderMessage };
