// ======================================================
// PACK HISAAB — roz ke hisaab, ghar aur rates (20 commands)
// .bijli .solar .ups .ac .marla .tiles .paint .cement .sarya
// .carpet .gpa .crypto .ot .salary .markup .gold .rent
// .flatqist .weight .comm — aksar OFFLINE, crypto API par
// ======================================================

const axios = require('axios');

const rs = (n) => 'Rs ' + Number(Math.round(n * 100) / 100).toLocaleString('en-PK');
const fmt = (n, d = 2) => Number(Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-PK');
const pf = (v) => parseFloat(String(v || '').replace(/,/g, ''));
const reply = (sock, m, text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });

// Qad parse: '5.8' = 5 ft 8 in · '5.11' = 5 ft 11 in · 175 = cm · 1.75 = meter
function heightMeters(raw) {
    const s = String(raw || '').trim();
    const v = parseFloat(s);
    if (isNaN(v) || v <= 0) return null;
    if (v > 100) return v / 100;                    // cm
    if (v >= 3 && v < 8) {                          // feet.inches — hissa string se lo (0.8 = 8 inch, float hisaab ghalat dega)
        const parts = s.split('.');
        const ft = parseInt(parts[0], 10);
        const inch = parts[1] ? parseInt(parts[1], 10) : 0;
        if (!isNaN(ft) && inch <= 11) return (ft * 12 + inch) * 0.0254;
        return v * 0.3048;                          // decimal feet
    }
    if (v < 3) return v;                            // meter
    return null;
}

module.exports = [
    // ---------------- BIJLI ----------------
    {
        name: 'bijli',
        exec: async (sock, m, args) => {
            const units = pf(args[0]);
            const rate = args[1] !== undefined ? pf(args[1]) : 40;
            if (isNaN(units) || units <= 0) return reply(sock, m, '💡 Usage: `.bijli 250` (units) — apna rate dena ho to `.bijli 250 45`');
            const bill = units * rate;
            await reply(sock, m,
`💡 *Bijli Bill Andaza*
━━━━━━━━━━━━━━━
🔌 Units: *${fmt(units, 0)}*
📊 Rate (andaza): *Rs ${fmt(rate)}/unit*
🧾 *Bill andaza: ${rs(bill)}*
⚠️ Ye sirf andaza hai — fuel adjustment, taxes aur slab ki wajah se asal bill mukhtalif ho sakta hai.`);
        }
    },
    // ---------------- SOLAR ----------------
    {
        name: 'solar',
        exec: async (sock, m, args) => {
            const WATTS = { fan: 80, pankha: 80, light: 12, led: 12, bulb: 20, tv: 100, fridge: 180, ac: 1600, motor: 750, pump: 750, pc: 200, laptop: 65, washing: 500, machine: 500, charger: 10, iron: 1000, istri: 1000 };
            let load = 0, detail = [];
            if (args.length && args[0].includes(':')) {
                for (const a of args) {
                    const [item, cnt] = a.toLowerCase().split(':');
                    const c = pf(cnt) || 1;
                    if (WATTS[item]) { load += WATTS[item] * c; detail.push(`${item} ×${c} = ${WATTS[item] * c}W`); }
                }
            } else {
                load = pf(args[0]);
            }
            if (!load || load <= 0) return reply(sock, m, '☀️ Usage: `.solar 500` (kul load watts)\nya cheezon se: `.solar fan:3 light:4 tv:1 fridge:1`');
            const panelW = load * 1.3;
            const panels = Math.ceil(panelW / 585);
            const inverterKva = Math.ceil((load * 1.25) / 100) / 10;
            const battAh = Math.ceil((load * 3) / (24 * 0.7) / 10) * 10; // 3 ghante backup @24V
            await reply(sock, m,
`☀️ *Solar System Andaza*
━━━━━━━━━━━━━━━
⚡ Kul Load: *${fmt(load, 0)} W*${detail.length ? '\n📋 ' + detail.join(' · ') : ''}
🔆 Panels: *${fmt(panelW, 0)} W* (taqreeban ${panels} × 585W panel)
🔌 Inverter: *${fmt(inverterKva, 1)} kVA* ya is se bara
🔋 Battery (3 ghante backup): *~${battAh} Ah @ 24V*
⚠️ Andaza hai — asal size dhoop, wiring aur battery type par depend karta hai.`);
        }
    },
    // ---------------- UPS ----------------
    {
        name: 'ups',
        exec: async (sock, m, args) => {
            const ah = pf(args[0]);
            const load = pf(args[1]);
            const volt = args[2] !== undefined ? pf(args[2]) : 12;
            if (isNaN(ah) || isNaN(load) || ah <= 0 || load <= 0) return reply(sock, m, '🔋 Usage: `.ups 200 400` (battery Ah, load watts) — 24V ho to `.ups 200 400 24`');
            const hours = (ah * volt * 0.7) / load;
            const h = Math.floor(hours), min = Math.round((hours - h) * 60);
            await reply(sock, m,
`🔋 *UPS Backup Andaza*
━━━━━━━━━━━━━━━
🔋 Battery: *${fmt(ah, 0)} Ah (${volt}V)*
⚡ Load: *${fmt(load, 0)} W*
⏰ *Backup: taqreeban ${h} ghante ${min} minute*
⚠️ Battery purani ho to backup kam ho jata hai.`);
        }
    },
    // ---------------- AC ----------------
    {
        name: 'ac',
        exec: async (sock, m, args) => {
            const L = pf(args[0]), W = pf(args[1]);
            if (isNaN(L) || isNaN(W) || L <= 0 || W <= 0) return reply(sock, m, '❄️ Usage: `.ac 12 14` (kamre ki lambai, chorai — feet mein)');
            const sqft = L * W;
            const need = sqft / 110;
            const sizes = [0.75, 1, 1.5, 2, 2.5, 3, 4, 5];
            const pick = sizes.find(s => s >= need) || Math.ceil(need * 2) / 2;
            await reply(sock, m,
`❄️ *AC Size Andaza*
━━━━━━━━━━━━━━━
📐 Kamra: *${fmt(L, 0)} × ${fmt(W, 0)} ft = ${fmt(sqft, 0)} sq.ft*
❄️ Zaroorat: *~${fmt(need)} ton*
✅ *Munasib: ${fmt(pick)} ton ka AC*
💡 Upar wala floor ho ya dhoop seedhi parti ho to ek size bara behtar rehta hai. Inverter AC bijli bachata hai.`);
        }
    },
    // ---------------- MARLA ----------------
    {
        name: 'marla',
        exec: async (sock, m, args) => {
            const TO_SQFT = { marla: 272.25, kanal: 5445, sqft: 1, feet: 1, gaz: 9, sqyd: 9, sqm: 10.7639, meter: 10.7639, acre: 43560 };
            const qty = pf(args[0]);
            const unit = (args[1] || 'marla').toLowerCase();
            if (isNaN(qty) || qty <= 0 || !TO_SQFT[unit]) return reply(sock, m, '🏡 Usage: `.marla 10` ya `.marla 5445 sqft` / `.marla 1 kanal` / `.marla 200 gaz`\nUnits: marla, kanal, sqft, gaz, sqm, acre');
            const sqft = qty * TO_SQFT[unit];
            await reply(sock, m,
`🏡 *Zameen ki Badli* (${fmt(qty)} ${unit})
━━━━━━━━━━━━━━━
📐 Sq. Feet: *${fmt(sqft)}*
🏠 Marla: *${fmt(sqft / 272.25)}*
🌳 Kanal: *${fmt(sqft / 5445)}*
📏 Gaz (sq.yd): *${fmt(sqft / 9)}*
📐 Sq. Meter: *${fmt(sqft / 10.7639)}*
🌾 Acre: *${fmt(sqft / 43560, 4)}*
💡 Standard marla 272.25 sq.ft liya gaya hai — kuch purane ilaqon mein 225/250 bhi chalta hai.`);
        }
    },
    // ---------------- TILES ----------------
    {
        name: 'tiles',
        exec: async (sock, m, args) => {
            const L = pf(args[0]), W = pf(args[1]);
            if (isNaN(L) || isNaN(W) || L <= 0 || W <= 0) return reply(sock, m, '🧱 Usage: `.tiles 12 14` (kamra feet mein, tile 2×2 ft default)\nTile size dena ho to: `.tiles 12 14 24x24` (inches)');
            let tileSqft = 4, tileLabel = '2×2 ft';
            if (args[2]) {
                const parts = String(args[2]).toLowerCase().split('x').map(pf);
                if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
                    const inches = parts[0] > 4 || parts[1] > 4;
                    tileSqft = inches ? (parts[0] * parts[1]) / 144 : parts[0] * parts[1];
                    tileLabel = args[2] + (inches ? ' inch' : ' ft');
                }
            }
            const area = L * W;
            const exact = Math.ceil(area / tileSqft);
            const withWaste = Math.ceil(exact * 1.1);
            await reply(sock, m,
`🧱 *Tiles Andaza*
━━━━━━━━━━━━━━━
📐 Kamra: *${fmt(L, 0)} × ${fmt(W, 0)} ft = ${fmt(area, 0)} sq.ft*
🧱 Tile size: *${tileLabel}* (${fmt(tileSqft)} sq.ft)
🔢 Tiles (bila wastage): *${fmt(exact, 0)}*
✅ *Khareedin (10% wastage ke sath): ${fmt(withWaste, 0)} tiles*`);
        }
    },
    // ---------------- PAINT ----------------
    {
        name: 'paint',
        exec: async (sock, m, args) => {
            const L = pf(args[0]), W = pf(args[1]), H = pf(args[2]);
            if (isNaN(L) || isNaN(W) || isNaN(H) || L <= 0 || W <= 0 || H <= 0) return reply(sock, m, '🎨 Usage: `.paint 12 14 10` (lambai, chorai, unchai — feet) — litre ka rate dena ho to `.paint 12 14 10 4500`');
            let area = 2 * (L + W) * H * 0.82; // darwaze/khirkiyan ~18% minus
            const rate = pf(args[3]);
            const litres = (area * 2) / 350; // 2 coat, ~350 sqft/litre/coat
            await reply(sock, m,
`🎨 *Paint Andaza*
━━━━━━━━━━━━━━━
📐 Deewarain (darwaze/khirkiyan nikal kar): *~${fmt(area, 0)} sq.ft*
🪣 *Rang: ~${fmt(litres, 1)} litre* (2 coat)${!isNaN(rate) && rate > 0 ? `\n💰 Kharcha andaza: *${rs(litres * rate)}*` : ''}
💡 Wall putty aur primer is ke ilawa hota hai. Chat (ceiling) shamil nahi.`);
        }
    },
    // ---------------- CEMENT ----------------
    {
        name: 'cement',
        exec: async (sock, m, args) => {
            const L = pf(args[0]), W = pf(args[1]);
            const thick = args[2] !== undefined ? pf(args[2]) : 4;
            if (isNaN(L) || isNaN(W) || L <= 0 || W <= 0) return reply(sock, m, '🏗️ Usage: `.cement 20 30` (chhat/floor feet mein, motai 4 inch default) — motai badalni ho to `.cement 20 30 5`');
            const wet = L * W * (thick / 12);          // cft
            const dry = wet * 1.54;
            const cementVol = dry / 7;                  // ratio 1:2:4
            const bags = Math.ceil(cementVol / 1.25);
            await reply(sock, m,
`🏗️ *Cement Andaza* (ratio 1:2:4)
━━━━━━━━━━━━━━━
📐 Size: *${fmt(L, 0)} × ${fmt(W, 0)} ft, motai ${fmt(thick, 1)} inch*
🧱 *Cement: ${fmt(bags, 0)} bori (50kg)*
🏖️ Sand (rait): *~${fmt(dry * 2 / 7, 1)} cft*
🪨 Bajri: *~${fmt(dry * 4 / 7, 1)} cft*
⚠️ Andaza hai — mistri ka hisaab design/load ke hisaab se mukhtalif ho sakta hai.`);
        }
    },
    // ---------------- SARYA ----------------
    {
        name: 'sarya',
        alias: ['steel'],
        exec: async (sock, m, args) => {
            const d = pf(args[0]);
            const lenFt = args[1] !== undefined ? pf(args[1]) : 40;
            if (isNaN(d) || d <= 0) return reply(sock, m, '🔩 Usage: `.sarya 16` (diameter mm — aam 40 ft ki bar) ya `.sarya 12 20` (mm, length ft)');
            const perMeter = (d * d) / 162;
            const total = perMeter * (lenFt * 0.3048);
            await reply(sock, m,
`🔩 *Sarya (Steel) Wazan*
━━━━━━━━━━━━━━━
📏 Diameter: *${fmt(d, 0)} mm*
⚖️ Per meter: *${fmt(perMeter)} kg*
⚖️ Per foot: *${fmt(perMeter * 0.3048)} kg*
⚖️ *${fmt(lenFt, 0)} ft ki bar: ~${fmt(total, 1)} kg*`);
        }
    },
    // ---------------- CARPET ----------------
    {
        name: 'carpet',
        exec: async (sock, m, args) => {
            const L = pf(args[0]), W = pf(args[1]);
            const rate = pf(args[2]);
            if (isNaN(L) || isNaN(W) || L <= 0 || W <= 0) return reply(sock, m, '🟫 Usage: `.carpet 12 14` — rate dena ho to `.carpet 12 14 850` (per sq.ft)');
            const sqft = L * W;
            await reply(sock, m,
`🟫 *Carpet/Flooring Area*
━━━━━━━━━━━━━━━
📐 ${fmt(L, 0)} × ${fmt(W, 0)} ft = *${fmt(sqft, 0)} sq.ft* (${fmt(sqft / 9)} gaz)${!isNaN(rate) && rate > 0 ? `\n💰 Rate Rs ${fmt(rate)}/sq.ft → *Kharcha: ${rs(sqft * rate)}*` : ''}`);
        }
    },
    // ---------------- GPA ----------------
    {
        name: 'gpa',
        exec: async (sock, m, args) => {
            const obt = pf(args[0]), total = pf(args[1]);
            if (isNaN(obt) || isNaN(total) || total <= 0 || obt < 0) return reply(sock, m, '🎓 Usage: `.gpa 450 500` (haasil number, kul number)');
            const pct = (obt / total) * 100;
            const SCALE = [[85, 4.0, 'A'], [80, 3.7, 'A−'], [75, 3.3, 'B+'], [70, 3.0, 'B'], [65, 2.7, 'B−'], [60, 2.3, 'C+'], [55, 2.0, 'C'], [50, 1.7, 'C−'], [45, 1.3, 'D'], [0, 0, 'F']];
            const row = SCALE.find(s => pct >= s[0]);
            await reply(sock, m,
`🎓 *Result Hisab*
━━━━━━━━━━━━━━━
🔢 Number: *${fmt(obt, 0)} / ${fmt(total, 0)}*
📊 Percentage: *${fmt(pct, 1)}%*
🏅 Grade: *${row[2]}* · GPA: *${fmt(row[1], 1)}*
💡 Ye aam HEC scale hai — har university ka scale thora mukhtalif ho sakta hai.`);
        }
    },
    // ---------------- CRYPTO ----------------
    {
        name: 'crypto',
        exec: async (sock, m, args) => {
            const IDS = { btc: 'bitcoin', bitcoin: 'bitcoin', eth: 'ethereum', ethereum: 'ethereum', usdt: 'tether', bnb: 'binancecoin', sol: 'solana', xrp: 'ripple', doge: 'dogecoin', ada: 'cardano', trx: 'tron', ltc: 'litecoin' };
            const sym = (args[0] || 'btc').toLowerCase();
            const id = IDS[sym];
            if (!id) return reply(sock, m, '🪙 Usage: `.crypto btc` — options: btc, eth, usdt, bnb, sol, xrp, doge, ada, trx, ltc');
            try {
                const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
                    params: { ids: id, vs_currencies: 'pkr,usd', include_24hr_change: 'true' },
                    timeout: 12000
                });
                const d = data[id];
                const chg = d.pkr_24h_change;
                await reply(sock, m,
`🪙 *${sym.toUpperCase()} Live Rate*
━━━━━━━━━━━━━━━
💵 USD: *$${fmt(d.usd)}*
🇵🇰 PKR: *Rs ${fmt(d.pkr)}*
📈 24h tabdeeli: *${chg >= 0 ? '▲ +' : '▼ '}${fmt(chg)}%*
⏰ Source: CoinGecko (live)`);
            } catch (e) {
                await reply(sock, m, '❌ Crypto rate abhi nahi mil raha (server busy) — thori dair baad phir try karein.');
            }
        }
    },
    // ---------------- OT ----------------
    {
        name: 'ot',
        exec: async (sock, m, args) => {
            const salary = pf(args[0]), hours = pf(args[1]);
            if (isNaN(salary) || isNaN(hours) || salary <= 0 || hours <= 0) return reply(sock, m, '⏱️ Usage: `.ot 60000 26` (mahana tankhwah, overtime ghante)');
            const hourly = salary / 208; // 26 din × 8 ghante
            await reply(sock, m,
`⏱️ *Overtime Hisab*
━━━━━━━━━━━━━━━
💵 Tankhwah: *${rs(salary)}*
🕐 Per ghanta rate: *${rs(hourly)}*
⏰ OT: *${fmt(hours, 0)} ghante*
💰 *Aam rate par: ${rs(hourly * hours)}*
💰 *Double rate par (agar policy ho): ${rs(hourly * 2 * hours)}*
💡 Per ghanta = tankhwah ÷ 208 (26 kaam ke din × 8 ghante).`);
        }
    },
    // ---------------- SALARY ----------------
    {
        name: 'salary',
        exec: async (sock, m, args) => {
            const s = pf(args[0]);
            if (isNaN(s) || s <= 0) return reply(sock, m, '💵 Usage: `.salary 85000` (mahana tankhwah)');
            await reply(sock, m,
`💵 *Tankhwah ki Tafseel* — ${rs(s)}/mahina
━━━━━━━━━━━━━━━
📅 Saal ki: *${rs(s * 12)}*
🗓️ Haftay ki: *${rs(s / 4.33)}*
☀️ Roz (30 din): *${rs(s / 30)}*
🏭 Roz (26 kaam ke din): *${rs(s / 26)}*
🕐 Per ghanta (208 ghante): *${rs(s / 208)}*`);
        }
    },
    // ---------------- MARKUP ----------------
    {
        name: 'markup',
        exec: async (sock, m, args) => {
            const cost = pf(args[0]), second = pf(args[1]);
            if (isNaN(cost) || isNaN(second) || cost <= 0) return reply(sock, m, '📈 Usage: `.markup 1000 30` (cost, markup %) ya `.markup 1000 1300` (cost, selling price)');
            let sell, markupPct, marginPct;
            if (second <= 300) { markupPct = second; sell = cost * (1 + second / 100); }
            else { sell = second; markupPct = ((sell - cost) / cost) * 100; }
            marginPct = ((sell - cost) / sell) * 100;
            await reply(sock, m,
`📈 *Markup / Margin*
━━━━━━━━━━━━━━━
💵 Cost: *${rs(cost)}*
🏷️ *Selling Price: ${rs(sell)}*
➕ Markup: *${fmt(markupPct, 1)}%* (cost par)
📊 Margin: *${fmt(marginPct, 1)}%* (selling price par)
💰 Munafa: *${rs(sell - cost)}*`);
        }
    },
    // ---------------- GOLD ----------------
    {
        name: 'gold',
        exec: async (sock, m, args) => {
            const qty = pf(args[0]);
            const unit = (args[1] || 'tola').toLowerCase();
            const rateTola = pf(args[2]);
            if (isNaN(qty) || isNaN(rateTola) || qty <= 0 || rateTola <= 0 || !['tola', 'gram', 'g'].includes(unit)) {
                return reply(sock, m, '🪙 Usage: `.gold 5 tola 245000` ya `.gold 10 gram 245000` (rate hamesha per tola dein)');
            }
            const tola = unit === 'tola' ? qty : qty / 11.66;
            await reply(sock, m,
`🪙 *Sone ka Hisab*
━━━━━━━━━━━━━━━
⚖️ Wazan: *${fmt(qty)} ${unit}* (= ${fmt(tola)} tola)
📊 Rate: *${rs(rateTola)}/tola* (Rs ${fmt(rateTola / 11.66)}/gram)
💰 *Kul Qeemat: ${rs(tola * rateTola)}*
💡 Making charges aur wastage (pallish) is ke ilawa hotay hain.`);
        }
    },
    // ---------------- RENT ----------------
    {
        name: 'rent',
        exec: async (sock, m, args) => {
            const r = pf(args[0]);
            if (isNaN(r) || r <= 0) return reply(sock, m, '🏠 Usage: `.rent 45000` (mahana kiraya)');
            await reply(sock, m,
`🏠 *Kiraya Hisab* — ${rs(r)}/mahina
━━━━━━━━━━━━━━━
📅 Saal ka: *${rs(r * 12)}*
☀️ Roz ka: *${rs(r / 30)}*
💵 Advance 3 mah: *${rs(r * 3)}*
💵 Advance 6 mah: *${rs(r * 6)}*
🔐 Security (aam 2 mah): *${rs(r * 2)}*`);
        }
    },
    // ---------------- FLATQIST ----------------
    {
        name: 'flatqist',
        alias: ['asanqist'],
        exec: async (sock, m, args) => {
            const price = pf(args[0]), advPct = pf(args[1]), months = pf(args[2]);
            const profitPct = args[3] !== undefined ? pf(args[3]) : 0;
            if (isNaN(price) || isNaN(advPct) || isNaN(months) || price <= 0 || months <= 0) {
                return reply(sock, m, '🧾 Usage: `.flatqist 120000 20 12 25` (qeemat, advance %, mahine, profit %) — profit na ho to `.flatqist 120000 20 12`');
            }
            const advance = price * advPct / 100;
            const remaining = price - advance;
            const profit = remaining * profitPct / 100;
            const monthly = (remaining + profit) / months;
            await reply(sock, m,
`🧾 *Aasan Qist Plan*
━━━━━━━━━━━━━━━
💵 Qeemat: *${rs(price)}*
⬇️ Advance (${fmt(advPct, 0)}%): *${rs(advance)}*
📊 Baqi: *${rs(remaining)}*${profitPct > 0 ? ` + profit ${fmt(profitPct, 0)}% (${rs(profit)})` : ''}
🗓️ *Mahana Qist: ${rs(monthly)}* × ${fmt(months, 0)} mah
💰 Kul adaigi: *${rs(advance + remaining + profit)}*`);
        }
    },
    // ---------------- WEIGHT ----------------
    {
        name: 'weight',
        exec: async (sock, m, args) => {
            const h = heightMeters(args[0]);
            if (!h) return reply(sock, m, '⚖️ Usage: `.weight 5.8` (5 ft 8 in) ya `.weight 175` (cm)');
            const lo = 18.5 * h * h, hi = 24.9 * h * h;
            await reply(sock, m,
`⚖️ *Ideal Wazan*
━━━━━━━━━━━━━━━
📏 Qad: *${fmt(h * 100, 0)} cm*
✅ *Sehatmand wazan: ${fmt(lo, 1)} kg se ${fmt(hi, 1)} kg tak*
💡 Ye BMI (18.5–24.9) ki aam range hai — body type se thora farq ho sakta hai.`);
        }
    },
    // ---------------- COMM ----------------
    {
        name: 'comm',
        exec: async (sock, m, args) => {
            const amount = pf(args[0]), pct = pf(args[1]);
            if (isNaN(amount) || isNaN(pct) || amount <= 0) return reply(sock, m, '🤝 Usage: `.comm 500000 3` (sale ki rakam, commission %)');
            const commission = amount * pct / 100;
            await reply(sock, m,
`🤝 *Commission Hisab*
━━━━━━━━━━━━━━━
💵 Sale: *${rs(amount)}*
📊 Commission: *${fmt(pct)}%*
💰 *Commission: ${rs(commission)}*
🏦 Baqi (seller ko): *${rs(amount - commission)}*`);
        }
    }
];
