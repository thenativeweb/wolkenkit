import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import axios from 'axios';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { errors } from '../../../../common/errors';
import { FilterHeartbeatsFromJsonStreamTransform } from '../../../../common/utils/http/FilterHeartbeatsFromJsonStreamTransform';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { Snapshot } from '../../../../stores/domainEventStore/Snapshot';
import { State } from '../../../../common/elements/State';
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

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
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
        logger.error('An unknown error occured.', { ex: data, status });

        throw new errors.UnknownError(data.message);
      }
    }
  }

  public async getDomainEventsByCausationId <TDomainEventData extends DomainEventData> ({ causationId }: {
    causationId: string;
  }): Promise<PassThrough> {
    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/domain-events-by-causation-id?causation-id=${causationId}`,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { ex: data, status });

      throw new errors.UnknownError(data.message);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const heartbeatFilter = new FilterHeartbeatsFromJsonStreamTransform();

    return pipeline(
      data,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error('An error occured during stream piping.', { err });
        }
      }
    );
  }

  public async hasDomainEventsWithCausationId <TDomainEventData extends DomainEventData> ({ causationId }: {
    causationId: string;
  }): Promise<boolean> {
    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/has-domain-events-with-causation-id?causation-id=${causationId}`,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { error: data, status });

      throw new errors.UnknownError(data.message);
    }

    return data.hasDomainEventsWithCausationId;
  }

  public async getDomainEventsByCorrelationId <TDomainEventData extends DomainEventData> ({ correlationId }: {
    correlationId: string;
  }): Promise<PassThrough> {
    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/domain-events-by-correlation-id?correlation-id=${correlationId}`,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { error: data, status });

      throw new errors.UnknownError(data.message);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const heartbeatFilter = new FilterHeartbeatsFromJsonStreamTransform();

    return pipeline(
      data,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error('An error occured during stream piping.', { err });
        }
      }
    );
  }

  public async getReplay ({ fromRevisionGlobal = 1, toRevisionGlobal = (2 ** 31) - 1 }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  }): Promise<PassThrough> {
    if (fromRevisionGlobal < 1) {
      throw new errors.ParameterInvalid(`Parameter 'fromRevisionGlobal' must be at least 1.`);
    }
    if (toRevisionGlobal < 1) {
      throw new errors.ParameterInvalid(`Parameter 'toRevisionGlobal' must be at least 1.`);
    }
    if (toRevisionGlobal < fromRevisionGlobal) {
      throw new errors.ParameterInvalid(`Parameter 'toRevisionGlobal' must be greater or equal to 'fromRevisionGlobal'.`);
    }

    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/replay?fromRevisionGlobal=${fromRevisionGlobal}&toRevisionGlobal=${toRevisionGlobal}`,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { error: data, status });

      throw new errors.UnknownError(data.message);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const heartbeatFilter = new FilterHeartbeatsFromJsonStreamTransform();

    return pipeline(
      data,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error('An error occured during stream piping.', { err });
        }
      }
    );
  }

  public async getReplayForAggregate ({ aggregateId, fromRevision = 1, toRevision = (2 ** 31) - 1 }: {
    aggregateId: string;
    fromRevision?: number;
    toRevision?: number;
  }): Promise<PassThrough> {
    if (fromRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'fromRevision' must be at least 1.`);
    }
    if (toRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'toRevision' must be at least 1.`);
    }
    if (toRevision < fromRevision) {
      throw new errors.ParameterInvalid(`Parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
    }

    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/replay/${aggregateId}/?fromRevision=${fromRevision}&toRevision=${toRevision}`,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { error: data, status });

      throw new errors.UnknownError(data.message);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const heartbeatFilter = new FilterHeartbeatsFromJsonStreamTransform();

    return pipeline(
      data,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error('An error occured during stream piping.', { err });
        }
      }
    );
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
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
        logger.error('An unknown error occured.', { ex: data, status });

        throw new errors.UnknownError(data.message);
      }
    }
  }
}

export {
  Client
};
