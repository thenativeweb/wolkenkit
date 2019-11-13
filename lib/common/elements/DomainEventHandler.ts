import { AggregatesService } from '../services/AggregatesService';
import { ClientService } from '../services/ClientService';
import { DomainEvent } from './DomainEvent';
import { DomainEventData } from './DomainEventData';
import { DomainEventWithState } from './DomainEventWithState';
import { LoggerService } from '../services/LoggerService';
import { Schema } from './Schema';
import { State } from './State';

export interface DomainEventHandler<TState extends State, TDomainEventData extends DomainEventData> {
  getDocumentation? (): string;

  getSchema? (): Schema;

  handle (state: TState, domainEvent: DomainEvent<TDomainEventData>, services: {
    logger: LoggerService;
  }): Partial<TState>;

  isAuthorized (state: TState, domainEvent: DomainEventWithState<TDomainEventData, TState>, services: {
    aggregates: AggregatesService;
    client: ClientService;
    logger: LoggerService;
  }): boolean | Promise<boolean>;

  filter? (state: TState, domainEvent: DomainEventWithState<TDomainEventData, TState>, services: {
    aggregates: AggregatesService;
    client: ClientService;
    logger: LoggerService;
  }): boolean | Promise<boolean>;

  map? (state: TState, domainEvent: DomainEventWithState<TDomainEventData, TState>, services: {
    aggregates: AggregatesService;
    client: ClientService;
    logger: LoggerService;
  }): DomainEventWithState<TDomainEventData, TState> | Promise<DomainEventWithState<TDomainEventData, TState>>;
}
