const { getIntroAudio } = require('../lib/intro.js');

module.exports = {
    name: "malik",
    alias: ["owner", "creator"], // Aap is command ko !owner ya !creator likh kar bhi chala sakte hain
    exec: async (sock, m, args) => {
        try {
            // Intro voice note — repo ke andar se (koi external link nahi)
            await sock.sendMessage(
                m.key.remoteJid,
                {
                    audio: getIntroAudio(),
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true // This makes it a push-to-talk voice note
                },
                { quoted: m }
            );

        } catch (error) {
            console.error("Error in malik command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "Sorry, I couldn't send the voice note." }, { quoted: m });
        }
    }
};
