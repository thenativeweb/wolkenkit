import { CommandData } from '../elements/CommandData';
import { CommandHandler } from '../elements/CommandHandler';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../elements/DomainEventHandler';
import { State } from '../elements/State';
import { ViewDefinition } from './ViewDefinition';

export interface ApplicationDefinition {
  commands: Record<string, Record<string, Record<string, CommandHandler<State, CommandData>>>>;

  domainEvents: Record<string, Record<string, Record<string, DomainEventHandler<State, DomainEventData>>>>;

  views: Record<string, ViewDefinition>;
}
