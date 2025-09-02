const axios = require('axios');
const config = require('../config.js'); // AI Key ke liye config file zaroori hai

// Backup ke liye Roman Urdu Quotes ki list
const romanUrduQuotes = [
    "Kamiyabi mehnat se milti hai, qismat se nahi.",
    "Har naya din ek naya mauqa hai kuch behtar karne ka.",
    "Mushkil waqt aapko mazboot banane ke liye aata hai, kamzor karne ke liye nahi.",
    "Choti choti koshishein hi bari kamiyabi ki bunyad banti hain.",
    "Apne aaj ko behtar banao, kal khud behtar ho jayega."
];

// ======================================================
// YEH HAI NAYA FUNCTION JO AI SE QUOTE HASIL KAREGA
// ======================================================
async function getAIQuote() {
    try {
        if (!config.GEMINI_API_KEY) {
            console.log(chalk.yellow("GEMINI_API_KEY not found, using fallback quote."));
            return null; // Agar API key nahi hai to aage na barho
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${config.GEMINI_API_KEY}`;
        const prompt = "Generate a short, one-line inspirational and motivational quote in Roman Urdu.";

        const requestData = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        const response = await axios.post(apiUrl, requestData);
        const quote = response.data.candidates[0].content.parts[0].text;
        
        // AI ke jawab se faltu characters (jaise *) saaf karna
        return quote.replace(/[*"]/g, '').trim();

    } catch (error) {
        console.error("Error fetching AI quote:", error.response ? error.response.data : error.message);
        return null; // Agar error aaye to null bhejo
    }
}
// ======================================================

async function generateReminderData() {
    let gregorianDate = "Not available";
    let islamicDate = "Not available";
    let quote = ""; // Quote ko shuru me khali rakha hai
    let surahInfo = "Surah Al-Fatiha (The Opening)";
    let audioUrl = null;

    // Pehle AI se quote lene ki koshish karna
    quote = await getAIQuote();

    // Agar AI se quote nahi mila, to backup list se ek le lo
    if (!quote) {
        quote = romanUrduQuotes[Math.floor(Math.random() * romanUrduQuotes.length)];
    }

    try {
        const today = new Date();
        gregorianDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { console.error("Error getting Gregorian date:", e.message); }

    try {
        const today = new Date();
        const dateForApi = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const hijriResponse = await axios.get(`http://api.aladhan.com/v1/gToH?date=${dateForApi}&adjustment=1`);
        const hijriData = hijriResponse.data.data.hijri;
        islamicDate = `${hijriData.day} ${hijriData.month.en} ${hijriData.year} AH`;
    } catch (e) { console.error("Error fetching Islamic date:", e.message); }

    try {
        const randomSurahNumber = Math.floor(Math.random() * 114) + 1;
        const surahResponse = await axios.get(`https://quran-endpoint.vercel.app/quran/${randomSurahNumber}`);
        const surahData = surahResponse.data.data;
        const surahName = surahData.asma.en.long;
        const surahMeaning = surahData.asma.en.translation;
        surahInfo = `Surah ${surahName} (${surahMeaning})\n*(Surah No: ${randomSurahNumber})*`;
        audioUrl = surahData.recitation.full;
    } catch (e) { console.error("Error fetching Surah:", e.message); }

    const textMessage = `*Assalam-o-Alaikum! ☀️ Subha Bakhair*\n\n` +
                        `*📅 Aaj ki Tareekh:* ${gregorianDate}\n` +
                        `*🌙 Islami Tareekh:* ${islamicDate}\n\n` +
                        `*📖 Aaj ki Surah:*\n${surahInfo}\n\n` +
                        `*💡 AI ka Paigham:*\n_"${quote}"_\n\n` +
                        `*Have a blessed day! - MALIK-MD*`;
    
    return { textMessage, audioUrl };
}

module.exports = { generateReminderData };

