import "dotenv/config";

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

  // Subscribed users ki list (Heroku se aayegi)
  SUBSCRIBED_USERS: process.env.SUBSCRIBED_USERS ? process.env.SUBSCRIBED_USERS.split(',') : [],

  // Google Gemini API Key (Heroku se aayegi)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyA_AuZSidaQ7J0-JgYpqikOX_Sz-PuN51k",

  // Baaki saare features
  AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN !== undefined ? process.env.AUTO_STATUS_SEEN === 'true' : true,
  AUTO_READ: process.env.AUTO_READ !== undefined ? process.env.AUTO_READ === 'true' : false,
  AUTO_TYPING: process.env.AUTO_TYPING !== undefined ? process.env.AUTO_TYPING === 'true' : false,
  AUTO_RECORDING: process.env.AUTO_RECORDING !== undefined ? process.env.AUTO_RECORDING === 'true' : false,
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE !== undefined ? process.env.ALWAYS_ONLINE === 'true' : false,
  REJECT_CALL: process.env.REJECT_CALL !== undefined ? process.env.REJECT_CALL === 'true' : false,
  WELCOME: process.env.WELCOME !== undefined ? process.env.WELCOME === 'true' : true,
};

export default config;

