// ======================================================
// MENUCARD — har .menu par NAYA card (live generate)
// Morning card wali technology: SVG -> PNG (sharp)
// Rotating themes + date/time + ghoomti hui tagline.
// Fail ho to menu.js purani static photo par gir jata hai.
// ======================================================

const THEMES = [
    { name: 'Emerald Night', bg1: '#052e22', bg2: '#0a5c46', accent: '#ffd166', soft: '#a7f3d0' },
    { name: 'Royal Purple',  bg1: '#1e1b4b', bg2: '#6d28d9', accent: '#fbbf24', soft: '#ddd6fe' },
    { name: 'Crimson Heat',  bg1: '#450a0a', bg2: '#b91c1c', accent: '#fde68a', soft: '#fecaca' },
    { name: 'Ocean Deep',    bg1: '#082f49', bg2: '#0369a1', accent: '#7dd3fc', soft: '#bae6fd' },
    { name: 'Gold Noir',     bg1: '#111111', bg2: '#44403c', accent: '#f59e0b', soft: '#fde68a' },
    { name: 'Rose Velvet',   bg1: '#500f2a', bg2: '#9d174d', accent: '#fbcfe8', soft: '#fbcfe8' },
];

const LINES = [
    'Dukaan ka hisaab, ab WhatsApp par.',
    'Mehnat chup rehti hai, natija bolta hai.',
    'Waqt ka sahi istemal hi asal munafa hai.',
    'Chhota business, bara nizam.',
    'Har order, har rupiya — sab record mein.',
    'Jo hisaab rakhta hai, wahi aage barhta hai.',
    'Kaam imandari ka, naam roshni ka.',
    'Aaj ka nizam, kal ki taraqqi.',
];

let lastTheme = -1;
let lastLine = -1;

function pick(n, last) {
    let i = Math.floor(Math.random() * n);
    if (n > 1 && i === last) i = (i + 1) % n;
    return i;
}

function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function generateMenuCard(ctx = {}) {
    const sharp = require('sharp');
    const ti = pick(THEMES.length, lastTheme); lastTheme = ti;
    const li = pick(LINES.length, lastLine); lastLine = li;
    const t = THEMES[ti];
    // Karachi time: asal Date par hi Intl se Asia/Karachi format karo.
    // (Purana tareeqa Date ko shift karke dobara Karachi format karta tha —
    //  double +5h lag jata tha, raat ko date aik din aage chali jati thi.)
    const now = new Date();
    const hh = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', hour: '2-digit', hour12: false }).format(now), 10) % 24;
    const greet = hh < 5 ? 'Shab Bakhair' : hh < 12 ? 'Subah Bakhair' : hh < 17 ? 'Dopehar Bakhair' : hh < 21 ? 'Shaam Bakhair' : 'Shab Bakhair';
    const dateStr = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    const timeStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' }).format(now);
    const owner = esc(ctx.owner || 'Malik Sahib');
    const cmds = ctx.commands || 0;
    const mode = esc(ctx.mode || 'public');

    const svg = `<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.bg1}"/>
      <stop offset="100%" stop-color="${t.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="930" cy="130" r="190" fill="${t.accent}" opacity="0.14"/>
  <circle cx="120" cy="960" r="230" fill="${t.accent}" opacity="0.10"/>
  <circle cx="980" cy="880" r="90" fill="#ffffff" opacity="0.06"/>
  <rect x="54" y="54" width="972" height="972" rx="36" fill="none" stroke="${t.accent}" stroke-width="3" opacity="0.85"/>
  <text x="540" y="215" text-anchor="middle" font-family="sans-serif" font-size="44" fill="${t.soft}" letter-spacing="6">${greet.toUpperCase()}</text>
  <text x="540" y="360" text-anchor="middle" font-family="sans-serif" font-size="118" font-weight="bold" fill="#ffffff">MALIK-MD</text>
  <text x="540" y="430" text-anchor="middle" font-family="sans-serif" font-size="40" fill="${t.accent}" letter-spacing="3">WHATSAPP BUSINESS BOT</text>
  <line x1="290" y1="490" x2="790" y2="490" stroke="${t.accent}" stroke-width="3"/>
  <text x="540" y="580" text-anchor="middle" font-family="sans-serif" font-size="42" fill="#ffffff">Owner: ${owner}</text>
  <text x="540" y="645" text-anchor="middle" font-family="sans-serif" font-size="36" fill="${t.soft}">Commands: ${cmds}  •  Mode: ${mode}</text>
  <text x="540" y="760" text-anchor="middle" font-family="sans-serif" font-size="38" font-style="italic" fill="${t.soft}">"${esc(LINES[li])}"</text>
  <text x="540" y="905" text-anchor="middle" font-family="sans-serif" font-size="34" fill="${t.soft}">${dateStr}</text>
  <text x="540" y="960" text-anchor="middle" font-family="sans-serif" font-size="30" fill="${t.accent}">${timeStr} PKT  •  Theme: ${t.name}</text>
</svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
}

module.exports = generateMenuCard;
