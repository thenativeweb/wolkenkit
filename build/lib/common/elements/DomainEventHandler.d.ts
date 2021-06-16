import { AggregatesService } from '../services/AggregatesService';
import { AskInfrastructure } from './AskInfrastructure';
import { ClientService } from '../services/ClientService';
import { DomainEvent } from './DomainEvent';
import { DomainEventData } from './DomainEventData';
import { DomainEventWithState } from './DomainEventWithState';
import { LoggerService } from '../services/LoggerService';
import { Schema } from './Schema';
import { State } from './State';
import { TellInfrastructure } from './TellInfrastructure';
export interface DomainEventHandler<TState extends State, TDomainEventData extends DomainEventData, TInfrastructure extends AskInfrastructure & TellInfrastructure> {
    getDocumentation?: () => string;
    getSchema?: () => Schema;
    handle: (state: TState, domainEvent: DomainEvent<TDomainEventData>, services: {
        logger: LoggerService;
        infrastructure: Pick<TInfrastructure, 'ask'>;
    }) => Partial<TState>;
    isAuthorized: (state: TState, domainEvent: DomainEventWithState<TDomainEventData, TState>, services: {
        aggregates: AggregatesService;
        client: ClientService;
        logger: LoggerService;
        infrastructure: Pick<TInfrastructure, 'ask'>;
    }) => boolean | Promise<boolean>;
    filter?: (state: TState, domainEvent: DomainEventWithState<TDomainEventData, TState>, services: {
        aggregates: AggregatesService;
        client: ClientService;
        logger: LoggerService;
        infrastructure: Pick<TInfrastructure, 'ask'>;
    }) => boolean | Promise<boolean>;
    map?: (state: TState, domainEvent: DomainEventWithState<TDomainEventData, TState>, services: {
        aggregates: AggregatesService;
        client: ClientService;
        logger: LoggerService;
        infrastructure: Pick<TInfrastructure, 'ask'>;
    }) => DomainEventWithState<TDomainEventData, TState> | Promise<DomainEventWithState<TDomainEventData, TState>>;
}
