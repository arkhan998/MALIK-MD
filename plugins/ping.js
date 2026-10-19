function speedMeter(ms) {
    if (ms < 100) return { bars: '▰▰▰▰▰', label: 'Excellent 🚀' };
    if (ms < 300) return { bars: '▰▰▰▰▱', label: 'Great ⚡' };
    if (ms < 800) return { bars: '▰▰▰▱▱', label: 'Good 👍' };
    if (ms < 2000) return { bars: '▰▰▱▱▱', label: 'Slow 🐢' };
    return { bars: '▰▱▱▱▱', label: 'Laggy 😴' };
}

module.exports = {
    name: 'ping',
    aliases: ['speed'],
    exec: async (sock, m, args) => {
        try {
            const startTime = Date.now();
            const sentMsg = await sock.sendMessage(m.key.remoteJid, { text: '🏓 _Pinging..._' });
            const speed = Date.now() - startTime;
            const meter = speedMeter(speed);
            await sock.sendMessage(m.key.remoteJid, {
                text: `╭━━━〔 🏓 *PONG!* 〕━━━┈⊷
┃★╭──────────────
┃★│ ⚡ *Speed:* ${speed} ms
┃★│ 📶 *Signal:* ${meter.bars}
┃★│ 📊 *Status:* ${meter.label}
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
> 🤖 _MALIK-MD is running smooth!_`,
                edit: sentMsg.key
            }, { quoted: m });
        } catch (error) {
            console.error("Error in ping command:", error);
        }
    }
};
