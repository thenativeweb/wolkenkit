import { AggregateEnhancer } from '../../tools/AggregateEnhancer';
import { AskInfrastructure } from './AskInfrastructure';
import { CommandData } from './CommandData';
import { CommandHandler } from './CommandHandler';
import { DomainEventData } from './DomainEventData';
import { DomainEventHandler } from './DomainEventHandler';
import { GetInitialState } from './GetInitialState';
import { State } from './State';
import { TellInfrastructure } from './TellInfrastructure';

export interface Aggregate<
  TState extends State,
  TInfrastructure extends AskInfrastructure & TellInfrastructure,
  TCommandDatas extends Record<string, CommandData> = Record<string, any>,
  TDomainEventDatas extends Record<string, DomainEventData> = Record<string, any>
> {
  getInitialState: GetInitialState<TState>;

  commandHandlers: {
    [commandName in keyof TCommandDatas]: CommandHandler<
    TState,
    TCommandDatas[commandName],
    TInfrastructure
    >
  };

  domainEventHandlers: {
    [domainEventName in keyof TDomainEventDatas]: DomainEventHandler<
    TState,
    TDomainEventDatas[domainEventName],
    TInfrastructure
    >
  };

  enhancers?: AggregateEnhancer[];
}
