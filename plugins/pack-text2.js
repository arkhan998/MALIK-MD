// ======================================================
// PACK: TEXT TOOLS 2 — public text transformers
// upside, vapor, bubble, smallcaps, leet, morse, binary,
// hex, rot13, clap, emojify, zalgo, strike, mono, bold,
// italic, charcount, mock, jumble
// ======================================================
const send = (sock, m, text, extra = {}) => sock.sendMessage(m.key.remoteJid, { text, ...extra }, { quoted: m });
const need = (sock, m, cmd, ex) => send(sock, m, `✍️ Text likho!\nExample: .${cmd} ${ex}`);

const mapStr = (s, map) => [...s].map(c => map[c] ?? map[c.toLowerCase()] ?? c).join('');
const FW = {}; for (let i = 33; i <= 126; i++) FW[String.fromCharCode(i)] = String.fromCharCode(i + 65248);
const BUBBLE = { a:'ⓐ',b:'ⓑ',c:'ⓒ',d:'ⓓ',e:'ⓔ',f:'ⓕ',g:'ⓖ',h:'ⓗ',i:'ⓘ',j:'ⓙ',k:'ⓚ',l:'ⓛ',m:'ⓜ',n:'ⓝ',o:'ⓞ',p:'ⓟ',q:'ⓠ',r:'ⓡ',s:'ⓢ',t:'ⓣ',u:'ⓤ',v:'ⓥ',w:'ⓦ',x:'ⓧ',y:'ⓨ',z:'ⓩ',0:'⓪',1:'①',2:'②',3:'③',4:'④',5:'⑤',6:'⑥',7:'⑦',8:'⑧',9:'⑨' };
const SMALL = { a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ' };
const LEET = { a:'4',b:'8',e:'3',g:'6',i:'1',l:'1',o:'0',s:'5',t:'7',z:'2' };
const MONO = {}; 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').forEach((c,i)=>{ MONO[c] = String.fromCodePoint(c>='a'&&c<='z'?0x1D68A + (c.charCodeAt(0)-97) : c>='A'&&c<='Z'?0x1D670 + (c.charCodeAt(0)-65) : 0x1D7F6 + (c.charCodeAt(0)-48)); });
const BOLDT = {}; 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').forEach(c=>{ BOLDT[c] = String.fromCodePoint(c>='a'&&c<='z'?0x1D41A + (c.charCodeAt(0)-97) : c>='A'&&c<='Z'?0x1D400 + (c.charCodeAt(0)-65) : 0x1D7CE + (c.charCodeAt(0)-48)); });
const ITAL = {}; 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(c=>{ ITAL[c] = c==='h' ? 'ℎ' : String.fromCodePoint(c>='a'?0x1D622 + (c.charCodeAt(0)-97) : 0x1D608 + (c.charCodeAt(0)-65)); });
const FLIP = { a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',1:'Ɩ',2:'ᄅ',3:'Ɛ',4:'ㄣ',5:'ϛ',6:'9',7:'ㄥ',8:'8',9:'6','.':'˙',',':'\'','!':'¡','?':'¿','(' : ')',')':'(' };
const MORSE = { a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',0:'-----',' ':'/' };
const MORSE_REV = Object.fromEntries(Object.entries(MORSE).map(([k,v])=>[v,k]));
const EMOJI_DIG = { '0':'0️⃣','1':'1️⃣','2':'2️⃣','3':'3️⃣','4':'4️⃣','5':'5️⃣','6':'6️⃣','7':'7️⃣','8':'8️⃣','9':'9️⃣' };
const rot13 = s => s.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 65 : 97) + ((c.charCodeAt(0) - (c <= 'Z' ? 65 : 97) + 13) % 26)));

const T = (name, alias, fn, ex) => ({ name, alias, exec: async (sock, m, args) => { const t = args.join(' '); if (!t) return need(sock, m, name, ex); return fn(sock, m, t); } });

module.exports = [
    T('upside', ['fliptext'], (s, m, t) => send(s, m, [...t.toLowerCase()].reverse().map(c => FLIP[c] || c).join('')), 'hello'),
    T('vapor', ['wide'], (s, m, t) => send(s, m, mapStr(t.replace(/ /g, '　'), FW)), 'malik'),
    T('bubble', ['bubbletext'], (s, m, t) => send(s, m, mapStr(t, BUBBLE)), 'malik'),
    T('smallcaps', ['smalltext'], (s, m, t) => send(s, m, mapStr(t, SMALL)), 'malik sahib'),
    T('leet', ['leettext'], (s, m, t) => send(s, m, mapStr(t, LEET)), 'hacker style'),
    T('morse', ['morsecode'], (s, m, t) => send(s, m, '📡 *Morse Code:*\n' + [...t.toLowerCase()].map(c => MORSE[c] || c).join(' ')), 'sos malik'),
    T('unmorse', ['demorse'], (s, m, t) => send(s, m, '📡 *Text:*\n' + t.split(' ').map(c => MORSE_REV[c] || c).join('')), '... --- ...'),
    T('binary', ['tobinary'], (s, m, t) => send(s, m, '🔢 *Binary:*\n' + [...t].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')), 'hi'),
    T('unbinary', ['frombinary'], (s, m, t) => { const out = t.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join(''); return send(s, m, '🔢 *Text:*\n' + (out || 'galat binary hai')); }, '01101000 01101001'),
    T('hexcode', ['tohex'], (s, m, t) => send(s, m, '🔣 *Hex:*\n' + [...t].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')), 'hi'),
    T('unhex', ['fromhex'], (s, m, t) => { const clean = t.replace(/[^0-9a-fA-F]/g, ''); let out = ''; for (let i = 0; i + 1 < clean.length; i += 2) out += String.fromCharCode(parseInt(clean.substr(i, 2), 16)); return send(s, m, '🔣 *Text:*\n' + (out || 'galat hex hai')); }, '6869'),
    T('rot13', ['rot'], (s, m, t) => send(s, m, '🔐 *ROT13:*\n' + rot13(t)), 'secret baat'),
    T('clap', ['claptext'], (s, m, t) => send(s, m, t.split(/\s+/).join(' 👏 ') + ' 👏'), 'bohat khoob'),
    T('emojify', ['emojitext'], (s, m, t) => send(s, m, [...t.toLowerCase()].map(c => /[a-z]/.test(c) ? String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 97) : (EMOJI_DIG[c] || (c === ' ' ? '  ' : c))).join(' ')), 'malik'),
    T('zalgo', ['crazytext'], (s, m, t) => { const marks = ['\u0300','\u0301','\u0302','\u0308','\u0334','\u0335','\u0336']; return send(s, m, [...t].map(c => c + marks[Math.floor(Math.random() * marks.length)] + (Math.random() > .5 ? marks[Math.floor(Math.random() * marks.length)] : '')).join('')); }, 'bhoot bangla'),
    T('striked', ['strikethrough'], (s, m, t) => send(s, m, [...t].map(c => c + '\u0336').join('')), 'galat baat'),
    T('mono', ['monotext'], (s, m, t) => send(s, m, mapStr(t, MONO)), 'malik'),
    T('boldtext', ['boldt'], (s, m, t) => send(s, m, mapStr(t, BOLDT)), 'malik'),
    T('italictext', ['italict'], (s, m, t) => send(s, m, mapStr(t, ITAL)), 'malik'),
    { name: 'charcount', alias: ['countchars', 'wc'], exec: async (sock, m, args) => { const t = args.join(' '); if (!t) return need(sock, m, 'charcount', 'koi lamba text'); return send(sock, m, `🔢 *Text Analysis:*\n• Characters: ${t.length}\n• Spaces ke baghair: ${t.replace(/\s/g, '').length}\n• Words: ${t.split(/\s+/).filter(Boolean).length}\n• Lines: ${t.split('\n').length}\n• Parhne ka waqt: ~${Math.max(1, Math.round(t.split(/\s+/).length / 130))} minute`); } },
    T('mock', ['mocktext'], (s, m, t) => send(s, m, [...t].map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join('')), 'tum serious ho'),
    T('jumble', ['wordjumble'], (s, m, t) => send(s, m, t.split(' ').map(w => w.length < 4 ? w : w[0] + [...w.slice(1, -1)].sort(() => Math.random() - .5).join('') + w[w.length - 1]).join(' ')), 'ye jumla ulta seedha karo'),
];
