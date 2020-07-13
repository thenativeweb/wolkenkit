import { CommandsDescription } from './CommandsDescription';
import { DomainEventsDescription } from './DomainEventsDescription';
import { ViewsDescription } from './ViewsDescription';

export interface ApplicationDescription {
  commands: CommandsDescription;

  domainEvents: DomainEventsDescription;

  views: ViewsDescription;
}
