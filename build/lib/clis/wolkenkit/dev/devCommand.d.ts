import { Command } from 'command-line-interface';
import { DevOptions } from './DevOptions';
declare const devCommand: () => Command<DevOptions>;
export { devCommand };
