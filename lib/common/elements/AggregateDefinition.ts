import { CommandData } from './CommandData';
import { CommandHandler } from './CommandHandler';
import { DomainEventData } from './DomainEventData';
import { DomainEventHandler } from './DomainEventHandler';
import { State } from './State';

export interface AggregateDefinition {
  State: new () => State;
  commands: Record<string, CommandHandler<State, CommandData>>;
  domainEvents: Record<string, DomainEventHandler<State, DomainEventData>>;
}
