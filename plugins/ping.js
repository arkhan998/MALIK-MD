const command = {
    name: 'ping',
    aliases: ['speed'],
    exec: async (sock, m, args) => {
        try {
            const startTime = Date.now();
            
            // Send an initial message to calculate the round trip time
            const sentMsg = await sock.sendMessage(m.key.remoteJid, { text: 'Pinging...' });
            
            const endTime = Date.now();
            const speed = endTime - startTime;
            
            // Edit the initial message with the final response time
            await sock.sendMessage(m.key.remoteJid, { 
                text: `*Pong!* 🏓\n_Response Time: ${speed} ms_`,
                edit: sentMsg.key 
            });

        } catch (error) {
            console.error("Error in ping command:", error);
        }
    }
};

export default command;

