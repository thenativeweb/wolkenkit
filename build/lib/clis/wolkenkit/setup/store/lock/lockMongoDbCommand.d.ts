import { Command } from 'command-line-interface';
import { LockMongoDbOptions } from './LockMongoDbOptions';
declare const lockMongoDbCommand: () => Command<LockMongoDbOptions>;
export { lockMongoDbCommand };
