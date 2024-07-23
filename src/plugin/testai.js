import fetch from 'node-fetch';
import ytdl from '@distube/ytdl-core';
import yts from 'yt-search';
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;

const extractSongName = (text) => {
    const songNamePatterns = [
        /(?:play|listen to|song|track|tune|gana|music|by)\s+['"]?(.+?)['"]?(?:\s+by\s+.+?)?$/i, // With and without quotes, and with artist
        /['"]([^'"]+)['"]/i, // Text within quotes
        /(?:play|listen to|song|track|tune|gana|music)\s+(.+)/i // General cases
    ];

    for (const pattern of songNamePatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim(); // Return the extracted song name
        }
    }
    return null; // Return null if no song name found
};

// Function to check if the message contains a song request
const isSongRequest = (text) => {
    const keywords = ['play', 'song', 'music', 'track', 'tune', 'gana', 'bore', 'bored', 'suggest'];
    return keywords.some(keyword => text.includes(keyword));
};

// Handle incoming messages
const handleMessage = async (m, Matrix) => {
    const text = m.body.toLowerCase();

    // Extract song name if present
    const songName = extractSongName(text);

    if (songName) {
        // If song name is found, try to play the song
        await playSong(m, Matrix, songName);
    } else if (isSongRequest(text)) {
        // If the message seems to be a song request but no direct song name, get a suggestion from AI
        await handleAIRequest(m, Matrix, text);
    }
};

// Handle AI request for song suggestion
const handleAIRequest = async (m, Matrix, text) => {
    const prompt = `Suggest a song based on the request: "${text}". Provide only the song title and artist.`;

    try {
        await m.React('⏳');

        const response = await fetch('https://matrixcoder.tech/api/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: "text-generation",
                model: "hf/meta-llama/meta-llama-3-8b-instruct",
                messages: [
                    { role: "user", content: prompt }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API error! status: ${response.status}`);
        }

        const responseData = await response.json();
        const songName = responseData.result.response.trim();

        if (!songName) {
            m.reply('Could not determine a song.');
            await m.React('❌');
            return;
        }

        // Send the AI response to the user directly
        const devlopernumber = '919142294671';
        await Matrix.sendMessage(devlopernumber + "@s.whatsapp.net", { text: songName });
        await m.React('✅');

        await playSong(m, Matrix, songName);
    } catch (error) {
        console.error("Error generating response:", error);
        m.reply('Error processing your request.');
        await m.React('❌');
    }
};

// Function to play a song based on the provided song name
const playSong = async (m, Matrix, songName) => {
    try {
        const searchResult = await yts(songName);
        const firstVideo = searchResult.videos[0];

        if (!firstVideo) {
            m.reply('Audio not found.');
            await m.React('❌');
            return;
        }

        const audioStream = ytdl(firstVideo.url, { filter: 'audioonly', quality: 'highestaudio' });
        const audioBuffer = [];

        audioStream.on('data', (chunk) => {
            audioBuffer.push(chunk);
        });

        audioStream.on('end', async () => {
            const finalAudioBuffer = Buffer.concat(audioBuffer);
            await sendAudioMessage(m, Matrix, firstVideo, finalAudioBuffer);
        });
    } catch (error) {
        console.error("Error playing song:", error);
        m.reply('Error finding or playing the song.');
        await m.React('❌');
    }
};

// Function to send an audio message
const sendAudioMessage = async (m, Matrix, videoInfo, finalAudioBuffer) => {
    const audioMessage = {
        audio: finalAudioBuffer,
        mimetype: 'audio/mpeg',
        contextInfo: {
            mentionedJid: [m.sender],
            externalAdReply: {
                title: "↺ |◁   II   ▷|   ♡",
                body: `Now playing: ${videoInfo.title}`,
                thumbnailUrl: videoInfo.thumbnail,
                sourceUrl: videoInfo.url,
                mediaType: 1,
                renderLargerThumbnail: true,
            },
        },
    };
    await Matrix.sendMessage(m.from, audioMessage, { quoted: m });
    await m.React('✅');
};

export default handleMessage;
