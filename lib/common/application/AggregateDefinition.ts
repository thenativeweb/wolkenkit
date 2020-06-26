import { AskInfrastructure } from '../elements/AskInfrastructure';
import { CommandData } from '../elements/CommandData';
import { CommandHandler } from '../elements/CommandHandler';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../elements/DomainEventHandler';
import { GetInitialState } from '../elements/GetInitialState';
import { State } from '../elements/State';
import { TellInfrastructure } from '../elements/TellInfrastructure';

export interface AggregateDefinition {
  getInitialState: GetInitialState<State>;

  commandHandlers: Record<string, CommandHandler<State, CommandData, AskInfrastructure & TellInfrastructure>>;

  domainEventHandlers: Record<string, DomainEventHandler<State, DomainEventData, AskInfrastructure & TellInfrastructure>>;
}
