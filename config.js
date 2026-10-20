const fs = require('fs');
require("dotenv").config();

// Default settings
const config = {
  SESSION_ID: process.env.SESSION_ID || "MALIK-MD~7Ec2zYhS#gKxxxGNOpYD9m7Hn9p05btR3milwMT4mBq4z-184GJk",
  prefix: process.env.PREFIX || ".",
  MODE: process.env.MODE || "public",
  OWNER_NAME: process.env.OWNER_NAME || "MALIK SAHAB",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "923322964709",
  SUBSCRIBED_USERS: process.env.SUBSCRIBED_USERS ? process.env.SUBSCRIBED_USERS.split(',') : ["923311308116","923124533358"],
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyA_AuZSidaQ7J0-JgYpqikOX_Sz-PuN51k",
// 1. Reminder feature ko ON ya OFF karne ke liye switch

    ENABLE_REMINDERS: process.env.ENABLE_REMINDERS === 'true' || true,



    // 2. Un numbers ki list jinhe roz subha reminder bhejna hai

    REMINDER_USERS: process.env.REMINDER_USERS ? process.env.REMINDER_USERS.split(',') : ["923322964709","923124533358", "923311308116"], 



    // 
  // --- TRIGGERS ---
  // Bot ke features ko on/off karne ke liye.
  // Yeh settings bot ke restart hone par reset ho jati hain.
  TRIGGERS: {
      welcome: process.env.WELCOME === 'true',
      reject_call: process.env.REJECT_CALL === 'true',
      auto_status_seen: process.env.AUTO_STATUS_SEEN === 'true',
      auto_read: process.env.AUTO_READ === 'true',
  },
  // Community links (tappable in chat)
  GROUP_LINK: process.env.GROUP_LINK || "https://chat.whatsapp.com/LO2TNmBHfiy8WIiwR6ACnc",
  CHANNEL_LINK: process.env.CHANNEL_LINK || "https://whatsapp.com/channel/0029VbAf3sx3bbUy90Z9K703",
  // MALIK ERP — Google Sheet stock bridge (Apps Script Web App)
  STOCK_API_URL: process.env.STOCK_API_URL || "",
  STOCK_API_TOKEN: process.env.STOCK_API_TOKEN || "malik-stock-2026",
};

module.exports = config;

