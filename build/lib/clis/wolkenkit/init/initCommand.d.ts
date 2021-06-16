import { Command } from 'command-line-interface';
import { InitOptions } from './InitOptions';
declare const initCommand: () => Command<InitOptions>;
export { initCommand };
