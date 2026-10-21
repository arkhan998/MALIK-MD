const fs = require('fs');
const path = require('path');

// ======================================================
// PROFIT CALCULATOR — .profit cost sell [qty]
// Misal: .profit 450 600 10
// ======================================================
const rs = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');

module.exports = {
    name: 'profit',
    alias: ['margin', 'munafa'],
    ownerOnly: true,
    exec: async (sock, m, args) => {
        const jid = m.key.remoteJid;
        const send = (text) => sock.sendMessage(jid, { text }, { quoted: m });
        const cost = parseFloat(args[0]);
        const sell = parseFloat(args[1]);
        const qty = parseFloat(args[2]) || 1;
        if (!cost || !sell) return send('💹 *Profit Calculator*\n\nFormat: `.profit cost sell [qty]`\nMisal: `.profit 450 600` ya `.profit 450 600 10`');
        const per = sell - cost;
        const onCost = (per / cost) * 100;
        const onSell = (per / sell) * 100;
        let txt = `💹 *MUNAFA HISAAB*\n━━━━━━━━━━━━━━━\n📥 Kharid (Cost): ${rs(cost)}\n📤 Farokht (Sell): ${rs(sell)}\n━━━━━━━━━━━━━━━\n${per >= 0 ? '✅' : '⚠️'} Per piece munafa: *${rs(per)}*\n📊 Cost par margin: *${onCost.toFixed(1)}%*\n📊 Price par margin: *${onSell.toFixed(1)}%*`;
        if (qty > 1) txt += `\n📦 ${qty} pieces par total: *${rs(per * qty)}*`;
        if (per < 0) txt += '\n\n⚠️ *Ye rate nuqsan de raha hai!*';
        return send(txt);
    }
};
