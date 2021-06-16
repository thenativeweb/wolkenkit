import { Command } from 'command-line-interface';
import { LockRedisOptions } from './LockRedisOptions';
declare const lockRedisCommand: () => Command<LockRedisOptions>;
export { lockRedisCommand };
