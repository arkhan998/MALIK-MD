require("dotenv").config();

const config = {
  // SESSION_ID Heroku se aayega
  SESSION_ID: process.env.SESSION_ID || "MALIK-MD~7Ec2zYhS#gKxxxGNOpYD9m7Hn9p05btR3milwMT4mBq4z-184GJk",

  // Bot ka prefix
  prefix: process.env.PREFIX || ".",

  // Bot ka mode (public ya private)
  MODE: process.env.MODE || "public",

  // Owner ka naam aur number
  OWNER_NAME: process.env.OWNER_NAME || "🦋⃟ᴠͥɪͣᴘͫ✮⃝🇲ᗩしᏆᏦ 🇸αнαв𝄟⃝",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "923322964709",

  // Subscribed users ki list Heroku se aayegi
  // .split(',') isko [ 'number1', 'number2' ] me badal dega
  SUBSCRIBED_USERS: process.env.SUBSCRIBED_USERS ? process.env.SUBSCRIBED_USERS.split(',') : ["923124533358", "923474838534"],

  // Google Gemini API Key Heroku se aayegi
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyA_AuZSidaQ7J0-JgYpqikOX_Sz-PuN51k",

  // Baaki saare features
  AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN === 'true',
  AUTO_READ: process.env.AUTO_READ === 'true',
  AUTO_TYPING: process.env.AUTO_TYPING === 'true',
  AUTO_RECORDING: process.env.AUTO_RECORDING === 'true',
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE === 'true',
  REJECT_CALL: process.env.REJECT_CALL === 'true',
  WELCOME: process.env.WELCOME === 'true',
};

module.exports = config;
