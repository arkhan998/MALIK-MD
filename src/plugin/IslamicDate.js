import moment from 'moment-timezone';
import axios from 'axios';

// Define a timezone for Dera Ghazi Khan
const timeZone = 'Asia/Karachi';

// Function to get the current Islamic date
export async function getIslamicDate() {
    const date = moment().tz(timeZone);
    const islamicDateResponse = await axios.get(`http://api.aladhan.com/v1/gToH?date=${date.format('DD-MM-YYYY')}`);
    const islamicDateData = islamicDateResponse.data.data.hijri;
    return `${islamicDateData.day} ${islamicDateData.month.en} ${islamicDateData.year}`;
}
