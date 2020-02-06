import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { PassThrough } from 'stream';
import { Client as QueryClient } from '../../../apis/queryDomainEventStore/http/v2/Client';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { Client as WriteClient } from '../../../apis/writeDomainEventStore/http/v2/Client';

class AeonstoreDomainEventStore implements DomainEventStore {
  protected queryClient: QueryClient;

  protected writeClient: WriteClient;

  protected constructor ({ protocol = 'http', hostName, port, path = '/' }: {
    protocol?: string;
    hostName: string;
    port: number;
    path?: string;
  }) {
    const trimmedPath = path.endsWith('/') ? path.slice(0, -1) : path;

    this.queryClient = new QueryClient({
      protocol, hostName, port, path: `${trimmedPath}/query/v2`
    });
    this.writeClient = new WriteClient({
      protocol, hostName, port, path: `${trimmedPath}/write/v2`
    });
  }

  public static async create ({ protocol = 'http', hostName, port, path = '/' }: {
    protocol?: string;
    hostName: string;
    port: number;
    path?: string;
  }): Promise<AeonstoreDomainEventStore> {
    return new AeonstoreDomainEventStore({ protocol, hostName, port, path });
  }

  /* eslint-disable class-methods-use-this */
  public async destroy (): Promise<void> {
    // There is nothing to do here.
  }
  /* eslint-disable class-methods-use-this */

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    return await this.queryClient.getLastDomainEvent({ aggregateIdentifier });
  }

  public async getReplayForAggregate ({
    aggregateId,
    fromRevision = 1,
    toRevision = (2 ** 31) - 1
  }: {
    aggregateId: string;
    fromRevision?: number;
    toRevision?: number;
  }): Promise<PassThrough> {
    return await this.queryClient.getReplayForAggregate({
      aggregateId,
      fromRevision,
      toRevision
    });
  }

  public async storeDomainEvents <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }): Promise<DomainEvent<TDomainEventData>[]> {
    return await this.writeClient.storeDomainEvents({ domainEvents });
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    return await this.queryClient.getSnapshot({ aggregateIdentifier });
  }

  public async storeSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    await this.writeClient.storeSnapshot({ snapshot });
  }

  public async getReplay ({
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  }): Promise<PassThrough> {
    return await this.queryClient.getReplay({ fromRevisionGlobal, toRevisionGlobal });
  }
}

export { AeonstoreDomainEventStore };
