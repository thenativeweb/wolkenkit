import { Command } from 'command-line-interface';
import { LockPostgresOptions } from './LockPostgresOptions';
declare const lockPostgresCommand: () => Command<LockPostgresOptions>;
export { lockPostgresCommand };
