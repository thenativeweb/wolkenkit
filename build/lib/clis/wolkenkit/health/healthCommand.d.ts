import { Command } from 'command-line-interface';
import { HealthOptions } from './HealthOptions';
declare const healthCommand: () => Command<HealthOptions>;
export { healthCommand };
