const crypto = require('crypto');
const botEvents = require('../lib/events.js');
const config = require('../config.js');

// ======================================================
// POLL QUIZ — button-style game (.pollquiz)
// Sawal ek WhatsApp POLL ki surat mein aata hai — poll ke
// options hi asal "buttons" hain: user TAP karta hai, vote
// bot tak (decrypt karke) pohanchta hai, sahi jawab par
// agla sawaal-poll khud aa jata hai. Bilkul button menu
// jaisa flow, lekin WhatsApp ki apni poll UI ke sath —
// jo har phone par render hoti hai.
//
// Rules: 5 sawal, sahi jawab = +10. Pehla sahi jawab ate
// hi sawaal band, scoreboard ke sath agla poll. 45 sec per
// sawal timeout. Fallback: poll par reply karke A/B/C/D.
// ======================================================

let decryptPollVote = null;
try { decryptPollVote = require('@whiskeysockets/baileys').decryptPollVote; } catch (e) {}

const QUESTIONS = [
    { q: 'Pakistan ka capital konsa sheher hai?', options: ['Islamabad', 'Karachi', 'Lahore', 'Quetta'], answer: 0 },
    { q: 'Dunya ka sab se bara samandar (ocean) konsa hai?', options: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], answer: 1 },
    { q: 'Ek baray insaan ke jism mein kitni haddiyan hoti hain?', options: ['196', '206', '216', '226'], answer: 1 },
    { q: 'Cricket World Cup 1992 kis team ne jeeta tha?', options: ['India', 'Australia', 'Pakistan', 'England'], answer: 2 },
    { q: 'Chand par pehla qadam kis ne rakha tha?', options: ['Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'Michael Collins'], answer: 2 },
    { q: 'Pakistan kis tareekh ko azad hua?', options: ['14 Aug 1947', '15 Aug 1947', '23 Mar 1940', '14 Aug 1948'], answer: 0 },
    { q: 'Dunya ki sab se lambi river konsi hai?', options: ['Amazon', 'Indus', 'Yangtze', 'Nile'], answer: 3 },
    { q: 'Computer ka "brain" kisay kehte hain?', options: ['RAM', 'Monitor', 'CPU', 'Hard Disk'], answer: 2 },
    { q: 'Quaid-e-Azam ka mazar kis sheher mein hai?', options: ['Lahore', 'Karachi', 'Islamabad', 'Multan'], answer: 1 },
    { q: 'Olympics kitne saal baad hote hain?', options: ['2 saal', '3 saal', '4 saal', '5 saal'], answer: 2 },
    { q: 'Pakistan ki qomi zuban konsi hai?', options: ['Punjabi', 'Urdu', 'Sindhi', 'Pashto'], answer: 1 },
    { q: 'Sab se tez bhagne wala janwar konsa hai?', options: ['Sher', 'Ghora', 'Cheetah', 'Hiran'], answer: 2 },
];

const TOTAL_Q = 5;
const Q_TIME_MS = 45000;
const games = new Map();   // jid -> game
const pollReg = new Map(); // pollMsgId -> { jid }

// Vote decrypt — WhatsApp ki do pehchan (number-JID aur LID) mein se
// jis se vote encrypt hua ho, wohi combo chalega; sab try karte hain.
function tryDecryptVote(vote, pollId, encKey, sock, m) {
    if (!decryptPollVote || !encKey) return null;
    const creators = [normJid(sock?.user?.id), normJid(sock?.user?.lid)];
    if (config.OWNER_NUMBER) creators.push(normJid(config.OWNER_NUMBER + '@s.whatsapp.net'));
    const voters = [m.key.participant, m.key.participantPn, m.key.remoteJid, m.key.remoteJidAlt].map(normJid);
    const creatorSet = [...new Set(creators.filter(Boolean))];
    const voterSet = [...new Set(voters.filter(Boolean))];
    for (const creatorJid of creatorSet) {
        for (const voterJid of voterSet) {
            try {
                const dec = decryptPollVote(
                    { encPayload: Buffer.from(vote.encPayload), encIv: Buffer.from(vote.encIv) },
                    { pollCreatorJid: creatorJid, pollMsgId: pollId, pollEncKey: Buffer.from(encKey), voterJid }
                );
                if (dec && Array.isArray(dec.selectedOptions)) return dec;
            } catch (e) { /* agla combo */ }
        }
    }
    return null;
}

const digestOf = (s) => crypto.createHash('sha256').update(s).digest();
const normJid = (j) => {
    if (!j) return '';
    const [user, domain] = String(j).split('@');
    return user.split(':')[0] + '@' + (domain || 's.whatsapp.net');
};
const send = (sock, jid, text, extra = {}) => sock.sendMessage(jid, { text, ...extra });

function scoreboard(game) {
    const rows = [...game.scores.entries()]
        .map(([jid, s]) => ({ jid, ...s }))
        .sort((a, b) => b.pts - a.pts);
    if (!rows.length) return 'Abhi koi score nahi.';
    return rows.map((r, i) => `${i + 1}. ${r.name} — *${r.pts} pts*`).join('\n');
}

async function askQuestion(sock, jid, game) {
    if (game.qIdx >= game.questions.length) return finishGame(sock, jid, game);
    const q = game.questions[game.qIdx];
    game.closed = false;
    try {
        const sent = await sock.sendMessage(jid, {
            poll: {
                name: `❓ Sawal ${game.qIdx + 1}/${game.questions.length}: ${q.q}`,
                values: q.options,
                selectableCount: 1
            }
        });
        const pollId = sent?.key?.id;
        if (!pollId) throw new Error('poll id missing');
        game.pollId = pollId;
        game.encKey = sent.message?.messageContextInfo?.messageSecret
            ? Buffer.from(sent.message.messageContextInfo.messageSecret) : null;
        pollReg.set(pollId, { jid });
        clearTimeout(game.timer);
        game.timer = setTimeout(async () => {
            if (game.closed || games.get(jid) !== game) return;
            game.closed = true;
            pollReg.delete(game.pollId);
            try {
                await send(sock, jid,
`⏰ *Waqt khatam!* Kisi ka sahi jawab nahi aya.
✅ Sahi jawab: *${q.options[q.answer]}*

🏆 Scoreboard:
${scoreboard(game)}`);
            } catch (e) {}
            game.qIdx++;
            askQuestion(sock, jid, game);
        }, Q_TIME_MS);
    } catch (e) {
        console.error('pollquiz ask error:', e.message);
        games.delete(jid);
        await send(sock, jid, '❌ Poll nahi ban saka — game band. Dobara .pollquiz likho.');
    }
}

async function finishGame(sock, jid, game) {
    clearTimeout(game.timer);
    if (game.pollId) pollReg.delete(game.pollId);
    games.delete(jid);
    const rows = [...game.scores.entries()].map(([j, s]) => ({ j, ...s })).sort((a, b) => b.pts - a.pts);
    const winner = rows.length ? `\n\n👑 *Winner: ${rows[0].name}* — ${rows[0].pts} points! Mubarak ho! 🎉` : '\n\nKoi score nahi bana — sab soye rahe 😴';
    await send(sock, jid,
`🏁 *GAME KHATAM!*

🏆 Final Scoreboard:
${scoreboard(game)}${winner}

Dobara khelna ho to .pollquiz likho!`);
}

async function handleAnswer(sock, jid, game, voterJid, pushName, optIdx, via) {
    if (!game || game.closed || games.get(jid) !== game) return;
    if (optIdx < 0) return;
    // Ghalat tap par lock NAHI hota — user vote badal sakta hai.
    // Jo pehle SAHI tap kare ga, sawaal usi par band ho jayega.
    const q = game.questions[game.qIdx];
    const entry = game.scores.get(voterJid) || { name: pushName || voterJid.split('@')[0], pts: 0 };
    if (optIdx === q.answer) {
        entry.pts += 10;
        game.scores.set(voterJid, entry);
        game.closed = true;
        clearTimeout(game.timer);
        pollReg.delete(game.pollId);
        await send(sock, jid,
`✅ *${entry.name}* ka jawab SAHI! (+10)${via === 'text' ? '' : ' 🎉'}
Jawab: *${q.options[q.answer]}*

🏆 Scoreboard:
${scoreboard(game)}`);
        game.qIdx++;
        setTimeout(() => { if (games.get(jid) === game) askQuestion(sock, jid, game); }, 800);
    } else {
        game.scores.set(voterJid, entry); // naam scoreboard mein ajaye, pts 0
    }
}

// ---------- listeners: poll votes (encrypted) + text fallback ----------
botEvents.on('new-message', async ({ sock, m }) => {
    try {
        if (!m?.message) return;
        const jid = m.key.remoteJid;

        const pu = m.message.pollUpdateMessage;
        if (pu && pu.pollCreationMessageKey) {
            const pollId = pu.pollCreationMessageKey.id;
            const reg = pollReg.get(pollId);
            if (!reg) return;
            const game = games.get(reg.jid);
            if (!game || game.pollId !== pollId) return;
            const vote = pu.vote || {};
            let optIdx = -1;
            const matchIdx = (selected) => {
                const q = game.questions[game.qIdx];
                for (const opt of selected || []) {
                    const buf = Buffer.from(opt);
                    const i = q.options.findIndex(o => digestOf(o).equals(buf));
                    if (i >= 0) return i;
                }
                return -1;
            };
            if (Array.isArray(vote.selectedOptions) && vote.selectedOptions.length) {
                optIdx = matchIdx(vote.selectedOptions);
            } else if (vote.encPayload && vote.encIv && decryptPollVote && game.encKey) {
                const dec = tryDecryptVote(vote, pollId, game.encKey, sock, m);
                if (!dec) {
                    console.error('pollquiz decrypt failed (all JID combos)');
                    return;
                }
                optIdx = matchIdx(dec.selectedOptions || []);
            } else return;
            const voterJid = normJid(m.key.participant || m.key.remoteJid);
            return handleAnswer(sock, reg.jid, game, voterJid, m.pushName, optIdx, 'poll');
        }

        // Fallback: poll par reply karke A/B/C/D
        if (m.key.fromMe) return;
        const ext = m.message.extendedTextMessage;
        const body = (m.message.conversation || ext?.text || '').trim().toUpperCase();
        if (!/^[A-D]$/.test(body)) return;
        const stanzaId = ext?.contextInfo?.stanzaId;
        if (!stanzaId) return;
        const reg = pollReg.get(stanzaId);
        if (!reg || reg.jid !== jid) return;
        const game = games.get(jid);
        if (!game || game.pollId !== stanzaId) return;
        const voterJid = normJid(m.key.participant || m.key.remoteJid);
        return handleAnswer(sock, jid, game, voterJid, m.pushName, body.charCodeAt(0) - 65, 'text');
    } catch (e) {
        console.error('pollquiz listener error:', e.message);
    }
});

// ---------- command ----------
module.exports = {
    name: 'pollquiz',
    alias: ['pquiz', 'tapquiz', 'buttonquiz'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        if ((args[0] || '').toLowerCase() === 'stop') {
            const game = games.get(jid);
            if (!game) return send(sock, m, 'Koi game chal hi nahi raha.');
            clearTimeout(game.timer);
            if (game.pollId) pollReg.delete(game.pollId);
            games.delete(jid);
            return send(sock, m, `🛑 Game band kar diya.\n\n🏆 Scoreboard:\n${scoreboard(game)}`);
        }
        if (games.get(jid)) return send(sock, m, '⚠️ Is chat mein game pehle se chal raha hai! Khatam hone do ya .pollquiz stop likho.');

        const picked = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, TOTAL_Q);
        const game = {
            questions: picked, qIdx: 0, scores: new Map(),
            pollId: null, encKey: null, closed: false, timer: null
        };
        games.set(jid, game);
        await send(sock, m,
`🎮 *POLL QUIZ — Button Wala Game!*
━━━━━━━━━━━━━━━━━━
Har sawaal ek *poll* mein ayega — bas apne jawab par *TAP* kar do, wahi tumhara "button" hai! 👆
✅ Sahi jawab = *+10 points*
⏰ Har sawaal ke liye 45 second
🏆 ${TOTAL_Q} sawalon ke baad winner ka elan hoga

Poll na khule to poll par reply karke A/B/C/D likh dena. Taiyaar? Pehla sawaal aa raha hai... 👇`);
        await askQuestion(sock, jid, game);
    }
};
