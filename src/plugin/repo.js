import pkg, { prepareWAMessageMedia } from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;
import axios from 'axios'; // Import axios for HTTP requests

const handleRepoCommand = async (m, Matrix) => {
  const repoUrl = 'https://api.github.com/repos/Ethix-Xsid/Ethix-MD';
  try {
    const response = await axios.get(repoUrl);
    const repoData = response.data;

    const { name, forks_count, stargazers_count, created_at, updated_at, owner } = repoData;

    const messageText = `📊 *_Repository Information:_*
    > 🔸 *_Name:_* ${name}
    > ⭐ *_Stars:_* ${stargazers_count}
    > 🍴 *_Forks:_* ${forks_count}
    > 📅 *_Created At:_* ${new Date(created_at).toLocaleDateString()}
    > 🛠️ *_Last Updated:_* ${new Date(updated_at).toLocaleDateString()}
    > 👤 *_Owner:_* ${owner.login}`;

    const media = await prepareWAMessageMedia(
      { image: { url: 'https://telegra.ph/file/fbbe1744668b44637c21a.jpg' } },
      { upload: Matrix.waUploadToServer }
    );

    const repoMessage = generateWAMessageFromContent(m.key.remoteJid, proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            header: proto.Message.InteractiveMessage.Header.create({
              documentMessage: media.imageMessage,
            }),
            body: proto.Message.InteractiveMessage.Body.create({
              text: messageText,
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: "© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇᴛʜɪx-ᴍᴅ",
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Contact Owner",
                    id: ".owner"
                  })
                },
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Click Here To Fork",
                    url: `https://github.com/Ethix-Xsid/Ethix-MD/fork`
                  })
                },
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Join Our Community",
                    url: `https://whatsapp.com/channel/0029VaWJMi3GehEE9e1YsI1S`
                  })
                }
              ],
            }),
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 9999,
              isForwarded: true,
            }
          }),
        },
      },
    }), {});

    await Matrix.relayMessage(repoMessage.key.remoteJid, repoMessage.message, {
      messageId: repoMessage.key.id
    });
    await m.React('✅');

  } catch (error) {
    console.error("Error processing your request:", error);
    await Matrix.sendMessage(m.key.remoteJid, { text: 'Error processing your request.' });
    await m.React('❌');
  }
};

const searchRepo = async (m, Matrix) => {
  const prefixMatch = m.body.match(/^[\\/!#.]/);
  const prefix = prefixMatch ? prefixMatch[0] : '/';
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  const validCommands = ['repo', 'sc', 'script'];

  if (validCommands.includes(cmd)) {
    await handleRepoCommand(m, Matrix);
  }
};

export default searchRepo;
