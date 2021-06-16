import { Command } from 'command-line-interface';
import { LockSqlServerOptions } from './LockSqlServerOptions';
declare const lockSqlServerCommand: () => Command<LockSqlServerOptions>;
export { lockSqlServerCommand };
