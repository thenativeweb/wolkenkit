import { DomainEventDescription } from './DomainEventDescription';

export type DomainEventsDescription = Record<string, Record<string, Record<string, DomainEventDescription>>>;
