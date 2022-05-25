import { EventType } from '../lib/events.js';
window.dispatchEvent(new CustomEvent(EventType.Installed));