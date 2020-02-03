import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import axios from 'axios';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { errors } from '../../../../common/errors';
import { FilterHeartbeatsFromJsonStreamTransform } from '../../../../common/utils/http/FilterHeartbeatsFromJsonStreamTransform';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { Snapshot } from '../../../../stores/domainEventStore/Snapshot';
import { PassThrough, pipeline } from 'stream';

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

  public async getReplay ({ fromRevisionGlobal = 1, toRevisionGlobal = (2 ** 31) - 1, observe = false }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
    observe?: boolean;
  }): Promise<PassThrough> {
    if (fromRevisionGlobal < 1) {
      throw new Error(`Parameter 'fromRevisionGlobal' must be at least 1.`);
    }
    if (toRevisionGlobal < 1) {
      throw new Error(`Parameter 'toRevisionGlobal' must be at least 1.`);
    }
    if (toRevisionGlobal < fromRevisionGlobal) {
      throw new Error(`Parameter 'toRevisionGlobal' must be greater or equal to 'fromRevisionGlobal'.`);
    }

    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/replay?fromRevisionGlobal=${fromRevisionGlobal}&toRevisionGlobal=${toRevisionGlobal}&observe=${observe}`,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('Unknown error occured.', { error: data, status });

      throw new errors.UnknownError();
    }

    const passThrough = new PassThrough({ objectMode: true });
    const heartbeatFilter = new FilterHeartbeatsFromJsonStreamTransform();

    pipeline(
      data,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          throw err;
        }
      }
    );

    return passThrough;
  }

  public async getReplayForAggregate ({ aggregateId, fromRevision = 1, toRevision = (2 ** 31) - 1, observe = false }: {
    aggregateId: string;
    fromRevision?: number;
    toRevision?: number;
    observe?: boolean;
  }): Promise<PassThrough> {
    if (fromRevision < 1) {
      throw new Error(`Parameter 'fromRevision' must be at least 1.`);
    }
    if (toRevision < 1) {
      throw new Error(`Parameter 'toRevision' must be at least 1.`);
    }
    if (toRevision < fromRevision) {
      throw new Error(`Parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
    }

    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/replay/${aggregateId}/?fromRevision=${fromRevision}&toRevision=${toRevision}&observe=${observe}`,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('Unknown error occured.', { error: data, status });

      throw new errors.UnknownError();
    }

    const passThrough = new PassThrough({ objectMode: true });
    const heartbeatFilter = new FilterHeartbeatsFromJsonStreamTransform();

    return pipeline(
      data,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          throw err;
        }
      }
    );
  }

  public async getLastDomainEvent ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<DomainEventData> | undefined> {
    const { data, status } = await axios({
      method: 'get',
      url: `${this.url}/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return new DomainEvent(data);
    }

    if (status === 404) {
      return undefined;
    }

    switch (data.code) {
      case 'EAGGREGATEIDENTIFIERMALFORMED': {
        throw new errors.AggregateIdentifierMalformed(data.message);
      }
      default: {
        logger.error('Unknown error occured.', { ex: data, status });

        throw new errors.UnknownError();
      }
    }
  }

  public async getSnapshot ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<{}> | undefined> {
    const { data, status } = await axios({
      method: 'get',
      url: `${this.url}/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return data;
    }

    if (status === 404) {
      return undefined;
    }

    switch (data.code) {
      case 'EAGGREGATEIDENTIFIERMALFORMED': {
        throw new errors.AggregateIdentifierMalformed(data.message);
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
