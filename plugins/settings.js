const config = require('../config.js');

module.exports = {
    name: "settings",
    alias: ["botsettings"],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        try {
            // Button click ko handle karne ke liye
            if (args[0] === 'toggle' && args[1]) {
                const feature = args[1];
                if (feature in config.TRIGGERS) {
                    // Setting ko on se off ya off se on karna
                    config.TRIGGERS[feature] = !config.TRIGGERS[feature];
                    const status = config.TRIGGERS[feature] ? 'ON ✅' : 'OFF ❌';
                    const featureName = feature.replace(/_/g, ' ').toUpperCase();
                    await sock.sendMessage(m.key.remoteJid, { text: `*${featureName}* has been turned *${status}*.` }, { quoted: m });
                } else {
                    await sock.sendMessage(m.key.remoteJid, { text: `Unknown feature: ${feature}` }, { quoted: m });
                }
                return; 
            }

            // Settings ka menu dikhane ke liye
            const { welcome, reject_call, auto_status_seen, auto_read } = config.TRIGGERS;

            const menuText = `*⚙️ Bot Settings Panel*\n\nControl bot features from here. These settings will reset when the bot restarts. For permanent changes, update your Heroku Config Vars.`;

            const buttons = [
                {
                    buttonId: `${config.prefix}settings toggle welcome`,
                    buttonText: { displayText: `Welcome Message: ${welcome ? 'ON ✅' : 'OFF ❌'}` },
                    type: 1
                },
                {
                    buttonId: `${config.prefix}settings toggle reject_call`,
                    buttonText: { displayText: `Reject Call: ${reject_call ? 'ON ✅' : 'OFF ❌'}` },
                    type: 1
                },
                {
                    buttonId: `${config.prefix}settings toggle auto_status_seen`,
                    buttonText: { displayText: `Auto Status Seen: ${auto_status_seen ? 'ON ✅' : 'OFF ❌'}` },
                    type: 1
                },
                {
                    buttonId: `${config.prefix}settings toggle auto_read`,
                    buttonText: { displayText: `Auto Read Msgs: ${auto_read ? 'ON ✅' : 'OFF ❌'}` },
                    type: 1
                },
            ];

            const buttonMessage = {
                text: menuText,
                footer: `Powered by ${config.OWNER_NAME}`,
                buttons: buttons,
                headerType: 1
            };

            await sock.sendMessage(m.key.remoteJid, buttonMessage);

        } catch (error) {
            console.error("Error in settings command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "An error occurred in settings." });
        }
    }
};

