import { EventEmitter } from 'events';

const botEvents = new EventEmitter();

export default botEvents;
import { EventEmitter } from 'events';

// Create a shared event emitter instance
// Isko hum radio station ki tarah istemal karein gy,
// taake index.js aur handler.js aapas me direct baat na karein.
const botEvents = new EventEmitter();

// Is radio station ko baaki files ke liye export kar dein
export default botEvents;

