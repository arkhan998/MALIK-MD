// config.js

const config = {
    // Bot Owner's JID (e.g., "923001234567@s.whatsapp.net")
    // Replace with your actual WhatsApp number JID
    owner_jid: "923322964709@s.whatsapp.net",

    // Bot Name
    bot_name: "MALIK-MD",

    // Prefix for commands
    // You can choose any prefix, like '!', '.', or '#'
    prefix: "!",

    // Auto-welcome message for new group members
    // Set to false to disable
    auto_welcome: true,
    welcome_message: "Hi @user, welcome to the group!",

    // OpenAI or Gemini API settings (optional)
    // Set 'use_ai' to true to enable AI-powered replies
    use_ai: false, // Switch to true to enable AI
    ai_provider: "gemini", // or "openai"
    api_keys: {
        openai: "YOUR_OPENAI_API_KEY",
        gemini: "7506067954:AAGY7Zo9Whe9IqMv7liT1h1n2Ez3RgJVybg"
    },

    // Port for the Express server
    server_port: process.env.PORT || 3000
};

module.exports = config;
