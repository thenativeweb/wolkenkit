import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import axios from 'axios';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { FilterHeartBeatsFromJsonStreamTransform } from 'lib/common/utils/http/FilterHeartBeatsFromJsonStreamTransform';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { PassThrough, pipeline } from 'stream';

class AeonstoreDomainEventStore implements DomainEventStore {
  protected aeonstoreBaseUrl: string;

  protected constructor ({ aeonstoreBaseUrl }: { aeonstoreBaseUrl: string }) {
    this.aeonstoreBaseUrl = aeonstoreBaseUrl;
  }

  public static async create ({ aeonstoreBaseUrl }: {
    aeonstoreBaseUrl: string;
  }): Promise<AeonstoreDomainEventStore> {
    return new AeonstoreDomainEventStore({ aeonstoreBaseUrl });
  }

  /* eslint-disable class-methods-use-this */
  public async destroy (): Promise<void> {
    // There is nothing to do here.
  }
  /* eslint-disable class-methods-use-this */

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const { status, data } = await axios({
      method: 'get',
      url: `${this.aeonstoreBaseUrl}/query/v2/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`,
      validateStatus: (statusToValidate): boolean => statusToValidate === 200 || statusToValidate === 404
    });

    if (status === 404) {
      return undefined;
    }

    return new DomainEvent(data);
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
    const queryString = `?fromRevision=${fromRevision}&toRevision=${toRevision}`;

    const { data } = await axios({
      method: 'get',
      url: `${this.aeonstoreBaseUrl}/query/v2/replay/${aggregateId}${queryString}`,
      responseType: 'stream'
    });

    const passThrough = new PassThrough({ objectMode: true });
    const heartbeatFilter = new FilterHeartBeatsFromJsonStreamTransform();

    return pipeline(data, heartbeatFilter, passThrough);
  }

  public async storeDomainEvents <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }): Promise<DomainEvent<TDomainEventData>[]> {
    try {
      const { data } = await axios({
        method: 'post',
        url: `${this.aeonstoreBaseUrl}/write/v2/store-domain-events`,
        data: domainEvents
      });

      const parsedDomainEvents = (data as any[]).map(
        (domainEvent): DomainEvent<TDomainEventData> => new DomainEvent(domainEvent)
      );

      return parsedDomainEvents;
    } catch (ex) {
      throw new Error(ex.response?.data ?? ex.message);
    }
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    const { status, data } = await axios({
      method: 'get',
      url: `${this.aeonstoreBaseUrl}/query/v2/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`,
      validateStatus: (statusToValidate): boolean => statusToValidate === 200 || statusToValidate === 404
    });

    if (status === 404) {
      return undefined;
    }

    return data;
  }

  public async storeSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    await axios({
      method: 'post',
      url: `${this.aeonstoreBaseUrl}/write/v2/store-snapshot`,
      data: snapshot
    });
  }

  public async getReplay ({
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  }): Promise<PassThrough> {
    const queryString = `?fromRevisionGlobal=${fromRevisionGlobal}&toRevisionGlobal=${toRevisionGlobal}`;

    const { data } = await axios({
      method: 'get',
      url: `${this.aeonstoreBaseUrl}/query/v2/replay${queryString}`,
      responseType: 'stream'
    });

    const passThrough = new PassThrough({ objectMode: true });
    const heartbeatFilter = new FilterHeartBeatsFromJsonStreamTransform();

    return pipeline(data, heartbeatFilter, passThrough);
  }
}

export { AeonstoreDomainEventStore };
