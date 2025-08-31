const config = require('../config.cjs');

module.exports = {
    name: "listusers",
    alias: ["subs", "list"],
    ownerOnly: true, // This makes the command owner-only
    exec: async (sock, m) => {
        try {
            const subscribedUsers = config.SUBSCRIBED_USERS.split(',').filter(num => num.trim() !== '');
            
            if (subscribedUsers.length === 0) {
                return await sock.sendMessage(m.key.remoteJid, { text: "There are currently no subscribed users." }, { quoted: m });
            }

            let userList = "👑 *Subscribed Users*\n\n";
            subscribedUsers.forEach((user, index) => {
                userList += `${index + 1}. ${user.trim()}\n`;
            });
            
            userList += "\nTo add or remove users, please update the SUBSCRIBED_USERS variable in Heroku dashboard.";

            await sock.sendMessage(m.key.remoteJid, { text: userList }, { quoted: m });
        } catch (error) {
            console.error("Error in listusers command:", error);
        }
    }
};
