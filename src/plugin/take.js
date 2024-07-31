import fs from 'fs/promises';

const handleTakeCommand = async (m, gss) => {
  const prefixMatch = m.body.match(/^[\\/!#.]/);
  const prefix = prefixMatch ? prefixMatch[0] : '/';
  const [cmd, ...args] = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ') : ['', ''];
  const validCommands = ['take', 'steal', 'wm'];

  if (!validCommands.includes(cmd)) return;

  const [providedPackname, providedAuthor] = args.join(' ').split('|');

  if (!providedPackname || !providedAuthor) {
    return m.reply(`Usage: ${prefix + cmd}  pkgname|author`);
  }

  global.packname = providedPackname;
  global.author = providedAuthor;

  const quoted = m.quoted || {};

  if (!['imageMessage', 'videoMessage', 'stickerMessage'].includes(quoted.mtype)) {
    return m.reply(`Send/Reply with an image, video, or sticker to use ${prefix + cmd}`);
  }

  const mediaBuffer = await quoted.download();
  if (!mediaBuffer) throw new Error('Failed to download media.');

  await gss.sendImageAsSticker(m.from, mediaBuffer, m, { packname: global.packname, author: global.author });
};

export default handleTakeCommand;
