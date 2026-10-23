// ======================================================
// PACK: DECISION & FUN — choose, dice, coin, team, truth, dare
// ======================================================
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const TRUTHS = [
    'Apni zindagi ka sab se bara jhoot jo tum ne kabhi bola ho?',
    'Aakhri dafa kab roye thay aur kyun?',
    'Is group mein sab se zyada kis ko pasand karte ho?',
    'Mobile ki gallery ki sab se ajib photo konsi hai? (batao, dikhana nahi)',
    'Agar kal lottery lag jaye, pehli cheez kya karoge?',
    'Bachpan ki sab se sharminda karne wali harkat?',
    'Apne best friend ke baare mein ek raaz jo sirf tum jante ho (naam mat lena)',
    'Agar ek din ke liye invisible ho jao, kya karoge?',
    'Sab se bura khana jo tum ne kabhi khaya?',
    'Apni sab se buri aadat konsi hai?'
];
const DARES = [
    'Apni WhatsApp DP par 1 ghante ke liye group ki marzi ki emoji lagao',
    'Apni awaz mein ek gana gaa kar voice note bhejo',
    'Agley 3 messages sirf Urdu adab ki zabaan mein likho',
    'Apne best friend ko call karke sirf "mujhe neend arahi hai" keh kar rakh do',
    'Apni aakhri gallery photo ki sirf tafseel batao (photo nahi bhejni)',
    'Ek minute mein 10 push-ups — video saboot',
    'Apna naam ulta likh kar status lagao 1 ghante ke liye',
    'Group ke har member ke liye ek achi baat likho',
    'Baghair hansay ek joke sunao — voice note mein',
    'Apni screen time ka screenshot bhejo'
];

module.exports = [
    {
        name: 'choose',
        exec: async (sock, m, args) => {
            const parts = args.join(' ').split('|').map(x => x.trim()).filter(Boolean);
            if (parts.length < 2) return send(sock, m, '🤔 *Choose — faisla mushkil hai?*\n\nExample: `.choose chai | coffee | doodh patti`');
            return send(sock, m, `🤔 Soch samajh kar mera faisla:\n\n👉 *${pick(parts)}*`);
        }
    },
    {
        name: 'dice',
        exec: async (sock, m, args) => {
            const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            const n = 1 + Math.floor(Math.random() * 6);
            return send(sock, m, `🎲 Dice ghuma...\n\n${faces[n - 1]} *${n}*`);
        }
    },
    {
        name: 'coin',
        exec: async (sock, m, args) => {
            return send(sock, m, `🪙 Sikha uchhala...\n\n*${Math.random() < 0.5 ? 'HEADS 👑' : 'TAILS 🦅'}*`);
        }
    },
    {
        name: 'team',
        exec: async (sock, m, args) => {
            const names = args.join(' ').split(/[,\s]+/).map(x => x.trim()).filter(Boolean);
            if (names.length < 2) return send(sock, m, '👥 *Team Maker*\n\nExample: `.team Ali Ahmed Bilal Usman Hassan Omar`\n(Naam space se alag likho, kam az kam 2)');
            const shuffled = [...names].sort(() => Math.random() - 0.5);
            const half = Math.ceil(shuffled.length / 2);
            const A = shuffled.slice(0, half), B = shuffled.slice(half);
            return send(sock, m, `👥 *Teams Ban Gayi*\n\n🔴 *Team A:* ${A.join(', ')}\n🔵 *Team B:* ${B.join(', ') || '—'}`);
        }
    },
    {
        name: 'truth',
        exec: async (sock, m, args) => send(sock, m, `🎯 *TRUTH*\n\n${pick(TRUTHS)}\n\nJhoot bolna mana hai 😄`)
    },
    {
        name: 'dare',
        exec: async (sock, m, args) => send(sock, m, `🔥 *DARE*\n\n${pick(DARES)}\n\nInkaar karne par sab ko chai pilani pare gi ☕`)
    }
];
