// ======================================================
// SIM INFO — operator-only (offline, prefix based)
// Sirf network/operator batata hai — koi personal data
// (naam/CNIC/address) NAHI. Purani leaked-database API
// wali command 2026-10-23 ko is se replace hui.
// Note: MNP (number portability) ki wajah se asal
// network prefix wale network se mukhtalif ho sakta hai.
// ======================================================
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });

const OPERATORS = [
    { name: 'Jazz 📱', test: p => (p >= '0300' && p <= '0309') || (p >= '0321' && p <= '0325'), note: '0321–0325 purani Warid series hai, ab Jazz ke paas hai.' },
    { name: 'Zong 📱', test: p => (p >= '0310' && p <= '0319') || p === '0370', note: '' },
    { name: 'Telenor 📱', test: p => p >= '0340' && p <= '0349', note: '' },
    { name: 'Ufone 📱', test: p => p >= '0330' && p <= '0337', note: '' },
    { name: 'SCOM 📱', test: p => p === '0355', note: 'Azad Kashmir / Gilgit-Baltistan ka network hai.' },
];

const command = {
    name: 'simdata',
    alias: ['siminfo', 'operator', 'network'],
    exec: async (sock, m, args) => {
        let num = (args[0] || '').replace(/\D/g, '');
        if (!num) return send(sock, m, '📱 Number likho!\n*Example:* .simdata 03321234567');
        if (num.startsWith('92') && num.length === 12) num = '0' + num.slice(2);
        if (!/^03\d{9}$/.test(num)) return send(sock, m, `❌ Ye Pakistani mobile number nahi lagta.\n*Example:* 03321234567`);
        const prefix = num.slice(0, 4);
        const op = OPERATORS.find(o => o.test(prefix));
        const masked = num.slice(0, 4) + '-' + num.slice(4);
        if (!op) return send(sock, m, `📱 *Number:* ${masked}\n📶 *Operator:* Maloom nahi (naya/ajeeb prefix hai)\n\n_Note: MNP se number doosre network par gaya ho to prefix purana network batata hai._`);
        return send(sock, m, `📱 *SIM Info*\n\n📞 *Number:* ${masked}\n📶 *Operator (prefix):* ${op.name}\n🇵🇰 *Country:* Pakistan${op.note ? `\nℹ️ ${op.note}` : ''}\n\n_Note: Ye sirf number ke prefix se andaza hai. MNP (number portability) se asal network badla ho sakta hai. Ye command koi personal data (naam/CNIC/address) nahi dikhati._`);
    }
};

module.exports = command;
