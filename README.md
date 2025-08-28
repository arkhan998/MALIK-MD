MALIK-MD WhatsApp BotA powerful, multi-device WhatsApp bot built with Node.js and @whiskeysockets/baileys. Featuring a plugin-based command system, Heroku deployment support, and more.🚀 FeaturesMulti-Device Support: Connects using a QR code and stays online.Plugin-Based Architecture: Easily add new commands by creating new files in the plugins folder.Heroku Ready: Comes with a Procfile for easy deployment on Heroku.Express Server: Keeps the bot alive and shows an online status page.Dynamic Menu: A stylish and informative menu with live stats like uptime and ping.Admin Commands: Basic commands for group management (kick, add, promote, demote).Auto Welcome: Automatically welcomes new members to a group.☁️ Deploy to HerokuDeploying to Heroku is the easiest way to get your bot online.Note: Replace your-username/MALIK-MD in the deploy button link with your actual GitHub repository link before using it.💻 Local InstallationIf you want to run the bot on your own computer or server, follow these steps.1. Clone the Repository:git clone https://github.com/your-username/MALIK-MD.git
cd MALIK-MD
2. Install Dependencies:npm install
3. Configure the Bot:Open the config.js file and edit the necessary settings, especially the owner_jid.// config.js
module.exports = {
    owner_jid: "923001234567@s.whatsapp.net", // Replace with your WhatsApp number
    bot_name: "MALIK-MD",
    prefix: "!",
    // ... other settings
};
4. Start the Bot:npm start
A QR code will appear in your terminal. Scan it with your phone from WhatsApp > Linked Devices.🤖 Available CommandsHere are some of the default commands available:!menu - Shows the main menu.!ping - Checks if the bot is responsive.!status - Shows the bot's current status.!owner - Shows the owner's contact info.(More commands can be added to the plugins folder.)🤝 ContributingContributions are welcome! If you have ideas for new features or improvements, feel free to open an issue or submit a pull request.Fork the repository.Create a new branch (git checkout -b feature/new-command).Make your changes.Commit your changes (git commit -m 'Add some amazing feature').Push to the branch (git push origin feature/new-command).Open a Pull Request.📄 LicenseThis project is licensed under the MIT License. See the LICENSE file for details.
