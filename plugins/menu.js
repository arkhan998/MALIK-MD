const fs = require("fs");
const path = require("path");
const config = require("../config.js");

const command = {
    name: "menu",
    alias: ["menu-v2"],
    exec: async (sock, m, args) => {
        try {
            // Menu card image: src/menu-card.jpg (nayi branded) -> fallback src/malikmd.jpeg
            const cardPath = path.join(__dirname, '..', 'src', 'menu-card.jpg');
            const imagePath = fs.existsSync(cardPath) ? cardPath : path.join(__dirname, '..', 'src', 'malikmd.jpeg');
            const imageBuffer = fs.readFileSync(imagePath);

            const isOwner = config.OWNER_NUMBER && m.key.remoteJid.startsWith(config.OWNER_NUMBER);

            // ======================================================
            // MAIN MENU KA TEXT
            // ======================================================
            const menuCaption = `╭━━━〔 🤖 *MALIK-MD* 〕━━━┈⊷
┃★╭──────────────
┃★│ ✨ _The most powerful WhatsApp_
┃★│ _bot in town!_
┃★│
┃★│ 👑 *Owner:* ${config.OWNER_NAME}
┃★│ ⚡ *Prefix:* ${config.prefix}
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
📋 *Choose a category:*
> _Reply with the matching number_

╭━━━〔 📂 *Categories* 〕━━━┈⊷
┃★│ ❶  *AI Menu* 🤖
┃★│ ❷  *Downloader* 📥
┃★│ ❸  *Islamic* 🕋
┃★│ ❹  *Tools* 🛠️
┃★│ ❺  *Fun* 🎭`;

            // Agar user owner hai to Owner Menu ka option dikhana
            let finalMenuCaption = menuCaption;
            if (isOwner) {
                finalMenuCaption += `\n┃★│ ❻  *Owner Menu* 👑`;
            }

            finalMenuCaption += `
╰━━━━━━━━━━━━━━━┈⊷
> ✨ _Powered by ${config.OWNER_NAME}_`;

            // ======================================================
            // HAR CATEGORY KE ANDAR KE COMMANDS
            // ======================================================
            const menuData = {
                '1': {
                    title: "🤖 *AI Menu* 🤖",
                    content: `╭━━━〔 *AI Menu* 〕━━━┈⊷
┃★╭──────────────
┃★│ 🖼️ *Image AI*
┃★│ • .fluxai [prompt]
┃★│ • .sdiffusion [prompt]
┃★│ • .stability [prompt]
┃★│ • .gimage [query]
┃★╰──────────────
┃★╭──────────────
┃★│ 👁️ *Vision & Text*
┃★│ • .ai [question]
┃★│ • .describe (reply to image)
┃★╰──────────────
┃★╭──────────────
┃★│ ✨ *Novel AI*
┃★│ • .summarize (group chat summary)
┃★│ • .roast @user (funny roast)
┃★│ • .dream [khwab] (tabeer)
┃★│ • .tone [style] [text]
┃★│ • .transcribe (reply to voice note)
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷`
                },
                '2': {
                    title: "📥 *Downloader Menu* 📥",
                    content: `╭━━━〔 *Download Menu* 〕━━━┈⊷
┃★╭──────────────
┃★│ 🌐 *Social Media & Music*
┃★│ • .dl [link] (all platforms!)
┃★│ • .dl [link] mp3 (audio)
┃★│ • .tiktok [link]
┃★│ • .song [song name]
┃★│ • .pin [pinterest link]
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷`
                },
                '3': {
                    title: "🕋 *Islamic Menu* 🕋",
                    content: `╭━━━〔 *Islamic Menu* 〕━━━┈⊷
┃★╭──────────────
┃★│ 📖 *Quran Commands*
┃★│ • .quran [surah number]
┃★│ • .quranmenu (for list)
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷`
                },
                '4': {
                    title: "🛠️ *Tools Menu* 🛠️",
                    content: `╭━━━〔 *Tools Menu* 〕━━━┈⊷
┃★╭──────────────
┃★│ 🔍 *Information*
┃★│ • .weather [city]
┃★│ • .news
┃★│ • .news urdu
┃★╰──────────────
┃★╭──────────────
┃★│ 👥 *Group Management* (groups only)
┃★│ • .tagall [text]
┃★│ • .kick @user
┃★│ • .promote @user
┃★│ • .demote @user
┃★│ • .antilink on|off
┃★│ • .welcome on|off
┃★│ • .automod on|off
┃★│ • .stats
┃★╰──────────────
┃★╭──────────────
┃★│ 🧰 *Utilities*
┃★│ • .vv (reply to view-once)
┃★│ • .tts [lang] [text]
┃★│ • .namaz [city]
┃★│ • .screenshot <url>
┃★│ • .poll "Q" "opt1" "opt2"
┃★│ • .assistant on|off (owner, DM only)
┃★│ • .autoreact on|random|❤️|off
┃★│ • .autotyping on|off
┃★│ • .join (group + channel links)
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷`
                },
                '5': {
                    title: "🏠 *Main Menu* 🏠",
                    content: `╭━━━〔 🤖 *MALIK-MD* 〕━━━┈⊷
┃★╭──────────────
┃★│ ✨ _Welcome to the most powerful_
┃★│    _WhatsApp bot in town!_
┃★│
┃★│ 👑 *Owner:* ${config.OWNER_NAME}
┃★│ ⚡ *Prefix:* ${config.prefix}
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
╭━━━〔 📋 *Commands* 〕━━━┈⊷
┃★│ ❶ AI Menu 🤖
┃★│ ❷ Downloaders 📥
┃★│ ❸ Islamic ☪️
┃★│ ❹ Tools 🧰
┃★│ ❺ Fun 🎭
┃★│ ❻ Owner 👑
╰━━━━━━━━━━━━━━━┈⊷
> _Reply with a number (1-6)_ 👇`
                },
                '6': {
                    title: "👑 *Owner Menu* 👑",
                    content: `╭━━━〔 *Owner Menu* 〕━━━┈⊷
┃★╭──────────────
┃★│ ⚠️ *Bot Control*
┃★│ • .restart
┃★│ • .settings
┃★│ • .listusers
┃★│ • .simdata [number]
┃★│ • .antidelete on|off
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷`
                }
            };
            
            // Main menu bhejna
            const sentMsg = await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                caption: finalMenuCaption
            }, { quoted: m });
            
            // Ab user ke reply ka intezar karna
            const messageID = sentMsg.key.id;
            const originalSender = m.key.remoteJid;

            const handler = async (msgData) => {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message || receivedMsg.key.remoteJid !== originalSender) return;

                const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                
                if (isReplyToMenu) {
                    const receivedText = (receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text || "").trim();
                    
                    const selectedMenu = menuData[receivedText];

                    if (selectedMenu) {
                         // Owner-only check
                        if (receivedText === '6' && !isOwner) {
                            await sock.sendMessage(originalSender, { text: "❌ You are not the owner to access this menu." }, { quoted: receivedMsg });
                            return;
                        }
                        
                        // Category menu bhejna
                        await sock.sendMessage(originalSender, {
                            text: selectedMenu.content
                        }, { quoted: receivedMsg });
                        await sock.sendMessage(originalSender, { react: { text: '✅', key: receivedMsg.key } });

                    } else {
                        await sock.sendMessage(originalSender, { text: `❌ *Invalid Option!* ❌\n\nPlease reply with a valid number from the menu.` }, { quoted: receivedMsg });
                    }
                }
            };

            sock.ev.on("messages.upsert", handler);

            // 3 minute ke baad reply sun'na band kar dena
            setTimeout(() => {
                sock.ev.off("messages.upsert", handler);
            }, 180000);

        } catch (e) {
            console.error('New Menu Error:', e);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Menu system is currently busy. Please try again later.` }, { quoted: m });
        }
    }
};

module.exports = command;
