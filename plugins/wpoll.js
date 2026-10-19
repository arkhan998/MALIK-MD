// ======================================================
// WPOLL — native WhatsApp poll
// .poll "question" "option1" "option2" [...] (2-12 options)
// ======================================================

module.exports = {
    name: 'poll',
    aliases: ['vote'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const raw = args.join(' ');
        const parts = [...raw.matchAll(/"([^"]+)"/g)].map(x => x[1].trim()).filter(Boolean);

        if (parts.length < 3) {
            return sock.sendMessage(jid, {
                text: `📊 *Poll banao*\n\n*Example:*\n.poll "Best biryani?" "Student" "Lazeez" "Dhaaba"\n\n• Pehle quotes mein sawal, phir 2 se 12 options\n• Sab quotes (" ") mein likhna zaroori hai`
            }, { quoted: m });
        }
        const question = parts[0];
        const options = parts.slice(1, 13); // max 12 options
        try {
            await sock.sendMessage(jid, {
                poll: { name: question, values: options, selectableCount: 1 }
            }, { quoted: m });
        } catch (e) {
            console.error('poll error:', e.message);
            await sock.sendMessage(jid, { text: '❌ Poll nahi ban saka. Dobara try karo.' }, { quoted: m });
        }
    }
};
