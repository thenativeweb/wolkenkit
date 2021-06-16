import { CommandsDescription } from './CommandsDescription';
import { DomainEventsDescription } from './DomainEventsDescription';
import { NotificationsDescription } from './NotificationsDescription';
import { ViewsDescription } from './ViewsDescription';
export interface ApplicationDescription {
    commands: CommandsDescription;
    domainEvents: DomainEventsDescription;
    notifications: NotificationsDescription;
    views: ViewsDescription;
}
