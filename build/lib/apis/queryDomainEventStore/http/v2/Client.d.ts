/// <reference types="node" />
import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { HttpClient } from '../../../shared/HttpClient';
import { Snapshot } from '../../../../stores/domainEventStore/Snapshot';
import { State } from '../../../../common/elements/State';
import { Readable } from 'stream';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    getLastDomainEvent<TDomainEventData extends DomainEventData>({ aggregateIdentifier }: {
        aggregateIdentifier: AggregateIdentifier;
    }): Promise<DomainEvent<TDomainEventData> | undefined>;
    getDomainEventsByCausationId({ causationId }: {
        causationId: string;
    }): Promise<Readable>;
    hasDomainEventsWithCausationId({ causationId }: {
        causationId: string;
    }): Promise<boolean>;
    getDomainEventsByCorrelationId({ correlationId }: {
        correlationId: string;
    }): Promise<Readable>;
    getReplay({ fromTimestamp }: {
        fromTimestamp?: number;
    }): Promise<Readable>;
    getReplayForAggregate({ aggregateId, fromRevision, toRevision }: {
        aggregateId: string;
        fromRevision?: number;
        toRevision?: number;
    }): Promise<Readable>;
    getSnapshot<TState extends State>({ aggregateIdentifier }: {
        aggregateIdentifier: AggregateIdentifier;
    }): Promise<Snapshot<TState> | undefined>;
    getAggregateIdentifiers(): Promise<Readable>;
    getAggregateIdentifiersByName({ contextName, aggregateName }: {
        contextName: string;
        aggregateName: string;
    }): Promise<Readable>;
}
export { Client };
