import { AggregateEnhancer } from '../../tools/AggregateEnhancer';
import { AskInfrastructure } from './AskInfrastructure';
import { CommandData } from './CommandData';
import { CommandHandler } from './CommandHandler';
import { DomainEventData } from './DomainEventData';
import { DomainEventHandler } from './DomainEventHandler';
import { GetInitialState } from './GetInitialState';
import { State } from './State';
import { TellInfrastructure } from './TellInfrastructure';

export interface Aggregate<TState extends State> {
  getInitialState: GetInitialState<TState>;

  commandHandlers: Record<string, CommandHandler<TState, CommandData, AskInfrastructure & TellInfrastructure>>;

  domainEventHandlers: Record<string, DomainEventHandler<TState, DomainEventData, AskInfrastructure & TellInfrastructure>>;

  enhancers?: AggregateEnhancer[];
}
