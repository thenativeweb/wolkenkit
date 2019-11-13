import { AggregateEnhancer } from '../../tools/AggregateEnhancer';
import { CommandData } from './CommandData';
import { CommandHandler } from './CommandHandler';
import { DomainEventData } from './DomainEventData';
import { DomainEventHandler } from './DomainEventHandler';
import { GetInitialState } from './GetInitialState';
import { State } from './State';

export interface Aggregate<TState extends State> {
  getInitialState: GetInitialState<TState>;

  commandHandlers: Record<string, CommandHandler<TState, CommandData>>;

  domainEventHandlers: Record<string, DomainEventHandler<TState, DomainEventData>>;

  enhancers?: AggregateEnhancer[];
}
