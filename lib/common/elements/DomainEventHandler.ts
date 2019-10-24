import { AggregatesService } from '../services/AggregatesService';
import { ClientService } from '../services/ClientService';
import { DomainEvent } from './DomainEvent';
import { DomainEventData } from './DomainEventData';
import { LoggerService } from '../services/LoggerService';
import { Schema } from './Schema';
import { State } from './State';

export interface DomainEventHandler<TState extends State, TDomainEventData extends DomainEventData> {
  getDocumentation? (): string;

  getSchema? (): Schema;

  handle (state: TState, event: DomainEvent<TDomainEventData>, services: {
    logger: LoggerService;
  }): Partial<TState>;

  isAuthorized (state: TState, event: DomainEvent<TDomainEventData>, services: {
    aggregates: AggregatesService;
    client: ClientService;
    logger: LoggerService;
  }): boolean | Promise<boolean>;

  filter? (state: TState, event: DomainEvent<TDomainEventData>, services: {
    aggregates: AggregatesService;
    client: ClientService;
    logger: LoggerService;
  }): boolean | Promise<boolean>;

  map? (state: TState, event: DomainEvent<TDomainEventData>, services: {
    aggregates: AggregatesService;
    client: ClientService;
    logger: LoggerService;
  }): DomainEvent<TDomainEventData> | Promise<DomainEvent<TDomainEventData>>;
}
