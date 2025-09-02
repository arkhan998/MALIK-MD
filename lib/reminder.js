const axios = require('axios');

async function generateReminderMessage() {
    let gregorianDate = "Not available";
    let islamicDate = "Not available";
    let quote = "May your day be filled with peace and blessings.";
    let surahInfo = "Surah Al-Fatiha (The Opening)";

    // 1. Aaj ki English date hasil karna
    try {
        const today = new Date();
        gregorianDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
        console.error("Error getting Gregorian date:", e.message);
    }

    // 2. Islamic date hasil karna
    try {
        const today = new Date();
        const dateForApi = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const hijriResponse = await axios.get(`http://api.aladhan.com/v1/gToH?date=${dateForApi}`);
        const hijriData = hijriResponse.data.data.hijri;
        islamicDate = `${hijriData.day} ${hijriData.month.en} ${hijriData.year} AH`;
    } catch (e) {
        console.error("Error fetching Islamic date:", e.message);
    }

    // 3. Motivational quote hasil karna
    try {
        const quoteResponse = await axios.get('https://api.quotable.io/random?tags=inspirational|wisdom|life');
        quote = `"${quoteResponse.data.content}"\n- ${quoteResponse.data.author}`;
    } catch (e) {
        console.error("Error fetching quote:", e.message);
    }

    // 4. Random Surah ka naam hasil karna
    try {
        const randomSurahNumber = Math.floor(Math.random() * 114) + 1;
        const surahResponse = await axios.get(`https://quran-endpoint.vercel.app/quran/${randomSurahNumber}`);
        const surahName = surahResponse.data.data.asma.en.long;
        const surahMeaning = surahResponse.data.data.asma.en.translation;
        surahInfo = `Surah ${surahName} (${surahMeaning})\n*(Surah No: ${randomSurahNumber})*`;
    } catch (e) {
        console.error("Error fetching Surah:", e.message);
    }

    // 5. Poora message tayyar karna
    const message = `*Assalam-o-Alaikum! ☀️ Subha Bakhair*\n\n` +
                    `*📅 Aaj ki Tareekh:* ${gregorianDate}\n` +
                    `*🌙 Islami Tareekh:* ${islamicDate}\n\n` +
                    `*📖 Aaj ki Surah:*\n${surahInfo}\n\n` +
                    `*💡 Aaj ka Paigham:*\n${quote}\n\n` +
                    `*Have a blessed day! - MALIK-MD*`;
    
    return message;
}

module.exports = { generateReminderMessage };

