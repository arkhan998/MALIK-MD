const moment = require('moment-timezone');
const axios = require('axios');

// Define a timezone for Dera Ghazi Khan
const timeZone = 'Asia/Karachi';

// Function to get the current Islamic date
async function getIslamicDate() {
    const date = moment().tz(timeZone);
    const islamicDateResponse = await axios.get(`http://api.aladhan.com/v1/gToH?date=${date.format('DD-MM-YYYY')}`);
    const islamicDateData = islamicDateResponse.data.data.hijri;
    return `${islamicDateData.day} ${islamicDateData.month.en} ${islamicDateData.year}`;
}

// Function to handle the bot's message
async function handleBotMessage(message) {
    try {
        // Get the Islamic date
        const islamicDate = await getIslamicDate();

        // Format the response message
        const responseMessage = `Assalamualaikum! Aaj ki Islami tareekh hai: ${islamicDate}`;

        // Send the response to the user
        await sendMessageToUser(message.from, responseMessage);

    } catch (error) {
        console.error('Error fetching Islamic date:', error);
        await sendMessageToUser(message.from, 'Sorry, there was an error retrieving the Islamic date.');
    }
}

// Function to simulate sending a message to the user (replace with your bot's message sending logic)
async function sendMessageToUser(user, message) {
    console.log(`Sending message to ${user}: ${message}`);
    // Replace with actual code to send message
}

// Example usage (replace with your bot's actual message handling logic)
handleBotMessage({ from: 'user-number' });
