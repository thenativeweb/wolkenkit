import { Command } from 'command-line-interface';
import { RootOptions } from './RootOptions';
declare const rootCommand: () => Command<RootOptions>;
export { rootCommand };
