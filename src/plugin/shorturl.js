const axios = require("axios");

module.exports = {
  name: "shorturl",
  description: "Converts a long URL into a short one",
  category: "utility",
  usage: ".shorturl <link>",
  async execute(m, { args, sendButton }) {
    if (!args[0]) return m.reply("Plz provide a URL.\nExample: `.shorturl https://example.com`");

    const url = args[0];

    try {
      const response = await axios.get(`https://api.shrtco.de/v2/shorten?url=${url}`);
      const short = response.data.result.full_short_link;

      await sendButton(m.chat, `✅ URL Shortened Successfully!`, [
        { buttonId: short, buttonText: { displayText: "Open Short URL" }, type: 1 }
      ], `🔗 Short URL: ${short}`);
    } catch (e) {
      console.log(e);
      m.reply("❌ Invalid or unreachable URL. Try again.");
    }
  },
};
