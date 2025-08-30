// config.cjs
const fs = require("fs");
require("dotenv").config();

const config = {
  // Session ID from Heroku Vars
  SESSION_ID: process.env.SESSION_ID || "",

  // Bot Features (can be controlled from Heroku Vars)
  AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN === 'true', // Default: false
  AUTO_READ: process.env.AUTO_READ === 'true', // Default: false
  AUTO_TYPING: process.env.AUTO_TYPING === 'true', // Default: false
  AUTO_RECORDING: process.env.AUTO_RECORDING === 'true', // Default: false
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE === 'true', // Default: false
  REJECT_CALL: process.env.REJECT_CALL === 'true', // Default: true
  WELCOME: process.env.WELCOME === 'true', // Default: true for welcome messages
  
  // Bot Settings
  MODE: process.env.MODE || "public",
  
  // Owner Details
  OWNER_NAME: process.env.OWNER_NAME || "arkhan998",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "923322964709",
  
  // Fixed Bot Details
  prefix: "!",
  bot_name: "MALIK-MD",
  owner_jid: "923322964709@s.whatsapp.net",
};

module.exports = config;

