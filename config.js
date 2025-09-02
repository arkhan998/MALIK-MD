const fs = require('fs');
require("dotenv").config();

// Default settings
const config = {
  SESSION_ID: process.env.SESSION_ID || "MALIK-MD~7Ec2zYhS#gKxxxGNOpYD9m7Hn9p05btR3milwMT4mBq4z-184GJk",
  prefix: process.env.PREFIX || ".",
  MODE: process.env.MODE || "public",
  OWNER_NAME: process.env.OWNER_NAME || "MALIK SAHAB",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "923322964709",
  SUBSCRIBED_USERS: process.env.SUBSCRIBED_USERS ? process.env.SUBSCRIBED_USERS.split(',') : ["923311308116", "923124533358"],
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyA_AuZSidaQ7J0-JgYpqikOX_Sz-PuN51k",

  // --- TRIGGERS ---
  // Bot ke features ko on/off karne ke liye.
  // Yeh settings bot ke restart hone par reset ho jati hain.
  TRIGGERS: {
      welcome: process.env.WELCOME === 'true',
      reject_call: process.env.REJECT_CALL === 'true',
      auto_status_seen: process.env.AUTO_STATUS_SEEN === 'true',
      auto_read: process.env.AUTO_READ === 'true',
  }
};

module.exports = config;

