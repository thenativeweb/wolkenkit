import { Command } from 'command-line-interface';
import { DomainEventPostgresOptions } from './DomainEventPostgresOptions';
declare const domainEventPostgresCommand: () => Command<DomainEventPostgresOptions>;
export { domainEventPostgresCommand };
