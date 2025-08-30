import { readdirSync } from 'fs';
import path from 'path';

const commands = new Map();
const pluginsDir = path.join(process.cwd(), 'plugins');

// Dynamically load all command files from the 'plugins' directory
try {
    const commandFiles = readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        // Use dynamic import for ES modules
        const commandModule = await import(`file://${path.join(pluginsDir, file)}`);
        const command = commandModule.default; // Assuming default export
        if (command && command.name) {
            commands.set(command.name, command);
            console.log(`Loaded command: ${command.name}`);
        }
    }
} catch (error) {
    console.error("Error loading plugins:", error);
}

export const handler = async (sock, m, config) => {
    if (!m.message) return;

    const messageType = Object.keys(m.message)[0];
    const messageText = m.message.conversation || m.message.extendedTextMessage?.text || '';

    if (!messageText.startsWith(config.prefix)) {
        return;
    }

    const args = messageText.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);

    if (!command) {
        return;
    }

    try {
        await command.execute({ sock, m, args, config, commands });
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        sock.sendMessage(m.key.remoteJid, { text: 'An error occurred while executing this command.' }, { quoted: m });
    }
};
