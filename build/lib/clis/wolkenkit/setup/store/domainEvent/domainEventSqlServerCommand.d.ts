import { Command } from 'command-line-interface';
import { DomainEventSqlServerOptions } from './DomainEventSqlServerOptions';
declare const domainEventSqlServerCommand: () => Command<DomainEventSqlServerOptions>;
export { domainEventSqlServerCommand };
