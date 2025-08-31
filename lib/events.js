const EventEmitter = require('events');

// Create a shared event emitter instance
// Yeh ek central radio station banata hai
const botEvents = new EventEmitter();

module.exports = botEvents;

