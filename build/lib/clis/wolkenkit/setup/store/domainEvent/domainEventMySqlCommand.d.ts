import { Command } from 'command-line-interface';
import { DomainEventMySqlOptions } from './DomainEventMySqlOptions';
declare const domainEventMySqlCommand: () => Command<DomainEventMySqlOptions>;
export { domainEventMySqlCommand };
