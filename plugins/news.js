const axios = require('axios');
const config = require('../config.js');

const command = {
    name: "news",
    alias: ["khabrein"],
    exec: async (sock, m, args) => {
        try {
            // Check karna ke user ne Urdu news maangi hai ya English
            let lang = 'en'; // Default English
            if (args[0] && args[0].toLowerCase() === 'urdu') {
                lang = 'ur';
            }

            const waitingMsg = await sock.sendMessage(m.key.remoteJid, { text: `📰 Fetching latest news from Pakistan...` }, { quoted: m });

            const GNEWS_API_KEY = "d55e4bcb8a3a797543dd3b19d05ae662";
            const url = `https://gnews.io/api/v4/top-headlines?lang=${lang}&country=pk&max=5&apikey=${GNEWS_API_KEY}`;
            
            const { data } = await axios.get(url);

            if (!data.articles || data.articles.length === 0) {
                const noNewsMessage = lang === 'ur' ? "❌ Maazrat, is waqt koi taaza khabar dastiyab nahi hai." : "❌ Sorry, no latest news is available at the moment.";
                return sock.sendMessage(m.key.remoteJid, { text: noNewsMessage, edit: waitingMsg.key }, { quoted: m });
            }

            let newsList = `*📰 Latest News (${lang === 'ur' ? 'اردو' : 'English'})*\n\n`;
            
            data.articles.forEach((article, index) => {
                newsList += `*${index + 1}. ${article.title.trim()}*\n`;
                if (article.description) {
                    newsList += `_${article.description.trim()}_\n`;
                }
                newsList += `🔗 ${article.url}\n\n`;
            });

            newsList += `*Powered by MALIK-MD*`;

            await sock.sendMessage(m.key.remoteJid, { text: newsList, edit: waitingMsg.key }, { quoted: m });

        } catch (err) {
            console.error("Error in news command:", err);
            await sock.sendMessage(m.key.remoteJid, { text: "⚠️ An error occurred while fetching the news. The API might be temporarily down." }, { quoted: m });
        }
    }
};

module.exports = command;
