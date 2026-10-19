// Shared presence (typing/recording) toggles + helper
const state = {
    typing: false,     // .autotyping on
    recording: false,  // .autorecording on (voice-note feel)
};

async function showTyping(sock, jid) {
    try {
        if (state.recording) await sock.sendPresenceUpdate('recording', jid);
        else if (state.typing) await sock.sendPresenceUpdate('composing', jid);
    } catch (e) { /* ignore */ }
}

async function hideTyping(sock, jid) {
    try {
        if (state.typing || state.recording) await sock.sendPresenceUpdate('paused', jid);
    } catch (e) { /* ignore */ }
}

module.exports = { state, showTyping, hideTyping };
