const command = {
    name: "restart",
    exec: async (sock, m, args) => {
        try {
            await sock.sendMessage(m.key.remoteJid, { text: "♻️ Restarting the bot..." });
            // This command uses a special feature of Heroku to restart the bot
            // It will exit the current process, and Heroku will automatically start a new one.
            process.exit(0);
        } catch (error) {
            console.error("Error in restart command:", error);
        }
    },
};

export default command;
