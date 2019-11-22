import { CommandDescription } from './CommandDescription';
import { DomainEventDescription } from './DomainEventDescription';
import { ViewDescription } from './ViewDescription';

export interface ApplicationDescription {
  commands: Record<string, Record<string, Record<string, CommandDescription>>>;

  domainEvents: Record<string, Record<string, Record<string, DomainEventDescription>>>;

  views: Record<string, ViewDescription>;
}
