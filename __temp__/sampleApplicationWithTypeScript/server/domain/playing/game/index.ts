import { OpenedHandler } from './events/Opened';
import { OpenHandler } from './commands/Open';
import { State } from './State';

export const initialState = new State();
export const commandHandlers = { OpenHandler };
export const eventHandlers = { OpenedHandler };
