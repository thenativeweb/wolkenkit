import { Command } from 'command-line-interface';
import { DomainEventMongoDbOptions } from './DomainEventMongoDbOptions';
declare const domainEventMongoDbCommand: () => Command<DomainEventMongoDbOptions>;
export { domainEventMongoDbCommand };
