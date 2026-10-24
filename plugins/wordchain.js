const botEvents = require('../lib/events.js');

// ======================================================
// WORD CHAIN — group lafz-jor game
// .wordchain        -> game shuru, bot pehla lafz deta hai
// Us lafz ke AKHRI harf se shuru hone wala lafz bhejo.
// Sahi lafz = +1 point. 45 sec khamoshi = game khatam,
// sab se zyada points wala jeet gaya.
// .wordchain score  -> mojooda points
// .wordchain stop   -> game band
// ======================================================

const DICT = new Set(('apple banana orange mango grape lemon melon peach pear plum kiwi fig date olive almond walnut cashew peanut hazel ' +
'cat dog lion tiger bear wolf fox deer goat sheep horse cow pig hen duck goose fish shark whale snake frog monkey donkey camel zebra giraffe panda koala rabbit mouse rat bat bee ant butterfly spider eagle owl parrot pigeon crow sparrow ' +
'red blue green yellow pink black white brown gold silver purple gray violet indigo orange ' +
'sun moon star sky cloud rain snow wind storm river sea ocean lake mountain hill valley forest desert island beach garden park road street bridge house home room door window table chair bed book pen pencil paper bag box key car bus train plane ship boat bike ball doll toy kite drum guitar piano song dance ' +
'run jump walk swim fly sing read write eat drink sleep wake play work help love like want need go come see look hear speak talk listen think know learn teach give take make do say get find tell ask try call move live play ' +
'happy sad angry hungry thirsty hot cold big small long short fast slow new old good bad easy hard soft strong weak rich poor clean dirty full empty right wrong true kind brave smart funny quiet loud bright dark sweet sour ' +
'water milk tea coffee juice bread rice wheat corn sugar salt honey cake candy chocolate cheese egg meat chicken ' +
'pakistan india china japan america london paris dubai karachi lahore islamabad school college office market shop bank hospital hotel cinema ' +
'time day night morning evening today tomorrow week month year hour minute second spring summer winter autumn ' +
'king queen prince man woman boy girl friend family father mother brother sister baby teacher student doctor farmer driver cook ' +
'one two three four five six seven eight nine ten first last next every some many much few all both each other this that here there where when what who why how ' +
'anchor angel animal answer apple arrow artist autumn baby balloon bamboo banana basket battle beach bean bear beauty bed bee bell belt bench bird birthday blanket boat bone book bottle box brain branch bread breeze bridge broom bubble bucket bus butter button ' +
'cabbage cable cage cake camera camp candle candy cap captain car card care carpet castle catch cattle cause chain chair chalk chance change cheese cherry chest chicken child city class cloud club coat coffee coin cold college color comb common cook cool corn corner cotton couch country course cover cow crack cream creek cricket crop cross crowd crown cry cup current curtain curve cushion ' +
'dance danger dark date daughter day deal dear death december decide deep deer degree desert desk detail dial diamond diary dice die diet dinner direct dirt dish disk distance doctor dog doll door double down dozen dream dress drink drive drop drum dry duck dust duty ' +
'eagle ear early earth east easy eat edge egg eight either elbow elder electric elephant eleven else email empty end enemy energy engine english enjoy enough enter equal error escape even evening event every exam example exercise exit expect expert explain extra eye ' +
'face fact factory fail fair fall family famous fan farm farmer fast fat fate father fault fear feather february feed feel fellow fence fever few field fierce fifteen fifth fight figure file fill film final find fine finger finish fire firm first fish five fix flag flame flash flat floor flour flow flower fly fog folk follow food foot for force forest forget fork form formal forward four frame free fresh friend frog front frost fruit fuel full fun fur future ' +
'gain game gap garden gas gate gather gem general genius gentle gift girl give glad glass global glove goal goat gold golf good govern grain grand grape graph grass great green greet grid grin ground group grow guard guess guest guide guitar gun ' +
'habit hair half hall hand handle hang happen happy harbor hard harm hat hate have head health hear heart heat heaven heavy heel height hello help hen her here hero hidden high hill hint hip hire history hit hobby hole holiday home honey honor hope horn horse hospital host hotel hour house how huge human humor hundred hunger hunt hurry hurt husband ' +
'ice icon idea ideal image imagine impact import impress inch include income indeed index indian indoor industry infant inform injury inner input insect inside instant instead insult intake integer intend interest internal internet interpret interval interview into invent invest invite involve iron island issue item itself ' +
'jacket january jazz jeans jet jewel job join joint joke journey joy judge juice july jump june junior junk just ' +
'keen keep kernel kettle key kick kid kill kind king kiss knee knife knock know known ' +
'label labor lack ladder lady lake lamp land lane language large laser last late laugh laundry law lawn lawyer layer lazy lead leaf learn leather leave left leg legal lemon lend length lens less lesson let letter level liberty library license lid life lift light like limb limit line link lion list listen little live loan local lock log lonely long look loose lose loss lot loud love low luck lucky luggage lunch lung luxury ' +
'machine mad magic mail main major make male mall man manage manner many map march margin mark market marriage master match material matter may mayor meal mean meat media medical meet member memory mental mention menu mere merit mess metal meter method middle might mild mile milk mill mind mine minor minute mirror miss mistake mix mobile mode model modern modest mold moment money monitor monkey month mood moon moral more morning most mother motion motor mount mouse mouth move movie much multiple muscle music must mutual ' +
'nail name narrow nasty national native natural nature near neat neck need needle negative neighbor neither nerve nest net never new next night nine no noble nobody noise none noon nor normal north nose not note nothing notice notion now number nurse nut ' +
'object obtain obvious occasion occur ocean october off offer office often oil old olive olympic once one onion online only open opera opinion opponent oppose option orange orbit order ordinary organ origin other ought outcome outer outfit output outside oval oven over owe own owner ' +
'pact page pain paint pair palace pale palm panda panel panic paper parent park part partner party pass past path patient pattern pause pay peace peach peak pear penalty pencil people pepper perfect perform perhaps period permanent person pet phase phone photo phrase piano pick picture piece pig pigeon pile pilot pink pipe pitch place plain plan plane planet plant plastic plate play pleasant please plenty plot plus pocket poem poet point police policy political pond pool poor popular port position positive possess post pot potato potential pound pour powder power practical praise pray precise predict prefer pregnant premise premium prepare presence present president press pressure prevent previous price pride priest primary prime prince print prior private prize probably problem proceed process produce product professional professor profile profit program progress project promise prompt proof proper property propose protect proud prove psychology public publish pull pupil purchase pure purple purpose push put puzzle ' +
'quality quantity quarter queen query question quick quiet quit quite quota quote ' +
'rabbit race radio rail rain raise rally range rank rapid rare rate rather ratio raw reach react read real rear reason rebel recall receive recent reckon record recover red reduce refer reflect reform refuse regard region register regret regular reinforce reject relax release relevant relief rely remain remember remind remote remove rent repair repeat replace reply report request rescue reserve resist resolution resort resource respect respond responsible rest restaurant restore result resume retain return reveal revenue review reward rice rich rid ride rifle right rigid ring ripe rise risk rival river road roast rock rocket role roll roof room root rose rough round route row rub rude rug rule run rural rush rust ' +
'sacred sad safe sail saint salad salary sale salt same sample sanction sand save say scale scan scared scene scheme school science scissor scope score scout screen script sea search season seat second secret section sector secure see seed seek seem select sell semester send senior sense sentence separate sequence series serious serve service session set seven several severe shake shape share shark sharp she sheep sheet shelf shell shift shine ship shock shoe shoot shop short shout show shut shy sick side sigh sign signal silent silk silver similar simple single sink sir sister sit six size ski skill skin skirt sky slave sleep slice slide slight slip slope slow small smart smell smile smoke smooth snake snap snow soap social sock soft soil solar soldier solid solution some son song soon sophisticated sorry sort soul sound soup source south space spare spark speak special species speech speed spell spend sphere spill spin spirit split speak sport spot spread spring square squeeze stable stack staff stage stair stamp stand star stare start state station statue status stay steady steam steel steep stem step stick still stir stock stomach stone stop store storm story stove straight strange strap strawberry stream street stress stretch strict strike string strip stroke strong structure struggle student studio study stuff stupid style subject submit substance suburb succeed such sudden sufficient sugar suggest suit summer super supper support suppose sure surface surgery surprise surround survey survive suspect swap swear sweet swim swing symbol system ' +
'table tackle tail take talk tall tank tap tape target task tax tea teach team tear tech teen tell temperature temple ten tenant tennis tension tent term terrible territory test text than thank that their them theme then theory there thick thief thing think third thirsty thorough those though thought thousand threat three through throw thursday ticket tide tie tiger tight till time tiny tip tire title to tobacco today together toilet tomato tomorrow ton tongue tonight tool tooth top topic total tough tour toward tower town toy trace track trade traditional traffic trail train transfer transform translate transport travel tread treasure treat tree trend trial tribe trick trip troop trouble truck true trunk trust truth try tube tuesday tumor tune tunnel turkey turn tutor twelve twenty twice twin type typical ' +
'ugly ultimate umbrella unable uncertain uncle under undo unfair uniform union unique unit united universal unless unlike until unusual upon upper upset urban urge use used useful user usual ' +
'vacation vague valley value van various vary vast vegetable venture version very vessel veteran via victim victory video village violent virtual virus visible visit visual vitamin vocal voice volume volunteer vote voyager ' +
'wage wagon waist wait wake walk wall wander want war warm warn wash waste watch water wave way weak wealth weapon wear weather weave web wedding week weigh weird welcome well west wet whale what wheat wheel when where which while whip whisper white who whole why wicked wide wife wild will win wind window wine wing winter wire wisdom wise wish with within without witness wolf woman wonder wood wool word work world worry worse worth would wound wrap wrist write wrong ' +
'yard year yellow yet yield you young your youth zone zoo zoom').split(/\s+/));

const GAMES = new Map(); // groupJid -> game
const TIMEOUT_MS = 45 * 1000;

function endGame(sock, jid, reason) {
    const g = GAMES.get(jid);
    if (!g) return;
    clearTimeout(g.timer);
    GAMES.delete(jid);
    const standings = [...g.scores.entries()].sort((a, b) => b[1] - a[1]);
    if (!standings.length) {
        sock.sendMessage(jid, { text: `⌛ *Word Chain khatam* — ${reason}\nKoi point nahi bana. Dobara: \`.wordchain\`` }).catch(() => {});
        return;
    }
    const [winId, winPts] = standings[0];
    let out = `🏁 *WORD CHAIN KHATAM* — ${reason}\n\n🏆 Winner: @${winId.split('@')[0]} — *${winPts} points*\n`;
    standings.slice(0, 5).forEach(([id, pts], i) => { out += `\n${i + 1}. @${id.split('@')[0]} — ${pts}`; });
    out += '\n\nDobara: `.wordchain`';
    sock.sendMessage(jid, { text: out, mentions: standings.slice(0, 5).map(s => s[0]) }).catch(() => {});
}

function armTimer(sock, jid) {
    const g = GAMES.get(jid);
    if (!g) return;
    clearTimeout(g.timer);
    g.timer = setTimeout(() => endGame(sock, jid, '45 sec koi sahi lafz nahi aya.'), TIMEOUT_MS);
}

function seedWord() {
    const arr = [...DICT].filter(w => w.length >= 4);
    return arr[Math.floor(Math.random() * arr.length)];
}

botEvents.on('new-message', async ({ sock, m }) => {
    try {
        const jid = m.key.remoteJid;
        if (!jid || !jid.endsWith('@g.us') || m.key.fromMe) return;
        const g = GAMES.get(jid);
        if (!g) return;
        const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim().toLowerCase();
        if (!body || body.startsWith('.') || /\s/.test(body)) return;
        if (!/^[a-z]{3,}$/.test(body)) return;
        const need = g.word.slice(-1);
        if (body[0] !== need) return; // ghalat harf — khamoshi (spam nahi)
        if (g.used.has(body)) {
            await sock.sendMessage(jid, { text: `⚠️ *${body.toUpperCase()}* pehle ho chuka hai — koi aur lao!` }, { quoted: m }).catch(() => {});
            return;
        }
        const plausible = DICT.has(body) || (/[aeiou]/.test(body) && body.length >= 4);
        if (!plausible) return; // lagta hai ghalat lafz — ignore
        const sender = m.key.participant || jid;
        g.used.add(body);
        g.word = body;
        g.scores.set(sender, (g.scores.get(sender) || 0) + 1);
        armTimer(sock, jid);
        await sock.sendMessage(jid, {
            text: `✅ @${sender.split('@')[0]} — *${body.toUpperCase()}* (+1)\n🔤 Agla lafz: *${body.slice(-1).toUpperCase()}* se shuru ho!`,
            mentions: [sender]
        }, { quoted: m }).catch(() => {});
    } catch (e) {}
});

const wordchainCmd = {
    name: 'wordchain',
    alias: ['wchain', 'chain'],
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '👥 Word Chain sirf group mein khela jata hai.' }, { quoted: m });
        const a = (args[0] || '').toLowerCase();
        if (a === 'stop') {
            if (!GAMES.has(jid)) return sock.sendMessage(jid, { text: 'Koi game chal hi nahi raha.' }, { quoted: m });
            endGame(sock, jid, 'game roka gaya.');
            return;
        }
        if (a === 'score') {
            const g = GAMES.get(jid);
            if (!g) return sock.sendMessage(jid, { text: 'Koi game chal nahi raha. `.wordchain` se shuru karo.' }, { quoted: m });
            const s = [...g.scores.entries()].sort((x, y) => y[1] - x[1]);
            const out = s.length ? s.map(([id, p], i) => `${i + 1}. @${id.split('@')[0]} — ${p}`).join('\n') : 'Abhi koi point nahi.';
            return sock.sendMessage(jid, { text: `📊 *Word Chain Points*\n\n${out}\n\n🔤 Mojooda lafz: *${g.word.toUpperCase()}* — *${g.word.slice(-1).toUpperCase()}* se lao!`, mentions: s.map(x => x[0]) }, { quoted: m });
        }
        if (GAMES.has(jid)) {
            const g = GAMES.get(jid);
            return sock.sendMessage(jid, { text: `🎮 Game pehle se chal raha hai!\n🔤 Mojooda lafz: *${g.word.toUpperCase()}* — *${g.word.slice(-1).toUpperCase()}* se shuru hone wala lafz bhejo.` }, { quoted: m });
        }
        const w = seedWord();
        GAMES.set(jid, { word: w, used: new Set([w]), scores: new Map(), timer: null });
        armTimer(sock, jid);
        return sock.sendMessage(jid, {
            text: `🎮 *WORD CHAIN SHURU!*\n\nQawaneen: mere lafz ke *akhri harf* se shuru hone wala English lafz bhejo (kam az kam 3 harf, ek lafz ek hi dafa). Sahi jawab = +1 point. 45 sec khamoshi = game khatam.\n\n🔤 Pehla lafz: *${w.toUpperCase()}*\nAb *${w.slice(-1).toUpperCase()}* se lao!`
        }, { quoted: m });
    }
};

module.exports = [wordchainCmd];
