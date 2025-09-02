const axios = require('axios');
const config = require('../config.js'); // Aapke bot ki config file

const command = {
    name: "weather",
    alias: ["mausam"],
    exec: async (sock, m, args) => {
        try {
            const city = args.join(" ");
            if (!city) {
                return sock.sendMessage(m.key.remoteJid, { text: "Please provide a city name.\n\n*Example:*\n.weather Lahore" }, { quoted: m });
            }

            // OpenWeatherMap se free API key hasil ki ja sakti hai
            const apiKey = '2d61a72574c11c4f36173b627f8cb177'; 
            const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
            
            const response = await axios.get(url);
            const data = response.data;

            const weatherInfo = `*🌤️ Weather Information for ${data.name}, ${data.sys.country}*\n\n` +
                                `*🌡️ Temperature:* ${data.main.temp}°C\n` +
                                `*🌡️ Feels Like:* ${data.main.feels_like}°C\n` +
                                `*💧 Humidity:* ${data.main.humidity}%\n` +
                                `*☁️ Weather:* ${data.weather[0].description}\n` +
                                `*💨 Wind Speed:* ${data.wind.speed} m/s\n\n` +
                                `*Powered by MALIK-MD*`;
            
            await sock.sendMessage(m.key.remoteJid, { text: weatherInfo }, { quoted: m });

        } catch (e) {
            console.error("Error in weather command:", e);
            if (e.response && e.response.status === 404) {
                return sock.sendMessage(m.key.remoteJid, { text: `🚫 City not found: "${args.join(" ")}". Please check the spelling.` }, { quoted: m });
            }
            return sock.sendMessage(m.key.remoteJid, { text: "⚠️ An error occurred while fetching the weather information." }, { quoted: m });
        }
    }
};

module.exports = command;
