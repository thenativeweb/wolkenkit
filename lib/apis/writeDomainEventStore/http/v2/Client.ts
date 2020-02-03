import axios from 'axios';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { Snapshot } from '../../../../stores/domainEventStore/Snapshot';

const logger = flaschenpost.getLogger();

class Client extends HttpClient {
  public constructor ({ protocol = 'http', hostName, port, path = '/' }: {
    protocol?: string;
    hostName: string;
    port: number;
    path?: string;
  }) {
    super({ protocol, hostName, port, path });
  }

  public async storeDomainEvents (domainEvents: DomainEvent<DomainEventData>[]): Promise<DomainEvent<DomainEventData>[]> {
    const { status, data } = await axios({
      method: 'post',
      url: `${this.url}/store-domain-events`,
      data: domainEvents,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return data.map((domainEvent: any): DomainEvent<DomainEventData> => new DomainEvent(domainEvent));
    }

    switch (data.code) {
      case 'EREQUESTMALFORMED': {
        throw new errors.RequestMalformed(data.message);
      }
      case 'EDOMAINEVENTMALFORMED': {
        throw new errors.DomainEventMalformed(data.message);
      }
      default: {
        logger.error('Unknown error occured.', { ex: data, status });
        throw new errors.UnknownError();
      }
    }
  }

  public async storeSnapshot (snapshot: Snapshot<{}>): Promise<void> {
    const { status, data } = await axios({
      method: 'post',
      url: `${this.url}/store-snapshot`,
      data: snapshot,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      case 'EREQUESTMALFORMED': {
        throw new errors.RequestMalformed(data.message);
      }
      case 'ESNAPSHOTMALFORMED': {
        throw new errors.SnapshotMalformed(data.message);
      }
      default: {
        logger.error('Unknown error occured.', { ex: data, status });
        throw new errors.UnknownError();
      }
    }
  }
}

export {
  Client
};
