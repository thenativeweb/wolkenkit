import { BuildOptions } from './BuildOptions';
import { Command } from 'command-line-interface';
declare const buildCommand: () => Command<BuildOptions>;
export { buildCommand };
