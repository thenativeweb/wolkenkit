import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { Client as QueryClient } from '../../../apis/queryDomainEventStore/http/v2/Client';
import { Readable } from 'stream';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { Client as WriteClient } from '../../../apis/writeDomainEventStore/http/v2/Client';

class AeonstoreDomainEventStore implements DomainEventStore {
  protected queryClient: QueryClient;

  protected writeClient: WriteClient;

  protected constructor ({ protocol = 'http', hostName, portOrSocket, path = '/' }: {
    protocol?: string;
    hostName: string;
    portOrSocket: number | string;
    path?: string;
  }) {
    const trimmedPath = path.endsWith('/') ? path.slice(0, -1) : path;

    this.queryClient = new QueryClient({
      protocol, hostName, portOrSocket, path: `${trimmedPath}/query/v2`
    });
    this.writeClient = new WriteClient({
      protocol, hostName, portOrSocket, path: `${trimmedPath}/write/v2`
    });
  }

  public static async create ({ protocol = 'http', hostName, portOrSocket, path = '/' }: {
    protocol?: string;
    hostName: string;
    portOrSocket: number | string;
    path?: string;
  }): Promise<AeonstoreDomainEventStore> {
    return new AeonstoreDomainEventStore({ protocol, hostName, portOrSocket, path });
  }

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    return await this.queryClient.getLastDomainEvent({ aggregateIdentifier });
  }

  public async getDomainEventsByCausationId ({ causationId }: {
    causationId: string;
  }): Promise<Readable> {
    return await this.queryClient.getDomainEventsByCausationId({ causationId });
  }

  public async hasDomainEventsWithCausationId ({ causationId }: {
    causationId: string;
  }): Promise<boolean> {
    return await this.queryClient.hasDomainEventsWithCausationId({ causationId });
  }

  public async getDomainEventsByCorrelationId ({ correlationId }: {
    correlationId: string;
  }): Promise<Readable> {
    return await this.queryClient.getDomainEventsByCorrelationId({ correlationId });
  }

  public async getReplay ({ fromTimestamp = 0 }: {
    fromTimestamp?: number;
  }): Promise<Readable> {
    return await this.queryClient.getReplay({ fromTimestamp });
  }

  public async getReplayForAggregate ({
    aggregateId,
    fromRevision = 1,
    toRevision = (2 ** 31) - 1
  }: {
    aggregateId: string;
    fromRevision?: number;
    toRevision?: number;
  }): Promise<Readable> {
    return await this.queryClient.getReplayForAggregate({
      aggregateId,
      fromRevision,
      toRevision
    });
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    return await this.queryClient.getSnapshot({ aggregateIdentifier });
  }

  public async storeDomainEvents <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }): Promise<void> {
    await this.writeClient.storeDomainEvents({ domainEvents });
  }

  public async storeSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    await this.writeClient.storeSnapshot({ snapshot });
  }

  public async getAggregateIdentifiers (): Promise<Readable> {
    return await this.queryClient.getAggregateIdentifiers();
  }

  public async getAggregateIdentifiersByName ({ contextName, aggregateName }: {
    contextName: string;
    aggregateName: string;
  }): Promise<Readable> {
    return await this.queryClient.getAggregateIdentifiersByName({
      contextName,
      aggregateName
    });
  }

  // eslint-disable-next-line class-methods-use-this
  public async setup (): Promise<void> {
    // There is nothing to do here.
  }

  // eslint-disable-next-line class-methods-use-this
  public async destroy (): Promise<void> {
    // There is nothing to do here.
  }
}

export { AeonstoreDomainEventStore };
