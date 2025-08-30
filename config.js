// config.cjs
const fs = require("fs");
require("dotenv").config();

const config = {
  SESSION_ID: process.env.SESSION_ID || "",
  AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN !== undefined ? process.env.AUTO_STATUS_SEEN === 'true' : false, 
  AUTO_DL: process.env.AUTO_DL !== undefined ? process.env.AUTO_DL === 'true' : false,
  AUTO_READ: process.env.AUTO_READ !== undefined ? process.env.AUTO_READ === 'true' : false,
  AUTO_TYPING: process.env.AUTO_TYPING !== undefined ? process.env.AUTO_TYPING === 'true' : false,
  AUTO_RECORDING: process.env.AUTO_RECORDING !== undefined ? process.env.AUTO_RECORDING === 'true' : false,
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE !== undefined ? process.env.ALWAYS_ONLINE === 'true' : false,
  AUTO_REACT: process.env.AUTO_REACT !== undefined ? process.env.AUTO_REACT === 'true' : false,
  /*auto block only for 212 */
  AUTO_BLOCK: process.env.AUTO_BLOCK !== undefined ? process.env.AUTO_BLOCK === 'true' : false,
  
  REJECT_CALL: process.env.REJECT_CALL !== undefined ? process.env.REJECT_CALL === 'true' : true, 
  // Custom owner details from your file
  MODE: process.env.MODE || "public",
  OWNER_NAME: process.env.OWNER_NAME || "arkhan998",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "923322964709",
  GEMINI_KEY: process.env.GEMINI_KEY || "", // Add your Gemini API key if needed
  WELCOME: process.env.WELCOME !== undefined ? process.env.WELCOME === 'true' : true, 
  
  // Details from our previous config
  prefix: "!",
  bot_name: "MALIK-MD",
  owner_jid: "923322964709@s.whatsapp.net",
};

module.exports = config;
