/// <reference types="node" />
import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { Client as QueryClient } from '../../../apis/queryDomainEventStore/http/v2/Client';
import { Readable } from 'stream';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { Client as WriteClient } from '../../../apis/writeDomainEventStore/http/v2/Client';
declare class AeonstoreDomainEventStore implements DomainEventStore {
    protected queryClient: QueryClient;
    protected writeClient: WriteClient;
    protected constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    static create({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    }): Promise<AeonstoreDomainEventStore>;
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
    storeDomainEvents<TDomainEventData extends DomainEventData>({ domainEvents }: {
        domainEvents: DomainEvent<TDomainEventData>[];
    }): Promise<void>;
    storeSnapshot({ snapshot }: {
        snapshot: Snapshot<State>;
    }): Promise<void>;
    getAggregateIdentifiers(): Promise<Readable>;
    getAggregateIdentifiersByName({ contextName, aggregateName }: {
        contextName: string;
        aggregateName: string;
    }): Promise<Readable>;
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { AeonstoreDomainEventStore };
