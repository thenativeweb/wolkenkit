import { Command } from 'command-line-interface';
import { LockMySqlOptions } from './LockMySqlOptions';
declare const lockMySqlCommand: () => Command<LockMySqlOptions>;
export { lockMySqlCommand };
